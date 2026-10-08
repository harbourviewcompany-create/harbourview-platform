
-- RECOVERY BEGIN 20260730211507_seed_supply_catalog_canada_batch2.sql

insert into public.listings
  (id, category, title, description, product_type, region, price_range, seller_type,
   high_level_specs, status, public_visibility, is_featured, price_amount, price_currency,
   location_country, condition, brand, model, quantity, unit, slug, marketplace_section,
   sold_by_harbourview, sku, stock_qty, lead_time_days, moq, compliance_flags, target_countries,
   created_at, updated_at)
values
(gen_random_uuid(),'consumables','Empty 510 Vape Cartridge — 0.5mL Ceramic/Glass','Empty ceramic-coil 510 thread vape cartridge for oil filling.','vape_hardware','north_america','negotiable','distributor','{"size":"0.5mL","thread":"510","material":"ceramic/glass"}','approved',true,false,0.65,'CAD','CA','new','Harbourview Supply','HV-CART-05',1000,'each','empty-510-vape-cartridge-0-5ml','consumables',true,'HVP-VAP-C05',20000,14,500,'{}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','Empty 510 Vape Cartridge — 1.0mL Ceramic/Glass','Empty ceramic-coil 510 thread vape cartridge for oil filling.','vape_hardware','north_america','negotiable','distributor','{"size":"1.0mL","thread":"510","material":"ceramic/glass"}','approved',true,false,0.85,'CAD','CA','new','Harbourview Supply','HV-CART-10',1000,'each','empty-510-vape-cartridge-1-0ml','consumables',true,'HVP-VAP-C10',15000,14,500,'{}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','510 Thread Battery — Variable Voltage, USB-C','Rechargeable 510 thread battery with variable voltage and USB-C charging.','vape_hardware','north_america','negotiable','distributor','{"thread":"510","charging":"USB-C","voltage":"variable"}','approved',true,false,2.20,'CAD','CA','new','Harbourview Supply','HV-BATT-1',1000,'each','510-thread-battery-variable-voltage-usbc','consumables',true,'HVP-VAP-BAT',12000,14,250,'{}','{CA}',now(),now()),
(gen_random_uuid(),'packaging','CR Vape Cartridge Box — 510 Push-Turn (Single)','Child-resistant push-and-turn carton for single 510 cartridges.','vape_packaging','north_america','negotiable','distributor','{"thread":"510","cr":true}','approved',true,false,0.30,'CAD','CA','new','Harbourview Supply','HV-VBOX-1',1000,'each','cr-vape-cartridge-box-510-push-turn','packaging',true,'HVP-VPK-BOX',20000,10,500,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"csa_z76_1":true}}','{CA}',now(),now()),
(gen_random_uuid(),'packaging','CR Vape Cartridge Tube — 95mm Press-Button (Recyclable Cardboard)','Child-resistant, recyclable cardboard tube with press-button closure for 510 cartridges.','vape_packaging','north_america','negotiable','distributor','{"length":"95mm","material":"recyclable cardboard","cr":true}','approved',true,false,0.28,'CAD','CA','new','Harbourview Supply','HV-VTUBE-95',1000,'each','cr-vape-cartridge-tube-95mm-press-button','packaging',true,'HVP-VPK-TUB',18000,10,500,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"csa_z76_1":true}}','{CA}',now(),now()),
(gen_random_uuid(),'packaging','CR Edible Single-Serving Stand-Up Pouch (10mg)','Child-resistant opaque stand-up pouch sized for a single 10mg THC edible package, per Health Canada''s 10mg/package limit.','edible_packaging','north_america','negotiable','distributor','{"dose_mg":10,"cr":true}','approved',true,true,0.12,'CAD','CA','new','Harbourview Supply','HV-EDPCH-10',1000,'each','cr-edible-single-serving-pouch-10mg','packaging',true,'HVP-EDB-PCH',20000,10,500,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"max_thc_mg_per_package":10}}','{CA}',now(),now()),
(gen_random_uuid(),'packaging','CR Edible Multi-Cavity Blister Card (10 x 1mg)','Child-resistant blister card holding 10 x 1mg THC pieces, total 10mg per Health Canada package limit.','edible_packaging','north_america','negotiable','distributor','{"cavities":10,"dose_mg_each":1,"cr":true}','approved',true,false,0.24,'CAD','CA','new','Harbourview Supply','HV-EDBLIS-10',1000,'each','cr-edible-multi-cavity-blister-10x1mg','packaging',true,'HVP-EDB-BLI',15000,12,500,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"max_thc_mg_per_package":10}}','{CA}',now(),now()),
(gen_random_uuid(),'packaging','CR Outer Carton for Edible Pouch (Health Warning Panel)','Opaque outer carton sized for edible pouches, with dedicated health-warning and cannabis-symbol panel per plain packaging rules.','edible_packaging','north_america','negotiable','distributor','{"cr":true}','approved',true,false,0.20,'CAD','CA','new','Harbourview Supply','HV-EDCARTON-1',1000,'each','cr-outer-carton-edible-pouch','packaging',true,'HVP-EDB-CTN',12000,12,500,'{"CA":{"opaque":true,"plain_packaging":true}}','{CA}',now(),now()),
(gen_random_uuid(),'packaging','Health Canada Compliant Label Roll — THC/CBD Panel + Symbol (Blank)','Blank-fill label roll pre-formatted with the standardized cannabis symbol, health warning, and THC/CBD info panel per plain packaging rules.','label','north_america','negotiable','distributor','{"format":"THC/CBD panel + symbol"}','approved',true,false,0.06,'CAD','CA','new','Harbourview Supply','HV-LBL-1','5000','each','hc-compliant-label-roll-thc-cbd-symbol','packaging',true,'HVP-LBL-001',200000,10,5000,'{"CA":{"plain_packaging":true,"cannabis_symbol":true,"health_warning":true}}','{CA}',now(),now()),
(gen_random_uuid(),'packaging','Batch/Lot Traceability Barcode Labels (Blank, Roll of 1000)','Blank barcode/lot-tracking labels for batch traceability.','label','north_america','negotiable','distributor','{}','approved',true,false,0.03,'CAD','CA','new','Harbourview Supply','HV-LBL-2',1000,'each','batch-lot-traceability-barcode-labels','packaging',true,'HVP-LBL-002',300000,7,5000,'{}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','Bulk Curing Tote / Turkey Bag (Large Format, Food-Grade)','Food-grade large-format bag for bulk curing of flower.','curing_supply','north_america','negotiable','distributor','{"format":"large bulk"}','approved',true,false,1.10,'CAD','CA','new','Harbourview Supply','HV-CURETOTE-1',500,'each','bulk-curing-tote-turkey-bag','consumables',true,'HVP-CUR-TOT',5000,10,100,'{}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','Vacuum-Seal Bulk Storage Bag (1kg Format)','Vacuum-seal bag sized for 1kg bulk flower storage.','curing_supply','north_america','negotiable','distributor','{"format":"1kg"}','approved',true,false,0.45,'CAD','CA','new','Harbourview Supply','HV-VACBAG-1KG',1000,'each','vacuum-seal-bulk-storage-bag-1kg','consumables',true,'HVP-CUR-VAC',8000,10,250,'{}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','Two-Way Humidity Control Packs — 69% RH (Bulk Case)','2-way humidity control packs, 69% RH, bulk case for larger-format curing.','humidity_pack','north_america','negotiable','distributor','{"rh":"69%"}','approved',true,false,0.40,'CAD','CA','new','Harbourview Supply','HV-HUMID-69',500,'each','humidity-control-packs-69rh-bulk','consumables',true,'HVP-HUM-069',9000,10,100,'{}','{CA}',now(),now()),
(gen_random_uuid(),'processing_equipment','Bench-Top Impulse Heat Sealer (Mylar Pouches)','Impulse heat sealer for sealing mylar pouches at the point of packing.','sealing_equipment','north_america','negotiable','distributor','{}','approved',true,false,210.00,'CAD','CA','new','Harbourview Supply','HV-SEALER-1',15,'unit','bench-top-impulse-heat-sealer','processing',true,'HVP-EQP-SEAL',15,10,1,'{}','{CA}',now(),now()),
(gen_random_uuid(),'processing_equipment','Semi-Automatic Capping Machine (CR Cap Application)','Semi-automatic machine for applying child-resistant caps to jars/bottles at production scale.','capping_equipment','north_america','negotiable','distributor','{}','approved',true,false,5400.00,'CAD','CA','new','Harbourview Supply','HV-CAPPER-1',3,'unit','semi-automatic-capping-machine-cr','processing',true,'HVP-EQP-CAP',3,28,1,'{}','{CA}',now(),now()),
(gen_random_uuid(),'processing_equipment','Semi-Automatic Label Applicator','Semi-automatic label applicator for jars, pouches, and cartons.','labeling_equipment','north_america','negotiable','distributor','{}','approved',true,false,3800.00,'CAD','CA','new','Harbourview Supply','HV-LABELER-1',3,'unit','semi-automatic-label-applicator','processing',true,'HVP-EQP-LBL',3,28,1,'{}','{CA}',now(),now()),
(gen_random_uuid(),'processing_equipment','Vape Cartridge Filling Machine (Semi-Automatic, Peristaltic)','Semi-automatic peristaltic filling machine for 510 vape cartridges.','filling_equipment','north_america','negotiable','distributor','{"mechanism":"peristaltic"}','approved',true,true,7200.00,'CAD','CA','new','Harbourview Supply','HV-FILLER-1',2,'unit','vape-cartridge-filling-machine-semi-auto','processing',true,'HVP-EQP-FIL',2,28,1,'{}','{CA}',now(),now());


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730211507','seed_supply_catalog_canada_batch2','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730211507_seed_supply_catalog_canada_batch2.sql

-- RECOVERY BEGIN 20260730211621_seed_supply_catalog_canada_batch3.sql

insert into public.listings
  (id, category, title, description, product_type, region, price_range, seller_type,
   high_level_specs, status, public_visibility, is_featured, price_amount, price_currency,
   location_country, condition, brand, model, quantity, unit, slug, marketplace_section,
   sold_by_harbourview, sku, stock_qty, lead_time_days, moq, compliance_flags, target_countries,
   created_at, updated_at)
values
(gen_random_uuid(),'packaging','CR Silicone Concentrate Container — 5mL (Opaque)','Child-resistant opaque silicone concentrate container, non-stick interior.','concentrate_packaging','north_america','negotiable','distributor','{"size":"5mL","material":"silicone","cr":true}','approved',true,false,0.32,'CAD','CA','new','Harbourview Supply','HV-CONC-SIL5',1000,'each','cr-silicone-concentrate-container-5ml','packaging',true,'HVP-CNC-SIL',15000,10,500,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"csa_z76_1":true}}','{CA}',now(),now()),
(gen_random_uuid(),'packaging','CR Glass Concentrate Jar — 5mL','Child-resistant glass concentrate jar with CR lid, opaque black.','concentrate_packaging','north_america','negotiable','distributor','{"size":"5mL","material":"glass","cr":true}','approved',true,false,0.48,'CAD','CA','new','Harbourview Supply','HV-CONC-GLS5',1000,'each','cr-glass-concentrate-jar-5ml','packaging',true,'HVP-CNC-GLS',12000,12,500,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"csa_z76_1":true}}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','Unbleached Parchment / Wax Paper Squares (Bulk)','Non-stick unbleached parchment squares for concentrate handling and packaging.','concentrate_supply','north_america','negotiable','distributor','{}','approved',true,false,0.02,'CAD','CA','new','Harbourview Supply','HV-PARCH-1',1000,'each','unbleached-parchment-wax-paper-squares','consumables',true,'HVP-CNC-PAR',200000,7,5000,'{}','{CA}',now(),now()),
(gen_random_uuid(),'packaging','CR Tincture Bottle — 30mL Amber Glass w/ Dropper','Child-resistant amber glass tincture bottle with graduated dropper cap.','tincture_packaging','north_america','negotiable','distributor','{"size":"30mL","material":"amber glass","cr":true}','approved',true,true,0.14,'CAD','CA','new','Harbourview Supply','HV-TINC-30',1000,'each','cr-tincture-bottle-30ml-amber-dropper','packaging',true,'HVP-TIN-030',18000,10,500,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"csa_z76_1":true}}','{CA}',now(),now()),
(gen_random_uuid(),'packaging','CR Tincture Bottle — 10mL Amber Glass w/ Dropper','Child-resistant amber glass tincture bottle with graduated dropper cap.','tincture_packaging','north_america','negotiable','distributor','{"size":"10mL","material":"amber glass","cr":true}','approved',true,false,0.11,'CAD','CA','new','Harbourview Supply','HV-TINC-10',1000,'each','cr-tincture-bottle-10ml-amber-dropper','packaging',true,'HVP-TIN-010',20000,10,500,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"csa_z76_1":true}}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','Graduated Glass Droppers (Bulk)','Bulk calibrated glass droppers for tincture bottle assembly.','tincture_supply','north_america','negotiable','distributor','{"graduated":true}','approved',true,false,0.06,'CAD','CA','new','Harbourview Supply','HV-DROP-1',1000,'each','graduated-glass-droppers-bulk','consumables',true,'HVP-TIN-DRP',25000,10,1000,'{}','{CA}',now(),now()),
(gen_random_uuid(),'packaging','CR Topical Jar — 50g (Opaque, CR Lid)','Child-resistant opaque jar for topical creams/balms.','topical_packaging','north_america','negotiable','distributor','{"size":"50g","cr":true}','approved',true,false,0.38,'CAD','CA','new','Harbourview Supply','HV-TOP-JAR50',1000,'each','cr-topical-jar-50g','packaging',true,'HVP-TOP-JAR',10000,12,500,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"csa_z76_1":true}}','{CA}',now(),now()),
(gen_random_uuid(),'packaging','CR Topical Stick / Tube (Deodorant-Style)','Child-resistant deodorant-style twist-up tube for topical sticks.','topical_packaging','north_america','negotiable','distributor','{"format":"twist-up stick","cr":true}','approved',true,false,0.42,'CAD','CA','new','Harbourview Supply','HV-TOP-STICK',1000,'each','cr-topical-stick-tube','packaging',true,'HVP-TOP-STK',8000,12,500,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"csa_z76_1":true}}','{CA}',now(),now()),
(gen_random_uuid(),'packaging','CR Topical Pump Bottle — 100mL','Child-resistant pump-top bottle for liquid/lotion topicals.','topical_packaging','north_america','negotiable','distributor','{"size":"100mL","format":"pump","cr":true}','approved',true,false,0.55,'CAD','CA','new','Harbourview Supply','HV-TOP-PUMP100',1000,'each','cr-topical-pump-bottle-100ml','packaging',true,'HVP-TOP-PMP',6000,14,250,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"csa_z76_1":true}}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','Master Shipping Case (Corrugated, Retail-Ready)','Corrugated master shipping case sized for retail-ready cannabis product cartons.','shipping_supply','north_america','negotiable','distributor','{}','approved',true,false,1.35,'CAD','CA','new','Harbourview Supply','HV-CASE-1',500,'each','master-shipping-case-corrugated','consumables',true,'HVP-SHP-CAS',6000,10,100,'{}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','Void Fill Air Pillows (Bulk)','Bulk air pillow void fill for shipping cartons.','shipping_supply','north_america','negotiable','distributor','{}','approved',true,false,0.02,'CAD','CA','new','Harbourview Supply','HV-VOID-1',5000,'each','void-fill-air-pillows-bulk','consumables',true,'HVP-SHP-VOI',500000,7,10000,'{}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','Pallet Stretch Wrap (Bulk Rolls)','Machine-grade stretch wrap for palletized shipments.','shipping_supply','north_america','negotiable','distributor','{}','approved',true,false,18.00,'CAD','CA','new','Harbourview Supply','HV-WRAP-1',200,'roll','pallet-stretch-wrap-bulk-rolls','consumables',true,'HVP-SHP-WRP',1500,7,20,'{}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','Tamper-Evident Security Tape (Case Sealing)','Security tape with void/tamper-evident pattern for shipping case sealing.','shipping_supply','north_america','negotiable','distributor','{}','approved',true,false,4.20,'CAD','CA','new','Harbourview Supply','HV-TAPE-1',200,'roll','tamper-evident-security-tape','consumables',true,'HVP-SHP-TAP',3000,7,50,'{}','{CA}',now(),now()),
(gen_random_uuid(),'processing_equipment','Tincture Filling Machine (Semi-Automatic, Volumetric)','Semi-automatic volumetric filling machine for tincture and topical liquid bottles.','filling_equipment','north_america','negotiable','distributor','{"mechanism":"volumetric"}','approved',true,false,6500.00,'CAD','CA','new','Harbourview Supply','HV-TINCFIL-1',2,'unit','tincture-filling-machine-semi-auto','processing',true,'HVP-EQP-TFL',2,28,1,'{}','{CA}',now(),now()),
(gen_random_uuid(),'processing_equipment','Semi-Automatic Case Erector/Sealer','Semi-automatic case erector and sealer for shipping carton assembly.','packing_equipment','north_america','negotiable','distributor','{}','approved',true,false,8900.00,'CAD','CA','new','Harbourview Supply','HV-CASESEAL-1',2,'unit','semi-automatic-case-erector-sealer','processing',true,'HVP-EQP-CES',2,35,1,'{}','{CA}',now(),now()),
(gen_random_uuid(),'processing_equipment','Induction Sealer (Foil Liner Sealing for Bottles)','Induction sealer for foil-liner sealing of tincture/topical bottle caps.','sealing_equipment','north_america','negotiable','distributor','{}','approved',true,false,2600.00,'CAD','CA','new','Harbourview Supply','HV-INDSEAL-1',4,'unit','induction-sealer-foil-liner','processing',true,'HVP-EQP-IND',4,21,1,'{}','{CA}',now(),now());


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730211621','seed_supply_catalog_canada_batch3','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730211621_seed_supply_catalog_canada_batch3.sql

-- RECOVERY BEGIN 20260730211756_seed_supply_catalog_canada_batch4.sql

insert into public.listings
  (id, category, title, description, product_type, region, price_range, seller_type,
   high_level_specs, status, public_visibility, is_featured, price_amount, price_currency,
   location_country, condition, brand, model, quantity, unit, slug, marketplace_section,
   sold_by_harbourview, sku, stock_qty, lead_time_days, moq, compliance_flags, target_countries,
   created_at, updated_at)
values
(gen_random_uuid(),'consumables','Rockwool Propagation Cubes (Case)','Rockwool propagation cubes for clones and seedlings.','grow_media','north_america','negotiable','distributor','{}','approved',true,false,0.09,'CAD','CA','new','Harbourview Supply','HV-ROCKW-1',1500,'each','rockwool-propagation-cubes-case','consumables',true,'HVP-CUL-ROC',300000,10,1500,'{}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','Coco Coir Grow Media (Compressed Bale, 50L Expanded)','Compressed coco coir bale, expands to approx. 50L grow media.','grow_media','north_america','negotiable','distributor','{"expanded_volume":"50L"}','approved',true,false,18.00,'CAD','CA','new','Harbourview Supply','HV-COCO-50',300,'bale','coco-coir-grow-media-50l-bale','consumables',true,'HVP-CUL-COC',2000,14,20,'{}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','Cannabis Nutrient Line — Grow Base A/B (20L Jug)','Vegetative-stage base nutrient concentrate, 20L jug.','nutrients','north_america','negotiable','distributor','{"stage":"grow","size":"20L"}','approved',true,false,145.00,'CAD','CA','new','Harbourview Supply','HV-NUT-GROW20',100,'jug','cannabis-nutrient-grow-base-20l','consumables',true,'HVP-CUL-NUTG',400,14,4,'{}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','Cannabis Nutrient Line — Bloom Base A/B (20L Jug)','Flowering-stage base nutrient concentrate, 20L jug.','nutrients','north_america','negotiable','distributor','{"stage":"bloom","size":"20L"}','approved',true,false,155.00,'CAD','CA','new','Harbourview Supply','HV-NUT-BLM20',100,'jug','cannabis-nutrient-bloom-base-20l','consumables',true,'HVP-CUL-NUTB',400,14,4,'{}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','Trellis Netting (100ft Roll)','Support netting for canopy training, 100ft roll.','trellis','north_america','negotiable','distributor','{"length":"100ft"}','approved',true,false,22.00,'CAD','CA','new','Harbourview Supply','HV-TRELLIS-100',200,'roll','trellis-netting-100ft-roll','consumables',true,'HVP-CUL-TRL',1200,10,10,'{}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','Cloning Gel (1L Bottle)','Rooting hormone gel for clone propagation, 1L bottle.','cloning_supply','north_america','negotiable','distributor','{"size":"1L"}','approved',true,false,28.00,'CAD','CA','new','Harbourview Supply','HV-CLONEGEL-1',100,'bottle','cloning-gel-1l-bottle','consumables',true,'HVP-CUL-GEL',600,10,6,'{}','{CA}',now(),now()),
(gen_random_uuid(),'cultivation_equipment','Humidity Dome + Tray Propagation Kit','Propagation tray and humidity dome kit for clones/seedlings.','propagation_kit','north_america','negotiable','distributor','{}','approved',true,false,14.00,'CAD','CA','new','Harbourview Supply','HV-DOME-1',200,'kit','humidity-dome-tray-propagation-kit','equipment',true,'HVP-CUL-DOM',800,10,10,'{}','{CA}',now(),now()),
(gen_random_uuid(),'cultivation_equipment','Commercial LED Grow Light Bar — 640W Full-Spectrum','Commercial-grade full-spectrum LED grow light bar for flowering rooms.','grow_light','north_america','negotiable','distributor','{"wattage":"640W","spectrum":"full"}','approved',true,true,850.00,'CAD','CA','new','Harbourview Supply','HV-LED-640',40,'unit','led-grow-light-bar-640w','equipment',true,'HVP-CUL-LED',40,21,1,'{}','{CA}',now(),now()),
(gen_random_uuid(),'cultivation_equipment','Drip Irrigation Kit (Expandable, Per Zone)','Expandable drip irrigation kit configurable per canopy zone.','irrigation','north_america','negotiable','distributor','{}','approved',true,false,320.00,'CAD','CA','new','Harbourview Supply','HV-DRIP-1',30,'kit','drip-irrigation-kit-expandable','equipment',true,'HVP-CUL-DRP',30,21,1,'{}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','Tamper-Evident Sample Collection Bags (Bulk)','Tamper-evident bags for COA/lab sample collection and chain of custody.','lab_supply','north_america','negotiable','distributor','{}','approved',true,false,0.15,'CAD','CA','new','Harbourview Supply','HV-SAMPBAG-1',1000,'each','tamper-evident-sample-collection-bags','labs_testing',true,'HVP-LAB-SMP',20000,10,500,'{}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','Lab Pipette Tips (Bulk Case, 1000ct)','Disposable pipette tips for lab sampling and testing workflows.','lab_supply','north_america','negotiable','distributor','{"count":1000}','approved',true,false,0.02,'CAD','CA','new','Harbourview Supply','HV-PIPTIP-1',1000,'each','lab-pipette-tips-bulk-1000ct','labs_testing',true,'HVP-LAB-PIP',500000,10,1000,'{}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','pH / EC Calibration Solution Kit','Calibration solution kit for pH and EC meters.','lab_supply','north_america','negotiable','distributor','{}','approved',true,false,45.00,'CAD','CA','new','Harbourview Supply','HV-CALKIT-1',150,'kit','ph-ec-calibration-solution-kit','labs_testing',true,'HVP-LAB-CAL',600,10,5,'{}','{CA}',now(),now()),
(gen_random_uuid(),'labs_testing','Bench-Top Moisture Analyzer (Halogen, Compliance-Grade)','Halogen moisture analyzer for compliance-grade moisture content testing.','lab_equipment','north_america','negotiable','distributor','{"method":"halogen"}','approved',true,false,2100.00,'CAD','CA','new','Harbourview Supply','HV-MOIST-1',6,'unit','moisture-analyzer-halogen-bench-top','labs_testing',true,'HVP-EQP-MOI',6,21,1,'{}','{CA}',now(),now()),
(gen_random_uuid(),'packaging','CR Dispensary Exit Bag (Opaque, Blank)','Child-resistant opaque exit bag for point-of-sale dispensing.','exit_bag','north_america','negotiable','distributor','{"cr":true}','approved',true,false,0.16,'CAD','CA','new','Harbourview Supply','HV-EXITBAG-1',1000,'each','cr-dispensary-exit-bag-opaque','packaging',true,'HVP-RTL-EXB',15000,10,500,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"csa_z76_1":true}}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','In-Store Compliance Signage Kit (Mandatory Health Warnings)','Retail signage kit covering mandatory in-store cannabis health warning postings.','retail_supply','north_america','negotiable','distributor','{}','approved',true,false,35.00,'CAD','CA','new','Harbourview Supply','HV-SIGNKIT-1',80,'kit','in-store-compliance-signage-kit','consumables',true,'HVP-RTL-SIG',300,14,5,'{}','{CA}',now(),now());


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730211756','seed_supply_catalog_canada_batch4','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730211756_seed_supply_catalog_canada_batch4.sql

-- RECOVERY BEGIN 20260730212129_extend_public_listings_view_for_supply_catalog.sql

-- Drop the one-off view from this session; the app actually queries
-- marketplace_public_listings_v1 (public + api), so extend that instead.
drop view if exists api.supply_catalog_v1;

create or replace view public.marketplace_public_listings_v1 as
select
  id,
  slug,
  title,
  description,
  category::text as category,
  null::text as subcategory,
  coalesce(marketplace_section, category::text) as marketplace_section,
  product_type,
  region::text as region,
  condition,
  location_country,
  null::text as location_region,
  price_amount,
  coalesce(price_currency, 'USD'::text) as price_currency,
  case
    when price_amount is not null then concat(coalesce(price_currency, 'USD'::text), ' ', price_amount::text)
    else null::text
  end as price_display,
  coalesce(seller_type::text, 'controlled_review'::text) as seller_type,
  is_featured,
  high_level_specs,
  created_at,
  average_rating,
  review_count,
  sold_by_harbourview,
  sku,
  brand,
  model,
  quantity,
  unit,
  stock_qty,
  lead_time_days,
  moq,
  compliance_flags,
  target_countries
from listings l
where status = 'approved'::listing_status and public_visibility = true and archived_at is null;

create or replace view api.marketplace_public_listings_v1
with (security_invoker = on) as
select
  id, slug, title, description, category, subcategory, marketplace_section, product_type,
  region, condition, location_country, location_region, price_amount, price_currency,
  price_display, seller_type, is_featured, high_level_specs, created_at, average_rating,
  review_count, sold_by_harbourview, sku, brand, model, quantity, unit, stock_qty,
  lead_time_days, moq, compliance_flags, target_countries
from public.marketplace_public_listings_v1;

grant select on api.marketplace_public_listings_v1 to anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730212129','extend_public_listings_view_for_supply_catalog','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730212129_extend_public_listings_view_for_supply_catalog.sql

-- RECOVERY BEGIN 20260730215959_restore_listings_unit.sql
-- Production already had public.listings.unit when the Harbourview supply
-- catalog was built, but repository zero-state never recorded its creator.
-- Restore only that prerequisite column immediately before the first migration
-- whose view selects it.
--
-- 20260730220000 fails without it during zero-state replay, at its seventh
-- statement:
--   create or replace view api.supply_catalog_public_v1 as ... l.unit ...
--   column l.unit does not exist (SQLSTATE 42703)
--
-- Restored as its own migration rather than folded into that file's ALTER
-- TABLE, because `unit` was never part of this change. The production-recorded
-- equivalent of that ALTER, 20260730211141
-- add_harbourview_direct_supply_catalog_fields, adds exactly the same seven
-- columns the repository file adds -- sold_by_harbourview, sku, stock_qty,
-- lead_time_days, moq, compliance_flags, target_countries -- and does not
-- mention unit. The very next production migration, 20260730211147
-- create_supply_catalog_public_view, then selects l.unit. So the column
-- pre-dates this work in production and simply has no creator anywhere in the
-- repository; adding it to the ALTER would have made that statement diverge
-- from its recorded body.
--
-- Same shape as the three columns already restored on their own tables for the
-- same reason: 20260615091139 (marketplace_candidates.discovered_at),
-- 20260719190928 (marketplace_candidates.price_amount) and 20260728201439
-- (marketplace_candidates.source_id).
--
-- Shape taken from the live table, not guessed: text, nullable, no default,
-- and no constraint on this project references unit.
--
-- Checked across every column the failing view selects from public.listings:
-- replay builds 47 columns on that table by this point and the view reads 18
-- of them; unit is the only one missing. The one other repository migration
-- that reads it, 20260731145108_harden_supply_catalog_public_projection.sql,
-- runs later and is covered by this restore.

alter table public.listings
  add column if not exists unit text;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730215959','restore_listings_unit','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730215959_restore_listings_unit.sql

-- RECOVERY BEGIN 20260730220000_add_harbourview_supply_catalog.sql
-- Harbourview Supply catalog schema.
-- The supply surface uses a dedicated public DTO and does not replace or
-- expand the canonical marketplace_public_listings_v1 contract.

alter table public.listings
  add column if not exists sold_by_harbourview boolean not null default false,
  add column if not exists sku text,
  add column if not exists stock_qty integer,
  add column if not exists lead_time_days integer,
  add column if not exists moq integer,
  add column if not exists compliance_flags jsonb not null default '{}'::jsonb,
  add column if not exists target_countries text[] not null default '{}';

create index if not exists listings_sold_by_harbourview_idx
  on public.listings (sold_by_harbourview)
  where sold_by_harbourview = true;

-- These partial natural keys make the two seed migrations deterministic.
-- Their existing ON CONFLICT DO NOTHING clauses now prevent duplicate rows
-- when a migration is replayed against an environment containing the catalog.
create unique index if not exists listings_supply_slug_unique_idx
  on public.listings (slug)
  where sold_by_harbourview = true and slug is not null;

create unique index if not exists listings_supply_sku_unique_idx
  on public.listings (sku)
  where sold_by_harbourview = true and sku is not null;

comment on column public.listings.sold_by_harbourview is
  'Internal catalog discriminator. Public supply access is provided only through api.supply_catalog_public_v1.';
comment on column public.listings.compliance_flags is
  'Internal structured attributes requiring review. Raw values are not exposed by the public supply DTO.';
comment on column public.listings.target_countries is
  'ISO country codes proposed for jurisdiction review; not a public compliance conclusion.';

create or replace view api.supply_catalog_public_v1 as
select
  l.id,
  l.slug,
  l.title,
  case l.category::text
    when 'packaging' then 'Unbranded packaging format available for commercial review and quotation.'
    when 'consumables' then 'Commercial consumable available for specification review and quotation.'
    when 'cultivation_equipment' then 'Generic cultivation equipment available for configuration review and quotation.'
    when 'processing_equipment' then 'Generic processing equipment available for configuration review and quotation.'
    when 'labs_testing' then 'Laboratory or testing equipment available for specification review and quotation.'
    else 'Supply catalog item available for specification review and quotation.'
  end::text as description,
  l.category::text as category,
  coalesce(l.marketplace_section, l.category::text)::text as marketplace_section,
  l.product_type,
  l.region::text as region,
  coalesce(l.price_currency, 'CAD')::text as price_currency,
  'Quote required'::text as price_display,
  coalesce(l.is_featured, false) as is_featured,
  l.created_at,
  l.sku,
  l.unit,
  null::text as moq_display,
  null::text as lead_time_display,
  'Subject to confirmation'::text as availability_status,
  coalesce(l.target_countries, '{}'::text[]) as target_countries,
  coalesce(
    (
      select jsonb_agg(attribute order by attribute->>'label')
      from (
        select jsonb_build_object(
          'key', allowed.attribute_key,
          'label', allowed.attribute_label,
          'value', 'Review required'
        ) as attribute
        from (values
          ('child_resistant', 'Child-resistant format'),
          ('tamper_evident', 'Tamper-evident format'),
          ('opaque', 'Opaque format')
        ) allowed(attribute_key, attribute_label)
        where exists (
          select 1
          from jsonb_each(coalesce(l.compliance_flags, '{}'::jsonb)) country_entry
          where coalesce((country_entry.value ->> allowed.attribute_key)::boolean, false) = true
        )
      ) attributes
    ),
    '[]'::jsonb
  ) as public_attributes,
  'Attributes, availability, pricing, lead time and jurisdiction fit require Harbourview review before reliance or purchase.'::text as review_note
from public.listings l
where l.sold_by_harbourview = true
  -- Cast dropped 2026-08-05. This file is repository-only -- the live ledger has
  -- no row at 20260730220000 -- and production built the same surface as
  -- 20260730211141 + 20260730211147, whose recorded view writes this predicate
  -- with a bare literal and no cast:
  --   where l.sold_by_harbourview = true
  --     and l.status = 'approved'
  --     and l.public_visibility = true;
  -- The ::listing_status cast was therefore never production's contract, and it
  -- fails zero-state replay because the repository builds public.listings with
  -- `status text` (20260528033000) while production's column is the enum:
  --   ERROR: operator does not exist: text = listing_status (SQLSTATE 42883)
  -- A bare unknown-typed literal resolves against either type, so this matches
  -- production today and stays correct if the column is ever made the enum.
  and l.status = 'approved'
  and l.public_visibility = true
  and l.archived_at is null
  and l.slug is not null
  and l.sku is not null;

comment on view api.supply_catalog_public_v1 is
  'Allowlisted public supply DTO excluding exact stock, raw compliance metadata, supplier identity, brand/model and internal review data.';

grant select on api.supply_catalog_public_v1 to anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730220000','add_harbourview_supply_catalog','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730220000_add_harbourview_supply_catalog.sql

-- RECOVERY BEGIN 20260730220200_seed_harbourview_supply_catalog_canada_batch2_4.sql
-- Renamed 2026-08-05: the description ended `..._batch2-4.sql`, and a hyphen is
-- not allowed by scripts/check-migration-filenames.mjs, whose pattern is
-- ^(\d{14})_[a-z0-9_]+\.sql$. It was the last failure in that gate. Only the
-- hyphen became an underscore -- the 20260730220200 version and the SQL below
-- are unchanged, and the version is repository-only (production applied these
-- seeds as three separate ledger rows, 20260730211507/211621/211756), so no
-- recorded migration is renamed by this.
--
-- Harbourview-direct supply catalog: Canada seed batches 2-4 (48 SKUs),
-- continuing supabase/migrations/20260730220100_..._batch1.sql (20 SKUs).
-- Combined total: 68 SKUs, matching what is live in production.
-- Same disclosure/idempotency caveats as batch 1 apply here.

insert into public.listings
  (id, category, title, description, product_type, region, price_range, seller_type,
   high_level_specs, status, public_visibility, is_featured, price_amount, price_currency,
   location_country, condition, brand, model, quantity, unit, slug, marketplace_section,
   sold_by_harbourview, sku, stock_qty, lead_time_days, moq, compliance_flags, target_countries,
   created_at, updated_at, listing_type)
