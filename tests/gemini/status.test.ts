import { describe,it,expect } from 'vitest';
import { getGeminiConnectorStatus } from '@/src/server/connectors/gemini/status';
describe('status',()=>{
 it('disabled',()=>{process.env.GEMINI_CONNECTOR_ENABLED='false';delete process.env.GEMINI_API_KEY;expect(getGeminiConnectorStatus().status).toBe('disabled');});
 it('missing key',()=>{process.env.GEMINI_CONNECTOR_ENABLED='true';delete process.env.GEMINI_API_KEY;expect(getGeminiConnectorStatus().status).toBe('missing_key');});
 it('configured',()=>{process.env.GEMINI_CONNECTOR_ENABLED='true';process.env.GEMINI_API_KEY='test_key_not_real';const s=getGeminiConnectorStatus();expect(s.status).toBe('configured');expect(JSON.stringify(s)).not.toContain('test_key_not_real');});
});
