/**
 * useVoice.js — Hook de gestion de l'état vocal Éli
 * Pilote la synthèse (Éli parle) et la reconnaissance (élève dicte).
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import { speak, listen, stopSpeaking, voiceSupport } from '../services/voice.js'

export default function useVoice() {
  const [isSpeaking,  setIsSpeaking]  = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [spokenChars, setSpokenChars] = useState(0)   // sync texte (effet tableau noir)
  const [voiceEnabled, setVoiceEnabled] = useState(true) // Voice-First par défaut

  const speakHandle  = useRef(null)
  const listenHandle = useRef(null)

  // Charger les voix au montage (Chrome les charge async)
  useEffect(() => {
    if (voiceSupport.tts) {
      window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
    }
    return () => { stopSpeaking() }
  }, [])

  // ── Éli parle (avec sync texte mot-à-mot) ──────────────────
  const eliSpeak = useCallback((text, mode = 'standard') => {
    if (!voiceEnabled || !text) return
    setSpokenChars(0)
    speakHandle.current = speak(text, {
      mode,
      onStart:    () => setIsSpeaking(true),
      onEnd:      () => { setIsSpeaking(false); setSpokenChars(text.length) },
      onBoundary: (charIndex) => setSpokenChars(charIndex),
    })
  }, [voiceEnabled])

  const stopEli = useCallback(() => {
    speakHandle.current?.cancel()
    stopSpeaking()
    setIsSpeaking(false)
  }, [])

  // ── Élève dicte (micro) ─────────────────────────────────────
  const startListening = useCallback(({ onResult, onInterim, onError } = {}) => {
    setIsListening(true)
    listenHandle.current = listen({
      onInterim,
      onResult: (text) => { onResult?.(text) },
      onError:  (err)  => { setIsListening(false); onError?.(err) },
      onEnd:    ()     => setIsListening(false),
    })
  }, [])

  const stopListening = useCallback(() => {
    listenHandle.current?.stop()
    setIsListening(false)
  }, [])

  return {
    // état
    isSpeaking, isListening, spokenChars, voiceEnabled,
    // capacités navigateur
    ttsSupported: voiceSupport.tts, sttSupported: voiceSupport.stt,
    // actions
    eliSpeak, stopEli, startListening, stopListening,
    setVoiceEnabled,
  }
}
