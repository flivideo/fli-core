# Changelog

Releases before v0.26.0 are described in their tag's commit message (`git log --oneline`).

## v0.37.0 — 2026-11-11

Groups: a named list of projects in one brand, ordered or not. A series is an ordered group.

### Added

- `groups.ts`: `GroupFile` at `<brand root>/groups/<id>/fli.group.json` (`ordered`, optional `note`, members by
  project id with an optional label in an ordered group), `listGroups` / `readGroup` over both `groups/` and the older
  `series/` folder (read in place as ordered groups, `home: "series"`), `createGroup`, `changeGroup`,
  `addGroupMember`, `removeGroupMember`, `orderedGroupOf`, `groupIdOf`, `groupAsSeries`, and `GROUP_CAPABILITIES`
  (`group.list/get/create/add/remove/update`).
- Refusals `group-exists`, `group-not-found` and `in-another-ordered-group` (a project is in at most one ordered
  group; kept from the series design so "the series a project is in" never needs a guess).
- `locked-change.ts`: the one locked read-modify-write, now behind both `changeSeries` and `changeGroup`.

### Changed

- `series.*` contracts are described as the older names of `group.*`. Their shapes are unchanged, and a series file
  is never given a field it did not have.

## v0.36.0 — 2026-11-11

A shared FliTools behind Tailscale Serve: the login check every Fli app uses, and a FliTools client that takes a URL.

### Added

- `serveCallerOf(socketAddress, headers, logins)`: who is really calling. Identity headers count only on a loopback
  connection that came through Serve; Funnel, no login and a login not on the list are refused with a reason. Also
  `serveLoginsFrom` (unset = nobody), `servePrincipalOf` (`human:<first name>`), `cameThroughServe`,
  `decodeTailscaleValue`, `isTailscaleHeader`, `plainAddress`, `isLoopback`, `hopsOf`. Browser-safe, also at
  `@flivideo/core/serve`.
- `FliToolsOptions.url`: call a shared FliTools at a URL. No control file is read and no token is sent.
  `flitoolsEndpoint` says where a call will go.

## v0.35.0 — 2026-11-10

Point and tell: a person marks a moment in an app, says what's wrong and sends it to a live Claude conversation.

### Security

The door trusts a Claude session file only if its `pid` and `procStart` match the running process. A file left by a crash, whose pid has been reused, is not listed.

### Added

- `TellMessage`, saved on an ordinary note at `meta.tell`, with `tellNoteInput`, `tellLine` and `tellDeliveryChange`. App-neutral; an
  app's own data goes in `detail.<app>`.
- `listLiveConversations`, `sendToConversation`, `readConversationTail`, `isLocalRequest`. Only live interactive Claude sessions, only
  at their prompt, never a slash or shell command. Delivered as a bracketed paste, then read back from the transcript.
- `docs/point-and-tell.md`: how another app adopts it.

## v0.34.0 — 2026-11-06

Guide parts: split the old `structure` type, a `sales` form, typed who-for header keys.

### Changed

- `GuideDocType` is now `voice · verbal · build · video · lens · other` (`GUIDE_DOC_TYPES`). `structure` is gone as a
  value but still READS: `type: structure` parses as `build` (`GUIDE_TYPE_ALIASES`, `normaliseGuideType`). Old files
  keep working unchanged.
- `appliesTo.form` gains `sales`.

### Added

- Optional, typed when present: `part`, `style`, `narrator`, `author`, `layer` (`canonical | synthesis`,
  `GuideDocLayer`), `canonical_source`, `owner`, `promotedTo` (a list). `GUIDE_META_KEYS` lists the who-for keys; the
  rest (`distilled_from`, `corpus_window`, `confidence`, `evidence`) stay as kept, untyped keys. Unknown keys are still
  kept.

## v0.33.0 — 2026-11-04

Remembered speed (`flivideo/.appynet/briefs/speed-remember-dev.md`).

### Added

- `@flivideo/core/ui`: `rememberedSpeed(appKey, default, { migrateFrom?, storage? })` → `{ get, set }` on
  `localStorage['fli:<app>:speed']`, snapped to the nearest `FORWARD_SPEEDS` rung; blocked or absent storage yields the
  default and never throws; `migrateFrom` moves an old key across once (write new, remove old). Also `snapSpeed`,
  `speedKey`, `SpeedStorage`. Framework-free (no react), browser-only by intent.

## v0.32.0 — 2026-11-04

The shared speed control (`flivideo/docs/research/speed-control-plan-2026-11-04.md`, step 1).

### Added

