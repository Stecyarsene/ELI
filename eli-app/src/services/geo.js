/**
 * geo.js — Résolution du pays & vérification d'accès (OPTION B, SPA Vite)
 * ════════════════════════════════════════════════════════════════
 * La SOURCE DE VÉRITÉ est l'Edge Function geo-guard (serveur).
 * Le frontend ne fait que demander — il ne décide jamais seul.
 * Fail-closed : en cas de doute, accès refusé.
 * ════════════════════════════════════════════════════════════════
 */

const SUPA_FUNC = 'https://wbmeqhaopfdsqscalhga.supabase.co/functions/v1'

// Préfixes téléphoniques → code pays (résolution via numéro WhatsApp lié)
const PHONE_PREFIX_TO_COUNTRY = {
  '+241': 'GA', '+225': 'CI', '+237': 'CM',
  '+242': 'CG', '+221': 'SN', '+33': 'FR',
}

/**
 * Déduit le code pays depuis un numéro de téléphone (E.164).
 * @param {string} phone  ex: '+241077374043'
 * @returns {string|null}
 */
export function countryFromPhone(phone) {
  if (!phone) return null
  const cleaned = phone.replace(/\s/g, '')
  // Trier par longueur de préfixe décroissante (évite '+2' avant '+241')
  const prefixes = Object.keys(PHONE_PREFIX_TO_COUNTRY).sort((a, b) => b.length - a.length)
  for (const prefix of prefixes) {
    if (cleaned.startsWith(prefix)) return PHONE_PREFIX_TO_COUNTRY[prefix]
  }
  return null
}

/**
 * Vérifie l'accès à un portail auprès du serveur (autorité finale).
 * @param {Object} opts
 * @param {'national'|'aefe'} opts.portal
 * @param {string|null} opts.countryCode  Optionnel (sinon géo-IP serveur)
 * @returns {Promise<{allowed:boolean, reason?:string, country_name?:string, program_id?:string}>}
 */
export async function checkAccess({ portal, countryCode = null }) {
  try {
    const res = await fetch(`${SUPA_FUNC}/geo-guard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ portal, country_code: countryCode }),
    })
    const data = await res.json().catch(() => null)
    // Fail-closed : toute réponse non conforme = refus
    if (!data || typeof data.allowed !== 'boolean') {
      return { allowed: false, reason: 'invalid_response' }
    }
    return data
  } catch {
    // Réseau coupé → refus (fail-closed). Pas de contournement offline.
    return { allowed: false, reason: 'network_error' }
  }
}
