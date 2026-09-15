# W1 review — @flivideo/core v0.1.0 (93909e5)

Verdict: FINDINGS (5 blocking, 6 minor)

Reviewer: session `fli-core-w1-review`, `claude-opus-5`, 2026-09-15. Method: `agent-skills:code-review-and-quality`
(five axes), every `src/` and `test/` file read in full, plus behaviour probes run against the built `dist/` in a
scratch directory (never the live estate). Nothing in the repo was edited except this file; nothing committed.

**Summary for Swagger.** The toolchain, tests and distribution are in good shape. Typecheck, lint, format and build
all pass. 201 tests pass with 100% line coverage, and the tests are real, not padding. The git install works and
deep imports are blocked. The five blockers are small, concrete fixes:

- one R12 hole
- one refusal that does not hold under concurrency
- the Guy Monroe lab path
- result shapes declared outside zod
- a missing `parseOpenArgs` → `OpenContext` resolver that every W3–W6 app would otherwise write for itself

---

## Findings

### F1 · A missing brand root reports its archive as *scanned and empty* — BLOCKING

`src/estate.ts:115` (archive scanned before the root is known readable) + `src/estate.ts:103` (ENOENT → `scanned, []`)
+ `src/estate.ts:127` (the unscanned early return keeps that `archived` value).

- **What is wrong**: `listProjects('/no/such/root')` returns `members: unscanned`, `otherFolders: unscanned`, but
  `archived: { state: 'scanned', items: [] }`. Probe output:
  `P1 missing root: unscanned unscanned archived= scanned []`.
- **Why it matters**: R12 says an empty collection MUST be distinguishable from an unscanned one, and §11 #4 says the
  same. A UI rendering the archive for an unmounted drive (a `brandRoots` override on `/Volumes/T7/…`) would show
  "0 archived", which is the exact ambiguity R12 exists to prevent. `nextCode` happens to refuse anyway, because
  `members` is unscanned. Any consumer that reads `archived` on its own gets a wrong answer.
- **Fix**: in `listProjects`, read the brand root first. If that `readdir` throws, return the same `unscanned` object
  for all three collections (`members`, `otherFolders`, `archived`) and do not call `scanArchived`. Keep the
  ENOENT-means-empty rule in `scanArchived` for a readable root with no `archived/` folder. Extend the test at
  `test/estate.test.ts:108` to assert `listing.archived` is `{ state: 'unscanned', path: missing }`.

### F2 · `writeIdentity`'s different-id refusal does not hold under concurrency (deferral rejected) — BLOCKING

`src/identity.ts:60-83` (read, then decide, then write) + `src/fs-utils.ts:21-33` (`rename` always replaces).

- **What is wrong**: two concurrent adopts of the same empty folder, with different ids, **both** return
  `{ kind: 'written' }`. The second silently replaces the first. Probe:
  `Promise.all([writeIdentity(dir, idA), writeIdentity(dir, idB)])` → `P10 concurrent: written:, written:`.
- **Why it matters**: the refusal is spec §4 ("`writeIdentity` refuses to overwrite a different `id`") and brief §2.
  The losing caller now holds a `projectId` that exists nowhere on disk, and puts it into an `OpenContext`. This is
  not hypothetical in v1. FliStudio has a UI **and** an agent door (spec §6.3) that can both call `project.adopt`,
  and one double-click is enough. The review brief's BLOCKING list names "a refusal that does not bite".
- **Fix** (about 15 lines):
  1. Add `atomicCreate(target, content)` to `fs-utils.ts`. It writes the temp file with `flag: 'wx'`, then
     `await fs.link(tmp, target)`, which fails with `EEXIST` atomically if the target exists, then removes the temp
     file in a `finally` block.
  2. In `writeIdentity`, when `existing === null`, call `atomicCreate` instead of `atomicWrite`. On `EEXIST`, call
     `readIdentity` again and return the ordinary outcome:
     - `different-id` or `existing-invalid` refusal, or
     - `written, replaced: true` if the winner has the same id.
  3. Keep `atomicWrite` (rename) for the same-id rewrite path. A different-id writer there already sees the file and
     is refused.
  4. Test: `Promise.all` of two different ids on an empty temp dir → exactly one `written` and one
     `refused / different-id`, and the file holds the `written` caller's id.

### F3 · `labPath` builds `v-<brandKey>`, which is wrong for Guy Monroe (`guy-monroe` → root `v-guy`) — BLOCKING

