import { createClient } from 'jsr:@supabase/supabase-js@2';

const ADZUNA_APP_ID = Deno.env.get('ADZUNA_APP_ID') ?? '';
const ADZUNA_APP_KEY = Deno.env.get('ADZUNA_APP_KEY') ?? '';
const CRON_SECRET = Deno.env.get('JOB_REFRESH_CRON_SECRET') ?? '';
const HOME_LAT = 45.3477;
const HOME_LON = -75.6743;
const RADIUS_KM = 30;
const SEARCH_TERMS = [
  'business development manager', 'account manager', 'channel partnerships manager',
  'sales manager', 'territory manager', 'client relationship manager',
  'insurance sales', 'automotive sales manager', 'operations manager', 'business development',
];
const LOCATIONS = ['Ottawa'];

const US_MARKERS = /united states|\busa\b|california|new york city|philadelphia|seattle|\btexas\b|florida|illinois|massachusetts|pennsylvania|georgia|north carolina|virginia|colorado|\boregon\b|michigan|\bohio\b|arizona|nevada|new jersey|maryland|minnesota|wisconsin|missouri|tennessee|indiana|india\b|vijayawada/i;
const CA_MARKERS = /canada|ontario|ottawa|quebec|alberta|british columbia|manitoba|saskatchewan|nova scotia|\btoronto\b|montreal|vancouver|calgary/i;
const CORE_TITLE_TERMS = ['business development', 'account manager', 'account management', 'sales manager', 'channel partner', 'partnerships manager', 'territory manager', 'client relationship', 'operations manager', 'insurance', 'automotive'];
const SKILLS = ['business development', 'account management', 'account manager', 'b2b sales', 'b2b', 'client relationship', 'international trade', 'market expansion', 'talent acquisition', 'recruiting', 'recruitment', 'hvac', 'insurance', 'automotive', 'operations management', 'team leadership', 'revenue growth', 'channel partner', 'partnerships', 'sales', 'client relations', 'territory', 'new business', 'key accounts', 'crm'];
const SENIOR_WORDS = ['manager', 'director', 'lead', 'head of'];

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

function isCanadianLocation(locationName: string) {
  if (US_MARKERS.test(locationName || '')) return false;
  return CA_MARKERS.test(locationName || '');
}

