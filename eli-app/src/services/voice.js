/**
 * voice.js — Moteur Vocal Modulaire Éli (Voice-First)
 * ════════════════════════════════════════════════════════════════
 * ADN d'Éli : tuteur ORAL. L'audio est le vecteur principal.
 *
 * ARCHITECTURE MODULAIRE :
 *   - Provider actif au lancement : 'webspeech' (gratuit, natif)
 *   - Prêt pour : 'elevenlabs', 'openai' (bascule en 1 ligne via VOICE_PROVIDER)
 *
 * Pour basculer vers ElevenLabs plus tard :
 *   1. Mettre VOICE_PROVIDER = 'elevenlabs'
 *   2. Implémenter speakElevenLabs() (Edge Function, jamais de clé ici)
 *   Le reste du code (composants) ne change pas.
 * ════════════════════════════════════════════════════════════════
 */

// ── Provider actif ──────────────────────────────────────────────
export const VOICE_PROVIDER = 'webspeech' // 'webspeech' | 'elevenlabs' | 'openai'

// ── Capacités du navigateur ─────────────────────────────────────
export const voiceSupport = {
  tts: typeof window !== 'undefined' && 'speechSynthesis' in window,
  stt: typeof window !== 'undefined' &&
       ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window),
}

// ════════════════════════════════════════════════════════════════
// TTS — Synthèse vocale (Éli parle)
// ════════════════════════════════════════════════════════════════

/**
 * Sélectionne la meilleure voix française disponible.
 * Calibrage par mode : 'primaire' = plus lent, plus aigu (enfants).
 */
function pickFrenchVoice() {
  if (!voiceSupport.tts) return null
  const voices = window.speechSynthesis.getVoices()
  // Priorité : voix française de qualité
  return (
    voices.find(v => /fr[-_]FR/i.test(v.lang) && /google|natural|premium/i.test(v.name)) ||
    voices.find(v => /fr[-_]FR/i.test(v.lang)) ||
    voices.find(v => /^fr/i.test(v.lang)) ||
    null
  )
}

/**
 * Fait parler Éli avec synchronisation mot-à-mot (effet tableau noir).
 *
 * @param {string} text           Texte à dire (déjà sanitisé)
 * @param {Object} opts
 * @param {'standard'|'primaire'|'aefe'} opts.mode  Calibrage voix
 * @param {(charIndex:number)=>void} opts.onBoundary  Callback à chaque mot (sync texte)
 * @param {()=>void} opts.onStart
 * @param {()=>void} opts.onEnd
 * @returns {{cancel:()=>void}}
 */
export function speak(text, { mode = 'standard', onBoundary, onStart, onEnd } = {}) {
  // ── Aiguillage modulaire ──────────────────────────────────────
  if (VOICE_PROVIDER === 'elevenlabs') return speakElevenLabs(text, { mode, onBoundary, onStart, onEnd })
  if (VOICE_PROVIDER === 'openai')     return speakOpenAI(text, { mode, onBoundary, onStart, onEnd })
  return speakWebSpeech(text, { mode, onBoundary, onStart, onEnd })
}

// ── Implémentation Web Speech (active) ──────────────────────────
function speakWebSpeech(text, { mode, onBoundary, onStart, onEnd }) {
  if (!voiceSupport.tts || !text) { onEnd?.(); return { cancel() {} } }

  window.speechSynthesis.cancel() // Stopper toute lecture en cours

  const u = new SpeechSynthesisUtterance(text)
  const voice = pickFrenchVoice()
  if (voice) u.voice = voice
  u.lang = 'fr-FR'

  // Calibrage par mode
  if (mode === 'primaire') { u.rate = 0.75; u.pitch = 1.2 }   // Enfant : lent, aigu
  else if (mode === 'aefe') { u.rate = 0.95; u.pitch = 0.95 } // Académique : posé
  else { u.rate = 0.92; u.pitch = 1.0 }                       // Standard

  u.onstart = () => onStart?.()
  u.onend   = () => onEnd?.()
  // Synchronisation mot-à-mot (effet tableau noir)
  u.onboundary = (e) => {
    if (e.name === 'word' || e.charIndex != null) onBoundary?.(e.charIndex)
  }

  window.speechSynthesis.speak(u)

  return { cancel: () => window.speechSynthesis.cancel() }
}

// ── Implémentation ElevenLabs (placeholder — Sprint payant) ─────
// TODO : Brancher via Edge Function Supabase (la clé ElevenLabs reste serveur).
//   1. POST /functions/v1/eli-tts { text, voice_id }
//   2. Recevoir le flux audio (stream MP3)
//   3. Lire via Audio() + timeupdate pour la sync texte
function speakElevenLabs(text, { onStart, onEnd }) {
  console.warn('[voice] ElevenLabs non implémenté — fallback Web Speech')
  return speakWebSpeech(text, { mode: 'standard', onStart, onEnd })
}

// ── Implémentation OpenAI TTS (placeholder) ─────────────────────
function speakOpenAI(text, { onStart, onEnd }) {
  console.warn('[voice] OpenAI TTS non implémenté — fallback Web Speech')
  return speakWebSpeech(text, { mode: 'standard', onStart, onEnd })
}

export function stopSpeaking() {
  if (voiceSupport.tts) window.speechSynthesis.cancel()
}

// ════════════════════════════════════════════════════════════════
// STT — Reconnaissance vocale (l'élève parle, dictée native)
// ════════════════════════════════════════════════════════════════

/**
 * Démarre l'écoute du micro et transcrit en français.
 *
 * @param {Object} opts
 * @param {(text:string)=>void} opts.onResult   Transcription finale
 * @param {(text:string)=>void} opts.onInterim  Transcription en cours (temps réel)
 * @param {(err:string)=>void} opts.onError
 * @param {()=>void} opts.onEnd
 * @returns {{stop:()=>void}}
 */
export function listen({ onResult, onInterim, onError, onEnd } = {}) {
  if (!voiceSupport.stt) {
    onError?.('La dictée vocale n\'est pas disponible sur ce navigateur.')
    return { stop() {} }
  }

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  const rec = new SR()
  rec.lang = 'fr-FR'
  rec.continuous = false
  rec.interimResults = true
  rec.maxAlternatives = 3 // Tolérant aux accents

  let finalText = ''

  rec.onresult = (e) => {
    let interim = ''
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript
      if (e.results[i].isFinal) finalText += t
      else interim += t
    }
    if (interim) onInterim?.(interim)
    if (finalText) onResult?.(finalText.trim())
  }
  rec.onerror = (e) => onError?.(e.error || 'Erreur micro')
  rec.onend   = () => onEnd?.()

  try { rec.start() } catch { onError?.('Micro déjà actif') }

  return { stop: () => { try { rec.stop() } catch {} } }
}
