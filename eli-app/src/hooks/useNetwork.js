/**
 * useNetwork.js — Détection réseau pour le Mode Bougie
 */
import { useState, useEffect } from 'react'

export default function useNetwork() {
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine)

  useEffect(() => {
    const goOnline  = () => setIsOffline(false)
    const goOffline = () => setIsOffline(true)

    window.addEventListener('online',  goOnline)
    window.addEventListener('offline', goOffline)

    // Appliquer classe globale Mode Bougie
    document.body.classList.toggle('mode-bougie-active', isOffline)

    return () => {
      window.removeEventListener('online',  goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [isOffline])

  return { isOffline }
}
