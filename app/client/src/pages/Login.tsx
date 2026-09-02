import { useState } from "react";
import { Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type LoginState = { phase: "idle" | "sending" | "sent" | "error"; message?: string };

export default function Login() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<LoginState>({ phase: "idle" });

  const sendMagicLink = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      setState({ phase: "error", message: "Sign-in is not configured for this deployment." });
      return;
    }
    const trimmed = email.trim();
    if (!trimmed) return;
    setState({ phase: "sending" });
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setState({ phase: "error", message: error.message });
      return;
    }
    setState({ phase: "sent" });
  };

  return (
    <main className="min-h-screen bg-[#fbfaf7] px-6 py-12 flex items-center justify-center">
      <section className="w-full max-w-md border border-border bg-card p-8 sm:p-10 text-center rise-in">
        <div className="mx-auto mb-7 flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Tag className="h-5 w-5" aria-hidden="true" />
        </div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">DropWatch</p>
        {state.phase === "sent" ? (
          <>
            <h1 className="font-display text-3xl font-bold tracking-tight">Check your email</h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              We sent a sign-in link to <span className="font-semibold text-foreground">{email.trim()}</span>. Open it on this
              device to finish signing in.
            </p>
            <Button variant="outline" className="mt-8 w-full rounded-md font-semibold" onClick={() => setState({ phase: "idle" })}>
              Use a different email
            </Button>
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl font-bold tracking-tight">Sign in to DropWatch</h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Enter your email and we&apos;ll send you a one-time sign-in link. No password to remember.
            </p>
            <form onSubmit={sendMagicLink} className="mt-8 space-y-3 text-left">
              <label htmlFor="login-email" className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Email address
              </label>
              <Input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={event => setEmail(event.target.value)}
              />
              <Button
                type="submit"
                size="lg"
                className="w-full rounded-md font-semibold"
                disabled={state.phase === "sending" || !isSupabaseConfigured}
              >
                {state.phase === "sending" ? "Sending link…" : "Email me a sign-in link"}
              </Button>
            </form>
            {state.phase === "error" && (
              <p className="mt-4 text-sm font-medium text-destructive" role="alert">
                {state.message ?? "Something went wrong. Try again."}
              </p>
            )}
          </>
        )}
      </section>
    </main>
  );
}
