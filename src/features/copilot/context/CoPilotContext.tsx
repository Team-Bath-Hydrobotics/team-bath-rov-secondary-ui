import { createContext, useContext, useReducer, useMemo, useCallback, type ReactNode } from 'react';
import type {
  CoPilotState,
  CoPilotContextValue,
  CoPilotAction,
  CameraConfig,
  CameraStateMap,
  TelemetryFieldId,
} from '../../../types';
import { DEFAULT_CAMERAS, MAX_TELEMETRY_SELECTIONS } from '../constants';

/**
 * Reducer function that handles all state updates.
 * Takes current state and an action, returns new state.
 */
const coPilotReducer = (state: CoPilotState, action: CoPilotAction): CoPilotState => {
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

const initialState: CoPilotState = {
  cameras: {},
  selectedTelemetry: [],
  sidebarOpen: true,
};

const CoPilotContext = createContext<CoPilotContextValue | null>(null);

interface CoPilotProviderProps {
  children: ReactNode;
  cameraConfigs?: CameraConfig[];
}

/**
 * Provider component that wraps the CoPilot page and provides state to all children.
 * Optionally accepts custom camera configurations.
 */
export const CoPilotProvider = ({
  children,
  cameraConfigs = DEFAULT_CAMERAS,
}: CoPilotProviderProps) => {
  // Initialize state with camera configs
  const [state, dispatch] = useReducer(coPilotReducer, initialState, (initial) => {
    const cameraStates: CameraStateMap = {};
    cameraConfigs.forEach((config) => {
      cameraStates[config.id] = {
        id: config.id,
        enabled: config.defaultEnabled,
        isRecording: false,
      };
    });
    return { ...initial, cameras: cameraStates };
  });

  // Action dispatchers
  const toggleCamera = useCallback((cameraId: string) => {
    dispatch({ type: 'TOGGLE_CAMERA', cameraId });
  }, []);

  const setCameraRecording = useCallback((cameraId: string, isRecording: boolean) => {
    dispatch({ type: 'SET_CAMERA_RECORDING', cameraId, isRecording });
  }, []);

  const toggleTelemetry = useCallback(
    (fieldId: TelemetryFieldId): boolean => {
      const isSelected = state.selectedTelemetry.includes(fieldId);
      const canAdd = state.selectedTelemetry.length < MAX_TELEMETRY_SELECTIONS;

      // Return false if trying to add when at max
      if (!isSelected && !canAdd) {
        return false;
      }

      dispatch({ type: 'TOGGLE_TELEMETRY', fieldId });
      return true;
    },
    [state.selectedTelemetry],
  );

  const setSidebarOpen = useCallback((open: boolean) => {
    dispatch({ type: 'SET_SIDEBAR_OPEN', open });
  }, []);

  const canSelectMoreTelemetry = useMemo(
    () => state.selectedTelemetry.length < MAX_TELEMETRY_SELECTIONS,
    [state.selectedTelemetry.length],
  );

  const contextValue = useMemo<CoPilotContextValue>(
    () => ({
      state,
      cameraConfigs,
      toggleCamera,
      setCameraRecording,
      toggleTelemetry,
      setSidebarOpen,
      canSelectMoreTelemetry,
    }),
    [
      state,
      cameraConfigs,
      toggleCamera,
      setCameraRecording,
      toggleTelemetry,
      setSidebarOpen,
      canSelectMoreTelemetry,
    ],
  );

  return <CoPilotContext.Provider value={contextValue}>{children}</CoPilotContext.Provider>;
};

/**
 * Hook to access the CoPilot context.
 * Must be used within a CoPilotProvider.
 */
export const useCoPilot = (): CoPilotContextValue => {
  const context = useContext(CoPilotContext);

  if (context === null) {
    throw new Error('useCoPilot must be used within a CoPilotProvider');
  }

  return context;
};
