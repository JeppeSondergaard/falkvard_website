'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const LOGO_VERTEX = `
  attribute vec3 aTarget;
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aRandom;

  uniform float uProgress;
  uniform float uTime;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;

    float t = clamp(uProgress, 0.0, 1.0);
    float eased = t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;

    vec3 pos = mix(position, aTarget, eased);

    // Layered organic wiggle — persists even when fully assembled
    float wiggleBase = 0.06 * (1.0 - eased * 0.25);
    pos.x += sin(uTime * 0.9 + aRandom * 62.83) * wiggleBase;
    pos.y += cos(uTime * 0.7 + aRandom * 31.41) * wiggleBase;
    pos.z += sin(uTime * 0.8 + aRandom * 47.12) * wiggleBase * 0.5;

    // Secondary slower wobble wave for organic feel
    float wave2 = 0.03 * eased;
    pos.x += sin(uTime * 0.25 + aRandom * 12.0) * wave2;
    pos.y += cos(uTime * 0.2 + aRandom * 8.0) * wave2;

    // Occasional larger pulse for individual particles
    float pulse = sin(uTime * 1.5 + aRandom * 100.0);
    float spike = step(0.92, pulse) * 0.08 * eased;
    pos.x += sin(aRandom * 50.0) * spike;
    pos.y += cos(aRandom * 50.0) * spike;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    // Size breathes gently
    float breathe = 1.0 + sin(uTime * 0.6 + aRandom * 6.28) * 0.12 * eased;
    gl_PointSize = aSize * breathe * (200.0 / max(-mvPosition.z, 0.1));
    gl_PointSize = clamp(gl_PointSize, 0.5, 28.0);

    gl_Position = projectionMatrix * mvPosition;

    float dist = -mvPosition.z;
    vAlpha = smoothstep(55.0, 30.0, dist) * smoothstep(0.1, 1.8, dist);
  }
`

const LOGO_FRAGMENT = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    if (dist > 0.5) discard;

    float alpha = smoothstep(0.5, 0.05, dist) * vAlpha * 0.92;
    gl_FragColor = vec4(vColor, alpha);
  }
`

const SMOKE_VERTEX = `
  attribute float aOffset;
  attribute float aSpeed;
  attribute float aSmokeSize;
  attribute vec3 aOrigin;

  uniform float uTime;

  varying float vAlpha;

  void main() {
    float cycle = mod(uTime * aSpeed * 0.12 + aOffset, 1.0);

    vec3 pos = aOrigin;

    // Rise upward
    pos.y += cycle * 10.0;

    // Turbulent drift
    pos.x += sin(uTime * 0.35 + aOffset * 30.0 + pos.y * 0.6) * 1.2 * cycle;
    pos.z += cos(uTime * 0.28 + aOffset * 20.0 + pos.y * 0.4) * 0.8 * cycle;

    // Spread outward as smoke rises
    pos.x += sin(aOffset * 100.0) * cycle * 1.5;
    pos.z += cos(aOffset * 100.0) * cycle * 0.8;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    float sizeGrow = sin(cycle * 3.14159);
    gl_PointSize = aSmokeSize * (1.0 + sizeGrow * 2.5) * (200.0 / max(-mvPosition.z, 0.1));
    gl_PointSize = clamp(gl_PointSize, 1.0, 40.0);

    gl_Position = projectionMatrix * mvPosition;

    // Fade in fast, fade out slow
    vAlpha = smoothstep(0.0, 0.15, cycle) * smoothstep(1.0, 0.4, cycle) * 0.18;
  }
`

const SMOKE_FRAGMENT = `
  varying float vAlpha;

  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    if (dist > 0.5) discard;

    float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
    gl_FragColor = vec4(0.6, 0.6, 0.65, alpha);
  }
`

interface ParticleData {
  positions: Float32Array
  targets: Float32Array
  colors: Float32Array
  sizes: Float32Array
  randoms: Float32Array
  count: number
}

