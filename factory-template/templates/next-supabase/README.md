# Next Supabase Factory App

## Run locally

```powershell
Copy-Item .env.example .env.local
npm install
npm run typecheck
npm test
npm run build
npm run dev
```

## Health check

Open:

```text
http://localhost:3000/api/health
```

Expected response:

```json
{ "ok": true, "service": "factory-app" }
```

## Production rules

- Add project-specific tables through migrations.
- Keep internal fields out of public views.
- Add access policies before exposing user data.
- Add tests before calling the vertical slice complete.
