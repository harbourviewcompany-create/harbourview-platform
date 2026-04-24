import { createClient } from "@supabase/supabase-js";
import { assertNoPublicSecretExposure, getServiceRoleEnv } from "@/lib/security/env";

export function createAdminClient() {
  assertNoPublicSecretExposure();
  const env = getServiceRoleEnv();

  return createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
