import type { AppState, AppStateAction } from '../types/AppState';
import type { CameraStateMap } from '../types/camera.types';
import { MAX_TELEMETRY_SELECTIONS } from '../types/constants';
/**
 * Reducer function that handles all state updates.
 * Takes current state and an action, returns new state.
 */
export const AppStateReducer = (state: AppState, action: AppStateAction): AppState => {
  switch (action.type) {
    case 'TOGGLE_CAMERA': {
      if (action.isCopilot) {
        const camera = state.camerasCopilot[action.cameraId];
        if (!camera) return state;

        return {
          ...state,
          camerasCopilot: {
            ...state.camerasCopilot,
            [action.cameraId]: {
              ...camera,
              enabled: !camera.enabled,
            },
          },
        };
      } else {
        const camera = state.camerasDetection[action.cameraId];
        if (!camera) return state;

        const enabling = !camera.enabled;

        // Enforce single-selection: when enabling a camera, disable all others
        const newDetectionCameras = enabling
          ? Object.fromEntries(
              Object.entries(state.camerasDetection).map(([id, cam]) => [
                id,
                { ...cam, enabled: Number(id) === action.cameraId },
              ]),
            )
          : {
              ...state.camerasDetection,
              [action.cameraId]: { ...camera, enabled: false },
            };

        return {
          ...state,
          camerasDetection: newDetectionCameras,
        };
      }
    }

    case 'SET_CAMERA_RECORDING': {
      const mapKey = action.isCopilot ? 'camerasCopilot' : 'camerasDetection';
      const camera = state[mapKey][action.cameraId];
      if (!camera) return state;

      return {
        ...state,
        [mapKey]: {
          ...state[mapKey],
          [action.cameraId]: {
            ...camera,
            isRecording: action.isRecording,
          },
        },
      };
    }

    case 'TOGGLE_TELEMETRY': {
      const isCopilot = action.isCopilot ?? false;
      const key = isCopilot ? 'selectedTelemetryCopilot' : 'selectedTelemetry';
      const selectedArray = state[key];
      const isSelected = selectedArray.includes(action.fieldId);
      // Always allow deselection
      if (isSelected) {
        return {
          ...state,
          [key]: selectedArray.filter((id) => id !== action.fieldId),
        };
      }

      // Prevent selecting more than MAX_TELEMETRY_SELECTIONS
      if (isCopilot) {
        if (selectedArray.length >= MAX_TELEMETRY_SELECTIONS) {
          return state;
        }
      }

      return {
        ...state,
        [key]: [...selectedArray, action.fieldId],
      };
    }

    case 'SET_SIDEBAR_OPEN': {
      return {
        ...state,
        sidebarOpen: action.open,
      };
    }

    case 'INITIALIZE_CAMERAS': {
      const cameraStates: CameraStateMap = {};

      action.configs.forEach((config) => {
        cameraStates[config.id] = {
          id: config.id,
          enabled: config.defaultEnabled,
          isRecording: false,
          connectionStatus: 'disconnected',
        };
      });

      // Build separate map objects so mutations to one never affect the other
      const copilotStates: CameraStateMap = Object.fromEntries(
        Object.entries(cameraStates).map(([id, cam]) => [id, { ...cam }]),
      );
      const detectionStates: CameraStateMap = Object.fromEntries(
        Object.entries(cameraStates).map(([id, cam]) => [id, { ...cam }]),
      );

      return {
        ...state,
        camerasCopilot: copilotStates,
        camerasDetection: detectionStates,
      };
    }

    case 'UPDATE_TELEMETRY': {
      return {
        ...state,
        telemetry: {
          ...state.telemetry,
          ...action.payload,
        },
      };
    }
    case 'UPDATE_CAMERA_STATUS': {
      const mapKey = action.isCopilot ? 'camerasCopilot' : 'camerasDetection';
      const camera = state[mapKey][action.cameraId];
      if (!camera) return state;

      return {
        ...state,
        [mapKey]: {
          ...state[mapKey],
          [action.cameraId]: {
            ...camera,
            connectionStatus: action.connectionStatus,
          },
        },
      };
    }
    case 'UPDATE_ICEBERG_DATA': {
      return {
        ...state,
        icebergCalculationData: {
          ...state.icebergCalculationData,
          ...action.icebergCalculationData,
        },
      };
    }
    case 'UPDATE_FLOAT_FILE': {
      return {
        ...state,
        floatFile: action.file,
      };
    }
    default:
      return state;
  }
};
