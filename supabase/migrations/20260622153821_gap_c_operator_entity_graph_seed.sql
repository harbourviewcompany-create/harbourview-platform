INSERT INTO public.cannabis_operators (id,country_iso2,legal_name,normalized_name,operator_type,primary_country_iso2,public_status,data_completeness,verification_status) VALUES
('a1000001-0000-0000-0000-000000000001','DE','Canopy Growth Germany GmbH','canopy growth germany gmbh','integrated','DE','active','seed','admin_verified'),
('a1000001-0000-0000-0000-000000000002','DE','Demecan GmbH','demecan gmbh','cultivator','DE','active','seed','admin_verified'),
('a1000001-0000-0000-0000-000000000003','DE','Tilray Deutschland GmbH','tilray deutschland gmbh','distributor','DE','active','seed','admin_verified'),
('a1000001-0000-0000-0000-000000000004','DE','IMC (Israel Medical Cannabis) GmbH','imc israel medical cannabis gmbh','importer','DE','active','seed','admin_verified'),
('a2000002-0000-0000-0000-000000000001','AU','Cannatrek Limited','cannatrek limited','distributor','AU','active','seed','admin_verified'),
('a2000002-0000-0000-0000-000000000002','AU','Little Green Pharma Ltd','little green pharma ltd','exporter','AU','active','seed','admin_verified'),
('a2000002-0000-0000-0000-000000000003','AU','Cann Group Limited','cann group limited','cultivator','AU','active','seed','admin_verified'),
('a3000003-0000-0000-0000-000000000001','IL','Inter Cannabis Ltd (IMC)','inter cannabis ltd imc','exporter','IL','active','seed','admin_verified'),
('a3000003-0000-0000-0000-000000000002','IL','Tikun Olam Ltd','tikun olam ltd','cultivator','IL','active','seed','admin_verified'),
('a3000003-0000-0000-0000-000000000003','IL','Canndoc Ltd','canndoc ltd','seller','IL','active','seed','admin_verified'),
('a3000003-0000-0000-0000-000000000004','IL','BOL Pharma Ltd','bol pharma ltd','cultivator','IL','active','seed','admin_verified'),
('a4000004-0000-0000-0000-000000000001','CO','Khiron Life Sciences Corp','khiron life sciences corp','integrated','CO','active','seed','admin_verified'),
('a4000004-0000-0000-0000-000000000002','CO','Flora Growth Corp','flora growth corp','exporter','CO','active','seed','admin_verified'),
('a4000004-0000-0000-0000-000000000003','CO','PharmaCielo Ltd','pharmacielo ltd','exporter','CO','active','seed','admin_verified'),
('a5000005-0000-0000-0000-000000000001','NL','Bedrocan BV','bedrocan bv','cultivator','NL','active','seed','admin_verified'),
('a6000006-0000-0000-0000-000000000001','GB','Curaleaf International Holdings Ltd','curaleaf international holdings ltd','seller','GB','active','seed','admin_verified'),
('a6000006-0000-0000-0000-000000000002','GB','Columbia Care UK Ltd','columbia care uk ltd','distributor','GB','active','seed','admin_verified')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.operator_countries (operator_id,country_iso2,presence_type) VALUES
('a1000001-0000-0000-0000-000000000001','DE','headquarters'),
('a1000001-0000-0000-0000-000000000001','CA','subsidiary'),
('a1000001-0000-0000-0000-000000000002','DE','headquarters'),
('a1000001-0000-0000-0000-000000000003','DE','headquarters'),
('a1000001-0000-0000-0000-000000000003','CA','subsidiary'),
('a1000001-0000-0000-0000-000000000004','DE','headquarters'),
('a1000001-0000-0000-0000-000000000004','IL','subsidiary'),
('a2000002-0000-0000-0000-000000000001','AU','headquarters'),
('a2000002-0000-0000-0000-000000000002','AU','headquarters'),
('a2000002-0000-0000-0000-000000000002','DE','distribution'),
('a2000002-0000-0000-0000-000000000002','GB','distribution'),
('a2000002-0000-0000-0000-000000000003','AU','headquarters'),
('a3000003-0000-0000-0000-000000000001','IL','headquarters'),
('a3000003-0000-0000-0000-000000000001','DE','subsidiary'),
('a3000003-0000-0000-0000-000000000002','IL','headquarters'),
('a3000003-0000-0000-0000-000000000003','IL','headquarters'),
('a3000003-0000-0000-0000-000000000004','IL','headquarters'),
('a4000004-0000-0000-0000-000000000001','CO','headquarters'),
('a4000004-0000-0000-0000-000000000001','GB','licensed_facility'),
('a4000004-0000-0000-0000-000000000002','CO','headquarters'),
('a4000004-0000-0000-0000-000000000002','DE','distribution'),
('a4000004-0000-0000-0000-000000000003','CO','headquarters'),
('a5000005-0000-0000-0000-000000000001','NL','headquarters'),
('a6000006-0000-0000-0000-000000000001','GB','headquarters'),
('a6000006-0000-0000-0000-000000000001','US','subsidiary'),
('a6000006-0000-0000-0000-000000000002','GB','headquarters')
ON CONFLICT (operator_id,country_iso2,presence_type) DO NOTHING;

