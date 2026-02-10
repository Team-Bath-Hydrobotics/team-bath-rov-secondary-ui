import type { CameraConfig, CameraStateMap } from './camera.types';
import type { TelemetryDataPoint } from './constants';
import type { TelemetryFieldId } from './telemetry.types';
import type { IcebergCalculationData } from './platform.type';
import type { AppSettings } from './appsettings.types';
export type TelemetryPayload = Record<TelemetryFieldId, TelemetryDataPoint>;

export interface AppState {
  /** Map of camera ID → camera state (enabled, recording, etc.) */
  cameras: CameraStateMap;

  /** Array of currently selected telemetry field IDs (max 3) */
  selectedTelemetryCopilot: TelemetryFieldId[];

  /** Array of currently selected telemetry field IDs */
  selectedTelemetry: TelemetryFieldId[];

  /** Is the sidebar currently open/expanded? */
  sidebarOpen: boolean;

  /** Latest telemetry data received */
  telemetry: TelemetryPayload;

  /** Iceberg platform data for calculations */
  icebergCalculationData: IcebergCalculationData;

  settings: AppSettings;
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
  toggleCamera: (cameraId: number) => void;

  /** Set whether a camera is recording */
  setCameraRecording: (cameraId: number, isRecording: boolean) => void;

  /**
   * Toggle a telemetry field selection.
   * Returns false if trying to select when already at max (3).
   */
  toggleTelemetry: (fieldId: TelemetryFieldId, maxApplies: boolean, isCopilot: boolean) => boolean;

  /** Open or close the sidebar */
  setSidebarOpen: (open: boolean) => void;

  /** Computed value: can the user select more telemetry fields? */
  canSelectMoreTelemetry: (isCopilot: boolean) => boolean;

  /** Update telemetry from an external source e.g MQTT broker */
  updateTelemetry: (payload: TelemetryPayload) => void;

  /** Update iceberg input data for calculations*/
  updateIcebergCalculationData: (data: IcebergCalculationData) => void;
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
  | { type: 'TOGGLE_CAMERA'; cameraId: number }
  | { type: 'SET_CAMERA_RECORDING'; cameraId: number; isRecording: boolean }
  | { type: 'TOGGLE_TELEMETRY'; fieldId: TelemetryFieldId; isCopilot?: boolean }
  | { type: 'SET_SIDEBAR_OPEN'; open: boolean }
  | { type: 'INITIALIZE_CAMERAS'; configs: CameraConfig[] }
  | { type: 'UPDATE_TELEMETRY'; payload: TelemetryPayload }
  | { type: 'UPDATE_ICEBERG_DATA'; icebergCalculationData: IcebergCalculationData };
