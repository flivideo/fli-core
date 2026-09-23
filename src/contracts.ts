// @flivideo/core/contracts — the browser-safe entry (v0.7.2). Everything here reaches only zod: no node:* anywhere in
// its import graph (pinned by test/architecture.test.ts), so a renderer or any Vite browser bundle can import the
// schemas, refusal codes, the capability contract and the lifecycle shapes. The main entry re-exports all of it.

export {
  FliCoreError,
  InvalidFile,
  readFileResult,
  validFile,
  type ReadFileResult,
  type ValidFile,
} from './results.js';

export {
  KebabSlug,
  ProjectCode,
  ProjectFolder,
  parseProjectFolder,
  projectFolderName,
} from './project-folder.js';

export { Recording, RecordingTag, parseRecording, recordingFileName } from './recording.js';

export {
  AppFile,
  AppName,
  AppSubject,
  IDENTITY_FILE,
  appFileName,
  parseAppFile,
} from './app-file.js';

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
