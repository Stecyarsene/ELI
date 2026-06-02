/**
 * HomeHub.jsx — Sas d'entrée Éli
 * Choix entre Programme National et Programme Français
 * Base : design index.html validé + corrections branding
 */
import React, { useEffect } from 'react'
import EliLogo from './EliLogo.jsx'
import { TenantStore } from '../services/security.js'

export default function HomeHub({ onSelect }) {
  // Auto-redirect si choix déjà sauvegardé
  useEffect(() => {
    const saved = TenantStore.get()
    // Ne pas auto-rediriger — laisser l'élève choisir consciemment
    // Le lien "Reprendre" sera affiché si un choix existe
  }, [])

  const saved = TenantStore.get()

  const handleSelect = (tenant) => {
    TenantStore.set(tenant)
    onSelect(tenant)
  }

  return (
    <div className="min-h-screen bg-[#030C04] flex flex-col items-center justify-center px-5 py-10 relative overflow-hidden">
      {/* Orbes d'arrière-plan */}
      <div aria-hidden="true" className="pointer-events-none">
        <div
          className="absolute w-[500px] h-[500px] rounded-full bottom-[-100px] left-[-100px] opacity-18"
          style={{ background: 'rgba(27,94,32,.18)', filter: 'blur(80px)', animation: 'orbFloat 12s ease-in-out infinite' }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full top-[-80px] right-[-80px] opacity-7"
          style={{ background: 'rgba(249,168,37,.07)', filter: 'blur(80px)', animation: 'orbFloat 12s ease-in-out infinite', animationDelay: '-5s' }}
        />
      </div>

      {/* Contenu */}
      <div className="relative z-10 w-full max-w-lg flex flex-col items-center">

        {/* Logo + Nom */}
        <div className="flex items-center gap-3 mb-3 animate-fade-in">
          <EliLogo size={52} />
          <span
            className="text-3xl font-black tracking-wide"
            style={{ fontFamily: "'Syne',sans-serif", color: '#F9A825' }}
          >
            Éli
          </span>
        </div>

        {/* Tagline */}
        <p
          className="text-sm mb-10 text-center animate-fade-in"
          style={{ color: 'rgba(255,255,255,.5)', animationDelay: '100ms' }}
        >
          L'intelligence au service de ta réussite.
        </p>

        {/* Titre */}
        <h1
          className="text-2xl sm:text-3xl font-black text-center mb-2 text-white animate-fade-in"
          style={{ fontFamily: "'Syne',sans-serif", animationDelay: '150ms' }}
        >
          Sélectionne ton{' '}
          <span style={{ color: '#F9A825' }}>parcours académique</span>
        </h1>
        <p
          className="text-sm text-center mb-10 animate-fade-in"
          style={{ color: 'rgba(255,255,255,.4)', animationDelay: '200ms' }}
        >
          Éli s'adapte entièrement à ton programme.
        </p>

        {/* Cartes portail */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-8 animate-fade-in"
          style={{ animationDelay: '250ms' }}
        >
          {/* Programme National */}
          <button
            onClick={() => handleSelect('nationale')}
            className="relative flex flex-col items-center text-center p-7 rounded-3xl border-2 border-transparent transition-all duration-300 group focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030C04] active:scale-95"
            style={{
              background: 'linear-gradient(145deg,#0D2410,#071408)',
              border: '2px solid rgba(27,94,32,.4)',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#00A86B'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(27,94,32,.4)'}
            aria-label="Accéder au Programme National"
          >
            {/* Étoile populaire */}
            <div
              className="absolute -top-3 -right-3 px-2.5 py-0.5 rounded-full text-xs font-black"
              style={{ background: '#F9A825', color: '#030C04' }}
              aria-label="Option populaire"
            >
              ⭐ Populaire
            </div>

            <span className="text-5xl mb-4 block" aria-hidden="true">🌍</span>
            <span
              className="text-xs font-bold tracking-wider mb-3 px-3 py-1 rounded-full border"
              style={{
                background: 'rgba(0,168,107,.2)',
                borderColor: 'rgba(0,168,107,.4)',
                color: '#81C784',
              }}
            >
              Programme National
            </span>
            <h2
              className="text-lg font-black text-white mb-2"
              style={{ fontFamily: "'Syne',sans-serif" }}
            >
              Éli Nationale
            </h2>
            <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,.5)' }}>
              Pour les élèves des systèmes éducatifs africains francophones.
            </p>
            <span
              className="w-full py-3 rounded-full text-sm font-bold text-white block transition-all group-hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#1B5E20,#2E7D32)' }}
              aria-hidden="true"
            >
              Accéder →
            </span>
          </button>

          {/* Programme Français */}
          <button
            onClick={() => handleSelect('aefe')}
            className="relative flex flex-col items-center text-center p-7 rounded-3xl transition-all duration-300 group focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030C04] active:scale-95"
            style={{
              background: 'linear-gradient(145deg,#0A1628,#0F172A)',
              border: '2px solid rgba(21,101,192,.3)',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#1565C0'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(21,101,192,.3)'}
            aria-label="Accéder au Programme Français AEFE"
          >
            <span className="text-5xl mb-4 block" aria-hidden="true">🎓</span>
            <span
              className="text-xs font-bold tracking-wider mb-3 px-3 py-1 rounded-full border"
              style={{
                background: 'rgba(21,101,192,.2)',
                borderColor: 'rgba(21,101,192,.4)',
                color: '#90CAF9',
              }}
            >
              Programme Français
            </span>
            <h2
              className="text-lg font-black text-white mb-2"
              style={{ fontFamily: "'Syne',sans-serif" }}
            >
              Éli AEFE
            </h2>
            <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,.5)' }}>
              Pour les lycées français et établissements AEFE dans le monde.
            </p>
            <span
              className="w-full py-3 rounded-full text-sm font-bold text-white block transition-all group-hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#1565C0,#1976D2)' }}
              aria-hidden="true"
            >
              Accéder →
            </span>
          </button>
        </div>

        {/* Reprendre session */}
        {saved && (
          <div className="animate-fade-in text-center" style={{ animationDelay: '350ms' }}>
            <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,.3)' }}>
              Dernier parcours :{' '}
              <strong style={{ color: '#F9A825' }}>
                {saved === 'aefe' ? 'Programme Français' : 'Programme National'}
              </strong>
            </p>
            <button
              onClick={() => handleSelect(saved)}
              className="text-xs underline transition-colors focus-visible:ring-2 focus-visible:ring-yellow-400 rounded"
              style={{ color: 'rgba(255,255,255,.4)' }}
              onMouseEnter={e => e.currentTarget.style.color = '#F9A825'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.4)'}
              aria-label={`Reprendre le parcours ${saved === 'aefe' ? 'Programme Français' : 'Programme National'}`}
            >
              Reprendre ce parcours →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
