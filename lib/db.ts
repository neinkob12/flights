import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

let client: SupabaseClient | null = null;

/** Supabase client using the publishable key + the app secret header (checked by RLS). */
export function db(): SupabaseClient {
  if (!client) {
    client = createClient(env("SUPABASE_URL"), env("SUPABASE_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { "x-fs-secret": env("FS_DB_SECRET") } },
    });
  }
  return client;
}

export const T = { watches: "fs_watches", alerts: "fs_alerts" } as const;

export type Watch = {
  id: string;
  manage_token: string;
  origin: string;
  destination: string;
  depart_from: string;
  depart_to: string;
  trip_type: "one_way" | "return";
  nights_min: number | null;
  nights_max: number | null;
  direct_only: boolean;
  max_price: number;
  currency: string;
  email: string | null;
  email_confirmed: boolean;
  telegram_chat_id: number | null;
  active: boolean;
  last_checked_at: string | null;
  last_price: number | null;
  last_alert_price: number | null;
  last_alert_at: string | null;
  created_at: string;
};
