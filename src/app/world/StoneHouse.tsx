'use client'

import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// ─── House Configuration ────────────────────────────────
const H = {
  w: 5.0,
  d: 6.0,
  wallH: 2.8,
  wallT: 0.6,
  doorW: 1.0,
  doorH: 2.2,
  doorOff: -0.2,
  winW: 0.4,
  winH: 0.45,
  winY: 1.8,
  roofPeak: 2.4,
  roofOver: 0.6,
  roofThick: 0.35,
  stone: 0x2a2a2e,
  stoneDark: 0x1e1e22,
  moss: 0x1a2210,
  roof: 0x131c0b,
  floor: 0x100c08,
  fireLight: 0xff8833,
  framewood: 0x1a1410,
}

export const HOUSE_POS: [number, number, number] = [0, 0, -35]
export const HOUSE_EXCL = 5

// ─── Utilities ──────────────────────────────────────────
function rng32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function mergeG(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (!geos.length) return new THREE.BufferGeometry()
  let totalV = 0
  const idx: number[] = []
  for (const g of geos) totalV += g.attributes.position.count
  const pos = new Float32Array(totalV * 3)
  const norm = new Float32Array(totalV * 3)
  let off = 0
  for (const g of geos) {
    const pA = g.attributes.position.array as Float32Array
    const nA = (g.attributes.normal?.array ?? new Float32Array(pA.length)) as Float32Array
    pos.set(pA, off * 3); norm.set(nA, off * 3)
    if (g.index) { const iA = g.index.array; for (let i = 0; i < iA.length; i++) idx.push(iA[i] + off) }
    off += g.attributes.position.count; g.dispose()
  }
  const m = new THREE.BufferGeometry()
  m.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  m.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3))
  if (idx.length) m.setIndex(idx)
  return m
}

// ─── Stone Wall Builder ─────────────────────────────────
// Produces geometry in XY plane: width along X, height along Y, thickness along Z centered at 0
function buildStoneWall(
  width: number, height: number, thick: number,
  holes: { cx: number; cy: number; w: number; h: number }[],
  seed: number, weathering: number
): THREE.BufferGeometry {
  const rng = rng32(seed)
  const parts: THREE.BufferGeometry[] = []
  const rows = 7
  const rowH = height / rows

  for (let r = 0; r < rows; r++) {
    const y = r * rowH
    const rowCy = y + rowH / 2
    let x = -width / 2
    while (x < width / 2 - 0.08) {
      const sw = 0.35 + rng() * 0.65
      const x0 = x, x1 = Math.min(x + sw, width / 2)
      const w = x1 - x0
      x = x1 + 0.012 + rng() * 0.018
      const scx = (x0 + x1) / 2

      const inHole = holes.some(h =>
        scx + w / 2 > h.cx - h.w / 2 - 0.02 &&
        scx - w / 2 < h.cx + h.w / 2 + 0.02 &&
        rowCy + rowH / 2 > h.cy - h.h / 2 - 0.02 &&
        rowCy - rowH / 2 < h.cy + h.h / 2 + 0.02
      )
      if (inHole) continue

      const topness = r / (rows - 1)
      if (topness > 0.92 && rng() < weathering * 0.3) continue
      if (topness > 0.8 && rng() < weathering * 0.1) continue

      const sh = rowH * (0.88 + rng() * 0.1) - 0.008
      const st = thick * (0.88 + rng() * 0.12)
      const g = new THREE.BoxGeometry(w - 0.01, sh, st)
      g.translate(
        scx + (rng() - 0.5) * 0.025,
        rowCy + (rng() - 0.5) * 0.01,
        (rng() - 0.5) * 0.015
      )
      if (topness > 0.5) {
        g.applyMatrix4(new THREE.Matrix4().makeRotationZ((rng() - 0.5) * 0.025 * topness))
      }
      parts.push(g)
    }
  }
  return parts.length ? mergeG(parts) : new THREE.BufferGeometry()
}

// ─── Gable Builder (stepped triangle above main wall) ───
function buildGable(
  width: number, peak: number, thick: number,
  seed: number, weathering: number
): THREE.BufferGeometry {
  const rng = rng32(seed)
  const parts: THREE.BufferGeometry[] = []
  const rows = 4
  const rowH = peak / rows
  for (let r = 0; r < rows; r++) {
    const t = (r + 0.5) / rows
    const rowW = width * (1 - t * 0.95)
    let x = -rowW / 2
    while (x < rowW / 2 - 0.1) {
      const sw = 0.3 + rng() * 0.5
      const x0 = x, x1 = Math.min(x + sw, rowW / 2)
      x = x1 + 0.015 + rng() * 0.015
      if (rng() < weathering * 0.15) continue
      const w = x1 - x0
      const g = new THREE.BoxGeometry(w - 0.01, rowH * 0.88, thick * 0.92)
      g.translate((x0 + x1) / 2 + (rng() - 0.5) * 0.02, r * rowH + rowH / 2, 0)
      parts.push(g)
    }
  }
  return parts.length ? mergeG(parts) : new THREE.BufferGeometry()
}

// ─── Fallen Stones ──────────────────────────────────────
function buildFallenStones(): THREE.BufferGeometry {
  const rng = rng32(500)
  const parts: THREE.BufferGeometry[] = []
  for (let i = 0; i < 14; i++) {
    const w = 0.15 + rng() * 0.35, h = 0.08 + rng() * 0.15, d = 0.12 + rng() * 0.25
    const g = new THREE.BoxGeometry(w, h, d)
    const side = Math.floor(rng() * 4)
    let sx: number, sz: number
    if (side === 0) { sx = (rng() - 0.5) * H.w * 1.2; sz = H.d / 2 + 0.3 + rng() * 2 }
    else if (side === 1) { sx = (rng() - 0.5) * H.w * 1.2; sz = -H.d / 2 - 0.3 - rng() * 2 }
    else if (side === 2) { sx = -H.w / 2 - 0.3 - rng() * 2; sz = (rng() - 0.5) * H.d * 1.2 }
    else { sx = H.w / 2 + 0.3 + rng() * 2; sz = (rng() - 0.5) * H.d * 1.2 }
    g.translate(sx, h / 2, sz)
    g.applyMatrix4(new THREE.Matrix4().makeRotationY(rng() * 6.28))
    parts.push(g)
  }
  return mergeG(parts)
}

