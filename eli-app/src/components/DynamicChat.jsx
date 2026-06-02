/**
 * DynamicChat.jsx — Composant Chat Principal Éli
 * ════════════════════════════════════════════════════════════════
 * Sécurité  : Render locking (anti-F12), quota localStorage,
 *             sanitisation XSS, zéro clé API dans le bundle
 * A11y      : WCAG 2.1 AA — aria-labels, rôles, focus-visible
 * Tenant    : 'nationale' (vert) | 'aefe' (bleu)
 * ════════════════════════════════════════════════════════════════
 */
import React, {
  useState, useEffect, useRef, useCallback, createContext, useContext
} from 'react'
import EliLogo from './EliLogo.jsx'
import PaywallDrawer from './PaywallDrawer.jsx'
import useNetwork from '../hooks/useNetwork.js'
import useVoice from '../hooks/useVoice.js'
import { sendMessageToEli } from '../services/api.js'
import {
  sanitize,
  QuotaManager,
  getOrCreateFingerprint,
  GUEST_QUOTA_MAX,
  TenantStore,
} from '../services/security.js'

// ── Thèmes ──────────────────────────────────────────────────────
const THEMES = {
  nationale: {
    primary:     '#00A86B',
    primaryDark: '#006B42',
    primaryLight:'#E6F7F1',
    secondary:   '#0F2942',
    accent:      '#FFCC00',
    navBg:       '#0F2942',
    pageBg:      '#F8F9FA',
    userBubbleBg:'#00A86B',
    eliBubbleBg: '#FFFFFF',
    eliBubbleBorder:'#E5E7EB',
    eliNameColor:'#00A86B',
    btnPrimary:  'bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500',
    badgeBg:     'rgba(0,168,107,.12)',
    badgeColor:  '#00A86B',
    badgeBorder: 'rgba(0,168,107,.25)',
    pillarBorder:'rgba(0,168,107,.0)',
    pillarHover: '#00A86B',
    label:       'Nationale',
    priceP:      '5 000 FCFA',
    priceU:      '10 000 FCFA',
  },
  aefe: {
    primary:     '#1565C0',
    primaryDark: '#0D47A1',
    primaryLight:'#E8F0FE',
    secondary:   '#0A1628',
    accent:      '#E2E8F0',
    navBg:       '#0A1628',
    pageBg:      '#040810',
    userBubbleBg:'#1565C0',
    eliBubbleBg: '#0F1F3A',
    eliBubbleBorder:'rgba(255,255,255,.08)',
    eliNameColor:'#90CAF9',
    btnPrimary:  'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500',
    badgeBg:     'rgba(21,101,192,.15)',
    badgeColor:  '#90CAF9',
    badgeBorder: 'rgba(21,101,192,.3)',
    pillarBorder:'rgba(21,101,192,.0)',
    pillarHover: '#1565C0',
    label:       'AEFE',
    priceP:      '10 €',
    priceU:      '20 €',
  },
}

// ── Contexte App ────────────────────────────────────────────────
const AppCtx = createContext(null)
const useApp = () => useContext(AppCtx)

// ════════════════════════════════════════════════════════════════
// PILIERS — définition des modules Premium
// ════════════════════════════════════════════════════════════════
const PILLARS_NATIONALE = [
  { id:'oral',      icon:'🎙️', label:'Simulateur Oral',   tier:'premium' },
  { id:'oracle',    icon:'⚡',  label:'Prédicteur',        tier:'premium' },
  { id:'ocr',       icon:'📸', label:'Analyser Brouillon', tier:'premium' },
  { id:'tableau',   icon:'📷', label:'Scanner Tableau',    tier:'premium' },
  { id:'fiches',    icon:'📚', label:'Fiches & Quiz',      tier:'premium' },
  { id:'j7',        icon:'🔴', label:'Protocole J-7',      tier:'premium' },
  { id:'avenir',    icon:'🌟', label:'Mon Avenir',         tier:'ultra'   },
  { id:'bougie',    icon:'🕯️', label:'Mode Bougie',        tier:'premium' },
]

