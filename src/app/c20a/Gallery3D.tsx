'use client';

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, useTexture, useProgress } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import styles from './c20a.module.scss';

/* ═══════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════ */

const RW = 16;
const RL = 30;
const RH = 5.5;
const EYE = 1.7;
const SPEED = 5;
const LOOK_SENS = 0.002;

interface ArtDef {
  name: string;
  slug: string;
  price: string;
  img: string;
  pos: [number, number, number];
  view: [number, number, number];
  side: 'L' | 'R';
}

const ART: ArtDef[] = [
  {
    name: 'Etiopien – Yirgacheffe',
    slug: 'etiopien-yirgacheffe',
    price: 'fra 85 DKK',
    img: '/media/produkter/Etiopien - Yirgacheffe/yirgacheffe.jpg',
    pos: [-7.95, 2.3, 9],
    view: [-4.5, EYE, 9],
    side: 'L',
  },
  {
    name: 'Hitam – Espresso Blend',
    slug: 'hitam',
    price: 'fra 85 DKK',
    img: '/media/produkter/Hitam/hitam.jpg',
    pos: [7.95, 2.3, 9],
    view: [4.5, EYE, 9],
    side: 'R',
  },
  {
    name: 'Etiopien – Abyssinian',
    slug: 'etiopien-sidamo',
    price: 'fra 85 DKK',
    img: '/media/produkter/Etiopien Abyssinian/sidamo.jpg',
    pos: [-7.95, 2.3, 0],
    view: [-4.5, EYE, 0],
    side: 'L',
  },
  {
    name: 'Colombia – Tatama',
    slug: 'colombia-tatama',
    price: 'fra 85 DKK',
    img: '/media/produkter/Colombia - Tatama/tatama.jpg',
    pos: [7.95, 2.3, 0],
    view: [4.5, EYE, 0],
    side: 'R',
  },
  {
    name: 'Hitam – Mørk Ristning',
    slug: 'hitam',
    price: 'fra 85 DKK',
    img: '/media/produkter/Hitam/Mørke Hitam.jpg',
    pos: [-7.95, 2.3, -9],
    view: [-4.5, EYE, -9],
    side: 'L',
  },
  {
    name: 'Yirgacheffe – Bønner',
    slug: 'etiopien-yirgacheffe',
    price: 'fra 85 DKK',
    img: '/media/produkter/Etiopien - Yirgacheffe/etiopien yir - beans product-card.jpeg',
    pos: [7.95, 2.3, -9],
    view: [4.5, EYE, -9],
    side: 'R',
  },
];

/* ═══════════════════════════════════════════════════════════
   Mutable input store (avoids React re-renders per frame)
   ═══════════════════════════════════════════════════════════ */

const inp = {
  fwd: 0,
  back: 0,
  left: 0,
  right: 0,
  dx: 0,
  dy: 0,
  jx: 0,
  jy: 0,
};

/* ═══════════════════════════════════════════════════════════
   3D Scene Components
   ═══════════════════════════════════════════════════════════ */

function TileFloor() {
  const tex = useMemo(() => {
    const s = 512;
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d')!;

    g.fillStyle = '#e3ddd8';
    g.fillRect(0, 0, s, s);

    const ts = s / 4;
    g.strokeStyle = '#c8c2bc';
    g.lineWidth = 4;
    g.beginPath();
    for (let i = 0; i <= 4; i++) {
      g.moveTo(i * ts, 0);
      g.lineTo(i * ts, s);
      g.moveTo(0, i * ts);
      g.lineTo(s, i * ts);
    }
    g.stroke();

    g.fillStyle = 'rgba(160, 140, 130, 0.07)';
    for (let i = 0; i < 15; i++) {
      g.beginPath();
      g.arc(
        Math.random() * s,
        Math.random() * s,
        12 + Math.random() * 35,
        0,
        Math.PI * 2,
      );
      g.fill();
    }

    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(RW / 3, RL / 3);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[RW, RL]} />
      <meshStandardMaterial
        map={tex}
        roughness={0.2}
        metalness={0.05}
        envMapIntensity={0.3}
      />
    </mesh>
  );
}

