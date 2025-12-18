// Simple client-side rate limiter for security-sensitive operations
// This provides defense-in-depth alongside server-side protections

interface RateLimitEntry {
  attempts: number[];
}

const rateLimitStorage: Record<string, RateLimitEntry> = {};

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

const defaultConfigs: Record<string, RateLimitConfig> = {
  login: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  smsRequest: { maxAttempts: 1, windowMs: 5 * 60 * 1000 }, // 1 request per 5 minutes per task
  userCreation: { maxAttempts: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
};

export function checkRateLimit(
  key: string,
  configName: keyof typeof defaultConfigs = 'login'
): { allowed: boolean; remainingAttempts: number; retryAfterMs: number } {
  const config = defaultConfigs[configName];
  const now = Date.now();
  
  if (!rateLimitStorage[key]) {
    rateLimitStorage[key] = { attempts: [] };
  }
  
  // Clean up old attempts outside the window
  rateLimitStorage[key].attempts = rateLimitStorage[key].attempts.filter(
    (timestamp) => now - timestamp < config.windowMs
  );
  
  const recentAttempts = rateLimitStorage[key].attempts;
  const remainingAttempts = Math.max(0, config.maxAttempts - recentAttempts.length);
  
  if (recentAttempts.length >= config.maxAttempts) {
    const oldestAttempt = Math.min(...recentAttempts);
    const retryAfterMs = config.windowMs - (now - oldestAttempt);
    return { allowed: false, remainingAttempts: 0, retryAfterMs };
  }
  
  return { allowed: true, remainingAttempts, retryAfterMs: 0 };
}

export function recordAttempt(key: string): void {
  if (!rateLimitStorage[key]) {
    rateLimitStorage[key] = { attempts: [] };
  }
  rateLimitStorage[key].attempts.push(Date.now());
}

export function clearAttempts(key: string): void {
  delete rateLimitStorage[key];
}

export function formatRetryTime(ms: number): string {
  const minutes = Math.ceil(ms / 60000);
  if (minutes <= 1) return 'einer Minute';
  return `${minutes} Minuten`;
}
