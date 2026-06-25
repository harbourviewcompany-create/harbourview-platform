CREATE TABLE IF NOT EXISTS public.trade_flows (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    origin_iso2 text NOT NULL,
    destination_iso2 text NOT NULL,
    flow_direction text NOT NULL CHECK (flow_direction IN ('export','import','bilateral')),
    product_category text NOT NULL CHECK (product_category IN ('flower','extracts','oils','edibles','pharmaceutical_cannabinoids','hemp_fiber','hemp_seed','starting_material','seeds','other')),
    legal_status text NOT NULL DEFAULT 'unknown' CHECK (legal_status IN ('legal_permit_required','legal_no_permit','restricted','prohibited','unknown','under_review')),
    permit_required boolean NOT NULL DEFAULT true,
    permit_authority text,
    purpose text CHECK (purpose IN ('medical','scientific','industrial','adult_use','re_export','unknown')),
    gmp_required boolean NOT NULL DEFAULT false,
    gacp_required boolean NOT NULL DEFAULT false,
    key_requirements text[] NOT NULL DEFAULT '{}',
    notes text,
    source_name text,
    source_url text,
    last_verified date NOT NULL DEFAULT CURRENT_DATE,
    confidence text NOT NULL DEFAULT 'medium' CHECK (confidence IN ('high','medium','low')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT trade_flows_pkey PRIMARY KEY (id),
    CONSTRAINT trade_flows_origin_fk FOREIGN KEY (origin_iso2) REFERENCES public.countries (iso_alpha2) ON DELETE RESTRICT,
    CONSTRAINT trade_flows_destination_fk FOREIGN KEY (destination_iso2) REFERENCES public.countries (iso_alpha2) ON DELETE RESTRICT,
    CONSTRAINT trade_flows_not_self_trade CHECK (origin_iso2 <> destination_iso2)
);
CREATE INDEX IF NOT EXISTS idx_trade_flows_origin_destination ON public.trade_flows (origin_iso2, destination_iso2);
CREATE INDEX IF NOT EXISTS idx_trade_flows_destination ON public.trade_flows (destination_iso2);
CREATE INDEX IF NOT EXISTS idx_trade_flows_legal_status ON public.trade_flows (legal_status);
CREATE INDEX IF NOT EXISTS idx_trade_flows_product_category ON public.trade_flows (product_category);
CREATE OR REPLACE FUNCTION public.set_trade_flows_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_trade_flows_updated_at ON public.trade_flows;
CREATE TRIGGER trg_trade_flows_updated_at BEFORE UPDATE ON public.trade_flows FOR EACH ROW EXECUTE FUNCTION public.set_trade_flows_updated_at();
ALTER TABLE public.trade_flows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS trade_flows_public_read ON public.trade_flows;
CREATE POLICY trade_flows_public_read ON public.trade_flows FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS trade_flows_service_write ON public.trade_flows;
CREATE POLICY trade_flows_service_write ON public.trade_flows FOR ALL TO service_role USING (true) WITH CHECK (true);
INSERT INTO public.trade_flows (origin_iso2,destination_iso2,flow_direction,product_category,legal_status,permit_required,permit_authority,purpose,gmp_required,gacp_required,key_requirements,notes,source_name,last_verified,confidence) VALUES
('CA','DE','export','flower','legal_permit_required',true,'BfArM/Health Canada','medical',true,true,ARRAY['EU-GMP certification required','GACP certification required','BfArM narcotics import permit per shipment','Health Canada cannabis export licence','Single Convention Article 31 authorisations','CoA per batch'],NULL,'Harbourview Research','2025-01-01','high'),
('CA','GB','export','extracts','legal_permit_required',true,'MHRA/Health Canada','medical',true,false,ARRAY['MHRA Schedule 2 import licence','Health Canada cannabis export licence','EU-GMP or equivalent GMP','MHRA import declaration per consignment','CoA and batch records required'],NULL,'Harbourview Research','2025-01-01','high'),
('CA','GB','export','pharmaceutical_cannabinoids','legal_permit_required',true,'MHRA/Health Canada','medical',true,false,ARRAY['MHRA Schedule 2 import licence','Health Canada cannabis export licence','ICH Q7 API GMP compliance','CoA and batch records required'],NULL,'Harbourview Research','2025-01-01','high'),
('CA','AU','export','flower','legal_permit_required',true,'TGA/Health Canada','medical',true,false,ARRAY['TGA import permit required','TGA ODC import licence','Health Canada cannabis export licence','PIC/S GMP compliance','ARTG listing or TGA SAS-B approval','CoA per batch'],NULL,'Harbourview Research','2025-01-01','high'),
('CA','AU','export','oils','legal_permit_required',true,'TGA/Health Canada','medical',true,false,ARRAY['TGA import permit required','TGA ODC import licence','Health Canada cannabis export licence','PIC/S GMP compliance','ARTG listing or TGA SAS-B approval','CoA per batch'],NULL,'Harbourview Research','2025-01-01','high'),
('CA','IL','export','flower','legal_permit_required',true,'MOH Israel/Health Canada','medical',true,false,ARRAY['Israeli MOH import licence','Health Canada cannabis export licence','IMC-GMP or EU-GMP certification','Single Convention Article 31 authorisations','CoA per batch'],NULL,'Harbourview Research','2025-01-01','medium'),
('CO','DE','export','flower','legal_permit_required',true,'BfArM/Colombia MinSalud','medical',true,true,ARRAY['EU-GMP certification (Invima-audited)','GACP certification for farms','BfArM narcotics import permit','Colombia MinSalud/Invima export licence','Single Convention Article 31 authorisations','CoA per batch'],NULL,'Harbourview Research','2025-01-01','high'),
('CO','DE','export','oils','legal_permit_required',true,'BfArM/Colombia MinSalud','medical',true,false,ARRAY['EU-GMP certification','BfArM narcotics import permit','Colombia MinSalud/Invima export licence','Single Convention Article 31 authorisations','CoA per batch'],NULL,'Harbourview Research','2025-01-01','high'),
('CO','GB','export','oils','legal_permit_required',true,'MHRA/Colombia MinSalud','medical',false,false,ARRAY['MHRA Schedule 2 import licence','Colombia MinSalud/Invima export licence','MHRA-recognised GMP','CoA per batch'],NULL,'Harbourview Research','2025-01-01','medium'),
('LS','DE','export','flower','legal_permit_required',true,'BfArM/Lesotho MoH','medical',true,true,ARRAY['EU-GMP certification for Lesotho facility','GACP certification for cultivation','BfArM narcotics import permit','Lesotho MoH export permit','Single Convention Article 31 authorisations','CoA per batch'],NULL,'Harbourview Research','2025-01-01','high'),
('MK','DE','export','flower','legal_permit_required',true,'BfArM/North Macedonia MALMED','medical',true,false,ARRAY['EU-GMP certification','BfArM narcotics import permit','MALMED export authorisation','Single Convention Article 31 authorisations','CoA per batch'],NULL,'Harbourview Research','2025-01-01','medium'),
('PT','DE','export','flower','legal_permit_required',true,'BfArM/Infarmed','medical',true,false,ARRAY['EU-GMP certification (Infarmed-issued)','BfArM narcotics import permit','Infarmed export licence','Single Convention Article 31 authorisations','CoA per batch'],NULL,'Harbourview Research','2025-01-01','medium'),
('NL','DE','export','flower','legal_permit_required',true,'BfArM/Bureau Medicinale Cannabis','medical',true,false,ARRAY['EU-GMP certification (BMC state monopoly)','BfArM narcotics import permit','BMC export authorisation','Single Convention Article 31 authorisations','CoA per batch'],NULL,'Harbourview Research','2025-01-01','high'),
('AU','NZ','export','oils','legal_permit_required',true,'Medsafe/TGA','medical',true,false,ARRAY['Medsafe import licence','TGA export permit','PIC/S GMP compliance','CoA per batch'],NULL,'Harbourview Research','2025-01-01','high'),
('IL','DE','export','pharmaceutical_cannabinoids','legal_permit_required',true,'BfArM/MOH Israel','medical',true,false,ARRAY['EU-GMP or ICH Q7 API GMP certification','BfArM narcotics import permit','MOH Israel export licence','Single Convention Article 31 authorisations','DMF or ASMF submission','CoA per batch'],NULL,'Harbourview Research','2025-01-01','medium'),
('US','CA','export','flower','prohibited',false,NULL,'adult_use',false,false,ARRAY['Cannabis is Schedule I under US Controlled Substances Act','Federal law prohibits cross-border export','CBSA seizure risk for importers'],'Cannabis remains Schedule I federally in the US; cross-border shipment to Canada is illegal under both US federal law and Canadian CBSA enforcement.','Harbourview Research','2025-01-01','high')
ON CONFLICT DO NOTHING;
