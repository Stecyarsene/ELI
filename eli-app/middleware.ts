// ════════════════════════════════════════════════════════════════
// middleware.ts — Géo-blocage Vercel Edge (OPTION A)
// ════════════════════════════════════════════════════════════════
// À placer À LA RACINE du projet (pas dans src/).
// Ne s'active QUE si tu déploies sur Vercel ET adoptes le routage par chemin
// (ex: /aefe, /national). Pour une SPA Vite pure, préfère la vérification
// via l'Edge Function geo-guard appelée au montage (voir src/services/geo.js).
//
// Vercel fournit request.geo.country nativement (gratuit, pas d'API tierce).
// ════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'

// Pays où le portail AEFE est autorisé (miroir de operating_countries.aefe_program_active)
// NOTE : la source de vérité reste la table Supabase. Cette liste est un
// garde-fou edge rapide ; geo-guard reste l'autorité finale.
const AEFE_ALLOWED = new Set(['GA', 'FR'])
const NATIONAL_ALLOWED = new Set(['GA'])

export function middleware(request: NextRequest) {
  const country = request.geo?.country ?? null // ex: 'GA', 'CI'
  const path = request.nextUrl.pathname

  // Portail AEFE
  if (path.startsWith('/aefe')) {
    if (!country || !AEFE_ALLOWED.has(country)) {
      return NextResponse.redirect(new URL('/service-indisponible', request.url))
    }
  }

  // Portail National
  if (path.startsWith('/national')) {
    if (!country || !NATIONAL_ALLOWED.has(country)) {
      return NextResponse.redirect(new URL('/service-indisponible', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/aefe/:path*', '/national/:path*'],
}
