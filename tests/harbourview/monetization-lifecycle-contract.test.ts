import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
const root=process.cwd(),read=(p:string)=>readFileSync(join(root,p),'utf8')
describe('Harbourview monetization lifecycle safeguards',()=>{
it('uses canonical entitlement vocabulary',()=>{const s=read('lib/billing/entitlements.ts');expect(s).toContain("export type SubscriptionTier = 'free' | 'intel' | 'operator'");expect(s).toContain("watchlist: 'intel'");expect(s).toContain("genetics: 'operator'");expect(s).not.toContain("admin: 'enterprise'")})
it('makes Stripe customer creation idempotent',()=>{const s=read('lib/stripe/server.ts');expect(s).toContain('idempotencyKey');expect(s).toContain('Unable to persist Stripe customer mapping')})
it('routes existing subscribers to Billing Portal',()=>{const c=read('app/api/stripe/checkout/route.ts'),u=read('components/stripe/UpgradeButton.tsx');expect(c).toContain("code: 'EXISTING_SUBSCRIPTION'");expect(c).toContain('TERMINAL_SUBSCRIPTION_STATUSES');expect(u).toContain("data.code === 'EXISTING_SUBSCRIPTION'");expect(u).toContain("fetch('/api/stripe/portal', { method: 'POST' })")})
it('uses tier mapping and ignores unknown prices',()=>{const s=read('app/api/stripe/webhook/route.ts');expect(s).toContain('tierFromPriceId');expect(s).toContain('if(!tier)return')})
it('persists subscription state before entitlement recomputation',()=>{const s=read('app/api/stripe/webhook/route.ts');expect(s).toContain('await entitlement(s,uid)');expect(s).toContain('await mark(s,event)');expect(s.indexOf('await entitlement(s,uid)')).toBeLessThan(s.lastIndexOf('await mark(s,event)'))})
it('checks webhook idempotency before processing and marks after processing',()=>{const s=read('app/api/stripe/webhook/route.ts');expect(s).toContain('if(await processed(s,event.id))');expect(s).toContain('await mark(s,event)');expect(s.indexOf('if(await processed(s,event.id))')).toBeLessThan(s.indexOf('switch(event.type)'));expect(s.lastIndexOf('await mark(s,event)')).toBeGreaterThan(s.indexOf('switch(event.type)'))})
it('uses canonical app URL rather than request Origin',()=>{const c=read('app/api/stripe/checkout/route.ts'),p=read('app/api/stripe/portal/route.ts');expect(c).not.toContain("req.headers.get('origin')");expect(p).not.toContain("req.headers.get('origin')")})
})