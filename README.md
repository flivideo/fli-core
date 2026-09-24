# @flivideo/core

The shared rules of a FliVideo video project, in one small library that every Fli app consumes: FliStudio, FliHub,
FliCut, FliCast and Teletubby.

It knows where a brand's projects live on this machine, what makes a folder a project (`fli.studio.json`), how the
project layout and file names work, where an app keeps working files outside the project, and how an app is told which
brand and project to open. It holds no business logic and no app code.

- TypeScript, ESM, strict. Every shape is a [zod](https://zod.dev) schema with the type inferred from it.
- Runtime dependency: `zod` only.
- Source of the rules: FliStudio's spec §3–§5, roadmap §1 and open contract §5 — `~/dev/ad/flivideo/flistudio/docs/`
  (`specification.md`, `roadmap.md`, `open-contract.md`).

**Status:** active, v0.10.0 · True at deb64e9 (2026-09-24)

## Install

Pin a tag. Never use a `file:` path.

```json
{
  "dependencies": {
    "@flivideo/core": "github:flivideo/fli-core#v0.11.0"
  }
}
```

The package builds itself on install (`prepare` → `tsc`), so the git dependency ships `dist/` without committing it.

```ts
import { parseAppFile, labPath, listProjects } from '@flivideo/core';
import { SystemStatus, AppBusyDetails } from '@flivideo/core/contracts'; // browser-safe: zod only, no node:*
```

Browser code (a renderer, a Vite bundle) imports from **`@flivideo/core/contracts`**: the agent-drivable layer and the
pure naming parsers, with no `node:*` in its import graph. The main entry reads the disk and will not bundle for a
browser. Both entries re-export `z` (zod 4): an app still on zod 3 declares its capability shapes with it.

## Exports

| Export                                                                                                                                                                                                                                                                                                                           | What                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Brand`, `readBrands(opts?)`, `resolveBrandRoot(brand, machine?, opts?)`, `brandFolderName(brand, machine?, opts?)`                                                                                                                                                                                                              | Brands from `~/.config/appydave/brands.json` (registry only). One bad entry is left out and listed in `skipped`, never sinking the rest. A brand root rewrites any `/Users/<anyone>` prefix to this machine's home (A5); `machine.brandRoots[key]` overrides it. `brandFolderName` is the root's basename (`guy-monroe` → `v-guy`)                                                                                                                                                                                                                                     |
| `ProjectIdentity`, `readIdentity(dir)`, `writeIdentity(dir, identity)`, `projectIntents(identity)`                                                                                                                                                                                                                               | `fli.studio.json` = `{ schema: 1, id, brand, code, name, createdAt, aspect?, languages?, shape? }`. Intents (B584): `aspect` `16:9` \| `9:16` \| `1:1`, `languages` ISO codes dominant first; `shape` `single` \| `shorts` \| `episodes` is a hint only (no behaviour yet; brains `video-as-code/project-folder-convention.md` §8). `projectIntents` fills the defaults (`16:9`, `["en"]`, `single`). Reads never throw (`null` / `valid` / `invalid`). Writes are atomic and refuse a different `id` or an unreadable existing file                                   |
| `parseProjectFolder(name)`, `projectFolderName(x)`                                                                                                                                                                                                                                                                               | `<code>-<slug>`: `a01-xmen` → `{ code: 'a01', slug: 'xmen' }`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `parseRecording(name)`, `recordingFileName(x)`                                                                                                                                                                                                                                                                                   | `NN-S-slug[-TAGS].ext` → `{ chapter, segment, slug, tags, ext }` (FliHub's naming rules)                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `parseVideoFile(name, videoName)`, `videoFileName(x)`                                                                                                                                                                                                                                                                            | `videos/<name>/<name>-<kind>[-<variant>].<ext>` — `flivideo-tour-audio-a100.m4a`; kinds `cut`, `final`, `audio-<treatment>`, `overlay-<variant>`; anything else is `unknown-kind`. Needs the video name to split (names may contain kind words). No numbers (ruling "B only", 2026-09-22)                                                                                                                                                                                                                                                                              |
| `parseVideoFolder(name)`, `videoFolderName(x)`                                                                                                                                                                                                                                                                                   | A video folder is its kebab name (`flivideo-tour`); legacy layout names (`first-edit`, `edits`, …) never parse as videos                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `parseAppFile(name)`, `appFileName(x)`                                                                                                                                                                                                                                                                                           | `fli.<app>[.<subject>].json` → `{ app, subject? }`. `project.json`, `meta.json`, `fli.json` are not app files                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `classifyProjectEntry(relPath, isDirectory?)`                                                                                                                                                                                                                                                                                    | Zone of a path in a project (`ProjectZone` — the values are in [docs/schema-mirror.md](docs/schema-mirror.md))                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `projectLayout(projectDir)` / `projectLayoutPaths(projectDir)` (+ `…Sync`)                                                                                                                                                                                                                                                       | `'hub' \| 'legacy'`, self-healing (David 2026-09-23): `hub/recordings/` → hub; a top-level `recordings/`, `recording-transcripts/` or `transcripts/` → legacy; anything else (new, empty) → hub, so no marker folder is needed. `{ layout, recordings, transcripts }` — `hub/…` or legacy `recordings/` + `recording-transcripts/`; never merged                                                                                                                                                                                                                       |
| `listProjects(brandRoot)`                                                                                                                                                                                                                                                                                                        | Members (valid `fli.studio.json`), other folders, and the archive one level deep. Every collection is `scanned` with a `scannedAt` stamp or `unscanned` — never confused with empty                                                                                                                                                                                                                                                                                                                                                                                    |
| `resolveProject(brandRootOrListing, ref)`                                                                                                                                                                                                                                                                                        | Folder name, identity `id`, or a whole code → `found`; two or more matches → `ambiguous` with candidates; also `not-a-project`, `not-found`, `unscanned`                                                                                                                                                                                                                                                                                                                                                                                                               |
| `nextCode(listing, letter)`                                                                                                                                                                                                                                                                                                      | Next `<letter><NN>` after every live, other and archived code (archived ranges like `a01-a49` count whole); refuses when anything is unscanned                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `BrandSettings`, `readBrandSettings(brandRoot)`                                                                                                                                                                                                                                                                                  | `<brandRoot>/fli.brand.json` = `{ schema: 1, brand, colour }`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `MachineSettings`, `readMachineSettings(opts?)`                                                                                                                                                                                                                                                                                  | `~/.fli/machine.json` = `{ schema: 1, brandRoots?, labRoot?, apps? }`; missing → defaults (`labRoot` = `~/fli/lab`)                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `labPath({ brandRoot \| brand, project, app, subject? }, machine?)`                                                                                                                                                                                                                                                              | `<labRoot>/<brand folder>/<code>-<project>/<app>/[<subject>/]`. Pass `brandRoot` (from `resolveBrandRoot`): the folder is its basename. `brand` (`appydave` → `v-appydave`) is right only when the root is named `v-<key>`. Never touches the disk. **`resolveLabPath` (v0.9.0)** is the one to call when opening a project: it finds the lab by _code_, renaming a lab left under an old project name into place (FC-40)                                                                                                                                              |
| `OpenContext`, `OpenArgs`, `parseOpenArgs(argv, env?, opts?)`                                                                                                                                                                                                                                                                    | The open contract: `--brand`, `--project`, `--video` (and `--x=value`), then `FLIVIDEO_BRAND` / `FLIVIDEO_PROJECT` / `FLIVIDEO_VIDEO`; argv wins. Returns `{ context, missing }`. Pure                                                                                                                                                                                                                                                                                                                                                                                 |
| `resolveOpenContext(args, { brands, machine?, home?, requireVideo? })`, `OpenContextResult`                                                                                                                                                                                                                                      | Door 2 end to end: `parseOpenArgs(...).context` → `resolved` with an `OpenContext`, or a refusal saying why (the codes are in [docs/schema-mirror.md](docs/schema-mirror.md)). Read-only; never falls back to another project                                                                                                                                                                                                                                                                                                                                          |
| `placeWindow(saved, displays, opts)`, `loadWindow(key)`, `saveWindow(key, state)` / `saveWindowSync`, `trackWindow(win, key, opts?)`, `windowKey(app, role)`, `importWindowState(old, keyOf)`, `windowStatePath()`                                                                                                               | Windows reopen where they were left (David 2026-09-22): ONE store `~/.fli/window-state.json` (the real home, not `$HOME`) keyed `<app>/<role>` (`flicut/main`, `flicast/editor`, `teletubby/prompter`). A spot is kept while its title strip is grabbable on a current display; a monitor that is gone → centred on the main screen, clamped, never off-screen. `keepSize: false` restores position only. `trackWindow` saves after a move/resize settles and synchronously on close. Electron-free: pass `screen` displays and the `BrowserWindow`. Saves never throw |
| Result schemas: `ProjectListing`, `MemberProject`, `OtherFolder`, `ArchivedEntry`, `ResolveProjectResult`, `NextCodeResult`, `ReadIdentityResult`, `WriteIdentityResult`, `ReadBrandsResult`, `ReadBrandSettingsResult`, `MachineSettingsResult`, `ParsedOpenArgs`, … and the factories `scanned`, `validFile`, `readFileResult` | Every value a function returns has a zod schema exported under the same name as its type, so an app declares capability outputs with them instead of copying the shape                                                                                                                                                                                                                                                                                                                                                                                                 |
| `FliCoreError`, `InvalidFile`, `ProjectZone`, `IDENTITY_FILE`, `VIDEO_FOLDER_PATTERN`, …                                                                                                                                                                                                                                         | Shared error type, constants and small schemas                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

**`parseRecording` is stricter than FliHub's `parseRecordingFilename`** (the working definition), in four places:
it rejects segment `0` (`01-0-intro.mov`), an empty slug (`01-1.mov`) and uppercase in the slug (`01-1-Intro.mov`),
and it reads a zero-padded segment as a number, so `01-01-intro.mov` rebuilds as `01-1-intro.mov`. Pinned in
`test/naming.test.ts`.

Name builders (`…FileName`, `…FolderName`) and `labPath` throw `FliCoreError` on input they must not turn into a
name. Readers and resolvers never throw: they return typed results.

## The agent-drivable layer (v0.7.0)

Every Fli app gives agents the same surface as FliCast (checklist:
`~/dev/ad/flivideo/flicast/docs/agent-drivable-reference.md`). The app keeps its handlers; fli-core holds the
contract, the fence, the codes, the spec and the page, so no app hand-rolls them.

```ts
const CAPS = defineCapabilities({
  'project.empty-trash': defineCapability({
    kind: 'command',
    input,
    output,
    sideEffects: 'destructive',
    idempotent: true,
    confirmationRequired: true,
    failureModes: ['confirm-required'],
    humanOnly: true,
    description,
  }),
});
const CODES = defineFailureCodes({ 'confirm-required': -32002 }); // suite names keep their numbers
const gate = authorize('project.empty-trash', CAPS['project.empty-trash'], 'agent:claude', input); // → forbidden
```

- **Contract and fence**: `defineCapability` / `defineCapabilities`, `authorize(name, contract, principal, input)`.
  Principals are `human[:surface]`, `agent:<name>`, `cli`, named in the `x-fli-principal` header. `humanOnly` is
  `true` or `{ when(input), note }` (a dry run open to agents, `apply: true` a person's). The fence guides
  cooperating agents; the bearer token is what keeps other machines and web pages out.
- **Refusals are data**: `SUITE_FAILURE_CODES` keeps the numbers FliCast published; `defineFailureCodes` adds an
  app's own and throws on a clash; `assertAppendOnly` pins a published table. Typed details: `SUITE_REFUSAL_DETAILS`.
- **Discovery**: `controlFilePath(app)` (`~/Library/Application Support/<app>/control.json`), `writeControlFile`
  (0600), `readControlFile` (`live` / `stale` when the pid is gone / `absent` / `invalid`), `bearerMatches`.
- **Spec and door**: `toOpenRpc(...)` + `openRpcText` for a committed `api/openrpc.json`; `answerJsonRpc(body, seam,
{ codes })` answers JSON-RPC 2.0 with `data.failureMode` on every error.
- **Page**: `renderApiPage(doc)` is the read-only reference; `renderApiPage(doc, { console: { rpcPath } })` is the
  console — pick a verb, fill the fields, fire it as a principal, see the answer (human-only verbs refuse in front of
  you). `console.dryRun: true` adds a Dry run box (v0.7.1). Self-contained, light-only.
- **Lifecycle**: `LIFECYCLE_CAPABILITIES` (`system.status`, `system.quit`, `system.restart`; `force` is human-only;
  a busy app refuses `app-busy`) and `appScriptArgs(verb, open?)` for driving `scripts/app.sh` from outside.

## Asking FliTools for a transcript (v0.8.0)

FliTools (`~/dev/ad/flivideo/flitools`) is the one transcription service. Apps call it through this client, never
their own engine: `transcribeQueued(path, { app, project })` queues a recording (FliTools writes `json`/`srt`/`txt`
beside it), `transcriptFor(path, { app })` says whether a current transcript exists, `transcriptJobs({ project },
{ app })` reads the app's own queue. Each answers `ok`, `refused` (FliTools' named refusal) or `unavailable` (not
running) — never a throw. Node only: it reads FliTools' control file.

## Folder access — one pattern for every app (v0.10.0)

David approved it on 2026-09-24. Wherever an app shows a location, it shows two quiet icons right after it, in this
order: FliHub's outline **folder** ("Open in Finder") and **`>_`** ("Copy full path"). They stay hidden until the
line or row is pointed at, and are visible on touch screens and on keyboard focus. A copy confirms with a tick in place
of the icon for about a second, not a toast. A file opens Finder with the file selected. Clicking an icon never opens
the row.

The server half is `revealPath(abs, { roots })`. It opens a folder, or a file selected (`open -R`), and only inside
the roots the app passes (a brand root, a project), with links resolved. It answers `revealed` or `refused` with a
reason. A reveal raises a window on the person's screen, so make the capability that calls it ★ human-only. Each app
draws the icons in its own stack (there is no shared UI code): the icon, the words and the behaviour above are the
shared part.

## The word store (v0.11.0)

David ruled on 2026-09-24 that names, spelling rules and filler lists live in one store that FliStudio owns and every
app reads ("FliCut just uses the information. That way, the other tools can also use it"). It is one file,
`fli.words.json`, at up to three levels: **global** (`~/.config/appydave/`, may be empty), **brand** (`v-<brand>/`) and
**project**. A lower level wins on the same key and can turn off an entry it inherits.

`readWords({ globalFile, brandRoot, projectDir })` reads and merges them. It is a plain file read that never throws,
and a file it cannot use counts as empty. `vocabularyOf(words)` gives the names to hint to a transcriber;
`fillersOf(words, lang)` gives the fillers and the words that are never fillers. Only FliStudio writes the file, with
`addWord` / `removeWord` / `writeWordsFile`. Corrections made inside an edit stay in the edit: nothing here rewrites a
transcript.

Every entry carries a **`Stamp`**, `{ at, by }`, where `by` is the principal the change came through (`human:ui`,
`cli`, `agent:<name>`). That is the answer to "who changed this, and when". It is a separate export so other stores
can adopt it.

## Data shapes

Every exported schema, generated from the code with file:line anchors: [docs/schema-mirror.md](docs/schema-mirror.md)
(verify with `dev-team:schema-mirror`'s `verify_mirror.py docs/schema-mirror.json`).

## Develop

```bash
npm install
npm test              # vitest + v8 coverage; fails below 90% lines
npm run typecheck
npm run lint          # eslint, zero warnings; src/ may import only relative modules, zod and node:*
npm run format:check
npm run build
```

**Tests never touch the live estate.** Every fixture tree is built in a temp directory under `os.tmpdir()` and removed
after the test, and every test file runs with `HOME` pointed at an empty temp directory, so no default path can reach
the real `~/dev/video-projects`, `~/.config/appydave` or `~/.fli`.

## License

MIT
