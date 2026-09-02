import { useEffect, useRef, useState } from "react";
import { Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

/**
 * Lands here from the Supabase magic-link email. supabase-js parses the
 * tokens out of the URL fragment; the access token is then exchanged for
 * DropWatch's own session cookie, after which Supabase is out of the loop.
 */
export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);
  const exchanging = useRef(false);

  useEffect(() => {
    if (!supabase) {
      setError("Sign-in is not configured for this deployment.");
      return;
    }

    const exchange = async (accessToken: string) => {
      if (exchanging.current) return;
      exchanging.current = true;
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ access_token: accessToken }),
      });
      if (!response.ok) {
        exchanging.current = false;
        setError("Your sign-in link could not be verified. Request a fresh one and try again.");
        return;
      }
      // Full navigation (not client-side routing) so every query re-runs with
      // the new session cookie.
      window.location.replace("/");
    };

    // detectSessionInUrl processes the fragment asynchronously; listen for the
    // resulting session and also check for one that is already present.
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) void exchange(session.access_token);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session?.access_token) void exchange(data.session.access_token);
    });

    const timeout = window.setTimeout(() => {
      if (!exchanging.current) {
        setError("This sign-in link is invalid or has expired. Request a fresh one and try again.");
      }
    }, 8000);

    return () => {
      subscription.subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#fbfaf7] px-6 py-12 flex items-center justify-center">
      <section className="w-full max-w-md border border-border bg-card p-8 sm:p-10 text-center rise-in">
        <div className="mx-auto mb-7 flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Tag className="h-5 w-5" aria-hidden="true" />
        </div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">DropWatch</p>
        {error ? (
          <>
            <h1 className="font-display text-3xl font-bold tracking-tight">Sign-in didn&apos;t complete</h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground" role="alert">{error}</p>
            <Button size="lg" className="mt-8 w-full rounded-md font-semibold" onClick={() => window.location.replace("/login")}>
              Back to sign-in
            </Button>
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl font-bold tracking-tight">Signing you in…</h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">Verifying your sign-in link.</p>
          </>
        )}
      </section>
    </main>
  );
}
