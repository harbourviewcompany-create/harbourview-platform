# Regional routing definitions

Status: active internal routing control.

This document controls how a retained regional or bloc label is matched to an
operator's declared ISO-2 countries. It prevents a specific audience such as
LATAM or the European Union from being widened to a broader UN macro-region.

## Data sources

- ISO-2/ISO-3 conversion is generated with pinned `pycountry 24.6.1`.
- Region and subregion values come from Harbourview's checked-in 248-row country
  identity table, derived from the UN M49 classification.
- European Union membership is the official current 27-member list, verified on
  2026-08-02.

## Controlled audience rules

- `Africa`, `Americas`, `Asia`, `Europe`, and `Oceania` match the corresponding
  UN M49 macro-region.
- `LATAM` and `Latin America` match the UN M49 Central America and South America
  subregions. The separately retained Caribbean audience is excluded.
- `Latin America and the Caribbean` matches Caribbean, Central America, and South
  America. Northern America is excluded.
- `Caribbean` matches only the UN M49 Caribbean subregion.
- `European Union` / `EU` matches the controlled 27-member ISO-2 set. Cyprus is
  included despite its UN M49 placement in Western Asia; the United Kingdom is
  excluded.
- `Eastern Europe/Central Asia` matches the UN M49 Eastern Europe and Central Asia
  subregions only.
- `Middle East` uses Harbourview's explicit operational definition of UN M49
  Western Asia plus Egypt. It does not widen to all Asia or all MENA.
- `Pacific` matches the UN M49 Oceania macro-region.
- An unknown retained bloc label fails closed instead of inheriting a broader
  macro-region.
- An invalid or unmapped operator country does not fail open into every regional
  audience.

Any definition or membership change requires the mapping generator, tests,
control record, and evidence log to change in the same PR.