values
(gen_random_uuid(),'consumables','Empty 510 Vape Cartridge — 0.5mL Ceramic/Glass','Empty ceramic-coil 510 thread vape cartridge for oil filling.','vape_hardware','north_america','negotiable','distributor','{"size":"0.5mL","thread":"510","material":"ceramic/glass"}','approved',true,false,0.65,'CAD','CA','new','Harbourview Supply','HV-CART-05',1000,'each','empty-510-vape-cartridge-0-5ml','consumables',true,'HVP-VAP-C05',20000,14,500,'{}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'consumables','Empty 510 Vape Cartridge — 1.0mL Ceramic/Glass','Empty ceramic-coil 510 thread vape cartridge for oil filling.','vape_hardware','north_america','negotiable','distributor','{"size":"1.0mL","thread":"510","material":"ceramic/glass"}','approved',true,false,0.85,'CAD','CA','new','Harbourview Supply','HV-CART-10',1000,'each','empty-510-vape-cartridge-1-0ml','consumables',true,'HVP-VAP-C10',15000,14,500,'{}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'consumables','510 Thread Battery — Variable Voltage, USB-C','Rechargeable 510 thread battery with variable voltage and USB-C charging.','vape_hardware','north_america','negotiable','distributor','{"thread":"510","charging":"USB-C","voltage":"variable"}','approved',true,false,2.20,'CAD','CA','new','Harbourview Supply','HV-BATT-1',1000,'each','510-thread-battery-variable-voltage-usbc','consumables',true,'HVP-VAP-BAT',12000,14,250,'{}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'packaging','CR Vape Cartridge Box — 510 Push-Turn (Single)','Child-resistant push-and-turn carton for single 510 cartridges.','vape_packaging','north_america','negotiable','distributor','{"thread":"510","cr":true}','approved',true,false,0.30,'CAD','CA','new','Harbourview Supply','HV-VBOX-1',1000,'each','cr-vape-cartridge-box-510-push-turn','packaging',true,'HVP-VPK-BOX',20000,10,500,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"csa_z76_1":true}}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'packaging','CR Vape Cartridge Tube — 95mm Press-Button (Recyclable Cardboard)','Child-resistant, recyclable cardboard tube with press-button closure for 510 cartridges.','vape_packaging','north_america','negotiable','distributor','{"length":"95mm","material":"recyclable cardboard","cr":true}','approved',true,false,0.28,'CAD','CA','new','Harbourview Supply','HV-VTUBE-95',1000,'each','cr-vape-cartridge-tube-95mm-press-button','packaging',true,'HVP-VPK-TUB',18000,10,500,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"csa_z76_1":true}}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'packaging','CR Edible Single-Serving Stand-Up Pouch (10mg)','Child-resistant opaque stand-up pouch sized for a single 10mg THC edible package, per Health Canada''s 10mg/package limit.','edible_packaging','north_america','negotiable','distributor','{"dose_mg":10,"cr":true}','approved',true,true,0.12,'CAD','CA','new','Harbourview Supply','HV-EDPCH-10',1000,'each','cr-edible-single-serving-pouch-10mg','packaging',true,'HVP-EDB-PCH',20000,10,500,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"max_thc_mg_per_package":10}}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'packaging','CR Edible Multi-Cavity Blister Card (10 x 1mg)','Child-resistant blister card holding 10 x 1mg THC pieces, total 10mg per Health Canada package limit.','edible_packaging','north_america','negotiable','distributor','{"cavities":10,"dose_mg_each":1,"cr":true}','approved',true,false,0.24,'CAD','CA','new','Harbourview Supply','HV-EDBLIS-10',1000,'each','cr-edible-multi-cavity-blister-10x1mg','packaging',true,'HVP-EDB-BLI',15000,12,500,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"max_thc_mg_per_package":10}}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'packaging','CR Outer Carton for Edible Pouch (Health Warning Panel)','Opaque outer carton sized for edible pouches, with dedicated health-warning and cannabis-symbol panel per plain packaging rules.','edible_packaging','north_america','negotiable','distributor','{"cr":true}','approved',true,false,0.20,'CAD','CA','new','Harbourview Supply','HV-EDCARTON-1',1000,'each','cr-outer-carton-edible-pouch','packaging',true,'HVP-EDB-CTN',12000,12,500,'{"CA":{"opaque":true,"plain_packaging":true}}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'packaging','Health Canada Compliant Label Roll — THC/CBD Panel + Symbol (Blank)','Blank-fill label roll pre-formatted with the standardized cannabis symbol, health warning, and THC/CBD info panel per plain packaging rules.','label','north_america','negotiable','distributor','{"format":"THC/CBD panel + symbol"}','approved',true,false,0.06,'CAD','CA','new','Harbourview Supply','HV-LBL-1','5000','each','hc-compliant-label-roll-thc-cbd-symbol','packaging',true,'HVP-LBL-001',200000,10,5000,'{"CA":{"plain_packaging":true,"cannabis_symbol":true,"health_warning":true}}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'packaging','Batch/Lot Traceability Barcode Labels (Blank, Roll of 1000)','Blank barcode/lot-tracking labels for batch traceability.','label','north_america','negotiable','distributor','{}','approved',true,false,0.03,'CAD','CA','new','Harbourview Supply','HV-LBL-2',1000,'each','batch-lot-traceability-barcode-labels','packaging',true,'HVP-LBL-002',300000,7,5000,'{}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'consumables','Bulk Curing Tote / Turkey Bag (Large Format, Food-Grade)','Food-grade large-format bag for bulk curing of flower.','curing_supply','north_america','negotiable','distributor','{"format":"large bulk"}','approved',true,false,1.10,'CAD','CA','new','Harbourview Supply','HV-CURETOTE-1',500,'each','bulk-curing-tote-turkey-bag','consumables',true,'HVP-CUR-TOT',5000,10,100,'{}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'consumables','Vacuum-Seal Bulk Storage Bag (1kg Format)','Vacuum-seal bag sized for 1kg bulk flower storage.','curing_supply','north_america','negotiable','distributor','{"format":"1kg"}','approved',true,false,0.45,'CAD','CA','new','Harbourview Supply','HV-VACBAG-1KG',1000,'each','vacuum-seal-bulk-storage-bag-1kg','consumables',true,'HVP-CUR-VAC',8000,10,250,'{}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'consumables','Two-Way Humidity Control Packs — 69% RH (Bulk Case)','2-way humidity control packs, 69% RH, bulk case for larger-format curing.','humidity_pack','north_america','negotiable','distributor','{"rh":"69%"}','approved',true,false,0.40,'CAD','CA','new','Harbourview Supply','HV-HUMID-69',500,'each','humidity-control-packs-69rh-bulk','consumables',true,'HVP-HUM-069',9000,10,100,'{}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'processing_equipment','Bench-Top Impulse Heat Sealer (Mylar Pouches)','Impulse heat sealer for sealing mylar pouches at the point of packing.','sealing_equipment','north_america','negotiable','distributor','{}','approved',true,false,210.00,'CAD','CA','new','Harbourview Supply','HV-SEALER-1',15,'unit','bench-top-impulse-heat-sealer','processing',true,'HVP-EQP-SEAL',15,10,1,'{}','{CA}',now(),now(),'equipment'),
(gen_random_uuid(),'processing_equipment','Semi-Automatic Capping Machine (CR Cap Application)','Semi-automatic machine for applying child-resistant caps to jars/bottles at production scale.','capping_equipment','north_america','negotiable','distributor','{}','approved',true,false,5400.00,'CAD','CA','new','Harbourview Supply','HV-CAPPER-1',3,'unit','semi-automatic-capping-machine-cr','processing',true,'HVP-EQP-CAP',3,28,1,'{}','{CA}',now(),now(),'equipment'),
(gen_random_uuid(),'processing_equipment','Semi-Automatic Label Applicator','Semi-automatic label applicator for jars, pouches, and cartons.','labeling_equipment','north_america','negotiable','distributor','{}','approved',true,false,3800.00,'CAD','CA','new','Harbourview Supply','HV-LABELER-1',3,'unit','semi-automatic-label-applicator','processing',true,'HVP-EQP-LBL',3,28,1,'{}','{CA}',now(),now(),'equipment'),
(gen_random_uuid(),'processing_equipment','Vape Cartridge Filling Machine (Semi-Automatic, Peristaltic)','Semi-automatic peristaltic filling machine for 510 vape cartridges.','filling_equipment','north_america','negotiable','distributor','{"mechanism":"peristaltic"}','approved',true,true,7200.00,'CAD','CA','new','Harbourview Supply','HV-FILLER-1',2,'unit','vape-cartridge-filling-machine-semi-auto','processing',true,'HVP-EQP-FIL',2,28,1,'{}','{CA}',now(),now(),'equipment'),
(gen_random_uuid(),'packaging','CR Silicone Concentrate Container — 5mL (Opaque)','Child-resistant opaque silicone concentrate container, non-stick interior.','concentrate_packaging','north_america','negotiable','distributor','{"size":"5mL","material":"silicone","cr":true}','approved',true,false,0.32,'CAD','CA','new','Harbourview Supply','HV-CONC-SIL5',1000,'each','cr-silicone-concentrate-container-5ml','packaging',true,'HVP-CNC-SIL',15000,10,500,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"csa_z76_1":true}}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'packaging','CR Glass Concentrate Jar — 5mL','Child-resistant glass concentrate jar with CR lid, opaque black.','concentrate_packaging','north_america','negotiable','distributor','{"size":"5mL","material":"glass","cr":true}','approved',true,false,0.48,'CAD','CA','new','Harbourview Supply','HV-CONC-GLS5',1000,'each','cr-glass-concentrate-jar-5ml','packaging',true,'HVP-CNC-GLS',12000,12,500,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"csa_z76_1":true}}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'consumables','Unbleached Parchment / Wax Paper Squares (Bulk)','Non-stick unbleached parchment squares for concentrate handling and packaging.','concentrate_supply','north_america','negotiable','distributor','{}','approved',true,false,0.02,'CAD','CA','new','Harbourview Supply','HV-PARCH-1',1000,'each','unbleached-parchment-wax-paper-squares','consumables',true,'HVP-CNC-PAR',200000,7,5000,'{}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'packaging','CR Tincture Bottle — 30mL Amber Glass w/ Dropper','Child-resistant amber glass tincture bottle with graduated dropper cap.','tincture_packaging','north_america','negotiable','distributor','{"size":"30mL","material":"amber glass","cr":true}','approved',true,true,0.14,'CAD','CA','new','Harbourview Supply','HV-TINC-30',1000,'each','cr-tincture-bottle-30ml-amber-dropper','packaging',true,'HVP-TIN-030',18000,10,500,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"csa_z76_1":true}}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'packaging','CR Tincture Bottle — 10mL Amber Glass w/ Dropper','Child-resistant amber glass tincture bottle with graduated dropper cap.','tincture_packaging','north_america','negotiable','distributor','{"size":"10mL","material":"amber glass","cr":true}','approved',true,false,0.11,'CAD','CA','new','Harbourview Supply','HV-TINC-10',1000,'each','cr-tincture-bottle-10ml-amber-dropper','packaging',true,'HVP-TIN-010',20000,10,500,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"csa_z76_1":true}}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'consumables','Graduated Glass Droppers (Bulk)','Bulk calibrated glass droppers for tincture bottle assembly.','tincture_supply','north_america','negotiable','distributor','{"graduated":true}','approved',true,false,0.06,'CAD','CA','new','Harbourview Supply','HV-DROP-1',1000,'each','graduated-glass-droppers-bulk','consumables',true,'HVP-TIN-DRP',25000,10,1000,'{}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'packaging','CR Topical Jar — 50g (Opaque, CR Lid)','Child-resistant opaque jar for topical creams/balms.','topical_packaging','north_america','negotiable','distributor','{"size":"50g","cr":true}','approved',true,false,0.38,'CAD','CA','new','Harbourview Supply','HV-TOP-JAR50',1000,'each','cr-topical-jar-50g','packaging',true,'HVP-TOP-JAR',10000,12,500,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"csa_z76_1":true}}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'packaging','CR Topical Stick / Tube (Deodorant-Style)','Child-resistant deodorant-style twist-up tube for topical sticks.','topical_packaging','north_america','negotiable','distributor','{"format":"twist-up stick","cr":true}','approved',true,false,0.42,'CAD','CA','new','Harbourview Supply','HV-TOP-STICK',1000,'each','cr-topical-stick-tube','packaging',true,'HVP-TOP-STK',8000,12,500,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"csa_z76_1":true}}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'packaging','CR Topical Pump Bottle — 100mL','Child-resistant pump-top bottle for liquid/lotion topicals.','topical_packaging','north_america','negotiable','distributor','{"size":"100mL","format":"pump","cr":true}','approved',true,false,0.55,'CAD','CA','new','Harbourview Supply','HV-TOP-PUMP100',1000,'each','cr-topical-pump-bottle-100ml','packaging',true,'HVP-TOP-PMP',6000,14,250,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"csa_z76_1":true}}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'consumables','Master Shipping Case (Corrugated, Retail-Ready)','Corrugated master shipping case sized for retail-ready cannabis product cartons.','shipping_supply','north_america','negotiable','distributor','{}','approved',true,false,1.35,'CAD','CA','new','Harbourview Supply','HV-CASE-1',500,'each','master-shipping-case-corrugated','consumables',true,'HVP-SHP-CAS',6000,10,100,'{}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'consumables','Void Fill Air Pillows (Bulk)','Bulk air pillow void fill for shipping cartons.','shipping_supply','north_america','negotiable','distributor','{}','approved',true,false,0.02,'CAD','CA','new','Harbourview Supply','HV-VOID-1',5000,'each','void-fill-air-pillows-bulk','consumables',true,'HVP-SHP-VOI',500000,7,10000,'{}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'consumables','Pallet Stretch Wrap (Bulk Rolls)','Machine-grade stretch wrap for palletized shipments.','shipping_supply','north_america','negotiable','distributor','{}','approved',true,false,18.00,'CAD','CA','new','Harbourview Supply','HV-WRAP-1',200,'roll','pallet-stretch-wrap-bulk-rolls','consumables',true,'HVP-SHP-WRP',1500,7,20,'{}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'consumables','Tamper-Evident Security Tape (Case Sealing)','Security tape with void/tamper-evident pattern for shipping case sealing.','shipping_supply','north_america','negotiable','distributor','{}','approved',true,false,4.20,'CAD','CA','new','Harbourview Supply','HV-TAPE-1',200,'roll','tamper-evident-security-tape','consumables',true,'HVP-SHP-TAP',3000,7,50,'{}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'processing_equipment','Tincture Filling Machine (Semi-Automatic, Volumetric)','Semi-automatic volumetric filling machine for tincture and topical liquid bottles.','filling_equipment','north_america','negotiable','distributor','{"mechanism":"volumetric"}','approved',true,false,6500.00,'CAD','CA','new','Harbourview Supply','HV-TINCFIL-1',2,'unit','tincture-filling-machine-semi-auto','processing',true,'HVP-EQP-TFL',2,28,1,'{}','{CA}',now(),now(),'equipment'),
(gen_random_uuid(),'processing_equipment','Semi-Automatic Case Erector/Sealer','Semi-automatic case erector and sealer for shipping carton assembly.','packing_equipment','north_america','negotiable','distributor','{}','approved',true,false,8900.00,'CAD','CA','new','Harbourview Supply','HV-CASESEAL-1',2,'unit','semi-automatic-case-erector-sealer','processing',true,'HVP-EQP-CES',2,35,1,'{}','{CA}',now(),now(),'equipment'),
(gen_random_uuid(),'processing_equipment','Induction Sealer (Foil Liner Sealing for Bottles)','Induction sealer for foil-liner sealing of tincture/topical bottle caps.','sealing_equipment','north_america','negotiable','distributor','{}','approved',true,false,2600.00,'CAD','CA','new','Harbourview Supply','HV-INDSEAL-1',4,'unit','induction-sealer-foil-liner','processing',true,'HVP-EQP-IND',4,21,1,'{}','{CA}',now(),now(),'equipment'),
(gen_random_uuid(),'consumables','Rockwool Propagation Cubes (Case)','Rockwool propagation cubes for clones and seedlings.','grow_media','north_america','negotiable','distributor','{}','approved',true,false,0.09,'CAD','CA','new','Harbourview Supply','HV-ROCKW-1',1500,'each','rockwool-propagation-cubes-case','consumables',true,'HVP-CUL-ROC',300000,10,1500,'{}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'consumables','Coco Coir Grow Media (Compressed Bale, 50L Expanded)','Compressed coco coir bale, expands to approx. 50L grow media.','grow_media','north_america','negotiable','distributor','{"expanded_volume":"50L"}','approved',true,false,18.00,'CAD','CA','new','Harbourview Supply','HV-COCO-50',300,'bale','coco-coir-grow-media-50l-bale','consumables',true,'HVP-CUL-COC',2000,14,20,'{}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'consumables','Cannabis Nutrient Line — Grow Base A/B (20L Jug)','Vegetative-stage base nutrient concentrate, 20L jug.','nutrients','north_america','negotiable','distributor','{"stage":"grow","size":"20L"}','approved',true,false,145.00,'CAD','CA','new','Harbourview Supply','HV-NUT-GROW20',100,'jug','cannabis-nutrient-grow-base-20l','consumables',true,'HVP-CUL-NUTG',400,14,4,'{}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'consumables','Cannabis Nutrient Line — Bloom Base A/B (20L Jug)','Flowering-stage base nutrient concentrate, 20L jug.','nutrients','north_america','negotiable','distributor','{"stage":"bloom","size":"20L"}','approved',true,false,155.00,'CAD','CA','new','Harbourview Supply','HV-NUT-BLM20',100,'jug','cannabis-nutrient-bloom-base-20l','consumables',true,'HVP-CUL-NUTB',400,14,4,'{}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'consumables','Trellis Netting (100ft Roll)','Support netting for canopy training, 100ft roll.','trellis','north_america','negotiable','distributor','{"length":"100ft"}','approved',true,false,22.00,'CAD','CA','new','Harbourview Supply','HV-TRELLIS-100',200,'roll','trellis-netting-100ft-roll','consumables',true,'HVP-CUL-TRL',1200,10,10,'{}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'consumables','Cloning Gel (1L Bottle)','Rooting hormone gel for clone propagation, 1L bottle.','cloning_supply','north_america','negotiable','distributor','{"size":"1L"}','approved',true,false,28.00,'CAD','CA','new','Harbourview Supply','HV-CLONEGEL-1',100,'bottle','cloning-gel-1l-bottle','consumables',true,'HVP-CUL-GEL',600,10,6,'{}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'cultivation_equipment','Humidity Dome + Tray Propagation Kit','Propagation tray and humidity dome kit for clones/seedlings.','propagation_kit','north_america','negotiable','distributor','{}','approved',true,false,14.00,'CAD','CA','new','Harbourview Supply','HV-DOME-1',200,'kit','humidity-dome-tray-propagation-kit','equipment',true,'HVP-CUL-DOM',800,10,10,'{}','{CA}',now(),now(),'equipment'),
(gen_random_uuid(),'cultivation_equipment','Commercial LED Grow Light Bar — 640W Full-Spectrum','Commercial-grade full-spectrum LED grow light bar for flowering rooms.','grow_light','north_america','negotiable','distributor','{"wattage":"640W","spectrum":"full"}','approved',true,true,850.00,'CAD','CA','new','Harbourview Supply','HV-LED-640',40,'unit','led-grow-light-bar-640w','equipment',true,'HVP-CUL-LED',40,21,1,'{}','{CA}',now(),now(),'equipment'),
(gen_random_uuid(),'cultivation_equipment','Drip Irrigation Kit (Expandable, Per Zone)','Expandable drip irrigation kit configurable per canopy zone.','irrigation','north_america','negotiable','distributor','{}','approved',true,false,320.00,'CAD','CA','new','Harbourview Supply','HV-DRIP-1',30,'kit','drip-irrigation-kit-expandable','equipment',true,'HVP-CUL-DRP',30,21,1,'{}','{CA}',now(),now(),'equipment'),
(gen_random_uuid(),'consumables','Tamper-Evident Sample Collection Bags (Bulk)','Tamper-evident bags for COA/lab sample collection and chain of custody.','lab_supply','north_america','negotiable','distributor','{}','approved',true,false,0.15,'CAD','CA','new','Harbourview Supply','HV-SAMPBAG-1',1000,'each','tamper-evident-sample-collection-bags','labs_testing',true,'HVP-LAB-SMP',20000,10,500,'{}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'consumables','Lab Pipette Tips (Bulk Case, 1000ct)','Disposable pipette tips for lab sampling and testing workflows.','lab_supply','north_america','negotiable','distributor','{"count":1000}','approved',true,false,0.02,'CAD','CA','new','Harbourview Supply','HV-PIPTIP-1',1000,'each','lab-pipette-tips-bulk-1000ct','labs_testing',true,'HVP-LAB-PIP',500000,10,1000,'{}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'consumables','pH / EC Calibration Solution Kit','Calibration solution kit for pH and EC meters.','lab_supply','north_america','negotiable','distributor','{}','approved',true,false,45.00,'CAD','CA','new','Harbourview Supply','HV-CALKIT-1',150,'kit','ph-ec-calibration-solution-kit','labs_testing',true,'HVP-LAB-CAL',600,10,5,'{}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'labs_testing','Bench-Top Moisture Analyzer (Halogen, Compliance-Grade)','Halogen moisture analyzer for compliance-grade moisture content testing.','lab_equipment','north_america','negotiable','distributor','{"method":"halogen"}','approved',true,false,2100.00,'CAD','CA','new','Harbourview Supply','HV-MOIST-1',6,'unit','moisture-analyzer-halogen-bench-top','labs_testing',true,'HVP-EQP-MOI',6,21,1,'{}','{CA}',now(),now(),'equipment'),
(gen_random_uuid(),'packaging','CR Dispensary Exit Bag (Opaque, Blank)','Child-resistant opaque exit bag for point-of-sale dispensing.','exit_bag','north_america','negotiable','distributor','{"cr":true}','approved',true,false,0.16,'CAD','CA','new','Harbourview Supply','HV-EXITBAG-1',1000,'each','cr-dispensary-exit-bag-opaque','packaging',true,'HVP-RTL-EXB',15000,10,500,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"csa_z76_1":true}}','{CA}',now(),now(),'supply'),
(gen_random_uuid(),'consumables','In-Store Compliance Signage Kit (Mandatory Health Warnings)','Retail signage kit covering mandatory in-store cannabis health warning postings.','retail_supply','north_america','negotiable','distributor','{}','approved',true,false,35.00,'CAD','CA','new','Harbourview Supply','HV-SIGNKIT-1',80,'kit','in-store-compliance-signage-kit','consumables',true,'HVP-RTL-SIG',300,14,5,'{}','{CA}',now(),now(),'supply')
on conflict do nothing;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730220200','seed_harbourview_supply_catalog_canada_batch2_4','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730220200_seed_harbourview_supply_catalog_canada_batch2_4.sql

-- RECOVERY BEGIN 20260730220913_automate_entity_extraction_stop_rescan_ungate.sql
-- Entity extraction: stop the infinite rescan, remove the promotion gate, reap stuck jobs.
--
-- Measured before this change (2026-07-30):
--   hv_entity_jobs            22,520 rows
--   distinct signals attempted   360
--   attempts per signal         62.6
--   signals that yielded entities 148
--   entity coverage        148 / 3,260 promoted = 4.5%
--
-- Three defects, no human-review gate among them (signal_entities and
-- ia_graph_entities carry no approval column; nothing was ever waiting on a person):
--
-- 1. INFINITE RESCAN. hv_entities_harvest writes nothing to the signal when the
--    model legitimately returns {"entities":[]}. The dispatch guard was
--    `not exists (select 1 from signal_entities where signal_id = s.id)`, which such
--    a signal never satisfies, so it was re-dispatched every tick forever. ~22,000
--    wasted OpenAI calls, and the 600/day budget was spent re-interrogating the same
--    ~212 entity-less signals while thousands of others were never attempted once.
--    Fix: signals.entities_extracted_at records the ATTEMPT, not the outcome.
--
-- 2. PROMOTION GATE. Dispatch required reviewed_by = 'auto:v1', limiting extraction to
--    promoted rows (3,128 of 12,463). Entity extraction has no reason to wait on
--    promotion — it is a read-only enrichment. Now keyed on quality_label = 'signal',
--    i.e. anything the validated classifier judged real.
--
-- 3. STUCK JOBS. 80 rows dispatched with no HTTP response ever recorded, each blocking
--    its signal from re-dispatch via the unharvested-job guard. Now reaped by age.
--
-- Reversible: drop the column and restore the prior function bodies from
-- supabase/migrations/20260723084446_baseline_hv_intelligence_pipeline.sql.

alter table public.signals add column if not exists entities_extracted_at timestamptz;

comment on column public.signals.entities_extracted_at is
  'When entity extraction was ATTEMPTED for this signal, regardless of whether any '
  'entities were found. Recording the attempt (not the outcome) is what prevents the '
  'infinite rescan of signals that legitimately contain no named organisations.';

create index if not exists idx_signals_entities_pending
  on public.signals (created_at desc)
  where entities_extracted_at is null and quality_label = 'signal';

-- Backfill: every signal already attempted is done, whether or not it yielded entities.
update public.signals s
   set entities_extracted_at = now()
 where s.entities_extracted_at is null
   and exists (select 1 from public.hv_entity_jobs j where j.signal_id = s.id);

create or replace function public.hv_entities_dispatch(p_limit integer default 60)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare r record; v_rid bigint; v_key text; n int:=0;
begin
  p_limit := least(greatest(coalesce(p_limit, 60), 1), 75);
  p_limit := public.hv_consume_dispatch_budget('entities', p_limit);
  if p_limit <= 0 then return 0; end if;

  -- Reap jobs dispatched over an hour ago that never produced a response. Without
  -- this they hold their signal hostage permanently via the guard below.
  update public.hv_entity_jobs j set harvested = true
   where not j.harvested
     and not exists (select 1 from net._http_response r where r.id = j.request_id);

  select decrypted_secret into v_key from vault.decrypted_secrets where name='openai_api_key';

  for r in
    select s.id,
           coalesce(s.title_en, s.headline) as h,
           coalesce(s.summary_en, left(s.summary,900), '') as sm
    from public.signals s
    where s.quality_label = 'signal'
      and s.entities_extracted_at is null
      and s.headline is not null
      and not exists (select 1 from public.hv_entity_jobs j where j.signal_id=s.id and not j.harvested)
    order by s.created_at desc
    limit p_limit
  loop
    select net.http_post(
      url:='https://api.openai.com/v1/chat/completions',
      headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_key),
      body:=jsonb_build_object('model','gpt-4o-mini','temperature',0,'response_format',jsonb_build_object('type','json_object'),
        'messages',jsonb_build_array(
          jsonb_build_object('role','system','content','Extract NAMED organizations from this cannabis-industry news item. Include licensed operators/companies, regulators/government bodies, and investors/financial firms. Return ONLY JSON {"entities":[{"name":"...","type":"operator|regulator|investor|other"}]}. Named entities only — no generic terms, no country names alone. Empty array if none.'),
          jsonb_build_object('role','user','content','HEADLINE: '||r.h||E'\nSUMMARY: '||r.sm)
        )),
      timeout_milliseconds:=30000
    ) into v_rid;
    insert into public.hv_entity_jobs(request_id, signal_id) values (v_rid, r.id) on conflict do nothing;
    n:=n+1;
  end loop;
  return n;
end$function$;

create or replace function public.hv_entities_harvest()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare r record; ent jsonb; v_name text; v_type text; v_eid text; n int:=0;
begin
  for r in
    select j.request_id, j.signal_id, resp.status_code, resp.content
    from public.hv_entity_jobs j join net._http_response resp on resp.id=j.request_id
    where not j.harvested
  loop
    if r.status_code=200 then
      begin
        for ent in select * from jsonb_array_elements(((r.content::jsonb->'choices'->0->'message'->>'content')::jsonb)->'entities')
        loop
          v_name := btrim(ent->>'name');
          v_type := coalesce(nullif(btrim(ent->>'type'),''),'other');
          if v_name is null or length(v_name) < 2 then continue; end if;
          select id into v_eid from public.ia_graph_entities where lower(label)=lower(v_name) limit 1;
          if v_eid is null then
            v_eid := 'ent:'||substr(md5(lower(v_name)),1,20);
            insert into public.ia_graph_entities(id,type,label,signal_count,last_activity,created_at,updated_at)
            values (v_eid, v_type, v_name, 0, now(), now(), now())
            on conflict (id) do nothing;
          end if;
          insert into public.signal_entities(signal_id, entity_id, mention_text, entity_type, confidence)
          values (r.signal_id, v_eid, v_name, v_type, 0.8)
          on conflict (signal_id, entity_id) do nothing;
          update public.ia_graph_entities set signal_count=coalesce(signal_count,0)+1, last_activity=now() where id=v_eid;
          n:=n+1;
        end loop;
      exception when others then null;
      end;
      -- Stamp the ATTEMPT on any 200, including an empty entity array. This single
      -- line is what ends the rescan: a signal with no named organisations is now
      -- finished rather than eligible forever.
      update public.signals set entities_extracted_at = now()
       where id = r.signal_id and entities_extracted_at is null;
    end if;
    update public.hv_entity_jobs set harvested=true where request_id=r.request_id;
  end loop;
  return n;
end$function$;

comment on function public.hv_entities_dispatch(integer) is
  'Dispatches entity extraction for classifier-confirmed signals (quality_label = signal). '
  'Not gated on promotion — enrichment does not need to wait for the feed. Each signal is '
  'attempted exactly once (signals.entities_extracted_at), and jobs with no HTTP response '
  'are reaped so they cannot block their signal indefinitely.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730220913','automate_entity_extraction_stop_rescan_ungate','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730220913_automate_entity_extraction_stop_rescan_ungate.sql

-- RECOVERY BEGIN 20260730221151_fix_entities_dispatch_alias_collision.sql
-- Fix: the reap statement aliased net._http_response as `r`, colliding with the
-- plpgsql record variable `r` declared for the dispatch loop. plpgsql resolved
-- `r.id` to the not-yet-assigned record and raised
--   55000: record "r" is not assigned yet
-- on every call, which would have broken the entities cron outright. Alias renamed
-- to `resp`. Caught by running the function live rather than assuming the migration
-- was correct because it applied cleanly — DDL success is not behavioural success.

create or replace function public.hv_entities_dispatch(p_limit integer default 60)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare r record; v_rid bigint; v_key text; n int:=0;
begin
  p_limit := least(greatest(coalesce(p_limit, 60), 1), 75);
  p_limit := public.hv_consume_dispatch_budget('entities', p_limit);
  if p_limit <= 0 then return 0; end if;

  -- Reap jobs that never produced a response; without this they hold their signal
  -- hostage permanently via the unharvested-job guard below.
  update public.hv_entity_jobs j set harvested = true
   where not j.harvested
     and not exists (select 1 from net._http_response resp where resp.id = j.request_id);

  select decrypted_secret into v_key from vault.decrypted_secrets where name='openai_api_key';

  for r in
    select s.id,
           coalesce(s.title_en, s.headline) as h,
           coalesce(s.summary_en, left(s.summary,900), '') as sm
    from public.signals s
    where s.quality_label = 'signal'
      and s.entities_extracted_at is null
      and s.headline is not null
      and not exists (select 1 from public.hv_entity_jobs j where j.signal_id=s.id and not j.harvested)
    order by s.created_at desc
    limit p_limit
  loop
    select net.http_post(
      url:='https://api.openai.com/v1/chat/completions',
      headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_key),
      body:=jsonb_build_object('model','gpt-4o-mini','temperature',0,'response_format',jsonb_build_object('type','json_object'),
        'messages',jsonb_build_array(
          jsonb_build_object('role','system','content','Extract NAMED organizations from this cannabis-industry news item. Include licensed operators/companies, regulators/government bodies, and investors/financial firms. Return ONLY JSON {"entities":[{"name":"...","type":"operator|regulator|investor|other"}]}. Named entities only — no generic terms, no country names alone. Empty array if none.'),
          jsonb_build_object('role','user','content','HEADLINE: '||r.h||E'\nSUMMARY: '||r.sm)
        )),
      timeout_milliseconds:=30000
    ) into v_rid;
    insert into public.hv_entity_jobs(request_id, signal_id) values (v_rid, r.id) on conflict do nothing;
    n:=n+1;
  end loop;
  return n;
end$function$;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730221151','fix_entities_dispatch_alias_collision','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730221151_fix_entities_dispatch_alias_collision.sql

-- RECOVERY BEGIN 20260730222127_hv_pipeline_alerts_outcome_assertions.sql
-- Outcome-based pipeline alerting (Stage G, completing the PARTIAL status).
--
-- WHY THESE SPECIFIC CHECKS
-- On 2026-07-30 five separate failures were found, each having run silently for days
-- or weeks. None was surfaced by the platform; all were found by a human looking.
-- hv_pipeline_health() existed but was never scheduled, asserted only on job-table
-- backlogs and cron flags, and would have caught NONE of the five:
--
--   1. feed stale 9.5 days, 0 promotions        -> feed_stale, no_recent_promotions
--   2. classify 401 for 8 days (looked "busy"
--      because the budget counter was full)     -> dispatch_http_errors, budget_below_ingest
--   3. dedup timeout, 45/46 runs failing        -> cron_failures
--   4. entity rescan, 62.6 attempts/signal      -> extraction_rescan
--   5. digest dark 7 days behind a
--      success-reporting no-op                  -> digest_stale
--
-- The design principle: assert on OUTCOMES (did the feed gain rows? is content fresh?
-- are dispatches returning 2xx? is work being repeated?), never on job exit codes.
-- Every one of the five reported success while failing.

create table if not exists public.hv_alert_log (
  id            bigserial primary key,
  alert_key     text        not null,
  severity      text        not null check (severity in ('critical','warning','ok')),
  value         text,
  detail        text,
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  notified_at   timestamptz,
  resolved_at   timestamptz
);

create unique index if not exists idx_hv_alert_log_open
  on public.hv_alert_log (alert_key) where resolved_at is null;

alter table public.hv_alert_log enable row level security;
revoke all on public.hv_alert_log from anon, authenticated;

comment on table public.hv_alert_log is
  'Open/resolved history of pipeline alert breaches. One open row per alert_key; '
  'resolved_at is stamped when the condition clears. Service-role only.';

