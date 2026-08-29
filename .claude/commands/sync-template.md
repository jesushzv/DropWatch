---
description: "Cross-cutting — pull workflow improvements from the template repo into this project clone"
argument-hint: "[optional: template repo override, default jesushzv/claude-code-ai-development-workflow]"
---

Sync this project's workflow files with the template repo. Template: **$ARGUMENTS** (default: `jesushzv/claude-code-ai-development-workflow`, branch `main` or its default).

The workflow evolves in the template repo; project clones drift. This command pulls improvements **into the workflow files only** — it must never touch project artifacts (`docs/` contents other than `docs/templates/`), project code, or the project's `CLAUDE.md` customizations.

## Steps

1. **Fetch** the template's current default branch into a temp dir (`git clone --depth 1` into the scratchpad, or add it as a `template` remote).
2. **Diff, scoped to workflow files only:**
   - `.claude/commands/`, `.claude/agents/`, `.claude/references/`, `.claude/settings.json`
   - `docs/templates/`
   - Explicitly out of scope: `docs/` artifacts, `CLAUDE.md` (project sections), code, `.env*`.
3. **Classify each difference:**
   - *Template ahead* → candidate to pull.
   - *Local edit* (this project customized a command) → conflict; never overwrite silently.
   - *Local-only file* → leave alone.
4. **Present the summary** (files, direction, one-line description of each change) and apply the pulls the founder approves. For conflicts, show both versions and let the founder pick or merge.
5. **Reverse flow reminder:** if the local side has an improvement the template lacks (often born from a `## Workflow friction` retro entry), offer to note it in `docs/knowledge/lessons.md` as a proposal to upstream to the template repo — this command never pushes to the template itself.
6. Record the sync (date, template commit SHA) in `docs/00-status.md`'s log.
