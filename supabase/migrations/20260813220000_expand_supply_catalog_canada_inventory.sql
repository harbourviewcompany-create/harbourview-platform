-- Expand the Harbourview Supply catalog with 24 additional Canada SKUs
-- across existing categories (already applied live this session):
--
-- Packaging (4): foil-lined odor-control pouches (3.5g/7g), empty gel
-- capsules for oil-fill, flip-top CR bud tube (alternate closure style).
--
-- Consumables (10): production PPE (nitrile gloves, hair nets, beard
-- covers, disposable coats), surface sanitizer wipes, solventless/ethanol
-- extraction filter media, GC/HPLC sample vials, cannabinoid reference
-- standard kit, trim bin liners.
--
-- Cultivation equipment (5): commercial dehumidifier, CO2 enrichment
-- system, screened trim bin, oscillating circulation fan, integrated
-- environmental controller.
--
-- Processing equipment (5): commercial rosin press, decarboxylation oven,
-- infusion machine (edibles/topicals), capsule filling/encapsulation
-- machine, hand-held case tape dispenser.
--
-- All 24 rows carry target_countries = {CA}. The 20 that are generic
-- equipment/consumables (not cannabis-specific consumer packaging) were
-- then also extended to DE/AU in the same pattern as the existing 35 --
-- see the companion UPDATE below and the Germany/Australia migrations this
-- builds on. The 4 packaging items stay Canada-only for the same reasons
-- documented in those migrations (no established consumer retail channel in
-- DE, medical-only/no retail channel in AU).

insert into public.listings
  (id, category, title, description, product_type, region, price_range, seller_type,
   high_level_specs, status, public_visibility, is_featured, price_amount, price_currency,
   location_country, condition, brand, model, quantity, unit, slug, marketplace_section,
   sold_by_harbourview, sku, stock_qty, lead_time_days, moq, compliance_flags, target_countries,
   created_at, updated_at)
