# Research Protocol

Rules for every research-producing command (`/validate-idea`, `/compare-ideas`, `/positioning`, `/measure`). AI research is only trustworthy enough to bet money on if it is auditable. These rules make it auditable.

## 1. Label every claim: Fact / Inference / Assumption

Every substantive claim in a research artifact carries one of three labels:

- **[FACT]** — directly verifiable, with a source link or captured output. "Competitor X charges $29/mo [FACT: pricing page, fetched 2026-08-17]".
- **[INFERENCE]** — reasoned from facts, logic stated. "Their pricing targets prosumers, not teams [INFERENCE: from single-seat pricing + no SSO]".
- **[ASSUMPTION]** — believed without evidence, must be testable. "Users will pay before the product has integrations [ASSUMPTION — test via PoL probe]".

Unlabeled claims are treated as assumptions. A conclusion built mostly on assumptions is a hypothesis, not a finding — say so.

## 2. Search before you write

Before authoring any research or product artifact:

1. Check `docs/knowledge/` (lessons, validated/invalidated assumptions, decisions) and `docs/ideas/` for prior work touching the same market, user, or mechanism.
2. Cite what you found in a `## Prior context` section at the top of the artifact, even if the answer is "nothing relevant found".
3. Never re-litigate a decision recorded in `docs/knowledge/decisions.md` without flagging that you are doing so and why.

## 3. Claims are not evidence

If a command asserts something was verified (a competitor's pricing, a search volume, a test passing), the artifact must embed the actual evidence: the URL and quote, the captured command output, the screenshot path. "I checked and it's fine" is not a finding.

## 4. Sources

- Prefer primary sources (the competitor's own site, official docs, app store listings, forums where users complain) over aggregator blogspam.
- Date every source — markets move; a 2023 pricing screenshot is a different fact than a current one.
- When web access is unavailable, say so explicitly and mark affected claims [ASSUMPTION].

## 5. Every research artifact ends with a verdict

No trailing off into "further research is needed". End with a clearly marked recommendation the founder can act on — **GO / PIVOT / KILL** for validation, a ranked list for comparisons, a chosen option for advisors — plus the top 3 assumptions that would change the verdict if wrong.