- `speedWindow(ladder, current, visible = 3)` (+ `SpeedWindow`): the rungs on show, centred, pinned at the ends; on
  `@flivideo/core` and the browser-safe `/contracts`.
- `@flivideo/core/ui`: `SpeedControl` (3 visible, chevrons step the rate like J / L, edges pin and grey, tooltips carry the
  keys) and `@flivideo/core/ui/speed.css` (colours via `--fli-speed-*` variables each app supplies).
- `react` as an optional peer dependency (`^18 || ^19`), `jsx` in the tsconfig. `src/ui/` is the only place react may be
  imported; the architecture test enforces it.

## v0.31.0 — 2026-11-04

Story guides are typed Markdown (`flivideo/.appynet/briefs/typed-guides-dev.md`).

### Added

- `GuideDoc` (zod), `parseGuide(text)` → `{header, body}` or `{error, issues, body, raw}`, `isGuide`, `splitFrontmatter`,
  `GUIDE_SCHEMA` (`storypilot.guide/1`), `GUIDE_REQUIRED`, `GuideDocType`, `GuideDocLevel`, `GuideDocAppliesTo`. A guide
  header needs `schema, id, label, type, level, gist` (one line); `appliesTo` and `brands` are optional; every other key
  is kept and ignored (forge provenance). Errors are card-ready: `no guide header`, `invalid: missing gist`,
  `invalid: type: …`. Zod only, browser-safe (also on `@flivideo/core/contracts`); the header reader is a small YAML
  subset, no new dependency.

## v0.30.0 — 2026-11-04

One help system for the Fli apps (`flivideo/docs/briefs/fli-help-system-2026-11-04.md`).

### Added

- `HELP_SCREENS` (keys per screen, grouped by job), `searchHelp`, `tip`, `speedTip`, `HelpScreenId`: the framework-free
  key data behind FliStudio's `?` cheat sheet. No React in core; also exported from the browser-safe `@flivideo/core/contracts`. Rule: keyboard shortcuts live in tooltips and the `?`
  sheet, never as inline text beside a control.

## v0.29.0 — 2026-11-03

Published accepts a platform URL (`flivideo/docs/briefs/flistudio-lastwork-and-platform-published-2026-11-03.md`).

### Added

- `markPublished(file, video, { url, platform }, by)`: records a platform link (`meta.publishedUrl`, `meta.platform`)
  with no YouTube id. `PUBLISH_PLATFORMS` (`youtube | skool | other`) and `PublishPlatform`.

### Changed

- `publishedVideos()` also returns published videos carrying `meta.publishedUrl`; `PublishedVideo` gains `platform`
  (`youtube` for every youtubeId resource, as before) and `youtubeId` becomes optional. YouTube-id publishes are unchanged.

## v0.28.0 — 2026-11-01

fli-notes v2 life states (`flivideo/docs/briefs/fli-notes-v2-quiet-capture-and-lab-2026-11-01.md`
§3, workplan `fli-notes-v2-orch-workplan-2026-11-01.md`). rc.1 promoted unchanged.

### Added

- `LifeState` (`live | done | used | stale | replaced`): every record starts `live`; a settle line (a `change`
  targeting it, `entityType: 'note'`, `field: 'state'` = `SETTLE_FIELD`) moves it, with the reason as `text` and the
  pointer as the new `links.to`. Any record can be settled, to any state; `live` re-opens.
- `settleNote(dir, id, input, opts?)` with `SettleInput` (`stale` needs `reason`; `used` / `replaced` need `to`).
  `isSettleLine(record)`.
- `NOTE_REFUSALS` / `NoteRefusal`: the refusal names, no numbers (each app keeps its own failure codes).
- `NotesRead.states`: where every record in the file stands, whatever the filter.

### Changed

- `readNotes(dir, filter?)` and `scanNotes` answer `live` records by default. `NoteFilter` gains `state` (one or many)
  and `history` (the whole file, settle lines included). `open` means a `live` ask.
- `NoteState` is `{ life, settledBy?, reason?, to?, answeredBy }` (was `{ status, statusBy?, answeredBy }`).
- New lines are `schema: 2` and carry no `status`. Schema 1 lines still read: `kept` / `open` → `live`, a v1 status
  change to `done` → `done` (its `links.follows` read as the pointer).
- `resolveAsk` is settle-to-`done` for asks; its line uses `field: 'state'`, `before: 'live'` and `links.to` (was
  `field: 'status'`, `before: 'open'`, `links.follows`).
- Refusal reasons renamed: `busy` → `notes-busy`, `not-found` → `note-not-found`, `already-done` → `already-settled`.
- `NoteWhere` takes any string key beside `brand` / `project` / `video` (app-neutral).

