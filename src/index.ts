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
  DEFAULT_ASPECT,
  DEFAULT_LANGUAGES,
  DEFAULT_SHAPE,
  ProjectAspect,
  ProjectIdentity,
  ProjectLanguage,
  ProjectShape,
  projectIntents,
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
  TRASH_FOLDER,
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

export {
  DisplayArea,
  SavedWindow,
  WindowRect,
  WindowStateFile,
  importWindowState,
  loadWindow,
  placeWindow,
  saveWindow,
  saveWindowSync,
  trackWindow,
  windowKey,
  windowStatePath,
  type PlaceOptions,
  type TrackOptions,
  type TrackedWindow,
} from './window-state.js';

// ── The agent-drivable layer (v0.7.0, David 2026-09-23): one contract, one fence, one spec, one page. ──

export {
  CapabilityKind,
  CapabilityMeta,
  CapabilityName,
  ExpectedDuration,
  PRINCIPAL_HEADER,
  PrincipalKind,
  PrincipalName,
  SideEffects,
  authorize,
  defineCapabilities,
  defineCapability,
  describeCapabilities,
  familyOf,
  isHumanOnly,
  principalKind,
  requiredFields,
  type Authorization,
  type CapabilityContract,
  type HumanOnlyWhen,
} from './capability.js';

export {
  AppBusyDetails,
  BusyWork,
  CapabilityRefusal,
  FAILURE_CODE_RANGE,
  FailureCodeTable,
  ForbiddenDetails,
  JSONRPC_CODES,
  MissingDetails,
  Refusal,
  SUITE_FAILURE_CODES,
  SUITE_REFUSAL_DETAILS,
  assertAppendOnly,
  defineFailureCodes,
  failureCode,
  nextFailureCode,
  type SuiteFailureMode,
} from './failure-codes.js';

export {
  ControlFile,
  ControlFileRead,
  bearerMatches,
  controlFilePath,
  newControlToken,
  pidAlive,
  readControlFile,
  removeControlFile,
  writeControlFile,
  type ControlFileOptions,
} from './control-file.js';

export {
  JsonRpcRequest,
  OpenRpcDocument,
  OpenRpcServer,
  answerJsonRpc,
  openRpcText,
  toOpenRpc,
  type CallAnswer,
  type JsonRpcOptions,
  type OpenRpcOptions,
} from './openrpc.js';

export { renderApiPage, type ApiPageOptions } from './api-page.js';

export {
  AppScriptOpen,
  LIFECYCLE_CAPABILITIES,
  LifecycleVerb,
  SystemQuitInput,
  SystemQuitOutput,
  SystemStatus,
  appScriptArgs,
} from './lifecycle.js';

/**
 * The zod this package is built with (v4). Declare capability inputs and outputs with it when the app itself is on
 * zod 3 (Teletubby, FliCut): a zod 3 schema is not a `z.ZodType` here, and a copy of zod 4 from elsewhere may not be.
 */
export { z } from 'zod';
