/**
 * PaywallDrawer.jsx — Tiroir de conversion Premium/Ultra
 * ════════════════════════════════════════════════════════════════
 * Sécurité : Ce composant n'est affiché QUE côté UI.
 *            La donnée du module Premium n'existe PAS dans le DOM
 *            tant que isPremium/isUltra n'est pas validé.
 * ════════════════════════════════════════════════════════════════
 */
import React, { useEffect, useRef } from 'react'
import EliLogo from './EliLogo.jsx'
import airtelLogo from '../assets/airtel.png'
import moovLogo   from '../assets/moov.png'

export default function PaywallDrawer({
  isOpen,
  onClose,
  featureName = 'cette fonctionnalité',
  requiredTier = 'premium',   // 'premium' | 'ultra'
  tenantType   = 'nationale', // 'nationale' | 'aefe'
}) {
  const firstFocusRef = useRef(null)
  const isPremiumTier = requiredTier === 'premium'

  const prices = {
    nationale: { premium: '5 000 FCFA', ultra: '10 000 FCFA' },
    aefe:      { premium: '10 €',       ultra: '20 €' },
  }
  const price     = prices[tenantType][requiredTier]
  const tierLabel = isPremiumTier ? 'Premium' : 'Ultra-Premium'
  const accentColor = tenantType === 'aefe' ? '#1565C0' : '#00A86B'

  // Focus trap pour l'accessibilité (WCAG 2.1 AA)
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => firstFocusRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Fermeture via Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && isOpen) onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const benefits = [
    ['✅', 'Professeur Éli illimité — aucun quota, aucune restriction'],
    ['✅', `${featureName} déverrouillé instantanément`],
    ['✅', 'Mode Bougie — révision offline garantie'],
    ['✅', 'Rapport WhatsApp hebdomadaire pour tes parents'],
    ...(requiredTier === 'ultra' ? [
      ['🌟', 'Module "Mon Avenir" — coaching concours en direct'],
      ['🌟', 'Éli connecté au web — données concours actualisées'],
    ] : []),
  ]

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ animation: 'slideUpDrawer 400ms cubic-bezier(0.16,1,0.3,1)' }}
        role="dialog"
        aria-modal="true"
        aria-label={`Débloquer ${featureName}`}
      >
        {/* Handle tactile */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-4 mb-1" aria-hidden="true" />

        <div className="px-6 pb-8 pt-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <EliLogo size={36} />
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  Éli {tierLabel}
                </p>
                <h2 className="text-lg font-bold text-gray-900 font-display leading-tight">
                  Débloquer{' '}
                  <span style={{ color: accentColor }}>{featureName}</span>
                </h2>
              </div>
            </div>
            <button
              ref={firstFocusRef}
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ '--tw-ring-color': accentColor }}
              aria-label="Fermer le panneau d'abonnement"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Badge prix */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-5 border"
            style={{ background: `${accentColor}15`, color: accentColor, borderColor: `${accentColor}30` }}
          >
            ✦ {price} / mois · Accès immédiat
          </div>

          {/* Bénéfices */}
          <ul className="space-y-3 mb-6" role="list">
            {benefits.map(([icon, text], i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="shrink-0 mt-0.5 text-base" aria-hidden="true">{icon}</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>

          <hr className="border-gray-100 mb-6" />

          {/* Étape 1 : Compte */}
          <fieldset className="mb-5">
            <legend className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Étape 1 — Crée ton compte (30 secondes)
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Ton prénom"
                aria-label="Ton prénom"
                className="col-span-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:border-transparent transition"
                style={{ '--tw-ring-color': accentColor }}
              />
              <input
                type="tel"
                placeholder={tenantType === 'aefe' ? '+33 6 __' : '+241 07 __'}
                aria-label="Ton numéro de téléphone"
                className="col-span-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:border-transparent transition"
              />
              <select
                aria-label="Ta classe"
                className="col-span-2 border border-gray-200 rounded-xl px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:border-transparent transition bg-white"
              >
                <option value="">Ma classe</option>
                {['CP1','CP2','CE1','CE2','CM1','CM2','6ème','5ème','4ème','3ème','Seconde','Première','Terminale'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </fieldset>

          {/* Étape 2 : Paiement */}
          <fieldset className="mb-5">
            <legend className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Étape 2 — Paye {price} / mois
            </legend>

            {tenantType === 'nationale' ? (
              /* Paiement Mobile Money — Nationale */
              <div className="grid grid-cols-2 gap-3 mb-3">
                {/* Airtel Money */}
                <button
                  className="flex flex-col items-center gap-2 p-4 border-2 border-gray-100 rounded-2xl hover:border-red-400 hover:bg-red-50 transition-all focus-visible:ring-2 focus-visible:ring-red-400 active:scale-95"
                  aria-label="Payer avec Airtel Money"
                  onClick={() => {
                    /* TODO Sprint 3 : Déclencher webhook Airtel */
                  }}
                >
                  <img
                    src={airtelLogo}
                    alt="Airtel Money"
                    className="w-16 h-16 object-contain rounded-xl"
                    loading="lazy"
                  />
                  <div className="text-center">
                    <p className="font-bold text-sm text-gray-800">Airtel Money</p>
                    <p className="text-xs text-gray-500 font-mono">+241 07 73 74 043</p>
                    <p className="text-xs text-gray-400">Bénéf : Stecy Arsène</p>
                  </div>
                </button>

                {/* Moov Africa */}
                <button
                  className="flex flex-col items-center gap-2 p-4 border-2 border-gray-100 rounded-2xl hover:border-orange-400 hover:bg-orange-50 transition-all focus-visible:ring-2 focus-visible:ring-orange-400 active:scale-95"
                  aria-label="Payer avec Moov Africa Money"
                  onClick={() => {
                    /* TODO Sprint 3 : Déclencher webhook Moov */
                  }}
                >
                  <img
                    src={moovLogo}
                    alt="Moov Africa Money"
                    className="w-16 h-16 object-contain rounded-xl"
                    loading="lazy"
                  />
                  <div className="text-center">
                    <p className="font-bold text-sm text-gray-800">Moov Money</p>
                    <p className="text-xs text-gray-500 font-mono">+241 06 63 87 544</p>
                    <p className="text-xs text-gray-400">Bénéf : Stecy Arsène</p>
                  </div>
                </button>
              </div>
            ) : (
              /* Paiement Carte — AEFE */
              <div className="space-y-3 mb-3">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 border-2 border-gray-100 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all focus-visible:ring-2 focus-visible:ring-blue-400 active:scale-95"
                  aria-label="Payer par carte bancaire"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" aria-hidden="true">💳</span>
                    <div className="text-left">
                      <p className="font-bold text-sm text-gray-800">Carte bancaire</p>
                      <p className="text-xs text-gray-400">Visa, Mastercard, American Express</p>
                    </div>
                  </div>
                  <span className="text-gray-300" aria-hidden="true">→</span>
                </button>
                <button
                  className="w-full flex items-center justify-between px-5 py-4 border-2 border-gray-100 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all focus-visible:ring-2 focus-visible:ring-blue-400 active:scale-95"
                  aria-label="Payer avec PayPal"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" aria-hidden="true">🅿️</span>
                    <div className="text-left">
                      <p className="font-bold text-sm text-gray-800">PayPal</p>
                      <p className="text-xs text-gray-400">ekolocontact@gmail.com</p>
                    </div>
                  </div>
                  <span className="text-gray-300" aria-hidden="true">→</span>
                </button>
              </div>
            )}

            <p className="text-center text-xs text-gray-400">
              Activation sous 5 minutes après confirmation
            </p>
          </fieldset>

          {/* CTA principal */}
          <button
            className="w-full py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-offset-2 shadow-lg"
            style={{ background: accentColor, '--tw-ring-color': accentColor }}
            aria-label={`Activer mon accès Éli ${tierLabel} pour ${price} par mois`}
          >
            ✨ Activer mon accès Éli {tierLabel} →
          </button>

          <p className="text-center text-xs text-gray-400 mt-3">
            Sans engagement · Résiliable à tout moment
          </p>
        </div>
      </div>
    </>
  )
}
