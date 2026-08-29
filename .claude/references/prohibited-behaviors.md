# Prohibited Behaviors

The specific ways AI-assisted development quietly fails. `/build`, `/review`, and `/security-check` enforce these. When any of them is detected, follow the recovery protocol at the bottom — never paper over it.

## The catalog

- **PB-1 Test manipulation.** Loosening an assertion, widening a tolerance, deleting or skipping a test, or marking it "flaky" to get green — instead of fixing the code. The test suite is the spec; changing the spec to match broken code is fraud against your future self.
- **PB-2 Silent scope reduction.** Delivering a "basic version" of what the plan specified without flagging the cut. Cutting scope is fine — silently is not. Every cut gets a line in the status file and the plan artifact.
- **PB-3 Commenting out the problem.** Disabling a failing service, route, migration, or feature flag to make the build pass.
- **PB-4 Premature completion.** Declaring a phase done without running the verification the plan requires. "It should work" is not verification; captured command output is.
- **PB-5 Blaming pre-existing code.** Claiming a failure predates the change without checking `git log`/`git blame` to prove it.
- **PB-6 Swallowing errors.** Adding empty catch blocks, `|| true`, broad try/except, or `@ts-ignore` to silence a symptom rather than fix a cause.
- **PB-7 Hardcoding around config.** Baking in a URL, key, ID, or environment-specific value to dodge a configuration problem.
- **PB-8 Fabricated evidence.** Reporting test results, benchmark numbers, or research findings that were not actually produced. Applies to product research the same as code: an uncited market claim is fabricated until sourced.
- **PB-9 Skipping the gate.** Proceeding to the next stage when the current stage's gate artifact is missing or its verdict was NEEDS_FIX / KILL.

## Recovery protocol

When a prohibited behavior is caught (by yourself, `/review`, or the adversary):

**STOP → REVERT → DOCUMENT → FIX → VERIFY**

1. **Stop** the current approach immediately.
2. **Revert** the offending change (the loosened test, the commented-out service).
3. **Document** what happened in the status file — one honest line.
4. **Fix** the root cause.
5. **Verify** with the original, unweakened check, and capture the output.