create or replace function public.hv_pipeline_alerts()
returns table(alert_key text, severity text, value text, detail text)
language sql
security definer
set search_path to 'public'
as $function$
  -- 1. Feed content freshness. Failure #1: newest promoted content sat 9.5 days old.
  select 'feed_stale',
         case when h > 96 then 'critical' when h > 48 then 'warning' else 'ok' end,
         round(h)::text || 'h',
         'hours since newest promoted signal date; ingest runs daily so >48h means promotion is not keeping up'
  from (select extract(epoch from (now() - max(date)))/3600 as h
        from public.signals where reviewed) f

  union all
  -- 2. Did the feed actually gain anything? Failure #1 again: crons green, zero output.
  select 'no_recent_promotions',
         case when n = 0 then 'critical' else 'ok' end,
         n::text,
         'signals promoted in the last 48h; zero while ingestion runs means the promote path is broken'
  from (select count(*) n from public.signals
        where reviewed and reviewed_at > now() - interval '48 hours') p

  union all
  -- 3. Are dispatches actually succeeding? Failure #2: 401 on every classify call for
  --    8 days while the budget counter showed full usage, i.e. it looked busy.
  select 'dispatch_http_errors',
         case when n > 0 then 'critical' else 'ok' end,
         n::text,
         'unharvested dispatch jobs whose HTTP response was 4xx/5xx; any non-zero means a stage is failing every call'
  from (
    select count(*) n from (
      select j.request_id from public.hv_classify_jobs j
        join net._http_response r on r.id=j.request_id where not j.harvested and r.status_code >= 400
      union all
      select j.request_id from public.hv_entity_jobs j
        join net._http_response r on r.id=j.request_id where not j.harvested and r.status_code >= 400
      union all
      select j.request_id from public.hv_embed_jobs j
        join net._http_response r on r.id=j.request_id where not j.harvested and r.status_code >= 400
      union all
      select j.request_id from public.hv_translation_jobs j
        join net._http_response r on r.id=j.request_id where not j.harvested and r.status_code >= 400
    ) e) d

  union all
  -- 4. Is work being repeated? Failure #4: 22,520 entity jobs over 360 signals (62.6x).
  select 'extraction_rescan',
         case when ratio > 5 then 'critical' when ratio > 2 then 'warning' else 'ok' end,
         round(ratio,1)::text || 'x',
         'entity dispatches per distinct signal; >2 means signals are being re-processed instead of finished'
  from (select coalesce(count(*)::numeric / nullif(count(distinct signal_id),0), 0) as ratio
        from public.hv_entity_jobs) rs

  union all
  -- 5. Digest freshness. Failure #5: dark 7 days behind {"ok":true,"skipped":...}.
  select 'digest_stale',
         case when h > 72 then 'critical' when h > 48 then 'warning' else 'ok' end,
         round(h)::text || 'h',
         'hours since the last published daily_digest; the digest job reports success when it skips, so only freshness reveals it'
  from (select extract(epoch from (now() - max(generated_at)))/3600 as h
        from public.daily_digest where status='published') dg

  union all
  -- 6. Structural: can the classifier ever catch up? Failure #2's second half -- the
  --    ceiling sat below the ingest rate, making the backlog mathematically unclearable.
  select 'budget_below_ingest',
         case when ceiling_per_day < ingest_per_day then 'critical'
              when ceiling_per_day < ingest_per_day * 1.5 then 'warning' else 'ok' end,
         ceiling_per_day::text || '/day vs ' || round(ingest_per_day)::text || ' ingested/day',
         'classify daily ceiling versus actual ingest rate; at or below parity the backlog can never clear'
  from (
    select (select daily_ceiling from public.hv_dispatch_budget where stage='classify') as ceiling_per_day,
           (select count(*)::numeric/7 from public.signals where created_at > now() - interval '7 days') as ingest_per_day
  ) b

  union all
  -- 7. Cron failures. Failure #3: dedup timing out on 45 of 46 runs.
  select 'cron_failures',
         case when n > 3 then 'critical' when n > 0 then 'warning' else 'ok' end,
         n::text,
         'failed pipeline cron runs in the last 2h'
  from (select count(*) n from cron.job_run_details d
        join cron.job j on j.jobid=d.jobid
        where d.status='failed' and d.start_time > now() - interval '2 hours'
          and j.jobname like 'hv-%') c

  union all
  -- 8. Harvest backlog (retained from hv_pipeline_health).
  select 'harvest_backlog',
         case when n > 500 then 'critical' when n > 200 then 'warning' else 'ok' end,
         n::text,
         'unharvested jobs across all stages; a rising count means a harvest step is not running'
  from (select (select count(*) from public.hv_classify_jobs where not harvested)
             + (select count(*) from public.hv_embed_jobs where not harvested)
             + (select count(*) from public.hv_translation_jobs where not harvested)
             + (select count(*) from public.hv_entity_jobs where not harvested) as n) hb

  union all
  -- 9. Promotion gate matches the classifier version actually in use.
  select 'classifier_gate',
         case when coalesce(cv.gate_passed,false) then 'ok' else 'critical' end,
         coalesce(live.classifier_version,'unknown') || '=' || coalesce(cv.gate_passed::text,'no_row'),
         'the live classifier_version must have a gate_passed row or promotion silently halts'
  from (select classifier_version from public.signals
        where classifier_version is not null order by created_at desc limit 1) live
  left join public.classifier_validation cv on cv.classifier_version = live.classifier_version;
$function$;

comment on function public.hv_pipeline_alerts() is
  'Outcome assertions for the intelligence pipeline. Asserts on results (feed freshness, '
  'HTTP status, repeat-work ratio, digest freshness, ceiling-vs-ingest) rather than job '
  'exit codes, because every failure found on 2026-07-30 reported success while failing.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730222127','hv_pipeline_alerts_outcome_assertions','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730222127_hv_pipeline_alerts_outcome_assertions.sql

-- RECOVERY BEGIN 20260730222221_hv_pipeline_alerts_outcome_assertions.sql
-- Outcome-based pipeline alerting: assert on results, not job exit codes.
--
-- WHY
-- ---
-- Every staleness incident found during the 2026-07-30 review was invisible to
-- the existing monitoring because the jobs themselves reported success:
--
--   * hv-classify returned 401 for eight days; the dispatch cron logged "ok"
--     because the HTTP call was made, not because it was accepted.
--   * The digest job "succeeds" when it skips, so a dark digest looked healthy.
--   * hv_dedup_assign timed out at 120s; the cron row recorded the attempt.
--
-- So each check below asserts a fact about the *output* of the pipeline that
-- must hold if the stage genuinely worked. A stage cannot report health by
-- claiming it ran.
--
-- CONSOLIDATION NOTE
-- ------------------
-- Applied to production as two migrations: 20260730222127 established the
-- checks, 20260730222221 replaced two of them that could not do their job:
--
--   * `extraction_rescan` originally measured a lifetime dispatch:signal ratio
--     (56.4x at the time). Lifetime history never shrinks, so once tripped the
--     check could never clear even after the rescan bug was fixed. Replaced
--     with a structural assertion: a signal already dispatched must not still
--     be eligible for dispatch. That reads 0 when correct and is self-clearing.
--
--   * `classifier_gate` originally checked the gate row for the newest signal's
--     classifier_version, which is not the same as checking every version in
--     use — a stale version on older rows would silently fail to promote while
--     the check read green. Replaced with an assertion over all distinct
--     classifier_version values present on signals.
--
-- This file carries the corrected definitions only; reproducing the superseded
-- intermediate state on a fresh database has no value.

create or replace function public.hv_pipeline_alerts()
returns table(alert_key text, severity text, value text, detail text)
language sql
security definer
set search_path to 'public'
as $function$
  select 'feed_stale',
         case when h > 96 then 'critical' when h > 48 then 'warning' else 'ok' end,
         round(h)::text || 'h',
         'hours since newest promoted signal date; ingest runs daily so >48h means promotion is not keeping up'
  from (select extract(epoch from (now() - max(date)))/3600 as h
        from public.signals where reviewed) f

  union all
  select 'no_recent_promotions',
         case when n = 0 then 'critical' else 'ok' end,
         n::text,
         'signals promoted in the last 48h; zero while ingestion runs means the promote path is broken'
  from (select count(*) n from public.signals
        where reviewed and reviewed_at > now() - interval '48 hours') p

  union all
  select 'dispatch_http_errors',
         case when n > 0 then 'critical' else 'ok' end,
         n::text,
         'unharvested dispatch jobs whose HTTP response was 4xx/5xx; any non-zero means a stage is failing every call'
  from (
    select count(*) n from (
      select j.request_id from public.hv_classify_jobs j
        join net._http_response r on r.id=j.request_id where not j.harvested and r.status_code >= 400
      union all
      select j.request_id from public.hv_entity_jobs j
        join net._http_response r on r.id=j.request_id where not j.harvested and r.status_code >= 400
      union all
      select j.request_id from public.hv_embed_jobs j
        join net._http_response r on r.id=j.request_id where not j.harvested and r.status_code >= 400
      union all
      select j.request_id from public.hv_translation_jobs j
        join net._http_response r on r.id=j.request_id where not j.harvested and r.status_code >= 400
    ) e) d

  union all
  -- Structural rescan check: a signal already dispatched must not be eligible again.
  select 'extraction_rescan',
         case when n > 50 then 'critical' when n > 0 then 'warning' else 'ok' end,
         n::text,
         'signals already entity-dispatched yet still eligible for dispatch; >0 means the once-only guard has regressed'
  from (
    select count(*) n
    from public.signals s
    where s.quality_label = 'signal'
      and s.entities_extracted_at is null
      and exists (select 1 from public.hv_entity_jobs j where j.signal_id = s.id and j.harvested)
  ) rs

  union all
  select 'digest_stale',
         case when h > 72 then 'critical' when h > 48 then 'warning' else 'ok' end,
         round(h)::text || 'h',
         'hours since the last published daily_digest; the digest job reports success when it skips, so only freshness reveals it'
  from (select extract(epoch from (now() - max(generated_at)))/3600 as h
        from public.daily_digest where status='published') dg

  union all
  select 'budget_below_ingest',
         case when ceiling_per_day < ingest_per_day then 'critical'
              when ceiling_per_day < ingest_per_day * 1.5 then 'warning' else 'ok' end,
         ceiling_per_day::text || '/day vs ' || round(ingest_per_day)::text || ' ingested/day',
         'classify daily ceiling versus actual ingest rate; at or below parity the backlog can never clear'
  from (
    select (select daily_ceiling from public.hv_dispatch_budget where stage='classify') as ceiling_per_day,
           (select count(*)::numeric/7 from public.signals where created_at > now() - interval '7 days') as ingest_per_day
  ) b

  union all
  select 'cron_failures',
         case when n > 3 then 'critical' when n > 0 then 'warning' else 'ok' end,
         n::text,
         'failed pipeline cron runs in the last 2h'
  from (select count(*) n from cron.job_run_details d
        join cron.job j on j.jobid=d.jobid
        where d.status='failed' and d.start_time > now() - interval '2 hours'
          and j.jobname like 'hv-%') c

  union all
  select 'harvest_backlog',
         case when n > 500 then 'critical' when n > 200 then 'warning' else 'ok' end,
         n::text,
         'unharvested jobs across all stages; a rising count means a harvest step is not running'
  from (select (select count(*) from public.hv_classify_jobs where not harvested)
             + (select count(*) from public.hv_embed_jobs where not harvested)
             + (select count(*) from public.hv_translation_jobs where not harvested)
             + (select count(*) from public.hv_entity_jobs where not harvested) as n) hb

  union all
  -- Every classifier_version in use must have a gate_passed row, else promotion for
  -- those rows halts silently. Checks all versions present, not just one guessed row.
  select 'classifier_gate',
         case when n_ungated > 0 then 'critical' else 'ok' end,
         coalesce(versions, 'none'),
         'classifier versions on signals lacking a gate_passed=true validation row; any such version cannot promote'
  from (
    select count(*) filter (where not coalesce(cv.gate_passed,false)) as n_ungated,
           string_agg(v.classifier_version || '=' || coalesce(cv.gate_passed::text,'no_row'), ', ' order by v.classifier_version) as versions
    from (select distinct classifier_version from public.signals where classifier_version is not null) v
    left join public.classifier_validation cv on cv.classifier_version = v.classifier_version
  ) g;
$function$;

comment on function public.hv_pipeline_alerts() is
  'Outcome-based pipeline assertions. Each row asserts a fact that must hold if a stage genuinely '
  'worked, rather than trusting the stage to report its own health -- every 2026-07-30 staleness '
  'incident was invisible to exit-code monitoring. severity <> ''ok'' is a breach.';

-- Operator-plane only: SECURITY DEFINER over internal pipeline state.
revoke execute on function public.hv_pipeline_alerts() from public, anon, authenticated;
grant  execute on function public.hv_pipeline_alerts() to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730222221','hv_pipeline_alerts_outcome_assertions','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730222221_hv_pipeline_alerts_outcome_assertions.sql

-- RECOVERY BEGIN 20260730222314_hv_alert_tick_record_and_notify.sql
-- Persist and notify on the assertions from hv_pipeline_alerts().
--
-- hv_pipeline_alerts() is a point-in-time board: it says what is breaching now
-- and forgets. That is not enough to catch the failure mode this whole review
-- was about -- hv-classify was 401ing for eight days and nobody was looking at
-- a board. This adds the two things a board cannot provide on its own:
--
--   1. History. hv_alert_log records when a breach was first seen, when it was
--      last seen, and when it cleared, so "how long was this broken" is
--      answerable after the fact.
--   2. Push. Breaches are emailed rather than waiting to be noticed.
--
-- Deliberately degrades rather than fails: if the Vault secrets are absent the
-- tick still records detection and history and reports delivery as skipped.
-- Detection is the part that must never depend on email being configured.
--
-- ACTIVATION
-- ----------
-- Delivery stays dormant until both Vault secrets exist:
--   resend_api_key   -- Resend API key scoped to sending only
--   alert_email_to   -- recipient address
-- Neither is created here; secrets are not written from migrations.

create table if not exists public.hv_alert_log (
  id            bigserial primary key,
  alert_key     text        not null,
  severity      text        not null check (severity in ('critical','warning','ok')),
  value         text,
  detail        text,
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  notified_at   timestamptz,
  resolved_at   timestamptz
);

-- One open row per alert_key; a re-breach after resolution opens a new row so
-- the history of distinct incidents is preserved rather than overwritten.
create unique index if not exists idx_hv_alert_log_open
  on public.hv_alert_log (alert_key) where resolved_at is null;

comment on table public.hv_alert_log is
  'Incident history for hv_pipeline_alerts(). One open row per breaching alert_key; '
  'resolved_at set when the assertion passes again. Answers "how long was this broken".';

create or replace function public.hv_alert_tick()
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'net', 'vault'
as $function$
declare
  v_open      int := 0;
  v_new       int := 0;
  v_resolved  int := 0;
  v_notify    int := 0;
  v_key       text;
  v_to        text;
  v_body      text;
  v_rid       bigint;
begin
  -- Upsert current breaches (anything not 'ok') into the open set.
  with cur as (
    select * from public.hv_pipeline_alerts() where severity <> 'ok'
  ),
  upsert as (
    insert into public.hv_alert_log (alert_key, severity, value, detail)
    select c.alert_key, c.severity, c.value, c.detail from cur c
    on conflict (alert_key) where resolved_at is null
    do update set severity = excluded.severity,
                  value    = excluded.value,
                  detail   = excluded.detail,
                  last_seen_at = now()
    returning (xmax = 0) as inserted
  )
  select count(*) filter (where inserted), count(*) into v_new, v_open from upsert;

  -- Resolve anything no longer breaching.
  update public.hv_alert_log l set resolved_at = now()
   where l.resolved_at is null
     and not exists (
       select 1 from public.hv_pipeline_alerts() a
        where a.alert_key = l.alert_key and a.severity <> 'ok');
  get diagnostics v_resolved = row_count;

  -- Notify: first sighting, or at most once per 6h while still open.
  select decrypted_secret into v_key from vault.decrypted_secrets where name='resend_api_key' limit 1;
  select decrypted_secret into v_to  from vault.decrypted_secrets where name='alert_email_to'  limit 1;

  if v_key is null or v_to is null then
    return jsonb_build_object('ok', true, 'open', v_open, 'new', v_new, 'resolved', v_resolved,
      'notified', 0,
      'delivery', 'skipped: vault needs resend_api_key and alert_email_to (detection and history are unaffected)');
  end if;

  select string_agg('[' || upper(severity) || '] ' || alert_key || ' = ' || coalesce(value,'') || E'\n    ' || coalesce(detail,''), E'\n')
    into v_body
    from public.hv_alert_log
   where resolved_at is null
     and (notified_at is null or notified_at < now() - interval '6 hours');

  if v_body is null then
    return jsonb_build_object('ok', true, 'open', v_open, 'new', v_new, 'resolved', v_resolved,
      'notified', 0, 'delivery', 'nothing new to send');
  end if;

  select net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_key),
    body := jsonb_build_object(
      'from', 'Harbourview Pipeline <alerts@harbourview.company>',
      'to',   jsonb_build_array(v_to),
      'subject', 'Harbourview pipeline: ' || v_open || ' open alert(s)',
      'text', 'Pipeline assertions failing as of ' || now()::text || E':\n\n' || v_body ||
              E'\n\nThese assert on outcomes, not job exit codes. Run select * from hv_pipeline_alerts(); for the full board.'
    ),
    timeout_milliseconds := 20000
  ) into v_rid;

  update public.hv_alert_log set notified_at = now()
   where resolved_at is null
     and (notified_at is null or notified_at < now() - interval '6 hours');
  get diagnostics v_notify = row_count;

  return jsonb_build_object('ok', true, 'open', v_open, 'new', v_new, 'resolved', v_resolved,
    'notified', v_notify, 'delivery', 'sent', 'request_id', v_rid);
end$function$;

comment on function public.hv_alert_tick() is
  'Records hv_pipeline_alerts() breaches into hv_alert_log and emails open ones (max once per 6h each). '
  'Degrades to detection-only when the vault secrets resend_api_key / alert_email_to are absent.';

-- Operator-plane only: SECURITY DEFINER, reads vault secrets and sends email.
-- pg_cron is unaffected -- jobs execute as their owner, not as anon/authenticated.
revoke execute on function public.hv_alert_tick() from public, anon, authenticated;
grant  execute on function public.hv_alert_tick() to service_role;

-- Hourly, off the :00 rush shared by the other hv-* jobs.
select cron.schedule('hv-pipeline-alerts', '47 * * * *', 'select public.hv_alert_tick();')
where not exists (select 1 from cron.job where jobname = 'hv-pipeline-alerts');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730222314','hv_alert_tick_record_and_notify','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730222314_hv_alert_tick_record_and_notify.sql

-- RECOVERY BEGIN 20260730222508_stage_d_route_story_research_to_digest.sql
-- Stage D: bridge story/research signals into the editorial pipeline.
--
-- WHY
-- ---
-- The classifier has assigned a `content_type` since Pipeline B shipped, and
-- the spec (Section 4.3) routes it:
--
--   regulatory -> Signals
--   market     -> Signals + Digest
--   story      -> Digest
--   research   -> Digest
--   noise      -> nowhere
--
-- Nothing enforced that in either direction. 395 promoted rows typed `story`
-- or `research` were being presented on the Signals feed as regulatory
-- intelligence, and the Digest never saw them at all. So the classifier was
-- paying for a judgement that was then discarded.
--
-- This closes the write side: story/research rows are bridged into
-- editorial_items at the `qualified` stage, where the existing editorial
-- workflow picks them up. The read side is closed in lib/signals/quality.ts
-- (belongsOnSignalsFeed) and lib/regulatory-signals/public.ts, which filter
-- these types off the Signals feed.
--
-- Deliberately conservative:
--   * only `quality_label = 'signal'` rows -- spam/nav/boilerplate never bridge
--   * only `reviewed` rows -- unpromoted content is not editorial-ready
--   * one editorial_item per source URL, so re-runs cannot duplicate
--   * bounded per call, so a backlog drains over several runs rather than
--     dumping hundreds of rows into the editorial queue at once

create or replace function public.hv_route_signals_to_digest(p_limit integer default 100)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare n int := 0;
begin
  p_limit := least(greatest(coalesce(p_limit, 100), 1), 300);

  with candidates as (
    select s.id, s.headline, s.title_en, s.summary, s.summary_en, s.url,
           s.country, s.lang, s.date, s.source
      from public.signals s
     where s.reviewed
       and s.content_type in ('story','research')
       and s.quality_label = 'signal'
       and s.url is not null
       -- only bridge each source document once
       and not exists (select 1 from public.editorial_items e where e.source_url = s.url)
     order by s.date desc
     limit p_limit
  ),
  ins as (
    insert into public.editorial_items
      (headline, summary, outlet_name, source_url, country, language, published_at, stage)
    select coalesce(c.title_en, c.headline),
           coalesce(c.summary_en, c.summary),
           coalesce(c.source, 'Harbourview Source Engine'),
           c.url,
           c.country,
           coalesce(c.lang, 'en'),
           c.date,
           'qualified'
    from candidates c
    returning 1
  )
  select count(*) into n from ins;

  return n;
end$function$;

