# W1 — build `@flivideo/core` (repo `flivideo/fli-core`), v0.1.0

**Purpose**: The shared library every Fli app (FliStudio, FliHub, FliCut, FliCast, Teletubby) will consume as a pinned
git dependency. Tonight's first workstream; W3–W7 cannot start until this passes its gate.

**For Agents**:
- You are the W1 **builder**. Your cwd is `/Users/davidcruwys/dev/ad/flivideo/fli-core` (a fresh repo: only this brief
  exists). Model `claude-opus-5`. The orchestrator (Swagger, session `flistudio-orch`) reads your evidence and holds the gate.
- David is asleep. Do not ask him anything. Decide from the documents below; where a document is silent, decide,
  and list the decision under *Decisions* in your final report.
- Written 2026-09-15 by Swagger from `flistudio/docs/runs/overnight-2026-09-15.md` §6 W1, roadmap §3 W1, spec §4.

---

## 1 · Read first (absolute paths; you have read access to these folders)

1. `/Users/davidcruwys/dev/ad/flivideo/flistudio/docs/specification.md` — **§4 is your contents table** (every export,
   verbatim). Also §2 A3/A5/A6/A9, §2.1 D1–D13, §3 layout + L1–L5, §5 R8–R15, R29–R31, §10 Testing + Architecture
   rules, §11 #1 #2 #9 #12 #13 #14 #15.
2. `/Users/davidcruwys/dev/ad/flivideo/flistudio/docs/roadmap.md` — §1.1 (naming scheme D), §1.2b (lab + machine.json),
   §1.2d (transcripts), §1.2e (chapter previews legacy), §3 row W1, **§3.1 the gate**.
3. `/Users/davidcruwys/dev/ad/flivideo/flistudio/docs/open-contract.md` — §2, §3, **§5** (`OpenContext`, the
   `--brand/--project/--video` + env parser).
4. `/Users/davidcruwys/dev/ad/flivideo/flihub/shared/naming.ts` — the working definition of recording names
   (`NN-S-slug[-TAGS].ext`, `NAMING_RULES`, `parseRecordingFilename`/`buildRecordingFilename`). Copy the *rules*, not the
   file; this library imports no app code.
5. `/Users/davidcruwys/.config/appydave/brands.json` — the real registry shape (`brands.<key>.name`,
   `.locations.video_projects`, …). Read it for shape only; tests use fixtures.

Where these differ, roadmap §1 wins over spec, and spec wins over this brief. Note any conflict in your report.

## 2 · What to build

Package `@flivideo/core`, version `0.1.0`, TypeScript strict, ESM, **runtime dependency: `zod` only** (no
`@appydave/core` — its `file:` link is the thing this library exists to avoid; write your own small `atomicWrite`).
Dev toolchain: `typescript`, `vitest` + `@vitest/coverage-v8`, `eslint` + `typescript-eslint`, `prettier` (check only).

**Every export in spec §4, with these rulings where the docs leave room:**

