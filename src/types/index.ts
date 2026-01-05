/**
 * Barrel export for all type definitions.
 *
 * This file re-exports everything from the type files, allowing
 * cleaner imports throughout the application:
 *
 *   import { CameraConfig, TelemetryFieldId } from '@/types';
 *
 * Instead of:
 *   import { CameraConfig } from '@/types/camera.types';
 *   import { TelemetryFieldId } from '@/types/telemetry.types';
 */

// Camera types
export type { CameraConfig, CameraState, CameraStateMap } from './camera.types';

// Telemetry types
export type {
  TelemetryFieldId,
  TelemetryCategory,
  TelemetryFieldMeta,
  TelemetrySelectionState,
} from './telemetry.types';

// CoPilot page types
export type { CoPilotState, CoPilotContextValue, CoPilotAction } from './copilot.types';
