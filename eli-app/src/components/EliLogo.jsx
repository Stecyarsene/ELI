/**
 * EliLogo.jsx — Logo officiel Éli (SVG extrait de la version validée)
 * NE PAS MODIFIER sans validation de l'équipe
 */
import React from 'react'

export default function EliLogo({ size = 38, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      aria-label="Logo Éli"
      role="img"
    >
      <defs>
        <radialGradient id="n1" cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#388E3C"/>
          <stop offset="100%" stopColor="#1B5E20"/>
        </radialGradient>
        <linearGradient id="n2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE082"/>
          <stop offset="100%" stopColor="#FFA000"/>
        </linearGradient>
        <linearGradient id="n3" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#FFA000"/>
          <stop offset="60%" stopColor="#FFD54F"/>
          <stop offset="100%" stopColor="#FFFDE7"/>
        </linearGradient>
        <filter id="ns">
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#00000055"/>
        </filter>
        <filter id="ng">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      {/* Cercle principal vert */}
      <circle cx="100" cy="100" r="95" fill="url(#n1)" filter="url(#ns)"/>
      {/* Lettre E */}
      <text
        x="42" y="138"
        fontFamily="'Syne',sans-serif"
        fontWeight="900"
        fontSize="105"
        fill="url(#n2)"
        filter="url(#ns)"
      >E</text>
      {/* Flamme dorée */}
      <path
        d="M148 52 C148 52 138 68 145 80 C150 88 145 100 136 98 C142 90 138 78 130 75 C133 85 128 95 120 95 C124 85 118 72 108 70 C115 80 112 95 100 98 C96 80 108 62 120 48 C110 55 102 68 104 82 C98 72 100 55 112 44 C104 48 98 60 100 72 C92 60 96 42 110 34 C102 40 98 55 104 66 C98 52 104 36 118 30 C108 38 106 54 114 64 C112 50 120 36 134 34 C124 44 124 60 132 68 C134 52 144 40 158 42 C148 50 144 65 150 76 C156 62 158 48 148 36 C162 42 166 60 158 72 C166 58 162 40 150 34 C164 38 170 56 162 70 C162 52 152 38 138 38 C150 44 156 60 148 72 C144 58 148 42 158 36 C148 42 144 58 148 72Z"
        fill="url(#n3)"
        filter="url(#ng)"
        opacity="0.92"
      />
    </svg>
  )
}
