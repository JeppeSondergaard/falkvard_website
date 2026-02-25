'use client'

import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import StoneHouse, { HOUSE_POS, HOUSE_EXCL } from './StoneHouse'

// ─── Configuration ──────────────────────────────────────
const CFG = {
  fogDensity: 0.028,
  fogColor: 0x0e0e16,
  treeColor: 0x060608,
  fernColor: 0x101a10,
  bushColor: 0x0c140c,
  grassColor: 0x141e12,
  groundColor: 0x08080c,
  foxColor: 0x100c08,
  leafColor: 0x0d0e08,
  pineColor: 0x080c06,
  recycleDist: 65,
  placeMin: 58,
  placeMax: 65,
  initRadius: 60,
  grassRadius: 18,
  grassRecycle: 24,
  cameraHeight: 2.5,
  autoSpeed: 1.8,
  autoRamp: 4,
  autoDelay: 0.8,
  moveSpeed: 5.5,
  mobileSpeed: 2.8,
  mouseSens: 0.0018,
  houseX: HOUSE_POS[0],
  houseZ: HOUSE_POS[2],
  houseR: HOUSE_EXCL,
  pathHalfW: 4,
}

function onPath(px: number, pz: number) {
  return Math.abs(px) < CFG.pathHalfW && pz > CFG.houseZ - 2 && pz < 2
}
function pastCliff(pz: number) { return pz < CLIFF_Z + 4 }

// ─── Coastal Geometry Constants ──────────────────────────
const CLIFF_Z = HOUSE_POS[2] - 25
const CLIFF_W = 80
const CLIFF_H = 30
const CLIFF_DEPTH = 6
const OCEAN_Y = -24

// ─── Seeded PRNG ────────────────────────────────────────
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ─── Merge BufferGeometries ─────────────────────────────
function mergeGeoms(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (!geos.length) return new THREE.BufferGeometry()
  let totalV = 0
  const indices: number[] = []
  for (const g of geos) totalV += g.attributes.position.count
  const pos = new Float32Array(totalV * 3)
  const norm = new Float32Array(totalV * 3)
  let vOff = 0
  for (const g of geos) {
    const pA = g.attributes.position.array as Float32Array
    const nA = (g.attributes.normal?.array ?? new Float32Array(pA.length)) as Float32Array
    pos.set(pA, vOff * 3)
    norm.set(nA, vOff * 3)
    if (g.index) {
      const iA = g.index.array
      for (let i = 0; i < iA.length; i++) indices.push(iA[i] + vOff)
    }
    vOff += g.attributes.position.count
    g.dispose()
  }
  const m = new THREE.BufferGeometry()
  m.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  m.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3))
  if (indices.length) m.setIndex(indices)
  return m
}

// ─── Procedural Geometry Generators ─────────────────────

interface TreePreset {
  seed: number; trunkH: [number, number]; trunkR: [number, number]
  depth: number; spread: number; lenRatio: [number, number]
  radRatio: [number, number]; branchN: [number, number]
}

const TREE_PRESETS: TreePreset[] = [
  { seed: 7, trunkH: [5, 8], trunkR: [0.04, 0.07], depth: 4, spread: 1.0, lenRatio: [0.5, 0.7], radRatio: [0.35, 0.55], branchN: [2, 4] },
  { seed: 42, trunkH: [3, 5.5], trunkR: [0.1, 0.2], depth: 4, spread: 1.5, lenRatio: [0.45, 0.65], radRatio: [0.4, 0.6], branchN: [2, 4] },
  { seed: 137, trunkH: [1.8, 3.5], trunkR: [0.02, 0.05], depth: 3, spread: 0.9, lenRatio: [0.5, 0.7], radRatio: [0.3, 0.5], branchN: [2, 3] },
  { seed: 211, trunkH: [6, 10], trunkR: [0.06, 0.12], depth: 5, spread: 0.8, lenRatio: [0.55, 0.7], radRatio: [0.35, 0.5], branchN: [2, 3] },
  { seed: 333, trunkH: [2, 4], trunkR: [0.03, 0.06], depth: 3, spread: 1.8, lenRatio: [0.4, 0.6], radRatio: [0.35, 0.55], branchN: [3, 5] },
]

function createTree(p: TreePreset): THREE.BufferGeometry {
  const rng = mulberry32(p.seed)
  const lerp = (a: number, b: number) => a + rng() * (b - a)
  const parts: THREE.BufferGeometry[] = []

  function branch(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, len: number, rB: number, rT: number, d: number) {
    if (d <= 0 || rB < 0.003) return
    const cyl = new THREE.CylinderGeometry(rT, rB, len, d > 2 ? 5 : 4, 1)
    cyl.translate(0, len / 2, 0)
    const mag = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1
    const nx = dx / mag, ny = dy / mag, nz = dz / mag
    const dir = new THREE.Vector3(nx, ny, nz)
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
    cyl.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q))
    cyl.applyMatrix4(new THREE.Matrix4().makeTranslation(ox, oy, oz))
    parts.push(cyl)
    const ex = ox + nx * len, ey = oy + ny * len, ez = oz + nz * len
    if (d <= 2) {
      const leafN = d === 1 ? 3 + Math.floor(rng() * 3) : 1 + Math.floor(rng() * 2)
      for (let li = 0; li < leafN; li++) {
        const lS = 0.06 + rng() * 0.1, lW = lS * 0.5
        const leaf = new THREE.BufferGeometry()
        leaf.setAttribute('position', new THREE.Float32BufferAttribute([0, lS, 0, -lW, lS * 0.5, 0, 0, 0, 0, lW, lS * 0.5, 0], 3))
        leaf.setIndex([0, 1, 2, 0, 2, 3])
        leaf.computeVertexNormals()
        const lm = new THREE.Matrix4().makeRotationFromQuaternion(
          new THREE.Quaternion().setFromEuler(new THREE.Euler(rng() * Math.PI, rng() * Math.PI * 2, rng() * Math.PI))
        )
        lm.setPosition(ex + (rng() - 0.5) * 0.25, ey + (rng() - 0.5) * 0.2, ez + (rng() - 0.5) * 0.25)
        leaf.applyMatrix4(lm)
        parts.push(leaf)
      }
    }
    const n = Math.floor(lerp(...p.branchN))
    for (let i = 0; i < n; i++) {
      const t = 0.35 + rng() * 0.6
      branch(ox + (ex - ox) * t, oy + (ey - oy) * t, oz + (ez - oz) * t,
        dx + (rng() - 0.5) * p.spread * 2, Math.max(0.15, dy * (0.5 + rng() * 0.5)),
        dz + (rng() - 0.5) * p.spread * 2, len * lerp(...p.lenRatio),
        rB * lerp(...p.radRatio), rB * lerp(...p.radRatio) * 0.5, d - 1)
    }
  }
  const h = lerp(...p.trunkH), r = lerp(...p.trunkR)
  branch(0, 0, 0, (rng() - 0.5) * 0.08, 1, (rng() - 0.5) * 0.08, h, r, r * 0.35, p.depth)
  return mergeGeoms(parts)
}

function createFern(): THREE.BufferGeometry {
  const p1 = new THREE.PlaneGeometry(0.6, 0.7, 1, 3)
  const p2 = new THREE.PlaneGeometry(0.6, 0.7, 1, 3)
  p2.rotateY(Math.PI / 2)
  p1.translate(0, 0.35, 0); p2.translate(0, 0.35, 0)
  return mergeGeoms([p1, p2])
}

function createBush(): THREE.BufferGeometry {
  const rng = mulberry32(99)
  const parts: THREE.BufferGeometry[] = []
  for (let i = 0; i < 6; i++) {
    const s = new THREE.IcosahedronGeometry(0.12 + rng() * 0.1, 1)
    s.translate((rng() - 0.5) * 0.3, 0.1 + rng() * 0.15, (rng() - 0.5) * 0.3)
    parts.push(s)
  }
  return mergeGeoms(parts)
}

interface PinePreset {
  seed: number; height: [number, number]; trunkR: [number, number]
  baseR: [number, number]; tiers: [number, number]; taper: number
}

const PINE_PRESETS: PinePreset[] = [
  { seed: 500, height: [6, 10], trunkR: [0.04, 0.08], baseR: [1.0, 1.6], tiers: [5, 7], taper: 0.72 },
  { seed: 601, height: [4, 7], trunkR: [0.03, 0.06], baseR: [0.8, 1.3], tiers: [4, 6], taper: 0.68 },
  { seed: 719, height: [8, 13], trunkR: [0.05, 0.1], baseR: [0.7, 1.1], tiers: [6, 8], taper: 0.78 },
]

function createPineTree(p: PinePreset): THREE.BufferGeometry {
  const rng = mulberry32(p.seed)
  const lerp = (a: number, b: number) => a + rng() * (b - a)
  const parts: THREE.BufferGeometry[] = []

  const h = lerp(...p.height)
  const trR = lerp(...p.trunkR)
  const bR = lerp(...p.baseR)
  const nTiers = Math.floor(lerp(...p.tiers))

  const trunk = new THREE.CylinderGeometry(trR * 0.4, trR, h, 5, 1)
  trunk.translate(0, h / 2, 0)
  parts.push(trunk)

  const startY = h * 0.25
  const tierSpacing = (h * 0.85 - startY) / nTiers

  for (let i = 0; i < nTiers; i++) {
    const t = i / Math.max(nTiers - 1, 1)
    const r = bR * (1 - t * (1 - p.taper * 0.3)) * (0.85 + rng() * 0.3)
    const ch = tierSpacing * (1.3 - t * 0.4) * (0.9 + rng() * 0.2)
    const y = startY + i * tierSpacing
    const cone = new THREE.ConeGeometry(r, ch, 6, 1)
    cone.translate((rng() - 0.5) * 0.04, y + ch * 0.4, (rng() - 0.5) * 0.04)
    parts.push(cone)
  }

  const topR = bR * 0.15 * (0.8 + rng() * 0.4)
  const topH = tierSpacing * 0.8
  const top = new THREE.ConeGeometry(topR, topH, 5, 1)
  top.translate(0, startY + nTiers * tierSpacing + topH * 0.3, 0)
  parts.push(top)

  return mergeGeoms(parts)
}

function createGrassBlade(): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute([
    -0.015, 0, 0, 0.015, 0, 0, 0.003, 0.35, 0, -0.003, 0.35, 0,
  ], 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], 3))
  g.setIndex([0, 1, 2, 0, 2, 3])
  return g
}

