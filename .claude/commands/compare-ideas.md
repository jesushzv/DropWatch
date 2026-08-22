---
description: "Stage 0 — rank the idea backlog and recommend the next bet"
argument-hint: "[optional: constraints, e.g. 'max 6 weeks to first revenue']"
---

Rank the idea portfolio and recommend the single next bet. Constraints from the founder: **$ARGUMENTS**

## Steps

1. Read every file in `docs/ideas/` and the lessons in `docs/knowledge/lessons.md`. Note each idea's status (raw / validating / building / killed / shipped) and its ICE score.
2. **Re-score stale entries.** If an idea's score predates a relevant lesson or market change, adjust it and say why. Apply the research protocol — score changes need stated reasons, labeled [FACT]/[INFERENCE]/[ASSUMPTION].
3. **Rank** by ICE, then sanity-check the ranking against portfolio effects the formula misses:
   - Does one idea de-risk or feed another (shared audience, shared components)?
   - Founder energy: a #2 idea the founder is excited about usually beats a #1 they aren't.
   - Pipeline balance: if something is already in Build stage, the honest recommendation may be "finish that first".
4. **Produce the comparison table**: idea, stage, I/C/E, total, riskiest assumption, cheapest next probe.
5. **Recommend exactly one next action** — one idea to advance (and to which stage), or one idea to kill. Killing is a first-class recommendation: record killed ideas' reasons in the idea file and add a line to `docs/knowledge/lessons.md` so they stay killed.

End with the verdict, not a menu. The founder can overrule you; your job is to have an opinion.