`src/lab-path.ts:15-16` (input documented as a brand key) and `src/lab-path.ts:36` (`v-${brand}`).

- **What is wrong**: in the real registry the key is `guy-monroe` and `locations.video_projects` ends in `v-guy`
  (`[measured 2026-09-15]`, shape-only read of `~/.config/appydave/brands.json`; the other 7 of 8 brands have root
  `v-<key>`). Probe: `labPath({ brand: 'guy-monroe', project: 'a01-x', app: 'flicut' }, { labRoot: '/lab' })` →
  `/lab/v-guy-monroe/a01-x/flicut/`. The project lives in `v-guy/`, so its lab folder should be `lab/v-guy/…`.
- **Why it matters**: D5 and roadmap §1.2b say the lab is "addressed like the project", and roadmap §1.2b's example
  `lab/v-appydave/…` is the brand **root folder name**. Roadmap wins over spec. Every W4/W5 consumer that passes a
  key would silently write Guy's scratch into a folder that matches no brand.
- **Ruling (the known open point)**: take the brand segment from the **basename of the resolved brand root**
  (preferred, as the brief proposed). Do not keep `v-<key>`.
- **Fix**:
  1. Add `brandRoot: AbsolutePath.optional()` to `LabPathInput`. When it is set, the segment is
     `path.basename(path.normalize(brandRoot))` (a trailing separator is stripped) and `brand` is not used for the
     path.
  2. Keep the `brand` key or `v-` name form only so §11 #14 still passes verbatim (`brand: 'appydave'` →
     `v-appydave`). Say in JSDoc and in the README row that this form is correct only when the root is named
     `v-<key>`, and that consumers should pass `brandRoot` (the output of `resolveBrandRoot`).
  3. Export `brandFolderName(brand, machine?, options?)`, returning `path.basename(resolveBrandRoot(...))` or
     `null`.
  4. Tests:
     - Guy with `brandRoot: '/Users/jan/dev/video-projects/v-guy'` → `/lab/v-guy/a01-x/flicut/`
     - a machine override `'/Volumes/T7/v-guy/'` → `v-guy`
     - `brandFolderName` on the Guy fixture → `v-guy`
  5. Flag to Swagger: §11 #14's wording (`brand: 'appydave'`) should gain a Guy case in the spec.

### F4 · Result shapes are hand-written TypeScript, not zod — BLOCKING (architecture rule)

These declarations are interfaces or unions with no schema behind them:

| File | Shapes |
|---|---|
| `src/estate.ts:16-52` | `Scanned`, `MemberProject`, `OtherFolder`, `ArchivedEntry`, `ProjectListing` |
| `src/estate.ts:159-164` | `ResolveProjectResult` |
| `src/estate.ts:214-216` | `NextCodeResult` |
| `src/identity.ts:25-30` | `WriteIdentityResult` |
| `src/machine.ts:24`, `src/machine.ts:31-33` | `ResolvedMachineSettings`, `MachineSettingsResult` |
| `src/open-args.ts:30` | `OpenArgName` (repeats `OpenArgs`' keys) |
| `src/open-args.ts:43-47` | `ParsedOpenArgs` |
| `src/results.ts:4-8`, `src/results.ts:20` | `ValidFile`, `ReadFileResult` |

- **Why it matters**: spec §10 says "Every shape is declared once, in zod — capability inputs and outputs … API
  contracts. Types are inferred from the schema, never hand-copied". The W1 brief §2 Architecture says the same.
  These are exactly the outputs W7's capabilities return (`project.list`, `project.resolve`, `project.adopt`,
  following the §10 precedent `output: z.object(…)`). With no schema in the library, FliStudio must hand-copy a zod
  mirror of `ProjectListing`, which is the drift the rule forbids. Adding the schemas is additive, but it has to land
  before W7 designs its capability outputs against v0.1.0.