// ─── Flora Instances (trees, ferns, bushes) ─────────────
interface FloraData { x: number; z: number; scale: number; rotY: number }

function FloraInstances({ geometry, color, count, seed, scaleRange, windAmp, windFreq, castShadow: cs = false }: {
  geometry: THREE.BufferGeometry; color: number; count: number; seed: number
  scaleRange: [number, number]; windAmp: number; windFreq: number; castShadow?: boolean
}) {
  const ref = useRef<THREE.InstancedMesh>(null!)
  const rng = useMemo(() => mulberry32(seed), [seed])
  const data = useMemo(() => {
    const arr: FloraData[] = []
    for (let i = 0; i < count; i++) {
      let x: number, z: number
      for (let tries = 0; tries < 20; tries++) {
        const a = rng() * Math.PI * 2, d = 10 + rng() * (CFG.initRadius - 10)
        x = Math.cos(a) * d; z = Math.sin(a) * d
        if (!onPath(x, z) && !pastCliff(z)) break
      }
      arr.push({ x: x!, z: z!, scale: scaleRange[0] + rng() * (scaleRange[1] - scaleRange[0]), rotY: rng() * Math.PI * 2 })
    }
    return arr
  }, [count, rng, scaleRange])
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0, side: THREE.DoubleSide }), [color])
  const sc = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), s: new THREE.Vector3(), p: new THREE.Vector3(), e: new THREE.Euler(0, 0, 0, 'YXZ') }), [])

  useFrame(({ camera, clock }) => {
    if (!ref.current) return
    const { m, q, s, p, e } = sc
    const cx = camera.position.x, cz = camera.position.z, t = clock.elapsedTime
    for (let i = 0; i < count; i++) {
      const d = data[i], dx = d.x - cx, dz = d.z - cz
      if (dx * dx + dz * dz > CFG.recycleDist * CFG.recycleDist) {
        for (let tries = 0; tries < 10; tries++) {
          const a = Math.random() * Math.PI * 2, r = CFG.placeMin + Math.random() * (CFG.placeMax - CFG.placeMin)
          d.x = cx + Math.cos(a) * r; d.z = cz + Math.sin(a) * r; d.rotY = Math.random() * Math.PI * 2
          if (!onPath(d.x, d.z) && !pastCliff(d.z)) break
        }
      }
      const hx = d.x - CFG.houseX, hz = d.z - CFG.houseZ
      if (hx * hx + hz * hz < CFG.houseR * CFG.houseR) {
        const ha = Math.atan2(hz, hx)
        d.x = CFG.houseX + Math.cos(ha) * (CFG.houseR + 1); d.z = CFG.houseZ + Math.sin(ha) * (CFG.houseR + 1)
      }
      if (onPath(d.x, d.z)) {
        d.x = (d.x >= 0 ? 1 : -1) * (CFG.pathHalfW + 1)
      }
      if (pastCliff(d.z)) d.z = CLIFF_Z + 5
      const phase = d.x * 0.5 + d.z * 0.3
      e.set(Math.sin(t * windFreq + phase) * windAmp, d.rotY, Math.cos(t * windFreq * 0.7 + phase * 1.3) * windAmp * 0.6)
      q.setFromEuler(e); p.set(d.x, 0, d.z); s.set(d.scale, d.scale, d.scale)
      m.compose(p, q, s); ref.current.setMatrixAt(i, m)
    }
    ref.current.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={ref} args={[geometry, mat, count]} frustumCulled={false} castShadow={cs} />
}

// ─── Grass Field ────────────────────────────────────────
function GrassField({ count = 2000 }: { count?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null!)
  const geo = useMemo(() => createGrassBlade(), [])
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: CFG.grassColor, roughness: 0.95, side: THREE.DoubleSide }), [])
  const data = useMemo(() => {
    const arr: FloraData[] = [], rng = mulberry32(777)
    for (let i = 0; i < count; i++) {
      const a = rng() * Math.PI * 2, d = rng() * CFG.grassRadius
      arr.push({ x: Math.cos(a) * d, z: Math.sin(a) * d, scale: 0.5 + rng() * 1.2, rotY: rng() * Math.PI * 2 })
    }
    return arr
  }, [count])
  const sc = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), s: new THREE.Vector3(), p: new THREE.Vector3(), e: new THREE.Euler(0, 0, 0, 'YXZ') }), [])

  useFrame(({ camera, clock }) => {
    if (!ref.current) return
    const { m, q, s, p, e } = sc
    const cx = camera.position.x, cz = camera.position.z, t = clock.elapsedTime
    for (let i = 0; i < count; i++) {
      const d = data[i], dx = d.x - cx, dz = d.z - cz
      if (dx * dx + dz * dz > CFG.grassRecycle * CFG.grassRecycle) {
        const a = Math.random() * Math.PI * 2, r = CFG.grassRadius * 0.6 + Math.random() * (CFG.grassRadius * 0.4)
        d.x = cx + Math.cos(a) * r; d.z = cz + Math.sin(a) * r; d.rotY = Math.random() * Math.PI * 2
        if (pastCliff(d.z)) d.z = CLIFF_Z + 5
      }
      const phase = d.x * 0.8 + d.z * 0.6
      e.set(Math.sin(t * 2.5 + phase) * 0.2 + Math.sin(t * 1.2 + phase * 0.7) * 0.08, d.rotY, Math.cos(t * 2.0 + phase * 1.3) * 0.12)
      q.setFromEuler(e); p.set(d.x, 0, d.z); s.set(d.scale, d.scale, d.scale)
      m.compose(p, q, s); ref.current.setMatrixAt(i, m)
    }
    ref.current.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={ref} args={[geo, mat, count]} frustumCulled={false} />
}

// ─── Lanterns (proper shape + glow halos + shadow lights) ─
interface LanternData { x: number; z: number; y: number }

function Lanterns({ count = 30 }: { count?: number }) {
  const bodyRef = useRef<THREE.InstancedMesh>(null!)
  const glowRef = useRef<THREE.InstancedMesh>(null!)
  const lightsRef = useRef<THREE.PointLight[]>([])

  const bodyGeo = useMemo(() => new THREE.IcosahedronGeometry(0.1, 1), [])
  const glowGeo = useMemo(() => new THREE.SphereGeometry(0.5, 8, 8), [])
  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x2a1808, emissive: 0xee9933, emissiveIntensity: 0.8, roughness: 0.3,
  }), [])
  const glowMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: 0xffaa44, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false,
  }), [])

  const data = useMemo(() => {
    const arr: LanternData[] = [], rng = mulberry32(555)
    for (let i = 0; i < count; i++) {
      const a = rng() * Math.PI * 2, d = 10 + rng() * (CFG.initRadius - 10)
      arr.push({ x: Math.cos(a) * d, z: Math.sin(a) * d, y: 2.5 + rng() * 2.2 })
    }
    return arr
  }, [count])

  const sc = useMemo(() => ({
    m: new THREE.Matrix4(), gm: new THREE.Matrix4(),
    p: new THREE.Vector3(), q: new THREE.Quaternion(), s1: new THREE.Vector3(1, 1, 1), sg: new THREE.Vector3(1, 1, 1),
  }), [])

  useFrame(({ camera, clock }) => {
    if (!bodyRef.current || !glowRef.current) return
    const { m, gm, p, q, s1, sg } = sc
    const cx = camera.position.x, cz = camera.position.z, t = clock.elapsedTime
    const dists: { idx: number; dist: number }[] = []

    for (let i = 0; i < count; i++) {
      const d = data[i], dx = d.x - cx, dz = d.z - cz
      const distSq = dx * dx + dz * dz
      if (distSq > CFG.recycleDist * CFG.recycleDist) {
        const a = Math.random() * Math.PI * 2, r = CFG.placeMin + Math.random() * (CFG.placeMax - CFG.placeMin)
        d.x = cx + Math.cos(a) * r; d.z = cz + Math.sin(a) * r; d.y = 2.5 + Math.random() * 2.2
      }
      const sway = Math.sin(t * 1.2 + d.x + d.z) * 0.08
      const px = d.x + sway, py = d.y, pz = d.z + Math.cos(t * 0.9 + d.x) * 0.06
      p.set(px, py, pz); q.identity()

      m.compose(p, q, s1); bodyRef.current.setMatrixAt(i, m)
      const glowPulse = 1 + Math.sin(t * 3 + i * 1.7) * 0.15
      sg.set(glowPulse, glowPulse, glowPulse)
      gm.compose(p, q, sg); glowRef.current.setMatrixAt(i, gm)

      dists.push({ idx: i, dist: distSq })
    }
    bodyRef.current.instanceMatrix.needsUpdate = true
    glowRef.current.instanceMatrix.needsUpdate = true

    dists.sort((a, b) => a.dist - b.dist)
    for (let i = 0; i < lightsRef.current.length; i++) {
      const light = lightsRef.current[i]
      if (!light || i >= dists.length) { if (light) light.visible = false; continue }
      const d = data[dists[i].idx]
      const flicker = 0.5 + Math.sin(t * 5 + i * 2.3) * 0.12 + Math.sin(t * 8.7 + i * 4.1) * 0.08
      light.position.set(d.x, d.y, d.z)
      light.intensity = flicker
      light.visible = true
    }
  })

  return (
    <group>
      <instancedMesh ref={bodyRef} args={[bodyGeo, bodyMat, count]} frustumCulled={false} />
      <instancedMesh ref={glowRef} args={[glowGeo, glowMat, count]} frustumCulled={false} />
      {Array.from({ length: 6 }, (_, i) => (
        <pointLight
          key={i}
          ref={(el) => { if (el) lightsRef.current[i] = el }}
          color={0xdd8833}
          intensity={0.5}
          distance={12}
          decay={2}
          castShadow={i < 2}
          shadow-mapSize-width={256}
          shadow-mapSize-height={256}
          shadow-bias={-0.005}
        />
      ))}
    </group>
  )
}

// ─── Stars ──────────────────────────────────────────────
function Stars({ count = 900 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null!)
  const { camera } = useThree()
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const p = new Float32Array(count * 3)
    const rng = mulberry32(12345)
    for (let i = 0; i < count; i++) {
      const theta = rng() * Math.PI * 2
      const phi = Math.acos(rng() * 0.85)
      const r = 95
      p[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      p[i * 3 + 1] = r * Math.cos(phi)
      p[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3))
    return g
  }, [count])

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.copy(camera.position)
    const mat = ref.current.material as THREE.PointsMaterial
    mat.opacity = 0.35 + Math.sin(clock.elapsedTime * 0.4) * 0.08
  })

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color={0x99aacc} size={1.2} transparent opacity={0.4} sizeAttenuation={false} fog={false} depthWrite={false} />
    </points>
  )
}

