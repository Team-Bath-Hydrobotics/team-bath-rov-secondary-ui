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
      const camera = state.cameras[action.cameraId];
      if (!camera) return state;

      return {
        ...state,
        cameras: {
          ...state.cameras,
          [action.cameraId]: {
            ...camera,
            enabled: !camera.enabled,
          },
        },
      };
    }

    case 'SET_CAMERA_RECORDING': {
      const camera = state.cameras[action.cameraId];
      if (!camera) return state;

      return {
        ...state,
        cameras: {
          ...state.cameras,
          [action.cameraId]: {
            ...camera,
            isRecording: action.isRecording,
          },
        },
      };
    }

    case 'TOGGLE_TELEMETRY': {
      const isSelected = state.selectedTelemetry.includes(action.fieldId);

      // Always allow deselection
      if (isSelected) {
        return {
          ...state,
          selectedTelemetry: state.selectedTelemetry.filter((id) => id !== action.fieldId),
        };
      }

      // Prevent selecting more than MAX_TELEMETRY_SELECTIONS
      if (state.selectedTelemetry.length >= MAX_TELEMETRY_SELECTIONS) {
        return state;
      }

      return {
        ...state,
        selectedTelemetry: [...state.selectedTelemetry, action.fieldId],
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
        };
      });

      return {
        ...state,
        cameras: cameraStates,
      };
    }

    default:
      return state;
  }
};
