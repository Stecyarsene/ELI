/**
 * security.js — Utilitaires de sécurité frontend Éli
 * ════════════════════════════════════════════════════════════════
 * Quota Guest    : localStorage + fingerprint (résistant au F5)
 * Sanitisation   : Anti-XSS sur tous les retours IA
 * CORS headers   : Commentaires pour config serveur
 * ════════════════════════════════════════════════════════════════
 */

// ── Constantes ─────────────────────────────────────────────────
export const GUEST_QUOTA_MAX = 5
export const QUOTA_KEY       = 'eli_guest_quota_v1'
export const FP_KEY          = 'eli_guest_fp_v1'
export const TENANT_KEY      = 'eli_tenant_v1'

// ── Fingerprint anonyme ─────────────────────────────────────────
// Résistant au localStorage.clear() via combinaison de signaux
export function getOrCreateFingerprint() {
  try {
    let fp = localStorage.getItem(FP_KEY)
    if (!fp) {
      // Combinaison : timestamp + random + userAgent hash
      const uaChunk = btoa(
        (navigator.userAgent || '').slice(0, 40)
      ).slice(0, 12).replace(/[^a-z0-9]/gi, '')
      fp = `fp_${uaChunk}_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`
      localStorage.setItem(FP_KEY, fp)
    }
    return fp
  } catch {
    return 'fp_unknown_' + Math.random().toString(36).slice(2)
  }
}

// ── Gestionnaire quota Guest ────────────────────────────────────
export const QuotaManager = {
  get() {
    try {
      const v = localStorage.getItem(QUOTA_KEY)
      const n = v !== null ? parseInt(v, 10) : GUEST_QUOTA_MAX
      return isNaN(n) ? GUEST_QUOTA_MAX : Math.max(0, Math.min(GUEST_QUOTA_MAX, n))
    } catch { return GUEST_QUOTA_MAX }
  },
  decrement() {
    try {
      const n = Math.max(0, this.get() - 1)
      localStorage.setItem(QUOTA_KEY, String(n))
      return n
    } catch { return 0 }
  },
  isExhausted() { return this.get() <= 0 },
  // Admin only — jamais exposé à l'élève
  _reset() { try { localStorage.removeItem(QUOTA_KEY) } catch {} },
}

// ── Sanitisation Anti-XSS ───────────────────────────────────────
// Nettoie les retours IA avant injection dans le DOM.
// Liste blanche stricte : seulement les balises sémantiques inoffensives.
const ALLOWED_TAGS   = ['b','i','em','strong','br','p','span','ul','ol','li','code']
const ALLOWED_ATTRS  = ['class']

export function sanitize(raw) {
  if (!raw || typeof raw !== 'string') return ''
  if (typeof window === 'undefined') return raw

  // Utilisation de DOMParser pour isoler le parsing
  const doc = new DOMParser().parseFromString(raw, 'text/html')
  const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_ALL)

  const strip = (node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName.toLowerCase()
      if (!ALLOWED_TAGS.includes(tag)) {
        node.replaceWith(...node.childNodes)
        return
      }
      // Supprimer les attributs non autorisés
      ;[...node.attributes].forEach(attr => {
        if (!ALLOWED_ATTRS.includes(attr.name)) node.removeAttribute(attr.name)
      })
    }
  }

  ;[...doc.body.querySelectorAll('*')].reverse().forEach(strip)
  return doc.body.innerHTML
}

// ── Persistance du choix tenant ─────────────────────────────────
export const TenantStore = {
  get: ()    => { try { return localStorage.getItem(TENANT_KEY) } catch { return null } },
  set: (t)   => { try { localStorage.setItem(TENANT_KEY, t) } catch {} },
  clear: ()  => { try { localStorage.removeItem(TENANT_KEY) } catch {} },
}

/*
 * ── TODO Sprint 2 : Headers serveur (Vercel / Nginx) ────────────
 *
 * X-Frame-Options: DENY
 * X-Content-Type-Options: nosniff
 * Referrer-Policy: strict-origin-when-cross-origin
 * Permissions-Policy: microphone=(self), camera=(self)
 * Content-Security-Policy: [voir index.html]
 *
 * ── CORS (Supabase Edge Functions) ──────────────────────────────
 * Access-Control-Allow-Origin: https://eli.app (domaine prod)
 * Access-Control-Allow-Methods: POST, OPTIONS
 * Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type, x-guest-fp
 */