// ─── Logo Constellation ─────────────────────────────────
function LogoConstellation() {
  const groupRef = useRef<THREE.Group>(null!)
  const starsRef = useRef<THREE.Points>(null!)
  const { camera } = useThree()

  const { starGeo, lineGeo } = useMemo(() => {
    const verts: [number, number][] = [
      [0, 0.5],       // 0: apex
      [-0.5, -0.5],   // 1: bottom-left
      [0.5, -0.5],    // 2: bottom-right
      [0, -0.5],      // 3: bottom-center
      [-0.22, 0.05],  // 4: inner-left (on outer left edge)
      [0.22, 0.05],   // 5: inner-right (on outer right edge)
    ]
    const edges: [number, number][] = [
      [0, 4], [4, 1],
      [1, 3], [3, 2],
      [2, 5], [5, 0],
      [0, 3],
      [4, 3], [5, 3],
    ]

    const skyR = 95, scale = 14
    const elev = 25 * Math.PI / 180
    const cDir = new THREE.Vector3(0, Math.sin(elev), -Math.cos(elev))
    const center = cDir.clone().multiplyScalar(skyR)
    const right = new THREE.Vector3(1, 0, 0)
    const up = new THREE.Vector3().crossVectors(right, cDir).normalize()

    const pts = verts.map(([lx, ly]) =>
      center.clone().addScaledVector(right, lx * scale).addScaledVector(up, ly * scale).normalize().multiplyScalar(skyR)
    )

    const sp = new Float32Array(pts.length * 3)
    pts.forEach((p, i) => { sp[i * 3] = p.x; sp[i * 3 + 1] = p.y; sp[i * 3 + 2] = p.z })
    const sg = new THREE.BufferGeometry()
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3))

    const lp: number[] = []
    edges.forEach(([a, b]) => { lp.push(pts[a].x, pts[a].y, pts[a].z, pts[b].x, pts[b].y, pts[b].z) })
    const lg = new THREE.BufferGeometry()
    lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3))

    return { starGeo: sg, lineGeo: lg }
  }, [])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    groupRef.current.position.copy(camera.position)
    if (starsRef.current) {
      const mat = starsRef.current.material as THREE.PointsMaterial
      mat.opacity = 0.65 + Math.sin(clock.elapsedTime * 0.7) * 0.15
    }
  })

  return (
    <group ref={groupRef}>
      <points ref={starsRef} geometry={starGeo}>
        <pointsMaterial color={0xccddff} size={2.8} transparent opacity={0.7} sizeAttenuation={false} fog={false} depthWrite={false} />
      </points>
      <lineSegments geometry={lineGeo}>
        <lineBasicMaterial color={0x667799} transparent opacity={0.1} fog={false} depthWrite={false} />
      </lineSegments>
    </group>
  )
}

// ─── Drifting Clouds ────────────────────────────────────
function Clouds() {
  const groupRef = useRef<THREE.Group>(null!)
  const { camera } = useThree()

  const cloudData = useMemo(() => {
    const rng = mulberry32(888)
    return Array.from({ length: 22 }, () => ({
      offX: (rng() - 0.5) * 180,
      y: 22 + rng() * 30,
      offZ: (rng() - 0.5) * 180,
      w: 18 + rng() * 40,
      h: 10 + rng() * 22,
      speed: 0.08 + rng() * 0.18,
      rot: rng() * Math.PI,
      opacity: 0.03 + rng() * 0.05,
      tint: rng() > 0.6 ? 0x1c2030 : 0x141420,
    }))
  }, [])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime
    groupRef.current.children.forEach((child, i) => {
      const d = cloudData[i]
      if (!d) return
      let x = d.offX + d.speed * t
      x = ((x + 90) % 180) - 90
      child.position.set(camera.position.x + x, d.y, camera.position.z + d.offZ + Math.sin(t * 0.015 + i) * 8)
    })
  })

  return (
    <group ref={groupRef}>
      {cloudData.map((d, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, d.rot]}>
          <planeGeometry args={[d.w, d.h]} />
          <meshBasicMaterial color={d.tint} transparent opacity={d.opacity} side={THREE.DoubleSide} fog={false} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

// ─── Moon (with shadow-casting light) ───────────────────
function Moon() {
  const groupRef = useRef<THREE.Group>(null!)
  const lightRef = useRef<THREE.DirectionalLight>(null!)
  const { camera } = useThree()

  useFrame(() => {
    if (!groupRef.current || !lightRef.current) return
    const cx = camera.position.x, cz = camera.position.z
    groupRef.current.position.set(cx - 25, 48, cz - 55)
    groupRef.current.lookAt(cx, CFG.cameraHeight, cz)
    lightRef.current.position.set(cx - 25, 48, cz - 55)
    lightRef.current.target.position.set(cx, 0, cz)
    lightRef.current.target.updateMatrixWorld()
  })

  return (
    <>
      <group ref={groupRef}>
        <mesh>
          <circleGeometry args={[3, 32]} />
          <meshBasicMaterial color={0xc8d8ee} fog={false} />
        </mesh>
      </group>
      <directionalLight
        ref={lightRef}
        color={0x7799cc}
        intensity={0.4}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={90}
        shadow-camera-left={-28}
        shadow-camera-right={28}
        shadow-camera-top={28}
        shadow-camera-bottom={-28}
        shadow-camera-near={10}
        shadow-bias={-0.002}
      />
    </>
  )
}

// ─── Fox ────────────────────────────────────────────────
function Fox() {
  const group = useRef<THREE.Group>(null!)
  const bodyGroup = useRef<THREE.Group>(null!)
  const legFL = useRef<THREE.Mesh>(null!)
  const legFR = useRef<THREE.Mesh>(null!)
  const legBL = useRef<THREE.Mesh>(null!)
  const legBR = useRef<THREE.Mesh>(null!)
  const tail = useRef<THREE.Mesh>(null!)
  const legGeo = useMemo(() => { const g = new THREE.CylinderGeometry(0.018, 0.022, 0.2, 4); g.translate(0, -0.1, 0); return g }, [])
  const state = useRef({ active: false, x: 0, z: 0, velX: 0, velZ: 0, rotY: 0, runTime: 0, nextSpawn: 6 + Math.random() * 8 })

  useFrame(({ camera, clock }, delta) => {
    const s = state.current, t = clock.elapsedTime
    if (!s.active) {
      if (t < s.nextSpawn) return
      const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion); fwd.y = 0; fwd.normalize()
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion); right.y = 0; right.normalize()
      const side = Math.random() > 0.5 ? 1 : -1, ahead = 12 + Math.random() * 10, lat = 14 + Math.random() * 6
      s.x = camera.position.x + fwd.x * ahead + right.x * side * lat
      s.z = camera.position.z + fwd.z * ahead + right.z * side * lat
      const speed = 5 + Math.random() * 2.5
      s.velX = -right.x * side * speed; s.velZ = -right.z * side * speed
      s.rotY = Math.atan2(s.velX, s.velZ); s.runTime = 0; s.active = true
      if (group.current) group.current.visible = true
      return
    }
    s.runTime += delta; s.x += s.velX * delta; s.z += s.velZ * delta
    if (group.current) { group.current.position.set(s.x, 0, s.z); group.current.rotation.y = s.rotY }
    const cycle = s.runTime * 14
    if (bodyGroup.current) bodyGroup.current.position.y = 0.28 + Math.abs(Math.sin(cycle)) * 0.035
    if (legFL.current) legFL.current.rotation.x = Math.sin(cycle) * 0.7
    if (legFR.current) legFR.current.rotation.x = -Math.sin(cycle) * 0.7
    if (legBL.current) legBL.current.rotation.x = -Math.sin(cycle) * 0.6
    if (legBR.current) legBR.current.rotation.x = Math.sin(cycle) * 0.6
    if (tail.current) { tail.current.rotation.x = -0.5 + Math.sin(cycle * 0.4) * 0.25; tail.current.rotation.z = Math.sin(cycle * 0.3) * 0.15 }
    const dx = s.x - camera.position.x, dz = s.z - camera.position.z
    if (dx * dx + dz * dz > 2500 || s.runTime > 8) { s.active = false; s.nextSpawn = t + 18 + Math.random() * 25; if (group.current) group.current.visible = false }
  })

  const foxMat = { color: CFG.foxColor, roughness: 0.85 }
  return (
    <group ref={group} visible={false}>
      <group ref={bodyGroup} position={[0, 0.28, 0]}>
        <mesh castShadow><boxGeometry args={[0.22, 0.17, 0.5]} /><meshStandardMaterial {...foxMat} /></mesh>
        <mesh position={[0, 0.04, 0.32]}><boxGeometry args={[0.16, 0.14, 0.2]} /><meshStandardMaterial {...foxMat} /></mesh>
        <mesh position={[0, 0.0, 0.46]}><boxGeometry args={[0.07, 0.06, 0.1]} /><meshStandardMaterial {...foxMat} /></mesh>
        <mesh position={[-0.05, 0.14, 0.32]}><coneGeometry args={[0.03, 0.08, 4]} /><meshStandardMaterial {...foxMat} /></mesh>
        <mesh position={[0.05, 0.14, 0.32]}><coneGeometry args={[0.03, 0.08, 4]} /><meshStandardMaterial {...foxMat} /></mesh>
      </group>
      <mesh ref={tail} position={[0, 0.28, -0.32]} rotation={[-0.5, 0, 0]}><cylinderGeometry args={[0.01, 0.055, 0.35, 5]} /><meshStandardMaterial {...foxMat} /></mesh>
      <mesh ref={legFL} position={[-0.07, 0.2, 0.16]} geometry={legGeo}><meshStandardMaterial {...foxMat} /></mesh>
      <mesh ref={legFR} position={[0.07, 0.2, 0.16]} geometry={legGeo}><meshStandardMaterial {...foxMat} /></mesh>
      <mesh ref={legBL} position={[-0.07, 0.2, -0.16]} geometry={legGeo}><meshStandardMaterial {...foxMat} /></mesh>
      <mesh ref={legBR} position={[0.07, 0.2, -0.16]} geometry={legGeo}><meshStandardMaterial {...foxMat} /></mesh>
    </group>
  )
}

