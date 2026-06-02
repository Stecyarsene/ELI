/**
 * api.js — Service d'appels sécurisés aux Edge Functions Supabase
 * SÉCURITÉ : Aucune clé API dans ce fichier.
 *            Les secrets sont dans les Supabase Edge Function Secrets.
 */

const SUPA_FUNC = 'https://wbmeqhaopfdsqscalhga.supabase.co/functions/v1'

/**
 * Appel à l'Edge Function eli-chat
 * @param {Object} params
 * @param {string} params.message        Message de l'élève
 * @param {string|null} params.token     Token Supabase (null si Guest)
 * @param {string} params.fingerprint    Fingerprint anonyme
 * @param {string} params.tenantType     'nationale' | 'aefe'
 * @param {string|null} params.gradeLevel Niveau scolaire
 * @param {string|null} params.examType  Type d'examen
 * @param {boolean} params.isGuest
 */
export async function sendMessageToEli({
  message,
  token = null,
  fingerprint,
  tenantType = 'nationale',
  gradeLevel = null,
  examType   = null,
  isGuest    = true,
}) {
  const headers = { 'Content-Type': 'application/json' }

  // Auth : Bearer token pour les utilisateurs connectés
  if (token) headers['Authorization'] = `Bearer ${token}`

  // Guest : fingerprint pour validation serveur anti-fraude
  // TODO Sprint 2 : Le serveur vérifie le quota par fingerprint en base
  if (isGuest) headers['x-guest-fp'] = fingerprint

  const res = await fetch(`${SUPA_FUNC}/eli-chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message,
      grade_level:  gradeLevel,
      exam_type:    examType,
      tenant_type:  tenantType,
      is_guest:     isGuest,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    if (res.status === 429) throw new Error('Quota épuisé. Active Éli Premium pour continuer sans limite.')
    if (res.status === 401) throw new Error('Connecte-toi pour continuer.')
    if (res.status === 503) throw new Error('Éli est temporairement indisponible. Réessaie dans quelques secondes.')
    throw new Error(err.error || 'Erreur réseau. Vérifie ta connexion.')
  }

  return res.json()
}

/**
 * TODO Sprint 3 : Vérification webhook paiement
 * POST /functions/v1/verify-payment
 * body: { transaction_id, operator: 'airtel'|'moov', phone, amount }
 * → response: { success: boolean, user_id: string, tier: 'premium'|'ultra' }
 */
export async function verifyPayment({ transactionId, operator, phone, amount }) {
  // Placeholder — à implémenter avec les APIs Airtel/Moov
  throw new Error('Intégration paiement — Sprint 3')
}
