# Éli — Plateforme Éducative IA

> L'intelligence au service de ta réussite.

## Architecture

```
src/
├── App.jsx                     # Routeur Hub → Nationale | AEFE
├── index.css                   # Tailwind + styles globaux
├── main.jsx                    # Point d'entrée React
├── assets/
│   ├── airtel.png              # Logo Airtel Money
│   └── moov.png                # Logo Moov Africa
├── components/
│   ├── EliLogo.jsx             # Logo SVG officiel (ne pas modifier)
│   ├── HomeHub.jsx             # Sas d'entrée — choix parcours
│   ├── DynamicChat.jsx         # Chat principal + 8 piliers
│   └── PaywallDrawer.jsx       # Tiroir de conversion Premium
├── hooks/
│   └── useNetwork.js           # Détection réseau (Mode Bougie)
└── services/
    ├── api.js                  # Appels Edge Functions Supabase
    └── security.js             # Quota, fingerprint, sanitisation XSS
```

## Sécurité

- **Render Locking** : Les données Premium ne sont jamais dans le DOM si l'utilisateur n'est pas Premium
- **Anti-F5** : Quota Guest persisté en localStorage + fingerprint
- **XSS** : Sanitisation stricte de tous les retours IA
- **Zéro clé API** : Toutes les requêtes transitent par des Edge Functions Supabase

## Démarrage

```bash
npm install
npm run dev
```

## Déploiement (Vercel)

```bash
npm run build
# Uploader le dossier dist/ sur Vercel
```

## Variables d'environnement

Aucune clé API dans le code client. Configurer dans Supabase Edge Function Secrets :
- `ANTHROPIC_API_KEY`
- `WHATSAPP_TOKEN`
- `WHATSAPP_PHONE_ID`

## Contact

ekolocontact@gmail.com · +241 07 73 74 043 · Libreville, Gabon
