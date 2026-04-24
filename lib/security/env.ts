type PublicSupabaseEnv = {
  supabaseUrl: string;
  supabasePublishableKey: string;
  appUrl: string;
  isProduction: boolean;
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

export function getPublicSupabaseEnv(): PublicSupabaseEnv {
  const isProduction = process.env.NODE_ENV === "production";
  const appUrl = cleanEnv("APP_URL")
    ? requireHttpUrl("APP_URL")
    : isProduction
      ? (() => {
          throw new Error("APP_URL is required in production");
        })()
      : "http://localhost:3000";

  return {
    supabaseUrl: requireHttpUrl("NEXT_PUBLIC_SUPABASE_URL"),
    supabasePublishableKey: requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    appUrl,
    isProduction,
  };
}

export function assertNoPublicSecretExposure(): void {
  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith("NEXT_PUBLIC_")) continue;
    const normalized = `${key}=${value ?? ""}`.toLowerCase();
    if (normalized.includes("service_role") || normalized.includes("sb_secret_")) {
      throw new Error(`Public environment variable appears to expose a secret: ${key}`);
    }
  }
}