function loadLogoParticles(src: string): Promise<ParticleData> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      const isMobile = window.innerWidth < 768
      const aspect = img.width / img.height
      const sampleH = isMobile ? 220 : 380
      const sampleW = Math.floor(sampleH * aspect)

      canvas.width = sampleW
      canvas.height = sampleH
      ctx.drawImage(img, 0, 0, sampleW, sampleH)

      const imageData = ctx.getImageData(0, 0, sampleW, sampleH)
      const pixels = imageData.data

      let darkCount = 0
      for (let i = 0; i < sampleW * sampleH; i++) {
        const pi = i * 4
        const lum = (pixels[pi] * 0.299 + pixels[pi + 1] * 0.587 + pixels[pi + 2] * 0.114) / 255
        if (lum < 0.45) darkCount++
      }

      const positions = new Float32Array(darkCount * 3)
      const targets = new Float32Array(darkCount * 3)
      const colors = new Float32Array(darkCount * 3)
      const sizes = new Float32Array(darkCount)
      const randoms = new Float32Array(darkCount)

      const worldH = 12
      const worldW = worldH * aspect

      let idx = 0
      for (let y = 0; y < sampleH; y++) {
        for (let x = 0; x < sampleW; x++) {
          const i = y * sampleW + x
          const pi = i * 4

          const r = pixels[pi] / 255
          const g = pixels[pi + 1] / 255
          const b = pixels[pi + 2] / 255
          const lum = 0.299 * r + 0.587 * g + 0.114 * b

          if (lum >= 0.45) continue

          const darkness = 1.0 - lum

          targets[idx * 3] = (x / sampleW - 0.5) * worldW
          targets[idx * 3 + 1] = -(y / sampleH - 0.5) * worldH
          targets[idx * 3 + 2] = (darkness - 0.5) * 1.2

          const theta = Math.random() * Math.PI * 2
          const phi = Math.acos(2 * Math.random() - 1)
          const radius = 12 + Math.random() * 28
          positions[idx * 3] = Math.sin(phi) * Math.cos(theta) * radius
          positions[idx * 3 + 1] = Math.sin(phi) * Math.sin(theta) * radius
          positions[idx * 3 + 2] = Math.cos(phi) * radius

          const brightness = 0.65 + Math.random() * 0.35
          colors[idx * 3] = brightness
          colors[idx * 3 + 1] = brightness
          colors[idx * 3 + 2] = brightness + Math.random() * 0.06

          sizes[idx] = 1.6 + darkness * 2.2 + Math.random() * 0.6
          randoms[idx] = Math.random()
          idx++
        }
      }

      resolve({
        positions: positions.slice(0, idx * 3),
        targets: targets.slice(0, idx * 3),
        colors: colors.slice(0, idx * 3),
        sizes: sizes.slice(0, idx),
        randoms: randoms.slice(0, idx),
        count: idx,
      })
    }
    img.onerror = reject
    img.src = src
  })
}