values
(gen_random_uuid(),'packaging','Foil-Lined Smell-Proof Pouch — 3.5g','Foil-lined mylar pouch with child-resistant zipper for enhanced odor control.','pouch','north_america','negotiable','distributor','{"size":"3.5g","material":"foil-lined mylar","cr":true}','approved',true,false,0.13,'CAD','CA','new','Harbourview Supply','HV-POUCH-FOIL35',1000,'each','foil-lined-smell-proof-pouch-3-5g','packaging',true,'HVP-PCH-FOIL35',15000,10,1000,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"csa_z76_1":true}}','{CA}',now(),now()),
(gen_random_uuid(),'packaging','Foil-Lined Smell-Proof Pouch — 7g','Foil-lined mylar pouch with child-resistant zipper for enhanced odor control.','pouch','north_america','negotiable','distributor','{"size":"7g","material":"foil-lined mylar","cr":true}','approved',true,false,0.16,'CAD','CA','new','Harbourview Supply','HV-POUCH-FOIL7',1000,'each','foil-lined-smell-proof-pouch-7g','packaging',true,'HVP-PCH-FOIL07',12000,10,1000,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"csa_z76_1":true}}','{CA}',now(),now()),
(gen_random_uuid(),'packaging','Empty Gel Capsules — Size 00 (Bulk, for Oil Fill)','Empty size 00 gel capsules for cannabis oil capsule production.','capsule','north_america','negotiable','distributor','{"size":"00"}','approved',true,false,0.02,'CAD','CA','new','Harbourview Supply','HV-CAP-00',1000,'each','empty-gel-capsules-size-00-bulk','packaging',true,'HVP-CAP-000',300000,10,10000,'{}','{CA}',now(),now()),
(gen_random_uuid(),'packaging','CR Bud Tube — Flip-Top Single Pre-Roll','Child-resistant flip-top tube, alternative closure style for single pre-rolls.','pre_roll_tube','north_america','negotiable','distributor','{"cr":true,"closure":"flip-top"}','approved',true,false,0.15,'CAD','CA','new','Harbourview Supply','HV-TUBE-FLIP',1000,'each','cr-bud-tube-flip-top-single','packaging',true,'HVP-TUB-FLIP',18000,10,1000,'{"CA":{"child_resistant":true,"tamper_evident":true,"opaque":true,"plain_packaging":true,"csa_z76_1":true}}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','Nitrile Gloves — Powder-Free (Case of 1000)','Powder-free nitrile gloves for production and packaging handling.','ppe','north_america','negotiable','distributor','{}','approved',true,false,0.06,'CAD','CA','new','Harbourview Supply','HV-GLOVE-1',1000,'each','nitrile-gloves-powder-free-case','consumables',true,'HVP-PPE-GLV',400000,7,1000,'{}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','Disposable Hair Nets (Case of 1000)','Disposable hair nets for GMP-aligned production areas.','ppe','north_america','negotiable','distributor','{}','approved',true,false,0.04,'CAD','CA','new','Harbourview Supply','HV-HAIRNET-1',1000,'each','disposable-hair-nets-case','consumables',true,'HVP-PPE-HRN',300000,7,1000,'{}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','Disposable Beard Covers (Case of 1000)','Disposable beard covers for GMP-aligned production areas.','ppe','north_america','negotiable','distributor','{}','approved',true,false,0.04,'CAD','CA','new','Harbourview Supply','HV-BEARDCOV-1',1000,'each','disposable-beard-covers-case','consumables',true,'HVP-PPE-BRD',250000,7,1000,'{}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','Disposable Lab/Production Coats (Case of 100)','Disposable coveralls/coats for lab and production floor use.','ppe','north_america','negotiable','distributor','{}','approved',true,false,3.20,'CAD','CA','new','Harbourview Supply','HV-LABCOAT-1',100,'each','disposable-production-coats-case','consumables',true,'HVP-PPE-COAT',6000,10,50,'{}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','Cannabis-Safe Surface Sanitizer Wipes (Case)','Food-safe surface sanitizing wipes for production equipment and surfaces.','sanitation','north_america','negotiable','distributor','{}','approved',true,false,0.03,'CAD','CA','new','Harbourview Supply','HV-WIPE-1',1000,'each','surface-sanitizer-wipes-case','consumables',true,'HVP-SAN-WIP',200000,7,2000,'{}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','Solventless Rosin Filter Bags — Mixed Micron (Bulk)','Nylon mesh rosin press filter bags, mixed micron pack for solventless extraction.','extraction_supply','north_america','negotiable','distributor','{}','approved',true,false,0.35,'CAD','CA','new','Harbourview Supply','HV-ROSINBAG-1',500,'each','rosin-filter-bags-mixed-micron-bulk','consumables',true,'HVP-EXT-ROS',5000,10,100,'{}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','Ethanol Extraction Filter Bags (Bulk)','Filter bags for ethanol-based extraction filtration.','extraction_supply','north_america','negotiable','distributor','{}','approved',true,false,1.10,'CAD','CA','new','Harbourview Supply','HV-ETOHBAG-1',200,'each','ethanol-extraction-filter-bags-bulk','consumables',true,'HVP-EXT-ETO',2000,14,50,'{}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','GC/HPLC Sample Vials (Bulk, Case of 1000)','Analytical sample vials for GC/HPLC potency and pesticide testing workflows.','lab_supply','north_america','negotiable','distributor','{}','approved',true,false,0.09,'CAD','CA','new','Harbourview Supply','HV-VIAL-1',1000,'each','gc-hplc-sample-vials-bulk','labs_testing',true,'HVP-LAB-VIL',150000,10,1000,'{}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','Cannabinoid Analytical Reference Standard Kit','Certified reference standard kit for cannabinoid potency calibration.','lab_supply','north_america','negotiable','distributor','{}','approved',true,false,320.00,'CAD','CA','new','Harbourview Supply','HV-REFSTD-1',60,'kit','cannabinoid-reference-standard-kit','labs_testing',true,'HVP-LAB-REF',300,14,2,'{}','{CA}',now(),now()),
(gen_random_uuid(),'consumables','Trim Bin Liners (Bulk Roll)','Disposable liners for trim bins, food-grade.','cultivation_supply','north_america','negotiable','distributor','{}','approved',true,false,0.08,'CAD','CA','new','Harbourview Supply','HV-TRIMLINER-1',500,'each','trim-bin-liners-bulk-roll','consumables',true,'HVP-CUL-TRML',20000,7,200,'{}','{CA}',now(),now()),
(gen_random_uuid(),'cultivation_equipment','Commercial Dehumidifier (Grow Room Rated)','Commercial-grade dehumidifier sized for cultivation/drying rooms.','environmental_control','north_america','negotiable','distributor','{}','approved',true,false,1450.00,'CAD','CA','new','Harbourview Supply','HV-DEHUM-1',15,'unit','commercial-dehumidifier-grow-room','equipment',true,'HVP-CUL-DEH',15,21,1,'{}','{CA}',now(),now()),
(gen_random_uuid(),'cultivation_equipment','CO2 Enrichment System (Room-Scale)','CO2 enrichment and monitoring system for flowering room canopy scale.','environmental_control','north_america','negotiable','distributor','{}','approved',true,false,2200.00,'CAD','CA','new','Harbourview Supply','HV-CO2SYS-1',10,'unit','co2-enrichment-system-room-scale','equipment',true,'HVP-CUL-CO2',10,28,1,'{}','{CA}',now(),now()),
(gen_random_uuid(),'cultivation_equipment','Trim Bin with Screen (Commercial)','Commercial trim bin with kief-catching screen tray.','harvest_equipment','north_america','negotiable','distributor','{}','approved',true,false,145.00,'CAD','CA','new','Harbourview Supply','HV-TRIMBIN-1',40,'unit','trim-bin-with-screen-commercial','equipment',true,'HVP-CUL-TBN',40,14,1,'{}','{CA}',now(),now()),
(gen_random_uuid(),'cultivation_equipment','Oscillating Circulation Fan (Commercial)','Commercial-grade oscillating fan for canopy airflow.','environmental_control','north_america','negotiable','distributor','{}','approved',true,false,190.00,'CAD','CA','new','Harbourview Supply','HV-FAN-1',60,'unit','oscillating-circulation-fan-commercial','equipment',true,'HVP-CUL-FAN',60,14,1,'{}','{CA}',now(),now()),
(gen_random_uuid(),'cultivation_equipment','Environmental Controller (Temp/Humidity/CO2)','Integrated environmental controller for temperature, humidity, and CO2 setpoints.','environmental_control','north_america','negotiable','distributor','{}','approved',true,true,890.00,'CAD','CA','new','Harbourview Supply','HV-ENVCTRL-1',20,'unit','environmental-controller-temp-humidity-co2','equipment',true,'HVP-CUL-ENV',20,21,1,'{}','{CA}',now(),now()),
(gen_random_uuid(),'processing_equipment','Commercial Rosin Press','Dual-plate hydraulic rosin press for solventless extraction.','extraction_equipment','north_america','negotiable','distributor','{}','approved',true,true,8200.00,'CAD','CA','new','Harbourview Supply','HV-ROSINPRESS-1',3,'unit','commercial-rosin-press','processing',true,'HVP-EQP-ROS',3,28,1,'{}','{CA}',now(),now()),
(gen_random_uuid(),'processing_equipment','Decarboxylation Oven (Commercial)','Precision-controlled decarboxylation oven for cannabinoid activation.','processing_equipment','north_america','negotiable','distributor','{}','approved',true,false,5600.00,'CAD','CA','new','Harbourview Supply','HV-DECARB-1',3,'unit','decarboxylation-oven-commercial','processing',true,'HVP-EQP-DEC',3,28,1,'{}','{CA}',now(),now()),
(gen_random_uuid(),'processing_equipment','Infusion Machine (Edibles/Topicals)','Automated infusion machine for oil-based edibles and topicals production.','processing_equipment','north_america','negotiable','distributor','{}','approved',true,true,9800.00,'CAD','CA','new','Harbourview Supply','HV-INFUSE-1',2,'unit','infusion-machine-edibles-topicals','processing',true,'HVP-EQP-INF',2,35,1,'{}','{CA}',now(),now()),
(gen_random_uuid(),'processing_equipment','Capsule Filling / Encapsulation Machine','Semi-automatic encapsulation machine for oil capsule production.','filling_equipment','north_america','negotiable','distributor','{}','approved',true,false,6900.00,'CAD','CA','new','Harbourview Supply','HV-ENCAP-1',2,'unit','capsule-filling-encapsulation-machine','processing',true,'HVP-EQP-ENC',2,28,1,'{}','{CA}',now(),now()),
(gen_random_uuid(),'processing_equipment','Hand-Held Case Tape Dispenser (Bulk Pack)','Manual case-sealing tape dispenser guns for packing stations.','packing_equipment','north_america','negotiable','distributor','{}','approved',true,false,28.00,'CAD','CA','new','Harbourview Supply','HV-TAPEGUN-1',100,'unit','hand-held-case-tape-dispenser','processing',true,'HVP-EQP-TPG',300,7,5,'{}','{CA}',now(),now());

update public.listings
set target_countries = target_countries || array['DE','AU']
where sold_by_harbourview = true
and slug in (
  'nitrile-gloves-powder-free-case','disposable-hair-nets-case','disposable-beard-covers-case',
  'disposable-production-coats-case','surface-sanitizer-wipes-case','rosin-filter-bags-mixed-micron-bulk',
  'ethanol-extraction-filter-bags-bulk','gc-hplc-sample-vials-bulk','cannabinoid-reference-standard-kit',
  'trim-bin-liners-bulk-roll','commercial-dehumidifier-grow-room','co2-enrichment-system-room-scale',
  'trim-bin-with-screen-commercial','oscillating-circulation-fan-commercial','environmental-controller-temp-humidity-co2',
  'commercial-rosin-press','decarboxylation-oven-commercial','infusion-machine-edibles-topicals',
  'capsule-filling-encapsulation-machine','hand-held-case-tape-dispenser'
)
and not ('DE' = any(target_countries));