const PILLARS_AEFE = [
  { id:'oral',      icon:'🎙️', label:'Grand Oral',          tier:'premium' },
  { id:'oracle',    icon:'⚡',  label:'Prédicteur BAC',      tier:'premium' },
  { id:'ocr',       icon:'📸', label:'Scanner Devoir',       tier:'premium' },
  { id:'tableau',   icon:'📷', label:'Scanner Cours',        tier:'premium' },
  { id:'fiches',    icon:'📚', label:'Fiches & Quiz',        tier:'premium' },
  { id:'dissert',   icon:'📝', label:'Labo Dissertation',    tier:'premium' },
  { id:'avenir',    icon:'🌟', label:'Parcoursup IA',        tier:'ultra'   },
  { id:'bougie',    icon:'🕯️', label:'Mode Bougie',          tier:'premium' },
]

// ════════════════════════════════════════════════════════════════
// SOUS-COMPOSANT : CandleIndicator
// ════════════════════════════════════════════════════════════════
function CandleIndicator({ isOffline }) {
  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold transition-all duration-300 ${
        isOffline
          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
      }`}
      role="status"
      aria-live="polite"
      aria-label={isOffline ? 'Mode hors-ligne actif' : 'Connecté'}
    >
      <span className={isOffline ? 'animate-flicker' : ''} aria-hidden="true">
        {isOffline ? '🕯️' : '●'}
      </span>
      {isOffline ? 'Mode Bougie' : 'Connecté'}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// SOUS-COMPOSANT : ChatSkeleton
// ════════════════════════════════════════════════════════════════
function ChatSkeleton() {
  return (
    <div className="flex justify-start" aria-label="Éli réfléchit..." aria-live="polite">
      <div className="rounded-2xl rounded-tl-sm px-4 py-4 max-w-xs border"
        style={{ background: '#fff', borderColor: '#E5E7EB' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-full bg-emerald-100 animate-pulse" />
          <div className="h-2.5 w-16 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-2.5 w-full bg-gray-100 rounded animate-pulse" />
          <div className="h-2.5 w-4/5 bg-gray-100 rounded animate-pulse" />
          <div className="h-2.5 w-3/5 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// SOUS-COMPOSANT : PillarCard (module verrouillé)
// SÉCURITÉ : N'affiche jamais la donnée — affiche uniquement le cadenas
// ════════════════════════════════════════════════════════════════
function PillarCard({ pillar, onUnlock }) {
  const { theme } = useApp()
  return (
    <button
      onClick={() => onUnlock(pillar.label, pillar.tier)}
      className="relative flex flex-col items-center gap-1 p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all group active:scale-95 focus-visible:ring-2 focus-visible:ring-white/40"
      aria-label={`Débloquer ${pillar.label} — module Premium`}
    >
      <span
        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-xs"
        style={{ background: '#F9A825', color: '#030C04', fontSize: '8px' }}
        aria-hidden="true"
      >🔒</span>
      <span className="text-xl group-hover:scale-110 transition-transform" aria-hidden="true">
        {pillar.icon}
      </span>
      <span className="text-xs font-semibold text-white/50 text-center leading-tight">
        {pillar.label}
      </span>
      {pillar.tier === 'ultra' && (
        <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
          style={{ background: 'rgba(249,168,37,.15)', color: '#F9A825', fontSize: '9px' }}>
          Ultra
        </span>
      )}
    </button>
  )
}

// ════════════════════════════════════════════════════════════════
// SOUS-COMPOSANT : MessageBubble (Factory render_type)
// ════════════════════════════════════════════════════════════════
function MessageBubble({ message, isLatestEli }) {
  const { theme, isPremium, isUltra, openPaywall, spokenChars, isSpeaking } = useApp()
  const { sender, render_type, content } = message

  // ── Élève ──────────────────────────────────────────────────
  if (sender === 'student') {
    return (
      <div className="flex justify-end" role="listitem">
        <div
          className="rounded-2xl rounded-tr-sm px-4 py-3 max-w-[82%] shadow-sm"
          style={{ background: theme.userBubbleBg }}
        >
          <p className="text-sm leading-relaxed text-white">
            {content.text_content}
          </p>
        </div>
      </div>
    )
  }

  // ── Système ────────────────────────────────────────────────
  if (sender === 'system') {
    return (
      <div className="flex justify-center my-1" role="listitem" aria-live="polite">
        <span className="text-xs px-3 py-1 rounded-full border"
          style={{ color: 'rgba(255,255,255,.4)', background: 'rgba(255,255,255,.04)', borderColor: 'rgba(255,255,255,.08)' }}>
          {content.text_content}
        </span>
      </div>
    )
  }

  // ── Factory Éli ────────────────────────────────────────────
  switch (render_type) {

    // Texte socratique (défaut)
    case 'text_socratic':
    default:
      return (
        <div className="flex justify-start" role="listitem">
          <div
            className="rounded-2xl rounded-tl-sm px-4 py-3.5 max-w-[82%] shadow-sm border"
            style={{
              background: theme.eliBubbleBg,
              borderColor: theme.eliBubbleBorder,
            }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black text-white"
                style={{ background: `linear-gradient(135deg,${theme.primary},${theme.primaryDark})` }}
                aria-hidden="true"
              >É</div>
              <span className="text-xs font-bold" style={{ color: theme.eliNameColor }}>
                Professeur Éli
              </span>
            </div>
            {/* SÉCURITÉ : dangerouslySetInnerHTML uniquement sur contenu sanitisé */}
            {/* VOICE-FIRST : effet tableau noir — le texte s'éclaire au rythme de la voix */}
            {isLatestEli && isSpeaking ? (
              <p
                className="text-sm leading-relaxed"
                aria-live="off"
              >
                <span style={{ color: theme.navBg === '#0A1628' ? 'rgba(255,255,255,.95)' : '#1A202C' }}>
                  {content.text_content.slice(0, spokenChars)}
                </span>
                <span style={{ color: theme.navBg === '#0A1628' ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.25)' }}>
                  {content.text_content.slice(spokenChars)}
                </span>
              </p>
            ) : (
              <p
                className="text-sm leading-relaxed"
                style={{ color: theme.navBg === '#0A1628' ? 'rgba(255,255,255,.85)' : '#1A202C' }}
                dangerouslySetInnerHTML={{ __html: sanitize(content.text_content) }}
              />
            )}
          </div>
        </div>
      )

    // Simulateur d'Oral
    // SÉCURITÉ : rendu conditionnel — si !isPremium → skeleton + paywall
    case 'voice_oral':
      if (!isPremium) {
        openPaywall('Simulateur d\'Oral', 'premium')
        return <ChatSkeleton />
      }
      return (
        <div className="w-full my-3 p-6 rounded-2xl shadow-xl" role="listitem"
          style={{ background: '#0F2942' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" aria-hidden="true"/>
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#F9A825' }}>
              Simulateur d'Oral · En cours
            </span>
          </div>
          {/* TODO Sprint 2 : AudioVisualizer (Canvas + Web Audio API) */}
          <div className="h-14 rounded-xl flex items-center justify-center mb-4 border"
            style={{ background: 'rgba(255,255,255,.04)', borderColor: 'rgba(255,255,255,.08)' }}>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,.3)' }}>
              🎙️ Visualiseur audio — Sprint 2
            </span>
          </div>
          <p className="text-sm text-center italic" style={{ color: 'rgba(255,255,255,.7)' }}>
            "{sanitize(content.text_content)}"
          </p>
        </div>
      )

    // OCR Brouillon
    case 'ocr_overlay':
      if (!isPremium) {
        openPaywall('Analyseur de Brouillon', 'premium')
        return <ChatSkeleton />
      }
      return (
        <div className="w-full my-3 rounded-xl overflow-hidden border" role="listitem"
          style={{ borderColor: 'rgba(255,255,255,.08)' }}>
          <div className="px-4 py-2.5 border-b flex items-center gap-2"
            style={{ borderColor: 'rgba(255,255,255,.06)', background: 'rgba(255,255,255,.04)' }}>
            <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,.4)' }}>
              📸 Analyse au barème officiel
            </span>
          </div>
          <div className="p-4" style={{ background: theme.eliBubbleBg }}>
            {content.interactive_data?.image_url && (
              <img src={content.interactive_data.image_url} alt="Brouillon analysé"
                className="w-full rounded-lg mb-3 border" style={{ borderColor: 'rgba(255,255,255,.06)' }} />
            )}
            {/* TODO Sprint 2 : Superposer InteractiveCanvas avec error_zones */}
            <p className="text-sm leading-relaxed" style={{ color: theme.navBg === '#0A1628' ? 'rgba(255,255,255,.8)' : '#1A202C' }}
              dangerouslySetInnerHTML={{ __html: sanitize(content.text_content) }}/>
          </div>
        </div>
      )

    // Split Tableau
    case 'split_tableau':
      if (!isPremium) {
        openPaywall('Scanner de Tableau', 'premium')
        return <ChatSkeleton />
      }
      return (
        <div className="w-full my-3 rounded-xl overflow-hidden border" role="listitem"
          style={{ minHeight: 280, borderColor: 'rgba(255,255,255,.08)' }}>
          <div className="grid grid-cols-2 h-full divide-x" style={{ divideColor: 'rgba(255,255,255,.06)' }}>
            <div className="p-4 overflow-y-auto" style={{ background: theme.eliBubbleBg }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,.3)' }}>
                📄 Fiche de cours
              </p>
              {/* TODO Sprint 2 : react-markdown + KaTeX */}
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,.8)' }}>
                {sanitize(content.interactive_data?.fiche_markdown || content.text_content)}
              </p>
            </div>
            <div className="p-4" style={{ background: 'rgba(255,255,255,.02)' }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,.3)' }}>
                🧪 Quiz auto-généré
              </p>
              <p className="text-xs italic" style={{ color: 'rgba(255,255,255,.2)' }}>
                Quiz — Sprint 2
              </p>
            </div>
          </div>
        </div>
      )

    // Quiz Adaptatif
    case 'quiz_adaptive':
      if (!isPremium) {
        openPaywall('Fiches & Quiz', 'premium')
        return <ChatSkeleton />
      }
      return (
        <div className="w-full my-3 p-5 rounded-2xl border" role="listitem"
          style={{ background: theme.eliBubbleBg, borderColor: theme.eliBubbleBorder }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,.35)' }}>
              Quiz adaptatif
            </span>
            {content.interactive_data?.difficulty_level && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold border"
                style={{ background: 'rgba(255,204,0,.1)', color: '#FFCC00', borderColor: 'rgba(255,204,0,.2)' }}>
                Niveau {content.interactive_data.difficulty_level}/5
              </span>
            )}
          </div>
          <p className="text-sm font-medium mb-4 leading-relaxed"
            style={{ color: theme.navBg === '#0A1628' ? 'rgba(255,255,255,.85)' : '#1A202C' }}>
            {sanitize(content.text_content)}
          </p>
          <div className="space-y-2" role="group" aria-label="Options de réponse">
            {(content.interactive_data?.questions?.[0]?.options || []).map((opt, i) => (
              <button
                key={i}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all focus-visible:ring-2 active:scale-95"
                style={{ borderColor: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.7)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = theme.primary; e.currentTarget.style.background = `${theme.primary}15` }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'; e.currentTarget.style.background = 'transparent' }}
                aria-label={`Option de réponse : ${opt}`}
                onClick={() => {
                  /* TODO Sprint 2 : validate-quiz-answer Edge Function — jamais en local */
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )

    // Orientation (Ultra-Premium)
    // SÉCURITÉ : si !isUltra → skeleton + paywall — la donnée n'existe pas dans le DOM
    case 'orientation_card':
      if (!isUltra) {
        openPaywall('Mon Avenir', 'ultra')
        return <ChatSkeleton />
      }
      return (
        <div className="w-full my-3 p-5 rounded-2xl border" role="listitem"
          style={{ background: 'linear-gradient(135deg,#0A1628,#0D1F3C)', borderColor: 'rgba(21,101,192,.3)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span style={{ color: '#F9A825', fontSize: '11px', fontWeight: 700, letterSpacing: '.08em' }}>
              🌟 MON AVENIR · Ultra-Premium
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,.8)' }}
            dangerouslySetInnerHTML={{ __html: sanitize(content.text_content) }}/>
          {content.interactive_data?.source && (
            <p className="text-xs mt-3 pt-3 border-t" style={{ color: 'rgba(255,255,255,.25)', borderColor: 'rgba(255,255,255,.06)' }}>
              📡 Source : {content.interactive_data.source}
            </p>
          )}
        </div>
      )
  }
}

// ════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════════
export default function DynamicChat({ tenantType = 'nationale', userProfile = null, onBackToHub }) {
  const theme      = THEMES[tenantType] || THEMES.nationale
  const pillars    = tenantType === 'aefe' ? PILLARS_AEFE : PILLARS_NATIONALE
  const { isOffline } = useNetwork()
  const fingerprint   = useRef(getOrCreateFingerprint())
  const chatEndRef    = useRef(null)
  const inputRef      = useRef(null)

  // ── États ──────────────────────────────────────────────────
  const [messages,    setMessages]    = useState([])
  const [inputValue,  setInputValue]  = useState('')
  const [isLoading,   setIsLoading]   = useState(false)
  const [guestQuota,  setGuestQuota]  = useState(() => QuotaManager.get())
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [paywallData, setPaywallData] = useState({ name: '', tier: 'premium' })
  const [blurActive,  setBlurActive]  = useState(false)

  const isGuest     = !userProfile
  const isPremium   = !!userProfile?.isPremium
  const isUltra     = !!userProfile?.isUltra
  const isQuotaDone = isGuest && guestQuota <= 0

  // ── Voice-First : ADN d'Éli (tuteur oral) ──────────────────
  const voice = useVoice()
  // Mode primaire : CP1→CE2 = interface vocale, vocabulaire simplifié
  const gradeLevel = (userProfile?.gradeLevel || '').toLowerCase()
  const isPrimaire = /cp1|cp2|ce1|ce2/.test(gradeLevel)
  const voiceMode  = isPrimaire ? 'primaire' : (tenantType === 'aefe' ? 'aefe' : 'standard')

  // ── Scroll auto ────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // ── Message de bienvenue (parlé par Éli — Voice-First) ──────
  useEffect(() => {
    let txt
    if (isPrimaire) {
      txt = `Bonjour ! Moi c'est Éli. Appuie sur le micro et parle-moi. Je vais t'aider ! 🎤`
    } else if (isGuest) {
      txt = `Bonjour ! Je suis Éli, ton professeur IA. Tu as ${GUEST_QUOTA_MAX} échanges gratuits pour me découvrir. Pose-moi n'importe quelle question sur tes cours ! 🎯`
    } else {
      txt = `Bonjour${userProfile?.firstName ? ' ' + userProfile.firstName : ''} ! Quel chapitre on attaque ensemble aujourd'hui ? 🎯`
    }
    setMessages([{
      message_id: 'welcome', sender: 'eli', timestamp: new Date().toISOString(),
      render_type: 'text_socratic', content: { text_content: txt },
      network_context: { is_offline_compatible: true },
    }])
    // Éli parle son message d'accueil (sans les emojis)
    const cleanTxt = txt.replace(/[🎤🎯]/g, '').trim()
    setTimeout(() => voice.eliSpeak(cleanTxt, voiceMode), 400)
  }, []) // eslint-disable-line

  // ── Ouvrir paywall avec blur animation ─────────────────────
  const openPaywall = useCallback((name, tier = 'premium') => {
    setBlurActive(true)
    setTimeout(() => {
      setPaywallData({ name, tier })
      setPaywallOpen(true)
      setBlurActive(false)
    }, 800)
  }, [])

  const closePaywall = useCallback(() => setPaywallOpen(false), [])

  // ── Envoi message ───────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const txt = inputValue.trim()
    if (!txt || isLoading) return
    if (isGuest && QuotaManager.isExhausted()) { openPaywall('Chat Éli Illimité', 'premium'); return }
    if (isOffline) { appendSystem('Mode Bougie actif — Éli a besoin d\'internet pour répondre.'); return }

    const studentMsg = {
      message_id: `s_${Date.now()}`, sender: 'student', timestamp: new Date().toISOString(),
      render_type: 'text_socratic', content: { text_content: txt },
      network_context: { is_offline_compatible: false },
    }
    setMessages(p => [...p, studentMsg])
    setInputValue('')
    setIsLoading(true)

    if (isGuest) {
      const rem = QuotaManager.decrement()
      setGuestQuota(rem)
    }

    try {
      const data = await sendMessageToEli({
        message: txt, token: userProfile?.supabaseToken || null,
        fingerprint: fingerprint.current, tenantType,
        gradeLevel: userProfile?.gradeLevel || null,
        examType:   userProfile?.examType   || null,
        isGuest,
      })
      const eliText = data.content?.text_content || data.response || 'Désolé, réessaie.'
      setMessages(p => [...p, {
        message_id: `e_${Date.now()}`, sender: 'eli', timestamp: new Date().toISOString(),
        render_type: data.render_type || 'text_socratic',
        content: data.content || { text_content: eliText },
        network_context: { is_offline_compatible: false },
      }])
      // Voice-First : Éli parle sa réponse (texte socratique uniquement)
      if ((data.render_type || 'text_socratic') === 'text_socratic') {
        voice.eliSpeak(eliText.replace(/<[^>]+>/g, '').replace(/[🎯✅💡🔥🎤]/g, '').trim(), voiceMode)
      }
      if (isGuest && QuotaManager.isExhausted()) {
        setTimeout(() => openPaywall('Chat Éli Illimité', 'premium'), 800)
      }
    } catch (err) {
      appendSystem(err.message || 'Erreur réseau. Réessaie.')
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }, [inputValue, isLoading, isGuest, isOffline, tenantType, userProfile, openPaywall])

  const appendSystem = (text) =>
    setMessages(p => [...p, {
      message_id: `sys_${Date.now()}`, sender: 'system', timestamp: new Date().toISOString(),
      render_type: 'text_socratic', content: { text_content: text },
      network_context: { is_offline_compatible: true },
    }])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <AppCtx.Provider value={{ theme, isPremium, isUltra, openPaywall, spokenChars: voice.spokenChars, isSpeaking: voice.isSpeaking }}>
      <div
        className="flex flex-col h-screen"
        style={{ background: theme.pageBg }}
        role="main"
        aria-label={`Interface Éli ${theme.label}`}
      >

        {/* ── NAVBAR ─────────────────────────────────────────── */}
        <header
          className="flex items-center justify-between px-5 py-3.5 shadow-md z-30 shrink-0"
          style={{ background: theme.navBg }}
          role="banner"
        >
          <div className="flex items-center gap-3">
            <EliLogo size={34} />
            <div className="flex items-center gap-2">
              <span
                className="text-lg font-black tracking-tight"
                style={{ fontFamily: "'Syne',sans-serif", color: '#F9A825' }}
              >Éli</span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full border"
                style={{ background: `${theme.primary}20`, color: theme.primary, borderColor: `${theme.primary}30` }}
              >{theme.label}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CandleIndicator isOffline={isOffline} />
            <button
              onClick={onBackToHub}
              className="text-xs px-3 py-1.5 rounded-full border transition-all focus-visible:ring-2 focus-visible:ring-white/40"
              style={{ borderColor: 'rgba(255,255,255,.12)', color: 'rgba(255,255,255,.4)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.3)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)'; e.currentTarget.style.color = 'rgba(255,255,255,.4)' }}
              aria-label="Changer de parcours — retour à l'accueil"
            >
              ← Changer
            </button>
          </div>
        </header>

        {/* ── GRILLE PILIERS (Guest uniquement) ──────────────── */}
        {isGuest && (
          <div
            className="px-4 pt-3 pb-2 border-b shrink-0"
            style={{ background: 'rgba(255,255,255,.02)', borderColor: 'rgba(255,255,255,.05)' }}
            aria-label="Modules Premium disponibles"
          >
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {pillars.map(p => (
                <PillarCard key={p.id} pillar={p} onUnlock={openPaywall} />
              ))}
            </div>
          </div>
        )}

        {/* ── ZONE CHAT ──────────────────────────────────────── */}
        <main
          className={`flex-1 overflow-y-auto px-4 py-5 space-y-4 transition-all duration-700 ${blurActive ? 'blur-md brightness-50 pointer-events-none select-none' : ''}`}
          role="log"
          aria-label="Conversation avec Éli"
          aria-live="polite"
        >
          {messages.map((m, i) => {
            // Le dernier message Éli reçoit l'effet tableau noir synchronisé
            const isLatestEli = m.sender === 'eli' &&
              !messages.slice(i + 1).some(later => later.sender === 'eli')
            return <MessageBubble key={m.message_id} message={m} isLatestEli={isLatestEli} />
          })}
          {isLoading && <ChatSkeleton />}
          <div ref={chatEndRef} aria-hidden="true" />
        </main>

        {/* ── INPUT ──────────────────────────────────────────── */}
        <footer
          className="px-4 pb-5 pt-3 shrink-0 border-t"
          style={{ borderColor: 'rgba(255,255,255,.05)' }}
          role="contentinfo"
        >
          {/* Badge quota */}
          {isGuest && guestQuota <= 3 && (
            <div className="flex justify-center mb-3">
              <div
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border ${guestQuota <= 1 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}
                role="status"
                aria-live="polite"
              >
                {guestQuota <= 0
                  ? '⚠️ Quota épuisé — Active Éli Premium'
                  : `💬 ${guestQuota} échange${guestQuota > 1 ? 's' : ''} gratuit${guestQuota > 1 ? 's' : ''} restant${guestQuota > 1 ? 's' : ''}`}
              </div>
            </div>
          )}

          {!isQuotaDone ? (
            <div className="flex items-end gap-2.5">
              {/* ── Bouton Micro Universel (Voice-First) ── */}
              {voice.sttSupported && (
                <button
                  onClick={() => {
                    if (voice.isListening) {
                      voice.stopListening()
                    } else {
                      voice.stopEli() // Éli se tait quand l'élève parle
                      voice.startListening({
                        onInterim: (t) => setInputValue(t),
                        onResult:  (t) => { setInputValue(t); setTimeout(() => handleSend(), 300) },
                        onError:   (e) => appendSystem('Micro : ' + e),
                      })
                    }
                  }}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md transition-all active:scale-90 focus-visible:ring-2 focus-visible:ring-offset-2 shrink-0 ${voice.isListening ? 'animate-pulse' : ''}`}
                  style={{
                    background: voice.isListening ? '#DC2626' : theme.primary,
                    '--tw-ring-color': theme.primary,
                  }}
                  aria-label={voice.isListening ? 'Arrêter la dictée vocale' : 'Parler à Éli (dictée vocale)'}
                  aria-pressed={voice.isListening}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" fill="white"/>
                    <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
                  </svg>
                </button>
              )}

              {/* ── Bouton Éli parle / stop (Voice-First) ── */}
              {voice.ttsSupported && (
                <button
                  onClick={() => voice.isSpeaking ? voice.stopEli() : voice.setVoiceEnabled(v => !v)}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md transition-all active:scale-90 focus-visible:ring-2 shrink-0"
                  style={{ background: voice.voiceEnabled ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.04)', '--tw-ring-color': theme.primary }}
                  aria-label={voice.isSpeaking ? 'Arrêter la voix d\'Éli' : (voice.voiceEnabled ? 'Voix activée' : 'Voix coupée')}
                >
                  <span className="text-base" aria-hidden="true">
                    {voice.isSpeaking ? '⏸️' : (voice.voiceEnabled ? '🔊' : '🔇')}
                  </span>
                </button>
              )}

              <div
                className="flex-1 rounded-2xl border flex items-end gap-2 px-4 py-3 transition-all"
                style={{ background: 'rgba(255,255,255,.06)', borderColor: voice.isListening ? '#DC2626' : 'rgba(255,255,255,.1)' }}
              >
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={voice.isListening ? '🎤 Parle, Éli t\'écoute...' : (isPrimaire ? 'Appuie sur le micro et parle 🎤' : 'Pose ta question à Éli...')}
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-sm text-white/80 placeholder-white/25 outline-none max-h-32 leading-relaxed"
                  aria-label="Message à Professeur Éli"
                  aria-multiline="true"
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md transition-all active:scale-90 focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-30 disabled:cursor-not-allowed shrink-0`}
                style={{
                  background: inputValue.trim() && !isLoading ? theme.primary : 'rgba(255,255,255,.1)',
                  '--tw-ring-color': theme.primary,
                }}
                aria-label="Envoyer le message"
              >
                {isLoading
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true"/>
                  : <svg width="16" height="16" viewBox="0 0 16 16" fill="white" aria-hidden="true">
                      <path d="M8 1l7 7-7 7M1 8h14" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
                    </svg>
                }
              </button>
            </div>
          ) : (
            /* Quota épuisé → CTA conversion */
            <div className="text-center">
              <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,.4)' }}>
                Tu as utilisé tes {GUEST_QUOTA_MAX} échanges gratuits.
                <br />Continue avec Éli sans limite ! 🎯
              </p>
              <button
                onClick={() => openPaywall('Chat Éli Illimité', 'premium')}
                className="px-6 py-3 rounded-2xl text-white font-bold text-sm shadow-md transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ background: theme.primary, '--tw-ring-color': theme.primary }}
                aria-label={`Activer Éli Premium pour ${theme.priceP} par mois`}
              >
                ✨ Continuer avec Éli → {theme.priceP}/mois
              </button>
              <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,.25)' }}>
                Tes progrès ne sont pas sauvegardés en mode visiteur
              </p>
            </div>
          )}
        </footer>

        {/* ── MODE BOUGIE BANNIÈRE ────────────────────────────── */}
        {isOffline && (
          <div
            className="shrink-0 text-center py-2 text-xs font-bold tracking-wide z-20"
            style={{ background: 'linear-gradient(90deg,#CC4400,#FF6B00)', color: '#fff' }}
            role="alert"
            aria-live="assertive"
          >
            🕯️ Mode Bougie actif — Fiches & quiz accessibles · Éli répond dès la reconnexion
          </div>
        )}

        {/* ── PAYWALL DRAWER ─────────────────────────────────── */}
        <PaywallDrawer
          isOpen={paywallOpen}
          onClose={closePaywall}
          featureName={paywallData.name}
          requiredTier={paywallData.tier}
          tenantType={tenantType}
        />

      </div>
    </AppCtx.Provider>
  )
}
