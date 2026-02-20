'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import styles from './world.module.scss'

const ForestScene = dynamic(() => import('./ForestScene'), {
  ssr: false,
  loading: () => null,
})

export default function WorldPage() {
  const router = useRouter()
  const [phase, setPhase] = useState(0)
  const [fadeDark, setFadeDark] = useState(true)
  const [exploring, setExploring] = useState(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const handleExit = useCallback(() => {
    setFadeDark(true)
    setTimeout(() => router.push('/home'), 800)
  }, [router])

  const handleInteract = useCallback(() => {
    setExploring(true)
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase(4)
      setFadeDark(false)
      return
    }

    const t: ReturnType<typeof setTimeout>[] = []
    t.push(setTimeout(() => setFadeDark(false), 300))
    t.push(setTimeout(() => setPhase(1), 1000))
    t.push(setTimeout(() => setPhase(2), 2800))
    t.push(setTimeout(() => setPhase(3), 4800))
    t.push(setTimeout(() => setPhase(4), 7000))
    timersRef.current = t
    return () => t.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && exploring) {
        if (document.pointerLockElement) {
          document.exitPointerLock()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [exploring])

  const showOverlay = !exploring

  return (
    <div className={styles.worldContainer}>
      <div className={styles.sceneBg}>
        <ForestScene onInteract={handleInteract} />
      </div>

      <div className={styles.vignette} />
      <div className={`${styles.fadeOverlay} ${fadeDark ? styles.fadeDarkActive : ''}`} />

      <AnimatePresence>
        {showOverlay && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
          >
            <motion.h1
              className={styles.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : 20 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            >
              FALKVARD
            </motion.h1>

            <motion.p
              className={styles.subtitle}
              initial={{ opacity: 0 }}
              animate={{ opacity: phase >= 2 ? 0.6 : 0 }}
              transition={{ duration: 1.2 }}
            >
              TATOVERINGER MED SJÆL
            </motion.p>

            <motion.p
              className={styles.hint}
              initial={{ opacity: 0 }}
              animate={{ opacity: phase >= 3 ? 0.4 : 0 }}
              transition={{ duration: 1.2 }}
            >
              Arrow keys to explore &middot; Click to look around
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        className={styles.exitButton}
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 4 ? 1 : 0 }}
        transition={{ duration: 0.8 }}
        onClick={handleExit}
        aria-label="Exit to main site"
      >
        &larr; Exit
      </motion.button>

      <AnimatePresence>
        {exploring && (
          <motion.p
            className={styles.controlsReminder}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            ESC to release cursor
          </motion.p>
        )}
      </AnimatePresence>

      <span className={styles.srOnly}>
        Interactive 3D winter forest experience. Use arrow keys to move and mouse to look around.
      </span>
    </div>
  )
}
