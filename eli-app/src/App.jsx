/**
 * App.jsx — Routeur Principal Éli
 * Gère la navigation : Hub → Nationale | AEFE
 */
import React, { useState, useEffect } from 'react'
import HomeHub     from './components/HomeHub.jsx'
import DynamicChat from './components/DynamicChat.jsx'
import ServiceUnavailable from './components/ServiceUnavailable.jsx'
import { TenantStore } from './services/security.js'
import { checkAccess, countryFromPhone } from './services/geo.js'

export default function App() {
  const [tenant,      setTenant]      = useState(null)      // null = hub
  const [userProfile, setUserProfile] = useState(null)      // null = guest
  const [isReady,     setIsReady]     = useState(false)
  const [checking,    setChecking]    = useState(false)
  const [blocked,     setBlocked]     = useState(null)      // {countryName, portal} si bloqué

  useEffect(() => { setIsReady(true) }, [])

  // Sélection d'un portail → vérification géo souveraine AVANT d'entrer
  const handleSelectTenant = async (t) => {
    setChecking(true)
    setBlocked(null)

    // Résoudre le pays : numéro du compte si dispo, sinon géo-IP serveur
    const portal = t === 'aefe' ? 'aefe' : 'national'
    const countryCode = userProfile?.phone
      ? countryFromPhone(userProfile.phone)
      : null

    const access = await checkAccess({ portal, countryCode })
    setChecking(false)

    if (!access.allowed) {
      setBlocked({ countryName: access.country_name || null, portal })
      return
    }

    TenantStore.set(t)
    setTenant(t)
  }

  const handleBackToHub = () => { setTenant(null); setBlocked(null) }

  if (!isReady || checking) {
    return (
      <div className="min-h-screen bg-[#030C04] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" aria-label="Chargement" />
      </div>
    )
  }

  // Géo-blocage actif → page service indisponible
  if (blocked) {
    return (
      <ServiceUnavailable
        countryName={blocked.countryName}
        portal={blocked.portal}
        onBack={handleBackToHub}
      />
    )
  }

  // ── Rendu conditionnel — jamais de données sensibles sans tenant ──
  return (
    <>
      {!tenant && (
        <HomeHub onSelect={handleSelectTenant} />
      )}

      {tenant === 'nationale' && (
        <DynamicChat
          tenantType="nationale"
          userProfile={userProfile}
          onBackToHub={handleBackToHub}
        />
      )}

      {tenant === 'aefe' && (
        <DynamicChat
          tenantType="aefe"
          userProfile={userProfile}
          onBackToHub={handleBackToHub}
        />
      )}
    </>
  )
}
