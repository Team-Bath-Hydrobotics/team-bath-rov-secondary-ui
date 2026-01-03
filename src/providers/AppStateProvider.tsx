import { type ReactNode } from 'react';
import { useReducer, useCallback, useMemo } from 'react';
import { AppStateReducer } from '../reducers/AppStateReducer';
import { AppStateContext } from '../context/AppStateContext';
import {
  type CameraStateMap,
  type AppState,
  type AppStateContextValue,
  type CameraConfig,
  type TelemetryFieldId,
} from '../types';
const initialState: AppState = {
  cameras: {},
  selectedTelemetry: [],
  sidebarOpen: true,
};

interface AppStateProviderProps {
  children: ReactNode;
  cameraConfigs?: CameraConfig[];
}

/**
 * Provider component that wraps the AppState page and provides state to all children.
 * Optionally accepts custom camera configurations.
 */
const DEFAULT_CAMERAS: CameraConfig[] = [
  { id: 'cam1', name: 'Front Camera', defaultEnabled: true },
  { id: 'cam2', name: 'Rear Camera', defaultEnabled: false },
];
export const AppStateProvider = ({
  children,
  cameraConfigs = DEFAULT_CAMERAS,
}: AppStateProviderProps) => {
  // Initialize state with camera configs
  const MAX_TELEMETRY_SELECTIONS = 3;
  const [state, dispatch] = useReducer(AppStateReducer, initialState, (initial) => {
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

  const contextValue = useMemo<AppStateContextValue>(
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

  return <AppStateContext.Provider value={contextValue}>{children}</AppStateContext.Provider>;
};