INSERT INTO public.operator_licences (operator_id,country_iso2,licence_class,issuing_regulator,authorized_activities,licence_status,gmp_certified,gacp_certified,last_verified) VALUES
('a1000001-0000-0000-0000-000000000001','DE','Narcotic Import & Distribution','BfArM',ARRAY['import','distribution','wholesale'],'active',true,false,CURRENT_DATE),
('a1000001-0000-0000-0000-000000000002','DE','BfArM Domestic Cultivation Tender Lot 1','BfArM',ARRAY['cultivation','processing','wholesale'],'active',true,false,CURRENT_DATE),
('a1000001-0000-0000-0000-000000000003','DE','Narcotic Import & Wholesale Distribution','BfArM',ARRAY['import','wholesale'],'active',true,false,CURRENT_DATE),
('a1000001-0000-0000-0000-000000000004','DE','Narcotic Import & Distribution','BfArM',ARRAY['import','distribution'],'active',true,false,CURRENT_DATE),
('a2000002-0000-0000-0000-000000000001','AU','ODC Manufacture (Import)','TGA / Office of Drug Control',ARRAY['import','distribution'],'active',true,false,CURRENT_DATE),
('a2000002-0000-0000-0000-000000000002','AU','ODC Manufacture + Export','TGA / Office of Drug Control',ARRAY['cultivation','processing','export'],'active',true,true,CURRENT_DATE),
('a2000002-0000-0000-0000-000000000003','AU','ODC Cultivation + Manufacture','TGA / Office of Drug Control',ARRAY['cultivation','processing'],'active',true,true,CURRENT_DATE),
('a3000003-0000-0000-0000-000000000001','IL','MOH GAP Cultivation + Export','Israel Ministry of Health IMCA',ARRAY['cultivation','processing','export'],'active',true,true,CURRENT_DATE),
('a3000003-0000-0000-0000-000000000002','IL','MOH GAP Cultivation + Distribution','Israel Ministry of Health IMCA',ARRAY['cultivation','processing','distribution'],'active',true,true,CURRENT_DATE),
('a3000003-0000-0000-0000-000000000003','IL','MOH Pharmacy + Dispensary','Israel Ministry of Health IMCA',ARRAY['cultivation','processing','retail'],'active',true,false,CURRENT_DATE),
('a3000003-0000-0000-0000-000000000004','IL','MOH GAP Cultivation','Israel Ministry of Health IMCA',ARRAY['cultivation','processing'],'active',true,true,CURRENT_DATE),
('a4000004-0000-0000-0000-000000000001','CO','Licencia de Cultivo Cannabis Psicoactivo + Fabricacion','MinSalud / ICA',ARRAY['cultivation','processing','export','retail_medical'],'active',true,true,CURRENT_DATE),
('a4000004-0000-0000-0000-000000000002','CO','Licencia de Cultivo + Produccion + Exportacion','MinSalud / ICA',ARRAY['cultivation','processing','export'],'active',true,true,CURRENT_DATE),
('a4000004-0000-0000-0000-000000000003','CO','Licencia de Cultivo + Extraccion + Exportacion','MinSalud / ICA',ARRAY['cultivation','processing','export'],'active',true,true,CURRENT_DATE),
('a5000005-0000-0000-0000-000000000001','NL','BMC Official Government Supplier','Bureau Medicinale Cannabis',ARRAY['cultivation','processing','wholesale','export'],'active',true,true,CURRENT_DATE),
('a6000006-0000-0000-0000-000000000001','GB','Schedule 1 Controlled Drug Import & Wholesale Dealer','MHRA',ARRAY['import','wholesale','retail_medical'],'active',true,false,CURRENT_DATE),
('a6000006-0000-0000-0000-000000000002','GB','Schedule 1 Controlled Drug Import & Distribution','MHRA',ARRAY['import','distribution'],'active',true,false,CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;

GRANT SELECT ON public.cannabis_operators TO anon, authenticated;
GRANT SELECT ON public.operator_licences TO anon, authenticated;
GRANT SELECT ON public.operator_countries TO anon, authenticated;
GRANT ALL ON public.cannabis_operators TO service_role;
GRANT ALL ON public.operator_licences TO service_role;
GRANT ALL ON public.operator_countries TO service_role;
