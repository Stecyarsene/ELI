-- ════════════════════════════════════════════════════════════════
-- Migration 0003 — Matrice des Juridictions (Géo-fencing natif)
-- Éli · Architecture Multi-Pays
-- ════════════════════════════════════════════════════════════════

-- ── Table des pays opérationnels ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.operating_countries (
    country_code           TEXT PRIMARY KEY,        -- ISO 3166-1 alpha-2 : 'GA','CI','CM'
    country_name           TEXT NOT NULL,
    national_program_active BOOLEAN NOT NULL DEFAULT FALSE,
    aefe_program_active     BOOLEAN NOT NULL DEFAULT FALSE,
    -- Métadonnées de routage
    program_id             TEXT,                    -- réf. curriculum_programs (national)
    phone_prefix           TEXT,                    -- '+241' pour résolution via WhatsApp
    currency               TEXT DEFAULT 'XAF',
    created_at             TIMESTAMPTZ DEFAULT NOW(),
    updated_at             TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.operating_countries IS
  'Matrice souveraine des juridictions. Contrôle quels programmes (national/AEFE) sont actifs par pays.';

-- ── Données initiales ────────────────────────────────────────────
-- Règle par défaut : Gabon (GA) entièrement actif. Autres pays = préparés mais inactifs.
INSERT INTO public.operating_countries
  (country_code, country_name, national_program_active, aefe_program_active, program_id, phone_prefix, currency)
VALUES
  ('GA', 'Gabon',            TRUE,  TRUE,  'gabon_2026',  '+241', 'XAF'),
  ('CI', 'Côte d''Ivoire',   FALSE, FALSE, NULL,          '+225', 'XOF'),
  ('CM', 'Cameroun',         FALSE, FALSE, NULL,          '+237', 'XAF'),
  ('CG', 'Congo-Brazzaville',FALSE, FALSE, NULL,          '+242', 'XAF'),
  ('SN', 'Sénégal',          FALSE, FALSE, NULL,          '+221', 'XOF'),
  ('FR', 'France',           FALSE, TRUE,  NULL,          '+33',  'EUR')
ON CONFLICT (country_code) DO UPDATE
  SET country_name            = EXCLUDED.country_name,
      national_program_active = EXCLUDED.national_program_active,
      aefe_program_active     = EXCLUDED.aefe_program_active,
      updated_at              = NOW();

-- ── Trigger updated_at ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_operating_countries()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_touch_oc ON public.operating_countries;
CREATE TRIGGER trg_touch_oc
  BEFORE UPDATE ON public.operating_countries
  FOR EACH ROW EXECUTE FUNCTION public.touch_operating_countries();

-- ── RLS : lecture publique, écriture service_role uniquement ─────
ALTER TABLE public.operating_countries ENABLE ROW LEVEL SECURITY;

-- Lecture publique (le frontend doit savoir quels pays sont actifs)
DROP POLICY IF EXISTS "oc_public_read" ON public.operating_countries;
CREATE POLICY "oc_public_read"
  ON public.operating_countries FOR SELECT
  USING (TRUE);

-- AUCUNE policy INSERT/UPDATE/DELETE publique.
-- Seul le service_role (backend admin) peut modifier la matrice.
-- C'est volontaire : un élève ne doit JAMAIS pouvoir activer un pays.

-- ── Lier profiles au pays (routage multi-tenant) ─────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country_code TEXT
    REFERENCES public.operating_countries(country_code) DEFAULT 'GA';

-- ── Fonction de résolution serveur (source de vérité) ────────────
-- Le frontend ne décide JAMAIS seul ce qui est actif. Il interroge cette fonction.
CREATE OR REPLACE FUNCTION public.resolve_access(
    p_country_code TEXT,
    p_portal       TEXT          -- 'national' | 'aefe'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_row public.operating_countries%ROWTYPE;
BEGIN
    SELECT * INTO v_row
    FROM public.operating_countries
    WHERE country_code = UPPER(COALESCE(p_country_code, ''));

    -- Pays inconnu → accès refusé par défaut (fail-closed)
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'allowed', FALSE,
            'reason',  'country_not_supported',
            'country_code', UPPER(COALESCE(p_country_code, ''))
        );
    END IF;

    RETURN jsonb_build_object(
        'allowed', CASE p_portal
                     WHEN 'national' THEN v_row.national_program_active
                     WHEN 'aefe'     THEN v_row.aefe_program_active
                     ELSE FALSE
                   END,
        'country_code', v_row.country_code,
        'country_name', v_row.country_name,
        'program_id',   v_row.program_id,
        'portal',       p_portal
    );
END;
$$;
