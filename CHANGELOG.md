# Changelog

Releases before v0.26.0 are described in their tag's commit message (`git log --oneline`).

## v0.30.0 — 2026-11-04

One help system for the Fli apps (`flivideo/docs/briefs/fli-help-system-2026-11-04.md`).

### Added

- `HELP_SCREENS` (keys per screen, grouped by job), `searchHelp`, `tip`, `speedTip`, `HelpScreenId`: the framework-free
  key data behind FliStudio's `?` cheat sheet. No React in core. Rule: keyboard shortcuts live in tooltips and the `?`
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
