'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import LogoAnimation from './LogoAnimation'
import styles from './intro.module.scss'

const TITLE = 'FALKVARD'
const SUBTITLE = 'TATOVERINGER MED SJÆL'

const T = {
  FADE_UP: 200,
  TITLE: 400,
  LOGO: 600,
  SUBTITLE: 2200,
  CTA: 4500,
}

export default function IntroPage() {
  const router = useRouter()
  const [phase, setPhase] = useState(0)
  const [bgVisible, setBgVisible] = useState(false)
  const [fadeDark, setFadeDark] = useState(true)
  const [logoVisible, setLogoVisible] = useState(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const titleShown = useRef(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  if (phase >= 1) titleShown.current = true

  const handleEnter = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    setFadeDark(true)
    setTimeout(() => router.push('/'), 800)
  }, [router])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.4
    }
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase(5)
      setFadeDark(false)
      return
    }

    const t: ReturnType<typeof setTimeout>[] = []
    t.push(setTimeout(() => { setFadeDark(false); setBgVisible(true) }, T.FADE_UP))
    t.push(setTimeout(() => setPhase(1), T.TITLE))
    t.push(setTimeout(() => { setLogoVisible(true); setPhase(2) }, T.LOGO))
    t.push(setTimeout(() => setPhase(3), T.SUBTITLE))
    t.push(setTimeout(() => setPhase(5), T.CTA))

    timersRef.current = t
    return () => t.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleEnter()
      }
      if (e.key === 'Escape') {
        timersRef.current.forEach(clearTimeout)
        setFadeDark(false)
        setBgVisible(true)
        setLogoVisible(true)
        setPhase(5)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleEnter])

  const showTitle = phase >= 1
  const showSubtitle = phase >= 3
  const showCta = phase >= 5

  return (
    <div className={styles.introContainer} role="main" aria-label="Introduction">
      <div className={`${styles.videoBg} ${bgVisible ? styles.videoBgVisible : ''}`}>
        <video ref={videoRef} autoPlay muted loop playsInline preload="auto">
          <source src="/content/intro-bg-1.mp4" type="video/mp4" />
        </video>
      </div>

      <LogoAnimation visible={logoVisible} />

      <div className={styles.vignette} />

      <div className={`${styles.fadeOverlay} ${fadeDark ? styles.fadeDarkActive : ''}`} />

      <div className={styles.overlay}>
        <motion.div
          className={styles.titleWrap}
          initial={{ opacity: 0 }}
          animate={{ opacity: showTitle ? 1 : 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className={styles.title}>
            {TITLE.split('').map((letter, i) => (
              <motion.span
                key={i}
                className={styles.titleLetter}
                initial={{ opacity: 0, y: 24 }}
                animate={{
                  opacity: showTitle ? 1 : 0,
                  y: showTitle ? 0 : 24,
                }}
                transition={{
                  delay: titleShown.current ? 0 : i * 0.07,
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {letter}
              </motion.span>
            ))}
          </h1>
        </motion.div>

        <motion.div
          className={styles.subtitleWrap}
          initial={{ opacity: 0 }}
          animate={{ opacity: showSubtitle ? 0.7 : 0 }}
          transition={{ duration: 1.2 }}
        >
          <p className={styles.subtitle}>{SUBTITLE}</p>
        </motion.div>

        <motion.div
          className={styles.ctaWrap}
          initial={{ opacity: 0 }}
          animate={{ opacity: showCta ? 1 : 0 }}
          transition={{ duration: 1, delay: showCta ? 0.6 : 0 }}
        >
          <button
            className={styles.enterButton}
            onClick={handleEnter}
            tabIndex={showCta ? 0 : -1}
          >
            Enter
          </button>
        </motion.div>
      </div>

      <motion.button
        className={styles.skipButton}
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 1 && phase < 5 ? 1 : 0 }}
        transition={{ duration: 0.6, delay: phase >= 1 && phase < 5 ? 1 : 0 }}
        onClick={handleEnter}
        aria-label="Skip introduction"
        tabIndex={phase < 5 ? 0 : -1}
        style={{ pointerEvents: phase >= 1 && phase < 5 ? 'all' : 'none' }}
      >
        Skip &rarr;
      </motion.button>

      <span className={styles.screenReaderOnly}>
        Immersive introduction to Falkvard Tattoo. Press Enter or Escape to skip.
      </span>
    </div>
  )
}
