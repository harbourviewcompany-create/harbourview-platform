# Source Import Inputs

Place the recovered source-universe JSON here before building import batches.

Accepted default filenames, in priority order:

1. `cannabis_sources_5614.json`
2. `cannabis_sources_5000.json`

The batch builder also supports an explicit path through `SOURCE_IMPORT_INPUT=/path/to/file.json npm run source-import:build`.

Do not commit credentials, service-role keys, or generated production run ledgers containing secrets.
