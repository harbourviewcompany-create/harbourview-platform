
UPDATE daily_digest dd
SET editorial_headlines = (
  SELECT jsonb_agg(
    item || jsonb_build_object('source_url', ei.source_url, 'outlet_name', ei.outlet_name)
  )
  FROM jsonb_array_elements(dd.editorial_headlines) AS item
  JOIN editorial_items ei ON ei.id::text = item->>'item_id'
),
updated_at = now()
WHERE digest_date = current_date;

SELECT headline, source_url, outlet_name
FROM daily_digest dd, jsonb_to_recordset(dd.editorial_headlines) AS x(headline text, source_url text, outlet_name text)
WHERE dd.digest_date = current_date;
