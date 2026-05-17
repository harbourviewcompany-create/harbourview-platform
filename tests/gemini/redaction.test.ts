import { describe,it,expect } from 'vitest';
import { redactErrorMessage, redactOrBlockSecrets } from '@/src/server/connectors/gemini/redaction';

describe('redaction',()=>{
 it('redacts Google key',()=>expect(redactOrBlockSecrets(('AI'+'za'+'ABCDEFGHIJKLMNOPQRSTUV')).redactedText).toContain('REDACTED'));
 it('redacts bearer',()=>expect(redactOrBlockSecrets('Bearer abc.def').redactedText).toContain('REDACTED_BEARER'));
 it('redacts github',()=>expect(redactOrBlockSecrets(('ghp_'+'abcdefghijklmnopqrstuvwxy')).redactedText).toContain('REDACTED_GITHUB'));
 it('blocks private key',()=>expect(redactOrBlockSecrets(('-----BEGIN '+'PRIVATE KEY-----x-----END '+'PRIVATE KEY-----')).blocked).toBe(true));
 it('redacts errors',()=>expect(redactErrorMessage('failed with '+('ghp_'+'abcdefghijklmnopqrstuvwxy')).includes('ghp_')).toBe(false));
});