// ─── Fireplace Geometry ─────────────────────────────────
function buildFireplace(): THREE.BufferGeometry {
  const rng = rng32(600)
  const parts: THREE.BufferGeometry[] = []
  const bz = -H.d / 2 + H.wallT + 0.12

  // Hearth back
  const back = new THREE.BoxGeometry(1.3, 1.5, 0.22)
  back.translate(0, 0.75, bz); parts.push(back)
  // Hearth floor
  const floor = new THREE.BoxGeometry(1.1, 0.12, 0.65)
  floor.translate(0, 0.06, bz + 0.2); parts.push(floor)
  // Side stones
  for (const s of [-1, 1]) {
    const g = new THREE.BoxGeometry(0.2, 1.1, 0.55)
    g.translate(s * 0.55, 0.55, bz + 0.16); parts.push(g)
  }
  // Mantle stone
  const mantle = new THREE.BoxGeometry(1.5, 0.18, 0.55)
  mantle.translate(0, 1.15, bz + 0.16); parts.push(mantle)
  // Chimney breast
  const chimney = new THREE.BoxGeometry(0.9, 2.5, 0.45)
  chimney.translate(0, H.wallH - 0.2, -H.d / 2 + H.wallT / 2); parts.push(chimney)
  // Random hearth stones for texture
  for (let i = 0; i < 6; i++) {
    const g = new THREE.BoxGeometry(0.12 + rng() * 0.1, 0.08 + rng() * 0.06, 0.1 + rng() * 0.08)
    g.translate((rng() - 0.5) * 0.8, 0.12 + rng() * 0.08, bz + 0.3 + rng() * 0.15)
    parts.push(g)
  }
  return mergeG(parts)
}

// ─── Roof Geometry ──────────────────────────────────────
function buildRoof(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = []
  const halfW = H.w / 2 + H.roofOver
  const depth = H.d + H.roofOver * 2

  // Left slope
  const slopeLen = Math.sqrt(halfW * halfW + H.roofPeak * H.roofPeak)
  const angle = Math.atan2(H.roofPeak, halfW)
  const left = new THREE.BoxGeometry(slopeLen, H.roofThick, depth)
  left.translate(slopeLen / 2, 0, 0)
  left.applyMatrix4(new THREE.Matrix4().makeRotationZ(angle))
  left.translate(-halfW, H.wallH, 0)
  parts.push(left)

  // Right slope (slightly sagged from 100 years of Atlantic wind)
  const rightPeakSag = H.roofPeak * 0.93
  const slopeLenR = Math.sqrt(halfW * halfW + rightPeakSag * rightPeakSag)
  const angleR = Math.atan2(rightPeakSag, halfW)
  const right = new THREE.BoxGeometry(slopeLenR, H.roofThick, depth)
  right.translate(-slopeLenR / 2, 0, 0)
  right.applyMatrix4(new THREE.Matrix4().makeRotationZ(-angleR))
  right.translate(halfW, H.wallH, 0)
  parts.push(right)

  return mergeG(parts)
}

// ─── Retro 80's TV (CRT with signal noise & antenna) ────
const TV_SHOW = 5.0
const TV_STATIC = 0.6
const TV_CYCLE = TV_SHOW + TV_STATIC

