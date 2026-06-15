/**
 * In-Memory Circuit Breaker
 * Prevents distributed scraper from hammering origin domains that are rate-limiting,
 * throwing 500s, or have WAF blocks.
 */

export class CircuitBreaker {
  private failures: Map<string, number> = new Map();
  private lockouts: Map<string, number> = new Map();

  private MAX_FAILURES = 3;
  private LOCKOUT_DURATION_MS = 1000 * 60 * 15; // 15 minutes default cool-off

  recordFailure(domain: string) {
    const current = this.failures.get(domain) || 0;
    const nextCount = current + 1;
    this.failures.set(domain, nextCount);

    if (nextCount >= this.MAX_FAILURES) {
      console.warn(`[CircuitBreaker] 🔴 Domain ${domain} locked out for ${this.LOCKOUT_DURATION_MS / 60000} mins due to consecutive network failures.`);
      this.lockouts.set(domain, Date.now() + this.LOCKOUT_DURATION_MS);
    }
  }

  recordSuccess(domain: string) {
    if (this.failures.has(domain)) {
      console.log(`[CircuitBreaker] 🟢 Recovery registered for ${domain}`);
      this.failures.delete(domain);
    }
  }

  isLocked(domain: string): boolean {
    const lockoutEnd = this.lockouts.get(domain);
    if (!lockoutEnd) return false;

    if (Date.now() > lockoutEnd) {
      // Cooldown period expired, allow test requests again
      this.lockouts.delete(domain);
      this.failures.set(domain, this.MAX_FAILURES - 1); // 1 strike policy on returning
      return false;
    }
    
    return true;
  }
}
