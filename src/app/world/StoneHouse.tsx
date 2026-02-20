'use client'

import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// ─── House Configuration ────────────────────────────────
const H = {
  w: 7.4,
  d: 9.6,
  wallH: 4.2,
  wallT: 0.7,
  doorW: 1.2,
  doorH: 3.2,
  doorOff: -0.3,
  winW: 0.5,
  winH: 0.6,
  winY: 2.6,
  roofPeak: 1.6,
  roofOver: 0.4,
  roofThick: 0.3,
  stone: 0x2a2a2e,
  stoneDark: 0x1e1e22,
  moss: 0x1a2210,
  roof: 0x131c0b,
  floor: 0x100c08,
  fireLight: 0xff8833,
  framewood: 0x1a1410,
}

export const HOUSE_POS: [number, number, number] = [0, 0, -35]
export const HOUSE_EXCL = 7

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
  for (let i = 0; i < 22; i++) {
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

// ─── Shadow Particle Overlay ────────────────────────────
// Particles that appear inside the frame, grow to cover it, then shrink away
interface ShadowDot {
  x: number; y: number; maxR: number; delay: number
}

function makeShadowDots(seed: number): ShadowDot[] {
  const rng = rng32(seed)
  const dots: ShadowDot[] = []
  for (let i = 0; i < 50; i++) {
    dots.push({
      x: rng() * 256,
      y: rng() * 256,
      maxR: 30 + rng() * 70,
      delay: rng() * 0.4,
    })
  }
  return dots
}

function drawShadowOverlay(
  ctx: CanvasRenderingContext2D, size: number,
  dots: ShadowDot[], fadeIn: number
) {
  ctx.clearRect(0, 0, size, size)
  for (const d of dots) {
    const p = Math.max(0, Math.min(1, (fadeIn - d.delay) / (1 - d.delay)))
    if (p <= 0) continue
    const r = d.maxR * p
    const a = Math.min(1, p * 1.5) * 0.85
    const grad = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, r)
    grad.addColorStop(0, `rgba(4,2,8,${a})`)
    grad.addColorStop(0.6, `rgba(6,3,12,${a * 0.5})`)
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
  }
}

// ─── Gallery Frame (rotating images with shadow fade) ───
const SHOW_DUR = 5.0
const FADE_HALF = 0.9
const CYCLE = SHOW_DUR + FADE_HALF * 2

function GalleryFrame({ textures, frameSize, frameIdx, position, rotation }: {
  textures: THREE.Texture[]
  frameSize: number
  frameIdx: number
  position: [number, number, number]
  rotation: [number, number, number]
}) {
  const imgMatRef = useRef<THREE.MeshStandardMaterial>(null!)
  const overlayMatRef = useRef<THREE.MeshBasicMaterial>(null!)
  const state = useRef({ idx: 0, phase: 0, inited: false, swapped: false })

  const dots = useMemo(() => makeShadowDots(4444 + frameIdx * 77), [frameIdx])

  const { ctx, tex } = useMemo(() => {
    if (typeof document === 'undefined') return { ctx: null, tex: null }
    const c = document.createElement('canvas')
    c.width = 256; c.height = 256
    const cx = c.getContext('2d')!
    const t = new THREE.CanvasTexture(c)
    t.needsUpdate = true
    return { ctx: cx, tex: t }
  }, [])

  useFrame((_, delta) => {
    if (!textures.length || !imgMatRef.current || !overlayMatRef.current || !ctx || !tex) return
    const s = state.current
    if (!s.inited) {
      s.idx = frameIdx % textures.length
      s.phase = (frameIdx * (CYCLE / 8 * 3)) % CYCLE
      s.inited = true
      s.swapped = false
    }
    s.phase += delta
    if (s.phase >= CYCLE) {
      s.phase -= CYCLE
      s.idx = (s.idx + 1) % textures.length
      s.swapped = false
    }

    const t = s.phase
    if (t < SHOW_DUR) {
      if (imgMatRef.current.map !== textures[s.idx]) {
        imgMatRef.current.map = textures[s.idx]
        imgMatRef.current.emissiveMap = textures[s.idx]
        imgMatRef.current.needsUpdate = true
      }
      imgMatRef.current.opacity = 1
      overlayMatRef.current.opacity = 0
    } else if (t < SHOW_DUR + FADE_HALF) {
      const p = (t - SHOW_DUR) / FADE_HALF
      drawShadowOverlay(ctx, 256, dots, p)
      tex.needsUpdate = true
      overlayMatRef.current.opacity = p * 0.95
      imgMatRef.current.opacity = 1
    } else {
      const p = (t - SHOW_DUR - FADE_HALF) / FADE_HALF
      if (!s.swapped) {
        const nextIdx = (s.idx + 1) % textures.length
        imgMatRef.current.map = textures[nextIdx]
        imgMatRef.current.emissiveMap = textures[nextIdx]
        imgMatRef.current.needsUpdate = true
        s.swapped = true
      }
      drawShadowOverlay(ctx, 256, dots, 1 - p)
      tex.needsUpdate = true
      overlayMatRef.current.opacity = (1 - p) * 0.95
      imgMatRef.current.opacity = 1
    }
  })

  const fB = 0.05
  const hasImg = textures.length > 0

  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <boxGeometry args={[frameSize + fB * 2, frameSize + fB * 2, 0.03]} />
        <meshStandardMaterial color={0x1a1410} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0, 0.017]}>
        <planeGeometry args={[frameSize, frameSize]} />
        <meshStandardMaterial
          ref={imgMatRef}
          map={hasImg ? textures[frameIdx % textures.length] : null}
          emissiveMap={hasImg ? textures[frameIdx % textures.length] : null}
          emissive={0x332211}
          emissiveIntensity={0.2}
          roughness={0.4}
          transparent
          opacity={1}
        />
      </mesh>
      <mesh position={[0, 0, 0.019]}>
        <planeGeometry args={[frameSize, frameSize]} />
        <meshBasicMaterial
          ref={overlayMatRef}
          map={tex}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
      {!hasImg && (
        <mesh position={[0, 0, 0.017]}>
          <planeGeometry args={[frameSize, frameSize]} />
          <meshStandardMaterial color={0x1a1412} roughness={0.9} emissive={0x0a0806} emissiveIntensity={0.3} />
        </mesh>
      )}
    </group>
  )
}

