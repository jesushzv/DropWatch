import { createClient } from "@supabase/supabase-js";

// Supabase Auth is only on the login path: the client signs in here, then
// pages/AuthCallback.tsx exchanges the resulting access token for DropWatch's
// own session cookie via POST /api/auth/session. Nothing else talks to
// Supabase from the browser — data access is all server-side behind RLS.
//
// The implicit flow (tokens in the URL fragment) is used instead of PKCE
// because magic links are frequently opened in a different browser context
// than the one that requested them, where a stored PKCE verifier would not
// exist.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        flowType: "implicit",
        detectSessionInUrl: true,
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;