function RetroTV({ textures, position, rotation }: {
  textures: THREE.Texture[]
  position: [number, number, number]
  rotation: [number, number, number]
}) {
  const screenRef = useRef<THREE.MeshBasicMaterial>(null!)
  const tvLightRef = useRef<THREE.PointLight>(null!)
  const state = useRef({ idx: 0, timer: 0 })

  const { ctx, screenTex, noiseCtx, noiseImg } = useMemo(() => {
    if (typeof document === 'undefined') return { ctx: null, screenTex: null, noiseCtx: null, noiseImg: null }
    const c = document.createElement('canvas')
    c.width = 320; c.height = 240
    const cx = c.getContext('2d')!
    cx.imageSmoothingEnabled = false
    const t = new THREE.CanvasTexture(c)
    t.minFilter = THREE.LinearFilter
    t.magFilter = THREE.LinearFilter
    const nc = document.createElement('canvas')
    nc.width = 80; nc.height = 60
    const ncx = nc.getContext('2d')!
    const ni = ncx.createImageData(80, 60)
    return { ctx: cx, screenTex: t, noiseCtx: ncx, noiseImg: ni }
  }, [])

  useFrame((_, delta) => {
    if (!ctx || !screenTex || !noiseCtx || !noiseImg || !screenRef.current) return
    const s = state.current
    s.timer += delta
    if (s.timer >= TV_CYCLE) {
      s.timer -= TV_CYCLE
      if (textures.length > 0) s.idx = (s.idx + 1) % textures.length
    }
    const isStatic = s.timer > TV_SHOW
    const W = 320, HH = 240

    const d = noiseImg.data
    for (let i = 0; i < d.length; i += 4) {
      const v = Math.random() * 180
      d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255
    }
    noiseCtx.putImageData(noiseImg, 0, 0)

    ctx.fillStyle = '#080808'
    ctx.fillRect(0, 0, W, HH)

    if (!isStatic && textures.length > 0 && textures[s.idx]?.image) {
      ctx.drawImage(textures[s.idx].image as CanvasImageSource, 0, 0, W, HH)
      ctx.globalAlpha = 0.15
      ctx.drawImage(noiseCtx.canvas, 0, 0, W, HH)
      ctx.globalAlpha = 1
      const scanCount = Math.random() < 0.3 ? 2 + Math.floor(Math.random() * 5) : 0
      for (let si = 0; si < scanCount; si++) {
        const sy = Math.random() * HH
        const sh = 1 + Math.random() * 3
        const bright = 0.03 + Math.random() * 0.08
        ctx.fillStyle = `rgba(255,255,255,${bright})`
        ctx.fillRect(0, sy, W, sh)
      }
      if (Math.random() < 0.06) {
        const barY = Math.random() * HH
        const barH = 4 + Math.random() * 14
        ctx.fillStyle = 'rgba(255,255,255,0.1)'
        ctx.fillRect(0, barY, W, barH)
      }
      if (Math.random() < 0.04) {
        const rollY = Math.random() * HH
        ctx.fillStyle = 'rgba(0,0,0,0.3)'
        ctx.fillRect(0, rollY, W, 2 + Math.random() * 8)
      }
    } else {
      ctx.drawImage(noiseCtx.canvas, 0, 0, W, HH)
    }

    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    for (let y = 0; y < HH; y += 3) ctx.fillRect(0, y, W, 1)

    const grad = ctx.createRadialGradient(W / 2, HH / 2, W * 0.25, W / 2, HH / 2, W * 0.7)
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(1, 'rgba(0,0,0,0.5)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, HH)

    screenTex.needsUpdate = true
    if (tvLightRef.current) {
      tvLightRef.current.intensity = isStatic ? 1.5 + Math.random() * 0.5 : 1.2 + Math.sin(s.timer * 3) * 0.15
      tvLightRef.current.color.setHex(isStatic ? 0x889999 : 0x6688aa)
    }
  })

  const tvW = 1.5, tvH = 1.25, tvD = 0.85
  const scrW = 1.05, scrH = 0.78
  const legH = 0.4

  return (
    <group position={position} rotation={rotation}>
      {/* Tapered wooden legs */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={`tvl${i}`} position={[sx * tvW * 0.38, -tvH / 2 - legH / 2, sz * tvD * 0.35]}>
          <boxGeometry args={[0.04, legH, 0.04]} />
          <meshStandardMaterial color={0x2a1a0a} roughness={0.8} />
        </mesh>
      ))}

      {/* Wood casing */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[tvW, tvH, tvD]} />
        <meshStandardMaterial color={0x3a2510} roughness={0.75} />
      </mesh>

      {/* Screen bezel */}
      <mesh position={[-0.04, 0.02, tvD / 2 - 0.01]}>
        <boxGeometry args={[scrW + 0.06, scrH + 0.06, 0.02]} />
        <meshStandardMaterial color={0x1a1a1a} roughness={0.6} />
      </mesh>

      {/* CRT screen */}
      <mesh position={[-0.04, 0.02, tvD / 2 + 0.002]}>
        <planeGeometry args={[scrW, scrH]} />
        <meshBasicMaterial ref={screenRef} map={screenTex} />
      </mesh>

      {/* Glass reflection */}
      <mesh position={[-0.04, 0.02, tvD / 2 + 0.004]}>
        <planeGeometry args={[scrW, scrH]} />
        <meshBasicMaterial color={0xffffff} transparent opacity={0.03} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Control panel */}
      <mesh position={[tvW / 2 - 0.09, 0, tvD / 2 - 0.01]}>
        <boxGeometry args={[0.12, tvH * 0.6, 0.02]} />
        <meshStandardMaterial color={0x1a1a1a} roughness={0.5} />
      </mesh>

      {/* Channel / volume knobs */}
      {[0.1, -0.06, -0.2].map((y, i) => (
        <mesh key={`knob${i}`} position={[tvW / 2 - 0.09, y, tvD / 2 + 0.006]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.014, 8]} />
          <meshStandardMaterial color={i === 0 ? 0x884422 : 0x222222} roughness={0.4} metalness={0.3} />
        </mesh>
      ))}

      {/* Speaker grille */}
      <mesh position={[tvW / 2 - 0.09, -scrH / 2, tvD / 2 - 0.005]}>
        <boxGeometry args={[0.1, 0.12, 0.01]} />
        <meshStandardMaterial color={0x2a2015} roughness={0.9} />
      </mesh>

      {/* Antenna base */}
      <mesh position={[0, tvH / 2 + 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.04, 0.06, 8]} />
        <meshStandardMaterial color={0x333333} roughness={0.5} metalness={0.6} />
      </mesh>

      {/* Left rabbit ear */}
      <group position={[0, tvH / 2 + 0.06, 0]}>
        <mesh position={[-0.18, 0.28, 0]} rotation={[0, 0, 0.35]}>
          <cylinderGeometry args={[0.008, 0.005, 0.6, 6]} />
          <meshStandardMaterial color={0x888888} roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[-0.35, 0.53, 0]}>
          <sphereGeometry args={[0.015, 6, 6]} />
          <meshStandardMaterial color={0x999999} metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Right rabbit ear */}
      <group position={[0, tvH / 2 + 0.06, 0]}>
        <mesh position={[0.18, 0.28, 0]} rotation={[0, 0, -0.35]}>
          <cylinderGeometry args={[0.008, 0.005, 0.6, 6]} />
          <meshStandardMaterial color={0x888888} roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[0.35, 0.53, 0]}>
          <sphereGeometry args={[0.015, 6, 6]} />
          <meshStandardMaterial color={0x999999} metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Screen glow cast into room */}
      <pointLight
        ref={tvLightRef}
        position={[0, 0, tvD / 2 + 0.5]}
        color={0x6688aa}
        intensity={1.2}
        distance={5}
        decay={1.8}
      />
    </group>
  )
}


