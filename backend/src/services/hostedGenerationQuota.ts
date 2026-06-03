import { HostedGenerationUsage } from '../models/HostedGenerationUsage';

export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getHostedDailyLimit(isAuthenticated: boolean): number {
  const raw = isAuthenticated
    ? process.env.HOSTED_AI_LIMIT_AUTH
    : process.env.HOSTED_AI_LIMIT_GUEST;
  const fallback = isAuthenticated ? 30 : 10;
  const n = parseInt(raw || String(fallback), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function isServerHostedAiAvailable(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function buildUsageKey(ip: string | undefined, userId?: string): string {
  if (userId) return `user:${userId}`;
  const safeIp = (ip || 'unknown').replace(/^::ffff:/, '');
  return `ip:${safeIp}`;
}

export async function getHostedQuotaStatus(
  usageKey: string,
  isAuthenticated: boolean,
): Promise<{ limit: number; used: number; remaining: number }> {
  const limit = getHostedDailyLimit(isAuthenticated);
  const date = todayUtc();

  if (!isServerHostedAiAvailable()) {
    return { limit: 0, used: 0, remaining: 0 };
  }

  const doc = await HostedGenerationUsage.findOne({ usageKey, date });
  const used = doc?.count ?? 0;
  return { limit, used, remaining: Math.max(0, limit - used) };
}

export async function consumeHostedGeneration(
  usageKey: string,
  isAuthenticated: boolean,
): Promise<{ allowed: boolean; limit: number; used: number; remaining: number }> {
  const limit = getHostedDailyLimit(isAuthenticated);
  const date = todayUtc();

  const doc = await HostedGenerationUsage.findOneAndUpdate(
    { usageKey, date },
    { $inc: { count: 1 } },
    { upsert: true, new: true },
  );

  const used = doc.count;
  const allowed = used <= limit;
  return {
    allowed,
    limit,
    used,
    remaining: Math.max(0, limit - used),
  };
}
