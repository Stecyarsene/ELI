/**
 * ServiceUnavailable.jsx — Page de blocage géo-réglementaire
 */
import React from 'react'
import EliLogo from './EliLogo.jsx'

export default function ServiceUnavailable({ countryName, portal, onBack }) {
  return (
    <div className="min-h-screen bg-[#030C04] flex flex-col items-center justify-center px-6 text-center" role="alert">
      <EliLogo size={56} />
      <h1 className="text-2xl font-black text-white mt-6 mb-3" style={{ fontFamily: "'Syne',sans-serif" }}>
        Service non disponible
      </h1>
      <p className="text-sm max-w-md mb-2" style={{ color: 'rgba(255,255,255,.5)' }}>
        {portal === 'aefe'
          ? 'Le programme AEFE n\'est pas encore disponible'
          : 'Le programme national n\'est pas encore disponible'}
        {countryName ? ` dans ton pays (${countryName})` : ' dans ta région'}.
      </p>
      <p className="text-xs max-w-md mb-8" style={{ color: 'rgba(255,255,255,.3)' }}>
        Nous travaillons à étendre Éli. Laisse-nous ton contact pour être prévenu du lancement.
      </p>
      <button
        onClick={onBack}
        className="px-6 py-3 rounded-2xl text-white font-bold text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030C04]"
        style={{ background: '#1B5E20', '--tw-ring-color': '#00A86B' }}
      >
        ← Retour à l'accueil
      </button>
      <p className="text-xs mt-6" style={{ color: 'rgba(255,255,255,.25)' }}>
        ekolocontact@gmail.com
      </p>
    </div>
  )
}