- **Fix**:
  1. In `results.ts`, add `validFile(schema)` and `readFileResult(schema)` factories returning zod unions. Keep
     `InvalidFile` as is.
  2. In `estate.ts`:
     - `scanned(item)` factory → `z.discriminatedUnion('state', [...])`
     - `MemberProject` and `OtherFolder` as `z.object`, with `identity: z.union([z.literal('absent'), InvalidFile])`
     - `ArchivedEntry`, `ResolveProjectResult` and `NextCodeResult` as `z.discriminatedUnion('kind', …)`
     - `ProjectListing` as `z.object`
  3. `WriteIdentityResult` and `MachineSettingsResult` as discriminated unions. `OpenArgName` becomes
     `z.enum(['brand','project','video'])`, and `ParsedOpenArgs` becomes a `z.object`.
  4. Export each schema from `src/index.ts` under the same name as its `z.infer` type (the pattern already used for
     `Brand` and `ProjectIdentity`).
  5. Add to `test/architecture.test.ts` a list of these names, asserting each is exported and
     `instanceof z.ZodType`.
  6. Add one test that `ProjectListing.parse(await listProjects(fixture))` succeeds, so each schema provably matches
     what the function returns.

### F5 · Nothing turns `parseOpenArgs` output into an `OpenContext`; door 2 resolution is left to every app — BLOCKING (consumer-facing)

`src/open-args.ts:43-47` (`context: Partial<OpenArgs>`, i.e. names) and `src/index.ts:83-91` (no resolver exported).

- **What is wrong**: spec §4 pairs `OpenContext` with `parseOpenArgs → { context, missing[] }`. The parser returns
  `{ brand, project, video }` names, which is correct, since a pure parser cannot know `projectDir` or `projectId`.
  But no export produces an `OpenContext`. Getting from args to context takes a six-step chain:
  1. `readBrands`
  2. find the key
  3. `readMachineSettings`
  4. `resolveBrandRoot`
  5. `resolveProject`, mapping each refusal
  6. check `videos/<video>/` exists, then build `OpenContext`

  Open-contract §5 puts "Resolve `videos/<NN>-<name>/`" and "Door 2 behaves identically in every app" **in the
  library**, and C3 requires an app to "refuse and say why" when context cannot be resolved. Today there is no video
  folder resolver at all, only `parseVideoFolder`.
- **Why it matters**: FliHub, FliCut, FliCast and Teletubby (W3–W6) each pin v0.1.0 and would each write that chain,
  with four different refusal vocabularies. That breaks C1/C3 and puts the per-door contract tests (D11) at risk.
  This is review-brief check 9, verbatim.
- **Fix**: add `resolveOpenContext(args: Partial<OpenArgs>, deps: { brands: Brand[]; machine?:
  MachineSettings | null; home?: string; requireVideo?: boolean })` → `Promise<OpenContextResult>`, with
  `OpenContextResult` a zod discriminated union on `kind`:

  | `kind` | Carries |
  |---|---|
  | `resolved` | `context: OpenContext` |
  | `missing` | `missing: OpenArgName[]` |
  | `unknown-brand` | `brand` |
  | `no-brand-root` | `brand` |
  | `project-refused` | `result`: the non-`found` `ResolveProjectResult` (`ambiguous`, `not-a-project`, `not-found`, `unscanned`) |
  | `video-invalid` | `video` (fails `parseVideoFolder`) |
  | `video-not-found` | `video`, `path` (`<projectDir>/videos/<video>/` is not a directory) |

  Rules:
  - Read-only: one `stat`, plus `listProjects`.
  - Never falls back to another project (C3).
  - Export the function and the schema.

  Tests on a fixture brand root, one per `kind`, plus a Guy-style key ≠ root-basename brand resolving to the right
  `projectDir`.

### F6 · `recordingFileName` accepts input that does not round-trip — MINOR

`src/recording.ts:18-31` (schema) and `src/recording.ts:65-71` (builder).

- **What is wrong**: with `segment: null` and a slug whose first word is all digits, the built name parses back as
  something else:
  - `{ chapter: 1, segment: null, slug: '2-intro' }` → `01-2-intro.mov` → parses as `segment: 2, slug: 'intro'`
  - `{ slug: '5', segment: null }` → `01-5.mov` → `null`
- **Why it matters**: §10 says every parser round-trips, and the builder exists "so an agent never invents a name"
  (CR-16). This edge is rare.
- **Fix**: add a `superRefine` on `Recording`. When `segment === null`, the first `-`-separated slug word must not
  match `/^\d+$/` (message: "a slug starting with a number needs a segment"). Test that both inputs above throw
  `FliCoreError`.

### F7 · `parseRecording` is stricter than FliHub's working definition, and nothing records it — MINOR