// ─── Sleeping Cat ───────────────────────────────────────
function SleepingCat({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number] }) {
  const furDark = 0x151210
  const furMid = 0x221e1a
  const furLight = 0x2e2822
  const pawPad = 0x3a2020
  const nose = 0x352222
  const earInner = 0x3a2828
  const breathRef = useRef<THREE.Group>(null!)

  useFrame(({ clock }) => {
    if (!breathRef.current) return
    const t = clock.elapsedTime
    breathRef.current.scale.y = 1 + Math.sin(t * 1.2) * 0.02
  })

  return (
    <group position={position} rotation={rotation}>
      <group ref={breathRef}>
        {/* Main body — elongated loaf shape */}
        <mesh castShadow scale={[1.3, 0.65, 1]}>
          <sphereGeometry args={[0.15, 12, 10]} />
          <meshStandardMaterial color={furDark} roughness={0.97} />
        </mesh>
        {/* Back haunch — slightly raised */}
        <mesh castShadow position={[-0.08, 0.01, 0]} scale={[1, 0.7, 1.1]}>
          <sphereGeometry args={[0.13, 10, 8]} />
          <meshStandardMaterial color={furMid} roughness={0.97} />
        </mesh>
        {/* Shoulder area */}
        <mesh castShadow position={[0.1, 0.01, 0]} scale={[0.9, 0.65, 0.95]}>
          <sphereGeometry args={[0.12, 10, 8]} />
          <meshStandardMaterial color={furMid} roughness={0.97} />
        </mesh>

        {/* Head — resting on front paws, slightly turned */}
        <group position={[0.2, 0.02, 0.04]} rotation={[0, 0.25, 0.06]}>
          <mesh castShadow scale={[1.1, 0.85, 1]}>
            <sphereGeometry args={[0.075, 10, 8]} />
            <meshStandardMaterial color={furDark} roughness={0.97} />
          </mesh>
          {/* Muzzle */}
          <mesh position={[0.055, -0.015, 0]} scale={[0.8, 0.55, 0.7]}>
            <sphereGeometry args={[0.04, 8, 6]} />
            <meshStandardMaterial color={furLight} roughness={0.97} />
          </mesh>
          {/* Nose */}
          <mesh position={[0.085, -0.005, 0]}>
            <sphereGeometry args={[0.01, 6, 6]} />
            <meshStandardMaterial color={nose} roughness={0.85} />
          </mesh>
          {/* Closed eyes — tiny dark slits */}
          {[-1, 1].map(s => (
            <mesh key={`eye${s}`} position={[0.045, 0.015, s * 0.032]} rotation={[0, 0, s * 0.1]} scale={[1.5, 0.3, 1]}>
              <sphereGeometry args={[0.008, 6, 4]} />
              <meshStandardMaterial color={0x080606} roughness={0.9} />
            </mesh>
          ))}
          {/* Ears */}
          {[-1, 1].map(s => (
            <group key={`ear${s}`} position={[0.01, 0.065, s * 0.04]} rotation={[s * 0.2, 0, s * 0.35]}>
              <mesh castShadow>
                <coneGeometry args={[0.025, 0.05, 4]} />
                <meshStandardMaterial color={furDark} roughness={0.97} />
              </mesh>
              <mesh position={[0.005, -0.005, 0]} scale={[0.6, 0.7, 0.6]}>
                <coneGeometry args={[0.025, 0.05, 4]} />
                <meshStandardMaterial color={earInner} roughness={0.95} />
              </mesh>
            </group>
          ))}
          {/* Whiskers — thin lines */}
          {[-1, 1].map(s => (
            [0.15, 0, -0.15].map((angle, wi) => (
              <mesh key={`w${s}${wi}`}
                position={[0.07, -0.01, s * 0.025]}
                rotation={[s * angle, 0, -0.1 + wi * 0.05]}
                scale={[0.3, 1, 0.3]}
              >
                <cylinderGeometry args={[0.001, 0.001, 0.08, 3]} />
                <meshStandardMaterial color={0x666058} roughness={0.9} />
              </mesh>
            ))
          ))}
        </group>

        {/* Front paws — tucked under chin */}
        {[-1, 1].map(s => (
          <mesh key={`fp${s}`} position={[0.18, -0.06, s * 0.05]} scale={[1.4, 0.6, 1]}>
            <sphereGeometry args={[0.025, 7, 6]} />
            <meshStandardMaterial color={furLight} roughness={0.97} />
          </mesh>
        ))}
        {/* Paw pads visible on one front paw */}
        <mesh position={[0.2, -0.065, 0.07]} scale={[0.8, 0.4, 1]}>
          <sphereGeometry args={[0.015, 5, 4]} />
          <meshStandardMaterial color={pawPad} roughness={0.9} />
        </mesh>

        {/* Back legs — tucked under, barely visible */}
        {[-1, 1].map(s => (
          <mesh key={`bl${s}`} position={[-0.06, -0.06, s * 0.1]} scale={[1.1, 0.55, 0.9]}>
            <sphereGeometry args={[0.035, 7, 6]} />
            <meshStandardMaterial color={furMid} roughness={0.97} />
          </mesh>
        ))}

        {/* Tail — wraps around to the front in a smooth curve */}
        {Array.from({ length: 12 }, (_, i) => {
          const t = i / 11
          const angle = t * Math.PI * 1.4 - 0.2
          const radius = 0.17 + t * 0.04
          const x = -Math.cos(angle) * radius * 0.8
          const z = Math.sin(angle) * radius - 0.05
          const y = -0.04 + Math.sin(t * Math.PI) * 0.02
          const thickness = 0.02 - t * 0.008
          return (
            <mesh key={`t${i}`} position={[x, y, z]}>
              <sphereGeometry args={[Math.max(thickness, 0.006), 6, 5]} />
              <meshStandardMaterial color={furDark} roughness={0.97} />
            </mesh>
          )
        })}
        {/* Tail tip — slightly lighter */}
        <mesh position={[0.15, -0.03, 0.14]}>
          <sphereGeometry args={[0.012, 5, 4]} />
          <meshStandardMaterial color={furLight} roughness={0.97} />
        </mesh>
      </group>
    </group>
  )
}


// ─── Broken Neon Sign ────────────────────────────────────
const NEON_TEXT = 'Falkvard Tattoo'
const NEON_FLICKER = new Set([3, 5, 12])   // k, a, 2nd t
const NEON_DEAD    = new Set([13, 14])      // oo at end
const SPARK_MAX    = 30
const SPARK_LIFE   = 0.55

