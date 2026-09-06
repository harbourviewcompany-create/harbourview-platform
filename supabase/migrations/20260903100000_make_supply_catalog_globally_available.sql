-- Sets target_countries to all ~195 ISO2 country codes for every
-- Harbourview-direct supply catalog SKU. This is a DISPLAY/DISCOVERABILITY
-- change per explicit product instruction ("every country should see and
-- have access to everything available in the marketplace") -- it does NOT
-- assert that any specific SKU is compliant to ship as-is into every one
-- of those countries. Actual export/import legality is still verified at
-- quote-review time by a human, the same way it already worked for the
-- single-country (CA-only) items before this change -- this migration
-- widens visibility, not automated fulfillment.
--
-- compliance_flags are UNCHANGED by this migration -- CA packaging items
-- still only carry CA-specific compliance metadata (CSA Z76.1, plain
-- packaging, etc.). No new per-country compliance claims are made here.
--
-- Already applied directly to the live project this session.

update public.listings
set target_countries = array[
'AF','AL','DZ','AD','AO','AG','AR','AM','AU','AT','AZ','BS','BH','BD','BB','BY','BE','BZ','BJ','BT','BO','BA','BW','BR','BN','BG','BF','BI','CV','KH','CM','CA','CF','TD','CL','CN','CO','KM','CG','CD','CR','CI','HR','CU','CY','CZ','DK','DJ','DM','DO','EC','EG','SV','GQ','ER','EE','SZ','ET','FJ','FI','FR','GA','GM','GE','DE','GH','GR','GD','GT','GN','GW','GY','HT','HN','HU','IS','IN','ID','IR','IQ','IE','IL','IT','JM','JP','JO','KZ','KE','KI','KP','KR','KW','KG','LA','LV','LB','LS','LR','LY','LI','LT','LU','MG','MW','MY','MV','ML','MT','MH','MR','MU','MX','FM','MD','MC','MN','ME','MA','MZ','MM','NA','NR','NP','NL','NZ','NI','NE','NG','MK','NO','OM','PK','PW','PA','PG','PY','PE','PH','PL','PT','QA','RO','RU','RW','KN','LC','VC','WS','SM','ST','SA','SN','RS','SC','SL','SG','SK','SI','SB','SO','ZA','SS','ES','LK','SD','SR','SE','CH','SY','TW','TJ','TZ','TH','TL','TG','TO','TT','TN','TR','TM','TV','UG','UA','AE','GB','US','UY','UZ','VU','VA','VE','VN','YE','ZM','ZW'
]
where sold_by_harbourview = true;