`src/recording.ts:45`, `:51`, `:60`, `:68`, compared with `flihub/shared/naming.ts:219-250`. Four divergences:

| Input | FliHub | fli-core |
|---|---|---|
| `01-0-intro.mov` | parses | rejects (`segment < 1`) |
| `01-1.mov` | parses, `name: ''` | rejects (empty slug) |
| `01-1-Intro.mov` | parses | rejects (uppercase in slug) |
| `01-01-intro.mov` | keeps `"01"` | parses to `segment: 1`, rebuilds as `01-1-intro.mov` |

- **Why it matters**: spec §4 names FliHub `naming.ts` as the working definition. W3 (FliHub adopting the library)
  could see real estate files drop out, or get renamed on rebuild, without warning.
- **Fix**: keep the strict rules (they are the better creation rules), but add a
  `describe('divergences from FliHub parseRecordingFilename')` block pinning the four cases above. Add one README
  line under the export table listing them, so W3 decides knowingly.

### F8 · `readBrands` fails the whole registry on one bad entry — MINOR

`src/brands.ts:28-39`.

- **What is wrong**: `{ brands: { appydave: { name }, broken: { shortcut } } }` → `invalid`, so no brands at all
  (probe P11). All 8 real entries have `name` today `[measured]`, but `brands.json` is shared with other AppyDave
  tools that could add an entry this schema rejects.
- **Why it matters**: one bad entry would leave every Fli app with an empty brand picker.
- **Fix**, if taken (the return shape changes, so before the tag or not at all): parse each entry with
  `RegistryEntry.safeParse`. Return `valid` with the good brands plus a
  `skipped: { key, issues }[]` field in a zod `BrandsResult`. Test with the fixture above.

### F9 · The identity and brand-settings names leak into the app-file namespace — MINOR

`src/app-file.ts:10`, `:25-37`; `src/classify.ts:53-54`.

- **What is wrong**:
  - `appFileName({ app: 'studio', subject: 'x' })` builds `fli.studio.x.json`, which `classifyProjectEntry` calls
    `app-decisions` (app `studio`).
  - `parseAppFile('fli.brand.json')` → `{ app: 'brand' }`.
- **Why it matters**: D1 makes `fli.studio.json` FliStudio's single identity file (L4, R1), and `fli.brand.json` is a
  brand-root file (D13), not an app's decisions. An app named `brand`, or a subject under `studio`, would be
  confusable with them.
- **Fix**:
  - `AppFile` refine: reject `app: 'brand'`, and reject `app: 'studio'` with a subject.
  - `parseAppFile` returns `null` for `fli.brand.json` and `fli.studio.<anything>.json`. `fli.studio.json` still
    parses to `{ app: 'studio' }` for the §11 #12 round-trip.
  - Tests for each case.

### F10 · `OpenContext` / `OpenArgs` accept a relative `projectDir` and any `video` string — MINOR

`src/open-args.ts:13` and `:17`, `:26`.

- **What is wrong**: `OpenContext.safeParse({ brand: 'x', projectDir: 'relative/path', projectId: uuid, video:
  '../../etc' })` succeeds (probe P9).
- **Why it matters**: D4 says FliStudio holds the single **absolute** root. `video` is defined as `<NN>-<name>`
  (open-contract §3), and a `../` value is a path-escape waiting to happen in a consumer that joins it.
- **Fix** (tighten before the tag, since it is a schema contract):
  - `projectDir`: `.refine(path.isAbsolute)`.
  - `video` in both schemas: `.regex(/^\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/)`, sharing the rule with
    `parseVideoFolder` (export the regex from `video-file.ts`).
  - Tests for both rejections.

### F11 · Test isolation guards `HOME`, but not an explicit absolute path — MINOR

`test/setup/isolate-home.ts:8-18`.

- **What is wrong**: the setup reliably redirects every *default* path. I found no escape in today's tests: every fs
  call goes through `tempDir()`, and the `/Users/…` strings in `test/settings.test.ts` only feed the pure
  `resolveBrandRoot` and `labPath`. But a future
  `listProjects('/Users/davidcruwys/dev/video-projects/v-appydave')` in a test would run unchallenged.
- **Why it matters**: brief §3 says "a test that does is a failed test". Today that rests on reviewer vigilance, not
  a mechanism.
