import { describe,it,expect } from 'vitest';
import { buildGeminiPrompt, inferProposalType } from '@/src/server/connectors/gemini/prompts';
describe('prompts',()=>{it('contains authority rules',()=>{const p=buildGeminiPrompt('summarize_artifact',{id:'1',content:'x'} as any);expect(p).toContain('proposal_only');expect(p).toContain('strict JSON');});
it('maps operations',()=>{expect(inferProposalType('propose_routing')).toBe('routing');expect(inferProposalType('generate_review_note')).toBe('review_note');});});
