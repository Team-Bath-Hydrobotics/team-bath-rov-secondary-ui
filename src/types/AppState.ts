import type { CameraConfig, CameraStateMap } from './camera.types';
import type { TelemetryFieldId } from './telemetry.types';
export interface AppState {
  /** Map of camera ID → camera state (enabled, recording, etc.) */
  cameras: CameraStateMap;

  /** Array of currently selected telemetry field IDs (max 3) */
  selectedTelemetry: TelemetryFieldId[];

  /** Is the sidebar currently open/expanded? */
  sidebarOpen: boolean;
}

/**
 * The value provided by the CoPilot context.
 *
 * This is what components receive when they use the context.
 * It includes both the STATE (data) and ACTIONS (functions to modify data).
 *
 * This pattern is called "state + dispatch" - common in React applications.
 */
export interface AppStateContextValue {
  /** Current state (read-only, modify through actions) */
  state: AppState;

  /** Available camera configurations */
  cameraConfigs: CameraConfig[];

  /** Toggle a camera on/off */
  toggleCamera: (cameraId: string) => void;

  /** Set whether a camera is recording */
  setCameraRecording: (cameraId: string, isRecording: boolean) => void;

  /**
   * Toggle a telemetry field selection.
   * Returns false if trying to select when already at max (3).
   */
  toggleTelemetry: (fieldId: TelemetryFieldId) => boolean;

  /** Open or close the sidebar */
  setSidebarOpen: (open: boolean) => void;

  /** Computed value: can the user select more telemetry fields? */
  canSelectMoreTelemetry: boolean;
}

/**
 * Actions that can be dispatched to modify the AppState.
 *
 * This is a "discriminated union" - each action has a unique 'type'
 * that TypeScript uses to know what other properties are available.
 *
 * Example:
 *   dispatch({ type: 'TOGGLE_CAMERA', cameraId: 'front' })
 */
export type AppStateAction =
  | { type: 'TOGGLE_CAMERA'; cameraId: string }
  | { type: 'SET_CAMERA_RECORDING'; cameraId: string; isRecording: boolean }
  | { type: 'TOGGLE_TELEMETRY'; fieldId: TelemetryFieldId }
  | { type: 'SET_SIDEBAR_OPEN'; open: boolean }
  | { type: 'INITIALIZE_CAMERAS'; configs: CameraConfig[] };