- **Fix**: in `isolate-home.ts`, wrap these methods on the shared `promises` object from `node:fs` (the same object
  `src/` imports): `readdir`, `readFile`, `stat`, `writeFile`, `rename`, `link`, `mkdir`, `rm`. The wrapper throws
  when `path.resolve(arg)` starts with any of:
  - `${realHome}/dev/video-projects`
  - `${realHome}/.config/appydave`
  - `${realHome}/.fli`

  Add one test proving `listProjects(path.join(process.env.FLI_CORE_REAL_HOME, 'dev/video-projects'))` throws the
  guard error.

---

## Deferrals I accept (with reason)

- **Uncovered guard branches, accepted.** The four uncovered spots:
  - `src/estate.ts:199`: `otherFolders` unscanned inside `resolveProject`
  - `src/estate.ts:233`: `otherFolders` unscanned inside `nextCode`
  - `src/fs-utils.ts:8-14`: an error that is not an object
  - `src/results.ts:37`: an issue at the root path

  All are defensive. The two estate branches cannot be reached through `listProjects`, because `members` and
  `otherFolders` come from one `readdir` and are always scanned or unscanned together. They can only be reached
  with a hand-built listing. Line coverage is 100% and branch coverage 97.92%. Adding tests for these would be
  padding.
- **Check-then-rename race in `writeIdentity`, NOT accepted.** Probe P10 shows both writers get `written`, so the
  refusal does not bite. It is F2, with a cheap, standard fix (`link` gives exclusive create).

## Conformance table (spec §4 row → conforms/deviates → file)

| Spec §4 row (+ brief §2 ruling) | Verdict | File |
|---|---|---|
| `Brand`, `readBrands(opts?)` (registry only, injectable path/home) | conforms (F8 minor) | `src/brands.ts:9-60` |
| `resolveBrandRoot(brand, machine)`: A5 `/Users/<anyone>` rewrite + `machine.brandRoots` override | conforms: override applied first, so it wins as the brief requires; `/Users/Shared` excluded; tests `test/settings.test.ts:96-153` | `src/brands.ts:72-85` |
| `ProjectIdentity` zod `{schema:1,id uuid,brand,code,name,createdAt ISO}` | conforms | `src/identity.ts:10-18` |
| `readIdentity(dir)`: absent → `null`, malformed → typed invalid, never throws | conforms | `src/identity.ts:21-23`, `src/fs-utils.ts:36-65` |
| `writeIdentity(dir, id)`: atomic, refuses a different id with a typed result | **deviates**: refusal does not hold under concurrency (F2); otherwise the typed refusals are correct and tested with the file left untouched (`test/identity.test.ts:83-106`) | `src/identity.ts:38-85` |
| `parseProjectFolder(name)` → `{code, slug}` or `null` | conforms, plus `projectFolderName` inverse | `src/project-folder.ts:21-31` |
| `parseRecording(name)` / `recordingFileName(x)` per FliHub | conforms for tested cases; F6 round-trip hole; F7 documented-divergence gap | `src/recording.ts:35-71` |
| `parseVideoFile(name)` / `videoFileName(x)`: L1, `unknown-kind` never throws | conforms. `unknown-kind` carries `{kind,name,video,ext}` rather than `variant`, an acceptable shape per brief | `src/video-file.ts:49-80` |
| `parseAppFile(name)` / `appFileName(x)`: D1, first two segments, generics → `null` | conforms (F9 minor) | `src/app-file.ts:21-37` |
| `classifyProjectEntry(path)` → 8 zones incl. legacy `recording-transcripts/`, `recordings/-chapters/` | conforms. `project.json` → `other`; `-safe/` and `-trash/` stay recordings | `src/classify.ts:43-68` |
| `listProjects(brandRoot)`: R8 members, R9 others, R13 archive one level, R12 stamps | **deviates**: F1 (archive of a missing root reads as scanned-empty); the rest conforms (`test/estate.test.ts:16-147`) | `src/estate.ts:113-157` |
| `resolveProject(brandRoot, ref)`: folder / id / whole code; ≥2 → refuse; typed not-found | conforms. Also accepts a listing; distinguishes `not-a-project` and `unscanned` | `src/estate.ts:171-204` |
| `nextCode(listing, letter)`: never reuses live/archived; ranges fully taken | conforms. High-water mark (max+1), so it refuses `exhausted` at `>99` even with gaps: a defensible decision, not a finding | `src/estate.ts:223-259` |
| `BrandSettings` / `readBrandSettings(brandRoot)`: missing → `null`, malformed → invalid | conforms | `src/brand-settings.ts:9-21` |
| `MachineSettings` / `readMachineSettings(opts?)`: defaults `labRoot = <home>/fli/lab` | conforms | `src/machine.ts:12-65` |
| `labPath({brand,project,app,subject?}, machine?)`: §11 #14 | **deviates**: F3 (brand segment from key, wrong for `guy-monroe`); §11 #14 literal passes (`test/settings.test.ts:243-260`) | `src/lab-path.ts:30-40` |
| `OpenContext` zod `{brand, projectDir, projectId, video?}` | conforms in fields; F10 (too loose) | `src/open-args.ts:9-19` |
| `parseOpenArgs(argv, env)` → `{context, missing[]}`: argv over env, `--k=v`, video optional unless `requireVideo` | conforms as a parser; **deviates** in that no export yields an `OpenContext` (F5) | `src/open-args.ts:56-94` |
| §10 every shape in zod | **deviates** (F4) | see F4 |
| §10 zero app imports, checked in lint | conforms: `eslint.config.js:15-30` `no-restricted-imports` bites (probe below) **and** `test/architecture.test.ts:41-75` | — |
| Runtime deps = `zod` only | conforms (`package.json:40-42`; `test/architecture.test.ts:77-82`; consumer `node_modules` = `@flivideo zod`) | — |
| Public surface = `src/index.ts` only; ESM, `exports`, `files`, `prepare` | conforms: git install builds via `prepare`; `@flivideo/core/dist/estate.js` → `ERR_PACKAGE_PATH_NOT_EXPORTED` | `package.json:12-33`, `src/index.ts` |
| Coverage threshold ≥90 lines enforced | conforms (`vitest.config.ts:11-13`) | — |

