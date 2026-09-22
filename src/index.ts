// @flivideo/core — the public surface (spec §4). Everything else in src/ is internal.
// Every shape is a zod schema exported under the same name as its inferred type.

export {
  FliCoreError,
  InvalidFile,
  readFileResult,
  validFile,
  type ReadFileResult,
  type ValidFile,
} from './results.js';

export {
  Brand,
  BrandsFile,
  BrandsRead,
  ReadBrandsResult,
  SkippedBrand,
  brandFolderName,
  brandsFilePath,
  readBrands,
  resolveBrandRoot,
  type ReadBrandsOptions,
  type ResolveBrandRootOptions,
} from './brands.js';

export {
  ProjectIdentity,
  ReadIdentityResult,
  WriteIdentityResult,
  readIdentity,
  writeIdentity,
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
  ParsedVideoFile,
  UnknownVideoFile,
  VIDEO_FOLDER_PATTERN,
  VideoFile,
  VideoFileKind,
  VideoFolder,
  VideoFolderName,
  parseVideoFile,
  parseVideoFolder,
  videoFileName,
  videoFolderName,
} from './video-file.js';

export {
  AppFile,
  AppName,
  AppSubject,
  IDENTITY_FILE,
  appFileName,
  parseAppFile,
} from './app-file.js';

export {
  HUB_FOLDER,
  LAYOUT_DIRS,
  LEGACY_FOLDERS,
  ProjectLayout,
  ProjectLayoutPaths,
  ProjectZone,
  classifyProjectEntry,
  projectLayout,
  projectLayoutPaths,
  projectLayoutPathsSync,
  projectLayoutSync,
} from './classify.js';

export {
  ARCHIVED_FOLDER,
  ArchivedEntry,
  MemberProject,
  NextCodeResult,
  OtherFolder,
  ProjectListing,
  ProjectRefusal,
  ResolveProjectResult,
  listProjects,
  nextCode,
  resolveProject,
  scanned,
  type Scanned,
} from './estate.js';

export {
  BRAND_SETTINGS_FILE,
  BrandSettings,
  ReadBrandSettingsResult,
  readBrandSettings,
} from './brand-settings.js';

export {
  MachineSettings,
  MachineSettingsResult,
  ResolvedMachineSettings,
  defaultLabRoot,
  machineSettingsPath,
  readMachineSettings,
  type MachineSettingsOptions,
} from './machine.js';

export { LabPathInput, labPath } from './lab-path.js';

export {
  OPEN_ENV,
  OpenArgName,
  OpenArgs,
  OpenContext,
  ParsedOpenArgs,
  RawOpenArgs,
  parseOpenArgs,
  type ParseOpenArgsOptions,
} from './open-args.js';

export {
  OpenContextResult,
  resolveOpenContext,
  type ResolveOpenContextOptions,
} from './open-context.js';
