import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

let client: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (!client) {
    client = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false },
    });
  }
  return client;
}

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