function Hall() {
  const wallMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1e1e1e',
        roughness: 0.88,
        metalness: 0.05,
      }),
    [],
  );

  return (
    <group>
      <TileFloor />

      {/* Walls */}
      <mesh
        position={[-RW / 2, RH / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        material={wallMat}
      >
        <planeGeometry args={[RL, RH]} />
      </mesh>
      <mesh
        position={[RW / 2, RH / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        material={wallMat}
      >
        <planeGeometry args={[RL, RH]} />
      </mesh>
      <mesh position={[0, RH / 2, -RL / 2]} material={wallMat}>
        <planeGeometry args={[RW, RH]} />
      </mesh>
      <mesh
        position={[0, RH / 2, RL / 2]}
        rotation={[0, Math.PI, 0]}
        material={wallMat}
      >
        <planeGeometry args={[RW, RH]} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, RH, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[RW, RL]} />
        <meshStandardMaterial color="#0e0e0e" roughness={0.95} />
      </mesh>

      {/* Neon strips on ceiling (bloom targets) */}
      <mesh position={[-3, RH - 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.08, RL * 0.85]} />
        <meshStandardMaterial
          emissive="#DA70D6"
          emissiveIntensity={4}
          color="#000"
          toneMapped={false}
        />
      </mesh>
      <mesh position={[3, RH - 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.08, RL * 0.85]} />
        <meshStandardMaterial
          emissive="#EEC643"
          emissiveIntensity={4}
          color="#000"
          toneMapped={false}
        />
      </mesh>

      {/* Pillars */}
      {(
        [
          [-4.5, -8],
          [-4.5, 8],
          [4.5, -8],
          [4.5, 8],
        ] as [number, number][]
      ).map(([x, z], i) => (
        <mesh key={i} position={[x, RH / 2, z]}>
          <boxGeometry args={[0.35, RH, 0.35]} />
          <meshStandardMaterial
            color="#252525"
            roughness={0.6}
            metalness={0.25}
          />
        </mesh>
      ))}

      {/* Drainage channel in floor */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.25, RL * 0.9]} />
        <meshStandardMaterial
          color="#888"
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>
    </group>
  );
}

function ArtworkFrame({ data }: { data: ArtDef }) {
  const tex = useTexture(encodeURI(data.img));
  const rotY = data.side === 'L' ? Math.PI / 2 : -Math.PI / 2;

  return (
    <group position={data.pos} rotation={[0, rotY, 0]}>
      {/* Outer frame */}
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[2.9, 3.4, 0.06]} />
        <meshStandardMaterial
          color="#0a0a0a"
          roughness={0.4}
          metalness={0.35}
        />
      </mesh>

      {/* Image */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[2.5, 3]} />
        <meshStandardMaterial map={tex} roughness={0.35} />
      </mesh>

      {/* Price tag & name below frame */}
      <Html
        position={[0, -2.15, 0.05]}
        center
        distanceFactor={7}
        className={styles.tag3d}
        zIndexRange={[1, 5]}
      >
        <span className={styles.tagName}>{data.name}</span>
        <span className={styles.tagPrice}>{data.price}</span>
        <a href={`/shop/${data.slug}`} className={styles.tagBuy}>
          KØB
        </a>
      </Html>
    </group>
  );
}

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.06} color="#c0b0ff" />

      {/* Rave neon point lights */}
      <pointLight
        position={[-6, 4.5, 6]}
        intensity={10}
        color="#DA70D6"
        distance={22}
        decay={2}
      />
      <pointLight
        position={[6, 4.5, -6]}
        intensity={10}
        color="#EEC643"
        distance={22}
        decay={2}
      />
      <pointLight
        position={[0, 4, -13]}
        intensity={6}
        color="#DA70D6"
        distance={18}
        decay={2}
      />
      <pointLight
        position={[0, 4, 13]}
        intensity={6}
        color="#EEC643"
        distance={18}
        decay={2}
      />

      {/* Artwork spot lighting */}
      {ART.map((a, i) => {
        const xOff = a.side === 'L' ? 2 : -2;
        return (
          <pointLight
            key={i}
            position={[a.pos[0] + xOff, 4, a.pos[2]]}
            intensity={4}
            color="#fff0d0"
            distance={7}
            decay={2}
          />
        );
      })}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   FPS Controller (runs inside Canvas)
   ═══════════════════════════════════════════════════════════ */

