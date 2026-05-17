import { assertPublicSafe } from '../lib/intelligence-os/publicSafety.ts';

const safePayload = { title: 'Published summary', summary: 'Controlled public summary only' };
assertPublicSafe(safePayload);

const forbiddenPayload = { title: 'bad', sourceUrl: 'https://private', internalReviewNotes: 'private' };
let leaked = false;
try { assertPublicSafe(forbiddenPayload); } catch { leaked = true; }
if (!leaked) throw new Error('Expected forbidden public payload to fail safety assertion');

console.log('PASS: DTO boundary blocks private provenance/audit/source fields.');
