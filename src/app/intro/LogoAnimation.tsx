'use client'

import Image from 'next/image'
import styles from './intro.module.scss'

interface Props {
  visible: boolean
}

export default function LogoAnimation({ visible }: Props) {
  return (
    <div className={styles.logoWrapper}>
      <div className={`${styles.logoImage} ${visible ? styles.logoVisible : ''}`}>
        <Image
          src="/logo/FV_logo.png"
          alt="Falkvard logo"
          width={600}
          height={460}
          priority
        />
      </div>
    </div>
  )
}
