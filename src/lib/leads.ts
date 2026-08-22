// Lead capture → Supabase `dropwatch_leads` table (insert-only for anon; RLS
// blocks all reads/updates/deletes from the public site).
// The URL and publishable (anon) key are public by design — access control
// lives entirely in the database's row-level-security policies.

const SUPABASE_URL = "https://dfyoavffxzujvxvnsizi.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_4w3ZlvFUwFtRTWI5s6QfVw_127miFZO";

export interface Lead {
  email: string;
  source: string;
  tier?: string;
}

export async function submitLead(lead: Lead): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/dropwatch_leads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      email: lead.email,
      source: lead.source,
      tier: lead.tier ?? null,
    }),
  });
  if (!res.ok) {
    throw new Error(`Lead submission failed (${res.status})`);
  }
}