// ─── Snow (dark particles) ──────────────────────────────
function Snow({ count = 2500 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null!)
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry(), p = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) { p[i * 3] = (Math.random() - 0.5) * 80; p[i * 3 + 1] = Math.random() * 25; p[i * 3 + 2] = (Math.random() - 0.5) * 80 }
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); return g
  }, [count])

  useFrame(({ clock, camera }) => {
    if (!ref.current) return
    const arr = ref.current.geometry.attributes.position.array as Float32Array
    const cx = camera.position.x, cz = camera.position.z, t = clock.elapsedTime
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      arr[i3 + 1] -= 0.007 + (i % 7) * 0.001
      arr[i3] += Math.sin(t * 0.3 + i * 0.1) * 0.004
      arr[i3 + 2] += Math.cos(t * 0.2 + i * 0.05) * 0.003
      if (arr[i3 + 1] < -0.3) { arr[i3 + 1] = 20 + Math.random() * 5; arr[i3] = cx + (Math.random() - 0.5) * 60; arr[i3 + 2] = cz + (Math.random() - 0.5) * 60 }
      const dx = arr[i3] - cx, dz = arr[i3 + 2] - cz
      if (dx * dx + dz * dz > 1600) { const a = Math.random() * Math.PI * 2; arr[i3] = cx + Math.cos(a) * 30; arr[i3 + 2] = cz + Math.sin(a) * 30 }
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return <points ref={ref} geometry={geo}><pointsMaterial color={0x3a3f48} size={0.05} transparent opacity={0.35} sizeAttenuation depthWrite={false} /></points>
}

// ─── Low Mist ───────────────────────────────────────────
function Mist({ count = 200 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null!)
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry(), p = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) { p[i * 3] = (Math.random() - 0.5) * 80; p[i * 3 + 1] = Math.random() * 3.5; p[i * 3 + 2] = (Math.random() - 0.5) * 80 }
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); return g
  }, [count])

  useFrame(({ clock, camera }) => {
    if (!ref.current) return
    const arr = ref.current.geometry.attributes.position.array as Float32Array
    const cx = camera.position.x, cz = camera.position.z, t = clock.elapsedTime
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      arr[i3] += Math.sin(t * 0.08 + i) * 0.004; arr[i3 + 1] += Math.sin(t * 0.12 + i * 2) * 0.0015; arr[i3 + 2] += Math.cos(t * 0.06 + i * 0.5) * 0.004
      if (arr[i3 + 1] > 4) arr[i3 + 1] = 0.2; if (arr[i3 + 1] < 0) arr[i3 + 1] = 3
      const dx = arr[i3] - cx, dz = arr[i3 + 2] - cz
      if (dx * dx + dz * dz > 1600) { const a = Math.random() * Math.PI * 2; arr[i3] = cx + Math.cos(a) * 30; arr[i3 + 2] = cz + Math.sin(a) * 30 }
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return <points ref={ref} geometry={geo}><pointsMaterial color={0x1a1a24} size={3.5} transparent opacity={0.07} sizeAttenuation depthWrite={false} /></points>
}

// ─── Falling Leaves ─────────────────────────────────────
interface FLeafData {
  x: number; y: number; z: number
  vy: number
  rx: number; ry: number; rz: number
  drx: number; dry: number; drz: number
  scale: number; phase: number
}

function FallingLeaves({ count = 300 }: { count?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null!)
  const { camera } = useThree()

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const s = 0.04, w = 0.025
    g.setAttribute('position', new THREE.Float32BufferAttribute([0, s, 0, -w, s * 0.5, 0, 0, 0, 0, w, s * 0.5, 0], 3))
    g.setIndex([0, 1, 2, 0, 2, 3])
    g.computeVertexNormals()
    return g
  }, [])

  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: CFG.leafColor, roughness: 0.9, side: THREE.DoubleSide,
  }), [])

  const data = useMemo(() => {
    const arr: FLeafData[] = [], rng = mulberry32(1234)
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (rng() - 0.5) * 60, y: rng() * 18 + 2, z: (rng() - 0.5) * 60,
        vy: -0.3 - rng() * 0.5,
        rx: rng() * Math.PI * 2, ry: rng() * Math.PI * 2, rz: rng() * Math.PI * 2,
        drx: (rng() - 0.5) * 2.5, dry: (rng() - 0.5) * 3, drz: (rng() - 0.5) * 1.8,
        scale: 0.6 + rng() * 1.4, phase: rng() * Math.PI * 2,
      })
    }
    return arr
  }, [count])

  const sc = useMemo(() => ({
    m: new THREE.Matrix4(), q: new THREE.Quaternion(),
    s: new THREE.Vector3(), p: new THREE.Vector3(),
    e: new THREE.Euler(0, 0, 0, 'YXZ'),
  }), [])

  useFrame(({ clock }, delta) => {
    if (!ref.current) return
    const { m, q, s, p, e } = sc
    const cx = camera.position.x, cz = camera.position.z, t = clock.elapsedTime

    for (let i = 0; i < count; i++) {
      const d = data[i]
      const windX = Math.sin(t * 0.5 + d.phase) * 0.9 + Math.sin(t * 0.18 + d.phase * 2.3) * 0.4
      const windZ = Math.cos(t * 0.35 + d.phase * 1.5) * 0.7 + Math.cos(t * 0.12 + d.phase) * 0.25
      d.x += windX * delta
      d.y += d.vy * delta
      d.z += windZ * delta
      d.rx += d.drx * delta
      d.ry += d.dry * delta
      d.rz += d.drz * delta

      if (d.y < -0.3) {
        d.y = 10 + Math.random() * 12
        d.x = cx + (Math.random() - 0.5) * 50
        d.z = cz + (Math.random() - 0.5) * 50
      }
      const dx = d.x - cx, dz = d.z - cz
      if (dx * dx + dz * dz > 1600) {
        const a = Math.random() * Math.PI * 2
        d.x = cx + Math.cos(a) * 25; d.z = cz + Math.sin(a) * 25
        d.y = 5 + Math.random() * 15
      }

      e.set(d.rx, d.ry, d.rz); q.setFromEuler(e)
      p.set(d.x, d.y, d.z); s.set(d.scale, d.scale, d.scale)
      m.compose(p, q, s); ref.current.setMatrixAt(i, m)
    }
    ref.current.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={ref} args={[geo, mat, count]} frustumCulled={false} />
}

// ─── Ground ─────────────────────────────────────────────
const groundClip = [new THREE.Plane(new THREE.Vector3(0, 0, 1), -(CLIFF_Z + 1))]

function Ground() {
  const ref = useRef<THREE.Mesh>(null!)
  const { camera } = useThree()
  useFrame(() => { if (ref.current) { ref.current.position.x = camera.position.x; ref.current.position.z = camera.position.z } })
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
      <planeGeometry args={[400, 400]} />
      <meshStandardMaterial color={CFG.groundColor} roughness={1} metalness={0} clippingPlanes={groundClip} />
    </mesh>
  )
}

// ─── Camera Controller ──────────────────────────────────
const JOY_DEAD = 10, JOY_MAX = 50, JOY_LOOK_SENS = 1.1
type Joy = { active: boolean; id: number; ox: number; oy: number; dx: number; dy: number }
const joyDefault = (): Joy => ({ active: false, id: -1, ox: 0, oy: 0, dx: 0, dy: 0 })

function makeJoystickEl(size: number, isFill: boolean) {
  const el = document.createElement('div')
  const s = el.style
  s.position = 'fixed'; s.width = s.height = `${size}px`; s.borderRadius = '50%'
  s.pointerEvents = 'none'; s.zIndex = '200'; s.display = 'none'
  s.transition = 'opacity 0.15s'
  if (isFill) {
    s.background = 'rgba(255,255,255,0.1)'; s.border = '1px solid rgba(255,255,255,0.22)'
  } else {
    s.border = '1.5px solid rgba(255,255,255,0.15)'
  }
  document.body.appendChild(el)
  return el
}

