import { describe,it,expect } from 'vitest';
import { GET } from '@/app/api/hub/connectors/gemini/status/route';
describe('status route',()=>{it('exists',()=>expect(typeof GET).toBe('function'));});