function LogoParticles({
  phase,
  onLoaded,
}: {
  phase: number
  onLoaded?: () => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)
  const pointsRef = useRef<THREE.Points | null>(null)
  const { camera } = useThree()
  const progressRef = useRef(0)
  const cameraZRef = useRef(20)
  const loadedRef = useRef(false)
  const onLoadedRef = useRef(onLoaded)
  const phaseRef = useRef(phase)
  onLoadedRef.current = onLoaded
  phaseRef.current = phase

  useEffect(() => {
    let disposed = false

    loadLogoParticles('/logo/FV_logo.png').then((data) => {
      if (disposed || !groupRef.current) return

      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3))
      geometry.setAttribute('aTarget', new THREE.BufferAttribute(data.targets, 3))
      geometry.setAttribute('aColor', new THREE.BufferAttribute(data.colors, 3))
      geometry.setAttribute('aSize', new THREE.BufferAttribute(data.sizes, 1))
      geometry.setAttribute('aRandom', new THREE.BufferAttribute(data.randoms, 1))

      const material = new THREE.ShaderMaterial({
        vertexShader: LOGO_VERTEX,
        fragmentShader: LOGO_FRAGMENT,
        uniforms: {
          uProgress: { value: 0 },
          uTime: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })

      const points = new THREE.Points(geometry, material)
      groupRef.current.add(points)

      pointsRef.current = points
      materialRef.current = material
      loadedRef.current = true
      onLoadedRef.current?.()
    })

    return () => {
      disposed = true
      if (pointsRef.current && groupRef.current) {
        groupRef.current.remove(pointsRef.current)
        pointsRef.current.geometry.dispose()
        ;(pointsRef.current.material as THREE.Material).dispose()
      }
    }
  }, [])

  useFrame((state, delta) => {
    if (!loadedRef.current || !materialRef.current) return

    const p = phaseRef.current
    const mat = materialRef.current
    mat.uniforms.uTime.value = state.clock.elapsedTime

    if (p >= 1 && progressRef.current < 1) {
      progressRef.current = Math.min(progressRef.current + delta * 0.2, 1)
      mat.uniforms.uProgress.value = progressRef.current
    }

    if (p >= 2) {
      cameraZRef.current -= delta * 2.8
      cameraZRef.current = Math.max(cameraZRef.current, -16)
    }

    camera.position.z = cameraZRef.current
    camera.position.x = Math.sin(state.clock.elapsedTime * 0.07) * 0.3
    camera.position.y = Math.cos(state.clock.elapsedTime * 0.05) * 0.2

    const lookZ = p >= 2 ? camera.position.z - 12 : 0
    camera.lookAt(0, 0, lookZ)
  })

  return <group ref={groupRef} />
}

function SmokePlume() {
  const groupRef = useRef<THREE.Group>(null)
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)

  useEffect(() => {
    if (!groupRef.current) return

    const count = 1200
    const origins = new Float32Array(count * 3)
    const offsets = new Float32Array(count)
    const speeds = new Float32Array(count)
    const smokeSizes = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const spread = 1.5 + Math.random() * 4.0
      origins[i * 3] = Math.cos(angle) * spread
      origins[i * 3 + 1] = (Math.random() - 0.6) * 8
      origins[i * 3 + 2] = (Math.random() - 0.5) * 2.0

      offsets[i] = Math.random()
      speeds[i] = 0.6 + Math.random() * 1.2
      smokeSizes[i] = 2.0 + Math.random() * 3.5
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
    geometry.setAttribute('aOrigin', new THREE.BufferAttribute(origins, 3))
    geometry.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 1))
    geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1))
    geometry.setAttribute('aSmokeSize', new THREE.BufferAttribute(smokeSizes, 1))

    const material = new THREE.ShaderMaterial({
      vertexShader: SMOKE_VERTEX,
      fragmentShader: SMOKE_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    const points = new THREE.Points(geometry, material)
    groupRef.current.add(points)
    materialRef.current = material

    return () => {
      if (groupRef.current) {
        groupRef.current.remove(points)
        geometry.dispose()
        material.dispose()
      }
    }
  }, [])

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  return <group ref={groupRef} />
}

function AmbientDust() {
  const groupRef = useRef<THREE.Group>(null)
  const pointsRef = useRef<THREE.Points | null>(null)

  useEffect(() => {
    if (!groupRef.current) return

    const count = 2000
    const positions = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80
      positions[i * 3 + 1] = (Math.random() - 0.5) * 50
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({
      size: 0.05,
      color: 0x444444,
      transparent: true,
      opacity: 0.25,
      sizeAttenuation: true,
      depthWrite: false,
    })

    const points = new THREE.Points(geometry, material)
    groupRef.current.add(points)
    pointsRef.current = points

    return () => {
      if (pointsRef.current && groupRef.current) {
        groupRef.current.remove(pointsRef.current)
        geometry.dispose()
        material.dispose()
      }
    }
  }, [])

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.006
    }
  })

  return <group ref={groupRef} />
}

export default function ParticleScene({
  phase,
  onLoaded,
}: {
  phase: number
  onLoaded?: () => void
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 20], fov: 50, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.5]}
      style={{ background: 'transparent' }}
    >
      <AmbientDust />
      <SmokePlume />
      <LogoParticles phase={phase} onLoaded={onLoaded} />
    </Canvas>
  )
}