function CameraController({ onInteract }: { onInteract?: () => void }) {
  const { camera, gl } = useThree()
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const velocity = useRef(new THREE.Vector3())
  const keys = useRef(new Set<string>())
  const autoWalk = useRef(true)
  const mouse = useRef({ x: 0, y: 0 })
  const locked = useRef(false)
  const elapsed = useRef(0)
  const interacted = useRef(false)
  const moveDir = useRef(new THREE.Vector3())
  const yawEuler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const isMobile = useRef(false)
  const moveJoy = useRef(joyDefault())
  const lookJoy = useRef(joyDefault())
  const joyEls = useRef<{
    mO: HTMLDivElement; mI: HTMLDivElement; lO: HTMLDivElement; lI: HTMLDivElement
    mRest: HTMLDivElement; mRestDot: HTMLDivElement; lRest: HTMLDivElement; lRestDot: HTMLDivElement
  } | null>(null)

  useEffect(() => {
    camera.position.set(0, CFG.cameraHeight, 0); camera.quaternion.setFromEuler(euler.current)
    isMobile.current = 'ontouchstart' in window

    if (isMobile.current) {
      const outerSize = 90, innerSize = 34

      const makeRest = (left: string, label: string) => {
        const wrap = document.createElement('div')
        const ws = wrap.style
        ws.position = 'fixed'; ws.bottom = '72px'; ws.left = left
        ws.width = '70px'; ws.height = '70px'; ws.borderRadius = '50%'
        ws.border = '1.5px solid rgba(255,255,255,0.12)'
        ws.pointerEvents = 'none'; ws.zIndex = '150'
        ws.display = 'flex'; ws.alignItems = 'center'; ws.justifyContent = 'center'
        const dot = document.createElement('div')
        const ds = dot.style
        ds.width = '22px'; ds.height = '22px'; ds.borderRadius = '50%'
        ds.background = 'rgba(255,255,255,0.08)'
        ds.border = '1px solid rgba(255,255,255,0.15)'
        wrap.appendChild(dot)
        const lbl = document.createElement('div')
        const ls = lbl.style
        ls.position = 'absolute'; ls.bottom = '-20px'; ls.left = '50%'
        ls.transform = 'translateX(-50%)'; ls.whiteSpace = 'nowrap'
        ls.fontSize = '9px'; ls.letterSpacing = '0.08em'; ls.textTransform = 'uppercase'
        ls.color = 'rgba(255,255,255,0.18)'; ls.fontFamily = 'sans-serif'
        ls.pointerEvents = 'none'
        lbl.textContent = label
        wrap.appendChild(lbl)
        document.body.appendChild(wrap)
        return { wrap, dot }
      }

      const mRest = makeRest('calc(25% - 35px)', 'Move')
      const lRest = makeRest('calc(75% - 35px)', 'Look')

      joyEls.current = {
        mO: makeJoystickEl(outerSize, false), mI: makeJoystickEl(innerSize, true),
        lO: makeJoystickEl(outerSize, false), lI: makeJoystickEl(innerSize, true),
        mRest: mRest.wrap, mRestDot: mRest.dot,
        lRest: lRest.wrap, lRestDot: lRest.dot,
      }
    }

    const mKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD']
    const onKD = (e: KeyboardEvent) => { keys.current.add(e.code); if (mKeys.includes(e.code)) { e.preventDefault(); if (autoWalk.current) autoWalk.current = false; if (!interacted.current) { interacted.current = true; onInteract?.() } } }
    const onKU = (e: KeyboardEvent) => keys.current.delete(e.code)
    const onMM = (e: MouseEvent) => {
      if (document.pointerLockElement === gl.domElement) { euler.current.y -= e.movementX * CFG.mouseSens; euler.current.x -= e.movementY * CFG.mouseSens; euler.current.x = Math.max(-1.2, Math.min(1.2, euler.current.x)) }
      else { mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2; mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2 }
    }
    const onCl = () => {
      if (!interacted.current) { interacted.current = true; onInteract?.() }
      if (isMobile.current) return
      if (locked.current) document.exitPointerLock(); else gl.domElement.requestPointerLock?.()
    }
    const onLC = () => { locked.current = document.pointerLockElement === gl.domElement }

    const halfW = () => window.innerWidth / 2
    const onTS = (e: TouchEvent) => {
      if (autoWalk.current) autoWalk.current = false
      if (!interacted.current) { interacted.current = true; onInteract?.() }
      for (const t of Array.from(e.changedTouches)) {
        if (t.clientX < halfW() && !moveJoy.current.active) {
          moveJoy.current = { active: true, id: t.identifier, ox: t.clientX, oy: t.clientY, dx: 0, dy: 0 }
        } else if (t.clientX >= halfW() && !lookJoy.current.active) {
          lookJoy.current = { active: true, id: t.identifier, ox: t.clientX, oy: t.clientY, dx: 0, dy: 0 }
        }
      }
    }
    const onTM = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === moveJoy.current.id) {
          moveJoy.current.dx = t.clientX - moveJoy.current.ox
          moveJoy.current.dy = t.clientY - moveJoy.current.oy
        } else if (t.identifier === lookJoy.current.id) {
          lookJoy.current.dx = t.clientX - lookJoy.current.ox
          lookJoy.current.dy = t.clientY - lookJoy.current.oy
        }
      }
    }
    const endJoy = (id: number) => {
      if (id === moveJoy.current.id) moveJoy.current = joyDefault()
      if (id === lookJoy.current.id) lookJoy.current = joyDefault()
    }
    const onTE = (e: TouchEvent) => { for (const t of Array.from(e.changedTouches)) endJoy(t.identifier) }

    window.addEventListener('keydown', onKD); window.addEventListener('keyup', onKU)
    window.addEventListener('mousemove', onMM)
    gl.domElement.addEventListener('click', onCl); document.addEventListener('pointerlockchange', onLC)
    window.addEventListener('touchstart', onTS, { passive: true })
    window.addEventListener('touchmove', onTM, { passive: true })
    window.addEventListener('touchend', onTE)
    window.addEventListener('touchcancel', onTE)

    return () => {
      window.removeEventListener('keydown', onKD); window.removeEventListener('keyup', onKU)
      window.removeEventListener('mousemove', onMM)
      gl.domElement.removeEventListener('click', onCl); document.removeEventListener('pointerlockchange', onLC)
      window.removeEventListener('touchstart', onTS)
      window.removeEventListener('touchmove', onTM)
      window.removeEventListener('touchend', onTE)
      window.removeEventListener('touchcancel', onTE)
      if (joyEls.current) {
        joyEls.current.mO.remove(); joyEls.current.mI.remove()
        joyEls.current.lO.remove(); joyEls.current.lI.remove()
        joyEls.current.mRest.remove(); joyEls.current.lRest.remove()
      }
    }
  }, [camera, gl, onInteract])

  useFrame((_, delta) => {
    elapsed.current += delta; const md = moveDir.current
    if (autoWalk.current) {
      const dx = camera.position.x - CFG.houseX, dz = camera.position.z - CFG.houseZ
      const distToHouse = Math.sqrt(dx * dx + dz * dz)
      const stopInner = 12, stopOuter = 35
      if (distToHouse <= stopInner) {
        autoWalk.current = false
        md.set(0, 0, 0)
      } else {
        const approach = Math.min(1, Math.max(0, (distToHouse - stopInner) / (stopOuter - stopInner)))
        const ease = approach * approach * (3 - 2 * approach)
        const t = Math.max(0, elapsed.current - CFG.autoDelay), speed = Math.min(1, t / CFG.autoRamp) * CFG.autoSpeed * ease
        if (!locked.current) { euler.current.y += (-mouse.current.x * 0.35 - euler.current.y) * 0.015; euler.current.x += (-mouse.current.y * 0.12 - euler.current.x) * 0.015 }
        euler.current.y += Math.sin(elapsed.current * 0.2) * 0.0003
        md.set(0, 0, -1); yawEuler.current.set(0, euler.current.y, 0); md.applyEuler(yawEuler.current); md.multiplyScalar(speed)
      }
    } else {
      if (!locked.current && !isMobile.current) {
        euler.current.y += (-mouse.current.x * 0.6 - euler.current.y) * 0.04
        euler.current.x += (-mouse.current.y * 0.25 - euler.current.x) * 0.04
      }

      md.set(0, 0, 0)

      const mj = moveJoy.current
      if (isMobile.current && mj.active) {
        const dist = Math.sqrt(mj.dx * mj.dx + mj.dy * mj.dy)
        if (dist > JOY_DEAD) {
          const strength = Math.min(1, (dist - JOY_DEAD) / (JOY_MAX - JOY_DEAD))
          md.set(mj.dx / dist, 0, mj.dy / dist)
          yawEuler.current.set(0, euler.current.y, 0); md.applyEuler(yawEuler.current)
          md.multiplyScalar(CFG.mobileSpeed * strength)
        }
      }

      const lj = lookJoy.current
      if (isMobile.current && lj.active) {
        const dist = Math.sqrt(lj.dx * lj.dx + lj.dy * lj.dy)
        if (dist > JOY_DEAD) {
          const strength = Math.min(1, (dist - JOY_DEAD) / (JOY_MAX - JOY_DEAD))
          euler.current.y -= (lj.dx / dist) * JOY_LOOK_SENS * strength * delta
          euler.current.x -= (lj.dy / dist) * JOY_LOOK_SENS * strength * delta * 0.7
          euler.current.x = Math.max(-1.2, Math.min(1.2, euler.current.x))
        }
      }

      if (!isMobile.current) {
        if (keys.current.has('ArrowUp') || keys.current.has('KeyW')) md.z -= 1
        if (keys.current.has('ArrowDown') || keys.current.has('KeyS')) md.z += 1
        if (keys.current.has('ArrowLeft') || keys.current.has('KeyA')) md.x -= 1
        if (keys.current.has('ArrowRight') || keys.current.has('KeyD')) md.x += 1
        if (md.lengthSq() > 0) { md.normalize(); yawEuler.current.set(0, euler.current.y, 0); md.applyEuler(yawEuler.current); md.multiplyScalar(CFG.moveSpeed) }
      }
    }

    const blend = 1 - Math.exp(-(autoWalk.current ? 3 : 8) * delta)
    velocity.current.x += (md.x - velocity.current.x) * blend; velocity.current.z += (md.z - velocity.current.z) * blend
    camera.position.x += velocity.current.x * delta; camera.position.z += velocity.current.z * delta; camera.position.y = CFG.cameraHeight
    if (camera.position.z < CLIFF_Z + 0.3) { camera.position.z = CLIFF_Z + 0.3; velocity.current.z = 0 }
    camera.quaternion.setFromEuler(euler.current)

    // Update joystick visuals
    const els = joyEls.current
    if (els) {
      const outerR = 45, innerR = 17
      const show = (o: HTMLDivElement, i: HTMLDivElement, j: Joy) => {
        if (j.active) {
          o.style.display = 'block'; i.style.display = 'block'
          o.style.left = `${j.ox - outerR}px`; o.style.top = `${j.oy - outerR}px`
          const d = Math.sqrt(j.dx * j.dx + j.dy * j.dy)
          const clamp = Math.min(outerR - innerR, d)
          const a = d > 0.5 ? Math.atan2(j.dy, j.dx) : 0
          i.style.left = `${j.ox + Math.cos(a) * clamp - innerR}px`
          i.style.top = `${j.oy + Math.sin(a) * clamp - innerR}px`
        } else { o.style.display = 'none'; i.style.display = 'none' }
      }
      show(els.mO, els.mI, moveJoy.current)
      show(els.lO, els.lI, lookJoy.current)
      els.mRest.style.opacity = moveJoy.current.active ? '0' : '1'
      els.lRest.style.opacity = lookJoy.current.active ? '0' : '1'
    }
  })

  return null
}

// ─── Tattoo Stencil Drawing Functions ───────────────────
type DrawFn = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) => void

