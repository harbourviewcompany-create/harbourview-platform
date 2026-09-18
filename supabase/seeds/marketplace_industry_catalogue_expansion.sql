-- Harbourview Marketplace — industry-wide procurement catalogue
-- Catalogue/reference items only. These are not live supplier offers.
-- Every row is explicitly catalogue=true and review_required=true.
-- Seller identity, availability, certification, pricing, regulatory fit and
-- commercial terms must be confirmed before introduction or purchase.

with seed(category, title, description, product_type, region, marketplace_section, slug, location_country, condition, sku, featured, buyer_fit) as (
  values
  -- Cultivation / facility operations
  ('cultivation_equipment','Commercial LED Grow Light — 680W Class','Commercial LED fixture catalogue item for controlled-environment cultivation. Confirm PPFD map, electrical certification, warranty and availability before purchase.','LED cultivation lighting','north_america','equipment','hv-cat-led-680w','North America','New','HV-CAT-LGT-680',true,'["Cultivators","Facility operators","Procurement"]'),
  ('cultivation_equipment','High-Pressure Sodium Lighting System — 1000W Class','Commercial HPS lighting system catalogue item. Confirm ballast, reflector, electrical certification and facility requirements before purchase.','HPS lighting','north_america','equipment','hv-cat-hps-1000w','North America','New','HV-CAT-HPS-1000',false,'["Cultivators","Facility operators"]'),
  ('cultivation_equipment','Commercial Dehumidifier — 200 Pint Class','Commercial dehumidification equipment for controlled environments. Confirm extraction capacity, electrical requirements and service coverage before purchase.','Dehumidification','north_america','equipment','hv-cat-dehumidifier-200p','North America','New','HV-CAT-DEH-200',false,'["Cultivators","Facility engineers"]'),
  ('cultivation_equipment','Environmental Sensor & Climate Monitoring Kit','Sensor package for temperature, humidity and environmental monitoring. Confirm integrations, calibration and supported platform before purchase.','Environmental monitoring','europe','equipment','hv-cat-climate-sensor-kit','Europe','New','HV-CAT-ENV-001',true,'["Cultivators","QA teams","Facility operators"]'),
  ('cultivation_equipment','Automated Drip Irrigation Manifold','Commercial irrigation manifold catalogue item for multi-zone cultivation. Confirm flow rate, fittings and compatibility before purchase.','Irrigation manifold','north_america','equipment','hv-cat-irrigation-manifold','North America','New','HV-CAT-IRR-001',false,'["Cultivators","Facility operators"]'),
  ('cultivation_equipment','Water Filtration & RO System — Commercial','Commercial water filtration and reverse-osmosis system catalogue item. Confirm source-water analysis, capacity and installation requirements before purchase.','Water filtration / RO','north_america','equipment','hv-cat-commercial-ro-system','North America','New','HV-CAT-RO-001',false,'["Cultivators","Facility operators","Engineers"]'),
  ('cultivation_equipment','Vertical Rack & Cultivation Bench System','Modular cultivation rack and bench system. Confirm dimensions, load rating, sanitation requirements and facility fit before purchase.','Cultivation racks','europe','equipment','hv-cat-cultivation-racks','Europe','New','HV-CAT-RACK-001',false,'["Cultivators","Facility designers"]'),
  ('cultivation_equipment','Commercial CO2 Monitoring Controller','Environmental monitoring/control catalogue item for facilities using supplemental CO2. Confirm sensor calibration, control compatibility and safety requirements before purchase.','CO2 monitoring/controller','north_america','equipment','hv-cat-co2-controller','North America','New','HV-CAT-CO2-001',false,'["Cultivators","Facility engineers"]'),

  -- Processing / manufacturing equipment
  ('processing_equipment','Industrial Centrifuge — Pilot Scale','Pilot-scale centrifuge catalogue item for processing workflows. Confirm rotor configuration, capacity, service history and facility requirements before purchase.','Processing centrifuge','north_america','processing','hv-cat-centrifuge-pilot','North America','New','HV-CAT-CEN-001',true,'["Processors","R&D teams"]'),
  ('processing_equipment','Vacuum Oven — Laboratory / Production Scale','Temperature-controlled vacuum oven catalogue item for qualified processing workflows. Confirm chamber volume, controls, certification and service history before purchase.','Vacuum oven','north_america','processing','hv-cat-vacuum-oven','North America','New','HV-CAT-OVN-001',false,'["Processors","Laboratories","R&D teams"]'),
  ('processing_equipment','Rotary Evaporator — Pilot Scale','Pilot-scale rotary evaporation equipment catalogue item. Confirm configuration, condenser, vacuum requirements and service status before purchase.','Rotary evaporator','europe','processing','hv-cat-rotary-evaporator','Europe','New','HV-CAT-ROT-001',false,'["Processors","R&D teams"]'),
  ('processing_equipment','Industrial Mixing Vessel — Jacketed','Jacketed process vessel catalogue item for controlled manufacturing workflows. Confirm material, volume, agitation and fabrication documentation before purchase.','Jacketed mixing vessel','north_america','processing','hv-cat-jacketed-vessel','North America','New','HV-CAT-VES-001',false,'["Processors","Manufacturers"]'),
  ('processing_equipment','Inline Filtration Skid','Modular filtration skid catalogue item for process-fluid workflows. Confirm membrane/filter format, flow rate, materials and compatibility before purchase.','Filtration skid','europe','processing','hv-cat-filtration-skid','Europe','New','HV-CAT-FIL-001',false,'["Processors","Manufacturers"]'),
  ('processing_equipment','Temperature-Controlled Holding Tank','Temperature-controlled holding vessel catalogue item. Confirm volume, material, controls and installation requirements before purchase.','Holding tank','north_america','processing','hv-cat-holding-tank','North America','New','HV-CAT-TNK-001',false,'["Processors","Manufacturers"]'),
  ('processing_equipment','Benchtop Homogenizer — Laboratory Scale','Laboratory homogenization equipment catalogue item for formulation and R&D workflows. Confirm probe configuration, capacity and service status before purchase.','Laboratory homogenizer','north_america','processing','hv-cat-benchtop-homogenizer','North America','New','HV-CAT-HOM-001',false,'["R&D teams","Laboratories"]'),

  -- QA / laboratory
  ('lab_testing','Potency & Cannabinoid Analytical Testing Panel','Catalogue laboratory service for analytical cannabinoid testing. Actual methods, accreditation, sample requirements, jurisdiction and turnaround require confirmation before booking.','Cannabinoid analytical testing','north_america','services','hv-cat-potency-testing','North America','New','HV-CAT-LAB-001',true,'["QA teams","Manufacturers","Clinicians"]'),
  ('lab_testing','Residual Solvent & Contaminant Testing Panel','Catalogue testing service covering selected contaminant and residual-solvent workflows. Confirm applicable methods, scope and laboratory availability before booking.','Contaminant testing','north_america','services','hv-cat-contaminant-testing','North America','New','HV-CAT-LAB-002',false,'["QA teams","Processors","Manufacturers"]'),
  ('lab_testing','Heavy Metals & Elemental Analysis Panel','Catalogue laboratory service for elemental analysis. Confirm method, reporting limits, accreditation and jurisdictional requirements before booking.','Elemental analysis','europe','services','hv-cat-heavy-metals-testing','Europe','New','HV-CAT-LAB-003',false,'["QA teams","Manufacturers"]'),
  ('lab_testing','Stability Chamber — Laboratory Equipment','Temperature/humidity-controlled stability chamber catalogue item. Confirm chamber volume, monitoring, calibration and service status before purchase.','Stability chamber','north_america','equipment','hv-cat-stability-chamber','North America','New','HV-CAT-LAB-004',false,'["QA teams","Laboratories"]'),
  ('lab_testing','Laboratory HPLC System — Analytical','Analytical HPLC catalogue item for laboratory workflows. Confirm detector configuration, service history, software compatibility and installation before purchase.','HPLC system','north_america','equipment','hv-cat-hplc-system','North America','Used','HV-CAT-LAB-005',true,'["Laboratories","QA teams"]'),
  ('lab_testing','Laboratory GC System — Analytical','Analytical GC catalogue item for qualified laboratory workflows. Confirm configuration, detector, service history and installation requirements before purchase.','GC analytical system','europe','equipment','hv-cat-gc-system','Europe','Used','HV-CAT-LAB-006',false,'["Laboratories","QA teams"]'),

  -- Pharmacy / clinical / professional operations (non-drug equipment)
  ('new_products','Pharmacy-Grade Medical Refrigerator — 2 to 8C','Temperature-controlled refrigerator catalogue item for qualified pharmacy or clinical storage workflows. Confirm local requirements, monitoring, alarm and validation before purchase.','Medical refrigerator','north_america','equipment','hv-cat-medical-refrigerator-2-8c','North America','New','HV-CAT-PHR-001',true,'["Pharmacists","Clinics","Dispensaries"]'),
  ('new_products','Temperature Data Logger & Alert Kit','Temperature monitoring and alerting equipment for storage and transport workflows. Confirm calibration, connectivity and compliance requirements before purchase.','Temperature monitoring','north_america','equipment','hv-cat-temp-logger-kit','North America','New','HV-CAT-PHR-002',false,'["Pharmacists","Distributors","QA teams"]'),
  ('new_products','Secure Medication Storage Cabinet','Lockable storage cabinet catalogue item for controlled clinical or pharmacy environments. Confirm dimensions, security requirements and local compliance before purchase.','Secure storage cabinet','north_america','equipment','hv-cat-secure-storage-cabinet','North America','New','HV-CAT-PHR-003',false,'["Pharmacists","Clinics","Operators"]'),
  ('professional_services','Clinical Workflow & Documentation Consulting','Catalogue consulting service for clinical workflow, documentation and operational process design. Scope, jurisdiction and provider credentials require confirmation before engagement.','Clinical workflow consulting','north_america','services','hv-cat-clinical-workflow-consulting','North America','New','HV-CAT-SVC-CLN-001',true,'["Doctors","Pharmacists","Clinic operators"]'),
  ('professional_services','Pharmacy Operations & Inventory Consulting','Catalogue consulting service for pharmacy operations, inventory controls and procurement workflows. Scope and provider qualifications require confirmation before engagement.','Pharmacy operations consulting','north_america','services','hv-cat-pharmacy-operations-consulting','North America','New','HV-CAT-SVC-PHR-001',false,'["Pharmacists","Operators","Distributors"]'),
  ('professional_services','Quality Management System Implementation Support','Catalogue professional service for QMS design and implementation support. Confirm applicable standard, jurisdiction and provider qualifications before engagement.','QMS consulting','europe','professional_services','hv-cat-qms-implementation','Europe','New','HV-CAT-SVC-QMS-001',false,'["Operators","Manufacturers","QA leaders"]'),

  -- Distribution / warehousing / cold chain
  ('logistics','Temperature-Controlled Transport Service','Catalogue logistics service for temperature-sensitive shipments. Confirm lane, carrier credentials, temperature range, insurance and documentation before booking.','Cold-chain transport','north_america','logistics','hv-cat-cold-chain-transport','North America','New','HV-CAT-LOG-001',true,'["Distributors","Pharmacists","Manufacturers"]'),
  ('logistics','Secure Warehousing & Inventory Handling','Catalogue warehousing service for qualified inventory programs. Confirm facility credentials, storage conditions, security, insurance and jurisdiction before engagement.','Secure warehousing','europe','logistics','hv-cat-secure-warehousing','Europe','New','HV-CAT-LOG-002',false,'["Distributors","Operators","Manufacturers"]'),
  ('logistics','Palletized Freight & LTL Shipping','Catalogue freight service for commercial palletized shipments. Confirm lane, carrier, cargo restrictions and documentation before booking.','LTL freight','north_america','logistics','hv-cat-ltl-freight','North America','New','HV-CAT-LOG-003',false,'["Distributors","Suppliers","Operators"]'),
  ('logistics','Inventory Fulfillment & Pick-Pack Service','Catalogue fulfillment service for eligible commercial goods. Confirm SKU profile, service region, storage requirements and integration capabilities before engagement.','Fulfillment service','north_america','logistics','hv-cat-fulfillment-pick-pack','North America','New','HV-CAT-LOG-004',false,'["Distributors","Brands","Operators"]'),

  -- Packaging / consumables
  ('packaging','Tamper-Evident Packaging Components','Catalogue tamper-evident packaging components. Confirm material, format, testing/certification documentation, MOQ and jurisdiction before purchase.','Tamper-evident packaging','north_america','packaging','hv-cat-tamper-evident-packaging','North America','New','HV-CAT-PKG-001',true,'["Manufacturers","Processors","Brands"]'),
  ('packaging','High-Barrier Film Rollstock','Catalogue barrier film rollstock for packaging workflows. Confirm barrier specification, material, width, printing, MOQ and documentation before purchase.','Barrier film rollstock','europe','packaging','hv-cat-barrier-film-rollstock','Europe','New','HV-CAT-PKG-002',false,'["Manufacturers","Packaging teams"]'),
  ('packaging','Child-Resistant Closure Components','Catalogue child-resistant closure components. Confirm applicable testing, material, dimensions, compatibility and jurisdiction before purchase.','Child-resistant closures','north_america','packaging','hv-cat-cr-closures','North America','New','HV-CAT-PKG-003',false,'["Brands","Processors","Packaging teams"]'),
  ('packaging','Label Stock & Variable Data Labels','Catalogue label stock and variable-data label materials for commercial packaging workflows. Confirm substrate, adhesive, printer compatibility and compliance requirements before purchase.','Label materials','north_america','packaging','hv-cat-label-stock','North America','New','HV-CAT-PKG-004',false,'["Brands","Manufacturers","Distributors"]'),
  ('consumables','Nitrile Examination Gloves — Case Quantity','Catalogue nitrile glove supply for clinical, laboratory and production environments. Confirm size, material, certification and availability before purchase.','Nitrile gloves','north_america','supply','hv-cat-nitrile-gloves','North America','New','HV-CAT-CONS-001',false,'["Doctors","Pharmacists","Laboratories","Operators"]'),
  ('consumables','Cleanroom Garment & PPE Kit','Catalogue cleanroom garment and PPE supply package. Confirm garment classification, material, sizing and site requirements before purchase.','Cleanroom PPE','north_america','supply','hv-cat-cleanroom-ppe','North America','New','HV-CAT-CONS-002',false,'["Manufacturers","Laboratories","Processors"]'),
  ('consumables','Sanitation & Facility Cleaning Consumables','Catalogue sanitation and cleaning supply range for production and facility environments. Confirm chemical compatibility, site procedures and applicable documentation before purchase.','Facility sanitation supplies','europe','supply','hv-cat-sanitation-consumables','Europe','New','HV-CAT-CONS-003',false,'["Cultivators","Manufacturers","Facility operators"]'),
  ('consumables','Water-Soluble Nutrient Delivery Components','Catalogue nutrient-delivery consumable components for cultivation systems. Confirm formulation compatibility, supplier documentation and local requirements before purchase.','Nutrient delivery supplies','north_america','supply','hv-cat-nutrient-delivery-components','North America','New','HV-CAT-CONS-004',false,'["Cultivators","Facility procurement"]'),

  -- Used / surplus / infrastructure
  ('used_surplus','Commercial Walk-In Cooler — Facility Surplus','Catalogue surplus walk-in cooler equipment. Confirm dimensions, refrigeration system, condition, dismantling, transport and installation requirements before purchase.','Walk-in cooler','north_america','used_surplus','hv-cat-surplus-walk-in-cooler','North America','Used','HV-CAT-USED-001',true,'["Operators","Distributors","Facilities"]'),
  ('used_surplus','Stainless Steel Processing Tables — Lot','Catalogue surplus stainless work-table lot. Confirm dimensions, grade, condition, quantity and freight requirements before purchase.','Stainless processing tables','north_america','used_surplus','hv-cat-surplus-processing-tables','North America','Used','HV-CAT-USED-002',false,'["Processors","Manufacturers","Cultivators"]'),
  ('used_surplus','Commercial Forklift — Facility Equipment','Catalogue used forklift equipment. Confirm hours, maintenance records, certification, battery/fuel system and local operating requirements before purchase.','Forklift','north_america','used_surplus','hv-cat-used-forklift','North America','Used','HV-CAT-USED-003',false,'["Warehouses","Distributors","Operators"]'),
  ('used_surplus','Industrial Shelving & Warehouse Racking Lot','Catalogue used warehouse racking and shelving lot. Confirm dimensions, load ratings, condition and installation requirements before purchase.','Warehouse racking','europe','used_surplus','hv-cat-used-warehouse-racking','Europe','Used','HV-CAT-USED-004',false,'["Distributors","Warehouses","Operators"]')
),
inserted as (
  insert into public.listings (
    category,title,description,product_type,region,seller_type,high_level_specs,status,
    marketplace_section,slug,public_visibility,is_featured,price_currency,location_country,
    condition,sold_by_harbourview,sku,compliance_flags,target_countries
  )
  select
    s.category::marketplace_category,
    s.title,
    s.description,
    s.product_type,
    s.region::region,
    'other'::seller_type,
    jsonb_build_object('catalogue',true,'review_required',true,'price_display','Catalogue','buyer_fit',s.buyer_fit::jsonb),
    'approved'::listing_status,
    s.marketplace_section,
    s.slug,
    true,
    s.featured,
    'USD',
    s.location_country,
    s.condition,
    false,
    s.sku,
    '{"review_required":true}'::jsonb,
    '{}'::text[]
  from seed s
  where not exists (select 1 from public.listings l where l.slug = s.slug)
  returning id
)
select count(*) as inserted_rows from inserted;