### Brief checks, one line each

1. §4 exports: all 24 names exported (`test/architecture.test.ts:86-115`). The table above is the row-by-row verdict.
2. Round-trips:
   - four §11 #12 app names round-trip (`test/naming.test.ts:277-289`)
   - video names round-trip (`:218-236`)
   - recording names round-trip for tested cases (`:135-148`), with a counterexample in F6
   - `project.json` → `null` / `other` (`test/naming.test.ts:297`, `test/classify.test.ts:12`)
3. Refusals bite:
   - different-id writes refuse, file untouched (`test/identity.test.ts:83-96`), except under concurrency (F2)
   - two code matches and a duplicated id both refuse with candidates (`test/estate.test.ts:203-218`)
   - duplicate-`a01` → `a50` (`:261-268`); the range alone is proven, since without range counting the answer
     would be `a02`
   - flat archived folders counted: `b20-gone` → `b21` (`:270-281`)
4. R12: an unreadable root, archive, or archive-that-is-a-file is `unscanned` (`test/estate.test.ts:108-138`), with
   the hole in F1. R13: bucket contents never appear (`:43-60`).
5. Isolation: no escape found in today's tests; HOME redirect plus a hard guard (`test/setup/isolate-home.ts:14-18`).
   Hardening in F11.
6. Architecture: guard exists in lint and test, and bites. zod is the only runtime dep. zod as single source of
   shapes is F4. Surface and distribution are correct.
7. A5 and override order conform. D5 `labPath`: ruled in F3 (use the brand root basename).
8. Coverage honesty: real, see below.
9. Consumer fit: F5 (missing resolver), F3 (signature gains `brandRoot`), F4 (result schemas). Two things are
   acceptable as they are:
   - Name builders throw `FliCoreError`: these are programmer errors, documented (`README.md:53`).
   - Readers return typed results as promised.

### Coverage honesty: ten tests sampled

All ten assert real behaviour. None is padding.

| Test | What it asserts |
|---|---|
| `identity.test.ts:83` | refusal + byte-identical file afterwards |
| `identity.test.ts:98` | malformed file untouched |
| `identity.test.ts:108` | invalid input writes nothing (`readdir` empty) |
| `identity.test.ts:164` | no temp file left when the rename fails |
| `estate.test.ts:43` | archive entries exactly, and bucket contents absent |
| `estate.test.ts:140` | tree walk identical before and after listing and resolving |
| `estate.test.ts:220` | six near-miss refs → `not-found` |
| `naming.test.ts:276` | the §11 #12 four in both directions |
| `settings.test.ts:96` | A5 rewrite for `/Users/*` and `/home/*` targets |
| `architecture.test.ts:55` | the scanner rejects each forbidden import form, so the guard is not vacuous |