function drawSkull(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const s = (v: number) => v * r
  // Cranium
  ctx.beginPath(); ctx.ellipse(cx, cy - s(0.12), s(0.48), s(0.55), 0, Math.PI, 0, true); ctx.stroke()
  // Jaw sides
  ctx.beginPath(); ctx.moveTo(cx - s(0.48), cy - s(0.12))
  ctx.bezierCurveTo(cx - s(0.5), cy + s(0.2), cx - s(0.35), cy + s(0.45), cx - s(0.15), cy + s(0.48))
  ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx + s(0.48), cy - s(0.12))
  ctx.bezierCurveTo(cx + s(0.5), cy + s(0.2), cx + s(0.35), cy + s(0.45), cx + s(0.15), cy + s(0.48))
  ctx.stroke()
  // Chin
  ctx.beginPath(); ctx.moveTo(cx - s(0.15), cy + s(0.48))
  ctx.quadraticCurveTo(cx, cy + s(0.55), cx + s(0.15), cy + s(0.48)); ctx.stroke()
  // Eye sockets
  ctx.beginPath(); ctx.ellipse(cx - s(0.18), cy - s(0.12), s(0.13), s(0.15), 0, 0, Math.PI * 2); ctx.stroke()
  ctx.beginPath(); ctx.ellipse(cx + s(0.18), cy - s(0.12), s(0.13), s(0.15), 0, 0, Math.PI * 2); ctx.stroke()
  // Nose cavity
  ctx.beginPath(); ctx.moveTo(cx - s(0.06), cy + s(0.1))
  ctx.quadraticCurveTo(cx, cy + s(0.22), cx + s(0.06), cy + s(0.1)); ctx.stroke()
  // Teeth
  ctx.lineWidth *= 0.7
  for (let i = -3; i <= 3; i++) {
    const tx = cx + i * s(0.045)
    ctx.beginPath(); ctx.moveTo(tx, cy + s(0.32)); ctx.lineTo(tx, cy + s(0.42)); ctx.stroke()
  }
  ctx.beginPath(); ctx.moveTo(cx - s(0.16), cy + s(0.32)); ctx.lineTo(cx + s(0.16), cy + s(0.32)); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx - s(0.16), cy + s(0.42)); ctx.lineTo(cx + s(0.16), cy + s(0.42)); ctx.stroke()
  // Brow detail
  ctx.beginPath(); ctx.moveTo(cx - s(0.35), cy - s(0.25))
  ctx.quadraticCurveTo(cx, cy - s(0.32), cx + s(0.35), cy - s(0.25)); ctx.stroke()
  // Temple lines
  ctx.beginPath(); ctx.moveTo(cx - s(0.4), cy - s(0.35))
  ctx.quadraticCurveTo(cx - s(0.3), cy - s(0.5), cx - s(0.1), cy - s(0.58)); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx + s(0.4), cy - s(0.35))
  ctx.quadraticCurveTo(cx + s(0.3), cy - s(0.5), cx + s(0.1), cy - s(0.58)); ctx.stroke()
}

function drawRose(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const s = (v: number) => v * r
  // Inner spiral
  ctx.beginPath()
  for (let a = 0; a < Math.PI * 4; a += 0.1) {
    const sr = s(0.02) + a * s(0.015)
    const x = cx + Math.cos(a) * sr, y = cy + Math.sin(a) * sr
    a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.stroke()
  // Petals (5 layers)
  for (let layer = 0; layer < 5; layer++) {
    const pr = s(0.12 + layer * 0.09)
    const petals = 5 + layer
    for (let i = 0; i < petals; i++) {
      const a = (i / petals) * Math.PI * 2 + layer * 0.3
      const px = cx + Math.cos(a) * pr * 0.3, py = cy + Math.sin(a) * pr * 0.3
      ctx.beginPath()
      ctx.ellipse(px + Math.cos(a) * pr * 0.5, py + Math.sin(a) * pr * 0.5, pr * 0.35, pr * 0.18, a, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
  // Leaves
  const drawLeaf = (lx: number, ly: number, angle: number, size: number) => {
    ctx.beginPath()
    ctx.ellipse(lx, ly, size, size * 0.35, angle, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(lx - Math.cos(angle) * size, ly - Math.sin(angle) * size)
    ctx.lineTo(lx + Math.cos(angle) * size, ly + Math.sin(angle) * size); ctx.stroke()
  }
  drawLeaf(cx - s(0.35), cy + s(0.45), -0.5, s(0.15))
  drawLeaf(cx + s(0.35), cy + s(0.45), 0.5, s(0.15))
  // Stem
  ctx.beginPath(); ctx.moveTo(cx, cy + s(0.35))
  ctx.bezierCurveTo(cx - s(0.05), cy + s(0.5), cx + s(0.05), cy + s(0.65), cx, cy + s(0.8)); ctx.stroke()
}

function drawMandala(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const s = (v: number) => v * r
  const rings = [0.15, 0.3, 0.48, 0.65, 0.82]
  rings.forEach(rv => { ctx.beginPath(); ctx.arc(cx, cy, s(rv), 0, Math.PI * 2); ctx.stroke() })
  // Radiating lines
  const spokes = 12
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * s(0.1), cy + Math.sin(a) * s(0.1))
    ctx.lineTo(cx + Math.cos(a) * s(0.82), cy + Math.sin(a) * s(0.82)); ctx.stroke()
  }
  // Petal shapes at rings
  for (let ri = 1; ri < rings.length; ri++) {
    const rv = s(rings[ri])
    const n = 6 + ri * 2
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + ri * 0.15
      const px = cx + Math.cos(a) * rv, py = cy + Math.sin(a) * rv
      ctx.beginPath(); ctx.arc(px, py, s(0.03 + ri * 0.008), 0, Math.PI * 2); ctx.stroke()
    }
  }
  // Inner ornament
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2, a2 = ((i + 0.5) / 6) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(a) * s(0.15), cy + Math.sin(a) * s(0.15))
    ctx.quadraticCurveTo(cx + Math.cos(a2) * s(0.25), cy + Math.sin(a2) * s(0.25),
      cx + Math.cos(a + Math.PI / 3) * s(0.15), cy + Math.sin(a + Math.PI / 3) * s(0.15))
    ctx.stroke()
  }
}

function drawMoth(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const s = (v: number) => v * r
  // Body
  ctx.beginPath(); ctx.ellipse(cx, cy, s(0.04), s(0.3), 0, 0, Math.PI * 2); ctx.stroke()
  // Upper wings
  const drawWing = (side: number) => {
    ctx.beginPath()
    ctx.moveTo(cx, cy - s(0.15))
    ctx.bezierCurveTo(cx + side * s(0.3), cy - s(0.55), cx + side * s(0.65), cy - s(0.45), cx + side * s(0.6), cy - s(0.1))
    ctx.bezierCurveTo(cx + side * s(0.55), cy + s(0.05), cx + side * s(0.15), cy + s(0.05), cx, cy + s(0.05))
    ctx.stroke()
    // Wing veins
    ctx.beginPath(); ctx.moveTo(cx, cy - s(0.1))
    ctx.lineTo(cx + side * s(0.45), cy - s(0.35)); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(cx, cy - s(0.05))
    ctx.lineTo(cx + side * s(0.5), cy - s(0.15)); ctx.stroke()
    // Eye spot
    ctx.beginPath(); ctx.arc(cx + side * s(0.35), cy - s(0.22), s(0.08), 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.arc(cx + side * s(0.35), cy - s(0.22), s(0.04), 0, Math.PI * 2); ctx.stroke()
  }
  drawWing(1); drawWing(-1)
  // Lower wings
  const drawLowerWing = (side: number) => {
    ctx.beginPath()
    ctx.moveTo(cx, cy + s(0.05))
    ctx.bezierCurveTo(cx + side * s(0.2), cy + s(0.1), cx + side * s(0.45), cy + s(0.15), cx + side * s(0.4), cy + s(0.35))
    ctx.bezierCurveTo(cx + side * s(0.3), cy + s(0.45), cx + side * s(0.1), cy + s(0.35), cx, cy + s(0.2))
    ctx.stroke()
  }
  drawLowerWing(1); drawLowerWing(-1)
  // Antennae
  ctx.beginPath(); ctx.moveTo(cx - s(0.02), cy - s(0.3))
  ctx.quadraticCurveTo(cx - s(0.15), cy - s(0.55), cx - s(0.12), cy - s(0.65)); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx + s(0.02), cy - s(0.3))
  ctx.quadraticCurveTo(cx + s(0.15), cy - s(0.55), cx + s(0.12), cy - s(0.65)); ctx.stroke()
  // Head
  ctx.beginPath(); ctx.arc(cx, cy - s(0.32), s(0.04), 0, Math.PI * 2); ctx.stroke()
}

function drawSnake(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const s = (v: number) => v * r
  // S-curve body (draw as thick path with two parallel lines)
  const pts: [number, number][] = []
  for (let t = 0; t <= 1; t += 0.02) {
    const x = cx + Math.sin(t * Math.PI * 2.5) * s(0.25) * (1 - t * 0.3)
    const y = cy - s(0.6) + t * s(1.2)
    pts.push([x, y])
  }
  // Body outline (two parallel curves)
  for (const offset of [-1, 1]) {
    ctx.beginPath()
    pts.forEach(([x, y], i) => {
      const w = s(0.04) * (1 - i / pts.length * 0.7)
      const nx = i < pts.length - 1 ? -(pts[i + 1][1] - y) : -(y - pts[Math.max(0, i - 1)][1])
      const ny = i < pts.length - 1 ? (pts[i + 1][0] - x) : (x - pts[Math.max(0, i - 1)][0])
      const len = Math.sqrt(nx * nx + ny * ny) || 1
      const px = x + (nx / len) * w * offset, py = y + (ny / len) * w * offset
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
    })
    ctx.stroke()
  }
  // Head (diamond)
  const hx = pts[0][0], hy = pts[0][1]
  ctx.beginPath()
  ctx.moveTo(hx, hy - s(0.1)); ctx.lineTo(hx + s(0.07), hy)
  ctx.lineTo(hx, hy + s(0.04)); ctx.lineTo(hx - s(0.07), hy); ctx.closePath(); ctx.stroke()
  // Eyes
  ctx.beginPath(); ctx.arc(hx - s(0.03), hy - s(0.02), s(0.012), 0, Math.PI * 2); ctx.stroke()
  ctx.beginPath(); ctx.arc(hx + s(0.03), hy - s(0.02), s(0.012), 0, Math.PI * 2); ctx.stroke()
  // Tongue
  ctx.beginPath(); ctx.moveTo(hx, hy - s(0.1))
  ctx.lineTo(hx - s(0.03), hy - s(0.16)); ctx.moveTo(hx, hy - s(0.1))
  ctx.lineTo(hx + s(0.02), hy - s(0.15)); ctx.stroke()
  // Scale pattern
  ctx.lineWidth *= 0.5
  for (let i = 4; i < pts.length - 4; i += 3) {
    const [x, y] = pts[i]
    ctx.beginPath(); ctx.arc(x, y, s(0.015), 0, Math.PI, true); ctx.stroke()
  }
}