## v0.27.0 — 2026-10-31

Released from v0.27.0-rc.1 unchanged (fli-notes overnight, `flivideo/docs/briefs/fli-notes-suite-record-2026-10-31.md` §4A).

## v0.27.0-rc.1 — 2026-10-31

Release candidate for fli-notes (`flivideo/docs/briefs/fli-notes-suite-record-2026-10-31.md` §4A, workplan
`fli-notes-orch-workplan-2026-10-31.md`). Consumers pin `github:flivideo/fli-core#v0.27.0-rc.1`; `v0.27.0` is tagged
on `main` after merge.

### Added

- fli-notes: `NoteRecord` and its parts (`NoteKind` `note | ask | change`, `NoteChannel`, `NoteStatus`, `NoteScope`,
  `NoteTarget`, `NoteWhere`, `NoteProducer`, `NoteLinks`, `NoteForm`, `NoteExcerpt`, `NoteInput`, `ChangeInput`,
  `ResolveAskInput`, `NoteFilter`, `NoteState`), browser-safe in `note-record.ts` and on `@flivideo/core/contracts`.
  `NOTES_FILE` = `fli.notes.jsonl`, one record per line, append-only.
- `addNote(dir, input, opts?)`, `logChange(dir, change, opts?)` (the door log), `resolveAsk(dir, askId, input, opts?)`,
  `readNotes(dir)`, `scanNotes(roots, filter?, opts?)`, `notesFilePath`, `newNoteId`, `AddNoteResult`, `NotesRead`,
  `NotesScan`, `ScannedNote`, `NoteLineProblem`: locked (`fli.notes.jsonl.lock`, `takeLock`) appends that start a fresh
  line after a torn one, and never-throwing reads.
- Pure helpers: `snapshotChange(before, after, opts?)` (`full` / `excerpt` / `keys`, limit `NOTE_FULL_LIMIT` = 2000,
  context `NOTE_EXCERPT_CONTEXT` = 240), `noteStates(records)`, `matchesNote(record, filter, state?)`,
  `noteChannelOf(by)`, `noteRecordOf(input, id, at)`, `NOTE_ENTITY`.
- `Stamp` / `stampOf` are on `@flivideo/core/contracts` too.

### Changed

- Test guard also wraps `fs.appendFile`.

## v0.26.0 — 2026-10-29

Released from v0.26.0-rc.1 unchanged (merged to `main` after the overnight gates passed).

## v0.26.0-rc.1 — 2026-10-29

Release candidate for the overnight build (`flivideo/docs/briefs/overnight-2026-10-29-build-spec.md`, W3 + W7 + W8).
Consumers pin `github:flivideo/fli-core#v0.26.0-rc.1`; `v0.26.0` is tagged on `main` after merge.

### Added

- `edit` and `cast` video kinds (R11: a whole video is named after how it was made): `<name>-edit.<ext>` (FliEdit),
  `<name>-cast.<ext>` (FliCast), no variant. `-final` stays legacy-read only.
- `wholeVideoOwner(projectDir, video, file)` → `{ app, source }`, the one owner rule for whole-video files, with
  `WholeVideoApp` (`flicut | fliedit | flicast | flistudio`) and `WholeVideoOwner`. `audio` + `fli.cut.<video>.json` is
  FliCut's on evidence (flicut `pipeline.ts` `contractStem` writes `-audio-<arm>`); `part` is placed (only FliStudio
  `export.place` writes one).
- `updateBrandSettings(brandRoot, mutate, opts?)`: locked read-modify-write of `fli.brand.json`
  (`fli.brand.json.lock`), so FliHub and FliStudio never lose each other's change. `brandSettingsVersion(file)`: sha256
  of the file bytes, for optimistic concurrency.
- `takeLock` is exported.

### Changed

- `PublishExport.kind` gains `edit` and `cast`; `PublishExport.app` is `WholeVideoApp` (was `EditApp`).
  `EditApp` gains `flicast` (a `fli.cast.<video>.json` is an edit document).
- `exportApp(kind)` is the name-only half of the owner rule: `edit` → fliedit, `cast` → flicast, `overlay` →
  flistudio; `legacy` → `null` (was `fliedit`: a `-final` may be FliEdit's or FliCast's) and `part` → `null` (was
  `flicut`: no app writes one). Callers with the project use `wholeVideoOwner`.
- `window-state.ts` writes through `atomicWrite` / the new internal `atomicWriteSync` (hidden, unique temp file,
  removed on failure) instead of its own `<file>.<pid>.<ms>.tmp` rename (collided within a millisecond, no cleanup).
