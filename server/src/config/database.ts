import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

let supabaseClient: SupabaseClient | null = null;

export const isDatabaseConfigured = (): boolean => {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
};

export const getSupabaseClient = (): SupabaseClient => {
  if (!isDatabaseConfigured()) {
    throw new Error(
      "Database is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env.",
    );
  }

  if (!supabaseClient) {
    supabaseClient = createClient(
      env.SUPABASE_URL!,
      env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );
  }

  return supabaseClient;
};
