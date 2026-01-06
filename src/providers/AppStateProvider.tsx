import { type ReactNode, useMemo, useReducer, useCallback, useEffect } from 'react';
import { AppStateReducer } from '../reducers/AppStateReducer';
import { AppStateContext } from '../context/AppStateContext';
import { type AppStateContextValue, type CameraConfig, type TelemetryFieldId } from '../types';
import { DEFAULT_CAMERAS } from '../types/constants';

interface AppStateProviderProps {
  children: ReactNode;
  cameraConfigs?: CameraConfig[];
}

export const AppStateProvider = ({
  children,
  cameraConfigs = DEFAULT_CAMERAS,
}: AppStateProviderProps) => {
  const MAX_TELEMETRY_SELECTIONS = 3;

  const stableCameraConfigs = useMemo(() => cameraConfigs ?? DEFAULT_CAMERAS, [cameraConfigs]);

  // Lazy init reducer to avoid resetting on re-renders
  const [state, dispatch] = useReducer(AppStateReducer, stableCameraConfigs, (configs) => {
    const cameras = Object.fromEntries(
      configs.map((config) => [
        config.id,
        { id: config.id, enabled: config.defaultEnabled, isRecording: false },
      ]),
    );
    console.log('[AppStateProvider] Initializing cameras:', cameras);
    return { cameras, selectedTelemetryCopilot: [], selectedTelemetry: [], sidebarOpen: true };
  });

  // Log state on every render
  useEffect(() => {
    console.log('[AppStateProvider] Current state:', state);
  }, [state]);

  // Action dispatchers with logging
  const toggleCamera = useCallback((cameraId: number) => {
    console.log('[AppStateProvider] Toggling camera:', cameraId);
    dispatch({ type: 'TOGGLE_CAMERA', cameraId });
  }, []);

  const setCameraRecording = useCallback((cameraId: number, isRecording: boolean) => {
    console.log(`[AppStateProvider] Set camera recording: ${cameraId} = ${isRecording}`);
    dispatch({ type: 'SET_CAMERA_RECORDING', cameraId, isRecording });
  }, []);

  const toggleTelemetry = useCallback(
    (fieldId: TelemetryFieldId, maxApplies: boolean, isCopilot: boolean): boolean => {
      console.log('[AppStateProvider] Toggling telemetry:', fieldId, 'isCopilot:', isCopilot);
      const selectedArray = isCopilot ? state.selectedTelemetryCopilot : state.selectedTelemetry;
      const isSelected = selectedArray.includes(fieldId);

      if (!isSelected && maxApplies && selectedArray.length >= MAX_TELEMETRY_SELECTIONS) {
        return false;
      }

      dispatch({ type: 'TOGGLE_TELEMETRY', fieldId, isCopilot });
      return true;
    },
    [state.selectedTelemetryCopilot, state.selectedTelemetry],
  );

  const setSidebarOpen = useCallback((open: boolean) => {
    console.log('[AppStateProvider] Set sidebar open:', open);
    dispatch({ type: 'SET_SIDEBAR_OPEN', open });
  }, []);

  const canSelectMoreTelemetry = useCallback(
    (isCopilot: boolean) => {
      const selectedArray = isCopilot ? state.selectedTelemetryCopilot : state.selectedTelemetry;
      if (isCopilot) {
        return selectedArray.length < MAX_TELEMETRY_SELECTIONS;
      }
      return true;
    },
    [state.selectedTelemetryCopilot, state.selectedTelemetry],
  );

  const contextValue = useMemo<AppStateContextValue>(
    () => ({
      state,
      cameraConfigs: stableCameraConfigs,
      toggleCamera,
      setCameraRecording,
      toggleTelemetry,
      setSidebarOpen,
      canSelectMoreTelemetry,
    }),
    [
      state,
      stableCameraConfigs,
      toggleCamera,
      setCameraRecording,
      toggleTelemetry,
      setSidebarOpen,
      canSelectMoreTelemetry,
    ],
  );

  return <AppStateContext.Provider value={contextValue}>{children}</AppStateContext.Provider>;
};
