'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import styles from './world/world.module.scss'

const ForestScene = dynamic(() => import('./world/ForestScene'), {
  ssr: false,
  loading: () => null,
})

export default function LandingPage() {
  const router = useRouter()
  const [phase, setPhase] = useState(0)
  const [fadeDark, setFadeDark] = useState(true)
  const [exploring, setExploring] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const handleContinue = useCallback(() => {
    setFadeDark(true)
    setTimeout(() => router.push('/home'), 1000)
  }, [router])

  const handleInteract = useCallback(() => {
    setExploring(true)
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase(5)
      setFadeDark(false)
      return
    }

    setIsMobile('ontouchstart' in window)

    const preventScroll = (e: TouchEvent) => e.preventDefault()
    document.addEventListener('touchmove', preventScroll, { passive: false })
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    const t: ReturnType<typeof setTimeout>[] = []
    t.push(setTimeout(() => setFadeDark(false), 500))
    t.push(setTimeout(() => setPhase(1), 800))
    t.push(setTimeout(() => { setExploring(true); setPhase(5) }, 4800))
    timersRef.current = t
    return () => {
      t.forEach(clearTimeout)
      document.removeEventListener('touchmove', preventScroll)
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
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

  return (
    <div className={styles.worldContainer}>
      <div className={styles.sceneBg}>
        <ForestScene onInteract={handleInteract} />
      </div>

      <div className={styles.vignette} />
      <div className={`${styles.fadeOverlay} ${fadeDark ? styles.fadeDarkActive : ''}`} />

      {!isMobile && (
        <AnimatePresence>
          {phase < 5 && (
            <motion.div
              className={styles.overlay}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
            >
              <motion.p
                className={styles.hint}
                initial={{ opacity: 0 }}
                animate={{ opacity: phase >= 1 ? 0.45 : 0 }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              >
                Arrow keys to explore · Click to look around
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <motion.button
        className={styles.continueButton}
        initial={{ opacity: 0 }}
        animate={{ opacity: fadeDark ? 0 : 1 }}
        transition={{ duration: 1.2, delay: 0.5 }}
        onClick={handleContinue}
        aria-label="Fortsæt til hjemmesiden"
      >
        Fortsæt &rarr;
      </motion.button>

      {exploring && !isMobile && (
        <motion.p
          className={styles.controlsReminder}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ duration: 0.8 }}
        >
          ESC to release cursor
        </motion.p>
      )}

      <span className={styles.srOnly}>
        Interactive 3D winter forest experience. Use arrow keys to move and mouse to look around.
      </span>
    </div>
  )
}