interface ControllerProps {
  mode: 'intro' | 'roam' | 'view';
  artIdx: number;
  trigger: number;
}

function Controller({ mode, artIdx, trigger }: ControllerProps) {
  const { camera } = useThree();
  const yaw = useRef(0);
  const pitch = useRef(0);
  const teleporting = useRef(false);
  const tTarget = useRef(new THREE.Vector3());
  const tLookAt = useRef(new THREE.Vector3());
  const lastTrigger = useRef(0);

  const state = useRef({ mode, artIdx, trigger });
  state.current = { mode, artIdx, trigger };

  useFrame((_, delta) => {
    const { mode: m, artIdx: ai, trigger: t } = state.current;

    // Trigger teleport
    if (t !== lastTrigger.current && t > 0) {
      lastTrigger.current = t;
      teleporting.current = true;
      tTarget.current.set(...ART[ai].view);
      tLookAt.current.set(...ART[ai].pos);
    }

    // Teleport interpolation
    if (teleporting.current) {
      const f = 1 - Math.exp(-3.5 * delta);
      camera.position.lerp(tTarget.current, f);

      const lookMat = new THREE.Matrix4().lookAt(
        camera.position,
        tLookAt.current,
        new THREE.Vector3(0, 1, 0),
      );
      const targetQ = new THREE.Quaternion().setFromRotationMatrix(lookMat);
      camera.quaternion.slerp(targetQ, f);

      if (camera.position.distanceTo(tTarget.current) < 0.04) {
        camera.position.copy(tTarget.current);
        camera.quaternion.copy(targetQ);
        const e = new THREE.Euler().setFromQuaternion(
          camera.quaternion,
          'YXZ',
        );
        yaw.current = e.y;
        pitch.current = e.x;
        teleporting.current = false;
      }
      return;
    }

    if (m === 'intro') return;

    // Look
    yaw.current -= inp.dx * LOOK_SENS;
    pitch.current -= inp.dy * LOOK_SENS;
    pitch.current = THREE.MathUtils.clamp(pitch.current, -1.4, 1.4);
    inp.dx = 0;
    inp.dy = 0;

    const euler = new THREE.Euler(pitch.current, yaw.current, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);

    // Movement
    let mx = inp.jx;
    let mz = inp.jy;
    if (inp.fwd) mz += 1;
    if (inp.back) mz -= 1;
    if (inp.left) mx -= 1;
    if (inp.right) mx += 1;

    const len = Math.sqrt(mx * mx + mz * mz);
    if (len > 1) {
      mx /= len;
      mz /= len;
    }

    const spd = SPEED * delta;
    const sy = Math.sin(yaw.current);
    const cy = Math.cos(yaw.current);
    camera.position.x += (-sy * mz + cy * mx) * spd;
    camera.position.z += (-cy * mz - sy * mx) * spd;

    camera.position.x = THREE.MathUtils.clamp(
      camera.position.x,
      -RW / 2 + 0.5,
      RW / 2 - 0.5,
    );
    camera.position.z = THREE.MathUtils.clamp(
      camera.position.z,
      -RL / 2 + 0.5,
      RL / 2 - 0.5,
    );
    camera.position.y = EYE;
  });

  return null;
}

/* ═══════════════════════════════════════════════════════════
   Scene Content (composed inside Suspense)
   ═══════════════════════════════════════════════════════════ */

function SceneContent() {
  return (
    <>
      <fog attach="fog" args={['#080808', 2, 28]} />
      <Lighting />
      <Hall />
      {ART.map((a, i) => (
        <Suspense key={i} fallback={null}>
          <ArtworkFrame data={a} />
        </Suspense>
      ))}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.4}
          luminanceSmoothing={0.9}
          intensity={1.2}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.15} darkness={0.85} />
      </EffectComposer>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   Loading indicator
   ═══════════════════════════════════════════════════════════ */

