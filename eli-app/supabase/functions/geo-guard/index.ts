// ════════════════════════════════════════════════════════════════
// Edge Function : geo-guard
// Géo-blocage réglementaire souverain (fail-closed)
// Déployer : supabase functions deploy geo-guard --no-verify-jwt
// ════════════════════════════════════════════════════════════════
//
// USAGE FRONTEND :
//   POST /functions/v1/geo-guard
//   body: { portal: 'national' | 'aefe', country_code?: 'GA' }
//   → { allowed: bool, reason, country_code, country_name, program_id }
//
// SOURCE DU PAYS (par ordre de priorité) :
//   1. country_code explicite (pays du numéro WhatsApp lié au compte)
//   2. En-tête géo de la plateforme (Vercel: x-vercel-ip-country,
//      Cloudflare: cf-ipcountry)
//   3. Fail-closed → accès refusé si indéterminable
// ════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
const SUPA_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST")   return json({ allowed: false, reason: "method_not_allowed" }, 405);

  try {
    const { portal, country_code: explicitCode } = await req.json();

    if (portal !== "national" && portal !== "aefe") {
      return json({ allowed: false, reason: "invalid_portal" }, 400);
    }

    // ── Résolution du pays (fail-closed) ──────────────────────────
    // 1. Code explicite (numéro WhatsApp / compte)
    // 2. Géo-IP via en-têtes plateforme
    const headerCountry =
      req.headers.get("x-vercel-ip-country") ||  // Vercel Edge
      req.headers.get("cf-ipcountry")        ||  // Cloudflare
      req.headers.get("x-country-code")      ||  // proxy custom
      null;

    const countryCode = (explicitCode || headerCountry || "").toUpperCase();

    // Aucun pays déterminable → refus (fail-closed, grade militaire)
    if (!countryCode || countryCode.length !== 2) {
      return json({
        allowed: false,
        reason: "country_undeterminable",
        portal,
      }, 403);
    }

    // ── Vérification souveraine en base (source de vérité) ────────
    const supabase = createClient(SUPA_URL, SUPA_KEY);
    const { data, error } = await supabase.rpc("resolve_access", {
      p_country_code: countryCode,
      p_portal:       portal,
    });

    if (error) {
      // En cas d'erreur DB → refus (fail-closed)
      return json({ allowed: false, reason: "resolution_error", portal }, 403);
    }

    // data = { allowed, reason?, country_code, country_name, program_id, portal }
    const status = data?.allowed ? 200 : 403;
    return json(data, status);

  } catch (_err) {
    // Toute exception → refus (fail-closed)
    return json({ allowed: false, reason: "internal_error" }, 403);
  }
});
