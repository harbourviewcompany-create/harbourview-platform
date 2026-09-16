-- Harbourview Marketplace operational catalogue completion
-- Reference/catalogue records only. No live supplier, price, stock, licence or certification claims.
-- Safe to rerun: inserts are gated by slug uniqueness.

insert into public.listings (
  slug,title,description,marketplace_section,category,product_type,
  public_visibility,status,sold_by_harbourview,is_featured,
  high_level_specs,compliance_flags,price_display
)
select * from (values
('pre-roll-cone-loading-system','Pre-roll Cone Loading System','Reference equipment for automated cone loading workflows.','processing','equipment','pre_roll_equipment'),
('pre-roll-filling-machine','Pre-roll Filling Machine','Reference equipment for automated pre-roll filling workflows.','processing','equipment','pre_roll_equipment'),
('pre-roll-grinding-system','Pre-roll Grinding and Milling System','Reference milling equipment for controlled material preparation.','processing','equipment','milling'),
('pre-roll-weighing-dosing-system','Pre-roll Weighing and Dosing System','Reference precision weighing and dosing equipment.','processing','equipment','dosing'),
('pre-roll-packaging-line','Pre-roll Packaging Line','Reference packaging-line equipment for finished-product workflows.','packaging','equipment','packaging_line'),
('pre-roll-tubes','Pre-roll Tubes','Reference packaging component for regulated pre-roll formats.','packaging','consumables','pre_roll_packaging'),
('tamper-evident-seals','Tamper-Evident Seals','Reference tamper-evident packaging component.','packaging','consumables','security_seal'),
('desiccant-packs','Desiccant and Humidity-Control Packs','Reference packaging consumable for moisture management.','packaging','consumables','humidity_control'),
('cultivation-substrate','Commercial Cultivation Substrate','Reference growing-media category for cultivation operations.','consumables','consumables','cultivation_input'),
('propagation-trays','Propagation Trays and Inserts','Reference propagation supplies.','consumables','consumables','propagation'),
('irrigation-pump-system','Commercial Irrigation Pump System','Reference irrigation equipment.','equipment','equipment','irrigation'),
('fertigation-controller','Fertigation Controller','Reference automated nutrient-delivery control equipment.','equipment','equipment','fertigation'),
('cultivation-trellising','Cultivation Trellising System','Reference cultivation support equipment.','equipment','equipment','cultivation_support'),
('harvest-drying-racks','Harvest and Drying Rack System','Reference post-harvest handling equipment.','equipment','equipment','post_harvest'),
('commercial-trimming-system','Commercial Trimming System','Reference post-harvest trimming equipment.','processing','equipment','trimming'),
('curing-storage-system','Controlled Curing and Storage System','Reference post-harvest storage equipment.','equipment','equipment','storage'),
('air-handling-unit','Commercial Air Handling Unit','Reference facility HVAC/AHU equipment.','equipment','equipment','hvac'),
('hepa-filtration-system','HEPA Air Filtration System','Reference facility air-filtration equipment.','equipment','equipment','air_filtration'),
('backup-generator','Commercial Backup Generator','Reference facility backup-power equipment.','equipment','equipment','backup_power'),
('ups-power-system','Commercial UPS Power System','Reference power-continuity equipment.','equipment','equipment','power_continuity'),
('water-treatment-system','Commercial Water Treatment System','Reference water-treatment equipment.','equipment','equipment','water_treatment'),
('fire-life-safety-system','Fire and Life-Safety Equipment Package','Reference facility safety equipment category.','equipment','equipment','facility_safety'),
('access-control-system','Facility Access-Control System','Reference physical access-control infrastructure.','equipment','equipment','security'),
('production-filling-system','Production Filling System','Reference filling equipment for manufacturing workflows.','processing','equipment','filling'),
('production-capping-system','Production Capping System','Reference capping equipment.','processing','equipment','capping'),
('production-labeling-system','Production Labeling System','Reference labeling equipment.','processing','equipment','labeling'),
('production-conveyor','Production Conveyor System','Reference material-handling equipment.','processing','equipment','conveyor'),
('cip-system','Clean-in-Place System','Reference sanitation and process equipment.','processing','equipment','cip'),
('industrial-floor-scale','Industrial Floor Scale','Reference weighing equipment for operations and warehousing.','equipment','equipment','scales'),
('water-activity-meter','Water Activity Meter','Reference QA/laboratory measurement equipment.','labs_testing','equipment','qa_instrument'),
('moisture-analyzer','Moisture Analyzer','Reference QA measurement equipment.','labs_testing','equipment','qa_instrument'),
('analytical-balance','Analytical Balance','Reference precision laboratory weighing equipment.','labs_testing','equipment','lab_instrument'),
('sample-storage-system','Laboratory Sample Storage System','Reference sample-management/storage equipment.','labs_testing','equipment','sample_storage'),
('calibration-service','Equipment Calibration Service','Reference QA calibration service category.','labs_testing','services','calibration'),
('validation-service','Equipment and Process Validation Service','Reference validation service category; scope and credentials require verification.','professional_services','services','validation'),
('dispensing-workstation','Pharmacy Dispensing Workstation','Reference pharmacy workflow equipment.','equipment','equipment','pharmacy_workflow'),
('barcode-label-printer','Barcode and Label Printing System','Reference pharmacy/warehouse labeling equipment.','equipment','equipment','barcode'),
('cold-chain-monitoring-kit','Cold-Chain Monitoring Kit','Reference temperature-monitoring equipment.','equipment','equipment','cold_chain'),
('warehouse-barcode-scanner','Warehouse Barcode Scanner System','Reference warehouse identification equipment.','equipment','equipment','warehouse_tech'),
('rfid-inventory-system','RFID Inventory System','Reference inventory-identification technology.','equipment','equipment','inventory_tech'),
('warehouse-pallets','Commercial Warehouse Pallets','Reference warehouse consumable/equipment category.','logistics','consumables','warehouse_supply'),
('warehouse-totes','Reusable Warehouse Totes','Reference warehouse material-handling supplies.','logistics','consumables','warehouse_supply'),
('serialized-labels','Serialized Variable-Data Labels','Reference traceability/packaging component.','packaging','consumables','serialization'),
('inventory-management-integration','Inventory Management Integration Service','Reference software integration service.','services','services','software_integration'),
('traceability-integration','Traceability and Serialization Integration Service','Reference technology service; implementation scope requires review.','services','services','traceability'),
('managed-it-cybersecurity','Managed IT and Cybersecurity Service','Reference operational technology service category.','services','services','it_security'),
('facility-design-consulting','Facility Design and Engineering Consulting','Reference facility-planning service category.','professional_services','services','facility_design')
) as v(slug,title,description,marketplace_section,category,product_type)
where not exists (select 1 from public.listings l where l.slug=v.slug);