function Loader({ onReady }: { onReady: () => void }) {
  const { active } = useProgress();
  const wasActive = useRef(false);

  useEffect(() => {
    if (active) wasActive.current = true;
    if (!active && wasActive.current) onReady();
    if (!active && !wasActive.current) {
      const t = setTimeout(onReady, 300);
      return () => clearTimeout(t);
    }
  }, [active, onReady]);

  return null;
}

/* ═══════════════════════════════════════════════════════════
   Main Gallery Component
   ═══════════════════════════════════════════════════════════ */

export default function Gallery3D() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState<'intro' | 'roam' | 'view'>('intro');
  const [artIdx, setArtIdx] = useState(0);
  const [trigger, setTrigger] = useState(0);

  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const handleReady = useCallback(() => setLoaded(true), []);

  /* ── Dismiss intro ── */
  const startExperience = useCallback(() => {
    if (modeRef.current !== 'intro') return;
    setMode('roam');
    if (wrapRef.current && 'requestPointerLock' in wrapRef.current) {
      try {
        Promise.resolve(wrapRef.current.requestPointerLock()).catch(() => {});
      } catch {
        /* mobile — no pointer lock */
      }
    }
  }, []);

  /* ── Space handler ── */
  const handleSpace = useCallback(() => {
    if (modeRef.current === 'intro') return;
    if (modeRef.current === 'roam') {
      setMode('view');
      setTrigger((p) => p + 1);
    } else {
      setArtIdx((p) => (p + 1) % ART.length);
      setTrigger((p) => p + 1);
    }
  }, []);

  /* ── Dismiss panel ── */
  const handleDismiss = useCallback(() => {
    setMode('roam');
    if (document.pointerLockElement) return;
    try {
      Promise.resolve(wrapRef.current?.requestPointerLock()).catch(() => {});
    } catch {
      /* ok */
    }
  }, []);

  /* ── Keyboard & Pointer Lock ── */
  useEffect(() => {
    if (mode === 'intro') return;

    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          inp.fwd = 1;
          break;
        case 'KeyS':
        case 'ArrowDown':
          inp.back = 1;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          inp.left = 1;
          break;
        case 'KeyD':
        case 'ArrowRight':
          inp.right = 1;
          break;
        case 'Space':
          e.preventDefault();
          handleSpace();
          break;
        case 'Escape':
          if (modeRef.current === 'view') {
            e.preventDefault();
            handleDismiss();
          }
          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          inp.fwd = 0;
          break;
        case 'KeyS':
        case 'ArrowDown':
          inp.back = 0;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          inp.left = 0;
          break;
        case 'KeyD':
        case 'ArrowRight':
          inp.right = 0;
          break;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        inp.dx += e.movementX;
        inp.dy += e.movementY;
      }
    };

    const onClick = (e: MouseEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'A' || tag === 'BUTTON') return;
      if (!document.pointerLockElement && modeRef.current === 'roam') {
        try {
          Promise.resolve(wrapRef.current?.requestPointerLock()).catch(
            () => {},
          );
        } catch {
          /* ok */
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    wrapRef.current?.addEventListener('click', onClick);
    const el = wrapRef.current;

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('mousemove', onMouseMove);
      el?.removeEventListener('click', onClick);
      inp.fwd = inp.back = inp.left = inp.right = 0;
    };
  }, [mode, handleSpace, handleDismiss]);

  /* ── Mobile Touch Handlers ── */
  const joyTouchId = useRef<number | null>(null);
  const joyCenterRef = useRef({ x: 0, y: 0 });
  const [knobOff, setKnobOff] = useState({ x: 0, y: 0 });

  const lookTouchId = useRef<number | null>(null);
  const lastLookRef = useRef({ x: 0, y: 0 });

  const onJoyStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    joyTouchId.current = t.identifier;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    joyCenterRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }, []);

  const onJoyMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier !== joyTouchId.current) continue;
      const dx = t.clientX - joyCenterRef.current.x;
      const dy = t.clientY - joyCenterRef.current.y;
      const maxD = 50;
      const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxD);
      const ang = Math.atan2(dy, dx);
      const nx = (dist / maxD) * Math.cos(ang);
      const ny = (dist / maxD) * Math.sin(ang);
      inp.jx = nx;
      inp.jy = -ny;
      setKnobOff({ x: nx * maxD, y: ny * maxD });
    }
  }, []);

  const onJoyEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joyTouchId.current) {
        joyTouchId.current = null;
        inp.jx = inp.jy = 0;
        setKnobOff({ x: 0, y: 0 });
      }
    }
  }, []);

  const onLookStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    lookTouchId.current = t.identifier;
    lastLookRef.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onLookMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier !== lookTouchId.current) continue;
      inp.dx += (t.clientX - lastLookRef.current.x) * 1.5;
      inp.dy += (t.clientY - lastLookRef.current.y) * 1.5;
      lastLookRef.current = { x: t.clientX, y: t.clientY };
    }
  }, []);

  const onLookEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchId.current) {
        lookTouchId.current = null;
      }
    }
  }, []);

  /* ── Render ── */
  const currentArt = ART[artIdx];

  return (
    <div ref={wrapRef} className={styles.wrap}>
      {/* R3F Canvas */}
      <Canvas
        camera={{
          fov: 72,
          near: 0.1,
          far: 60,
          position: [0, EYE, 13],
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.7,
        }}
        dpr={[1, 1.5]}
      >
        <Loader onReady={handleReady} />
        <Controller mode={mode} artIdx={artIdx} trigger={trigger} />
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>

      {/* Loading */}
      <div className={`${styles.loader} ${loaded ? styles.hidden : ''}`}>
        <div className={styles.spinner} />
      </div>

      {/* Intro overlay */}
      <div
        className={`${styles.intro} ${mode !== 'intro' ? styles.hidden : ''}`}
        onClick={startExperience}
        onTouchEnd={(e) => {
          e.preventDefault();
          startExperience();
        }}
      >
        <div className={styles.introTitle}>C20A</div>
        <p className={styles.introSub}>
          Step into the gallery. Walk freely and discover our coffee collection
          in an abandoned rave hall.
        </p>
        <div className={styles.introHint}>
          Press <kbd>SPACE</kbd> to jump between artworks
        </div>
      </div>

      {/* Crosshair (roam only) */}
      {mode === 'roam' && <div className={styles.crosshair} />}

      {/* Space hint (roam) */}
      {mode === 'roam' && (
        <div className={styles.spaceHint}>
          <kbd>SPACE</kbd> jump to artwork &middot; <kbd>WASD</kbd> /
          arrows to move &middot; mouse to look
        </div>
      )}

      {/* Artwork panel (view) */}
      <div
        className={`${styles.panel} ${mode !== 'view' ? styles.hidden : ''}`}
      >
        <button
          className={styles.panelClose}
          onClick={handleDismiss}
          aria-label="Close"
        >
          ✕
        </button>
        <div className={styles.panelInfo}>
          <h3 className={styles.panelName}>{currentArt.name}</h3>
          <div className={styles.panelPrice}>{currentArt.price}</div>
          <div className={styles.panelNav}>
            {artIdx + 1} / {ART.length} &middot; <kbd>SPACE</kbd> for next
          </div>
        </div>
        <a href={`/shop/${currentArt.slug}`} className={styles.buyLink}>
          Køb Nu
        </a>
      </div>

      {/* Mobile controls */}
      <div className={styles.mobileUI}>
        {mode !== 'intro' && (
          <>
            {/* Joystick */}
            <div
              className={styles.joystickZone}
              onTouchStart={onJoyStart}
              onTouchMove={onJoyMove}
              onTouchEnd={onJoyEnd}
              onTouchCancel={onJoyEnd}
            >
              <div className={styles.joystickBase}>
                <div
                  className={styles.joystickKnob}
                  style={{
                    transform: `translate(calc(-50% + ${knobOff.x}px), calc(-50% + ${knobOff.y}px))`,
                  }}
                />
              </div>
            </div>

            {/* Look area */}
            <div
              className={styles.lookZone}
              onTouchStart={onLookStart}
              onTouchMove={onLookMove}
              onTouchEnd={onLookEnd}
              onTouchCancel={onLookEnd}
            />

            {/* Next artwork button */}
            <button className={styles.nextBtn} onTouchEnd={handleSpace}>
              <span>NEXT</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
