import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as any,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as any
);

export default supabase;
