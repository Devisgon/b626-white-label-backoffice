import { createClient } from '@supabase/supabase-js';

// NOTE: Product audit logging now goes through Prisma (see
// ../catalogue/product-audit/product-audit.service.ts) so that audit writes
// participate in the same DB transaction as the product change. This client
// is kept only for any future Supabase-specific features (e.g. storage,
// realtime) and is created lazily so the app does not crash on boot if these
// env vars are not set.
let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_ANON_KEY must be set to use the Supabase client.',
    );
  }

  if (!client) {
    client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
    );
  }

  return client;
}
