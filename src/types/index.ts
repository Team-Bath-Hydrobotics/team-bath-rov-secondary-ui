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
export type { ThreatLevelType, PlatformData, IcebergCalculationData } from './platform.type';
export { ThreatLevel } from './platform.type';
// Telemetry types
export type {
  TelemetryFieldId,
  TelemetryCategory,
  TelemetryFieldMeta,
  TelemetrySelectionState,
} from './telemetry.types';

// CoPilot page types
export type { AppState, AppStateContextValue, AppStateAction, TelemetryPayload } from './AppState';

// eDNA Calculator types
export type { SpeciesEntry, EdnaCalculatorState } from './edna.types';
