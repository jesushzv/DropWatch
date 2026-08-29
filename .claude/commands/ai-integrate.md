---
description: "Stage 3 — add an LLM-powered feature the disciplined way: prompt design, evals before shipping, cost guardrails, injection safety"
argument-hint: "<the feature, e.g. 'summarize uploaded contracts'>"
---

Design and build an LLM-powered feature: **$ARGUMENTS**

LLM features fail differently than code: they degrade instead of erroring, costs scale with usage, and user input becomes part of the program. This command wraps the build in the discipline those risks deserve. It slots into the normal pipeline — the feature still lives in a `/build-plan` phase; this defines *how* that phase is built.

## 1. Design decisions first (recorded as mini-ADRs in `docs/knowledge/decisions.md`)

- **Does this need an LLM at all?** If regex, a lookup table, or a form solves 90% of it, do that. LLM is for genuine language/judgment work.
- **Model choice:** default to the current mid-tier model and right-size later with eval evidence (per `/perf-audit`); check current model IDs and pricing from the provider's live docs, not from memory.
- **Context strategy:** stuff-it-in-the-prompt beats RAG until the corpus outgrows the context window or cost budget — RAG is an optimization with real complexity, adopt it on evidence, not by default.
- **Structured over freeform:** if code consumes the output, use the provider's structured-output/tool-use mechanism, never "please reply in JSON" + parsing hope.

## 2. Prompt engineering

Prompts are code: versioned in the repo (a `prompts/` module, not string literals scattered inline), reviewed in `/review` like code, with clear task definition, delimited untrusted input, explicit output contract, and few-shot examples where format matters.

## 3. Evals before shipping — the gate

Build a small eval set *before* polishing the prompt: 15–30 realistic inputs (include ugly ones: empty, huge, wrong-language, adversarial) with graded expected outputs or scoring criteria. A script runs them and reports; results are captured evidence in the build phase's verification (PB-4/PB-8 apply — "the prompt seems good" is not verification). Re-run on every prompt or model change; keep the eval script in the repo, wired into CI if cheap enough.

## 4. Guardrails in production

- **Cost:** per-user rate limits and a hard monthly spend cap at the provider; token caps per request; caching for repeated inputs. An unguarded LLM endpoint is an open wallet (also a `/security-check` abuse finding).
- **Injection:** user content is data, not instructions — delimit it, never let it override the system prompt's job, and treat any tool-use/actions the LLM can trigger as the real attack surface (least privilege on what the feature *can do*, not just what it says).
- **Degradation:** timeouts, retries with backoff, and a defined fallback when the provider is down or the output fails validation — the feature fails visibly and gracefully, never silently wrong.
- **Observability:** log model, tokens, latency, and validation failures per call (into PostHog and/or the provider's dashboard) so `/measure` and `/perf-audit` can see quality and cost trends.

## Wrap up

Record the design decisions, eval results, and guardrail settings in `docs/engineering/10-ai-integration.md` (dated section per feature); the feature then proceeds through the normal `/build` → `/review` → `/security-check` gates like everything else.
