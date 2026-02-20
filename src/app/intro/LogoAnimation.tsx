'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './intro.module.scss'

const TENT_PATHS = [
  { id: 'outer-left', d: 'M 100 18 L 12 250' },
  { id: 'outer-right', d: 'M 100 18 L 188 250' },
  { id: 'base', d: 'M 12 250 L 188 250' },
  { id: 'center', d: 'M 100 18 L 100 250' },
  { id: 'inner-left', d: 'M 100 132 L 62 250' },
  { id: 'inner-right', d: 'M 100 132 L 138 250' },
]

const DRAW_STAGGER_MS = 150
const DRAW_DURATION_MS = 900

interface Props {
  drawing: boolean
  wiggling: boolean
}

export default function LogoAnimation({ drawing, wiggling }: Props) {
  const hasDrawn = useRef(false)
  const [drawn, setDrawn] = useState(false)

  useEffect(() => {
    if (!drawing || hasDrawn.current) return
    hasDrawn.current = true

    const lastDelay = (TENT_PATHS.length - 1) * DRAW_STAGGER_MS + DRAW_DURATION_MS
    const timer = setTimeout(() => setDrawn(true), lastDelay + 50)
    return () => clearTimeout(timer)
  }, [drawing])

  return (
    <div className={styles.logoWrapper}>
      <svg
        viewBox="0 0 200 270"
        className={styles.logoSvg}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="smoke" x="-60%" y="-60%" width="220%" height="220%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.014"
              numOctaves="3"
              seed="2"
            >
              <animate
                attributeName="baseFrequency"
                values="0.012;0.024;0.012"
                dur="10s"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" scale="14" />
            <feGaussianBlur stdDeviation="4" />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.2 0"
            />
          </filter>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Smoke layer */}
        <g
          className={styles.smokeGroup}
          filter="url(#smoke)"
          style={{ opacity: wiggling ? 1 : 0 }}
        >
          {TENT_PATHS.map((p) => (
            <path
              key={`smoke-${p.id}`}
              d={p.d}
              stroke="var(--text-primary)"
              strokeWidth={5}
              fill="none"
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* Main lines — CSS-only draw, then static once finished */}
        <g filter="url(#glow)">
          {TENT_PATHS.map((p, i) => (
            <path
              key={p.id}
              d={p.d}
              stroke="var(--text-primary)"
              strokeWidth={2.8}
              fill="none"
              strokeLinecap="round"
              className={[
                drawing ? styles.pathDraw : styles.pathHidden,
                drawn && wiggling ? styles[`wiggle${i}`] : '',
              ].join(' ')}
              style={{
                animationDelay: drawing && !drawn
                  ? `${i * DRAW_STAGGER_MS}ms`
                  : undefined,
              }}
            />
          ))}
        </g>
      </svg>
    </div>
  )
}
