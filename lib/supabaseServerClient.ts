import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const createSupabaseServerClient = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Supabase URL oder Service Role Key fehlen. NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY prüfen."
    );
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  });
};
