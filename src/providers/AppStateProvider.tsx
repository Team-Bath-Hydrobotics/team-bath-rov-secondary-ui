import { type ReactNode, useMemo, useReducer, useCallback } from 'react';
import { AppStateReducer } from '../reducers/AppStateReducer';
import { AppStateContext } from '../context/AppStateContext';
import {
  type AppStateContextValue,
  type CameraConfig,
  type FloatFile,
  type IcebergCalculationData,
  type PlatformData,
  type TelemetryFieldId,
} from '../types';
import { ThreatLevel } from '../types';
import { type TelemetryPayload } from '../types';
import { DEFAULT_CAMERAS } from '../types/constants/defaultCameras';

interface AppStateProviderProps {
  children: ReactNode;
  cameraConfigs?: CameraConfig[];
}

export const AppStateProvider = ({ children, cameraConfigs }: AppStateProviderProps) => {
  const MAX_TELEMETRY_SELECTIONS = 3;

  const stableCameraConfigs = useMemo(() => cameraConfigs ?? DEFAULT_CAMERAS, [cameraConfigs]);
  // Lazy init reducer to avoid resetting on re-renders
  const [state, dispatch] = useReducer(AppStateReducer, stableCameraConfigs, (cameraConfigs) => {
    const camerasCopilot = Object.fromEntries(
      cameraConfigs.map((config: CameraConfig) => [
        config.id,
        { id: config.id, enabled: config.defaultEnabled, isRecording: false },
      ]),
    );
    const camerasDetection = Object.fromEntries(
      cameraConfigs.map((config: CameraConfig) => [
        config.id,
        { id: config.id, enabled: config.defaultEnabled, isRecording: false },
      ]),
    );

    return {
      camerasCopilot: camerasCopilot,
      camerasDetection: camerasDetection,
      selectedTelemetryCopilot: [],
      selectedTelemetry: [],
      sidebarOpen: true,
      telemetry: {} as TelemetryPayload,
      icebergCalculationData: {
        icebergDepth: 0,
        icebergHeading: 0,
        icebergLatitude: 0,
        icebergLongitude: 0,
        platformData: [
          {
            id: 1,
            name: 'Hibernia',
            latitude: 46.7504,
            longitude: -48.7819,
            oceanDepth: 78,
            generalThreatLevel: ThreatLevel.UNKNOWN,
            subsurfaceThreatLevel: ThreatLevel.UNKNOWN,
          },
          {
            id: 2,
            name: 'Sea Rose',
            latitude: 46.7895,
            longitude: -48.146,
            oceanDepth: 107,
            generalThreatLevel: ThreatLevel.UNKNOWN,
            subsurfaceThreatLevel: ThreatLevel.UNKNOWN,
          },
          {
            id: 3,
            name: 'Terra Nova',
            latitude: 46.4,
            longitude: -48.4,
            oceanDepth: 91,
            generalThreatLevel: ThreatLevel.UNKNOWN,
            subsurfaceThreatLevel: ThreatLevel.UNKNOWN,
          },
          {
            id: 4,
            name: 'Hebron',
            latitude: 46.544,
            longitude: -48.518,
            oceanDepth: 93,
            generalThreatLevel: ThreatLevel.UNKNOWN,
            subsurfaceThreatLevel: ThreatLevel.UNKNOWN,
          },
        ] as PlatformData[],
        imageFile: null,
      },
      floatFile: {
        csvFile: null,
      },
      settings: {
        networkSettings: {
          wsBaseUrl: import.meta.env.VITE_WS_SERVER_URL || 'ws://localhost:50000',
          photogrammetryApiUrl: '/photogrammetry-api',
          detectionApiUrl: '/detection-api',
        },
      },
    };
  });

  // Action dispatchers with logging
  const toggleCamera = useCallback((cameraId: number, isCopilot: boolean) => {
    dispatch({ type: 'TOGGLE_CAMERA', cameraId, isCopilot });
  }, []);

  const setCameraRecording = useCallback(
    (cameraId: number, isRecording: boolean, isCopilot: boolean) => {
      dispatch({ type: 'SET_CAMERA_RECORDING', cameraId, isRecording, isCopilot });
    },
    [],
  );

  const updateCameraStatus = useCallback(
    (
      cameraId: number,
      connectionStatus: 'connecting' | 'connected' | 'failed' | 'disconnected',
      isCopilot: boolean,
    ) => {
      dispatch({ type: 'UPDATE_CAMERA_STATUS', cameraId, connectionStatus, isCopilot });
    },
    [],
  );

  const toggleTelemetry = useCallback(
    (fieldId: TelemetryFieldId, maxApplies: boolean, isCopilot: boolean): boolean => {
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
    dispatch({ type: 'SET_SIDEBAR_OPEN', open });
  }, []);

  const updateCameraState = useCallback((configs: CameraConfig[]) => {
    dispatch({ type: 'INITIALIZE_CAMERAS', configs });
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

  const canSelectMoreCameras = useCallback(
    (isCopilot: boolean) => {
      if (isCopilot) {
        return true;
      } else {
        const selectedCameras = Object.values(state.camerasDetection).filter((c) => c.enabled);
        return selectedCameras.length < 1; // Limit to 1 detection camera
      }
    },
    [state.camerasDetection],
  );

  const updateTelemetry = useCallback((payload: TelemetryPayload) => {
    dispatch({ type: 'UPDATE_TELEMETRY', payload });
  }, []);

  const updateIcebergCalculationData = useCallback((data: IcebergCalculationData) => {
    dispatch({ type: 'UPDATE_ICEBERG_DATA', icebergCalculationData: data });
  }, []);

  const updateFloatFile = useCallback((data: FloatFile) => {
    dispatch({ type: 'UPDATE_FLOAT_FILE', file: data });
  }, []);

  const contextValue = useMemo<AppStateContextValue>(
    () => ({
      state,
      copilotCameraConfigs: stableCameraConfigs,
      detectionCameraConfigs: stableCameraConfigs,
      toggleCamera,
      setCameraRecording,
      updateCameraStatus,
      toggleTelemetry,
      setSidebarOpen,
      canSelectMoreTelemetry,
      updateTelemetry,
      updateIcebergCalculationData,
      updateCameraState,
      updateFloatFile,
      canSelectMoreCameras,
    }),
    [
      state,
      stableCameraConfigs,
      toggleCamera,
      setCameraRecording,
      updateCameraStatus,
      toggleTelemetry,
      setSidebarOpen,
      canSelectMoreTelemetry,
      updateTelemetry,
      updateIcebergCalculationData,
      updateCameraState,
      updateFloatFile,
      canSelectMoreCameras,
    ],
  );

  return <AppStateContext.Provider value={contextValue}>{children}</AppStateContext.Provider>;
};