| Area | Rule |
|---|---|
| `readBrands(opts?)` / `Brand` / `resolveBrandRoot(brand, machine)` | Read `brands.json` from an injectable path (default `~/.config/appydave/brands.json`). **A5**: rewrite a `/Users/<anyone>/` prefix in `locations.video_projects` to the current `os.homedir()` (injectable); then apply `machine.brandRoots[brand]` override if present. Registry only (no unregistered `v-*` merge). |
| `ProjectIdentity` / `readIdentity(dir)` / `writeIdentity(dir, id)` | `fli.studio.json` = `{ schema: 1, id (uuid), brand, code, name, createdAt (ISO) }`. `writeIdentity` is atomic (tmp + rename) and **refuses** when a file with a different `id` exists (typed error, not a throw of a plain string). `readIdentity` returns `null` when absent, and a typed *invalid* result (never a throw) when the file is malformed. |
| `parseProjectFolder(name)` | `<code>-<slug>`; code = one lowercase letter + two digits (`a01`, `d02`); slug kebab-case. Non-matching → `null`. |
| `parseRecording(name)` / `recordingFileName(x)` | Per FliHub `naming.ts` (chapter 1–2 digits lenient on parse, 2 on build; sequence; slug; tags after the slug). Round-trip test. |
| `parseVideoFile(name)` / `videoFileName(x)` | L1: `<NN>-<kind>[-<variant>].<ext>`; kinds `cut`, `audio` (+variant = treatment), `overlay` (+variant), `final`; anything else → `kind: 'unknown-kind'` (parse never throws). Round-trip test. |
| `parseAppFile(name)` / `appFileName(x)` | D1: `fli.<app>[.<subject>].json`; `fli.<app>` is the first two segments; `project.json`, `meta.json`, `fli.json` are **not** app files (`null`). Round-trip test on the four §11 #12 names. |
| `classifyProjectEntry(relPath)` → zone | `identity` (`fli.studio.json`) · `app-decisions` (other `fli.*.json`) · `recordings` · `transcripts` (also legacy `recording-transcripts/`) · `cast` · `videos` · `legacy` (`recordings/-chapters/`, `first-edit/`, `edits/`, `edit-1st/`, `final/`, `pipeline/`, `animation/`, any name starting `-`) · `other`. Pure function on the path string plus an optional `isDirectory` hint. |
| `listProjects(brandRoot)` (estate listing) | Members = top-level dirs with a **valid** `fli.studio.json` (R8); `otherFolders` = every other top-level dir except `archived/` and names starting `.` or `-`; `archived` = the folder names under `<brandRoot>/archived/` (both range buckets like `a01-a49/` **and** flat project folders — list, never descend past one level, R13); every collection carries a `scannedAt` stamp, and an unreadable dir yields `unscanned`, distinct from empty (R12). |
| `resolveProject(brandRoot, ref)` | Exact folder name or identity `id` → the project; a code (`a01`) matches on the code segment; **two or more matches → refuse** with the candidates (R31); a prefix that is not a whole code is not a match. Never throws for "not found": typed result. |
| `nextCode(listing, letter)` | A6/R15: the next `<letter><NN>` not used by any member, other folder, or archived entry (archived bucket names like `a01-a49` count as ranges: treat every code in the range as taken; flat archived folders count by their code). Test the duplicate-`a01` fixture (§11 #2). |
| `BrandSettings` / `readBrandSettings(brandRoot)` | `<brandRoot>/fli.brand.json` → `{ schema: 1, brand, colour }` (hex). Missing → `null`. Malformed → typed invalid result. |
| `MachineSettings` / `readMachineSettings(opts?)` | `~/.fli/machine.json` (home injectable): `{ schema: 1, brandRoots?: Record<brand, absPath>, labRoot?: absPath, apps?: Record<app, absPath> }`. Missing → defaults (`labRoot` = `<home>/fli/lab`). |
| `labPath({ brand, project, app, subject? }, machine?)` | `<labRoot>/v-<brand>/<code>-<project>/<app>/[<subject>/]`. §11 #14 is the test, verbatim. Never writes anything. |
| `OpenContext` / `parseOpenArgs(argv, env)` | `OpenContext = { brand, projectDir, projectId, video? }` (open-contract §5). Parser: `--brand <k>`, `--project <folder>`, `--video <NN-name>` (also `--brand=<k>` forms); env `FLIVIDEO_BRAND`, `FLIVIDEO_PROJECT`, `FLIVIDEO_VIDEO` (argv wins over env). Returns `{ context: Partial, missing: ('brand'|'project'|'video')[] }`; `video` is optional so it is never in `missing` unless `requireVideo: true`. Pure: no I/O. |

**Architecture**: `src/` one module per row above, `src/index.ts` re-exports the public surface only. Every shape is a
zod schema, types inferred (`z.infer`), never hand-copied. **Zero app imports** — enforce it with a test that scans
`src/**/*.ts` and fails on any import that is not relative, `zod`, or `node:*`.

**Distribution — this is the part W3–W7 depend on.** Consumers install `"@flivideo/core": "github:flivideo/fli-core#v0.1.0"`.
Make that work: `"exports"` → `./dist/index.js` + `./dist/index.d.ts`, `"files": ["dist"]`, `"type": "module"`, and a
`"prepare": "npm run build"` script so a git install builds itself. **Prove it** (§4). If `prepare` does not build on
install for any reason, commit `dist/` instead and add a test that `dist/` is up to date with `src/` — but try `prepare`
first and say which you shipped.

`README.md`: what the library is, the install line, the export table, and "tests never touch the live estate".

## 3 · Tests and quality (the gate, roadmap §3.1)

- Vitest, `coverage.provider: 'v8'`, **`coverage.thresholds.lines: 90`** so `npm test` fails below it. Aim above 95.
- **Fixture trees built in temp dirs** (`fs.mkdtemp` under `os.tmpdir()`), cleaned in `afterEach`. Tests **never** read
  `/Users/davidcruwys/dev/video-projects`, the real `~/.config/appydave`, or the real `~/.fli`. A test that does is a
  failed test.
- Fixtures to build (spec §11 names them): a brand root with members (`a01-xmen` with `fli.studio.json`) and other
  folders (`d02-cutty-audio-cleanup`, `catalog`, `docs`), an `archived/` with a bucket `a01-a49/` and a flat `a01-old`
  (duplicate `a01`, §11 #2); a project with `videos/01-xmen/{01-cut.mp4,01-audio-dfn100.m4a,01-overlay-v5-frame.mp4,01-final.mp4}`,
  `cast/tool-xyz/`, `first-edit/`, `recordings/-chapters/`; one with `transcripts/01-1-intro.srt` and one with legacy
  `recording-transcripts/01-1-intro.srt` (§11 #13).
- Every parser has a round-trip test. Every "refuses" has a test proving the refusal **bites** (bad input → typed refusal).
- `npm run typecheck` (`tsc --noEmit`), `npm run lint` (eslint, zero warnings), `npm run format:check`, `npm test`,
  `npm run build` all pass. Commit after each green slice; **do not** run any of these against the live estate.

## 4 · The install proof (required evidence)

After the last commit, in a throwaway folder under `/tmp`:

```bash
d=$(mktemp -d /tmp/fli-core-consumer.XXXX) && cd "$d" && npm init -y >/dev/null
npm install "git+file:///Users/davidcruwys/dev/ad/flivideo/fli-core#main"
node --input-type=module -e "import { parseAppFile, appFileName, labPath } from '@flivideo/core'; console.log(parseAppFile('fli.cut.01-xmen.json'), appFileName({app:'hub'}))"
```

Paste the full output (install log tail + the printed objects). The GitHub-URL form (`github:flivideo/fli-core#v0.1.0`) is
run by Swagger after the gate, when the tag exists — **do not create the tag yourself**.

## 5 · Out of scope

- No tag, no `npm publish`, no GitHub settings. No changes outside this repo. No business logic, titles, thumbnails,
  b-roll (👤 Q5). No `.github/workflows`. No reading of the live estate in tests.
- Do not add runtime dependencies beyond `zod`. Do not vendor FliHub code.

## 6 · Commit and push

Commit to `main` in small conventional commits (`feat(naming): …`, `test(estate): …`). Push to `origin` (already
configured: `git@github.com:flivideo/fli-core.git`) after each green slice — `git push -u origin main` the first time.
Commit this brief as your first commit.

## 7 · Done — your final report (raw data, not prose)

End when every row in §2 is built and tested and §3–§4 are green. Your last message contains, in this order:

1. `git log --oneline` of the run.
2. The tail of `npm test` **with the coverage table** (lines % per file and total).
3. The output of `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build` (last lines each).
4. The §4 install-proof output in full.
5. **Decisions**: every call this brief or the spec left open, one line each, with the doc section you leaned on.
6. **Anything this brief got wrong** (a spec row that could not be built as written, a conflict between docs).
7. The one line: `APPYNET: done — <what shipped, coverage %>` — or `APPYNET: blocked — <why>` if a row cannot be built.
