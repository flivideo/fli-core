// @flivideo/core — the public surface (spec §4). Everything else in src/ is internal.

export { FliCoreError, InvalidFile, type ReadFileResult, type ValidFile } from './results.js';

export {
  Brand,
  BrandsFile,
  brandsFilePath,
  readBrands,
  resolveBrandRoot,
  type ReadBrandsOptions,
  type ResolveBrandRootOptions,
} from './brands.js';

export {
  ProjectIdentity,
  readIdentity,
  writeIdentity,
  type WriteIdentityResult,
} from './identity.js';

export {
  KebabSlug,
  ProjectCode,
  ProjectFolder,
  parseProjectFolder,
  projectFolderName,
} from './project-folder.js';

export { Recording, RecordingTag, parseRecording, recordingFileName } from './recording.js';

export {
  UnknownVideoFile,
  VideoFile,
  VideoFileKind,
  VideoFolder,
  parseVideoFile,
  parseVideoFolder,
  videoFileName,
  videoFolderName,
  type ParsedVideoFile,
} from './video-file.js';

export {
  AppFile,
  AppName,
  AppSubject,
  IDENTITY_FILE,
  appFileName,
  parseAppFile,
} from './app-file.js';

export { LEGACY_FOLDERS, ProjectZone, classifyProjectEntry } from './classify.js';

export {
  ARCHIVED_FOLDER,
  listProjects,
  nextCode,
  resolveProject,
  type ArchivedEntry,
  type MemberProject,
  type NextCodeResult,
  type OtherFolder,
  type ProjectListing,
  type ResolveProjectResult,
  type Scanned,
} from './estate.js';

export { BRAND_SETTINGS_FILE, BrandSettings, readBrandSettings } from './brand-settings.js';

export {
  MachineSettings,
  defaultLabRoot,
  machineSettingsPath,
  readMachineSettings,
  type MachineSettingsOptions,
  type MachineSettingsResult,
  type ResolvedMachineSettings,
} from './machine.js';

export { LabPathInput, labPath } from './lab-path.js';

export {
  OPEN_ENV,
  OpenArgs,
  OpenContext,
  parseOpenArgs,
  type OpenArgName,
  type ParseOpenArgsOptions,
  type ParsedOpenArgs,
} from './open-args.js';