function NeonSign() {
  const matRef   = useRef<THREE.MeshBasicMaterial>(null!)
  const glowRef  = useRef<THREE.PointLight>(null!)
  const sparksRef = useRef<THREE.Points>(null!)
  const timers   = useRef(new Float32Array(NEON_TEXT.length))
  const onState  = useRef(new Uint8Array(NEON_TEXT.length).fill(1))
  const prevOn   = useRef(new Uint8Array(NEON_TEXT.length).fill(1))

  const spark = useRef({
    pos:  new Float32Array(SPARK_MAX * 3),
    vel:  new Float32Array(SPARK_MAX * 3),
    life: new Float32Array(SPARK_MAX),
    head: 0,
  })

  const sW = 4.8, sH = 0.96

  const letterX = useRef<number[]>([])

  const { ctx, tex } = useMemo(() => {
    if (typeof document === 'undefined') return { ctx: null, tex: null }
    const c = document.createElement('canvas')
    c.width = 640; c.height = 128
    const cx = c.getContext('2d')!
    const t = new THREE.CanvasTexture(c)
    t.minFilter = THREE.LinearFilter
    t.magFilter = THREE.LinearFilter
    return { ctx: cx, tex: t }
  }, [])

  const sparkGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SPARK_MAX * 3), 3))
    return g
  }, [])

  const spawnSparks = (localX: number, count: number) => {
    const s = spark.current
    for (let n = 0; n < count; n++) {
      const idx = s.head % SPARK_MAX
      const i3 = idx * 3
      s.pos[i3]     = localX + (Math.random() - 0.5) * 0.08
      s.pos[i3 + 1] = (Math.random() - 0.5) * 0.06
      s.pos[i3 + 2] = 0.03
      s.vel[i3]     = (Math.random() - 0.5) * 1.2
      s.vel[i3 + 1] = Math.random() * 0.8 - 0.5
      s.vel[i3 + 2] = Math.random() * 0.6 + 0.2
      s.life[idx]   = SPARK_LIFE + Math.random() * 0.2
      s.head++
    }
  }

  useFrame((_, dt) => {
    if (!ctx || !tex) return
    const CW = 640, CH = 128
    const t = timers.current, on = onState.current, prev = prevOn.current

    prev.set(on)

    const fontSize = 44
    ctx.clearRect(0, 0, CW, CH)
    ctx.font = `italic bold ${fontSize}px Georgia, serif`
    ctx.textBaseline = 'middle'
    const charW = NEON_TEXT.split('').map(ch => ctx.measureText(ch).width)
    const totalCW = charW.reduce((a, b) => a + b, 0)
    let cx = (CW - totalCW) / 2

    const lx = letterX.current
    for (let i = 0; i < NEON_TEXT.length; i++) {
      lx[i] = ((cx + charW[i] / 2) / CW - 0.5) * sW
      cx += charW[i]
    }

    for (let i = 0; i < NEON_TEXT.length; i++) {
      if (NEON_DEAD.has(i)) {
        t[i] += dt
        if (on[i] && t[i] > 0.12 + Math.random() * 0.25) { on[i] = 0; t[i] = 0 }
        if (!on[i] && t[i] > 4 + Math.random() * 8)       { on[i] = 1; t[i] = 0 }
      } else if (NEON_FLICKER.has(i)) {
        t[i] += dt
        if (t[i] > 0.3 + Math.random() * 0.8) {
          on[i] = Math.random() > 0.22 ? 1 : 0
          t[i] = 0
        }
      }
      if (prev[i] !== on[i]) spawnSparks(lx[i], 2 + Math.floor(Math.random() * 3))
    }

    cx = (CW - totalCW) / 2
    for (let i = 0; i < NEON_TEXT.length; i++) {
      const ch = NEON_TEXT[i]
      const cw = charW[i]
      const px = cx + cw / 2
      const py = CH / 2 + 2
      ctx.textAlign = 'center'

      if (on[i]) {
        ctx.save(); ctx.shadowColor = '#ff2848'; ctx.shadowBlur = 28
        ctx.fillStyle = 'rgba(255,40,72,0.25)'; ctx.fillText(ch, px, py); ctx.restore()
        ctx.save(); ctx.shadowColor = '#ff4868'; ctx.shadowBlur = 14
        ctx.fillStyle = 'rgba(255,72,104,0.5)'; ctx.fillText(ch, px, py); ctx.restore()
        ctx.save(); ctx.shadowColor = '#ff7898'; ctx.shadowBlur = 5
        ctx.fillStyle = 'rgba(255,210,220,0.92)'; ctx.fillText(ch, px, py); ctx.restore()
      } else {
        ctx.save(); ctx.fillStyle = 'rgba(55,12,18,0.18)'
        ctx.fillText(ch, px, py); ctx.restore()
      }
      cx += cw
    }
    tex.needsUpdate = true

    if (glowRef.current) {
      const lit = on.reduce((s, v) => s + v, 0)
      glowRef.current.intensity = 0.3 + (lit / NEON_TEXT.length) * 2
    }

    const s = spark.current
    const posArr = sparkGeo.attributes.position as THREE.BufferAttribute
    for (let j = 0; j < SPARK_MAX; j++) {
      if (s.life[j] <= 0) { posArr.setXYZ(j, 0, -10, 0); continue }
      s.life[j] -= dt
      const j3 = j * 3
      s.vel[j3 + 1] -= 3.5 * dt
      s.pos[j3]     += s.vel[j3]     * dt
      s.pos[j3 + 1] += s.vel[j3 + 1] * dt
      s.pos[j3 + 2] += s.vel[j3 + 2] * dt
      posArr.setXYZ(j, s.pos[j3], s.pos[j3 + 1], s.pos[j3 + 2])
    }
    posArr.needsUpdate = true
  })

  const sX = H.doorOff
  const sY = H.doorH + 1.1
  const sZ = H.d / 2 + H.wallT / 2 + 0.04

  return (
    <group position={[sX, sY, sZ]} rotation={[0.04, 0, -0.06]}>
      {/* Weathered backing board */}
      <mesh position={[0, 0, -0.015]}>
        <boxGeometry args={[sW + 0.1, sH + 0.08, 0.025]} />
        <meshStandardMaterial color={0x0e0e0e} roughness={0.88} metalness={0.05} />
      </mesh>

      {/* Mounting brackets */}
      {[-1, 1].map(s => (
        <mesh key={s} position={[s * (sW / 2 + 0.02), 0, -0.025]}>
          <boxGeometry args={[0.06, 0.2, 0.06]} />
          <meshStandardMaterial color={0x333333} roughness={0.7} metalness={0.5} />
        </mesh>
      ))}

      {/* Neon text */}
      <mesh>
        <planeGeometry args={[sW, sH]} />
        <meshBasicMaterial
          ref={matRef}
          map={tex}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Sparks */}
      <points ref={sparksRef} geometry={sparkGeo}>
        <pointsMaterial
          color={0xffaa44}
          size={0.04}
          transparent
          opacity={0.9}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Glow light */}
      <pointLight
        ref={glowRef}
        position={[0, -0.5, 0.5]}
        color={0xff3050}
        intensity={2.5}
        distance={8}
        decay={1.8}
      />
    </group>
  )
}

