import { describe,it,expect,vi } from 'vitest';
vi.mock('@google/genai',()=>({GoogleGenAI: class { models={ generateContent: vi.fn(async()=>({text:'{"summary":"ok"}'}))}; }}));
import { runGeminiConnector } from '@/src/server/connectors/gemini/client';

describe('client',()=>{
 it('summarize success', async()=>{process.env.GEMINI_CONNECTOR_ENABLED='true';process.env.GEMINI_API_KEY='test_key_not_real';const r=await runGeminiConnector({artifact:{id:'1',content:'abc'},operation:'summarize_artifact'} as any);expect(r.status).toBe('succeeded');});
 it('secret blocked', async()=>{process.env.GEMINI_CONNECTOR_ENABLED='true';process.env.GEMINI_API_KEY='test_key_not_real';const r=await runGeminiConnector({artifact:{id:'1',content:'abc',sensitivity:'secret'},operation:'summarize_artifact'} as any);expect(r.status).toBe('blocked');});
});
