type PublicSupabaseEnv = {
  supabaseUrl: string;
  supabasePublishableKey: string;
  appUrl: string;
  isProduction: boolean;
};

type ServiceRoleEnv = {
  supabaseUrl: string;
  serviceRoleKey: string;
};

type RedisEnv = {
  redisRestUrl: string;
  redisRestToken: string;
};

function cleanEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value && !value.startsWith("your-") ? value : null;
}

function requireEnv(name: string): string {
  const value = cleanEnv(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function requireHttpUrl(name: string, options: { allowHttpInProduction?: boolean } = {}): string {
  const value = requireEnv(name);

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`Invalid URL in environment variable: ${name}`);
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(`Environment variable ${name} must be an HTTP(S) URL`);
  }

  if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:" && !options.allowHttpInProduction) {
    throw new Error(`Environment variable ${name} must use HTTPS in production`);
  }

  return parsed.origin;
}

function resolveAppUrl(isProduction: boolean): string {
  const explicitAppUrl = cleanEnv("APP_URL");
  if (explicitAppUrl) {
    return requireHttpUrl("APP_URL");
  }

  const vercelProductionUrl = cleanEnv("VERCEL_PROJECT_PRODUCTION_URL");
  if (vercelProductionUrl) {
    return `https://${vercelProductionUrl}`;
  }

  const vercelPreviewUrl = cleanEnv("VERCEL_URL");
  if (vercelPreviewUrl) {
    return `https://${vercelPreviewUrl}`;
  }

  return isProduction ? "https://localhost" : "http://localhost:3000";
}

export function getPublicSupabaseEnv(): PublicSupabaseEnv {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    supabaseUrl: requireHttpUrl("NEXT_PUBLIC_SUPABASE_URL"),
    supabasePublishableKey: requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    appUrl: resolveAppUrl(isProduction),
    isProduction,
  };
}

export function getServiceRoleEnv(): ServiceRoleEnv {
  assertNoPublicSecretExposure();
  return {
    supabaseUrl: requireHttpUrl("NEXT_PUBLIC_SUPABASE_URL"),
    serviceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

export function getRedisEnv(): RedisEnv {
  return {
    redisRestUrl: requireHttpUrl("UPSTASH_REDIS_REST_URL"),
    redisRestToken: requireEnv("UPSTASH_REDIS_REST_TOKEN"),
  };
}

export function hasRedisEnv(): boolean {
  return Boolean(cleanEnv("UPSTASH_REDIS_REST_URL") && cleanEnv("UPSTASH_REDIS_REST_TOKEN"));
}

export function assertNoPublicSecretExposure(): void {
  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith("NEXT_PUBLIC_")) continue;
    const normalized = `${key}=${value ?? ""}`.toLowerCase();
    if (normalized.includes("service_role") || normalized.includes("sb_secret_") || normalized.includes("upstash") || normalized.includes("redis_rest_token")) {
      throw new Error(`Public environment variable appears to expose a secret: ${key}`);
    }
  }
}