function drawSacredGeo(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const s = (v: number) => v * r
  // Outer circle
  ctx.beginPath(); ctx.arc(cx, cy, s(0.75), 0, Math.PI * 2); ctx.stroke()
  // Large triangle
  for (const rot of [0, Math.PI]) {
    ctx.beginPath()
    for (let i = 0; i <= 3; i++) {
      const a = rot + (i / 3) * Math.PI * 2 - Math.PI / 2
      const x = cx + Math.cos(a) * s(0.65), y = cy + Math.sin(a) * s(0.65)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  // Inner circles
  ctx.beginPath(); ctx.arc(cx, cy, s(0.38), 0, Math.PI * 2); ctx.stroke()
  ctx.beginPath(); ctx.arc(cx, cy, s(0.18), 0, Math.PI * 2); ctx.stroke()
  // Moon phases at top
  ctx.beginPath(); ctx.arc(cx, cy - s(0.5), s(0.1), 0, Math.PI * 2); ctx.stroke()
  ctx.beginPath(); ctx.arc(cx - s(0.25), cy - s(0.45), s(0.06), Math.PI * 0.5, Math.PI * 1.5); ctx.stroke()
  ctx.beginPath(); ctx.arc(cx + s(0.25), cy - s(0.45), s(0.06), -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke()
  // Diamond in center
  ctx.beginPath()
  ctx.moveTo(cx, cy - s(0.15)); ctx.lineTo(cx + s(0.1), cy)
  ctx.lineTo(cx, cy + s(0.15)); ctx.lineTo(cx - s(0.1), cy); ctx.closePath(); ctx.stroke()
  // Dots at vertices
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    ctx.beginPath(); ctx.arc(cx + Math.cos(a) * s(0.38), cy + Math.sin(a) * s(0.38), s(0.015), 0, Math.PI * 2); ctx.fill()
  }
  // Radiating lines from center
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * s(0.18), cy + Math.sin(a) * s(0.18))
    ctx.lineTo(cx + Math.cos(a) * s(0.38), cy + Math.sin(a) * s(0.38)); ctx.stroke()
  }
}

const STENCIL_DRAWS: DrawFn[] = [drawSkull, drawRose, drawMandala, drawMoth, drawSnake, drawSacredGeo]

function createStencilTexture(drawFn: DrawFn): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512; canvas.height = 512
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, 512, 512)
  ctx.strokeStyle = 'rgba(170, 185, 210, 0.85)'
  ctx.fillStyle = 'rgba(170, 185, 210, 0.85)'
  ctx.lineWidth = 1.4
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  drawFn(ctx, 256, 256, 200)
  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

// ─── Tattoo Stencils (floating in the forest) ──────────
interface StencilEntry {
  x: number; z: number; y: number; scale: number
  designIdx: number; rotSpeed: number; rotOff: number; bobSpeed: number; bobAmp: number
}

function TattooStencils() {
  const groupRefs = useRef<(THREE.Group | null)[]>([])
  const { camera } = useThree()

  const [customTextures, setCustomTextures] = useState<THREE.Texture[]>([])
  const [customLoaded, setCustomLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/stencils/public')
      .then(r => r.ok ? r.json() : [])
      .then((items: { id: string; src: string }[]) => {
        if (cancelled || items.length === 0) { setCustomLoaded(true); return }
        const loader = new THREE.TextureLoader()
        const promises = items.map(item =>
          new Promise<THREE.Texture | null>(resolve => {
            loader.load(item.src, tex => resolve(tex), undefined, () => resolve(null))
          })
        )
        Promise.all(promises).then(results => {
          if (!cancelled) {
            setCustomTextures(results.filter((t): t is THREE.Texture => t !== null))
            setCustomLoaded(true)
          }
        })
      })
      .catch(() => { if (!cancelled) setCustomLoaded(true) })
    return () => { cancelled = true }
  }, [])

  const proceduralTextures = useMemo(() => {
    if (typeof document === 'undefined') return []
    return STENCIL_DRAWS.map(fn => createStencilTexture(fn))
  }, [])

  const textures = customLoaded && customTextures.length > 0 ? customTextures : proceduralTextures

  const materials = useMemo(() => {
    return textures.map(tex => new THREE.MeshBasicMaterial({
      map: tex, transparent: true, opacity: 0.45, side: THREE.DoubleSide,
      depthWrite: false, blending: THREE.AdditiveBlending, fog: true,
    }))
  }, [textures])

  const STENCIL_COUNT = 60
  const STENCIL_MIN_DIST = 8

  const data = useMemo(() => {
    const rng = mulberry32(999)
    const texCount = Math.max(textures.length, 1)
    const arr: StencilEntry[] = []
    for (let i = 0; i < STENCIL_COUNT; i++) {
      let x: number, z: number, tries = 0
      do {
        const a = rng() * Math.PI * 2, dist = 12 + rng() * (CFG.initRadius - 12)
        x = Math.cos(a) * dist; z = Math.sin(a) * dist
        tries++
        const hx = x - CFG.houseX, hz = z - CFG.houseZ
        if (hx * hx + hz * hz < CFG.houseR * CFG.houseR || onPath(x, z) || pastCliff(z)) continue
      } while (tries < 30 && arr.some(o => (o.x - x) ** 2 + (o.z - z) ** 2 < STENCIL_MIN_DIST ** 2))
      arr.push({
        x, z,
        y: 1.5 + rng() * 3.5, scale: 4 + rng() * 4,
        designIdx: i % texCount,
        rotSpeed: (0.04 + rng() * 0.1) * (rng() > 0.5 ? 1 : -1),
        rotOff: rng() * Math.PI * 2,
        bobSpeed: 0.15 + rng() * 0.25, bobAmp: 0.08 + rng() * 0.15,
      })
    }
    return arr
  }, [textures.length])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const cx = camera.position.x, cz = camera.position.z
    groupRefs.current.forEach((grp, i) => {
      if (!grp) return
      const d = data[i]
      const dx = d.x - cx, dz = d.z - cz
      if (dx * dx + dz * dz > CFG.recycleDist * CFG.recycleDist) {
        let tries = 0, nx: number, nz: number
        do {
          const a = Math.random() * Math.PI * 2
          const r = CFG.placeMin + Math.random() * (CFG.placeMax - CFG.placeMin)
          nx = cx + Math.cos(a) * r; nz = cz + Math.sin(a) * r
          tries++
          const hx = nx - CFG.houseX, hz = nz - CFG.houseZ
          if (hx * hx + hz * hz < CFG.houseR * CFG.houseR || onPath(nx, nz) || pastCliff(nz)) continue
        } while (tries < 15 && data.some((o, j) => j !== i && (o.x - nx!) ** 2 + (o.z - nz!) ** 2 < STENCIL_MIN_DIST ** 2))
        d.x = nx!; d.z = nz!
        d.y = 1.5 + Math.random() * 3.5
      }
      const shx = d.x - CFG.houseX, shz = d.z - CFG.houseZ
      if (shx * shx + shz * shz < CFG.houseR * CFG.houseR) {
        const ha = Math.atan2(shz, shx)
        d.x = CFG.houseX + Math.cos(ha) * (CFG.houseR + 2); d.z = CFG.houseZ + Math.sin(ha) * (CFG.houseR + 2)
      }
      if (onPath(d.x, d.z)) {
        d.x = (d.x >= 0 ? 1 : -1) * (CFG.pathHalfW + 1)
      }
      if (pastCliff(d.z)) d.z = CLIFF_Z + 5
      grp.position.set(d.x, d.y + Math.sin(t * d.bobSpeed) * d.bobAmp, d.z)
      grp.rotation.y = d.rotOff + t * d.rotSpeed
      grp.scale.setScalar(d.scale)
    })
  })

  if (!textures.length) return null

  return (
    <group>
      {data.map((d, i) => (
        <group key={i} ref={el => { groupRefs.current[i] = el }}>
          <mesh>
            <planeGeometry args={[1, 1]} />
            <primitive object={materials[d.designIdx]} attach="material" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ─── Sea Cliff (Faroe Islands basalt cliff) ─────────────
function SeaCliff() {
  const rockGeo = useMemo(() => {
    const rng = mulberry32(5000)
    const parts: THREE.BufferGeometry[] = []

    const body = new THREE.BoxGeometry(CLIFF_W, CLIFF_H, CLIFF_DEPTH)
    body.translate(0, -CLIFF_H / 2, CLIFF_Z - CLIFF_DEPTH / 2)
    parts.push(body)

    // Irregular cliff edge: segmented top with varying z offsets
    const edgeSegs = 60
    const segW = CLIFF_W / edgeSegs
    for (let i = 0; i < edgeSegs; i++) {
      const sx = -CLIFF_W / 2 + (i + 0.5) * segW
      const zOff = Math.sin(sx * 0.35) * 1.5 + Math.sin(sx * 0.8 + 2) * 0.8 + Math.sin(sx * 0.15) * 2
      const edgeH = 1.5 + rng() * 2.5
      const edgeD = 1.0 + rng() * 1.5 + Math.max(0, zOff)
      const g = new THREE.BoxGeometry(segW + 0.05, edgeH, edgeD)
      g.translate(sx, -edgeH / 2, CLIFF_Z + edgeD / 2 - 0.5)
      parts.push(g)
    }

    // Scattered boulders along the cliff edge for extra roughness
    for (let i = 0; i < 40; i++) {
      const bx = (rng() - 0.5) * CLIFF_W * 0.92
      const zOff = Math.sin(bx * 0.35) * 1.5 + Math.sin(bx * 0.8 + 2) * 0.8 + Math.sin(bx * 0.15) * 2
      const bw = 0.5 + rng() * 1.8
      const bh = 0.3 + rng() * 1.2
      const bd = 0.4 + rng() * 1.2
      const g = new THREE.BoxGeometry(bw, bh, bd)
      g.translate(bx, -bh * 0.6 - rng() * 0.3, CLIFF_Z + zOff * 0.6 + rng() * 1.2)
      parts.push(g)
    }

    // Rocky face detail
    for (let i = 0; i < 300; i++) {
      const w = 0.8 + rng() * 3
      const h = 0.4 + rng() * 3.5
      const d = 0.2 + rng() * 1.2
      const fx = (rng() - 0.5) * CLIFF_W * 0.96
      const zOff = Math.sin(fx * 0.35) * 0.8 + Math.sin(fx * 0.8 + 2) * 0.5
      const g = new THREE.BoxGeometry(w, h, d)
      g.translate(fx, -rng() * CLIFF_H * 0.95, CLIFF_Z + d / 2 + rng() * 0.3 + zOff * 0.3)
      parts.push(g)
    }

    // Ledges and overhangs
    for (let i = 0; i < 50; i++) {
      const w = 1 + rng() * 4
      const h = 0.12 + rng() * 0.3
      const d = 0.4 + rng() * 1.5
      const g = new THREE.BoxGeometry(w, h, d)
      g.translate(
        (rng() - 0.5) * CLIFF_W * 0.9,
        -rng() * CLIFF_H * 0.85 - 1,
        CLIFF_Z + d / 2
      )
      parts.push(g)
    }

    return mergeGeoms(parts)
  }, [])

  const grassGeo = useMemo(() => {
    const rng = mulberry32(5100)
    const parts: THREE.BufferGeometry[] = []
    for (let i = 0; i < 150; i++) {
      const h = 0.08 + rng() * 0.28
      const w = 0.04 + rng() * 0.08
      const d = 0.03 + rng() * 0.06
      const g = new THREE.BoxGeometry(w, h, d)
      g.translate(
        (rng() - 0.5) * CLIFF_W * 0.95,
        1.4 + h / 2,
        CLIFF_Z + 0.3 + rng() * 2
      )
      parts.push(g)
    }
    return mergeGeoms(parts)
  }, [])

  const rockMat = useMemo(() => new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.96, metalness: 0.02 }), [])
  const grassMat = useMemo(() => new THREE.MeshStandardMaterial({ color: 0x141e10, roughness: 0.95 }), [])

  return (
    <group>
      <mesh geometry={rockGeo} material={rockMat} castShadow receiveShadow />
      <mesh geometry={grassGeo} material={grassMat} />
    </group>
  )
}

// ─── Ocean (animated waves) ──────────────────────────────
function Ocean() {
  const ref = useRef<THREE.Mesh>(null!)

  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(160, 120, 80, 60)
    g.rotateX(-Math.PI / 2)
    return g
  }, [])

  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x0a1520, roughness: 0.3, metalness: 0.6,
    emissive: 0x040810, emissiveIntensity: 0.3,
  }), [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    const pos = ref.current.geometry.attributes.position
    const arr = pos.array as Float32Array
    for (let i = 0; i < pos.count; i++) {
      const x = arr[i * 3], z = arr[i * 3 + 2]
      arr[i * 3 + 1] =
        Math.sin(x * 0.08 + t * 0.6) * 0.8 +
        Math.sin(z * 0.05 + t * 0.4) * 1.2 +
        Math.sin(x * 0.15 + z * 0.1 + t * 0.9) * 0.4 +
        Math.sin(x * 0.25 + t * 1.5) * 0.15
    }
    pos.needsUpdate = true
    ref.current.geometry.computeVertexNormals()
  })

  return <mesh ref={ref} geometry={geo} material={mat} position={[0, OCEAN_Y, CLIFF_Z - 55]} />
}

