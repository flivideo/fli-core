# W1 review — `@flivideo/core` v0.1.0 against the spec and the architecture rules

**Purpose**: The independent code-review pass that roadmap §3.1 requires before the W1 gate. You review; you fix
nothing.

**For Agents**:
- You are the W1 **reviewer**, session `fli-core-w1-review`, model `claude-opus-5`, cwd
  `/Users/davidcruwys/dev/ad/flivideo/fli-core`. The builder (`fli-core-w1`) is a separate session; the orchestrator
  (Swagger, `flistudio-orch`) reads your findings and routes the fixes.
- **Do not edit any file except your findings file.** Do not commit. Do not run anything against the live estate.
- David is asleep; do not ask him anything.

## 1 · Inputs

- The code: every commit on `main` after `4ced373` (`git log --oneline 4ced373..HEAD`), i.e. the whole library.
- The contract it must meet: `/Users/davidcruwys/dev/ad/flivideo/flistudio/docs/specification.md` **§4** (export table),
  §2 A3/A5/A6, §2.1 D1–D13, §3 L1–L5, §5 R8–R15 + R29–R31, **§10** (testing + architecture rules), **§11 #2 #9 #12 #13 #14 #15**;
  `/Users/davidcruwys/dev/ad/flivideo/flistudio/docs/roadmap.md` §1.1, §1.2b, §1.2d, §1.2e, §3.1;
  `/Users/davidcruwys/dev/ad/flivideo/flistudio/docs/open-contract.md` §2, §3, §5; and the builder's brief
  `docs/briefs/overnight-W1-fli-core.md` (its §2 rulings are binding where the spec is silent).
- The builder's own review already fixed three findings and deferred two (a check-then-rename race in
  `writeIdentity`; uncovered guard branches). Judge those deferrals too.

## 2 · Method

Run the `agent-skills:code-review-and-quality` skill over the library: correctness, contract conformance, test
quality, architecture, security, maintainability. Concretely, check at least:

1. **Every spec §4 export exists with the documented shape**, and behaves per the brief's §2 rulings table (one line
   per row: conforms / deviates, with file:line).
2. **Round-trips**: `parseAppFile(appFileName(x)) === x` for the four §11 #12 names; `parseVideoFile(videoFileName(x))`;
   `parseRecording(recordingFileName(x))`; a generic `project.json` → not an app file.
3. **Refusals bite**: `writeIdentity` on a different id; `resolveProject` on two matches; `nextCode` never reuses an
   archived code (§11 #2 duplicate-`a01` fixture). Confirm each has a test that fails on the bad input, not only one
   that passes on the good input.
4. **R12** empty vs unscanned is distinguishable in `listProjects`; **R13** archived is listed, never descended.
5. **Isolation**: no test can touch `/Users/davidcruwys/dev/video-projects`, the real `~/.config/appydave`, or the real
   `~/.fli` (read the setup file that redirects `HOME`; try to find a path that escapes it).
6. **Architecture**: zero app imports (the guard test exists and bites); runtime deps = `zod` only; zod is the single
   source of every shape (no hand-copied types); public surface = `src/index.ts` only; ESM + `exports` + `prepare`
   correct for a `github:flivideo/fli-core#v0.1.0` install.
7. **A5** home-prefix rewrite and the machine override order; **D5** `labPath` shape. ⚠️ Known open point — rule on
   it: `labPath` builds `v-<brandKey>` but Guy Monroe's key is `guy-monroe` while the root is `v-guy`. Roadmap §1.2b's
   example is the brand **root folder name** (`lab/v-appydave/…`). Say whether the fix should take the root basename
   from the resolved brand (preferred) or keep `v-<key>`.
8. **Coverage honesty**: is 100% lines real, or padded by tests that assert nothing? Sample ten tests.
9. Anything that will hurt W3–W7 as consumers (awkward signatures, throwing where a typed result was promised, missing
   helper from `parseOpenArgs` output → `OpenContext`).

## 3 · Output

Write `/Users/davidcruwys/dev/ad/flivideo/fli-core/docs/reviews/overnight-W1.md`:

```
# W1 review — @flivideo/core v0.1.0 (<HEAD sha>)
Verdict: CLEAN | FINDINGS (n blocking, m minor)
## Findings
### F1 · <title> — BLOCKING|MINOR
file:line · what is wrong · why it matters (spec ref) · the fix, stated so a builder can apply it without you
…
## Deferrals I accept (with reason)
## Conformance table (spec §4 row → conforms/deviates → file)
## Checks run (commands + tails)
```

BLOCKING = wrong against the spec, a refusal that does not bite, an isolation escape, an architecture-rule breach,
or a consumer-facing signature that must change before W3–W7 pin `v0.1.0`. Everything else is MINOR. Be specific;
a finding without a file:line and a stated fix is not a finding. End with one line:
`APPYNET: done — <verdict, n blocking, m minor>`.
