import { describe,it,expect } from 'vitest';
import { POST } from '@/app/api/hub/connectors/gemini/run/route';
describe('run route',()=>{it('exists',()=>expect(typeof POST).toBe('function'));});