// ─── Sea Stacks (basalt pillars in the ocean) ────────────
function SeaStacks() {
  const geo = useMemo(() => {
    const rng = mulberry32(6000)
    const parts: THREE.BufferGeometry[] = []
    const stacks = [
      { x: -15, z: -75, w: 3, d: 3, h: 18 },
      { x: 8, z: -82, w: 4, d: 3.5, h: 22 },
      { x: -25, z: -88, w: 2.5, d: 2.5, h: 15 },
      { x: 20, z: -70, w: 3.5, d: 3, h: 20 },
      { x: -8, z: -95, w: 2, d: 2, h: 12 },
      { x: 30, z: -90, w: 3, d: 4, h: 25 },
    ]

    for (const st of stacks) {
      const body = new THREE.BoxGeometry(st.w, st.h, st.d)
      body.translate(st.x, OCEAN_Y - st.h / 2 + 6, st.z)
      parts.push(body)

      for (let j = 0; j < 25; j++) {
        const w = 0.3 + rng() * 1, h = 0.3 + rng() * 1.5, d = 0.2 + rng() * 0.8
        const angle = rng() * Math.PI * 2
        const dist = st.w * 0.4 + rng() * 0.5
        const g = new THREE.BoxGeometry(w, h, d)
        g.translate(
          st.x + Math.cos(angle) * dist,
          OCEAN_Y - st.h / 2 + 6 + (rng() - 0.5) * st.h * 0.8,
          st.z + Math.sin(angle) * dist
        )
        parts.push(g)
      }
    }

    return mergeGeoms(parts)
  }, [])

  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: 0x1c1c20, roughness: 0.96, metalness: 0.02 }), [])
  return <mesh geometry={geo} material={mat} castShadow />
}

// ─── Seagulls (circling above the ocean) ─────────────────
function Seagulls({ count = 14 }: { count?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null!)

  const wingGeo = useMemo(() => {
    const parts: THREE.BufferGeometry[] = []
    const lw = new THREE.PlaneGeometry(0.35, 0.08)
    lw.rotateZ(0.25); lw.translate(-0.15, 0, 0)
    parts.push(lw)
    const rw = new THREE.PlaneGeometry(0.35, 0.08)
    rw.rotateZ(-0.25); rw.translate(0.15, 0, 0)
    parts.push(rw)
    const b = new THREE.BoxGeometry(0.04, 0.03, 0.15)
    parts.push(b)
    return mergeGeoms(parts)
  }, [])

  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0xcccccc, roughness: 0.8, side: THREE.DoubleSide,
    emissive: 0x222222, emissiveIntensity: 0.3,
  }), [])

  const data = useMemo(() => {
    const rng = mulberry32(7000)
    return Array.from({ length: count }, () => ({
      cx: (rng() - 0.5) * 50,
      cz: CLIFF_Z - 20 - rng() * 40,
      cy: OCEAN_Y + 8 + rng() * 15,
      radius: 5 + rng() * 12,
      speed: 0.15 + rng() * 0.25,
      phase: rng() * Math.PI * 2,
      flapSpeed: 2.5 + rng() * 2,
      flapAmp: 0.15 + rng() * 0.1,
      bobAmp: 0.5 + rng() * 1,
      bobSpeed: 0.3 + rng() * 0.3,
      scale: 0.8 + rng() * 0.6,
    }))
  }, [count])

  const sc = useMemo(() => ({
    m: new THREE.Matrix4(), q: new THREE.Quaternion(),
    s: new THREE.Vector3(), p: new THREE.Vector3(), e: new THREE.Euler(),
  }), [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    const { m, q, s, p, e } = sc
    for (let i = 0; i < count; i++) {
      const d = data[i]
      const angle = d.phase + t * d.speed
      p.set(
        d.cx + Math.cos(angle) * d.radius,
        d.cy + Math.sin(t * d.bobSpeed + d.phase) * d.bobAmp,
        d.cz + Math.sin(angle) * d.radius
      )
      e.set(Math.sin(t * d.flapSpeed + d.phase * 3) * d.flapAmp, angle + Math.PI / 2, 0)
      q.setFromEuler(e)
      s.setScalar(d.scale)
      m.compose(p, q, s)
      ref.current.setMatrixAt(i, m)
    }
    ref.current.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={ref} args={[wingGeo, mat, count]} frustumCulled={false} />
}

// ─── Scene Setup ────────────────────────────────────────
function SceneSetup() {
  const { scene } = useThree()
  useEffect(() => { scene.fog = new THREE.FogExp2(CFG.fogColor, CFG.fogDensity); scene.background = new THREE.Color(CFG.fogColor) }, [scene])
  return null
}

// ─── Main Export ────────────────────────────────────────
export default function ForestScene({ onInteract }: { onInteract?: () => void }) {
  const treeGeos = useMemo(() => TREE_PRESETS.map((p) => createTree(p)), [])
  const pineGeos = useMemo(() => PINE_PRESETS.map((p) => createPineTree(p)), [])
  const fernGeo = useMemo(() => createFern(), [])
  const bushGeo = useMemo(() => createBush(), [])

  return (
    <Canvas
      shadows
      camera={{ fov: 65, near: 0.1, far: 200, position: [0, CFG.cameraHeight, 0] }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false, localClippingEnabled: true }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <SceneSetup />
      <CameraController onInteract={onInteract} />

      <ambientLight intensity={0.04} color={0x6688aa} />
      <Moon />
      <Stars />
      <LogoConstellation />
      <Clouds />

      {/* Trees — 5 deciduous variants + 3 pine variants */}
      <FloraInstances geometry={treeGeos[0]} color={CFG.treeColor} count={55} seed={100} scaleRange={[0.6, 1.6]} windAmp={0.015} windFreq={1.2} castShadow />
      <FloraInstances geometry={treeGeos[1]} color={CFG.treeColor} count={45} seed={200} scaleRange={[0.5, 1.3]} windAmp={0.012} windFreq={1.0} castShadow />
      <FloraInstances geometry={treeGeos[2]} color={CFG.treeColor} count={55} seed={300} scaleRange={[0.6, 1.5]} windAmp={0.02} windFreq={1.5} castShadow />
      <FloraInstances geometry={treeGeos[3]} color={CFG.treeColor} count={40} seed={400} scaleRange={[0.5, 1.2]} windAmp={0.01} windFreq={0.9} castShadow />
      <FloraInstances geometry={treeGeos[4]} color={CFG.treeColor} count={50} seed={500} scaleRange={[0.7, 1.8]} windAmp={0.018} windFreq={1.3} castShadow />

      {/* Pine trees */}
      <FloraInstances geometry={pineGeos[0]} color={CFG.pineColor} count={18} seed={810} scaleRange={[0.5, 1.4]} windAmp={0.008} windFreq={0.9} castShadow />
      <FloraInstances geometry={pineGeos[1]} color={CFG.pineColor} count={15} seed={820} scaleRange={[0.6, 1.5]} windAmp={0.01} windFreq={1.0} castShadow />
      <FloraInstances geometry={pineGeos[2]} color={CFG.pineColor} count={12} seed={830} scaleRange={[0.4, 1.2]} windAmp={0.006} windFreq={0.8} castShadow />

      {/* Undergrowth */}
      <FloraInstances geometry={fernGeo} color={CFG.fernColor} count={120} seed={600} scaleRange={[0.4, 1.2]} windAmp={0.12} windFreq={2.0} />
      <FloraInstances geometry={bushGeo} color={CFG.bushColor} count={80} seed={700} scaleRange={[0.5, 1.5]} windAmp={0.06} windFreq={1.4} />

      <GrassField count={2000} />
      <StoneHouse />
      <Fox />
      <TattooStencils />
      <Ground />
      <SeaCliff />
      <Ocean />
      <SeaStacks />
      <Seagulls />
      <FallingLeaves count={300} />
      <Snow count={2500} />
      <Mist count={200} />
    </Canvas>
  )
}