// ─── Main Component ─────────────────────────────────────
export default function StoneHouse() {
  const fireRef = useRef<THREE.Points>(null!)
  const fireLightRef = useRef<THREE.PointLight>(null!)
  const mainLightRef = useRef<THREE.PointLight>(null!)
  const [textures, setTextures] = useState<THREE.Texture[]>([])

  // Load gallery images for picture frames
  useEffect(() => {
    fetch('/api/images/public?location=gallery')
      .then(r => r.json())
      .then((imgs: { src: string }[]) => {
        if (!imgs?.length) return
        const shuffled = [...imgs].sort(() => Math.random() - 0.5).slice(0, 8)
        const loader = new THREE.TextureLoader()
        Promise.all(
          shuffled.map(img => new Promise<THREE.Texture | null>(resolve => {
            loader.load(img.src, tex => resolve(tex), undefined, () => resolve(null))
          }))
        ).then(texs => setTextures(texs.filter((t): t is THREE.Texture => t !== null)))
      })
      .catch(() => {})
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

  // Roof grass tufts (small protruding pieces along edges and ridge)
  const roofTufts = useMemo(() => {
    const rng = rng32(900)
    const parts: THREE.BufferGeometry[] = []
    for (let i = 0; i < 30; i++) {
      const g = new THREE.BoxGeometry(0.06 + rng() * 0.08, 0.12 + rng() * 0.15, 0.04 + rng() * 0.06)
      const edge = rng()
      let x: number, y: number, z: number
      if (edge < 0.3) {
        x = (rng() - 0.5) * H.w * 0.8
        y = H.wallH + H.roofPeak * (1 - Math.abs(x) / (H.w / 2 + H.roofOver)) + 0.12
        z = (rng() - 0.5) * (H.d + H.roofOver)
      } else if (edge < 0.6) {
        const s = rng() > 0.5 ? 1 : -1
        x = s * (H.w / 2 + H.roofOver * 0.8)
        y = H.wallH + 0.05
        z = (rng() - 0.5) * (H.d + H.roofOver)
      } else {
        x = (rng() - 0.5) * H.w * 0.6
        z = (rng() > 0.5 ? 1 : -1) * (H.d / 2 + H.roofOver * 0.7)
        y = H.wallH + H.roofPeak * (1 - Math.abs(x) / (H.w / 2 + H.roofOver)) * 0.5 + 0.1
      }
      g.translate(x, y, z)
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

  // ── Picture frame positions (interior walls, at eye level) ──
  const innerW = H.w / 2 - H.wallT
  const innerD = H.d / 2 - H.wallT
  const fS = 0.9

  const frames = useMemo(() => [
    { x: -innerW + 0.02, y: 2.5, z: -1.5, ry: Math.PI / 2 },
    { x: -innerW + 0.02, y: 2.5, z: 0.5, ry: Math.PI / 2 },
    { x: -innerW + 0.02, y: 2.5, z: 2.5, ry: Math.PI / 2 },
    { x: innerW - 0.02, y: 2.5, z: -1.5, ry: -Math.PI / 2 },
    { x: innerW - 0.02, y: 2.5, z: 0.5, ry: -Math.PI / 2 },
    { x: innerW - 0.02, y: 2.5, z: 2.5, ry: -Math.PI / 2 },
    { x: -1.6, y: 2.5, z: -innerD + 0.02, ry: 0 },
    { x: 1.6, y: 2.5, z: -innerD + 0.02, ry: 0 },
  ], [innerW, innerD])

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
        position={[0, 3.4, 0.5]}
        color={0xdd9955}
        intensity={5}
        distance={18}
        decay={1.5}
        castShadow
        shadow-mapSize-width={256}
        shadow-mapSize-height={256}
        shadow-bias={-0.003}
      />
      {/* Fill lights along walls to illuminate pictures */}
      <pointLight position={[-innerW + 0.5, 2.8, 0.5]} color={0xcc8844} intensity={3} distance={8} decay={1.4} />
      <pointLight position={[innerW - 0.5, 2.8, 0.5]} color={0xcc8844} intensity={3} distance={8} decay={1.4} />
      <pointLight position={[0, 2.6, -innerD + 0.8]} color={0xddaa55} intensity={2.5} distance={6} decay={1.4} />
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

      {/* ── Gallery Frames (rotating images with smoke transitions) ── */}
      {frames.map((fp, i) => (
        <GalleryFrame
          key={`gf${i}`}
          textures={textures}
          frameSize={fS}
          frameIdx={i}
          position={[fp.x, fp.y, fp.z]}
          rotation={[0, fp.ry, 0]}
        />
      ))}
    </group>
  )
}
