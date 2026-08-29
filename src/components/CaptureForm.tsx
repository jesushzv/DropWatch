import { useState, type FormEvent } from "react";
import { submitLead } from "../lib/leads";
import { trackSignup } from "../lib/analytics";
import { trackMetaLead } from "../lib/metaPixel";

const SUCCESS_COPY =
  "You're in as a founding user. When DropWatch opens for early access, you'll get one email with your invite link and your 3 free months of Pro attached — nothing else before then.";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface CaptureFormProps {
  source: string;
  tier?: string;
  onSuccess?: () => void;
}

export default function CaptureForm({ source, tier, onSuccess }: CaptureFormProps) {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    // Bots fill the hidden field: pretend success, store nothing.
    if (honeypot) {
      setState("done");
      onSuccess?.();
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setState("error");
      return;
    }
    setState("sending");
    try {
      await submitLead({ email: email.trim(), source, tier });
      trackSignup(source, tier); // real signups only — the honeypot path above never reaches here
      trackMetaLead(tier);
      setState("done");
      onSuccess?.();
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="capture__success" role="status">
        <p>{SUCCESS_COPY}</p>
      </div>
    );
  }

  return (
    <form className="capture" onSubmit={handleSubmit} noValidate>
      <div className="capture__row">
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === "error") setState("idle");
          }}
          placeholder="you@work-or-home.com"
          aria-label="Email address"
          required
        />
        <button type="submit" className="btn btn--primary" disabled={state === "sending"}>
          {state === "sending" ? "Saving your spot…" : "Claim 3 months of Pro free"}
        </button>
      </div>
      <div className="hp-field" aria-hidden="true">
        <label>
          Leave this field empty
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </label>
      </div>
      {state === "error" ? (
        <p className="capture__error small">
          That email didn't go through — check it and try again.
        </p>
      ) : (
        <p className="capture__privacy small">
          Just for early access. No newsletters, no selling your email.
        </p>
      )}
    </form>
  );
}
