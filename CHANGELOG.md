# Changelog

Releases before v0.26.0 are described in their tag's commit message (`git log --oneline`).

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