function isRemoteText(title: string, description: string, location: string) {
  const text = `${title} ${description} ${location}`.toLowerCase();
  return text.includes('remote') || text.includes('work from home') || text.includes('wfh');
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function scoreJob(title: string, description: string, remote: boolean, distanceKm: number | null) {
  const titleLower = title.toLowerCase();
  const descLower = (description || '').toLowerCase();
  const hasCoreTitleMatch = CORE_TITLE_TERMS.some((term) => titleLower.includes(term));
  const uniqueMatched = Array.from(new Set(SKILLS.filter((skill) => `${titleLower} ${descLower}`.includes(skill))));
  let score = 5;
  if (hasCoreTitleMatch) {
    score += 40;
    score += Math.min(uniqueMatched.length * 4, 30);
  } else {
    score += Math.min(uniqueMatched.length * 2, 15);
  }
  if (SENIOR_WORDS.some((word) => titleLower.includes(word))) score += 10;
  if (titleLower.includes('senior') || titleLower.includes('sr.')) score += 3;
  if (remote) score += 5;
  else if (distanceKm != null) score += distanceKm <= 10 ? 12 : distanceKm <= 20 ? 8 : 4;
  score = Math.max(0, Math.min(100, score));
  const reasons = hasCoreTitleMatch
    ? `Title match + skills: ${uniqueMatched.slice(0, 5).join(', ')}`
    : uniqueMatched.length > 0
      ? `Description-only match (weak signal): ${uniqueMatched.slice(0, 4).join(', ')}`
      : 'No meaningful overlap with your background';
  return { score, reasons };
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });
  if (!CRON_SECRET) return json(503, { error: 'service_not_configured' });
  if ((req.headers.get('x-harbourview-cron-secret') ?? '') !== CRON_SECRET) return json(401, { error: 'unauthorized' });
  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) return json(503, { error: 'provider_not_configured' });

  const url = new URL(req.url);
  const dryRun = url.searchParams.get('dry_run') === 'true';
  const sb = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { db: { schema: 'job_search' } });

  let dismissedNonCanada = 0;
  let rescored = 0;
  if (!dryRun) {
    const { data: existingJobs, error: existingError } = await sb.from('jobs').select('id, title, description, remote, distance_km, location, status');
    if (existingError) return json(500, { error: 'existing_jobs_query_failed' });
    for (const job of existingJobs ?? []) {
      if (job.remote && !isCanadianLocation(job.location || '') && job.status !== 'dismissed') {
        const { error } = await sb.from('jobs').update({ status: 'dismissed' }).eq('id', job.id);
        if (!error) dismissedNonCanada++;
        continue;
      }
      const { score, reasons } = scoreJob(job.title || '', job.description || '', !!job.remote, job.distance_km);
      const { error } = await sb.from('jobs').update({ fit_score: score, fit_reasons: reasons }).eq('id', job.id);
      if (!error) rescored++;
    }
  }

  let inserted = 0;
  let seen = 0;
  let skippedDistance = 0;
  let skippedNonCanadaRemote = 0;

  for (const term of SEARCH_TERMS) {
    for (const loc of LOCATIONS) {
      const providerUrl = `https://api.adzuna.com/v1/api/jobs/ca/search/1?app_id=${encodeURIComponent(ADZUNA_APP_ID)}&app_key=${encodeURIComponent(ADZUNA_APP_KEY)}&results_per_page=20&what=${encodeURIComponent(term)}&where=${encodeURIComponent(loc)}&content-type=application/json`;
      const res = await fetch(providerUrl);
      if (!res.ok) continue;
      const data = await res.json();
      for (const row of data.results ?? []) {
        seen++;
        const title = row.title || '';
        const description = row.description || '';
        const locationName = row.location?.display_name || '';
        const looksRemote = isRemoteText(title, description, locationName);
        let remote = false;
        let distanceKm: number | null = null;
        if (looksRemote) {
          if (!isCanadianLocation(locationName)) { skippedNonCanadaRemote++; continue; }
          remote = true;
        } else if (row.latitude && row.longitude) {
          distanceKm = Math.round(haversineKm(HOME_LAT, HOME_LON, row.latitude, row.longitude));
          if (distanceKm > RADIUS_KM) { skippedDistance++; continue; }
        } else {
          continue;
        }

        if (dryRun) continue;
        const { data: existing } = await sb.from('jobs').select('id').eq('source', 'adzuna').eq('external_id', String(row.id)).maybeSingle();
        if (existing) continue;

        let companyId: string | null = null;
        const companyName = row.company?.display_name;
        if (companyName) {
          const { data: existingCo } = await sb.from('companies').select('id').eq('name', companyName).maybeSingle();
          if (existingCo) companyId = existingCo.id;
          else {
            const { data: newCo } = await sb.from('companies').insert({ name: companyName }).select('id').single();
            companyId = newCo?.id ?? null;
          }
        }

        const { score, reasons } = scoreJob(title, description, remote, distanceKm);
        const { error: insertErr } = await sb.from('jobs').insert({
          source: 'adzuna', external_id: String(row.id), title, company_id: companyId,
          location: locationName || null, description: description || null, url: row.redirect_url || null,
          posted_at: row.created ? row.created.slice(0, 10) : null, status: 'found',
          remote, distance_km: distanceKm, fit_score: score, fit_reasons: reasons,
        });
        if (!insertErr) inserted++;
      }
    }
  }

  return json(200, { dry_run: dryRun, dismissedNonCanada, rescored, seen, inserted, skippedDistance, skippedNonCanadaRemote });
});