## Checks run (commands + tails)

```
$ pwd
/Users/davidcruwys/dev/ad/flivideo/fli-core

$ git log --oneline 4ced373..HEAD
93909e5 docs: W1 review brief (Swagger)
11beea5 feat(core): public surface, zero-app-imports check and README
fabacf4 feat(open): OpenContext and the --brand/--project/--video parser
0927abd feat(estate): list projects, resolve with refusal, allocate codes
d365176 feat(settings): brands, brand settings, machine settings and lab paths
685a732 feat(layout): classify project entries by zone
e6a9576 feat(identity): read and atomically write fli.studio.json
940879f feat(naming): project folder, recording, video file and app file names
a4d07f0 chore(repo): scaffold @flivideo/core toolchain

$ npm test
 Test Files  7 passed (7)
      Tests  201 passed (201)
All files          |   99.72 |    97.92 |     100 |     100 |
 estate.ts         |    99.1 |    96.92 |     100 |     100 | 199,233
 fs-utils.ts       |     100 |    81.81 |     100 |     100 | 8-14
 results.ts        |     100 |       80 |     100 |     100 | 37
Lines        : 100% ( 308/308 )

$ npm run typecheck   → tsc --noEmit (no output, exit 0)
$ npm run lint        → eslint . --max-warnings 0 (no output, exit 0)
$ npm run format:check → All matched files use Prettier code style!
$ npm run build       → dist/ emitted (index.js + .d.ts per module)

# lint guard bites (stdin, no file written)
$ printf "import { x } from '@appydave/core';\nimport fs from 'fs';\n…" | npx eslint --stdin --stdin-filename src/probe.ts
  1:1  error  '@appydave/core' import is restricted … no-restricted-imports
  2:1  error  'fs' import is restricted … no-restricted-imports
✖ 2 problems (2 errors, 0 warnings)

# install proof (scratch consumer, git+file, prepare builds)
$ npm install "git+file:///Users/davidcruwys/dev/ad/flivideo/fli-core#main"
found 0 vulnerabilities
$ node --input-type=module -e "import { parseAppFile, appFileName, labPath, OpenContext } from '@flivideo/core'; …"
{ app: 'cut', subject: '01-xmen' } fli.hub.json function
$ node … import('@flivideo/core/dist/estate.js')
deep import blocked: ERR_PACKAGE_PATH_NOT_EXPORTED
$ ls node_modules
@flivideo zod

# behaviour probes against dist/ (scratch temp dirs only; never the live estate)
P1 missing root: unscanned unscanned archived= scanned []                                   → F1
P2 {"chapter":1,"segment":null,"slug":"2-intro",…} -> 01-2-intro.mov -> {"segment":2,"slug":"intro",…}  → F6
P2 {"chapter":1,"segment":null,"slug":"5",…} -> 01-5.mov -> null                           → F6
P2b 01-01-intro.mov -> {segment:1} -> 01-1-intro.mov                                        → F7
P3 root /Users/jan/dev/video-projects/v-guy lab /lab/v-guy-monroe/a01-x/flicut/            → F3
P5 parseAppFile('fli.brand.json') {"app":"brand"}; classify('fli.studio.extra.json') app-decisions → F9
P6 code d02 (one member + one non-member same code): found                                  (conforms: members only)
P7 {"kind":"allocated","code":"d91"}                                                        (conforms: archived d90 counted)
P9 OpenContext relative projectDir + video '../../etc' → true                               → F10
P10 concurrent writeIdentity, two different ids: written:, written:                         → F2
P11 brands.json with one entry lacking name → {"kind":"invalid",…}                           → F8

# real registry, shape only (key vs root basename)
guy-monroe | /Users/davidcruwys/dev/video-projects/v-guy     (other 7 brands: root = v-<key>)
```

**What these checks did not establish.**

- The GitHub-URL install (`github:flivideo/fli-core#v0.1.0`) was not run, because the tag does not exist yet.
  That is Swagger's step after the gate.
- The `link()`-based fix in F2 was reasoned, not run, on the M4's volume.
- A type-level consumer (`tsc` in a consumer project) was not compiled. Only the runtime ESM import was proven.

APPYNET: done — FINDINGS, 5 blocking, 6 minor