// ─── Main Component ─────────────────────────────────────
export default function StoneHouse() {
  const fireRef = useRef<THREE.Points>(null!)
  const fireLightRef = useRef<THREE.PointLight>(null!)
  const mainLightRef = useRef<THREE.PointLight>(null!)
  const [textures, setTextures] = useState<THREE.Texture[]>([])

  // Load specific gallery images for TV screen
  useEffect(() => {
    const paths = [
      '/gallery/blomster/DF7Q-UrqdDq.jpg',
      '/gallery/blomster/DGKaXF3Mcq1.jpg',
      '/gallery/blomster/DI0va71gP1V.jpg',
      '/gallery/blomster/DJ0phQPAa2z.jpg',
      '/gallery/blomster/DODXVK3jKzV.jpg',
      '/gallery/blomster/DTj3jmdDK-J.jpg',
      '/gallery/dark-art/DUILS8egDTn.jpg',
      '/gallery/nordisk/DOfm8N5DJm6.jpg',
      '/gallery/ornamental/DJ47EUtAQ-U.jpg',
    ]
    const loader = new THREE.TextureLoader()
    Promise.all(
      paths.map(src => new Promise<THREE.Texture | null>(resolve => {
        loader.load(src, tex => resolve(tex), undefined, () => resolve(null))
      }))
    ).then(texs => setTextures(texs.filter((t): t is THREE.Texture => t !== null)))
  }, [])

  // ── Materials ──
  const stoneMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: H.stone, roughness: 0.95, metalness: 0.04,
  }), [])
  const stoneWornMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: H.stoneDark, roughness: 0.98, metalness: 0.02,
  }), [])
  const mossMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: H.moss, roughness: 0.95,
  }), [])
  const fireStoneMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x0c0808, roughness: 0.98,
  }), [])
  const roofMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: H.roof, roughness: 0.96,
  }), [])
  const floorMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: H.floor, roughness: 0.95,
  }), [])

  // ── Wall Geometries ──
  // Front wall: door opening offset slightly left
  const frontWall = useMemo(() => {
    const g = buildStoneWall(H.w, H.wallH, H.wallT,
      [{ cx: H.doorOff, cy: H.doorH / 2, w: H.doorW, h: H.doorH }],
      100, 0.25)
    g.translate(0, 0, H.d / 2)
    return g
  }, [])

  // Back wall: small window high and off-center
  const backWall = useMemo(() => {
    const g = buildStoneWall(H.w, H.wallH, H.wallT,
      [{ cx: 0.9, cy: H.winY, w: H.winW, h: H.winH }],
      200, 0.2)
    g.translate(0, 0, -H.d / 2)
    return g
  }, [])

  // Left wall (windward, most weathered): one window
  const leftWall = useMemo(() => {
    const g = buildStoneWall(H.d, H.wallH, H.wallT,
      [{ cx: 0.6, cy: H.winY, w: H.winW, h: H.winH }],
      300, 0.35)
    g.applyMatrix4(new THREE.Matrix4().makeRotationY(-Math.PI / 2))
    g.translate(-H.w / 2, 0, 0)
    return g
  }, [])

  // Right wall: one window
  const rightWall = useMemo(() => {
    const g = buildStoneWall(H.d, H.wallH, H.wallT,
      [{ cx: -0.6, cy: H.winY, w: H.winW, h: H.winH }],
      400, 0.25)
    g.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI / 2))
    g.translate(H.w / 2, 0, 0)
    return g
  }, [])

  // Gable walls (triangular sections above main walls)
  const frontGable = useMemo(() => {
    const g = buildGable(H.w, H.roofPeak, H.wallT, 150, 0.25)
    g.translate(0, H.wallH, H.d / 2)
    return g
  }, [])
  const backGable = useMemo(() => {
    const g = buildGable(H.w, H.roofPeak, H.wallT, 250, 0.2)
    g.translate(0, H.wallH, -H.d / 2)
    return g
  }, [])

  // Door lintel + jambs
  const doorFrame = useMemo(() => {
    const parts: THREE.BufferGeometry[] = []
    // Lintel (heavy stone slab)
    const lintel = new THREE.BoxGeometry(H.doorW + 0.35, 0.22, H.wallT + 0.06)
    lintel.translate(H.doorOff, H.doorH + 0.11, H.d / 2)
    parts.push(lintel)
    // Jambs
    for (const side of [-1, 1]) {
      const j = new THREE.BoxGeometry(0.14, H.doorH, H.wallT + 0.03)
      j.translate(H.doorOff + side * (H.doorW / 2 + 0.07), H.doorH / 2, H.d / 2)
      parts.push(j)
    }
    return mergeG(parts)
  }, [])

  // Fallen stones + moss patches
  const fallenGeo = useMemo(() => buildFallenStones(), [])
  const mossGeo = useMemo(() => {
    const rng = rng32(800)
    const parts: THREE.BufferGeometry[] = []
    for (let i = 0; i < 12; i++) {
      const g = new THREE.BoxGeometry(0.3 + rng() * 0.5, 0.02, 0.2 + rng() * 0.4)
      const side = rng() > 0.6 ? -1 : 1
      g.translate(
        side * (H.w / 2) + (rng() - 0.5) * 0.05,
        0.5 + rng() * 2,
        (rng() - 0.5) * H.d * 0.8
      )
      g.applyMatrix4(new THREE.Matrix4().makeRotationY(side > 0 ? Math.PI / 2 : -Math.PI / 2))
      parts.push(g)
    }
    return mergeG(parts)
  }, [])

  // Fireplace
  const fireplaceGeo = useMemo(() => buildFireplace(), [])

  // Roof
  const roofGeo = useMemo(() => buildRoof(), [])

  // Thick turf grass layer on roof (Faroese-style sod roof)
  const roofTufts = useMemo(() => {
    const rng = rng32(900)
    const parts: THREE.BufferGeometry[] = []
    const halfW = H.w / 2 + H.roofOver
    const depth = H.d + H.roofOver * 2
    const leftAngle = Math.atan2(H.roofPeak, halfW)
    const rightPeakSag = H.roofPeak * 0.93
    const rightAngle = Math.atan2(rightPeakSag, halfW)
    const turfThick = 0.22

    const leftLen = Math.sqrt(halfW * halfW + H.roofPeak * H.roofPeak)
    const ls = new THREE.BoxGeometry(leftLen, turfThick, depth)
    ls.translate(leftLen / 2, H.roofThick / 2 + turfThick / 2, 0)
    ls.applyMatrix4(new THREE.Matrix4().makeRotationZ(leftAngle))
    ls.translate(-halfW, H.wallH, 0)
    parts.push(ls)

    const rightLen = Math.sqrt(halfW * halfW + rightPeakSag * rightPeakSag)
    const rs = new THREE.BoxGeometry(rightLen, turfThick, depth)
    rs.translate(-rightLen / 2, H.roofThick / 2 + turfThick / 2, 0)
    rs.applyMatrix4(new THREE.Matrix4().makeRotationZ(-rightAngle))
    rs.translate(halfW, H.wallH, 0)
    parts.push(rs)

    for (let i = 0; i < 280; i++) {
      const isLeft = rng() > 0.5
      const t = 0.04 + rng() * 0.9
      const z = (rng() - 0.5) * depth * 0.93
      const peak = isLeft ? H.roofPeak : rightPeakSag
      const x = isLeft ? -halfW + t * halfW : halfW - t * halfW
      const baseY = H.wallH + t * peak + H.roofThick * 0.5 + turfThick
      const h = 0.06 + rng() * 0.2 + (1 - t) * 0.06
      const w = 0.03 + rng() * 0.06
      const d = 0.02 + rng() * 0.05
      const g = new THREE.BoxGeometry(w, h, d)
      const tilt = (isLeft ? leftAngle : -rightAngle) * 0.3
      g.applyMatrix4(new THREE.Matrix4().makeRotationZ(tilt))
      g.translate(x + (rng() - 0.5) * 0.02, baseY + h / 2, z)
      parts.push(g)
    }

    for (let i = 0; i < 50; i++) {
      const z = (rng() - 0.5) * depth * 0.95
      const spot = rng()
      let x: number, y: number
      if (spot < 0.35) {
        x = (rng() - 0.5) * 0.4
        y = H.wallH + H.roofPeak + H.roofThick * 0.5 + turfThick
      } else if (spot < 0.65) {
        x = -halfW + (rng() - 0.5) * 0.25
        y = H.wallH + H.roofThick * 0.5 + turfThick
      } else {
        x = halfW + (rng() - 0.5) * 0.25
        y = H.wallH + H.roofThick * 0.5 + turfThick
      }
      const h = 0.1 + rng() * 0.28
      const g = new THREE.BoxGeometry(0.06 + rng() * 0.1, h, 0.05 + rng() * 0.08)
      g.translate(x, y + h / 2, z)
      parts.push(g)
    }

    return mergeG(parts)
  }, [])

  // Floor
  const floorGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(H.w - H.wallT * 2 + 0.3, H.d - H.wallT * 2 + 0.3)
    g.rotateX(-Math.PI / 2)
    g.translate(0, -0.05, 0)
    return g
  }, [])

  // Fire particles
  const fireGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const count = 55
    const p = new Float32Array(count * 3)
    const r = rng32(777)
    for (let i = 0; i < count; i++) {
      p[i * 3] = (r() - 0.5) * 0.3
      p[i * 3 + 1] = r() * 0.55
      p[i * 3 + 2] = (r() - 0.5) * 0.2
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3))
    return g
  }, [])

  const fireBaseZ = -H.d / 2 + H.wallT + 0.32

  // ── Animation ──
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (fireRef.current) {
      const arr = fireRef.current.geometry.attributes.position.array as Float32Array
      const n = arr.length / 3
      for (let i = 0; i < n; i++) {
        const i3 = i * 3
        arr[i3 + 1] += 0.007 + Math.sin(t * 4 + i) * 0.002
        arr[i3] += Math.sin(t * 6 + i * 2.1) * 0.0018
        arr[i3 + 2] += Math.cos(t * 5 + i * 1.6) * 0.001
        if (arr[i3 + 1] > 0.75) {
          arr[i3 + 1] = 0.12 + Math.random() * 0.08
          arr[i3] = (Math.random() - 0.5) * 0.22
          arr[i3 + 2] = (Math.random() - 0.5) * 0.12
        }
      }
      fireRef.current.geometry.attributes.position.needsUpdate = true
    }
    if (fireLightRef.current) {
      fireLightRef.current.intensity = 8 + Math.sin(t * 7.3) * 1.8 + Math.sin(t * 11) * 1.0 + Math.sin(t * 3.5) * 0.6
    }
    if (mainLightRef.current) {
      mainLightRef.current.intensity = 5 + Math.sin(t * 4.1) * 0.4
    }
  })

  // ── Light beam planes (warm light flooding from openings) ──
  const beamMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: 0xffaa55, transparent: true, opacity: 0.012, side: THREE.DoubleSide,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }), [])

  return (
    <group position={HOUSE_POS}>
      {/* ── Exterior Walls ── */}
      <mesh geometry={frontWall} material={stoneMat} castShadow receiveShadow />
      <mesh geometry={backWall} material={stoneMat} castShadow receiveShadow />
      <mesh geometry={leftWall} material={stoneWornMat} castShadow receiveShadow />
      <mesh geometry={rightWall} material={stoneMat} castShadow receiveShadow />
      <mesh geometry={frontGable} material={stoneMat} castShadow />
      <mesh geometry={backGable} material={stoneMat} castShadow />
      <mesh geometry={doorFrame} material={stoneMat} castShadow />

      {/* ── Broken Neon Sign Above Door ── */}
      <NeonSign />

      {/* ── Weathering Details ── */}
      <mesh geometry={fallenGeo} material={stoneMat} receiveShadow />
      <mesh geometry={mossGeo} material={mossMat} />

      {/* ── Roof (turf) ── */}
      <mesh geometry={roofGeo} material={roofMat} castShadow receiveShadow />
      <mesh geometry={roofTufts} material={mossMat} />

      {/* ── Interior ── */}
      <mesh geometry={floorGeo} material={floorMat} receiveShadow />
      <mesh geometry={fireplaceGeo} material={fireStoneMat} castShadow receiveShadow />

      {/* ── Fire ── */}
      <points ref={fireRef} geometry={fireGeo} position={[0, 0.12, fireBaseZ]}>
        <pointsMaterial
          color={0xff6622} size={0.12} transparent opacity={0.85}
          sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending}
        />
      </points>
      {/* Fire embers (smaller, brighter) */}
      <points geometry={fireGeo} position={[0, 0.18, fireBaseZ]}>
        <pointsMaterial
          color={0xffcc44} size={0.06} transparent opacity={0.65}
          sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending}
        />
      </points>
      {/* Fire glow (large soft sphere) */}
      <mesh position={[0, 0.5, fireBaseZ + 0.1]}>
        <sphereGeometry args={[0.6, 8, 8]} />
        <meshBasicMaterial color={0xff6622} transparent opacity={0.06} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* ── Interior Lights ── */}
      <pointLight
        ref={fireLightRef}
        position={[0, 0.9, fireBaseZ + 0.25]}
        color={H.fireLight}
        intensity={8}
        distance={18}
        decay={1.6}
        castShadow
        shadow-mapSize-width={256}
        shadow-mapSize-height={256}
        shadow-bias={-0.003}
      />
      <pointLight
        ref={mainLightRef}
        position={[0, 2.4, 0]}
        color={0xdd9955}
        intensity={5}
        distance={14}
        decay={1.5}
        castShadow
        shadow-mapSize-width={256}
        shadow-mapSize-height={256}
        shadow-bias={-0.003}
      />
      {/* Hanging ceiling lamp */}
      <group position={[0, H.wallH - 0.1, 0]}>
        {/* Wire */}
        <mesh>
          <cylinderGeometry args={[0.005, 0.005, 0.5, 4]} />
          <meshStandardMaterial color={0x222222} metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Shade */}
        <mesh position={[0, -0.28, 0]}>
          <cylinderGeometry args={[0.04, 0.14, 0.12, 8, 1, true]} />
          <meshStandardMaterial color={0x1a1208} roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
        {/* Bulb glow */}
        <mesh position={[0, -0.26, 0]}>
          <sphereGeometry args={[0.035, 6, 6]} />
          <meshBasicMaterial color={0xffcc66} transparent opacity={0.9} />
        </mesh>
      </group>
      <pointLight position={[0, H.wallH - 0.4, 0]} color={0xeebb66} intensity={4} distance={10} decay={1.5} />
      {/* Ambient fill so nothing is pure black */}
      <ambientLight intensity={0.15} color={0xaa7744} />

      {/* ── Light Beams Flooding From Door ── */}
      {[0.6, 1.8, 3.5, 6].map((dist, i) => (
        <mesh key={`db${i}`} position={[H.doorOff, H.doorH / 2 * 0.8, H.d / 2 + dist]} material={beamMat}>
          <planeGeometry args={[H.doorW * (1 + dist * 0.45), H.doorH * (0.9 + dist * 0.2)]} />
        </mesh>
      ))}

      {/* ── Light Beams From Side Windows ── */}
      {/* Left window */}
      {[0.5, 1.5, 3].map((dist, i) => (
        <mesh key={`lw${i}`} position={[-H.w / 2 - dist, H.winY, 0.6]} rotation={[0, Math.PI / 2, 0]} material={beamMat}>
          <planeGeometry args={[H.winW * (1 + dist * 0.6), H.winH * (1 + dist * 0.4)]} />
        </mesh>
      ))}
      {/* Right window */}
      {[0.5, 1.5, 3].map((dist, i) => (
        <mesh key={`rw${i}`} position={[H.w / 2 + dist, H.winY, -0.6]} rotation={[0, Math.PI / 2, 0]} material={beamMat}>
          <planeGeometry args={[H.winW * (1 + dist * 0.6), H.winH * (1 + dist * 0.4)]} />
        </mesh>
      ))}

      {/* ── Retro TV ── */}
      <RetroTV
        textures={textures}
        position={[1.2, 0.85, -1.8]}
        rotation={[0, -0.5, 0]}
      />

      {/* ── Sleeping Cat (by the fireplace) ── */}
      <SleepingCat
        position={[0.6, 0, fireBaseZ + 0.8]}
        rotation={[0, 0.4, 0]}
      />
    </group>
  )
}
