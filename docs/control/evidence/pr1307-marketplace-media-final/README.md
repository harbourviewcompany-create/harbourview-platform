# PR #1307 marketplace media final audit

## Production reconciliation

- Production project: `zvxdgdkukjrrwamdpqrg`
- Production baseline/main SHA at final evidence branch creation: `ae54456dc22f1cdf1d9f2c10902fa2643c358812`
- Public listings reconciled: **151**
- Unique listing IDs: **151**
- Semantic PASS: **151**
- Semantic FAIL: **0**
- Distinct final representative assets: **58**
- Canonical listing/media matrix SHA-256: `0bc1a134415dcbd2e9f7fe3aae61efabaa031e037d7c23c57456259b173b54e3`
- Trust class: `HARBOURVIEW_ILLUSTRATIVE`
- Disclosure: `Representative image — not actual inventory.`
- Higher-trust production rows displaced: **0**

All multiply-used assets are represented by separate listing-level adjudication rows in the canonical CSV. Asset integrity CSV records anonymous HTTP retrieval, actual PNG decode, 1728x1344 dimensions, byte length and SHA-256 for every distinct final referenced asset. Semantic PASS is based on listing-level visual-subject adjudication recorded in the matrix and deterministic reconciliation of that adjudication against the live production listing/media universe; it is not inferred from filenames or broad category labels alone.

## Production audit evidence

- Final production audit workflow run: `31598502270`
- Final production audit job: `94119786893`
- Audit evidence commit: `49bbbc2d4656011136dabe8340a2c7bb0963f180`
- Audit artifact ID: `9142127240`
- Audit artifact SHA-256: `47a5a84221f08c67212467af6f4697c79556c0218456ad624ad5be44fc4cd5d5`
- Result: **151/151 listing IDs reconciled; 151 PASS / 0 FAIL; 58/58 referenced final assets anonymously retrieved, decoded and hashed.**

## Authenticated application/browser evidence

- Exact application/test source SHA: `1936b7600500129f930576ace769b97d63de2614`
- Mobile Command Centre V2 Visual workflow run: `31605932667`
- Authenticated visual job: `94144737351`
- Unit/security/media gate: **13 test files / 92 tests passed**
- Production-mode Next.js build and TypeScript stage: **passed**
- Playwright: **12/12 passed**
- Marketplace media viewports explicitly exercised: **320x700, 375x812, 390x844, 430x932**, plus tablet/desktop responsive coverage through **1440px**
- Visual evidence artifact ID: `9145305338`
- Visual evidence artifact SHA-256: `f2d9bea156fb013df2dc7276c78097b78fd2cab4da3bd975d430758eb8740c1c`

The authenticated browser workflow uses an isolated Supabase fixture while executing the exact application source and media resolver. It proves rendering, representative disclosure, responsive behavior, search/tabs/introduction flows, broken/private URL fallback contracts and the absence of the retired per-card N+1 route. The separate production audit above proves the actual 151-row production mapping and 58 referenced production assets; these two evidence layers are intentionally kept distinct.

## Temporary-resource teardown

Final PR1307 Edge Function cleanup run `31605854411` deleted and verified absence of:

- `pr1307-media-rollout-temp`
- `pr1307-semantic-media-rollout-temp`
- `pr1307-media-finalize-temp`
- `pr1307-media-final-asset-transfer-temp`
- `pr1307-media-final-audit-export-temp`

A subsequent independent production Edge Function inventory read also found none of those five slugs. Historical PR #1345 remains an immutable merged GitHub record; its temporary workflow files and test-trigger comment are removed by the final evidence/cleanup PR rather than attempting to erase repository history.
