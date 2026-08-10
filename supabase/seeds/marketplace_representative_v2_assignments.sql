-- Harbourview Marketplace representative catalogue V2 assignments
-- Generated from the verified production PR #1307 rollout on 2026-08-10.
-- 151 listing mappings; generated media remains illustrative, never item evidence.
-- Safe precedence: this seed never replaces approved REAL_ITEM_EVIDENCE or MANUFACTURER_CATALOGUE media.

with mapping(item_id, asset_file) as (
  values
    ('0004dc44-c8e3-4339-b40a-2827ea04f68d'::uuid, 'retail-facility.png'),
    ('0097cc5c-a36f-4242-a795-8f2f19ca239e'::uuid, 'advisory-services.png'),
    ('0122f5e3-40ec-4305-977a-737c1fc04688'::uuid, 'cultivation-inputs.png'),
    ('026fc061-2e40-4304-a36a-936ba23d6397'::uuid, 'packaging-pouches.png'),
    ('075954a9-c9e1-4205-8963-6df38d546ad8'::uuid, 'facility-supplies.png'),
    ('08e59baa-69fc-41d9-8fe8-678d632ad114'::uuid, 'bulk-flower.png'),
    ('0a6ed9d8-0e57-44b9-ac69-802355bf5fef'::uuid, 'cultivation-inputs.png'),
    ('0b8baad3-9e11-45dd-8e2d-adf0a88f095e'::uuid, 'packaging-equipment.png'),
    ('0c39cc61-13c3-4f2d-98e4-7a46d76acf2c'::uuid, 'grow-lighting.png'),
    ('0ea40b97-526b-4932-8a15-373e6f3015ae'::uuid, 'extraction-equipment.png'),
    ('0f084ffc-d59e-4329-9d60-c20075e2c052'::uuid, 'product-inventory.png'),
    ('0f30cf53-5aa5-475c-a1a0-3aec1dfab95a'::uuid, 'packaging-equipment.png'),
    ('0fc97c1d-fc6a-4b3a-877a-3324b198d89a'::uuid, 'product-inventory.png'),
    ('10c0d4ab-67f7-4478-816a-8f8469c8a182'::uuid, 'cultivation-inputs.png'),
    ('11a07916-3306-454d-b143-bee208399d6a'::uuid, 'extraction-equipment.png'),
    ('11aafa0c-510d-4a9f-bfc7-01e4dd403d1a'::uuid, 'lab-qa.png'),
    ('11eecb63-7e8d-4906-bf71-6f542c95c2dd'::uuid, 'cultivation-inputs.png'),
    ('130ad019-a165-4a19-9f46-77d41332d57e'::uuid, 'packaging-pouches.png'),
    ('13f2bbf4-bd74-4dae-964b-2c0c34ab8d38'::uuid, 'packaging-pouches.png'),
    ('15970878-6c39-4759-9d15-49eed526957c'::uuid, 'product-inventory.png'),
    ('1914872d-6ef9-435b-878b-5ee21db3ab44'::uuid, 'packaging-pouches.png'),
    ('1ac55676-556f-4729-861c-0c86e1439f69'::uuid, 'packaging-pouches.png'),
    ('1e0520af-845e-4091-b908-a67a62f84f76'::uuid, 'lab-qa.png'),
    ('21cfe1ce-adb2-4bc2-9129-cfd0b6f9eff3'::uuid, 'packaging-equipment.png'),
    ('2275531f-1a52-421e-a205-262226e1b2ab'::uuid, 'lab-qa.png'),
    ('239c5b67-8bc3-49a4-a766-c107dda01936'::uuid, 'hemp-biomass.png'),
    ('243f3174-2fd9-4618-9487-bbf3d95164ce'::uuid, 'cultivation-inputs.png'),
    ('256ca3c4-36c0-4ffb-b27d-1ee79b0af506'::uuid, 'packaging-pouches.png'),
    ('28accca1-c3f8-4cb9-9b93-e2b7739975ea'::uuid, 'cultivation-inputs.png'),
    ('2c01b346-f89a-41d3-b20c-f4c292e1e635'::uuid, 'packaging-equipment.png'),
    ('2cbfc21e-4f02-4f84-9e2b-7b591048cb08'::uuid, 'packaging-pouches.png'),
    ('2d47c860-985a-45b5-9246-91187445a229'::uuid, 'packaging-pouches.png'),
    ('2e03809a-553c-4311-abf0-87cde0d32f35'::uuid, 'lab-qa.png'),
    ('321e6111-7b39-4d7a-931e-e94e65c11a84'::uuid, 'lab-qa.png'),
    ('351587e3-5060-4581-951e-3ac8910a078f'::uuid, 'packaging-equipment.png'),
    ('3546171e-cd0f-4178-93ab-f101fcfd295b'::uuid, 'packaging-pouches.png'),
    ('36b28436-79db-48dd-8dae-f9730ff739c7'::uuid, 'packaging-pouches.png'),
    ('3a22e325-0da3-4c35-a7c9-9f140d30b948'::uuid, 'packaging-pouches.png'),
    ('3ab84ccd-4351-4631-bc9d-6c04deda6f94'::uuid, 'packaging-pouches.png'),
    ('3d9afc87-8a69-4782-8107-606a016cc9f8'::uuid, 'cultivation-inputs.png'),
    ('4057c609-399a-4085-b217-23dffb2970b0'::uuid, 'cultivation-inputs.png'),
    ('40be3939-83ff-4684-808c-4855bda6b7d2'::uuid, 'grow-lighting.png'),
    ('419069a4-f562-4986-a31d-55d56a79695c'::uuid, 'cultivation-inputs.png'),
    ('455d32a8-661d-4b30-8768-ce4f308dda34'::uuid, 'packaging-pouches.png'),
    ('480ca066-c2ad-46ce-ad80-e4cb8ecf3ee1'::uuid, 'lab-qa.png'),
    ('480fd81b-74c2-4591-9f29-96ce03548ffb'::uuid, 'retail-facility.png'),
    ('48c8de76-dfbd-4c68-ac3c-ccb3714177f4'::uuid, 'cultivation-inputs.png'),
    ('48fd4f27-bbc9-4dc1-b453-c107c3e182bd'::uuid, 'packaging-pouches.png'),
    ('4ae963af-c3d2-4d63-b971-52802db324e8'::uuid, 'packaging-equipment.png'),
    ('4b27ef33-7cfe-4ab1-ae14-1a26d0545301'::uuid, 'facility-supplies.png'),
    ('4d2d3022-50f4-4497-b488-0ac157f1ab0f'::uuid, 'packaging-pouches.png'),
    ('524a6e3f-ad01-4d67-9c42-c5acc7701522'::uuid, 'facility-supplies.png'),
    ('53261076-9594-459b-9a0e-aa9a05cb7c60'::uuid, 'facility-supplies.png'),
    ('53b81354-d512-4d6b-9e62-f5846a1b6b4e'::uuid, 'packaging-pouches.png'),
    ('551f25b3-a851-4460-943c-3eacd07667f6'::uuid, 'grow-lighting.png'),
    ('579f8026-963a-4a5d-9535-ccea9462dbdb'::uuid, 'packaging-pouches.png'),
    ('57dbc9f7-6581-4df6-a737-1cfd961759c1'::uuid, 'retail-facility.png'),
    ('5b3bee90-9d50-4f1d-bc37-ffd197690c19'::uuid, 'hemp-biomass.png'),
    ('5b950bc6-013c-4226-b04b-93ac2a677877'::uuid, 'packaging-pouches.png'),
    ('5ba2e44f-e119-4471-91b3-47a061036d42'::uuid, 'product-inventory.png'),
    ('5c0e478d-5ecf-4ee8-a6db-49bac4d529d2'::uuid, 'packaging-pouches.png'),
    ('5d1acb78-85bb-4f84-8f0e-85c2245acba2'::uuid, 'grow-lighting.png'),
    ('5d678230-8bc5-4a0e-8ddc-66778d126b76'::uuid, 'facility-supplies.png'),
    ('5ea2cac4-fde8-436f-91c9-c1d828a4d9c3'::uuid, 'retail-facility.png'),
    ('604d5bd1-7910-4ec1-8b05-8f92ebc7ffef'::uuid, 'packaging-pouches.png'),
    ('60bb17d2-5a27-4aab-aa3e-4e12059e69e0'::uuid, 'packaging-pouches.png'),
    ('625011fd-c012-4ec9-978d-c0b4e6f142b3'::uuid, 'packaging-pouches.png'),
    ('62dab2cf-8c57-45d6-ad13-b31c6d8f4129'::uuid, 'packaging-pouches.png'),
    ('66581192-f794-4e25-88c3-8e55f85307f8'::uuid, 'extraction-equipment.png'),
    ('66dcee2e-918c-4b04-964b-679a23dd8e24'::uuid, 'packaging-equipment.png'),
    ('68ca9993-4ce9-43e8-890e-a8376f4a8803'::uuid, 'packaging-pouches.png'),
    ('69687531-3460-4a69-8c14-e1c0d134b610'::uuid, 'packaging-pouches.png'),
    ('6c0b4dbf-54db-4e2c-bfcb-2adf19544385'::uuid, 'packaging-pouches.png'),
    ('6e23638a-0567-4e5d-9c9f-f87e99830cc6'::uuid, 'packaging-pouches.png'),
    ('6ecdc403-93da-400a-b54d-b24c02f157e4'::uuid, 'packaging-pouches.png'),
    ('6f74372c-af80-44c3-9087-d2b798b68d42'::uuid, 'lab-qa.png'),
    ('782c143a-a3ec-4a59-9a64-6bb822058fbd'::uuid, 'retail-facility.png'),
    ('7931471f-3037-42f2-987c-6a60c722ceff'::uuid, 'extraction-equipment.png'),
    ('7b924897-8f64-4164-aca3-6dccdf1d526c'::uuid, 'packaging-pouches.png'),
    ('7cbd53a8-75cf-43af-8dc3-03f2f03fd67a'::uuid, 'extraction-equipment.png'),
    ('7fc02f93-6852-4060-a22c-6dc701716639'::uuid, 'lab-qa.png'),
    ('83020632-436e-4a7e-ae70-079e30b0582b'::uuid, 'packaging-pouches.png'),
    ('875645a0-61bd-4698-9db8-457a2e6d66a7'::uuid, 'hemp-biomass.png'),
    ('87695f8a-3af6-4ceb-aa77-850b465cccbb'::uuid, 'packaging-equipment.png'),
    ('87af39f8-010b-41cc-b6e6-cf13cc8f036d'::uuid, 'warehouse-logistics.png'),
    ('8902fda4-8bfa-4a76-bbb8-99eac67c3396'::uuid, 'facility-supplies.png'),
    ('8a54bf17-cb27-4d6b-9d00-b6c3dd6dbf5f'::uuid, 'cultivation-inputs.png'),
    ('8c2e8173-6701-43ba-8adc-67140e4142c5'::uuid, 'product-inventory.png'),
    ('8d54141b-d4ee-4f63-afa9-cfb9e3d6b8dd'::uuid, 'facility-supplies.png'),
    ('8df1db6b-d0db-4696-9ba2-1bce2a8e4cfd'::uuid, 'lab-qa.png'),
    ('8e86d7b8-6090-46a4-8938-482bdd6cf182'::uuid, 'facility-supplies.png'),
    ('8eab4cd4-ef6c-471d-b979-7ff229c14023'::uuid, 'packaging-pouches.png'),
    ('8ee6b72a-0da9-495f-a242-eaa85b9b3f00'::uuid, 'packaging-pouches.png'),
    ('914f4ae6-1dbc-4efc-bcba-415436756a86'::uuid, 'facility-supplies.png'),
    ('915fdbb4-6df4-4a1e-ba61-1898c63bc1a1'::uuid, 'packaging-pouches.png'),
    ('9463dce0-0347-43f8-882a-ff1525d2c95d'::uuid, 'packaging-pouches.png'),
    ('95d3be62-db4f-4392-aced-b461d71452bc'::uuid, 'lab-qa.png'),
    ('963a320f-9451-40c6-96c3-22d9f249dbd9'::uuid, 'packaging-pouches.png'),
    ('9cd102a2-1f5a-4fed-8b88-279fe22f5769'::uuid, 'packaging-pouches.png'),
    ('9d90a02d-7241-461c-a6eb-1259c825bbd2'::uuid, 'facility-supplies.png'),
    ('a0171f73-5a86-4b9f-a75f-4395b343e94b'::uuid, 'warehouse-logistics.png'),
    ('a1386fc4-003b-4558-9c4d-986b1cd6af28'::uuid, 'facility-supplies.png'),
    ('a20ccbad-c887-4dc0-ace7-53d5acf6655a'::uuid, 'extraction-equipment.png'),
    ('a2afa5f0-39f0-4d6f-9424-c2f913444326'::uuid, 'extraction-equipment.png'),
    ('a68f851b-9bc8-4393-a8bc-2680c119af4c'::uuid, 'packaging-pouches.png'),
    ('a6b55ae7-deaa-4b05-b4e6-88f87e0c0564'::uuid, 'bulk-flower.png'),
    ('a86986c2-e125-48eb-9425-217624f773a8'::uuid, 'facility-supplies.png'),
    ('a883b2cc-1b16-4dda-988a-77073a56b18c'::uuid, 'advisory-services.png'),
    ('aa19fbf1-85b9-4c89-9abf-43e596e11abe'::uuid, 'cultivation-inputs.png'),
    ('ac89316f-a833-406b-9da6-cc23205880b3'::uuid, 'cultivation-inputs.png'),
    ('b0959d9f-8a20-4d64-be2d-07841c21eead'::uuid, 'bulk-flower.png'),
    ('b2a118d6-7e93-4310-9d70-7781aa90329a'::uuid, 'packaging-pouches.png'),
    ('b32ecb33-7e48-4962-85d5-aae12541146d'::uuid, 'packaging-pouches.png'),
    ('bd6f70b5-e513-4e25-9f5a-7df49d9d7775'::uuid, 'packaging-pouches.png'),
    ('be428be2-212e-46b4-8a92-5d846639dccc'::uuid, 'packaging-pouches.png'),
    ('bf5e3b14-e13b-4b43-9675-c0e0a78250f8'::uuid, 'facility-supplies.png'),
    ('bf92a3c3-56d5-4c97-b38d-66e0594ed354'::uuid, 'packaging-pouches.png'),
    ('c262c7c2-a8c1-443e-91d5-b4057bc9a31f'::uuid, 'advisory-services.png'),
    ('c4433dad-3a36-48a8-a9a8-8f8990bbff40'::uuid, 'advisory-services.png'),
    ('c4751069-0425-4c1f-8f0c-141cead72f50'::uuid, 'cultivation-inputs.png'),
    ('c5510c9f-cd35-4513-b52a-e9b6ff48a096'::uuid, 'packaging-equipment.png'),
    ('c58f94f8-47d1-4591-96fb-dc9ad71ae0ff'::uuid, 'packaging-pouches.png'),
    ('c6c24e46-8c82-46fc-8a25-e64435fafe0d'::uuid, 'packaging-pouches.png'),
    ('c74ccc6d-5445-410e-a3b9-166fdc41e242'::uuid, 'product-inventory.png'),
    ('c74fb314-6546-4714-b0a8-6ca6c3d5d501'::uuid, 'lab-qa.png'),
    ('ca25146b-e84c-489b-86f3-5e6d9329628f'::uuid, 'product-inventory.png'),
    ('cb1c12f4-6901-4dc9-8169-d214b39dc35b'::uuid, 'packaging-pouches.png'),
    ('ccb1d6b6-7b88-46ee-8e40-ff29b0266f22'::uuid, 'packaging-pouches.png'),
    ('cdd70427-3b61-46fa-8603-b26e5311b1cb'::uuid, 'cultivation-inputs.png'),
    ('ce6565b7-871b-46b8-b75b-27e0ade0a2d0'::uuid, 'facility-supplies.png'),
    ('d0e318be-2ac7-4d4d-93b0-1b52991d2631'::uuid, 'cultivation-inputs.png'),
    ('d29d5b55-8fb9-40a3-a6e9-f69094c272e2'::uuid, 'product-inventory.png'),
    ('d50f151b-cb0d-4a82-af85-a3d800eb873b'::uuid, 'packaging-pouches.png'),
    ('d622b3d0-92eb-49ae-879d-c8a8aaa27c3e'::uuid, 'packaging-pouches.png'),
    ('d8d947dd-0ae1-4a03-b05f-7f446c8c42eb'::uuid, 'product-inventory.png'),
    ('d90dc6d4-92f4-435d-b853-40454ea43833'::uuid, 'retail-facility.png'),
    ('dbb71a09-b936-4a2d-937e-94e001879100'::uuid, 'warehouse-logistics.png'),
    ('dc58f415-e482-4177-82b1-1f07a5d32aa9'::uuid, 'extraction-equipment.png'),
    ('dda6aa86-0db2-43b9-b789-c68b2a72b93d'::uuid, 'lab-qa.png'),
    ('dea59cb0-4fcc-4e63-a76d-e30d33328c15'::uuid, 'warehouse-logistics.png'),
    ('df8a5b24-86f6-4d1d-9fda-e299fc993a61'::uuid, 'packaging-pouches.png'),
    ('e2628d53-e0aa-4b27-ad1f-d5af2ed4b30a'::uuid, 'packaging-pouches.png'),
    ('e655cd66-8a12-4d80-a612-67649e03bc05'::uuid, 'packaging-pouches.png'),
    ('e77b8acf-6525-40cd-b9f8-c7ea3e8bcb64'::uuid, 'lab-qa.png'),
    ('ea6d3478-e832-4279-b286-a1c725cff264'::uuid, 'packaging-pouches.png'),
    ('ecb6e1ad-7dcc-49d4-8580-95720a8f233d'::uuid, 'packaging-pouches.png'),
    ('f1498a13-ac4f-4086-980e-de4ff15640c5'::uuid, 'packaging-equipment.png'),
    ('f46c9f28-05b2-449a-92c4-9b014fc1a60f'::uuid, 'cultivation-inputs.png'),
    ('f7af8d55-aa85-4566-8a56-b479740be2df'::uuid, 'packaging-pouches.png'),
    ('fdbf51f2-8fb8-4cb6-b70e-5418fc0d5e86'::uuid, 'product-inventory.png'),
    ('ff824d6d-fac1-4904-8197-eb8100338dc3'::uuid, 'packaging-pouches.png')
), asset as (
  select m.item_id, m.asset_file,
    'representative/v2/' || m.asset_file as storage_path,
    'https://zvxdgdkukjrrwamdpqrg.supabase.co/storage/v1/object/public/marketplace-item-public/representative/v2/' || m.asset_file as public_url,
    case m.asset_file
      when 'bulk-flower.png' then 'Representative bulk dried botanical flower inventory in unbranded regulated-market packaging.'
      when 'packaging-equipment.png' then 'Representative automated packaging and production equipment.'
      when 'cultivation-inputs.png' then 'Representative commercial cultivation inputs and propagation supplies.'
      when 'facility-supplies.png' then 'Representative facility, curing and humidity-control supplies.'
      when 'lab-qa.png' then 'Representative laboratory and quality-assurance equipment and supplies.'
      when 'product-inventory.png' then 'Representative regulated-market product inventory.'
      when 'extraction-equipment.png' then 'Representative extraction and processing equipment.'
      when 'packaging-pouches.png' then 'Representative unbranded packaging and consumables assortment.'
      when 'retail-facility.png' then 'Representative retail and licensed-facility equipment.'
      when 'hemp-biomass.png' then 'Representative bulk biomass logistics and feedstock handling.'
      when 'advisory-services.png' then 'Representative professional advisory and compliance work materials.'
      when 'grow-lighting.png' then 'Representative commercial horticultural lighting equipment.'
      when 'warehouse-logistics.png' then 'Representative warehouse and regulated logistics supplies.'
      else 'Representative marketplace catalogue image.'
    end as alt_text
  from mapping m
), updated as (
  update public.marketplace_item_images i
  set listing_id=coalesce(i.listing_id,a.item_id), storage_path=a.storage_path, public_url=a.public_url,
      mime_type='image/png', item_id=a.item_id, image_class='HARBOURVIEW_ILLUSTRATIVE', image_role='CARD',
      rights_status='HARBOURVIEW_CREATED', source_type='HARBOURVIEW_CREATED', public_storage_bucket='marketplace-item-public',
      public_storage_path=a.storage_path, thumbnail_url=a.public_url, hero_url=a.public_url, gallery_url=a.public_url,
      alt_text=a.alt_text, caption='Representative image — not actual inventory.', is_primary=true, display_order=0,
      is_evidence_image=false, is_illustrative=true, review_status='APPROVED_PUBLIC', file_mime_type='image/png', updated_at=now()
  from asset a
  where i.item_id=a.item_id and i.image_class='HARBOURVIEW_ILLUSTRATIVE'
  returning i.item_id
)
insert into public.marketplace_item_images (
  listing_id,item_id,storage_path,public_url,mime_type,image_class,image_role,rights_status,source_type,
  public_storage_bucket,public_storage_path,thumbnail_url,hero_url,gallery_url,alt_text,caption,is_primary,
  display_order,is_evidence_image,is_illustrative,review_status,file_mime_type,reviewed_at
)
select a.item_id,a.item_id,a.storage_path,a.public_url,'image/png','HARBOURVIEW_ILLUSTRATIVE','CARD','HARBOURVIEW_CREATED',
  'HARBOURVIEW_CREATED','marketplace-item-public',a.storage_path,a.public_url,a.public_url,a.public_url,a.alt_text,
  'Representative image — not actual inventory.',true,0,false,true,'APPROVED_PUBLIC','image/png',now()
from asset a
where not exists (select 1 from public.marketplace_item_images i where i.item_id=a.item_id and i.image_class='HARBOURVIEW_ILLUSTRATIVE')
  and not exists (select 1 from public.marketplace_item_images i where i.item_id=a.item_id and i.review_status='APPROVED_PUBLIC' and i.image_class in ('REAL_ITEM_EVIDENCE','MANUFACTURER_CATALOGUE'));