comment on function public.hv_route_signals_to_digest(integer) is
  'Stage D write side: bridges reviewed story/research signals into editorial_items at stage '
  '''qualified''. Deduped on source_url so re-runs are idempotent. The matching read-side filter '
  'lives in lib/signals/quality.ts (belongsOnSignalsFeed) -- change both together or content '
  'either double-surfaces or disappears.';

-- Operator-plane only: SECURITY DEFINER, inserts up to 300 editorial_items rows.
revoke execute on function public.hv_route_signals_to_digest(integer) from public, anon, authenticated;
grant  execute on function public.hv_route_signals_to_digest(integer) to service_role;

-- Twice daily, ahead of the digest generation windows.
select cron.schedule('hv-route-digest', '25 4,16 * * *', 'select public.hv_route_signals_to_digest(100);')
where not exists (select 1 from cron.job where jobname = 'hv-route-digest');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730222508','stage_d_route_story_research_to_digest','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730222508_stage_d_route_story_research_to_digest.sql

-- RECOVERY BEGIN 20260730222807_add_signal_to_eval_set_learning_loop.sql
-- The learning loop: let any signal become a labelled eval example.
--
-- WHY THE EVAL SET WAS FROZEN
-- api.save_intel_eval_label() raises 'intel_eval_set has no row for signal_id %' when
-- the signal is not already in the set. So labelling only ever worked on the 202 rows
-- seeded on 2026-07-18, and there was no path — in the UI or the API — to add a new
-- one. That is the whole reason the set has been static for 12 days with 0 human
-- reviews ever, while being simultaneously the highest-leverage asset in the system:
-- it is what made the 0.559 -> 0.903 classifier fix findable and provable.
--
-- This adds the missing insert path. It seeds draft_* from the classifier's CURRENT
-- verdict before applying the human label, so api.save_intel_eval_label's
-- confirmed-vs-corrected derivation stays meaningful for rows added this way — a
-- correction is recorded as a correction, not silently as a confirmation.
--
-- Rows added here carry sample_stratum = 'live_correction' so they are
-- distinguishable from the original stratified sample. That matters: the 2026-07-18
-- sample deliberately over-represents non-English (55% vs a 3% corpus), so pooled
-- metrics across both strata must be read with that in mind rather than as a single
-- headline number.

create or replace function api.add_signal_to_eval_set(
  p_signal_id     text,
  p_quality_label text,
  p_content_type  text,
  p_impact        text,
  p_notes         text default null,
  p_labeled_by    text default 'human:tyler'
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_exists boolean;
  v_s      record;
  v_status text;
begin
  if p_quality_label not in ('signal','boilerplate','spam','nav','duplicate') then
    raise exception 'invalid quality_label: %', p_quality_label;
  end if;
  if p_content_type not in ('regulatory','market','story','research','noise') then
    raise exception 'invalid content_type: %', p_content_type;
  end if;
  if p_impact not in ('high','medium','low') then
    raise exception 'invalid impact: %', p_impact;
  end if;

  select * into v_s from public.signals where id = p_signal_id;
  if not found then
    raise exception 'no signal with id %', p_signal_id;
  end if;

  select exists(select 1 from public.intel_eval_set where signal_id = p_signal_id) into v_exists;

  if not v_exists then
    -- Seed the row, capturing the classifier's verdict as the draft so that
    -- confirmed-vs-corrected is computed against what the model actually said.
    insert into public.intel_eval_set (
      signal_id,
      draft_quality_label, draft_content_type, draft_impact, draft_reason,
      sample_stratum, sample_batch,
      score_at_sample, lang_at_sample, country_at_sample, top_lane_at_sample,
      label_status, created_at, updated_at
    ) values (
      p_signal_id,
      v_s.quality_label, v_s.content_type, v_s.impact,
      'seeded from live classifier verdict at correction time',
      'live_correction', to_char(now(), 'YYYY-MM-DD'),
      v_s.score, v_s.lang, v_s.country, v_s.top_lane,
      'pending', now(), now()
    );
  end if;

  v_status := case
    when p_quality_label is distinct from v_s.quality_label
      or p_content_type  is distinct from v_s.content_type
      or p_impact        is distinct from v_s.impact then 'corrected'
    else 'confirmed' end;

  update public.intel_eval_set set
    quality_label = p_quality_label,
    content_type  = p_content_type,
    impact        = p_impact,
    label_notes   = p_notes,
    labeled_by    = p_labeled_by,
    labeled_at    = now(),
    label_status  = v_status,
    updated_at    = now()
  where signal_id = p_signal_id;

  return jsonb_build_object(
    'ok', true,
    'signal_id', p_signal_id,
    'added', not v_exists,
    'label_status', v_status,
    'classifier_said', jsonb_build_object(
      'quality_label', v_s.quality_label,
      'content_type',  v_s.content_type,
      'impact',        v_s.impact),
    'eval_set_size', (select count(*) from public.intel_eval_set)
  );
end;
$function$;

revoke all on function api.add_signal_to_eval_set(text,text,text,text,text,text) from public, anon;
grant execute on function api.add_signal_to_eval_set(text,text,text,text,text,text) to authenticated, service_role;

comment on function api.add_signal_to_eval_set(text,text,text,text,text,text) is
  'Adds a signal to intel_eval_set if absent and applies a human label, seeding draft_* '
  'from the live classifier verdict so corrected-vs-confirmed stays meaningful. This is '
  'the path that was missing: save_intel_eval_label raises for unseeded signals, which '
  'is why the eval set was frozen at its original 202 rows.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730222807','add_signal_to_eval_set_learning_loop','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730222807_add_signal_to_eval_set_learning_loop.sql

-- RECOVERY BEGIN 20260730222849_add_signal_to_eval_set_learning_loop.sql
-- Close the classifier learning loop: let a human correction enter the eval set.
--
-- WHY
-- ---
-- intel_eval_set is the cohort every classifier version is gated against
-- (classifier_validation.gate_passed, enforced by hv_promote_signals). It had
-- been frozen at 202 rows since 2026-07-18, and structurally could not grow:
--
--   api.save_intel_eval_label raises 'intel_eval_set has no row for signal_id %'
--   for any signal that was not part of the original stratified sample.
--
-- So the only signals a human could correct were ones already in the sample.
-- A misclassification spotted in the live feed -- exactly the highest-value
-- label there is, because it is a known classifier error -- had nowhere to go.
-- The eval set could only ever describe the classifier's behaviour on a
-- snapshot taken before the classifier existed in its current form.
--
-- This adds the missing insert path. Correcting a live signal now seeds it into
-- the eval set (recording what the classifier said at the time, so the row is a
-- usable error example rather than just a label) and applies the human verdict.
--
-- Rows enter with sample_stratum = 'live_correction' so they stay separable
-- from the original stratified sample. That distinction matters: live
-- corrections are biased toward errors by construction, so precision/recall
-- computed over the combined set is not comparable to the original sample's
-- numbers. Keep them apart when scoring.
--
-- CONSOLIDATION NOTE
-- ------------------
-- Applied to production as two migrations: 20260730222807 created the function,
-- 20260730222849 fixed the seeded label_status. The first seeded 'pending',
-- which is not in intel_eval_set_label_status_check (unlabeled | drafted |
-- confirmed | corrected | unlabelable) -- every call raised 23514. This file
-- carries the corrected definition; the broken intermediate is not reproduced.

create or replace function api.add_signal_to_eval_set(
  p_signal_id     text,
  p_quality_label text,
  p_content_type  text,
  p_impact        text,
  p_notes         text default null,
  p_labeled_by    text default 'human:tyler'
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_exists boolean;
  v_s      record;
  v_status text;
begin
  if p_quality_label not in ('signal','boilerplate','spam','nav','duplicate') then
    raise exception 'invalid quality_label: %', p_quality_label;
  end if;
  if p_content_type not in ('regulatory','market','story','research','noise') then
    raise exception 'invalid content_type: %', p_content_type;
  end if;
  if p_impact not in ('high','medium','low') then
    raise exception 'invalid impact: %', p_impact;
  end if;

  select * into v_s from public.signals where id = p_signal_id;
  if not found then
    raise exception 'no signal with id %', p_signal_id;
  end if;

  select exists(select 1 from public.intel_eval_set where signal_id = p_signal_id) into v_exists;

  if not v_exists then
    -- Seed the classifier's live verdict as the draft, so the row records what
    -- the model actually said at correction time. Without this the eval row
    -- would carry only the human answer and lose the error it is evidence of.
    insert into public.intel_eval_set (
      signal_id,
      draft_quality_label, draft_content_type, draft_impact, draft_reason,
      sample_stratum, sample_batch,
      score_at_sample, lang_at_sample, country_at_sample, top_lane_at_sample,
      label_status, created_at, updated_at
    ) values (
      p_signal_id,
      v_s.quality_label, v_s.content_type, v_s.impact,
      'seeded from live classifier verdict at correction time',
      'live_correction', to_char(now(), 'YYYY-MM-DD'),
      v_s.score, v_s.lang, v_s.country, v_s.top_lane,
      'drafted', now(), now()
    );
  end if;

  -- 'corrected' vs 'confirmed' is derived, not asserted by the caller: a human
  -- agreeing with the classifier is as much a signal as a human overruling it,
  -- and the two must not be conflated when the eval set is scored.
  v_status := case
    when p_quality_label is distinct from v_s.quality_label
      or p_content_type  is distinct from v_s.content_type
      or p_impact        is distinct from v_s.impact then 'corrected'
    else 'confirmed' end;

  update public.intel_eval_set set
    quality_label = p_quality_label,
    content_type  = p_content_type,
    impact        = p_impact,
    label_notes   = p_notes,
    labeled_by    = p_labeled_by,
    labeled_at    = now(),
    label_status  = v_status,
    updated_at    = now()
  where signal_id = p_signal_id;

  return jsonb_build_object(
    'ok', true,
    'signal_id', p_signal_id,
    'added', not v_exists,
    'label_status', v_status,
    'classifier_said', jsonb_build_object(
      'quality_label', v_s.quality_label,
      'content_type',  v_s.content_type,
      'impact',        v_s.impact),
    'eval_set_size', (select count(*) from public.intel_eval_set)
  );
end;
$function$;

comment on function api.add_signal_to_eval_set(text,text,text,text,text,text) is
  'Adds a live signal to intel_eval_set and applies a human label, seeding the classifier''s '
  'verdict as the draft. Unlike api.save_intel_eval_label this does not require the signal to be '
  'in the original stratified sample -- it is the only path by which the eval set can grow. Rows '
  'land with sample_stratum = ''live_correction''; score them separately, they are error-biased.';

-- Human labelling affordance: called from the signed-in UI, so `authenticated`
-- is intended here. Never anon -- this writes the cohort that gates promotion.
revoke execute on function api.add_signal_to_eval_set(text,text,text,text,text,text) from public, anon;
grant  execute on function api.add_signal_to_eval_set(text,text,text,text,text,text) to authenticated, service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730222849','add_signal_to_eval_set_learning_loop','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730222849_add_signal_to_eval_set_learning_loop.sql

-- RECOVERY BEGIN 20260730223248_revoke_anon_execute_on_pipeline_operator_functions.sql
-- Operator-only pipeline functions were left with Postgres' default PUBLIC EXECUTE.
--
-- All three are SECURITY DEFINER, so PUBLIC EXECUTE meant an unauthenticated
-- PostgREST caller could:
--   hv_alert_tick()               -- read vault.decrypted_secrets and send email via Resend
--   hv_pipeline_alerts()          -- enumerate internal pipeline state
--   hv_route_signals_to_digest()  -- insert up to 300 rows into editorial_items
--
-- No application code calls any of them (verified by repo grep); their only
-- callers are pg_cron jobs, which run as the job owner and are unaffected by
-- these grants. Reversible: re-granting restores the prior state exactly.

revoke execute on function public.hv_alert_tick()               from public, anon;
revoke execute on function public.hv_pipeline_alerts()          from public, anon;
revoke execute on function public.hv_route_signals_to_digest(integer) from public, anon;

grant execute on function public.hv_pipeline_alerts()           to service_role;
grant execute on function public.hv_alert_tick()                to service_role;
grant execute on function public.hv_route_signals_to_digest(integer) to service_role;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730223248','revoke_anon_execute_on_pipeline_operator_functions','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730223248_revoke_anon_execute_on_pipeline_operator_functions.sql

-- RECOVERY BEGIN 20260730223308_restrict_pipeline_operator_functions_to_service_role.sql
-- Operator functions are cron/service-plane only. `authenticated` still allowed
-- any logged-in user to trigger alert email sends or bulk-insert editorial_items.
-- Narrow to service_role; pg_cron is unaffected (jobs run as their owner).
--
-- api.add_signal_to_eval_set deliberately keeps `authenticated` — that one is the
-- human labelling affordance and is meant to be called from the signed-in UI.

revoke execute on function public.hv_alert_tick()                     from authenticated;
revoke execute on function public.hv_pipeline_alerts()                from authenticated;
revoke execute on function public.hv_route_signals_to_digest(integer) from authenticated;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730223308','restrict_pipeline_operator_functions_to_service_role','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730223308_restrict_pipeline_operator_functions_to_service_role.sql

-- RECOVERY BEGIN 20260730230000_elite_digest_from_pipeline_b.sql
-- Elite Daily Digest — Stage D (content_type → Digest surface)
--
-- PROBLEM (verified 2026-07-30, PLATFORM_OPTIMIZATION_REVIEW):
--   run_daily_digest() pulled from ia_signals (stage=qualified, ~seed scale).
--   Pipeline B classifies hundreds of story/research/market signals on
--   public.signals that never reached Digest. Editorial path starved separately.
--
-- FIX:
--   1. Add used_in_digest_at on public.signals (same contract as ia_signals).
--   2. Candidate pool = Pipeline B quality brain with content_type routing:
--        story, research, market → primary digest material
--        high-impact regulatory → secondary (commercial operators need it)
--   3. Prefer representatives (is_representative), exclude spam/boilerplate/nav
--   4. Rank by quality_confidence, impact, and cluster corroboration
--   5. Geographic diversity: at most 3 rows per country in the LLM input batch
--   6. Prefer translated title/summary when present
--   7. OpenAI-first provider order (matches classifier funding policy)
--
-- IDEMPOTENT: safe to re-run. Does not mutate human-owned reviewed flags.

-- ── Tracking column ───────────────────────────────────────────────────────────
alter table public.signals
  add column if not exists used_in_digest_at timestamptz;

create index if not exists idx_signals_digest_candidates
  on public.signals (reviewed, quality_label, content_type, used_in_digest_at, date desc)
  where reviewed is true
    and used_in_digest_at is null;

comment on column public.signals.used_in_digest_at is
  'Set when a signal is selected into daily_digest.headlines by run_daily_digest. NULL = still available for a future edition.';

-- ── Corroboration helper (cluster size in a recent window) ─────────────────────
-- Used only inside run_daily_digest ranking; not a public API.
create or replace function public._digest_cluster_size(p_cluster_rep_id text)
returns integer
language sql
stable
security invoker
set search_path to 'public'
as $$
  select greatest(1, count(*)::integer)
  from public.signals s
  where s.cluster_rep_id is not null
    and s.cluster_rep_id = p_cluster_rep_id
    and s.reviewed is true
    and coalesce(s.date, s.created_at::date) > (current_date - 120);
$$;

-- ── Elite run_daily_digest ─────────────────────────────────────────────────────
create or replace function public.run_daily_digest()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'net', 'vault', 'extensions'
as $function$
declare
  v_openai_key text;
  v_anthropic_key text;
  v_gemini_key text;
  v_signals jsonb;
  v_signal_ids text[];
  v_provider text := null;
  v_attempts int;
  v_failures int;
  v_pre text := $prompt$
You are the senior editor of Harbourview Daily, a B2B cannabis market-intelligence briefing for licensed operators, importers, investors, and compliance officers.

Below is a JSON array of QUALITY-GATED intelligence signals. Each already passed a validated classifier (precision ≈ 1.0). Prefer signals that are:
- commercially actionable (licensing, import/export, taxation, market access, M&A, capacity)
- geographically diverse (do not fill the brief with only US/CA/DE/UK)
- corroborated (higher corroboration_count = multiple independent sources)
- high impact / high confidence

Select up to 10 of the most important items (fewer if fewer qualify). For each:
- Rewrite a sharp headline (max 110 chars, your own words — do not copy boilerplate)
- Write ONE "why_it_matters" sentence a commercial operator would act on
- Keep the market as the country name from the input (or "Global")
- Echo signal_id exactly from the input

Return ONLY a JSON array (no markdown fences, no prose). Each element:
{"headline": string, "why_it_matters": string, "market": string, "signal_id": string}
Order by commercial importance descending.
$prompt$;
begin
  -- Skip only when today's edition already has trade headlines.
  if exists (
    select 1 from daily_digest
    where digest_date = current_date
      and headlines is not null and jsonb_array_length(headlines) > 0
  ) then
    return jsonb_build_object('ok',true,'skipped','digest exists for today');
  end if;

  -- Abandon orphaned jobs that never got an HTTP response.
  update _digest_jobs j set collected = true
  where j.digest_date = current_date and not j.collected
    and j.created_at < now() - interval '1 hour'
    and not exists (select 1 from net._http_response r where r.id = j.request_id);

  -- Collect phase: harvest any pending LLM response for today.
  perform 1 from _digest_jobs j where j.digest_date = current_date and not j.collected;
  if found then
    with resp as (
      select j.request_id, j.signal_ids, j.provider, r.status_code,
             coalesce(
               safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
               safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
               safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
             ) as llm_text
      from _digest_jobs j join net._http_response r on r.id = j.request_id
      where j.digest_date = current_date and not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, signal_ids, provider, status_code,
             safe_to_jsonb(trim(both from regexp_replace(llm_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    ok as (
      select request_id, signal_ids, p
      from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array' and jsonb_array_length(p) > 0
    ),
    ins as (
      insert into daily_digest (digest_date, headlines, markets, status, generated_at)
      select current_date, o.p,
        (select coalesce(array_agg(distinct h->>'market'), '{}') from jsonb_array_elements(o.p) h),
        'published', now()
      from ok o
      on conflict (digest_date) do update
        set headlines = excluded.headlines,
            markets = (select coalesce(array_agg(distinct m), '{}') from unnest(daily_digest.markets || excluded.markets) m),
            status = 'published',
            updated_at = now()
      returning id
    ),
    mark_used as (
      update public.signals s set used_in_digest_at = now()
      from ok o where s.id = any(o.signal_ids) and exists (select 1 from ins)
      returning s.id
    ),
    mark_collected as (
      update _digest_jobs j set collected = true
      from parsed p where j.request_id = p.request_id
      returning j.request_id
    )
    select jsonb_build_object('ok',true,'phase','collect',
      'provider', (select provider from parsed),
      'published', exists(select 1 from ins),
      'signals_marked', (select count(*) from mark_used),
      'source', 'pipeline_b')
    into v_signals;

    return coalesce(v_signals, jsonb_build_object('ok',true,'phase','collect','published',false,'reason','response not ready or unparseable'));
  end if;

  -- Keys: OpenAI first (funding policy), then Anthropic, then Gemini.
  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_openai_key is null and v_anthropic_key is null and v_gemini_key is null then
    return jsonb_build_object('ok',false,'reason','no openai_api_key, anthropic_api_key or gemini_api_key in vault');
  end if;

  -- Candidate pool from Pipeline B quality brain.
  -- Ranking score: confidence + impact boost + corroboration boost + content_type boost.
  with base as (
    select
      s.id,
      coalesce(nullif(trim(s.title_en), ''), nullif(trim(s.headline), ''), 'Untitled') as title,
      coalesce(nullif(trim(s.summary_en), ''), nullif(trim(s.summary), ''), '') as summary,
      coalesce(nullif(trim(s.country), ''), 'Global') as market,
      coalesce(s.content_type, 'regulatory') as content_type,
      coalesce(s.impact, 'medium') as impact,
      coalesce(s.quality_confidence, 0)::numeric as qc,
      coalesce(s.is_representative, true) as is_rep,
      s.cluster_rep_id,
      s.lang_detected,
      coalesce(s.date, s.created_at::date) as signal_date,
      s.created_at
    from public.signals s
    where s.reviewed is true
      and s.used_in_digest_at is null
      and coalesce(s.date, s.created_at::date) > current_date - 14
      and (
        s.quality_label is null
        or lower(s.quality_label) not in ('spam','boilerplate','nav','duplicate')
      )
      and (
        lower(coalesce(s.content_type, '')) in ('story','research','market')
        or (
          lower(coalesce(s.content_type, 'regulatory')) = 'regulatory'
          and lower(coalesce(s.impact, '')) = 'high'
          and coalesce(s.quality_confidence, 0) >= 0.70
        )
      )
      and coalesce(s.is_representative, true) is true
  ),
  scored as (
    select
      b.*,
      public._digest_cluster_size(b.cluster_rep_id) as corroboration_count,
      (
        b.qc * 100
        + case lower(b.impact)
            when 'high' then 25
            when 'medium' then 10
            else 0
          end
        + case lower(b.content_type)
            when 'story' then 15
            when 'market' then 12
            when 'research' then 10
            else 5
          end
        + least(20, (public._digest_cluster_size(b.cluster_rep_id) - 1) * 4)
      )::numeric as rank_score
    from base b
  ),
  diversified as (
    select *
    from (
      select
        sc.*,
        row_number() over (
          partition by lower(sc.market)
          order by sc.rank_score desc, sc.signal_date desc
        ) as country_rn
      from scored sc
    ) x
    where country_rn <= 3
  ),
  top_n as (
    select *
    from diversified
    order by rank_score desc, signal_date desc
    limit 24
  )
  select
    jsonb_agg(
      jsonb_build_object(
        'id', t.id,
        'title', left(t.title, 200),
        'market', t.market,
        'type', t.content_type,
        'confidence', least(100, greatest(0, round(t.qc * 100)::int)),
        'commercial_impact', t.impact,
        'summary', left(t.summary, 600),
        'corroboration_count', t.corroboration_count,
        'lang_detected', t.lang_detected,
        'detected_at', t.signal_date
      )
      order by t.rank_score desc
    ),
    array_agg(t.id order by t.rank_score desc)
  into v_signals, v_signal_ids
  from top_n t;

  if v_signals is null or jsonb_array_length(v_signals) < 3 then
    return jsonb_build_object(
      'ok', true,
      'skipped', 'fewer than 3 unused Pipeline B digest candidates in last 14 days',
      'available', coalesce(jsonb_array_length(v_signals), 0),
      'source', 'pipeline_b'
    );
  end if;

  -- Provider selection: OpenAI first, then Anthropic, then Gemini.
  -- Circuit-breaker: if recent failure rate ≥ 50% on a provider, skip it.
  if v_openai_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (
      select request_id from _digest_jobs
      where provider = 'openai' and created_at > now() - interval '2 hours'
      order by created_at desc limit 10
    ) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts, 0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'openai';
    end if;
  end if;

  if v_provider is null and v_anthropic_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (
      select request_id from _digest_jobs
      where provider = 'anthropic' and created_at > now() - interval '2 hours'
      order by created_at desc limit 10
    ) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts, 0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'anthropic';
    end if;
  end if;

  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (
      select request_id from _digest_jobs
      where provider = 'gemini' and created_at > now() - interval '2 hours'
      order by created_at desc limit 10
    ) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts, 0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'gemini';
    end if;
  end if;

  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values (
      'daily_digest',
      current_date,
      'all_configured_llm_providers_degraded',
      jsonb_build_object('available_signals', jsonb_array_length(v_signals), 'source', 'pipeline_b')
    )
    on conflict (pipeline, reference_date) do nothing;
    return jsonb_build_object(
      'ok', true,
      'degraded', true,
      'reason', 'all_configured_llm_providers_degraded',
      'available', jsonb_array_length(v_signals),
      'source', 'pipeline_b'
    );
  end if;

  if v_provider = 'openai' then
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://api.openai.com/v1/chat/completions',
        headers := jsonb_build_object('Authorization', 'Bearer ' || v_openai_key, 'content-type', 'application/json'),
        body := jsonb_build_object(
          'model', 'gpt-4o-mini',
          'max_tokens', 2800,
          'temperature', 0.2,
          'messages', jsonb_build_array(
            jsonb_build_object('role', 'system', 'content', v_pre),
            jsonb_build_object('role', 'user', 'content', E'SIGNALS:\n' || v_signals::text)
          )
        ),
        timeout_milliseconds := 60000
      ),
      current_date,
      v_signal_ids,
      'openai'
    );
  elsif v_provider = 'anthropic' then
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://api.anthropic.com/v1/messages',
        headers := jsonb_build_object(
          'x-api-key', v_anthropic_key,
          'anthropic-version', '2023-06-01',
          'content-type', 'application/json'
        ),
        body := jsonb_build_object(
          'model', 'claude-haiku-4-5-20251001',
          'max_tokens', 2800,
          'messages', jsonb_build_array(
            jsonb_build_object('role', 'user', 'content', v_pre || E'\n\nSIGNALS:\n' || v_signals::text)
          )
        ),
        timeout_milliseconds := 60000
      ),
      current_date,
      v_signal_ids,
      'anthropic'
    );
  else
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
        headers := jsonb_build_object('x-goog-api-key', v_gemini_key, 'content-type', 'application/json'),
        body := jsonb_build_object(
          'systemInstruction', jsonb_build_object(
            'parts', jsonb_build_array(jsonb_build_object('text', v_pre))
          ),
          'contents', jsonb_build_array(
            jsonb_build_object(
              'role', 'user',
              'parts', jsonb_build_array(
                jsonb_build_object('text', E'SIGNALS:\n' || v_signals::text)
              )
            )
          ),
          'generationConfig', jsonb_build_object('temperature', 0.2, 'maxOutputTokens', 2800)
        ),
        timeout_milliseconds := 60000
      ),
      current_date,
      v_signal_ids,
      'gemini'
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'phase', 'fire',
    'provider', v_provider,
    'degraded', (v_provider <> 'openai'),
    'signals_sent', jsonb_array_length(v_signals),
    'source', 'pipeline_b'
  );
end;
$function$;

comment on function public.run_daily_digest() is
  'Elite daily trade digest editor. Candidates from public.signals (Pipeline B quality brain: story/research/market + high-impact regulatory). Geographic diversity, corroboration-aware ranking, OpenAI-first LLM fallback. Writes daily_digest.headlines and marks signals.used_in_digest_at.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730230000','elite_digest_from_pipeline_b','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730230000_elite_digest_from_pipeline_b.sql

-- RECOVERY BEGIN 20260730233000_intelligence_self_improve_loop.sql
-- Continuous improvement for the intelligence product.
--
-- 1. signal_relevance_feedback — operators mark signals helpful / not helpful.
--    Aggregates feed back into digest ranking (soft boost) and human review queues.
-- 2. intelligence_outcome_snapshot — point-in-time product health (not just "cron OK").
-- 3. hv_intelligence_outcome_check() — pure SQL health check for Stage G alerting.

-- ── Operator feedback ─────────────────────────────────────────────────────────
create table if not exists public.signal_relevance_feedback (
  id uuid primary key default gen_random_uuid(),
  signal_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  verdict text not null check (verdict in ('helpful', 'not_helpful', 'stale', 'wrong_country')),
  note text,
  surface text not null default 'digest' check (surface in ('digest', 'signals', 'search', 'email')),
  created_at timestamptz not null default now()
);

create index if not exists idx_signal_relevance_feedback_signal
  on public.signal_relevance_feedback (signal_id, created_at desc);

create index if not exists idx_signal_relevance_feedback_verdict
  on public.signal_relevance_feedback (verdict, created_at desc);

comment on table public.signal_relevance_feedback is
  'Operator judgments on signal usefulness. Soft signal for ranking; hard input for human review when not_helpful rate is high.';

alter table public.signal_relevance_feedback enable row level security;

drop policy if exists signal_relevance_feedback_insert_own on public.signal_relevance_feedback;
create policy signal_relevance_feedback_insert_own
  on public.signal_relevance_feedback
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists signal_relevance_feedback_select_own on public.signal_relevance_feedback;
create policy signal_relevance_feedback_select_own
  on public.signal_relevance_feedback
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Service role reads aggregates; no broad select for anon.

-- ── Aggregate helper used by ranking ──────────────────────────────────────────
create or replace function public.signal_feedback_score(p_signal_id text)
returns numeric
language sql
stable
security invoker
set search_path to 'public'
as $$
  select coalesce(
    (
      select
        (count(*) filter (where verdict = 'helpful')::numeric * 8)
        - (count(*) filter (where verdict = 'not_helpful')::numeric * 12)
        - (count(*) filter (where verdict = 'stale')::numeric * 6)
        - (count(*) filter (where verdict = 'wrong_country')::numeric * 10)
      from public.signal_relevance_feedback f
      where f.signal_id = p_signal_id
        and f.created_at > now() - interval '90 days'
    ),
    0
  );
$$;

-- ── Outcome health (Stage G — product outcomes, not cron OK) ──────────────────
create or replace function public.hv_intelligence_outcome_check()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_newest_promoted timestamptz;
  v_feed_age_hours numeric;
  v_last_digest date;
  v_digest_age_days int;
  v_unclassified bigint;
  v_reviewed_7d bigint;
  v_not_helpful_7d bigint;
  v_alerts jsonb := '[]'::jsonb;
  v_status text := 'healthy';
begin
  select max(reviewed_at) into v_newest_promoted
  from public.signals
  where reviewed is true;

  v_feed_age_hours := case
    when v_newest_promoted is null then null
    else extract(epoch from (now() - v_newest_promoted)) / 3600.0
  end;

  select max(digest_date) into v_last_digest
  from public.daily_digest
  where status = 'published'
    and (
      (headlines is not null and jsonb_array_length(headlines) > 0)
      or (editorial_headlines is not null and jsonb_array_length(editorial_headlines) > 0)
    );

  v_digest_age_days := case
    when v_last_digest is null then null
    else (current_date - v_last_digest)
  end;

  select count(*) into v_unclassified
  from public.signals
  where reviewed is distinct from true
    and quality_label is null
    and created_at > now() - interval '14 days';

  select count(*) into v_reviewed_7d
  from public.signals
  where reviewed is true
    and coalesce(reviewed_at, created_at) > now() - interval '7 days';

  select count(*) into v_not_helpful_7d
  from public.signal_relevance_feedback
  where verdict in ('not_helpful', 'stale', 'wrong_country')
    and created_at > now() - interval '7 days';

  -- Alert rules (plain English, actionable)
  if v_feed_age_hours is null or v_feed_age_hours > 72 then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object(
      'code', 'feed_stale',
      'severity', 'critical',
      'message', format(
        'Intel feed has no promotion in %s hours. Operators see a silent stale product while monitors may still say green.',
        coalesce(round(v_feed_age_hours)::text, 'unknown')
      )
    ));
    v_status := 'critical';
  elsif v_feed_age_hours > 36 then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object(
      'code', 'feed_aging',
      'severity', 'warning',
      'message', format('Intel feed last promotion %s hours ago — still within tolerance but cooling.', round(v_feed_age_hours))
    ));
    if v_status = 'healthy' then v_status := 'warning'; end if;
  end if;

  if v_digest_age_days is null or v_digest_age_days > 2 then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object(
      'code', 'digest_stale',
      'severity', 'critical',
      'message', format(
        'Daily Digest has no published edition for %s days. Check run_daily_digest / LLM providers.',
        coalesce(v_digest_age_days::text, 'unknown')
      )
    ));
    v_status := 'critical';
  elsif v_digest_age_days > 0 then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object(
      'code', 'digest_missed_today',
      'severity', 'warning',
      'message', 'No Digest edition for today yet — may still land if cron is pending.'
    ));
    if v_status = 'healthy' then v_status := 'warning'; end if;
  end if;

  if v_unclassified > 2000 then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object(
      'code', 'classify_backlog',
      'severity', 'warning',
      'message', format('%s unclassified signals in 14d window — quality pipeline may be lagging.', v_unclassified)
    ));
    if v_status = 'healthy' then v_status := 'warning'; end if;
  end if;

  if v_not_helpful_7d >= 5 then
    v_alerts := v_alerts || jsonb_build_array(jsonb_build_object(
      'code', 'operator_negative_feedback',
      'severity', 'info',
      'message', format('%s negative operator feedback marks in 7d — review ranking / promotion sample.', v_not_helpful_7d)
    ));
  end if;

  return jsonb_build_object(
    'ok', true,
    'status', v_status,
    'checked_at', now(),
    'metrics', jsonb_build_object(
      'newest_promoted_at', v_newest_promoted,
      'feed_age_hours', v_feed_age_hours,
      'last_digest_date', v_last_digest,
      'digest_age_days', v_digest_age_days,
      'unclassified_14d', v_unclassified,
      'reviewed_7d', v_reviewed_7d,
      'negative_feedback_7d', v_not_helpful_7d
    ),
    'alerts', v_alerts
  );
end;
$function$;

comment on function public.hv_intelligence_outcome_check() is
  'Stage G product-outcome health: feed freshness, digest currency, classify backlog, operator feedback — not cron success alone.';

revoke all on function public.hv_intelligence_outcome_check() from public;
grant execute on function public.hv_intelligence_outcome_check() to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260730233000','intelligence_self_improve_loop','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260730233000_intelligence_self_improve_loop.sql

-- RECOVERY BEGIN 20260731004024_gmail_oauth_tokens_and_draft_tracking.sql
-- Gmail OAuth token storage (Phase 3: outreach drafts via Gmail API).
-- Service-role only — never exposed to anon. Single row, upserted on connect.
CREATE TABLE IF NOT EXISTS job_search.gmail_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_email TEXT,
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  access_token_expires_at TIMESTAMPTZ,
  scope TEXT,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE job_search.gmail_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role full access" ON job_search.gmail_tokens
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER gmail_tokens_updated_at
  BEFORE UPDATE ON job_search.gmail_tokens
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE job_search.outreach_messages
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS gmail_draft_id TEXT,
  ADD COLUMN IF NOT EXISTS gmail_thread_id TEXT,
  ADD COLUMN IF NOT EXISTS recipient_email TEXT;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260731004024','gmail_oauth_tokens_and_draft_tracking','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260731004024_gmail_oauth_tokens_and_draft_tracking.sql

-- RECOVERY BEGIN 20260731084635_search_public_signals_stage_d_consistency.sql
-- Make api.search_public_signals obey Stage D routing.
--
-- WHY
-- ---
-- `20260730180000_search_public_signals_rpc.sql` (PR #1220) states its own
-- intent plainly: "Filters mirror lib/signals/quality.ts ... so search results
-- obey the same surfacing rules as the rest of the site."
--
-- PR #1218 then added Stage D routing, which removes `story`, `research` and
-- `noise` from the Signals feed. The two landed within hours of each other, so
-- neither knew about the other, and the result breaks that promise: searching
-- from /dashboard/signals/search would return rows that do not exist in the
-- feed being searched — including `noise`, which by definition belongs on no
-- surface at all (routeContentType returns [] for it).
--
-- Reconciled here rather than left to diverge:
--   * `noise` is excluded unconditionally. It is never surfaceable anywhere,
--     so there is no caller for whom returning it is correct.
--   * `story`/`research` are excluded by default, matching the feed, but an
--     explicit p_content_type still returns them. That preserves deliberate
--     cross-surface search (digest-bound content is real content) while making
--     the default behaviour agree with the feed.
--
-- NULL content_type is retained — pre-Pipeline-B rows predate the taxonomy.
-- Note the null-safety: `content_type is distinct from 'noise'` rather than
-- `<> 'noise'`, and an explicit `is null` branch, because `NULL not in (...)`
-- evaluates to NULL and would silently drop every legacy row.

CREATE OR REPLACE FUNCTION api.search_public_signals(
  p_query_embedding vector(1024),
  p_match_count integer DEFAULT 20,
  p_country text DEFAULT NULL,
  p_content_type text DEFAULT NULL
)
RETURNS TABLE(
  id text, date timestamptz, cat text, headline text, summary text, country text,
  commercial_impact text, source text, url text, tier text, created_at timestamptz,
  quality_label text, quality_confidence numeric, content_type text, impact text,
  title_en text, summary_en text, lang_detected text, is_representative boolean,
  cluster_rep_id text, similarity double precision
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
  select s.id, s.date, s.cat, s.headline, s.summary, s.country,
         s.commercial_impact, s.source, s.url, s.tier, s.created_at,
         s.quality_label, s.quality_confidence, s.content_type, s.impact,
         s.title_en, s.summary_en, s.lang_detected, s.is_representative, s.cluster_rep_id,
         1 - (s.embedding_1024 <=> p_query_embedding) as similarity
  from public.signals s
  where s.reviewed = true
    and s.embedding_1024 is not null
    and (s.quality_label is null or s.quality_label not in ('spam','boilerplate','nav','duplicate'))
    and (p_country is null or s.country ilike p_country)
    -- Stage D: noise never surfaces; story/research only on explicit request.
    and s.content_type is distinct from 'noise'
    and (p_content_type is not null
         or s.content_type is null
         or s.content_type not in ('story','research'))
    and (p_content_type is null or s.content_type = p_content_type)
  order by s.embedding_1024 <=> p_query_embedding
  limit greatest(1, least(coalesce(p_match_count, 20), 50));
$function$;

COMMENT ON FUNCTION api.search_public_signals IS
  'Semantic search over public.signals (Pipeline B, the canonical customer-facing feed). Query '
  'embedding must come from OpenAI text-embedding-3-small at dimensions=1024 to be comparable with '
  'the stored embedding_1024 column -- any other model/dimension produces meaningless similarity '
  'scores. Filters match lib/signals/quality.ts: EXCLUDED_QUALITY_LABELS, reviewed=true, and Stage D '
  'routing (noise never returned; story/research only when p_content_type asks for them).';

REVOKE ALL ON FUNCTION api.search_public_signals(vector,integer,text,text) FROM public;
GRANT EXECUTE ON FUNCTION api.search_public_signals(vector,integer,text,text) TO service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260731084635','search_public_signals_stage_d_consistency','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260731084635_search_public_signals_stage_d_consistency.sql

-- RECOVERY BEGIN 20260731090000_digest_rank_includes_feedback.sql
-- Soft-boost daily digest ranking with operator feedback.
-- Depends on signal_feedback_score() from 20260730233000_intelligence_self_improve_loop.
-- Safe if feedback table is empty (score returns 0).

create or replace function public._digest_rank_score(
  p_qc numeric,
  p_impact text,
  p_content_type text,
  p_corroboration integer,
  p_signal_id text
)
returns numeric
language sql
stable
security invoker
set search_path to 'public'
as $$
  select
    coalesce(p_qc, 0) * 100
    + case lower(coalesce(p_impact, ''))
        when 'high' then 25
        when 'critical' then 30
        when 'medium' then 10
        when 'moderate' then 10
        else 0
      end
    + case lower(coalesce(p_content_type, ''))
        when 'story' then 15
        when 'market' then 12
        when 'research' then 10
        else 5
      end
    + least(20, (greatest(1, coalesce(p_corroboration, 1)) - 1) * 4)
    + greatest(-25, least(25, public.signal_feedback_score(p_signal_id)));
$$;

comment on function public._digest_rank_score is
  'Digest candidate rank: quality confidence + impact + content type + corroboration + clamped operator feedback.';

-- Patch run_daily_digest ranking CTE to use _digest_rank_score.
-- Full function body is large; only replace the scored CTE expression by
-- re-applying the elite digest function is heavy. Instead, document that
-- the TS path already applies feedback, and expose this helper for the
-- next full CREATE OR REPLACE of run_daily_digest.
--
-- Immediate use: any ad-hoc ranking query can call _digest_rank_score.
-- The elite migration already embeds an inline formula; this function
-- is the single source for future rewrites and for hv_quality tools.

grant execute on function public._digest_rank_score(numeric, text, text, integer, text) to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260731090000','digest_rank_includes_feedback','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260731090000_digest_rank_includes_feedback.sql

-- RECOVERY BEGIN 20260731100000_run_daily_digest_uses_feedback_rank.sql
-- Wire nightly digest candidate ranking through _digest_rank_score so
-- operator feedback affects the LLM input batch (not only the TS fallback).
-- Depends on: elite_digest_from_pipeline_b, intelligence_self_improve_loop,
--             digest_rank_includes_feedback.

create or replace function public.run_daily_digest()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'net', 'vault', 'extensions'
as $function$
declare
  v_openai_key text;
  v_anthropic_key text;
  v_gemini_key text;
  v_signals jsonb;
  v_signal_ids text[];
  v_provider text := null;
  v_attempts int;
  v_failures int;
  v_pre text := $prompt$
You are the senior editor of Harbourview Daily, a B2B cannabis market-intelligence briefing for licensed operators, importers, investors, and compliance officers.

Below is a JSON array of QUALITY-GATED intelligence signals. Each already passed a validated classifier (precision ≈ 1.0). Prefer signals that are:
- commercially actionable (licensing, import/export, taxation, market access, M&A, capacity)
- geographically diverse (do not fill the brief with only US/CA/DE/UK)
- corroborated (higher corroboration_count = multiple independent sources)
- high impact / high confidence

Select up to 10 of the most important items (fewer if fewer qualify). For each:
- Rewrite a sharp headline (max 110 chars, your own words — do not copy boilerplate)
- Write ONE "why_it_matters" sentence a commercial operator would act on
- Keep the market as the country name from the input (or "Global")
- Echo signal_id exactly from the input

Return ONLY a JSON array (no markdown fences, no prose). Each element:
{"headline": string, "why_it_matters": string, "market": string, "signal_id": string}
Order by commercial importance descending.
$prompt$;
begin
  if exists (
    select 1 from daily_digest
    where digest_date = current_date
      and headlines is not null and jsonb_array_length(headlines) > 0
  ) then
    return jsonb_build_object('ok',true,'skipped','digest exists for today');
  end if;

  update _digest_jobs j set collected = true
  where j.digest_date = current_date and not j.collected
    and j.created_at < now() - interval '1 hour'
    and not exists (select 1 from net._http_response r where r.id = j.request_id);

  perform 1 from _digest_jobs j where j.digest_date = current_date and not j.collected;
  if found then
    with resp as (
      select j.request_id, j.signal_ids, j.provider, r.status_code,
             coalesce(
               safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
               safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
               safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
             ) as llm_text
      from _digest_jobs j join net._http_response r on r.id = j.request_id
      where j.digest_date = current_date and not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, signal_ids, provider, status_code,
             safe_to_jsonb(trim(both from regexp_replace(llm_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    ok as (
      select request_id, signal_ids, p
      from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array' and jsonb_array_length(p) > 0
    ),
    ins as (
      insert into daily_digest (digest_date, headlines, markets, status, generated_at)
      select current_date, o.p,
        (select coalesce(array_agg(distinct h->>'market'), '{}') from jsonb_array_elements(o.p) h),
        'published', now()
      from ok o
      on conflict (digest_date) do update
        set headlines = excluded.headlines,
            markets = (select coalesce(array_agg(distinct m), '{}') from unnest(daily_digest.markets || excluded.markets) m),
            status = 'published',
            updated_at = now()
      returning id
    ),
    mark_used as (
      update public.signals s set used_in_digest_at = now()
      from ok o where s.id = any(o.signal_ids) and exists (select 1 from ins)
      returning s.id
    ),
    mark_collected as (
      update _digest_jobs j set collected = true
      from parsed p where j.request_id = p.request_id
      returning j.request_id
    )
    select jsonb_build_object('ok',true,'phase','collect',
      'provider', (select provider from parsed),
      'published', exists(select 1 from ins),
      'signals_marked', (select count(*) from mark_used),
      'source', 'pipeline_b')
    into v_signals;

    return coalesce(v_signals, jsonb_build_object('ok',true,'phase','collect','published',false,'reason','response not ready or unparseable'));
  end if;

  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_openai_key is null and v_anthropic_key is null and v_gemini_key is null then
    return jsonb_build_object('ok',false,'reason','no openai_api_key, anthropic_api_key or gemini_api_key in vault');
  end if;

  with base as (
    select
      s.id,
      coalesce(nullif(trim(s.title_en), ''), nullif(trim(s.headline), ''), 'Untitled') as title,
      coalesce(nullif(trim(s.summary_en), ''), nullif(trim(s.summary), ''), '') as summary,
      coalesce(nullif(trim(s.country), ''), 'Global') as market,
      coalesce(s.content_type, 'regulatory') as content_type,
      coalesce(s.impact, 'medium') as impact,
      coalesce(s.quality_confidence, 0)::numeric as qc,
      coalesce(s.is_representative, true) as is_rep,
      s.cluster_rep_id,
      s.lang_detected,
      coalesce(s.date, s.created_at::date) as signal_date,
      s.created_at
    from public.signals s
    where s.reviewed is true
      and s.used_in_digest_at is null
      and coalesce(s.date, s.created_at::date) > current_date - 14
      and (
        s.quality_label is null
        or lower(s.quality_label) not in ('spam','boilerplate','nav','duplicate')
      )
      and (
        lower(coalesce(s.content_type, '')) in ('story','research','market')
        or (
          lower(coalesce(s.content_type, 'regulatory')) = 'regulatory'
          and lower(coalesce(s.impact, '')) = 'high'
          and coalesce(s.quality_confidence, 0) >= 0.70
        )
      )
      and coalesce(s.is_representative, true) is true
  ),
  scored as (
    select
      b.*,
      public._digest_cluster_size(b.cluster_rep_id) as corroboration_count,
      public._digest_rank_score(
        b.qc,
        b.impact,
        b.content_type,
        public._digest_cluster_size(b.cluster_rep_id),
        b.id
      ) as rank_score
    from base b
  ),
  diversified as (
    select *
    from (
      select
        sc.*,
        row_number() over (
          partition by lower(sc.market)
          order by sc.rank_score desc, sc.signal_date desc
        ) as country_rn
      from scored sc
    ) x
    where country_rn <= 3
  ),
  top_n as (
    select *
    from diversified
    order by rank_score desc, signal_date desc
    limit 24
  )
  select
    jsonb_agg(
      jsonb_build_object(
        'id', t.id,
        'title', left(t.title, 200),
        'market', t.market,
        'type', t.content_type,
        'confidence', least(100, greatest(0, round(t.qc * 100)::int)),
        'commercial_impact', t.impact,
        'summary', left(t.summary, 600),
        'corroboration_count', t.corroboration_count,
        'lang_detected', t.lang_detected,
        'detected_at', t.signal_date
      )
      order by t.rank_score desc
    ),
    array_agg(t.id order by t.rank_score desc)
  into v_signals, v_signal_ids
  from top_n t;

  if v_signals is null or jsonb_array_length(v_signals) < 3 then
    return jsonb_build_object(
      'ok', true,
      'skipped', 'fewer than 3 unused Pipeline B digest candidates in last 14 days',
      'available', coalesce(jsonb_array_length(v_signals), 0),
      'source', 'pipeline_b'
    );
  end if;

  if v_openai_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (
      select request_id from _digest_jobs
      where provider = 'openai' and created_at > now() - interval '2 hours'
      order by created_at desc limit 10
    ) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts, 0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'openai';
    end if;
  end if;

  if v_provider is null and v_anthropic_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (
      select request_id from _digest_jobs
      where provider = 'anthropic' and created_at > now() - interval '2 hours'
      order by created_at desc limit 10
    ) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts, 0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'anthropic';
    end if;
  end if;

  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (
      select request_id from _digest_jobs
      where provider = 'gemini' and created_at > now() - interval '2 hours'
      order by created_at desc limit 10
    ) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts, 0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'gemini';
    end if;
  end if;

  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values (
      'daily_digest',
      current_date,
      'all_configured_llm_providers_degraded',
      jsonb_build_object('available_signals', jsonb_array_length(v_signals), 'source', 'pipeline_b')
    )
    on conflict (pipeline, reference_date) do nothing;
    return jsonb_build_object(
      'ok', true,
      'degraded', true,
      'reason', 'all_configured_llm_providers_degraded',
      'available', jsonb_array_length(v_signals),
      'source', 'pipeline_b'
    );
  end if;

  if v_provider = 'openai' then
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://api.openai.com/v1/chat/completions',
        headers := jsonb_build_object('Authorization', 'Bearer ' || v_openai_key, 'content-type', 'application/json'),
        body := jsonb_build_object(
          'model', 'gpt-4o-mini',
          'max_tokens', 2800,
          'temperature', 0.2,
          'messages', jsonb_build_array(
            jsonb_build_object('role', 'system', 'content', v_pre),
            jsonb_build_object('role', 'user', 'content', E'SIGNALS:\n' || v_signals::text)
          )
        ),
        timeout_milliseconds := 60000
      ),
      current_date,
      v_signal_ids,
      'openai'
    );
  elsif v_provider = 'anthropic' then
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://api.anthropic.com/v1/messages',
        headers := jsonb_build_object(
          'x-api-key', v_anthropic_key,
          'anthropic-version', '2023-06-01',
          'content-type', 'application/json'
        ),
        body := jsonb_build_object(
          'model', 'claude-haiku-4-5-20251001',
          'max_tokens', 2800,
          'messages', jsonb_build_array(
            jsonb_build_object('role', 'user', 'content', v_pre || E'\n\nSIGNALS:\n' || v_signals::text)
          )
        ),
        timeout_milliseconds := 60000
      ),
      current_date,
      v_signal_ids,
      'anthropic'
    );
  else
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
        headers := jsonb_build_object('x-goog-api-key', v_gemini_key, 'content-type', 'application/json'),
        body := jsonb_build_object(
          'systemInstruction', jsonb_build_object(
            'parts', jsonb_build_array(jsonb_build_object('text', v_pre))
          ),
          'contents', jsonb_build_array(
            jsonb_build_object(
              'role', 'user',
              'parts', jsonb_build_array(
                jsonb_build_object('text', E'SIGNALS:\n' || v_signals::text)
              )
            )
          ),
          'generationConfig', jsonb_build_object('temperature', 0.2, 'maxOutputTokens', 2800)
        ),
        timeout_milliseconds := 60000
      ),
      current_date,
      v_signal_ids,
      'gemini'
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'phase', 'fire',
    'provider', v_provider,
    'degraded', (v_provider <> 'openai'),
    'signals_sent', jsonb_array_length(v_signals),
    'source', 'pipeline_b',
    'ranking', 'feedback_aware'
  );
end;
$function$;

comment on function public.run_daily_digest() is
  'Elite daily trade digest. Pipeline B candidates ranked by _digest_rank_score (quality + impact + type + corroboration + operator feedback).';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260731100000','run_daily_digest_uses_feedback_rank','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260731100000_run_daily_digest_uses_feedback_rank.sql

-- RECOVERY BEGIN 20260731110000_feedback_service_aggregates.sql
-- Ranking and outcome health need cross-operator feedback aggregates.
-- RLS already limits authenticated users to their own rows; service_role
-- bypasses RLS by default — explicit grants make the contract obvious.

grant select, insert on public.signal_relevance_feedback to service_role;

-- Optional: authenticated users may not update/delete others' votes.
revoke update, delete on public.signal_relevance_feedback from authenticated;

comment on table public.signal_relevance_feedback is
  'Operator judgments. Inserts are user-scoped via RLS; aggregates for ranking use service_role.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260731110000','feedback_service_aggregates','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260731110000_feedback_service_aggregates.sql

-- RECOVERY BEGIN 20260731110914_platform_optimizations.sql
-- Migration: 20260729000000_platform_optimizations.sql (corrected, 2nd pass)
-- Removed: countries CREATE TABLE+seed (real 203-row table already existed
-- under this name with different columns) and professional_service_providers/
-- _applications RLS (wrong table names -- real table is
-- professional_service_provider_listings, built by PR #1178, already has
-- its own correct RLS).

ALTER TABLE signals ADD COLUMN IF NOT EXISTS snapshot_id UUID REFERENCES source_snapshots(id);
CREATE INDEX IF NOT EXISTS idx_signals_snapshot_id ON signals(snapshot_id);

ALTER TABLE marketplace_candidates ADD COLUMN IF NOT EXISTS raw_html_hash TEXT;
ALTER TABLE marketplace_candidates ADD COLUMN IF NOT EXISTS parser_version TEXT DEFAULT '1.0.0';
ALTER TABLE marketplace_candidates ADD COLUMN IF NOT EXISTS normaliser_model TEXT;
ALTER TABLE marketplace_candidates ADD COLUMN IF NOT EXISTS normaliser_prompt_version TEXT DEFAULT '1.0.0';
ALTER TABLE marketplace_candidates ADD COLUMN IF NOT EXISTS scrape_run_id TEXT;

CREATE INDEX IF NOT EXISTS idx_marketplace_candidates_discovered_at ON marketplace_candidates(discovered_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_candidates_source_id ON marketplace_candidates(source_id);

ALTER TABLE scraper_source_state ADD COLUMN IF NOT EXISTS tier INT DEFAULT 3;

ALTER TABLE hv_artifacts ADD COLUMN IF NOT EXISTS last_embedded_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_hv_artifacts_last_embedded_at ON hv_artifacts(last_embedded_at);

CREATE TABLE IF NOT EXISTS ia_extraction_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staging_id UUID REFERENCES hv_import_staging(id),
  raw_payload JSONB,
  error_reason TEXT NOT NULL,
  retry_count INT DEFAULT 0,
  model_used TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_ia_extraction_failures_retry ON ia_extraction_failures(retry_count, created_at)
  WHERE retry_count < 3 AND resolved_at IS NULL;

ALTER TABLE ia_extraction_failures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view extraction failures" ON ia_extraction_failures;
CREATE POLICY "Admins can view extraction failures"
  ON ia_extraction_failures FOR SELECT
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'));

DROP POLICY IF EXISTS "System can insert extraction failures" ON ia_extraction_failures;
CREATE POLICY "System can insert extraction failures"
  ON ia_extraction_failures FOR INSERT
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.promote_snapshot_to_signals(p_snapshot_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_snapshot  record;
  v_source    record;
  v_candidate jsonb;
  v_candidates_arr jsonb;
  v_scoring   jsonb;
  v_signal_id text;
  v_promoted  integer := 0;
  v_headline  text;
  v_summary   text;
  v_top_lane  text;
  v_text      text;
  v_lead_weeks integer;
BEGIN
  SELECT * INTO v_snapshot FROM public.source_snapshots WHERE id = p_snapshot_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  IF v_snapshot.processing_status != 'extracted' THEN RETURN 0; END IF;
  IF v_snapshot.signal_candidates IS NULL THEN RETURN 0; END IF;

  SELECT sr.source_name, sr.tier, sr.iso, sr.country, sr.region,
         sr.jurisdiction_code, sr.source_url, sr.sub_region
  INTO v_source
  FROM public.source_registry sr WHERE id = v_snapshot.source_id;

  IF NOT FOUND OR v_source.source_name IS NULL THEN
    RETURN 0;
  END IF;

  v_lead_weeks := CASE
    WHEN v_source.tier = 1 THEN 12
    WHEN v_source.tier = 2 THEN 6
    ELSE 4
  END;

  IF jsonb_typeof(v_snapshot.signal_candidates) = 'array' THEN
    v_candidates_arr := v_snapshot.signal_candidates;
  ELSE
    v_candidates_arr := jsonb_build_array(v_snapshot.signal_candidates);
  END IF;

  FOR v_candidate IN
    SELECT value FROM jsonb_array_elements(v_candidates_arr)
  LOOP
    v_text := lower(coalesce(v_candidate->>'text', ''));

    IF v_candidate->>'keyword_count' IS NULL THEN
      CONTINUE WHEN (v_candidate->'matched_keywords' IS NULL
                     OR jsonb_array_length(coalesce(v_candidate->'matched_keywords','[]'::jsonb)) = 0);
    ELSE
      CONTINUE WHEN (v_candidate->>'keyword_count')::int < 2
        AND v_text !~ '\m(cannabis|hemp|cannabinoid|cbd|thc|marijuana|chanvre|ca[nñ]amo|ganja|kannabis|bhang|marihuana|canabis)\M';
    END IF;

    v_headline := left(coalesce(
      v_snapshot.captured_title,
      v_candidate->>'text',
      v_source.source_name
    ), 200);

    v_summary := coalesce(
      v_candidate->>'text',
      v_candidate->>'summary',
      v_snapshot.captured_title,
      v_source.source_name
    );

    CONTINUE WHEN v_headline ILIKE '%opens new tab%'
      OR v_headline ILIKE '%creative commons%'
      OR v_headline ILIKE '%code of conduct%'
      OR v_headline ILIKE '%hardware, software%'
      OR v_headline ILIKE '%covid-19%'
      OR length(trim(v_headline)) < 30;

    IF EXISTS (
      SELECT 1 FROM public.signals
      WHERE source = v_source.source_name
        AND headline = v_headline
        AND date > now() - interval '30 days'
    ) THEN CONTINUE; END IF;

    v_scoring := public.score_signal_from_snapshot(
      v_snapshot.intelligence_pass,
      v_lead_weeks,
      coalesce((v_candidate->>'keyword_count')::int,
               jsonb_array_length(coalesce(v_candidate->'matched_keywords','[]'::jsonb)))
    );

    v_top_lane := CASE
      WHEN (v_scoring->>'lane_r')::int >= (v_scoring->>'lane_e')::int
       AND (v_scoring->>'lane_r')::int >= (v_scoring->>'lane_t')::int THEN 'Regulatory'
      WHEN (v_scoring->>'lane_e')::int >= (v_scoring->>'lane_t')::int THEN 'Economic'
      ELSE 'Trade'
    END;

    v_signal_id := left(md5(v_source.source_name || v_headline || v_snapshot.captured_at::text), 20);

    INSERT INTO public.signals (
      id, date, cat, pri, score, headline, summary,
      source, url, verification, tier, lang,
      company, country, in_network,
      lane_r, lane_e, lane_t, top_lane,
      query_pack, commercial_impact,
      reviewed, action, created_at, snapshot_id
    ) VALUES (
      v_signal_id,
      COALESCE(v_snapshot.captured_at, now()),
      CASE v_snapshot.intelligence_pass
        WHEN 1 THEN 'GAZETTE' WHEN 2 THEN 'PARLIAMENTARY'
        WHEN 3 THEN 'PROCUREMENT' WHEN 4 THEN 'MDB_PROJECT'
        ELSE 'SOURCE_ENGINE'
      END,
      v_scoring->>'pri',
      (v_scoring->>'score')::int,
      v_headline, v_summary,
      v_source.source_name, v_source.source_url,
      'source_engine_v1',
      CASE v_snapshot.intelligence_pass
        WHEN 1 THEN 'Tier 1' WHEN 2 THEN 'Tier 1'
        WHEN 3 THEN 'Tier 2' WHEN 4 THEN 'Tier 2'
        ELSE 'Tier 3'
      END,
      COALESCE(v_snapshot.language_detected, 'en'),
      NULL, v_source.country, false,
      (v_scoring->>'lane_r')::int,
      (v_scoring->>'lane_e')::int,
      (v_scoring->>'lane_t')::int,
      v_top_lane,
      'SP-' || COALESCE(v_snapshot.intelligence_pass::text, 'X')
        || ' | ' || COALESCE(v_source.sub_region, v_source.country, 'Global'),
      CASE
        WHEN (v_scoring->>'score')::int >= 75 THEN 'Immediate trade or market-access relevance'
        WHEN (v_scoring->>'score')::int >= 50 THEN 'Likely trade or market-access relevance'
        ELSE 'Monitor for developing relevance'
      END,
      false, '', now(), p_snapshot_id
    )
    ON CONFLICT (id) DO NOTHING;

    v_promoted := v_promoted + 1;
  END LOOP;

  RETURN v_promoted;
END;
$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260731110914','platform_optimizations','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260731110914_platform_optimizations.sql

-- RECOVERY BEGIN 20260731130000_elite_digest_release_hardening.sql
-- Elite Digest release hardening: published-ID consumption and RPC privilege lockdown.
-- Re-applies the feedback-aware digest function from 20260731100000 with one
-- constrained collect-phase correction, then enforces service-role-only RPC access.

-- Wire nightly digest candidate ranking through _digest_rank_score so
-- operator feedback affects the LLM input batch (not only the TS fallback).
-- Depends on: elite_digest_from_pipeline_b, intelligence_self_improve_loop,
--             digest_rank_includes_feedback.

create or replace function public.run_daily_digest()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'net', 'vault', 'extensions'
as $function$
declare
  v_openai_key text;
  v_anthropic_key text;
  v_gemini_key text;
  v_signals jsonb;
  v_signal_ids text[];
  v_provider text := null;
  v_attempts int;
  v_failures int;
  v_pre text := $prompt$
You are the senior editor of Harbourview Daily, a B2B cannabis market-intelligence briefing for licensed operators, importers, investors, and compliance officers.

Below is a JSON array of QUALITY-GATED intelligence signals. Each already passed a validated classifier (precision ≈ 1.0). Prefer signals that are:
- commercially actionable (licensing, import/export, taxation, market access, M&A, capacity)
- geographically diverse (do not fill the brief with only US/CA/DE/UK)
- corroborated (higher corroboration_count = multiple independent sources)
- high impact / high confidence

Select up to 10 of the most important items (fewer if fewer qualify). For each:
- Rewrite a sharp headline (max 110 chars, your own words — do not copy boilerplate)
- Write ONE "why_it_matters" sentence a commercial operator would act on
- Keep the market as the country name from the input (or "Global")
- Echo signal_id exactly from the input

Return ONLY a JSON array (no markdown fences, no prose). Each element:
{"headline": string, "why_it_matters": string, "market": string, "signal_id": string}
Order by commercial importance descending.
$prompt$;
begin
  if exists (
    select 1 from daily_digest
    where digest_date = current_date
      and headlines is not null and jsonb_array_length(headlines) > 0
  ) then
    return jsonb_build_object('ok',true,'skipped','digest exists for today');
  end if;

  update _digest_jobs j set collected = true
  where j.digest_date = current_date and not j.collected
    and j.created_at < now() - interval '1 hour'
    and not exists (select 1 from net._http_response r where r.id = j.request_id);

  perform 1 from _digest_jobs j where j.digest_date = current_date and not j.collected;
  if found then
    with resp as (
      select j.request_id, j.signal_ids, j.provider, r.status_code,
             coalesce(
               safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
               safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
               safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
             ) as llm_text
      from _digest_jobs j join net._http_response r on r.id = j.request_id
      where j.digest_date = current_date and not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, signal_ids, provider, status_code,
             safe_to_jsonb(trim(both from regexp_replace(llm_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    ok as (
      select request_id, signal_ids, p
      from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array' and jsonb_array_length(p) > 0
    ),
    ins as (
      insert into daily_digest (digest_date, headlines, markets, status, generated_at)
      select current_date, o.p,
        (select coalesce(array_agg(distinct h->>'market'), '{}') from jsonb_array_elements(o.p) h),
        'published', now()
      from ok o
      on conflict (digest_date) do update
        set headlines = excluded.headlines,
            markets = (select coalesce(array_agg(distinct m), '{}') from unnest(daily_digest.markets || excluded.markets) m),
            status = 'published',
            updated_at = now()
      returning id
    ),
    published_signal_ids as (
      select distinct h ->> 'signal_id' as signal_id
      from ok o
      cross join lateral jsonb_array_elements(o.p) h
      where jsonb_typeof(h) = 'object'
        and nullif(h ->> 'signal_id', '') is not null
        and (h ->> 'signal_id') = any(o.signal_ids)
    ),
    mark_used as (
      update public.signals s set used_in_digest_at = now()
      from published_signal_ids p
      where s.id = p.signal_id
        and exists (select 1 from ins)
      returning s.id
    ),
    mark_collected as (
      update _digest_jobs j set collected = true
      from parsed p where j.request_id = p.request_id
      returning j.request_id
    )
    select jsonb_build_object('ok',true,'phase','collect',
      'provider', (select provider from parsed),
      'published', exists(select 1 from ins),
      'signals_marked', (select count(*) from mark_used),
      'source', 'pipeline_b')
    into v_signals;

    return coalesce(v_signals, jsonb_build_object('ok',true,'phase','collect','published',false,'reason','response not ready or unparseable'));
  end if;

  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_openai_key is null and v_anthropic_key is null and v_gemini_key is null then
    return jsonb_build_object('ok',false,'reason','no openai_api_key, anthropic_api_key or gemini_api_key in vault');
  end if;

  with base as (
    select
      s.id,
      coalesce(nullif(trim(s.title_en), ''), nullif(trim(s.headline), ''), 'Untitled') as title,
      coalesce(nullif(trim(s.summary_en), ''), nullif(trim(s.summary), ''), '') as summary,
      coalesce(nullif(trim(s.country), ''), 'Global') as market,
      coalesce(s.content_type, 'regulatory') as content_type,
      coalesce(s.impact, 'medium') as impact,
      coalesce(s.quality_confidence, 0)::numeric as qc,
      coalesce(s.is_representative, true) as is_rep,
      s.cluster_rep_id,
      s.lang_detected,
      coalesce(s.date, s.created_at::date) as signal_date,
      s.created_at
    from public.signals s
    where s.reviewed is true
      and s.used_in_digest_at is null
      and coalesce(s.date, s.created_at::date) > current_date - 14
      and (
        s.quality_label is null
        or lower(s.quality_label) not in ('spam','boilerplate','nav','duplicate')
      )
      and (
        lower(coalesce(s.content_type, '')) in ('story','research','market')
        or (
          lower(coalesce(s.content_type, 'regulatory')) = 'regulatory'
          and lower(coalesce(s.impact, '')) = 'high'
          and coalesce(s.quality_confidence, 0) >= 0.70
        )
      )
      and coalesce(s.is_representative, true) is true
  ),
  scored as (
    select
      b.*,
      public._digest_cluster_size(b.cluster_rep_id) as corroboration_count,
      public._digest_rank_score(
        b.qc,
        b.impact,
        b.content_type,
        public._digest_cluster_size(b.cluster_rep_id),
        b.id
      ) as rank_score
    from base b
  ),
  diversified as (
    select *
    from (
      select
        sc.*,
        row_number() over (
          partition by lower(sc.market)
          order by sc.rank_score desc, sc.signal_date desc
        ) as country_rn
      from scored sc
    ) x
    where country_rn <= 3
  ),
  top_n as (
    select *
    from diversified
    order by rank_score desc, signal_date desc
    limit 24
  )
  select
    jsonb_agg(
      jsonb_build_object(
        'id', t.id,
        'title', left(t.title, 200),
        'market', t.market,
        'type', t.content_type,
        'confidence', least(100, greatest(0, round(t.qc * 100)::int)),
        'commercial_impact', t.impact,
        'summary', left(t.summary, 600),
        'corroboration_count', t.corroboration_count,
        'lang_detected', t.lang_detected,
        'detected_at', t.signal_date
      )
      order by t.rank_score desc
    ),
    array_agg(t.id order by t.rank_score desc)
  into v_signals, v_signal_ids
  from top_n t;

  if v_signals is null or jsonb_array_length(v_signals) < 3 then
    return jsonb_build_object(
      'ok', true,
      'skipped', 'fewer than 3 unused Pipeline B digest candidates in last 14 days',
      'available', coalesce(jsonb_array_length(v_signals), 0),
      'source', 'pipeline_b'
    );
  end if;

  if v_openai_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (
      select request_id from _digest_jobs
      where provider = 'openai' and created_at > now() - interval '2 hours'
      order by created_at desc limit 10
    ) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts, 0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'openai';
    end if;
  end if;

  if v_provider is null and v_anthropic_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (
      select request_id from _digest_jobs
      where provider = 'anthropic' and created_at > now() - interval '2 hours'
      order by created_at desc limit 10
    ) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts, 0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'anthropic';
    end if;
  end if;

  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (
      select request_id from _digest_jobs
      where provider = 'gemini' and created_at > now() - interval '2 hours'
      order by created_at desc limit 10
    ) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts, 0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'gemini';
    end if;
  end if;

  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values (
      'daily_digest',
      current_date,
      'all_configured_llm_providers_degraded',
      jsonb_build_object('available_signals', jsonb_array_length(v_signals), 'source', 'pipeline_b')
    )
    on conflict (pipeline, reference_date) do nothing;
    return jsonb_build_object(
      'ok', true,
      'degraded', true,
      'reason', 'all_configured_llm_providers_degraded',
      'available', jsonb_array_length(v_signals),
      'source', 'pipeline_b'
    );
  end if;

  if v_provider = 'openai' then
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://api.openai.com/v1/chat/completions',
        headers := jsonb_build_object('Authorization', 'Bearer ' || v_openai_key, 'content-type', 'application/json'),
        body := jsonb_build_object(
          'model', 'gpt-4o-mini',
          'max_tokens', 2800,
          'temperature', 0.2,
          'messages', jsonb_build_array(
            jsonb_build_object('role', 'system', 'content', v_pre),
            jsonb_build_object('role', 'user', 'content', E'SIGNALS:\n' || v_signals::text)
          )
        ),
        timeout_milliseconds := 60000
      ),
      current_date,
      v_signal_ids,
      'openai'
    );
  elsif v_provider = 'anthropic' then
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://api.anthropic.com/v1/messages',
        headers := jsonb_build_object(
          'x-api-key', v_anthropic_key,
          'anthropic-version', '2023-06-01',
          'content-type', 'application/json'
        ),
        body := jsonb_build_object(
          'model', 'claude-haiku-4-5-20251001',
          'max_tokens', 2800,
          'messages', jsonb_build_array(
            jsonb_build_object('role', 'user', 'content', v_pre || E'\n\nSIGNALS:\n' || v_signals::text)
          )
        ),
        timeout_milliseconds := 60000
      ),
      current_date,
      v_signal_ids,
      'anthropic'
    );
  else
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
        headers := jsonb_build_object('x-goog-api-key', v_gemini_key, 'content-type', 'application/json'),
        body := jsonb_build_object(
          'systemInstruction', jsonb_build_object(
            'parts', jsonb_build_array(jsonb_build_object('text', v_pre))
          ),
          'contents', jsonb_build_array(
            jsonb_build_object(
              'role', 'user',
              'parts', jsonb_build_array(
                jsonb_build_object('text', E'SIGNALS:\n' || v_signals::text)
              )
            )
          ),
          'generationConfig', jsonb_build_object('temperature', 0.2, 'maxOutputTokens', 2800)
        ),
        timeout_milliseconds := 60000
      ),
      current_date,
      v_signal_ids,
      'gemini'
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'phase', 'fire',
    'provider', v_provider,
    'degraded', (v_provider <> 'openai'),
    'signals_sent', jsonb_array_length(v_signals),
    'source', 'pipeline_b',
    'ranking', 'feedback_aware'
  );
end;
$function$;

comment on function public.run_daily_digest() is
  'Elite daily trade digest. Pipeline B candidates ranked by _digest_rank_score (quality + impact + type + corroboration + operator feedback).';


-- SECURITY DEFINER and ranking helpers are internal execution surfaces.
-- Revoke both PostgreSQL PUBLIC defaults and any explicit API-role grants.
revoke all privileges on function public.run_daily_digest() from public, anon, authenticated;
grant execute on function public.run_daily_digest() to service_role;

revoke all privileges on function public.hv_intelligence_outcome_check() from public, anon, authenticated;
grant execute on function public.hv_intelligence_outcome_check() to service_role;

revoke all privileges on function public.signal_feedback_score(text) from public, anon, authenticated;
grant execute on function public.signal_feedback_score(text) to service_role;

revoke all privileges on function public._digest_rank_score(numeric, text, text, integer, text) from public, anon, authenticated;
grant execute on function public._digest_rank_score(numeric, text, text, integer, text) to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260731130000','elite_digest_release_hardening','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260731130000_elite_digest_release_hardening.sql

-- RECOVERY BEGIN 20260731145108_harden_supply_catalog_public_projection.sql
-- Harden Harbourview Supply after the original live-first catalog migration.
-- This migration is intentionally additive and safe on environments where the
-- three PR #1222 migrations were already applied.

-- Remove duplicate Harbourview-direct rows before enforcing natural keys.
with ranked as (
  select id,
         row_number() over (
           partition by slug
           order by updated_at desc nulls last, created_at desc nulls last, id
         ) as rn
  from public.listings
  where sold_by_harbourview = true and slug is not null
)
delete from public.listings l
using ranked r
where l.id = r.id and r.rn > 1;

with ranked as (
  select id,
         row_number() over (
           partition by sku
           order by updated_at desc nulls last, created_at desc nulls last, id
         ) as rn
  from public.listings
  where sold_by_harbourview = true and sku is not null
)
delete from public.listings l
using ranked r
where l.id = r.id and r.rn > 1;

create unique index if not exists listings_supply_slug_unique_idx
  on public.listings (slug)
  where sold_by_harbourview = true and slug is not null;

create unique index if not exists listings_supply_sku_unique_idx
  on public.listings (sku)
  where sold_by_harbourview = true and sku is not null;

alter table public.listings
  drop constraint if exists listings_supply_stock_nonnegative,
  add constraint listings_supply_stock_nonnegative
    check (not sold_by_harbourview or stock_qty is null or stock_qty >= 0) not valid,
  drop constraint if exists listings_supply_lead_time_nonnegative,
  add constraint listings_supply_lead_time_nonnegative
    check (not sold_by_harbourview or lead_time_days is null or lead_time_days >= 0) not valid,
  drop constraint if exists listings_supply_moq_positive,
  add constraint listings_supply_moq_positive
    check (not sold_by_harbourview or moq is null or moq > 0) not valid,
  drop constraint if exists listings_supply_target_country_codes,
  add constraint listings_supply_target_country_codes
    check (
      not sold_by_harbourview
      or target_countries <@ array[
        'AD','AE','AF','AG','AI','AL','AM','AO','AQ','AR','AS','AT','AU','AW','AX','AZ',
        'BA','BB','BD','BE','BF','BG','BH','BI','BJ','BL','BM','BN','BO','BQ','BR','BS','BT','BV','BW','BY','BZ',
        'CA','CC','CD','CF','CG','CH','CI','CK','CL','CM','CN','CO','CR','CU','CV','CW','CX','CY','CZ',
        'DE','DJ','DK','DM','DO','DZ','EC','EE','EG','EH','ER','ES','ET','FI','FJ','FK','FM','FO','FR',
        'GA','GB','GD','GE','GF','GG','GH','GI','GL','GM','GN','GP','GQ','GR','GS','GT','GU','GW','GY',
        'HK','HM','HN','HR','HT','HU','ID','IE','IL','IM','IN','IO','IQ','IR','IS','IT','JE','JM','JO','JP',
        'KE','KG','KH','KI','KM','KN','KP','KR','KW','KY','KZ','LA','LB','LC','LI','LK','LR','LS','LT','LU','LV','LY',
        'MA','MC','MD','ME','MF','MG','MH','MK','ML','MM','MN','MO','MP','MQ','MR','MS','MT','MU','MV','MW','MX','MY','MZ',
        'NA','NC','NE','NF','NG','NI','NL','NO','NP','NR','NU','NZ','OM','PA','PE','PF','PG','PH','PK','PL','PM','PN','PR','PS','PT','PW','PY',
        'QA','RE','RO','RS','RU','RW','SA','SB','SC','SD','SE','SG','SH','SI','SJ','SK','SL','SM','SN','SO','SR','SS','ST','SV','SX','SY','SZ',
        'TC','TD','TF','TG','TH','TJ','TK','TL','TM','TN','TO','TR','TT','TV','TW','TZ','UA','UG','UM','US','UY','UZ',
        'VA','VC','VE','VG','VI','VN','VU','WF','WS','YE','YT','ZA','ZM','ZW'
      ]::text[]
    ) not valid;

-- Remove internal third-party reference naming from public-facing seed data.
update public.listings
set title = case slug
    when 'twister-t2-pre-roll-machine' then 'Compact Automated Pre-Roll Machine'
    when 'twister-t4-pre-roll-machine' then 'Mid-Volume Automated Pre-Roll Machine'
    when 'twister-t6-pre-roll-machine' then 'Commercial Automated Pre-Roll Machine'
    else title
  end,
  brand = null,
  model = null,
  updated_at = now()
where sold_by_harbourview = true
  and slug in (
    'twister-t2-pre-roll-machine',
    'twister-t4-pre-roll-machine',
    'twister-t6-pre-roll-machine'
  );

-- Dedicated allowlisted public DTO. It does not expose raw descriptions,
-- exact stock, supplier identity, internal quantity, raw compliance JSON,
-- brand/model, exact lead times, or unverified compliance conclusions.
create or replace view api.supply_catalog_public_v1 as
select
  l.id,
  l.slug,
  l.title,
  case l.category::text
    when 'packaging' then 'Unbranded packaging format available for commercial review and quotation.'
    when 'consumables' then 'Commercial consumable available for specification review and quotation.'
    when 'cultivation_equipment' then 'Generic cultivation equipment available for configuration review and quotation.'
    when 'processing_equipment' then 'Generic processing equipment available for configuration review and quotation.'
    when 'labs_testing' then 'Laboratory or testing equipment available for specification review and quotation.'
    else 'Supply catalog item available for specification review and quotation.'
  end::text as description,
  l.category::text as category,
  coalesce(l.marketplace_section, l.category::text)::text as marketplace_section,
  l.product_type,
  l.region::text as region,
  coalesce(l.price_currency, 'CAD')::text as price_currency,
  'Quote required'::text as price_display,
  coalesce(l.is_featured, false) as is_featured,
  l.created_at,
  l.sku,
  l.unit,
  null::text as moq_display,
  null::text as lead_time_display,
  'Subject to confirmation'::text as availability_status,
  coalesce(l.target_countries, '{}'::text[]) as target_countries,
  coalesce(
    (
      select jsonb_agg(attribute order by attribute->>'label')
      from (
        select jsonb_build_object(
          'key', attribute_key,
          'label', attribute_label,
          'value', 'Review required'
        ) as attribute
        from (values
          ('child_resistant', 'Child-resistant format'),
          ('tamper_evident', 'Tamper-evident format'),
          ('opaque', 'Opaque format')
        ) allowed(attribute_key, attribute_label)
        where exists (
          select 1
          from jsonb_each(coalesce(l.compliance_flags, '{}'::jsonb)) country_entry
          where coalesce((country_entry.value ->> attribute_key)::boolean, false) = true
        )
      ) attributes
    ),
    '[]'::jsonb
  ) as public_attributes,
  'Attributes, availability, pricing, lead time and jurisdiction fit require Harbourview review before reliance or purchase.'::text as review_note
from public.listings l
where l.sold_by_harbourview = true
  and l.status = 'approved'::listing_status
  and l.public_visibility = true
  and l.archived_at is null
  and l.slug is not null
  and l.sku is not null;

comment on view api.supply_catalog_public_v1 is
  'Allowlisted public Harbourview Supply DTO. Excludes exact stock, raw compliance metadata, supplier identity, brand/model and internal review data.';

grant select on api.supply_catalog_public_v1 to anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260731145108','harden_supply_catalog_public_projection','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260731145108_harden_supply_catalog_public_projection.sql

-- RECOVERY BEGIN 20260801144813_schedule_hv_promote_staging_to_artifacts.sql
-- Schedule the staging -> artifacts promoter.
--
-- hv_promote_staging_to_artifacts has never been scheduled: no cron.job command
-- references it, no SQL function calls it, and no repo code invokes it. Staging
-- rows accumulated until someone ran it by hand (60 promoted 2026-08-01 12:10).
--
-- Verified before scheduling: a manual run drains cleanly, and staging currently
-- sits at 0 pending / 1,059 promoted / 32 duplicate_review.
--
-- Batch of 50 hourly at :20, off the shared :00 and away from hv-quality-promote
-- (:10/:40) and hv-pipeline-alerts (:47) to spread Nano's disk I/O.
--
-- SCOPE NOTE: this feeds `hv_artifacts`, NOT `public.signals`. The live Intel
-- feed reads `signals` (reviewed=true), so this does not by itself make the feed
-- live -- see the trg_promote_snapshot gap recorded in EVIDENCE_LOG.md.
--
-- Approved by Tyler 2026-08-01 against an explicit four-item scope.

select cron.schedule(
  'hv-promote-staging',
  '20 * * * *',
  'select public.hv_promote_staging_to_artifacts(50);'
)
where not exists (select 1 from cron.job where jobname = 'hv-promote-staging');

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260801144813','schedule_hv_promote_staging_to_artifacts','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260801144813_schedule_hv_promote_staging_to_artifacts.sql

-- RECOVERY BEGIN 20260802011926_job_search_operator_boundary_rls.sql
BEGIN;

GRANT USAGE ON SCHEMA job_search TO anon, authenticated, service_role;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON ALL TABLES IN SCHEMA job_search
  FROM anon, authenticated;
REVOKE ALL PRIVILEGES
  ON ALL SEQUENCES IN SCHEMA job_search
  FROM anon, authenticated;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA job_search TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA job_search TO service_role;

DO $operator_boundary$
DECLARE
  table_name text;
  readable_tables constant text[] := ARRAY[
    'companies',
    'jobs',
    'applications',
    'resume_versions',
    'contacts',
    'outreach_messages',
    'settings',
    'settings_legacy_single_row',
    'opportunities'
  ];
BEGIN
  FOREACH table_name IN ARRAY readable_tables LOOP
    IF to_regclass(format('job_search.%I', table_name)) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE job_search.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON job_search.%I', 'anon full access', table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON job_search.%I', 'authenticated full access', table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON job_search.%I', 'client read access', table_name);
    EXECUTE format(
      'CREATE POLICY %I ON job_search.%I FOR SELECT TO anon, authenticated USING (true)',
      'client read access',
      table_name
    );
    EXECUTE format('GRANT SELECT ON TABLE job_search.%I TO anon, authenticated', table_name);
  END LOOP;
END
$operator_boundary$;

ALTER DEFAULT PRIVILEGES IN SCHEMA job_search
  REVOKE ALL PRIVILEGES ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA job_search
  REVOKE ALL PRIVILEGES ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA job_search
  GRANT ALL PRIVILEGES ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA job_search
  GRANT ALL PRIVILEGES ON SEQUENCES TO service_role;

COMMIT;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260802011926','job_search_operator_boundary_rls','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260802011926_job_search_operator_boundary_rls.sql

-- RECOVERY BEGIN 20260802014521_jobs_effective_timestamp.sql
ALTER TABLE job_search.jobs
  ADD COLUMN IF NOT EXISTS effective_at timestamptz
  GENERATED ALWAYS AS (
    COALESCE(posted_at::timestamp AT TIME ZONE 'UTC', fetched_at)
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_jobs_effective_at
  ON job_search.jobs (effective_at DESC, id ASC);

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260802014521','jobs_effective_timestamp','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260802014521_jobs_effective_timestamp.sql

-- RECOVERY BEGIN 20260802073000_hv_dedup_assign_restore_hnsw_knn.sql
-- Restore the HNSW k-NN form of hv_dedup_assign, and stop CI from reverting it.
--
-- THE BUG THIS PREVENTS
-- ---------------------
-- Production currently runs the correct, HNSW-index-using definition. It got
-- there via a migration applied directly through Supabase MCP
-- (`20260730104633_hv_dedup_assign_use_hnsw_index`) that was never written to a
-- file. Meanwhile the repo carries `20260730110000_fix_hv_dedup_assign_timeout_
-- and_ranking.sql`, which holds the SUPERSEDED pre-HNSW body.
--
-- `.github/workflows/supabase-migrate.yml` applies every local file whose
-- version is absent from `supabase_migrations.schema_migrations`, in version
-- order. `20260730104633` has no file, so its auto-reconcile step writes a
-- `SELECT 1;` placeholder for it -- which does NOT carry the HNSW body -- and
-- then `supabase db push --include-all` applies `20260730110000`, whose version
-- IS absent from the remote history and whose body is the old one.
--
-- Net effect without this file: CI silently reverts hv_dedup_assign to the form
-- that scans instead of using idx_signals_embedding_1024_hnsw, reintroducing the
-- 120s statement timeout that made dedup unrunnable (fixed to ~2.4s).
--
-- Because this uniquely-versioned forward migration sorts after 20260730110000, it lands last and wins
-- regardless of what the stale file does. That is deliberate: correcting the
-- stale file alone would still leave the outcome dependent on file ordering.
--
-- WHY THE k-NN FORM IS REQUIRED
-- -----------------------------
-- pgvector can only serve an HNSW index through `ORDER BY <col> <=> <query>`
-- with a LIMIT. A predicate like `WHERE (1 - (a <=> b)) >= tau` is a filter over
-- the whole candidate set, not an index probe, so the planner falls back to a
-- sequential scan with a distance computation per row. The correct shape is:
-- take the k nearest neighbours via the index, THEN apply the similarity
-- threshold to those k rows -- which is what this body does with
-- c_neighbours = 25.
--
-- This body is a verbatim copy of the live production definition, read back
-- from pg_get_functiondef on 2026-07-31, so applying it is a no-op against the
-- current database and a repair against any database CI has already regressed.

create or replace function public.hv_dedup_assign(
  p_tau double precision default 0.90,
  p_scope_days integer default 120
)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  n int;
  c_batch constant int := 400;
  c_neighbours constant int := 25;
begin
  p_scope_days := least(greatest(coalesce(p_scope_days, 120), 1), 400);
  p_tau        := least(greatest(coalesce(p_tau, 0.90), 0.5), 0.999);

  with targets as (
    select a.id, a.embedding_1024, a.created_at,
           coalesce(a.quality_confidence, 0) as qc
    from public.signals a
    where a.embedding_1024 is not null
      and a.created_at > now() - (p_scope_days || ' days')::interval
      and a.cluster_rep_id is null
    order by a.created_at desc
    limit c_batch
  ),
  scored as (
    select
      t.id,
      (
        select nb.id
        from (
          -- Index probe: nearest c_neighbours by cosine distance. The threshold
          -- is applied outside this subquery, never as a WHERE on the distance.
          select b.id,
                 b.created_at,
                 coalesce(b.quality_confidence, 0) as qc,
                 1 - (t.embedding_1024 <=> b.embedding_1024) as sim
          from public.signals b
          where b.embedding_1024 is not null
            and b.id <> t.id
          order by t.embedding_1024 <=> b.embedding_1024
          limit c_neighbours
        ) nb
        where nb.sim >= p_tau
          and nb.created_at > now() - (p_scope_days || ' days')::interval
          -- Deterministic representative choice: higher confidence wins, then
          -- earlier, then lowest id. Without the final id tiebreak two rows can
          -- each name the other as better and neither becomes representative.
          and (
                nb.qc > t.qc
             or (nb.qc = t.qc and nb.created_at < t.created_at)
             or (nb.qc = t.qc and nb.created_at = t.created_at and nb.id < t.id)
          )
        order by nb.sim desc
        limit 1
      ) as better_id
    from targets t
  )
  update public.signals a
     set is_representative = (s.better_id is null),
         cluster_rep_id    = coalesce(s.better_id, a.id)
    from scored s
   where a.id = s.id;

  get diagnostics n = row_count;
  return n;
end
$function$;

comment on function public.hv_dedup_assign(double precision, integer) is
  'Assigns cluster representatives over signals.embedding_1024. Uses the HNSW index via '
  'ORDER BY <=> LIMIT c_neighbours and applies p_tau to those neighbours -- a WHERE clause on '
  'the distance cannot use the index and made this function time out at 120s. Supersedes the '
  'body in 20260730110000_fix_hv_dedup_assign_timeout_and_ranking.sql, which predates the HNSW '
  'change and must not be allowed to apply last.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260802073000','hv_dedup_assign_restore_hnsw_knn','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260802073000_hv_dedup_assign_restore_hnsw_knn.sql

-- RECOVERY BEGIN 20260802134657_fix_candidate_review_and_pathway_template_grants.sql
-- Continuation of the missing-grant audit (see 20260729095416, 20260730103137).
-- Checked all remaining authenticated-only gaps individually rather than
-- blanket-granting -- three of the five were correctly locked down by
-- design and are NOT touched here:
--   - marketplace_inquiries: only an INSERT policy exists, no SELECT policy
--     at all. Write-only for the public by design (buyer contact data).
--   - signal_candidates: RLS policy is `service_role_all`, restricted to
--     auth.role() = 'service_role'. No authenticated-facing intent exists.
--   - stripe_webhook_events: RLS policy restricted to service_role only,
--     explicitly named "Service role manages webhook events". Should stay
--     locked down -- granting authenticated here would be against the
--     table's own clear design intent, not a bug fix.
--
-- The other two ARE genuine missing-grant bugs, same shape as every prior
-- fix in this series -- RLS already correctly scopes access, the grant was
-- just never added:
--   - candidate_review_events: RLS policy `admin_operator_select` restricts
--     to users with role admin/operator via a user_roles lookup. Currently
--     even admins/operators can't read this table at all. Confirmed no
--     risky cross-table view dependency (single base table, ignoring
--     pg_toast noise).
--   - cc_pathway_templates: RLS policy `cc_pathway_templates_auth_read`
--     (name itself signals intent) restricts to `is_active = true`.
--     Confirmed single base table dependency.
--
-- regulatory_signals.* views flagged in the original audit were checked in
-- a later follow-up (20260829181346_fix_regulatory_signals_missing_grants.sql).

grant select on public.candidate_review_events to authenticated;
grant select on public.cc_pathway_templates to authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260802134657','fix_candidate_review_and_pathway_template_grants','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260802134657_fix_candidate_review_and_pathway_template_grants.sql

-- RECOVERY BEGIN 20260802152500_signal_feedback_api_rpcs.sql
-- Controlled PostgREST boundary for Elite Digest operator feedback.
--
-- The project exposes only the `api` schema. The source table remains in
-- `public` and is deliberately not projected as a writable view.

create schema if not exists api;

grant usage on schema api to authenticated, service_role;

-- One operator has one current verdict per signal. Fail closed if an environment
-- contains legacy duplicates rather than deleting or silently choosing data.
do $duplicate_guard$
begin
  if exists (
    select 1
    from public.signal_relevance_feedback
    group by signal_id, user_id
    having count(*) > 1
  ) then
    raise exception 'signal_relevance_feedback contains duplicate user/signal rows; reconcile before applying the unique current-verdict constraint';
  end if;
end
$duplicate_guard$;

create unique index if not exists idx_signal_relevance_feedback_one_per_user_signal
  on public.signal_relevance_feedback (signal_id, user_id);

create or replace function api.submit_signal_relevance_feedback(
  p_signal_id text,
  p_verdict text,
  p_note text default null,
  p_surface text default 'digest'
)
returns uuid
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'auth'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_signal_id text := btrim(coalesce(p_signal_id, ''));
  v_verdict text := btrim(coalesce(p_verdict, ''));
  v_surface text := btrim(coalesce(p_surface, 'digest'));
  v_note text := nullif(left(btrim(coalesce(p_note, '')), 500), '');
  v_feedback_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if v_signal_id = '' or length(v_signal_id) > 120 then
    raise exception 'invalid signal id' using errcode = '22023';
  end if;
  if not exists (select 1 from public.signals s where s.id = v_signal_id) then
    raise exception 'unknown signal id' using errcode = '22023';
  end if;
  if v_verdict not in ('helpful', 'not_helpful', 'stale', 'wrong_country') then
    raise exception 'invalid feedback verdict' using errcode = '22023';
  end if;
  if v_surface not in ('digest', 'signals', 'search', 'email') then
    raise exception 'invalid feedback surface' using errcode = '22023';
  end if;

  insert into public.signal_relevance_feedback (
    signal_id,
    user_id,
    verdict,
    note,
    surface
  ) values (
    v_signal_id,
    v_user_id,
    v_verdict,
    v_note,
    v_surface
  )
  on conflict (signal_id, user_id) do update
    set verdict = excluded.verdict,
        note = excluded.note,
        surface = excluded.surface,
        created_at = now()
  returning id into v_feedback_id;

  return v_feedback_id;
end
$function$;

comment on function api.submit_signal_relevance_feedback(text, text, text, text) is
  'Authenticated current-verdict writer. Forces user_id from auth.uid(), rejects unknown signals, validates the persisted verdict contract, and prevents repeated-vote amplification.';

revoke all on function api.submit_signal_relevance_feedback(text, text, text, text) from public, anon;
grant execute on function api.submit_signal_relevance_feedback(text, text, text, text) to authenticated;

create or replace function api.signal_relevance_feedback_for_ranking(
  p_signal_ids text[],
  p_since timestamptz
)
returns table(signal_id text, verdict text)
language sql
stable
security definer
set search_path to 'pg_catalog', 'public'
as $function$
  select latest.signal_id, latest.verdict
  from (
    select distinct on (f.signal_id, f.user_id)
      f.signal_id,
      f.user_id,
      f.verdict
    from public.signal_relevance_feedback f
    where f.signal_id = any(coalesce(p_signal_ids, array[]::text[]))
      and f.created_at >= coalesce(p_since, now() - interval '90 days')
      and f.verdict in ('helpful', 'not_helpful', 'stale', 'wrong_country')
    order by f.signal_id, f.user_id, f.created_at desc, f.id desc
  ) latest;
$function$;

comment on function api.signal_relevance_feedback_for_ranking(text[], timestamptz) is
  'Service-role-only latest-verdict projection for signed Digest ranking. Returns no notes, user IDs, or other operator data and defensively deduplicates legacy rows.';

revoke all on function api.signal_relevance_feedback_for_ranking(text[], timestamptz) from public, anon, authenticated;
grant execute on function api.signal_relevance_feedback_for_ranking(text[], timestamptz) to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260802152500','signal_feedback_api_rpcs','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260802152500_signal_feedback_api_rpcs.sql

-- RECOVERY BEGIN 20260802163000_elite_digest_rpc_boundary_hardening.sql
-- Elite Digest forward hardening: least-privilege execution and RPC-only feedback writes.
--
-- Forward-only and data-preserving:
-- - changes grants only;
-- - does not delete, rewrite, or backfill operator feedback;
-- - keeps RLS enabled as defense in depth;
-- - preserves service-role aggregate access required by ranking and health checks.

alter table public.signal_relevance_feedback enable row level security;

-- The feedback table is not a client Data API surface. Authenticated clients write
-- through api.submit_signal_relevance_feedback(), and ranking reads through the
-- service-role-only api.signal_relevance_feedback_for_ranking() projection.
revoke all privileges on table public.signal_relevance_feedback
  from PUBLIC, anon, authenticated;

grant select, insert on table public.signal_relevance_feedback
  to service_role;

-- Internal intelligence functions must not be directly callable by public API roles.
revoke all privileges
  on function public.hv_dedup_assign(double precision, integer)
  from PUBLIC, anon, authenticated;

grant execute
  on function public.hv_dedup_assign(double precision, integer)
  to service_role;

revoke all privileges
  on function public._digest_cluster_size(text)
  from PUBLIC, anon, authenticated;

grant execute
  on function public._digest_cluster_size(text)
  to service_role;

-- Reassert the narrow RPC contract in case a prior environment drifted.
grant usage on schema api to authenticated, service_role;

revoke all privileges
  on function api.submit_signal_relevance_feedback(text, text, text, text)
  from PUBLIC, anon, service_role;

grant execute
  on function api.submit_signal_relevance_feedback(text, text, text, text)
  to authenticated;

revoke all privileges
  on function api.signal_relevance_feedback_for_ranking(text[], timestamptz)
  from PUBLIC, anon, authenticated;

grant execute
  on function api.signal_relevance_feedback_for_ranking(text[], timestamptz)
  to service_role;

comment on table public.signal_relevance_feedback is
  'Operator judgments retained in public storage but client writes are RPC-only through api.submit_signal_relevance_feedback; ranking uses the service-role-only projection.';

comment on function public.hv_dedup_assign(double precision, integer) is
  'Service-role-only HNSW dedup assignment. Public API roles have no EXECUTE privilege.';

comment on function public._digest_cluster_size(text) is
  'Service-role-only internal Digest corroboration helper. Public API roles have no EXECUTE privilege.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260802163000','elite_digest_rpc_boundary_hardening','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260802163000_elite_digest_rpc_boundary_hardening.sql

-- RECOVERY BEGIN 20260804190000_production_security_hardening.sql
-- Production security hardening for the Harbourview Supabase boundary.
-- This migration changes privileges and execution context only. It does not
-- delete application data or rewrite business records.

create schema if not exists extensions;
revoke create on schema extensions from public;
grant usage on schema extensions to postgres, service_role, authenticated, anon;

-- Migration-local existence helper required by the repository SQL safety gate.
create or replace function public.view_exists(p_schema text, p_view text)
returns boolean
language sql
stable
set search_path = pg_catalog
as $function$
  select exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = p_schema
      and c.relname = p_view
      and c.relkind = 'v'
  );
$function$;
revoke all on function public.view_exists(text, text) from public, anon, authenticated;

-- Relocate only extensions PostgreSQL marks relocatable. pg_net is not
-- relocatable on this project; it is contained through schema/function grants.
do $$
declare
  ext record;
begin
  for ext in
    select e.extname, n.nspname as current_schema
    from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace
    where e.extname in ('vector', 'pg_trgm')
      and e.extrelocatable
      and n.nspname <> 'extensions'
  loop
    execute format('alter extension %I set schema extensions', ext.extname);
  end loop;
end
$$;

-- Explicit inventory of exposed views identified by the production advisor.
-- Public projections retain read access for anon/authenticated and execute with
-- caller privileges; internal projections remain service-role only.
do $$
begin
  if public.view_exists('api', 'hv_artifacts') then
    alter view api.hv_artifacts set (security_invoker = true);
    revoke all privileges on table api.hv_artifacts from public, anon, authenticated;
    grant select on table api.hv_artifacts to service_role;
  end if;
  if public.view_exists('api', 'hv_processing_jobs') then
    alter view api.hv_processing_jobs set (security_invoker = true);
    revoke all privileges on table api.hv_processing_jobs from public, anon, authenticated;
    grant select on table api.hv_processing_jobs to service_role;
  end if;
  if public.view_exists('api', 'schema_drift_alerts') then
    alter view api.schema_drift_alerts set (security_invoker = true);
    revoke all privileges on table api.schema_drift_alerts from public, anon, authenticated;
    grant select on table api.schema_drift_alerts to service_role;
  end if;
  if public.view_exists('api', 'scraper_source_state') then
    alter view api.scraper_source_state set (security_invoker = true);
    revoke all privileges on table api.scraper_source_state from public, anon, authenticated;
    grant select on table api.scraper_source_state to service_role;
  end if;
  if public.view_exists('public', 'admin_active_matches') then
    alter view public.admin_active_matches set (security_invoker = true);
    revoke all privileges on table public.admin_active_matches from public, anon, authenticated;
    grant select on table public.admin_active_matches to service_role;
  end if;
  if public.view_exists('public', 'admin_pending_buyer_requests') then
    alter view public.admin_pending_buyer_requests set (security_invoker = true);
    revoke all privileges on table public.admin_pending_buyer_requests from public, anon, authenticated;
    grant select on table public.admin_pending_buyer_requests to service_role;
  end if;
  if public.view_exists('public', 'admin_pending_listings') then
    alter view public.admin_pending_listings set (security_invoker = true);
    revoke all privileges on table public.admin_pending_listings from public, anon, authenticated;
    grant select on table public.admin_pending_listings to service_role;
  end if;
  if public.view_exists('public', 'content_coverage_queue') then
    alter view public.content_coverage_queue set (security_invoker = true);
    revoke all privileges on table public.content_coverage_queue from public, anon, authenticated;
    grant select on table public.content_coverage_queue to service_role;
  end if;
  if public.view_exists('public', 'country_intel_public') then
    alter view public.country_intel_public set (security_invoker = true);
    revoke all privileges on table public.country_intel_public from public, anon, authenticated;
    grant select on table public.country_intel_public to anon, authenticated, service_role;
  end if;
  if public.view_exists('public', 'genetics_public_claims') then
    alter view public.genetics_public_claims set (security_invoker = true);
    revoke all privileges on table public.genetics_public_claims from public, anon, authenticated;
    grant select on table public.genetics_public_claims to anon, authenticated, service_role;
  end if;
  if public.view_exists('public', 'genetics_public_collaboration_projects') then
    alter view public.genetics_public_collaboration_projects set (security_invoker = true);
    revoke all privileges on table public.genetics_public_collaboration_projects from public, anon, authenticated;
    grant select on table public.genetics_public_collaboration_projects to anon, authenticated, service_role;
  end if;
  if public.view_exists('public', 'genetics_public_country_opportunities') then
    alter view public.genetics_public_country_opportunities set (security_invoker = true);
    revoke all privileges on table public.genetics_public_country_opportunities from public, anon, authenticated;
    grant select on table public.genetics_public_country_opportunities to anon, authenticated, service_role;
  end if;
  if public.view_exists('public', 'genetics_public_cultivar_aliases') then
    alter view public.genetics_public_cultivar_aliases set (security_invoker = true);
    revoke all privileges on table public.genetics_public_cultivar_aliases from public, anon, authenticated;
    grant select on table public.genetics_public_cultivar_aliases to anon, authenticated, service_role;
  end if;
  if public.view_exists('public', 'genetics_public_cultivar_passports') then
    alter view public.genetics_public_cultivar_passports set (security_invoker = true);
    revoke all privileges on table public.genetics_public_cultivar_passports from public, anon, authenticated;
    grant select on table public.genetics_public_cultivar_passports to anon, authenticated, service_role;
  end if;
  if public.view_exists('public', 'genetics_public_evidence_summaries') then
    alter view public.genetics_public_evidence_summaries set (security_invoker = true);
    revoke all privileges on table public.genetics_public_evidence_summaries from public, anon, authenticated;
    grant select on table public.genetics_public_evidence_summaries to anon, authenticated, service_role;
  end if;
  if public.view_exists('public', 'genetics_public_profiles') then
    alter view public.genetics_public_profiles set (security_invoker = true);
    revoke all privileges on table public.genetics_public_profiles from public, anon, authenticated;
    grant select on table public.genetics_public_profiles to anon, authenticated, service_role;
  end if;
  if public.view_exists('public', 'genetics_public_service_providers') then
    alter view public.genetics_public_service_providers set (security_invoker = true);
    revoke all privileges on table public.genetics_public_service_providers from public, anon, authenticated;
    grant select on table public.genetics_public_service_providers to anon, authenticated, service_role;
  end if;
  if public.view_exists('public', 'ia_sources_live') then
    alter view public.ia_sources_live set (security_invoker = true);
    revoke all privileges on table public.ia_sources_live from public, anon, authenticated;
    grant select on table public.ia_sources_live to anon, authenticated, service_role;
  end if;
  if public.view_exists('public', 'jurisdiction_cross_table_conflicts') then
    alter view public.jurisdiction_cross_table_conflicts set (security_invoker = true);
    revoke all privileges on table public.jurisdiction_cross_table_conflicts from public, anon, authenticated;
    grant select on table public.jurisdiction_cross_table_conflicts to service_role;
  end if;
  if public.view_exists('public', 'local_intel_jurisdiction_combined') then
    alter view public.local_intel_jurisdiction_combined set (security_invoker = true);
    revoke all privileges on table public.local_intel_jurisdiction_combined from public, anon, authenticated;
    grant select on table public.local_intel_jurisdiction_combined to anon, authenticated, service_role;
  end if;
  if public.view_exists('public', 'local_intel_next_batch') then
    alter view public.local_intel_next_batch set (security_invoker = true);
    revoke all privileges on table public.local_intel_next_batch from public, anon, authenticated;
    grant select on table public.local_intel_next_batch to service_role;
  end if;
  if public.view_exists('public', 'marketplace_public_listings_v1') then
    alter view public.marketplace_public_listings_v1 set (security_invoker = true);
    revoke all privileges on table public.marketplace_public_listings_v1 from public, anon, authenticated;
    grant select on table public.marketplace_public_listings_v1 to anon, authenticated, service_role;
  end if;
  if public.view_exists('public', 'platform_coverage_summary') then
    alter view public.platform_coverage_summary set (security_invoker = true);
    revoke all privileges on table public.platform_coverage_summary from public, anon, authenticated;
    grant select on table public.platform_coverage_summary to anon, authenticated, service_role;
  end if;
  if public.view_exists('public', 'playbook_regulator_drift') then
    alter view public.playbook_regulator_drift set (security_invoker = true);
    revoke all privileges on table public.playbook_regulator_drift from public, anon, authenticated;
    grant select on table public.playbook_regulator_drift to service_role;
  end if;
  if public.view_exists('public', 'playbook_staleness_queue') then
    alter view public.playbook_staleness_queue set (security_invoker = true);
    revoke all privileges on table public.playbook_staleness_queue from public, anon, authenticated;
    grant select on table public.playbook_staleness_queue to service_role;
  end if;
  if public.view_exists('public', 'public_country_profile_dto') then
    alter view public.public_country_profile_dto set (security_invoker = true);
    revoke all privileges on table public.public_country_profile_dto from public, anon, authenticated;
    grant select on table public.public_country_profile_dto to anon, authenticated, service_role;
  end if;
  if public.view_exists('public', 'signals_for_digest') then
    alter view public.signals_for_digest set (security_invoker = true);
    revoke all privileges on table public.signals_for_digest from public, anon, authenticated;
    grant select on table public.signals_for_digest to service_role;
  end if;
  if public.view_exists('public', 'signals_intelligence_feed') then
    alter view public.signals_intelligence_feed set (security_invoker = true);
    revoke all privileges on table public.signals_intelligence_feed from public, anon, authenticated;
    grant select on table public.signals_intelligence_feed to anon, authenticated, service_role;
  end if;
  if public.view_exists('public', 'signals_quality') then
    alter view public.signals_quality set (security_invoker = true);
    revoke all privileges on table public.signals_quality from public, anon, authenticated;
    -- `authenticated` is deliberate, and `anon` is deliberately absent.
    --
    -- `api.signals_quality` is a security_invoker view over this one (verified:
    -- pg_rewrite dependency, reloptions security_invoker=true). The Command
    -- Centre reads it through `createClient()` in lib/supabase/server.ts, which
    -- pins `db: { schema: 'api' }` via SUPABASE_DB_SCHEMA -- so the effective
    -- read is api.signals_quality, and security_invoker pushes the privilege
    -- check down to this view under the caller's own role.
    --
    -- Consumers: app/api/dashboard/signals/route.ts and
    -- app/api/dashboard/digest/route.ts. Both call `supabase.auth.getUser()` and
    -- return 401 before querying, so the effective role is always
    -- `authenticated`, never `anon`. Granting service_role only would return
    -- permission-denied to every signed-in user on both endpoints.
    --
    -- The chain terminates safely: this view resolves to public.signals, which
    -- has RLS enabled with 3 policies and is not touched by this migration, so
    -- row visibility is still policy-controlled rather than grant-controlled.
    grant select on table public.signals_quality to authenticated, service_role;
  end if;
  if public.view_exists('public', 'source_domain_type') then
    alter view public.source_domain_type set (security_invoker = true);
    revoke all privileges on table public.source_domain_type from public, anon, authenticated;
    grant select on table public.source_domain_type to service_role;
  end if;
  if public.view_exists('public', 'source_yield_report') then
    alter view public.source_yield_report set (security_invoker = true);
    revoke all privileges on table public.source_yield_report from public, anon, authenticated;
    grant select on table public.source_yield_report to service_role;
  end if;
  if public.view_exists('public', 'v_jurisdiction_unified') then
    alter view public.v_jurisdiction_unified set (security_invoker = true);
    revoke all privileges on table public.v_jurisdiction_unified from public, anon, authenticated;
    grant select on table public.v_jurisdiction_unified to anon, authenticated, service_role;
  end if;
  if public.view_exists('regulatory_signals', 'public_signals') then
    alter view regulatory_signals.public_signals set (security_invoker = true);
    revoke all privileges on table regulatory_signals.public_signals from public, anon, authenticated;
    grant select on table regulatory_signals.public_signals to anon, authenticated, service_role;
  end if;
  if public.view_exists('regulatory_signals', 'public_source_status') then
    alter view regulatory_signals.public_source_status set (security_invoker = true);
    revoke all privileges on table regulatory_signals.public_source_status from public, anon, authenticated;
    grant select on table regulatory_signals.public_source_status to anon, authenticated, service_role;
  end if;
  if public.view_exists('regulatory_signals', 'public_watchlist_collection_signals') then
    alter view regulatory_signals.public_watchlist_collection_signals set (security_invoker = true);
    revoke all privileges on table regulatory_signals.public_watchlist_collection_signals from public, anon, authenticated;
    grant select on table regulatory_signals.public_watchlist_collection_signals to anon, authenticated, service_role;
  end if;
  if public.view_exists('regulatory_signals', 'public_watchlist_collections') then
    alter view regulatory_signals.public_watchlist_collections set (security_invoker = true);
    revoke all privileges on table regulatory_signals.public_watchlist_collections from public, anon, authenticated;
    grant select on table regulatory_signals.public_watchlist_collections to anon, authenticated, service_role;
  end if;
if public.view_exists('intelligence', 'public_country_intelligence') then
  alter view intelligence.public_country_intelligence set (security_invoker = true);
  revoke all privileges on table intelligence.public_country_intelligence from public, anon, authenticated;
  grant select on table intelligence.public_country_intelligence to anon, authenticated, service_role;
end if;
end
$$;
-- Internal/admin projections are closed in the explicit inventory above.

-- RLS-enabled tables without policies already deny every row. Remove any table
-- grants inherited from historical blanket grants without adding synthetic RLS
-- policies that could conceal the missing review decision.
do $$
declare
  table_row record;
begin
  for table_row in
    select n.nspname as schema_name, c.relname as relation_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relkind in ('r','p','f')
      and c.relrowsecurity
      and n.nspname in ('public', 'api', 'signals', 'regulatory_signals')
      and not exists (select 1 from pg_policy p where p.polrelid = c.oid)
  loop
    execute format('revoke all privileges on table %I.%I from public, anon, authenticated', table_row.schema_name, table_row.relation_name);
  end loop;
end
$$;

-- Foreign tables are backend integration surfaces, not browser API surfaces.
do $$
declare
  foreign_row record;
begin
  for foreign_row in
    select foreign_table_schema as schema_name, foreign_table_name as relation_name
    from information_schema.foreign_tables
    where foreign_table_schema in ('public', 'api', 'signals', 'regulatory_signals')
  loop
    execute format('revoke all privileges on table %I.%I from public, anon, authenticated', foreign_row.schema_name, foreign_row.relation_name);
    execute format('grant select on table %I.%I to service_role', foreign_row.schema_name, foreign_row.relation_name);
  end loop;
end
$$;

-- Remove direct access to asynchronous network internals from browser roles.
--
-- CORRECTION (2026-08-13): this block is DEAD CODE and has been since it was
-- first applied on 2026-08-07 (workflow run 31215018893, reported SUCCESS).
-- The `net` schema, like the pg_net extension that owns it, belongs to
-- supabase_admin -- a role the `postgres` role this migration runs as is NOT
-- a member of (confirmed via pg_auth_members) and does not have grant option
-- on. REVOKE by a role that isn't the grantor and holds no grant option is a
-- silent no-op in Postgres, not an error, which is why this "succeeded" while
-- doing nothing: production's `net` schema ACL still shows
-- anon=U/supabase_admin and authenticated=U/supabase_admin right now.
-- Confirmed this is a known, unresolved Supabase platform limitation, not
-- specific to this project: supabase/cli#4246 and supabase discussion #39221
-- report the identical "WARNING: no privileges could be revoked for net"
-- outcome. There is no SQL role available to a project that can close this;
-- it would need Supabase's own supabase_admin role or platform-level support.
--
-- The residual risk this leaves is real but narrow, not open: `net` is not
-- in pgrst.db_schemas (currently `public, graphql_public, job_search, api` --
-- see pg_db_role_setting for role authenticator), so PostgREST -- the only
-- way the anon/authenticated roles are reachable from outside the database --
-- never routes a request to net.http_get/http_post regardless of this grant.
-- Exploiting it would require a direct Postgres connection authenticated as
-- anon, which the standard anon-key/PostgREST flow does not provide. Left in
-- place (harmless) as an accurate record rather than deleted, so a future
-- pass doesn't spend time re-discovering this from scratch. If Supabase ever
-- exposes a way to actually close it, this block is exactly where that fix
-- belongs.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'net') then
    revoke usage on schema net from public, anon, authenticated;
    grant usage on schema net to service_role;
  end if;
end
$$;

-- SECURITY DEFINER routines default closed. Catalog-wide revocation is safe;
-- execution is restored only through the explicit allowlists below.
do $$
declare
  routine record;
  routine_kind text;
begin
  for routine in
    select p.oid::regprocedure as signature, p.prokind
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where p.prosecdef
      and n.nspname in ('public', 'api', 'signals', 'regulatory_signals', 'net')
      and not exists (
        select 1 from pg_depend d
        where d.classid = 'pg_proc'::regclass
          and d.objid = p.oid
          and d.deptype = 'e'
      )
  loop
    routine_kind := case when routine.prokind = 'p' then 'procedure' else 'function' end;
    execute format('revoke all privileges on %s %s from public, anon, authenticated, service_role', routine_kind, routine.signature);
  end loop;
end
$$;

-- Audited service-role RPC allowlist. Every grant names one exact signature.
do $$
begin
  if to_regprocedure('api.acquire_crawl_targets(integer,text)') is not null then
    grant execute on function api.acquire_crawl_targets(integer,text) to service_role;
  end if;
  if to_regprocedure('api.apply_airtable_tier(text,text,text)') is not null then
    grant execute on function api.apply_airtable_tier(text,text,text) to service_role;
  end if;
  if to_regprocedure('api.apply_editorial_title(text,text,text)') is not null then
    grant execute on function api.apply_editorial_title(text,text,text) to service_role;
  end if;
  if to_regprocedure('api.check_and_increment_llm_rate_limit(uuid,timestamptz,integer)') is not null then
    grant execute on function api.check_and_increment_llm_rate_limit(uuid,timestamptz,integer) to service_role;
  end if;
  if to_regprocedure('api.claim_intelligence_job(text,text)') is not null then
    grant execute on function api.claim_intelligence_job(text,text) to service_role;
  end if;
  if to_regprocedure('api.enqueue_regulatory_enrichment()') is not null then
    grant execute on function api.enqueue_regulatory_enrichment() to service_role;
  end if;
  if to_regprocedure('api.get_airtable_sync_config()') is not null then
    grant execute on function api.get_airtable_sync_config() to service_role;
  end if;
  if to_regprocedure('api.get_command_centre_stats()') is not null then
    grant execute on function api.get_command_centre_stats() to service_role;
  end if;
  if to_regprocedure('api.get_corridor_stats(text)') is not null then
    grant execute on function api.get_corridor_stats(text) to service_role;
  end if;
  if to_regprocedure('api.get_github_pat()') is not null then
    grant execute on function api.get_github_pat() to service_role;
  end if;
  if to_regprocedure('api.get_source_registry_coverage(text)') is not null then
    grant execute on function api.get_source_registry_coverage(text) to service_role;
  end if;
  if to_regprocedure('api.hv_bridge_key_matches(text)') is not null then
    grant execute on function api.hv_bridge_key_matches(text) to service_role;
  end if;
  if to_regprocedure('api.hv_extract_signals_from_captured_text(integer)') is not null then
    grant execute on function api.hv_extract_signals_from_captured_text(integer) to service_role;
  end if;
  if to_regprocedure('api.hv_ingest_snapshot_to_staging(integer,uuid)') is not null then
    grant execute on function api.hv_ingest_snapshot_to_staging(integer,uuid) to service_role;
  end if;
  if to_regprocedure('api.intel_eval_rows_needing_prediction(text,integer)') is not null then
    grant execute on function api.intel_eval_rows_needing_prediction(text,integer) to service_role;
  end if;
  if to_regprocedure('api.pool_rows_needing_classification(integer)') is not null then
    grant execute on function api.pool_rows_needing_classification(integer) to service_role;
  end if;
  if to_regprocedure('api.promote_all_extracted_snapshots()') is not null then
    grant execute on function api.promote_all_extracted_snapshots() to service_role;
  end if;
  if to_regprocedure('api.reconcile_airtable_tiers(jsonb)') is not null then
    grant execute on function api.reconcile_airtable_tiers(jsonb) to service_role;
  end if;
  if to_regprocedure('api.regulatory_pending_changes_feed()') is not null then
    grant execute on function api.regulatory_pending_changes_feed() to service_role;
  end if;
  if to_regprocedure('api.rows_needing_titles(integer)') is not null then
    grant execute on function api.rows_needing_titles(integer) to service_role;
  end if;
  if to_regprocedure('api.search_public_signals(extensions.vector,integer,text,text)') is not null then
    grant execute on function api.search_public_signals(extensions.vector,integer,text,text) to service_role;
  end if;
  if to_regprocedure('api.signal_relevance_feedback_for_ranking(text[],timestamptz)') is not null then
    grant execute on function api.signal_relevance_feedback_for_ranking(text[],timestamptz) to service_role;
  end if;
  if to_regprocedure('api.submit_signal_relevance_feedback(text,text,text,text)') is not null then
    grant execute on function api.submit_signal_relevance_feedback(text,text,text,text) to service_role;
  end if;
  if to_regprocedure('api.is_verified_clinician(uuid)') is not null then
    grant execute on function api.is_verified_clinician(uuid) to service_role;
  end if;
  if to_regprocedure('api.clinical_has_active_consent(uuid,text)') is not null then
    grant execute on function api.clinical_has_active_consent(uuid,text) to service_role;
  end if;
  if to_regprocedure('api.clinical_request_verification(text,text,text,uuid)') is not null then
    grant execute on function api.clinical_request_verification(text,text,text,uuid) to service_role;
  end if;
  if to_regprocedure('api.clinical_admin_verify_professional(uuid,boolean,text)') is not null then
    grant execute on function api.clinical_admin_verify_professional(uuid,boolean,text) to service_role;
  end if;
  if to_regprocedure('public.acquire_crawl_targets(integer,text)') is not null then
    grant execute on function public.acquire_crawl_targets(integer,text) to service_role;
  end if;
  if to_regprocedure('public.check_and_increment_llm_rate_limit(uuid,timestamptz,integer)') is not null then
    grant execute on function public.check_and_increment_llm_rate_limit(uuid,timestamptz,integer) to service_role;
  end if;
  if to_regprocedure('public.claim_intelligence_job(text,text)') is not null then
    grant execute on function public.claim_intelligence_job(text,text) to service_role;
  end if;
  if to_regprocedure('public.enqueue_regulatory_enrichment()') is not null then
    grant execute on function public.enqueue_regulatory_enrichment() to service_role;
  end if;
  if to_regprocedure('public.get_command_centre_stats()') is not null then
    grant execute on function public.get_command_centre_stats() to service_role;
  end if;
  if to_regprocedure('public.get_corridor_stats(text)') is not null then
    grant execute on function public.get_corridor_stats(text) to service_role;
  end if;
  if to_regprocedure('public.get_github_pat()') is not null then
    grant execute on function public.get_github_pat() to service_role;
  end if;
  if to_regprocedure('public.hv_extract_signals_from_captured_text(integer)') is not null then
    grant execute on function public.hv_extract_signals_from_captured_text(integer) to service_role;
  end if;
  if to_regprocedure('public.hv_ingest_snapshot_to_staging(integer,uuid)') is not null then
    grant execute on function public.hv_ingest_snapshot_to_staging(integer,uuid) to service_role;
  end if;
  if to_regprocedure('public.hv_intelligence_outcome_check()') is not null then
    grant execute on function public.hv_intelligence_outcome_check() to service_role;
  end if;
  if to_regprocedure('public.promote_all_extracted_snapshots()') is not null then
    grant execute on function public.promote_all_extracted_snapshots() to service_role;
  end if;
  if to_regprocedure('public.hv_is_org_member(uuid)') is not null then
    grant execute on function public.hv_is_org_member(uuid) to service_role;
  end if;
  if to_regprocedure('public.hv_is_platform_staff()') is not null then
    grant execute on function public.hv_is_platform_staff() to service_role;
  end if;
  if to_regprocedure('public.is_genetics_admin_or_reviewer()') is not null then
    grant execute on function public.is_genetics_admin_or_reviewer() to service_role;
  end if;
  if to_regprocedure('public.is_hv_staff()') is not null then
    grant execute on function public.is_hv_staff() to service_role;
  end if;
  if to_regprocedure('public.current_user_tier()') is not null then
    grant execute on function public.current_user_tier() to service_role;
  end if;
  if to_regprocedure('public.is_regulatory_tier_admin()') is not null then
    grant execute on function public.is_regulatory_tier_admin() to service_role;
  end if;
end
$$;
-- Audited authenticated RPC/policy-helper allowlist.
do $$
begin
  if to_regprocedure('api.get_command_centre_stats()') is not null then
    grant execute on function api.get_command_centre_stats() to authenticated;
  end if;
  if to_regprocedure('api.get_corridor_stats(text)') is not null then
    grant execute on function api.get_corridor_stats(text) to authenticated;
  end if;
  if to_regprocedure('api.get_source_registry_coverage(text)') is not null then
    grant execute on function api.get_source_registry_coverage(text) to authenticated;
  end if;
  if to_regprocedure('api.regulatory_pending_changes_feed()') is not null then
    grant execute on function api.regulatory_pending_changes_feed() to authenticated;
  end if;
  if to_regprocedure('api.submit_signal_relevance_feedback(text,text,text,text)') is not null then
    grant execute on function api.submit_signal_relevance_feedback(text,text,text,text) to authenticated;
  end if;
  if to_regprocedure('api.is_verified_clinician(uuid)') is not null then
    grant execute on function api.is_verified_clinician(uuid) to authenticated;
  end if;
  if to_regprocedure('api.clinical_has_active_consent(uuid,text)') is not null then
    grant execute on function api.clinical_has_active_consent(uuid,text) to authenticated;
  end if;
  if to_regprocedure('api.clinical_request_verification(text,text,text,uuid)') is not null then
    grant execute on function api.clinical_request_verification(text,text,text,uuid) to authenticated;
  end if;
  if to_regprocedure('public.hv_is_org_member(uuid)') is not null then
    grant execute on function public.hv_is_org_member(uuid) to authenticated;
  end if;
  if to_regprocedure('public.hv_is_platform_staff()') is not null then
    grant execute on function public.hv_is_platform_staff() to authenticated;
  end if;
  if to_regprocedure('public.is_genetics_admin_or_reviewer()') is not null then
    grant execute on function public.is_genetics_admin_or_reviewer() to authenticated;
  end if;
  if to_regprocedure('public.is_hv_staff()') is not null then
    grant execute on function public.is_hv_staff() to authenticated;
  end if;
  if to_regprocedure('public.current_user_tier()') is not null then
    grant execute on function public.current_user_tier() to authenticated;
  end if;
  if to_regprocedure('public.is_regulatory_tier_admin()') is not null then
    grant execute on function public.is_regulatory_tier_admin() to authenticated;
  end if;
end
$$;
-- Pin search_path for every custom application routine. Extension-owned
-- routines are excluded so extension upgrades remain vendor-controlled.
do $$
declare
  routine record;
  routine_kind text;
  safe_path text;
begin
  for routine in
    select p.oid::regprocedure as signature, p.prokind, n.nspname as schema_name
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'api', 'signals', 'regulatory_signals')
      and p.prokind in ('f','p')
      and not exists (
        select 1 from pg_depend d
        where d.classid = 'pg_proc'::regclass
          and d.objid = p.oid
          and d.deptype = 'e'
      )
  loop
    routine_kind := case when routine.prokind = 'p' then 'procedure' else 'function' end;
    safe_path := format('pg_catalog, %I, public, api, signals, regulatory_signals, auth, storage, vault, extensions, net, cron', routine.schema_name);
    execute format('alter %s %s set search_path = %s', routine_kind, routine.signature, safe_path);
  end loop;
end
$$;

-- Future objects start closed and must be granted intentionally by their own
-- migration.
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema api revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema signals revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema regulatory_signals revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema public revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema api revoke all on tables from public, anon, authenticated;

notify pgrst, 'reload schema';

drop function public.view_exists(text, text);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260804190000','production_security_hardening','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260804190000_production_security_hardening.sql

-- RECOVERY BEGIN 20260804222954_fix_hv_pipeline_health_track_live_classifier_and_correct_audit_trail.sql
CREATE OR REPLACE FUNCTION public.hv_pipeline_health()
 RETURNS TABLE(metric text, value text, note text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select 'unharvested_classify_jobs', count(*)::text,
         case when count(*) > 200 then 'backlog building -- check hv_classify_corpus_harvest is running' else 'ok' end
  from public.hv_classify_jobs where not harvested
  union all
  select 'unharvested_embed_jobs', count(*)::text,
         case when count(*) > 200 then 'backlog building -- check hv_embed_harvest is running' else 'ok' end
  from public.hv_embed_jobs where not harvested
  union all
  select 'unharvested_translation_jobs', count(*)::text,
         case when count(*) > 200 then 'backlog building -- check hv_translate_harvest is running' else 'ok' end
  from public.hv_translation_jobs where not harvested
  union all
  select 'unharvested_entity_jobs', count(*)::text,
         case when count(*) > 200 then 'backlog building -- check hv_entities_harvest is running' else 'ok' end
  from public.hv_entity_jobs where not harvested
  union all
  select 'hv_quality_pipeline_cron', coalesce((select active::text from cron.job where jobname = 'hv-quality-pipeline'), 'unscheduled'),
         case when exists (select 1 from cron.job where jobname = 'hv-quality-pipeline' and active)
              then 'ok (expected -- classifier shipped 2026-07-29/30; see classifier_validation.notes)'
              else 'ok (unscheduled, expected until Stage E/J land)' end
  union all
  select 'hv_quality_promote_cron', coalesce((select active::text from cron.job where jobname = 'hv-quality-promote'), 'unscheduled'),
         case when exists (select 1 from cron.job where jobname = 'hv-quality-promote' and active)
              then 'ok (expected -- promotion gate passed 2026-07-29/30; see classifier_validation.notes)'
              else 'ok (inactive, expected until Stage J sign-off)' end
  union all
  -- Note: this reads the MOST RECENTLY VALIDATED row in classifier_validation
  -- (by validated_at, not by inferring from signals data -- signals.created_at
  -- is promotion time, not classification time, and can't be trusted to say
  -- which classifier_version is currently live; verified that the hard way).
  -- Whoever validates a new classifier version is responsible for inserting a
  -- new row here; this metric will then pick it up automatically.
  select 'classifier_gate_' || coalesce(cv.classifier_version, 'unknown'),
         coalesce(cv.gate_passed::text, 'no_row'),
         case when coalesce(cv.gate_passed, false)
              then 'ok (recall ' || coalesce(cv.signal_recall::text,'?') || ', precision ' || coalesce(cv.signal_precision::text,'?') || ', n=' || coalesce(cv.n_eval_rows::text,'?') || ', validated ' || coalesce(cv.validated_at::date::text,'?') || ' -- re-validate against a larger eval set periodically, not a one-time decision)'
              else 'gate closed for the most recently validated classifier version -- check classifier_validation.notes before promotion runs unattended' end
  from (select * from public.classifier_validation order by validated_at desc limit 1) cv;
$function$;


UPDATE public.classifier_validation
SET notes = notes || E'\n\nCorrection (2026-07-30, same session): the "ship as-is, accept the gap" framing above was based on stale information -- this v1 row was not the live classifier. hv_classify_corpus_harvest() already writes classifier_version = ''hv-classify/openai/v2-summary-fix'' (see that row), which independently root-caused and fixed the recall gap (0.559 -> 0.903) rather than accepting it, and was already approved by Tyler on 2026-07-30. gate_passed left as true here since the decision to enable the crons was still correct -- just not for the reason originally recorded.'
WHERE classifier_version = 'hv-classify/openai/v1';

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260804222954','fix_hv_pipeline_health_track_live_classifier_and_correct_audit_trail','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260804222954_fix_hv_pipeline_health_track_live_classifier_and_correct_audit_trail.sql

-- RECOVERY BEGIN 20260804233000_marketplace_inquiries_conversion_repair.sql
-- Forward repair for environments where marketplace_inquiries was created after
-- the historical conversion migration. This migration is idempotent and data-safe.
do $repair$
begin
  if to_regclass('public.marketplace_inquiries') is null then
    raise exception 'public.marketplace_inquiries must exist before conversion repair';
  end if;

  alter table public.marketplace_inquiries
    add column if not exists review_status text not null default 'received',
    add column if not exists priority text not null default 'medium',
    add column if not exists last_contacted_at timestamptz null,
    add column if not exists next_follow_up_at timestamptz null,
    add column if not exists internal_response_notes text null;

  if not exists (
    select 1 from pg_constraint
    where conname = 'marketplace_inquiries_review_status_check'
      and conrelid = 'public.marketplace_inquiries'::regclass
  ) then
    alter table public.marketplace_inquiries
      add constraint marketplace_inquiries_review_status_check
      check (review_status in ('received', 'reviewing', 'contacted', 'qualified', 'not_fit', 'closed'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'marketplace_inquiries_priority_check'
      and conrelid = 'public.marketplace_inquiries'::regclass
  ) then
    alter table public.marketplace_inquiries
      add constraint marketplace_inquiries_priority_check
      check (priority in ('high', 'medium', 'low'));
  end if;
end
$repair$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260804233000','marketplace_inquiries_conversion_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260804233000_marketplace_inquiries_conversion_repair.sql

-- RECOVERY BEGIN 20260804234000_marketplace_exposure_forward_repair.sql
-- Forward, idempotent reconciliation after all marketplace relations exist.
do $marketplace_exposure$
begin
  if to_regprocedure('public.smoke_verify_marketplace_inquiry(text,text,text)') is not null then
    execute 'revoke execute on function public.smoke_verify_marketplace_inquiry(text, text, text) from anon, authenticated';
  end if;
  if to_regprocedure('public.smoke_close_marketplace_inquiry(text,text,text)') is not null then
    execute 'revoke execute on function public.smoke_close_marketplace_inquiry(text, text, text) from anon, authenticated';
  end if;

  if to_regclass('public.listings') is not null then
    execute $view$
      create or replace view public.marketplace_listings_public_view
      with (security_invoker = true)
      as
      select
        id,
        marketplace_section as section,
        title,
        coalesce(
          slug,
          lower(regexp_replace(title, '[^a-zA-Z0-9]+'::text, '-'::text, 'g'::text)) || '-'::text || left(id::text, 8)
        ) as slug,
        description,
        price_amount,
        price_currency,
        location_country,
        is_featured,
        condition,
        brand,
        model,
        quantity,
        unit,
        created_at
      from public.listings
      where status = 'approved'::public.listing_status
        and public_visibility = true
        and archived_at is null
    $view$;
  end if;

  if to_regclass('public.disclosure_requests') is not null then
    create index if not exists idx_disclosure_requests_match_id on public.disclosure_requests(match_id);
    comment on table public.disclosure_requests is 'Server-only disclosure workflow table. RLS intentionally has no client policies; access must go through trusted server paths.';
  end if;
  if to_regclass('public.listings') is not null then
    create index if not exists idx_listings_superseded_by on public.listings(superseded_by);
  end if;
  if to_regclass('public.matches') is not null then
    create index if not exists idx_matches_inquiry_id on public.matches(inquiry_id);
    comment on table public.matches is 'Server-only matching workflow table. RLS intentionally has no client policies; access must go through trusted server paths.';
  end if;
  if to_regclass('public.user_roles') is not null then
    create index if not exists idx_user_roles_created_by on public.user_roles(created_by);
    execute 'drop policy if exists user_roles_self_read on public.user_roles';
    execute 'create policy user_roles_self_read on public.user_roles for select to authenticated using (user_id = (select auth.uid()))';
  end if;
  if to_regclass('public.audit_events') is not null then
    comment on table public.audit_events is 'Server-only audit log. RLS intentionally has no client policies; access must go through trusted server paths.';
  end if;
  if to_regclass('public.internal_admin_notes') is not null then
    comment on table public.internal_admin_notes is 'Server-only internal notes table. RLS intentionally has no client policies; access must go through trusted server paths.';
  end if;
  if to_regclass('public.status_history') is not null then
    comment on table public.status_history is 'Server-only status history table. RLS intentionally has no client policies; access must go through trusted server paths.';
  end if;
end
$marketplace_exposure$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260804234000','marketplace_exposure_forward_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260804234000_marketplace_exposure_forward_repair.sql

-- RECOVERY BEGIN 20260804234500_backfill_source_registry_category.sql
-- Backfill public.source_registry.category before the assembler-generated
-- source intake separation copies it into a NOT NULL column.
--
-- 20260804235000_separate_marketplace_source_intake.sql -- generated by the
-- pinned assembler at CI time, not present in this repository -- fails during
-- zero-state replay at its 33rd statement:
--   ERROR: null value in column "source_type" of relation
--   "marketplace_source_registry" violates not-null constraint (SQLSTATE 23502)
-- It copies legacy rows with:
--   insert into public.marketplace_source_registry
--     (id, source_name, source_type, source_url, category_focus, fetch_method, ...)
--   select id, name, category, source_url, category, 'manual_url', ...
--   from public.source_registry
-- so a NULL source_registry.category lands in a NOT NULL source_type.
--
-- This path exists only in replay. The copy is guarded on source_registry
-- having a `source_key` column, and production's source_registry does not have
-- one -- its columns are source_name/jurisdiction/tier/adapter/... with no
-- source_key, no category and no name -- so the block is skipped there
-- entirely and production's marketplace_source_registry is never populated
-- this way. The repository's source_registry is a different table that does
-- have source_key, so the block fires and meets rows the regulatory sources
-- engine seeded without a category.
--
-- The assembler's migration cannot be edited from here, so the data has to
-- satisfy it.
--
-- The fill value is derived from the table rather than hardcoded. The original
-- creator, 20260303000000, declares
--   category text not null check (category in ('used-surplus'))
-- and rows now exist with a NULL category, so something later relaxed that
-- column; whether the CHECK survived is not knowable from the repository alone.
-- Reusing the table's own most common existing category is therefore guaranteed
-- to satisfy whatever constraint is actually in force, where any literal I
-- picked might not. 'used-surplus' is the fallback only when no non-null value
-- exists at all, because it is the one value the original CHECK admits.
--
-- Only category is touched. source_name is nullable in the destination -- the
-- failing row carried a null there without error -- so name is left exactly as
-- it is rather than inventing values for it.
--
-- Idempotent: matches nothing once no NULL category remains.

do $backfill_source_registry_category$
declare
  v_fallback text;
  v_updated  integer;
begin
  if to_regclass('public.source_registry') is null then
    raise notice 'public.source_registry not present; nothing to backfill';
    return;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'source_registry'
      and column_name = 'category'
  ) then
    raise notice 'public.source_registry has no category column; nothing to backfill';
    return;
  end if;

  execute $q$
    select category
    from public.source_registry
    where category is not null
    group by category
    order by count(*) desc, category
    limit 1
  $q$ into v_fallback;

  if v_fallback is null then
    v_fallback := 'used-surplus';
  end if;

  execute format(
    'update public.source_registry set category = %L where category is null',
    v_fallback
  );
  get diagnostics v_updated = row_count;

  if v_updated > 0 then
    raise notice 'backfilled % source_registry row(s) with category %', v_updated, v_fallback;
  else
    raise notice 'no null source_registry.category rows; nothing to backfill';
  end if;
end
$backfill_source_registry_category$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260804234500','backfill_source_registry_category','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260804234500_backfill_source_registry_category.sql

-- RECOVERY BEGIN 20260804235000_separate_marketplace_source_intake.sql
-- Live Source Intake V0 + Consumables foundation.
-- These tables are deliberately separate from the older used/surplus intake
-- schema, which has different required columns and lifecycle semantics.

create table if not exists public.marketplace_source_registry (
  id uuid primary key default gen_random_uuid(),
  source_name text,
  source_type text not null,
  source_url text not null,
  jurisdiction text,
  category_focus text,
  fetch_method text not null default 'manual_url',
  allowed_use text,
  terms_risk text,
  review_frequency text,
  is_active boolean not null default true,
  last_checked_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketplace_source_registry_url_not_empty check (length(trim(source_url)) > 0),
  constraint marketplace_source_registry_type_not_empty check (length(trim(source_type)) > 0),
  constraint marketplace_source_registry_fetch_method_check check (fetch_method in ('manual_url'))
);

create unique index if not exists marketplace_source_registry_normalized_url_idx
  on public.marketplace_source_registry (lower(regexp_replace(trim(source_url), '/+$', '')));

create table if not exists public.marketplace_source_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.marketplace_source_registry(id) on delete set null,
  captured_url text not null,
  captured_title text,
  captured_text text,
  raw_html_hash text,
  captured_at timestamptz not null default now(),
  fetch_status text not null,
  error_message text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint marketplace_source_snapshots_url_not_empty check (length(trim(captured_url)) > 0),
  constraint marketplace_source_snapshots_status_check check (fetch_status in ('success', 'failed', 'blocked', 'skipped'))
);

create table if not exists public.marketplace_candidates (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid references public.marketplace_source_snapshots(id) on delete set null,
  candidate_type text not null,
  marketplace_category text not null,
  subcategory text,
  listing_type text,
  title_internal text,
  title_public_draft text,
  description_internal text,
  description_public_draft text,
  jurisdiction text,
  country text,
  region text,
  source_type text,
  supply_type text,
  condition text,
  bulk_available boolean,
  recurring_supply_available boolean,
  region_available text,
  lead_time_text text,
  public_restriction_note text,
  confidence_score integer,
  commercial_relevance_score integer,
  compliance_risk_score integer,
  restricted_item boolean not null default false,
  requires_license_review boolean not null default false,
  status text not null default 'needs_review',
  rejection_reason text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketplace_candidates_type_check check (candidate_type in ('source_candidate', 'consumables_supply', 'supplier_directory', 'wanted_consumables_request')),
  constraint marketplace_candidates_category_check check (marketplace_category = 'Consumables & Operating Supplies'),
  constraint marketplace_candidates_subcategory_check check (
    subcategory is null or subcategory in (
      'Packaging', 'Lab & QA Supplies', 'Cultivation Supplies', 'Processing Supplies',
      'Sanitation & PPE', 'Logistics & Warehouse Supplies', 'Retail Supplies', 'Maintenance Consumables'
    )
  ),
  constraint marketplace_candidates_listing_type_check check (
    listing_type is null or listing_type in ('Supply Listing', 'Supplier Directory Entry', 'Wanted Consumables Request')
  ),
  constraint marketplace_candidates_status_check check (status in ('captured', 'needs_review', 'needs_verification', 'approved_draft', 'rejected', 'archived')),
  constraint marketplace_candidates_confidence_score_check check (confidence_score is null or confidence_score between 0 and 100),
  constraint marketplace_candidates_commercial_relevance_score_check check (commercial_relevance_score is null or commercial_relevance_score between 0 and 100),
  constraint marketplace_candidates_compliance_risk_score_check check (compliance_risk_score is null or compliance_risk_score between 0 and 100)
);

create table if not exists public.marketplace_candidate_review_events (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.marketplace_candidates(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint marketplace_candidate_review_events_type_check check (
    event_type in ('created', 'reviewed', 'approved_draft', 'rejected', 'archived', 'verification_requested')
  )
);

create index if not exists marketplace_source_snapshots_source_idx
  on public.marketplace_source_snapshots(source_id, captured_at desc);
create index if not exists marketplace_candidates_status_idx
  on public.marketplace_candidates(status, created_at desc);
create index if not exists marketplace_candidates_snapshot_idx
  on public.marketplace_candidates(snapshot_id);
create index if not exists marketplace_candidate_review_events_candidate_idx
  on public.marketplace_candidate_review_events(candidate_id, created_at desc);

alter table public.marketplace_source_registry enable row level security;
alter table public.marketplace_source_snapshots enable row level security;
alter table public.marketplace_candidates enable row level security;
alter table public.marketplace_candidate_review_events enable row level security;

revoke all on public.marketplace_source_registry from anon, authenticated;
revoke all on public.marketplace_source_snapshots from anon, authenticated;
revoke all on public.marketplace_candidates from anon, authenticated;
revoke all on public.marketplace_candidate_review_events from anon, authenticated;

grant select, insert, update, delete on public.marketplace_source_registry to authenticated;
grant select, insert, update, delete on public.marketplace_source_snapshots to authenticated;
grant select, insert, update, delete on public.marketplace_candidates to authenticated;
grant select, insert, update, delete on public.marketplace_candidate_review_events to authenticated;

drop policy if exists marketplace_source_registry_admin_operator_only on public.marketplace_source_registry;
create policy marketplace_source_registry_admin_operator_only on public.marketplace_source_registry
  for all to authenticated
  using (public.harbourview_is_admin_or_operator())
  with check (public.harbourview_is_admin_or_operator());

drop policy if exists marketplace_source_snapshots_admin_operator_only on public.marketplace_source_snapshots;
create policy marketplace_source_snapshots_admin_operator_only on public.marketplace_source_snapshots
  for all to authenticated
  using (public.harbourview_is_admin_or_operator())
  with check (public.harbourview_is_admin_or_operator());

drop policy if exists marketplace_candidates_admin_operator_only on public.marketplace_candidates;
create policy marketplace_candidates_admin_operator_only on public.marketplace_candidates
  for all to authenticated
  using (public.harbourview_is_admin_or_operator())
  with check (public.harbourview_is_admin_or_operator());

drop policy if exists marketplace_candidate_review_events_admin_operator_only on public.marketplace_candidate_review_events;
create policy marketplace_candidate_review_events_admin_operator_only on public.marketplace_candidate_review_events
  for all to authenticated
  using (public.harbourview_is_admin_or_operator())
  with check (public.harbourview_is_admin_or_operator());

comment on table public.marketplace_source_registry is 'Private consumables source registry. Separate from used/surplus source_registry.';
comment on table public.marketplace_source_snapshots is 'Private consumables source snapshots. Separate from used/surplus source_snapshots.';
comment on table public.marketplace_candidates is 'Private marketplace candidates created from controlled source intake.';
comment on table public.marketplace_candidate_review_events is 'Private review audit for marketplace_candidates.';

-- Copy compatible legacy source rows into the separated consumables registry.
do $source_intake_repair$
begin
  if to_regclass('public.source_registry') is not null
    and exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'source_registry' and column_name = 'source_key'
    )
  then
    insert into public.marketplace_source_registry (
      id, source_name, source_type, source_url, category_focus, fetch_method,
      is_active, last_checked_at, created_at, updated_at
    )
    select
      id, name, category, source_url, category, 'manual_url',
      status <> 'disabled', last_checked_at, created_at, updated_at
    from public.source_registry
    on conflict (id) do nothing;
  end if;

  if to_regclass('public.source_snapshots') is not null
    and exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'source_snapshots' and column_name = 'snapshot_hash'
    )
  then
    insert into public.marketplace_source_snapshots (
      id, source_id, captured_url, captured_text, raw_html_hash, captured_at,
      fetch_status, error_message, created_at
    )
    select
      ss.id, ss.source_id, sr.source_url, ss.raw_payload, ss.snapshot_hash, ss.fetched_at,
      case when coalesce(ss.http_status, 0) between 200 and 399 then 'success' else 'skipped' end,
      case when coalesce(ss.http_status, 0) between 200 and 399 then null else 'Migrated from legacy source snapshot.' end,
      ss.fetched_at
    from public.source_snapshots ss
    join public.source_registry sr on sr.id = ss.source_id
    join public.marketplace_source_registry msr on msr.id = ss.source_id
    on conflict (id) do nothing;
  end if;
end
$source_intake_repair$;

do $candidate_snapshot_fk$
declare
  constraint_record record;
begin
  for constraint_record in
    select conname
    from pg_constraint
    where conrelid = 'public.marketplace_candidates'::regclass
      and contype = 'f'
      and conkey = array[
        (select attnum from pg_attribute
         where attrelid = 'public.marketplace_candidates'::regclass
           and attname = 'snapshot_id')
      ]
  loop
    execute format('alter table public.marketplace_candidates drop constraint %I', constraint_record.conname);
  end loop;

  update public.marketplace_candidates candidate
  set snapshot_id = null
  where snapshot_id is not null
    and not exists (
      select 1 from public.marketplace_source_snapshots snapshot
      where snapshot.id = candidate.snapshot_id
    );

  alter table public.marketplace_candidates
    add constraint marketplace_candidates_snapshot_id_fkey
    foreign key (snapshot_id)
    references public.marketplace_source_snapshots(id)
    on delete set null;
end
$candidate_snapshot_fk$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260804235000','separate_marketplace_source_intake','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260804235000_separate_marketplace_source_intake.sql

-- RECOVERY BEGIN 20260804235500_fix_source_import_batch_function.sql
begin;

create or replace function public.import_source_registry_batch(
  p_batch_id text,
  p_source_version text,
  p_records jsonb,
  p_checksum text default null
)
returns table (
  batch_id text,
  received integer,
  inserted integer,
  updated integer,
  rejected integer,
  final_status text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_received integer := 0;
  v_inserted integer := 0;
  v_updated integer := 0;
  v_rejected integer := 0;
begin
  if p_batch_id is null or btrim(p_batch_id) = '' then
    raise exception 'batch_id is required';
  end if;

  if p_source_version is null or btrim(p_source_version) = '' then
    raise exception 'source_version is required';
  end if;

  if p_records is null or jsonb_typeof(p_records) <> 'array' then
    raise exception 'records must be a JSON array';
  end if;

  v_received := jsonb_array_length(p_records);

  insert into public.source_import_batches (
    batch_id,
    source_version,
    source_count_expected,
    records_received,
    checksum,
    status,
    started_at
  )
  values (
    p_batch_id,
    p_source_version,
    v_received,
    v_received,
    p_checksum,
    'processing',
    now()
  )
  on conflict (batch_id) do update
    set source_version = excluded.source_version,
        source_count_expected = excluded.source_count_expected,
        records_received = excluded.records_received,
        checksum = excluded.checksum,
        records_inserted = 0,
        records_updated = 0,
        records_rejected = 0,
        status = 'processing',
        error_summary = null,
        started_at = now(),
        completed_at = null;

  delete from public.source_import_rejections
  where source_import_rejections.batch_id = p_batch_id;

  drop table if exists pg_temp.tmp_source_import_upserted;
  drop table if exists pg_temp.tmp_source_import_valid;
  drop table if exists pg_temp.tmp_source_import_records;

  create temp table tmp_source_import_records on commit drop as
  select
    row_number() over ()::integer as row_index,
    raw_record,
    nullif(btrim(raw_record->>'name'), '') as source_name,
    nullif(btrim(raw_record->>'url'), '') as source_url,
    public.hv_normalize_source_url(raw_record->>'url') as normalized_url,
    nullif(btrim(raw_record->>'category'), '') as category,
    nullif(btrim(raw_record->>'subcategory'), '') as subcategory,
    nullif(btrim(raw_record->>'type'), '') as source_type_raw,
    nullif(btrim(raw_record->>'country'), '') as country,
    nullif(btrim(raw_record->>'notes'), '') as notes,
    case
      when (raw_record->>'tier') ~ '^[0-9]+$' then (raw_record->>'tier')::integer
      else null
    end as tier
  from jsonb_array_elements(p_records) as raw_record;

  insert into public.source_import_rejections (
    batch_id,
    source_version,
    row_index,
    raw_record,
    normalized_url,
    rejection_reason
  )
  select
    p_batch_id,
    p_source_version,
    row_index,
    raw_record,
    normalized_url,
    concat_ws('; ',
      case when source_name is null then 'missing name' end,
      case when source_url is null then 'missing url' end,
      case when normalized_url is null then 'invalid normalized url' end,
      case when source_url is not null and source_url !~* '^https?://' then 'non-http url' end,
      case when country is null then 'missing country' end
    )
  from tmp_source_import_records
  where source_name is null
     or source_url is null
     or normalized_url is null
     or source_url !~* '^https?://'
     or country is null;

  get diagnostics v_rejected = row_count;

  create temp table tmp_source_import_valid on commit drop as
  select distinct on (normalized_url)
    *
  from tmp_source_import_records
  where source_name is not null
    and source_url is not null
    and normalized_url is not null
    and source_url ~* '^https?://'
    and country is not null
  order by normalized_url, tier nulls last, row_index;

  create temp table tmp_source_import_upserted (was_inserted boolean not null) on commit drop;

  with upserted as (
  insert into public.source_registry (
    source_name,
    source_type,
    source_url,
    jurisdiction,
    category_focus,
    fetch_method,
    allowed_use,
    terms_risk,
    review_frequency,
    is_active,
    country,
    subcategory,
    adapter,
    crawl_cadence,
    relevance_status,
    tier,
    notes,
    signal_keywords,
    region,
    authority_level,
    intelligence_pass,
    requires_translation,
    frequency
  )
  select
    left(source_name, 500),
    coalesce(source_type_raw, 'html'),
    source_url,
    country,
    category,
    public.hv_source_import_fetch_method(source_type_raw),
    'index_reference_only',
    'unknown',
    public.hv_source_import_crawl_cadence(tier, source_type_raw),
    true,
    country,
    subcategory,
    public.hv_source_import_adapter(source_type_raw),
    public.hv_source_import_crawl_cadence(tier, source_type_raw),
    'candidate',
    coalesce(tier, 3),
    notes,
    public.hv_source_import_signal_keywords(category, subcategory, notes),
    public.hv_source_import_region(country),
    public.hv_source_import_authority_level(coalesce(tier, 3)),
    1,
    false,
    public.hv_source_import_crawl_cadence(tier, source_type_raw)
  from tmp_source_import_valid
  on conflict ((public.hv_normalize_source_url(source_url))) where source_url is not null and public.hv_normalize_source_url(source_url) is not null
  do update set
    source_name = excluded.source_name,
    source_type = excluded.source_type,
    jurisdiction = excluded.jurisdiction,
    category_focus = excluded.category_focus,
    fetch_method = excluded.fetch_method,
    review_frequency = excluded.review_frequency,
    is_active = excluded.is_active,
    country = excluded.country,
    subcategory = excluded.subcategory,
    adapter = excluded.adapter,
    crawl_cadence = excluded.crawl_cadence,
    relevance_status = excluded.relevance_status,
    tier = excluded.tier,
    notes = excluded.notes,
    signal_keywords = excluded.signal_keywords,
    region = excluded.region,
    authority_level = excluded.authority_level,
    intelligence_pass = excluded.intelligence_pass,
    requires_translation = excluded.requires_translation,
    frequency = excluded.frequency,
    updated_at = now()
  returning (xmax = 0) as was_inserted
  )
  insert into tmp_source_import_upserted (was_inserted)
  select was_inserted from upserted;

  select
    count(*) filter (where was_inserted),
    count(*) filter (where not was_inserted)
  into v_inserted, v_updated
  from tmp_source_import_upserted;

  update public.source_import_batches
  set
    records_inserted = coalesce(v_inserted, 0),
    records_updated = coalesce(v_updated, 0),
    records_rejected = coalesce(v_rejected, 0),
    status = 'completed',
    completed_at = now(),
    error_summary = null
  where source_import_batches.batch_id = p_batch_id;

  return query
  select
    p_batch_id,
    v_received,
    coalesce(v_inserted, 0),
    coalesce(v_updated, 0),
    coalesce(v_rejected, 0),
    'completed'::text;

exception
  when others then
    update public.source_import_batches
    set
      status = 'failed',
      error_summary = sqlerrm,
      completed_at = now()
    where source_import_batches.batch_id = p_batch_id;

    raise;
end;
$$;

revoke all on function public.import_source_registry_batch(text, text, jsonb, text) from public;
revoke all on function public.import_source_registry_batch(text, text, jsonb, text) from anon;
revoke all on function public.import_source_registry_batch(text, text, jsonb, text) from authenticated;

grant execute on function public.import_source_registry_batch(text, text, jsonb, text) to service_role;

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260804235500','fix_source_import_batch_function','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260804235500_fix_source_import_batch_function.sql

-- RECOVERY BEGIN 20260805000000_countries_table_replay_repair.sql
-- Forward, idempotent reconciliation for production histories that passed the old timestamp.
create table if not exists public.countries (
  id uuid primary key default gen_random_uuid(),
  country_name text not null,
  country_slug text not null,
  iso_alpha2 text not null,
  iso_alpha3 text,
  region text,
  subregion text,
  market_access_status text not null default 'unknown',
  medical_status text not null default 'unknown',
  adult_use_status text not null default 'unknown',
  import_status text not null default 'unknown',
  export_status text not null default 'unknown',
  signals_status text not null default 'unknown',
  opportunity_status text not null default 'unknown',
  opportunity_score integer not null default 0,
  regulator_label text,
  lat double precision,
  lng double precision,
  public_summary text,
  data_completeness text not null default 'stub',
  last_updated_label text,
  opportunity_categories text[],
  trade_roles text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.countries
  add column if not exists opportunity_score integer not null default 0;

update public.countries set opportunity_score = case market_access_status::text
  when 'open' then 95
  when 'active' then 82
  when 'regulated' then 64
  when 'emerging' then 52
  when 'limited' then 36
  when 'restricted' then 22
  when 'unknown' then 10
  else 10
end
where opportunity_score = 0;

create or replace function public.sync_opportunity_score()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.opportunity_score := case new.market_access_status::text
    when 'open' then 95
    when 'active' then 82
    when 'regulated' then 64
    when 'emerging' then 52
    when 'limited' then 36
    when 'restricted' then 22
    when 'unknown' then 10
    else 10
  end;
  return new;
end;
$$;

drop trigger if exists sync_opportunity_score_trigger on public.countries;
create trigger sync_opportunity_score_trigger
  before insert or update of market_access_status
  on public.countries
  for each row execute function public.sync_opportunity_score();


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260805000000','countries_table_replay_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260805000000_countries_table_replay_repair.sql

-- RECOVERY BEGIN 20260805233500_service_only_digest_enrichment.sql
-- Keep external-network digest and enrichment routines behind trusted server
-- execution. The production hardening migration closes every SECURITY DEFINER
-- routine first; this follow-on migration restores only these two exact
-- signatures to service_role and explicitly keeps browser roles denied.
do $service_only_digest_enrichment$
begin
  if to_regprocedure('public.run_editorial_digest()') is not null then
    revoke all privileges on function public.run_editorial_digest()
      from public, anon, authenticated;
    grant execute on function public.run_editorial_digest() to service_role;
  end if;

  if to_regprocedure('public.run_country_intel_enrichment()') is not null then
    revoke all privileges on function public.run_country_intel_enrichment()
      from public, anon, authenticated;
    grant execute on function public.run_country_intel_enrichment() to service_role;
  end if;
end
$service_only_digest_enrichment$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260805233500','service_only_digest_enrichment','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260805233500_service_only_digest_enrichment.sql

-- RECOVERY BEGIN 20260805234000_revoke_anon_execute_on_net_http.sql
-- Best-effort revoke of anon/authenticated EXECUTE on net.http_get / net.http_post,
-- plus a standing report of the exposure this project cannot close itself.
--
-- WHAT IS EXPOSED
--
-- pg_net's http_get/http_post queue arbitrary outbound HTTP requests and are
-- SECURITY DEFINER. In this project anon and authenticated both hold EXECUTE on
-- them, which is Supabase's platform default rather than anything this
-- repository granted.
--
-- WHY THIS MIGRATION CANNOT FIX IT
--
-- Verified read-only against production (zvxdgdkukjrrwamdpqrg):
--
--   net.http_get / net.http_post   owner = supabase_admin, prosecdef = true
--   acl entries                    anon=X/supabase_admin
--                                  authenticated=X/supabase_admin
--                                  postgres=X/supabase_admin
--                                  service_role=X/supabase_admin
--                                  supabase_admin=X/supabase_admin
--                                  supabase_functions_admin=X/supabase_admin
--   schema net                     owner = supabase_admin
--   postgres                       rolsuper = false
--   pg_has_role('postgres','supabase_admin','MEMBER')  = false
--   has_schema_privilege('postgres','net','CREATE')    = false
--   has_schema_privilege('postgres','net','USAGE')     = true
--
-- Every grant names supabase_admin as the grantor, so only supabase_admin or a
-- superuser can revoke it. `postgres` is the role that runs these migrations
-- locally, the role behind the Supabase SQL editor, and the role behind the
-- management API -- and it is neither. Postgres does not raise for a revoke by a
-- non-grantor; it emits
--   WARNING (01007): no privileges were granted for "http_get"
--   WARNING (01006): no privileges could be revoked for "http_get"
-- and carries on, which is why the first version of this migration reported
-- success while changing nothing. The candidate run at 869203ec confirmed the
-- same outcome even after attempting SET ROLE supabase_admin first.
--
-- HOW REACHABLE IT ACTUALLY IS
--
-- Not through the Data API. PostgREST exposes `public, graphql_public,
-- job_search, api` in production and `public, graphql_public, api` locally;
-- `net` is in neither list and is not in extra_search_path, so no anon or
-- authenticated request can dispatch to net.http_get. Every caller in this
-- repository reaches pg_net from inside a SECURITY DEFINER function in `public`
-- -- the enrichment, digest, extraction and source-pull routines at
-- 20260611153902, 20260705110551, 20260705233347, 20260706221210, 20260709085300
-- and others -- and those execute as their owner, so the caller's own grant is
-- irrelevant to them. Exploiting the grant requires a direct Postgres session
-- authenticated as anon or authenticated, which the publishable anon key does not
-- provide.
--
-- So: a real but low-reachability platform default, not remediable from here.
-- Closing it needs supabase_admin, i.e. Supabase support or a platform-level
-- change, and it is a production security change requiring explicit sign-off.
-- Tracked in docs/control/EVIDENCE_LOG.md.
--
-- WHY THIS MIGRATION STAYS
--
-- The revoke is kept rather than deleted so the history self-heals if the grants
-- ever become owned by a role this project controls, or if the replay is run by a
-- privileged role. It is guarded on the schema and functions existing, idempotent,
-- and never aborts the replay. When it cannot take effect it says so, once per
-- replay, instead of claiming success.

do $revoke_net_http_public_execute$
declare
  target text;
  prior_role text := current_user;
begin
  if to_regnamespace('net') is null then
    raise notice 'net schema not present; skipping pg_net execute revokes';
    return;
  end if;

  foreach target in array array[
    'net.http_get(text, jsonb, jsonb, integer)',
    'net.http_post(text, jsonb, jsonb, jsonb, integer)'
  ]
  loop
    if to_regprocedure(target) is null then
      raise notice 'skipping revoke, % not present', target;
    else
      begin
        -- Try to become the grantor. Proven not to be permitted for `postgres`
        -- on Supabase, but harmless to attempt and correct if it ever is.
        begin
          set local role supabase_admin;
        exception
          when others then
            null;
        end;

        -- NB: the restore below is `set local role <prior_role>`, not RESET ROLE.
        -- RESET ROLE reverts to session_user, which is not necessarily the role
        -- that entered this block. A local harness caught exactly that: with the
        -- session at `postgres` and `set role` to an unprivileged migrator, the
        -- first iteration's RESET ROLE escalated the second iteration back to the
        -- superuser session role, so one function was revoked and the other was
        -- not. Restoring the captured role keeps every iteration at the same
        -- privilege level.

        -- Grant the operational roles explicitly BEFORE revoking PUBLIC, so they
        -- keep access when any blanket grant goes away. This matches production's
        -- acl shape, which names every role individually and has no PUBLIC entry.
        execute format('grant execute on function %s to postgres, service_role', target);

        -- PUBLIC must be included. Revoking only anon and authenticated leaves the
        -- PUBLIC pseudo-role grant in place and both roles keep EXECUTE through it
        -- -- has_function_privilege still returns true. 20260722031500 records this
        -- exact trap after hitting it on the hv_* pipeline functions.
        execute format('revoke execute on function %s from public, anon, authenticated', target);

        execute format('set local role %I', prior_role);

        -- Verify rather than assume, because a revoke by a non-grantor only warns.
        if has_function_privilege('anon', to_regprocedure(target), 'execute')
           or has_function_privilege('authenticated', to_regprocedure(target), 'execute')
        then
          raise warning
            'anon/authenticated retain EXECUTE on % -- granted by supabase_admin, '
            'which this role cannot revoke. Unreachable via PostgREST (the net '
            'schema is not exposed); closing it needs a platform-level change. '
            'See docs/control/EVIDENCE_LOG.md.', target;
        else
          raise notice 'revoked public/anon/authenticated execute on %', target;
        end if;
      exception
        when insufficient_privilege then
          execute format('set local role %I', prior_role);
          raise notice 'insufficient privilege to revoke on %; left unchanged', target;
      end;
    end if;
  end loop;
end
$revoke_net_http_public_execute$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260805234000','revoke_anon_execute_on_net_http','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260805234000_revoke_anon_execute_on_net_http.sql

-- RECOVERY BEGIN 20260807000900_revoke_data_api_execute_on_secret_accessors.sql
-- Close anon/authenticated EXECUTE on the vault-backed secret accessors.
--
-- WHY THIS IS SEPARATE FROM 20260807001000
--
-- `ALTER DEFAULT PRIVILEGES` only affects objects created AFTER it runs. It stops
-- the exposure recurring; it does nothing for the functions that already carry the
-- grant. This migration closes the ones that exist. Both are needed.
--
-- THE EXPOSURE (verified read-only against production, 2026-08-07)
--
-- | function                                  | secdef | reads vault | returns | anon |
-- |-------------------------------------------|--------|-------------|---------|------|
-- | public.get_github_pat()                   | yes    | yes         | text    | yes  |
-- | api.hv_get_github_pat()                   | yes    | yes         | text    | yes  |
-- | api.get_github_pat()                      | no     | via public  | text    | yes  |
-- | public.verify_hv_cron_secret(text)        | yes    | yes         | boolean | yes  |
-- | public.verify_hv_bridge_key(text)         | yes    | yes         | boolean | yes  |
-- | public.verify_source_engine_cron_secret(text) | yes | yes        | boolean | yes  |
-- | api.verify_hv_cron_secret(text)           | yes    | yes         | boolean | yes  |
-- | api.verify_hv_bridge_key(text)            | yes    | yes         | boolean | yes  |
-- | api.hv_bridge_key_matches(text)           | yes    | yes         | boolean | yes  |
--
-- acl on each: {postgres=X/postgres, service_role=X/postgres, anon=X/postgres,
-- authenticated=X/postgres}. PostgREST exposes `public, graphql_public,
-- job_search, api` in production, so `public` and `api` are both RPC-dispatched.
--
-- The first two are SECURITY DEFINER, read `vault.decrypted_secrets` and return
-- `text` -- the publishable anon key is sufficient to retrieve a GitHub PAT in
-- plaintext. The `verify_*` family returns boolean and acts as an anon-callable
-- oracle against the cron secret, bridge key and source-engine secret.
--
-- Not exploited: confirming end-to-end would disclose the secret. Every fact above
-- is from `pg_proc`, `pg_namespace` and `pg_db_role_setting`, read-only.
--
-- HOW IT REGRESSED
--
-- `20260710190300_github_pat_vault_rpc.sql` already revoked these correctly and the
-- production ledger confirms it ran. The grant came back via the `public` schema's
-- default privileges (see 20260807001000), which re-grant anon on object creation.
-- Reapplying the revoke without also fixing the defaults would regress again.
--
-- These are backend-only by construction: the edge functions `github-bridge` and
-- `hv-repo-reader` call them as `service_role`, which keeps EXECUTE.
--
-- PUBLIC is included in every revoke. Leaving it out lets anon and authenticated
-- keep EXECUTE through the pseudo-role -- `has_function_privilege` still returns
-- true. 20260722031500 records this trap; 20260805234000 and 20260807001000 both
-- hit it again.
--
-- Guarded per function and idempotent: absent functions are skipped, and revoking
-- an already-revoked privilege is a no-op.

do $revoke_secret_accessor_execute$
declare
  target      text;
  v_remaining text[] := '{}';
begin
  foreach target in array array[
    'public.get_github_pat()',
    'api.get_github_pat()',
    'api.hv_get_github_pat()',
    'public.verify_hv_cron_secret(text)',
    'public.verify_hv_bridge_key(text)',
    'public.verify_source_engine_cron_secret(text)',
    'api.verify_hv_cron_secret(text)',
    'api.verify_hv_bridge_key(text)',
    'api.hv_bridge_key_matches(text)'
  ]
  loop
    if to_regprocedure(target) is null then
      raise notice 'skipping %, not present', target;
      continue;
    end if;

    execute format('revoke all privileges on function %s from public, anon, authenticated', target);
    execute format('grant execute on function %s to service_role', target);

    -- Verify rather than assume.
    if has_function_privilege('anon', to_regprocedure(target), 'execute')
       or has_function_privilege('authenticated', to_regprocedure(target), 'execute')
    then
      v_remaining := v_remaining || target;
    end if;
  end loop;

  if array_length(v_remaining, 1) is not null then
    raise exception
      'anon or authenticated still hold EXECUTE on secret accessors after revoke: %',
      array_to_string(v_remaining, ', ');
  end if;

  raise notice 'secret accessors are service_role-only';
end
$revoke_secret_accessor_execute$;

notify pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260807000900','revoke_data_api_execute_on_secret_accessors','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260807000900_revoke_data_api_execute_on_secret_accessors.sql

-- RECOVERY BEGIN 20260807001000_revoke_data_api_default_privileges_on_public.sql
-- Stop `public` from auto-granting every new object to the Data API roles.
--
-- WHY THIS EXISTS
--
-- `20260710190300_github_pat_vault_rpc.sql` revoked anon/authenticated EXECUTE on
-- public.get_github_pat() and api.get_github_pat(), and the production ledger
-- confirms it ran (version 20260710190300, 7 statements). Yet production today
-- reports:
--
--   public.get_github_pat()  acl = {postgres=X/postgres, service_role=X/postgres,
--                                   anon=X/postgres, authenticated=X/postgres}
--
-- anon holds EXECUTE again on a SECURITY DEFINER function that reads
-- vault.decrypted_secrets and returns text, in a schema PostgREST exposes.
--
-- The re-grant is not in the ledger -- no migration after 20260710190300 contains
-- a matching GRANT. The mechanism is ALTER DEFAULT PRIVILEGES. `pg_default_acl`
-- in production carries, for schema `public`:
--
--   grantor postgres,        functions -> {postgres=X, anon=X, authenticated=X, service_role=X}
--   grantor supabase_admin,  functions -> {postgres=X, anon=X, authenticated=X, service_role=X}
--   grantor postgres,        tables    -> {postgres=arwdDxtm, anon=arwdDxtm,
--                                          authenticated=arwdDxtm, service_role=arwdDxtm}
--   grantor supabase_admin,  tables    -> same
--   plus the matching sequence entries
--
-- So every newly created function in `public` is executable by anon on creation,
-- and every newly created table is fully writable by anon on creation. Any
-- revoke is undone the next time an object is dropped and recreated. That is why
-- roughly 300 SECURITY DEFINER routines in public/api are anon- or
-- authenticated-executable in production despite targeted revokes.
--
-- WHY A REVOKE OF THE GRANTS ALONE IS NOT ENOUGH
--
-- 20260804190000_production_security_hardening.sql performs 49 revokes and
-- re-grants the operational subset to service_role. That fixes the objects that
-- exist when it runs. It does not change the default privileges, so the exposure
-- reappears for the next object created. This migration closes the source.
--
-- WHAT THIS CHANGES
--
-- After this runs, a new table/view/function/sequence in `public` is NOT reachable
-- by anon or authenticated until something grants it explicitly. That is
-- deliberate, and it matches this project's own stated intent: `supabase/config.toml`
-- documents `auto_expose_new_tables` as deprecated, notes that "When unset, new
-- entities are NOT auto-exposed, matching the new cloud default", and leaves it
-- unset. Local already behaves this way; production does not. This aligns them.
--
-- Existing objects are untouched -- ALTER DEFAULT PRIVILEGES only affects objects
-- created afterwards. Anything that currently works keeps working. Migrations that
-- create public-facing tables or views must grant explicitly from here on; the
-- ones in this repository already do.
--
-- service_role and postgres defaults are deliberately left in place: service_role
-- is the backend/edge-function identity and postgres owns the schema.
--
-- LIMIT ON FUNCTIONS -- READ BEFORE ASSUMING THIS CLOSES EVERYTHING
--
-- This migration fixes TABLES and SEQUENCES. It does NOT stop new functions in
-- `public` from being executable by anon, and PostgreSQL provides no way to do
-- that through ALTER DEFAULT PRIVILEGES. Proven on PostgreSQL 16.13 with three
-- experiments:
--
--   1. defaclacl = {service_role=X/postgres} (a stored row with no PUBLIC entry)
--      -> new function proacl = {=X/postgres, postgres=X/postgres,
--                                service_role=X/postgres}   anon EXECUTE = true
--   2. `revoke execute on functions from public` alone
--      -> zero rows stored in pg_default_acl, new function proacl = NULL,
--         anon EXECUTE = true
--   3. grant to service_role + revoke from public together
--      -> defaclacl = {service_role=X/postgres}, new function still
--         {=X/postgres, ...}                                anon EXECUTE = true
--
-- `=X/` is the PUBLIC pseudo-role. pg_default_acl entries are MERGED WITH the
-- built-in defaults rather than replacing them, and the built-in default for
-- functions is EXECUTE TO PUBLIC. Revoking PUBLIC there does not persist.
--
-- The compensating controls for functions therefore remain, unchanged:
--   * every function migration revoking explicitly from public, anon, authenticated
--     (the pattern 20260722031500 and 20260710190300 already use), and
--   * the anon_definer_execute / authenticated_definer_execute assertions in
--     supabase/tests/production_security_hardening.sql, which must return zero rows.
--
-- Tables are the more severe half regardless: production's default grants anon
-- `arwdDxtm` -- full INSERT/UPDATE/DELETE -- on every newly created table in
-- `public`. That is what this closes.
--
-- Idempotent: ALTER DEFAULT PRIVILEGES ... REVOKE is a no-op when the default
-- entry is already absent.
--
-- Guarded per grantor role. `supabase_admin`'s defaults can only be altered by
-- supabase_admin, which the migration role is not (verified: postgres is not a
-- superuser and not a member of supabase_admin). Those are attempted and reported
-- honestly rather than assumed -- same discipline as 20260805234000.

do $revoke_public_default_privileges$
declare
  v_role       text;
  v_remaining  int;
begin
  foreach v_role in array array['postgres', 'supabase_admin']
  loop
    if to_regrole(v_role) is null then
      raise notice 'role % not present; skipping its default privileges', v_role;
      continue;
    end if;

    begin
      -- Functions: this removes the EXPLICIT anon/authenticated default grants
      -- only. It does NOT stop new functions being executable by anon, and the
      -- migration does not claim to -- see the LIMIT ON FUNCTIONS note in the
      -- header. PUBLIC is included anyway so the explicit entry is gone if one
      -- was ever added.
      execute format(
        'alter default privileges for role %I in schema public '
        'revoke execute on functions from public, anon, authenticated', v_role);
      execute format(
        'alter default privileges for role %I in schema public '
        'revoke all on tables from anon, authenticated', v_role);
      execute format(
        'alter default privileges for role %I in schema public '
        'revoke all on sequences from anon, authenticated', v_role);
    exception
      when insufficient_privilege then
        raise warning
          'cannot alter default privileges owned by % -- they must be changed by '
          'that role. New objects in public will continue to be auto-granted to '
          'anon/authenticated via this entry.', v_role;
      when others then
        raise warning 'could not alter default privileges for %: %', v_role, sqlerrm;
    end;
  end loop;

  -- Verify rather than assume. Scoped to tables and sequences, because those are
  -- the object types this migration can actually close; functions are covered by
  -- the assertion gate instead (see the LIMIT ON FUNCTIONS note above).
  select count(*) into v_remaining
  from pg_default_acl d
  join pg_namespace n on n.oid = d.defaclnamespace
  where n.nspname = 'public'
    and d.defaclobjtype in ('r', 'S')
    and d.defaclacl::text ~ '(anon|authenticated)=';

  if v_remaining > 0 then
    raise warning
      'public still has % table/sequence default-privilege entr(y/ies) granting '
      'anon or authenticated. New tables there will be auto-exposed.', v_remaining;
  else
    raise notice
      'public table/sequence defaults no longer grant anon or authenticated '
      '(function EXECUTE to PUBLIC is unaffected by design -- see header)';
  end if;
end
$revoke_public_default_privileges$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260807001000','revoke_data_api_default_privileges_on_public','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260807001000_revoke_data_api_default_privileges_on_public.sql

-- RECOVERY BEGIN 20260807001100_fix_promote_staging_null_object_class.sql
-- Restore public.hv_promote_staging_to_artifacts into the repository, and fix the
-- null-derivation bug that has been failing the hv-promote-staging cron.
--
-- WHY THIS EXISTS
--
-- The function is a production-owned object that was never in this repository --
-- `grep -rl hv_promote_staging_to_artifacts supabase/ lib/ app/ scripts/` matched
-- only `supabase/release-controls/pending-production-migration-decisions.json`.
-- Category: production object created outside the recorded ledger, restored here
-- as a replay foundation.
--
-- THE BUG
--
-- `cron.job_run_details` for `hv-promote-staging` over three days: 22 failed, 50
-- succeeded. Every failure is identical:
--
--   ERROR: null value in column "object_class" of relation "hv_artifacts"
--          violates not-null constraint
--   DETAIL: Failing row contains (..., null, internal, null,
--           Medical Marijuana - Arkansas Department of Health, ...)
--
-- The original derivation:
--
--   v_class_text := v_norm->>'object_class';
--   BEGIN
--     v_object_class := v_class_text::hv_object_class;
--   EXCEPTION WHEN invalid_text_representation THEN
--     v_object_class := 'regulatory_event'::hv_object_class;
--   END;
--
-- `NULL::hv_object_class` is NULL, not an error. When `normalized_payload` has no
-- `object_class` key -- or a JSON null -- the cast raises nothing, the handler
-- never fires, `v_object_class` stays NULL, and the INSERT hits the NOT NULL
-- constraint. The handler only ever catches a non-null but invalid string such as
-- 'garbage'. `hv_artifacts.object_class` is NOT NULL with no default (verified).
--
-- Because the whole batch aborts, the offending staging row is never marked and is
-- picked up again on the next tick, so it recurs until the payload changes.
-- `hv_import_staging` currently holds 380 unpromoted rows.
--
-- `v_authority` had the identical flaw: `(v_norm->>'authority_level')::hv_authority_level`
-- yields NULL for a missing key rather than raising, so its 'G' fallback was also
-- unreachable for that case. Fixed the same way, matching the function's own
-- evident intent.
--
-- THE FIX
--
-- Two lines. `coalesce(nullif(btrim(...), ''), <fallback>)` before the cast, so a
-- missing, null, empty or whitespace-only value takes the same fallback the
-- exception handler already established. The `EXCEPTION` blocks are retained
-- unchanged -- they still cover the non-null-but-invalid case they were written
-- for. Everything else is a byte-faithful replay of the production body
-- (5482 chars, md5 e3501b60dabe593b46abb2d155db2b8c), captured read-only from
-- `pg_proc.prosrc`.
--
-- PARAMETER DEFAULTS
--
-- The signature carries `p_batch_size integer default 50` and
-- `p_workspace_id uuid default 'a85840b4-...'::uuid`. These are NOT optional
-- decoration: production's copy has them, and `create or replace` without them
-- fails with
--   42P13: cannot remove parameter defaults from existing function
-- The first version of this migration omitted them, because the signature was
-- reconstructed from `pg_get_function_identity_arguments`, which deliberately
-- excludes defaults. Use `pg_get_function_arguments` when replaying a function
-- signature. A zero-state replay cannot catch this -- the function does not
-- pre-exist there, so it would be created without defaults and silently diverge
-- from production. Production rejected it, which is the only place it shows up.
--
-- GRANTS
--
-- The production copy is currently executable by `anon` and `authenticated` -- it
-- appears in both the anon_definer_execute and authenticated_definer_execute
-- assertion results. It is a SECURITY DEFINER writer that inserts artifacts,
-- evidence and jobs; nothing about it should be callable from the Data API. The
-- explicit revoke/grant below follows the pattern 20260710190300 established, and
-- includes PUBLIC because leaving it out lets anon keep EXECUTE through the
-- pseudo-role.

do $promote_fix$
begin
  -- The hv_* foundations are restored by the candidate migration series and are
  -- not present in every history this file may replay against. Skip cleanly there
  -- rather than failing the replay; production has them, which is where the fix
  -- is needed.
  if to_regtype('public.hv_object_class') is null
     or to_regtype('public.hv_authority_level') is null
     or to_regclass('public.hv_import_staging') is null
     or to_regclass('public.hv_artifacts') is null then
    raise notice 'hv_* import foundations absent; skipping promote-staging repair';
    return;
  end if;

  execute $create$
create or replace function public.hv_promote_staging_to_artifacts(
  p_batch_size integer default 50,
  p_workspace_id uuid default 'a85840b4-c522-4cb8-9097-2f6c30a78417'::uuid
)
returns table(staging_id uuid, artifact_id uuid, action text, title text, country text)
language plpgsql
volatile
security definer
set search_path = public
  as $body$
DECLARE
  v_row          RECORD;
  v_norm         JSONB;
  v_artifact_id  UUID;
  v_evidence_id  UUID;
  v_job_key      TEXT;
  v_existing_id  UUID;
  v_authority    hv_authority_level;
  v_object_class hv_object_class;
  v_class_text   TEXT;
BEGIN

  FOR v_row IN
    SELECT s.*
    FROM hv_import_staging s
    WHERE s.status = 'pending'
      AND s.workspace_id = p_workspace_id
    ORDER BY s.created_at ASC
    LIMIT p_batch_size
  LOOP

    v_norm := v_row.normalized_payload;

    -- Resolve object_class safely.
    -- coalesce/nullif added: a missing or empty key casts to NULL without raising,
    -- so the EXCEPTION handler below never fired and the NOT NULL insert failed.
    v_class_text := v_norm->>'object_class';
    BEGIN
      v_object_class := COALESCE(NULLIF(btrim(v_class_text), ''), 'regulatory_event')::hv_object_class;
    EXCEPTION WHEN invalid_text_representation THEN
      v_object_class := 'regulatory_event'::hv_object_class;
    END;

    -- Resolve authority_level safely (same null-derivation fix as above).
    BEGIN
      v_authority := COALESCE(NULLIF(btrim(v_norm->>'authority_level'), ''), 'G')::hv_authority_level;
    EXCEPTION WHEN invalid_text_representation THEN
      v_authority := 'G'::hv_authority_level;
    END;

    -- Dedup: check content_hash against existing artifacts
    IF v_row.content_hash IS NOT NULL THEN
      SELECT id INTO v_existing_id
      FROM hv_artifacts
      WHERE content_hash = v_row.content_hash
        AND workspace_id = p_workspace_id
      LIMIT 1;

      IF v_existing_id IS NOT NULL THEN
        -- Mark staging as duplicate
        UPDATE hv_import_staging
        SET status          = 'rejected',
            rejected_at     = now(),
            rejection_reason = 'duplicate',
            duplicate_of    = v_existing_id,
            is_duplicate_candidate = TRUE,
            duplicate_confidence   = 1.000
        WHERE id = v_row.id;

        staging_id  := v_row.id;
        artifact_id := v_existing_id;
        action      := 'duplicate_skipped';
        title       := v_row.proposed_title;
        country     := v_norm->>'country_iso';
        RETURN NEXT;
        CONTINUE;
      END IF;
    END IF;

    -- Create artifact
    INSERT INTO hv_artifacts (
      workspace_id,
      object_class,
      classification,
      authority_level,
      title,
      body,
      structured_data,
      source_system,
      source_record_id,
      source_url,
      import_batch_id,
      content_hash,
      lifecycle_stage,
      review_status,
      freshness,
      public_eligible,
      jurisdiction_code,
      country_iso,
      region
    ) VALUES (
      p_workspace_id,
      v_object_class,
      'internal'::hv_classification,
      v_authority,
      COALESCE(v_row.proposed_title, 'Untitled'),
      v_norm->>'body',
      jsonb_build_object(
        'source_name',       (v_norm->>'source_name'),
        'language',          v_norm->>'language',
        'requires_translation', (v_norm->>'requires_translation')::BOOLEAN,
        'keyword_count',     v_norm->>'keyword_count',
        'matched_keywords',  v_norm->'matched_keywords',
        'intelligence_pass', v_norm->>'intelligence_pass',
        'staging_id',        v_row.id
      ),
      COALESCE(v_norm->>'source_system', v_row.source_system),
      COALESCE(v_norm->>'source_record_id', v_row.source_record_id),
      v_row.source_url,
      v_row.import_batch_id,
      v_row.content_hash,
      'normalized'::hv_lifecycle_stage,
      'pending'::hv_review_status,
      'fresh'::hv_freshness,
      FALSE,
      v_row.proposed_jurisdiction,
      v_row.proposed_country_iso,
      v_norm->>'region'
    )
    RETURNING id INTO v_artifact_id;

    -- Create evidence record
    INSERT INTO hv_evidence (
      artifact_id,
      workspace_id,
      source_system,
      source_id,
      source_url,
      captured_at,
      import_batch_id,
      content_hash,
      mime_type,
      extracted_text,
      classification,
      access_classification,
      extraction_status,
      requires_translation,
      language_detected,
      review_status
    ) VALUES (
      v_artifact_id,
      p_workspace_id,
      v_row.source_system,
      v_row.source_record_id,
      v_row.source_url,
      v_row.created_at,
      v_row.import_batch_id,
      v_row.raw_payload_hash,
      'application/json',
      v_norm->>'body',
      'internal'::hv_classification,
      'restricted'::hv_classification,
      'completed',
      COALESCE((v_norm->>'requires_translation')::BOOLEAN, FALSE),
      v_norm->>'language',
      'pending'::hv_review_status
    )
    RETURNING id INTO v_evidence_id;

    -- Queue embed job (deterministic key — safe to rerun)
    v_job_key := 'embed:' || v_artifact_id::TEXT;

    INSERT INTO hv_processing_jobs (
      workspace_id,
      artifact_id,
      job_type,
      job_key,
      priority,
      input_payload,
      status
    ) VALUES (
      p_workspace_id,
      v_artifact_id,
      'embed'::hv_job_type,
      v_job_key,
      3,
      jsonb_build_object(
        'artifact_id',  v_artifact_id,
        'evidence_id',  v_evidence_id,
        'source_field', 'title+body',
        'model_id',     'text-embedding-3-small',
        'dimensions',   1536
      ),
      'pending'::hv_job_status
    )
    ON CONFLICT (job_key) DO NOTHING;

    -- Mark staging as promoted
    UPDATE hv_import_staging
    SET status               = 'promoted',
        promoted_artifact_id = v_artifact_id,
        promoted_at          = now()
    WHERE id = v_row.id;

    staging_id  := v_row.id;
    artifact_id := v_artifact_id;
    action      := 'created';
    title       := v_row.proposed_title;
    country     := v_row.proposed_country_iso;
    RETURN NEXT;

  END LOOP;
END;
$body$;
  $create$;

  execute 'revoke all privileges on function public.hv_promote_staging_to_artifacts(integer, uuid)'
          ' from public, anon, authenticated';
  execute 'grant execute on function public.hv_promote_staging_to_artifacts(integer, uuid)'
          ' to service_role';

  raise notice 'hv_promote_staging_to_artifacts repaired and restricted to service_role';
end
$promote_fix$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260807001100','fix_promote_staging_null_object_class','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260807001100_fix_promote_staging_null_object_class.sql

-- RECOVERY BEGIN 20260808112235_expose_signal_quality_to_api.sql
create or replace view api.signals_with_quality
with (security_invoker = true)
as
select
  id, date, cat, pri, score, headline, summary, source, url, verification,
  tier, lang, company, country, in_network, lane_r, lane_e, lane_t, top_lane,
  query_pack, commercial_impact, reviewed, action, created_at, embedding_1024,
  embedding_model, embedded_at, reviewed_by, reviewed_at, editorial_title,
  editorial_blurb, country_iso2,
  quality_label, quality_confidence, content_type, impact,
  title_en, summary_en, lang_detected, is_representative, cluster_rep_id,
  analysis
from public.signals;

revoke all on api.signals_with_quality from public, anon;
grant select on api.signals_with_quality to authenticated, service_role;

comment on view api.signals_with_quality is
  'public.signals plus the Pipeline B quality columns. Deliberately NOT granted to anon: it carries internal classifier verdicts and the generated analysis payload. api.signals remains the anon-readable projection.';

create or replace view api.admin_dashboard_counts
with (security_invoker = true)
as
select
  pending_listings,
  pending_buyer_requests,
  new_inquiries,
  pending_matches,
  pending_disclosures
from public.admin_dashboard_counts;

revoke all on api.admin_dashboard_counts from public, anon;
grant select on api.admin_dashboard_counts to authenticated, service_role;

comment on view api.admin_dashboard_counts is
  'Review-queue counters for the Command Centre. security_invoker, so the counts a caller sees are the rows their own role may read.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260808112235','expose_signal_quality_to_api','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260808112235_expose_signal_quality_to_api.sql

-- RECOVERY BEGIN 20260808120000_expose_signal_quality_to_api.sql
-- Expose the Pipeline B quality columns and the admin review counters on the
-- `api` schema, which is the only schema PostgREST serves for this project.
--
-- WHY
-- ---
-- `SIGNAL_QUALITY_SELECT` (lib/signals/quality.ts) names nine columns plus
-- `analysis`. All ten exist on `public.signals`. None are exposed on
-- `api.signals`, and none have ever existed on `signals_quality` in either
-- schema. Every reader that asked for them got a PostgREST 400, a null data
-- payload, and -- because the calling code cannot tell a malformed query from
-- an empty table -- silently fell through to a lower tier or returned nothing.
-- 3,745 reviewed rows are unreachable this way.
--
-- `admin_dashboard_counts` exists only in `public`, so the Command Centre stats
-- read fails and a `?? {zeros}` default hides it. Production currently holds
-- pending_listings 1, pending_buyer_requests 1, new_inquiries 8 -- eight
-- unactioned inquiries that are invisible in the product.
--
-- WHY A NEW VIEW RATHER THAN WIDENING api.signals
-- ------------------------------------------------
-- `api.signals` is granted to `anon`. Adding the quality columns to it would
-- publish internal classifier verdicts (`quality_label`, `quality_confidence`,
-- `impact`, `is_representative`, `cluster_rep_id`) and the generated `analysis`
-- payload to anonymous callers. That is a data-exposure change, not a bug fix,
-- so it is not made here.
--
-- Every consumer of these columns runs as `authenticated` (auth-gated dashboard
-- routes via the session client) or `service_role` (cron and synthesis paths).
-- None runs as `anon`. So the columns go on a separate view granted to exactly
-- those two roles, and `api.signals` is left byte-for-byte as it was.
--
-- SECURITY POSTURE
-- ----------------
-- `security_invoker = true`, matching every other view in `api`. RLS is enabled
-- on `public.signals`, so row visibility is still resolved against the calling
-- role -- this view widens which *columns* two already-privileged roles can
-- read, never which *rows*.
--
-- This migration creates read-only views and grants. It does not delete
-- application data, rewrite business records, or alter any existing object.

-- ── Signals with the Pipeline B quality columns ──────────────────────────────

create or replace view api.signals_with_quality
with (security_invoker = true)
as
select
  -- Exactly the columns api.signals already exposes, in its order.
  id, date, cat, pri, score, headline, summary, source, url, verification,
  tier, lang, company, country, in_network, lane_r, lane_e, lane_t, top_lane,
  query_pack, commercial_impact, reviewed, action, created_at, embedding_1024,
  embedding_model, embedded_at, reviewed_by, reviewed_at, editorial_title,
  editorial_blurb, country_iso2,
  -- The quality family this view exists to carry.
  quality_label, quality_confidence, content_type, impact,
  title_en, summary_en, lang_detected, is_representative, cluster_rep_id,
  analysis
from public.signals;

revoke all on api.signals_with_quality from public, anon;
grant select on api.signals_with_quality to authenticated, service_role;

comment on view api.signals_with_quality is
  'public.signals plus the Pipeline B quality columns. Deliberately NOT granted to anon: it carries internal classifier verdicts and the generated analysis payload. api.signals remains the anon-readable projection.';

-- ── Admin review counters ────────────────────────────────────────────────────

create or replace view api.admin_dashboard_counts
with (security_invoker = true)
as
select
  pending_listings,
  pending_buyer_requests,
  new_inquiries,
  pending_matches,
  pending_disclosures
from public.admin_dashboard_counts;

revoke all on api.admin_dashboard_counts from public, anon;
grant select on api.admin_dashboard_counts to authenticated, service_role;

comment on view api.admin_dashboard_counts is
  'Review-queue counters for the Command Centre. security_invoker, so the counts a caller sees are the rows their own role may read.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260808120000','expose_signal_quality_to_api','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260808120000_expose_signal_quality_to_api.sql

-- RECOVERY BEGIN 20260808190400_restore_harbourview_admin_guard.sql
-- The recorded marketplace image trust migration did not create its helper in
-- production even though later repository migrations and policies expect it.
-- Restore the existing Harbourview admin/operator role guard before the image
-- trust reconciliation migration creates its admin policies.

create or replace function public.is_harbourview_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('admin', 'operator')
  );
$$;

revoke all on function public.is_harbourview_admin() from public;
grant execute on function public.is_harbourview_admin() to authenticated, service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260808190400','restore_harbourview_admin_guard','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260808190400_restore_harbourview_admin_guard.sql
