import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, renderHook, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useAppStateContext } from '../context/AppStateContext';
import { ThreatLevel } from '../types';
import type {
  AppStateContextValue,
  CameraConfig,
  TelemetryFieldId,
  TelemetryPayload,
} from '../types';
import { DEFAULT_CAMERAS } from '../types/constants/defaultCameras';
import { AppStateProvider } from './AppStateProvider';

const CAMERAS: CameraConfig[] = [
  { id: 1, name: 'Front', defaultEnabled: true },
  { id: 2, name: 'Back', defaultEnabled: false },
  { id: 3, name: 'Arm', defaultEnabled: false },
];

const OTHER_CAMERAS: CameraConfig[] = [{ id: 9, name: 'Spare', defaultEnabled: true }];

const COPILOT = true;
const DETECTION = false;

type AppStateResult = { current: AppStateContextValue };

const renderAppState = (cameraConfigs?: CameraConfig[]) =>
  renderHook(() => useAppStateContext(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <AppStateProvider cameraConfigs={cameraConfigs}>{children}</AppStateProvider>
    ),
  });

/** Calls toggleTelemetry and returns whether the provider accepted it. */
const toggleTelemetry = (
  result: AppStateResult,
  fieldId: TelemetryFieldId,
  maxApplies: boolean,
  isCopilot: boolean,
) => {
  let accepted = false;
  act(() => {
    accepted = result.current.toggleTelemetry(fieldId, maxApplies, isCopilot);
  });
  return accepted;
};

const point = (value: number, unit = 'm') => ({ value, unit, timestamp: 1700000000 });

// Real messages only carry some fields, so partial payloads are the normal case.
const telemetry = (fields: Partial<TelemetryPayload>) => fields as TelemetryPayload;

describe('AppStateProvider', () => {
  beforeEach(() => {
    // Keep the tests independent of any local .env file.
    vi.stubEnv('VITE_WS_SERVER_URL', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders its children', () => {
    render(
      <AppStateProvider>
        <p>child content</p>
      </AppStateProvider>,
    );

    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  describe('initial state', () => {
    it('creates a disabled, non-recording entry for each default camera', () => {
      const { result } = renderAppState();

      const expected = Object.fromEntries(
        DEFAULT_CAMERAS.map((camera) => [
          camera.id,
          { id: camera.id, enabled: false, isRecording: false },
        ]),
      );
      expect(Object.keys(result.current.state.camerasCopilot)).toHaveLength(6);
      expect(result.current.state.camerasCopilot).toEqual(expected);
      expect(result.current.state.camerasDetection).toEqual(expected);
    });

    it('uses the cameraConfigs prop, including each defaultEnabled flag', () => {
      const { result } = renderAppState(CAMERAS);

      const expected = {
        1: { id: 1, enabled: true, isRecording: false },
        2: { id: 2, enabled: false, isRecording: false },
        3: { id: 3, enabled: false, isRecording: false },
      };
      expect(result.current.state.camerasCopilot).toEqual(expected);
      expect(result.current.state.camerasDetection).toEqual(expected);
    });

    it('exposes the camera configs for both pages', () => {
      const { result } = renderAppState(CAMERAS);

      expect(result.current.copilotCameraConfigs).toBe(CAMERAS);
      expect(result.current.detectionCameraConfigs).toBe(CAMERAS);
    });

    it('falls back to the default camera configs', () => {
      const { result } = renderAppState();

      expect(result.current.copilotCameraConfigs).toBe(DEFAULT_CAMERAS);
      expect(result.current.detectionCameraConfigs).toBe(DEFAULT_CAMERAS);
    });

    it('starts with nothing selected, no telemetry and the sidebar open', () => {
      const { result } = renderAppState();

      expect(result.current.state.selectedTelemetry).toEqual([]);
      expect(result.current.state.selectedTelemetryCopilot).toEqual([]);
      expect(result.current.state.telemetry).toEqual({});
      expect(result.current.state.sidebarOpen).toBe(true);
      expect(result.current.state.floatFile).toEqual({ csvFile: null });
    });

    it('starts with zeroed iceberg data and four platforms of unknown threat', () => {
      const { result } = renderAppState();
      const { platformData, ...iceberg } = result.current.state.icebergCalculationData;

      expect(iceberg).toEqual({
        icebergDepth: 0,
        icebergHeading: 0,
        icebergLatitude: 0,
        icebergLongitude: 0,
        imageFile: null,
      });
      expect(platformData.map((platform) => platform.name)).toEqual([
        'Hibernia',
        'Sea Rose',
        'Terra Nova',
        'Hebron',
      ]);
      for (const platform of platformData) {
        expect(platform.generalThreatLevel).toBe(ThreatLevel.UNKNOWN);
        expect(platform.subsurfaceThreatLevel).toBe(ThreatLevel.UNKNOWN);
      }
    });

    it('uses the default network settings when no env override is set', () => {
      const { result } = renderAppState();

      expect(result.current.state.settings.networkSettings).toEqual({
        wsBaseUrl: 'ws://localhost:50000',
        photogrammetryApiUrl: '/photogrammetry-api',
        detectionApiUrl: '/detection-api',
      });
    });

    it('takes the video websocket URL from VITE_WS_SERVER_URL', () => {
      vi.stubEnv('VITE_WS_SERVER_URL', 'ws://rov.local:9000');

      const { result } = renderAppState();

      expect(result.current.state.settings.networkSettings.wsBaseUrl).toBe('ws://rov.local:9000');
    });
  });

  describe('toggleCamera', () => {
    it('toggles a copilot camera without touching the detection cameras', () => {
      const { result } = renderAppState(CAMERAS);

      act(() => {
        result.current.toggleCamera(2, COPILOT);
      });

      expect(result.current.state.camerasCopilot[2].enabled).toBe(true);
      expect(result.current.state.camerasDetection[2].enabled).toBe(false);

      act(() => {
        result.current.toggleCamera(2, COPILOT);
      });

      expect(result.current.state.camerasCopilot[2].enabled).toBe(false);
    });

    it('allows several copilot cameras to be enabled at once', () => {
      const { result } = renderAppState(CAMERAS);

      act(() => {
        result.current.toggleCamera(2, COPILOT);
        result.current.toggleCamera(3, COPILOT);
      });

      const enabled = Object.values(result.current.state.camerasCopilot).map((c) => c.enabled);
      expect(enabled).toEqual([true, true, true]);
    });

    it('enables only one detection camera at a time', () => {
      const { result } = renderAppState(CAMERAS);

      act(() => {
        result.current.toggleCamera(2, DETECTION);
      });

      expect(result.current.state.camerasDetection[1].enabled).toBe(false);
      expect(result.current.state.camerasDetection[2].enabled).toBe(true);
      expect(result.current.state.camerasDetection[3].enabled).toBe(false);
      // The copilot view keeps its own selection.
      expect(result.current.state.camerasCopilot[1].enabled).toBe(true);
    });

    it('can disable the enabled detection camera, leaving none enabled', () => {
      const { result } = renderAppState(CAMERAS);

      act(() => {
        result.current.toggleCamera(1, DETECTION);
      });

      const enabled = Object.values(result.current.state.camerasDetection).map((c) => c.enabled);
      expect(enabled).toEqual([false, false, false]);
    });

    it.each([
      ['copilot', COPILOT],
      ['detection', DETECTION],
    ])('ignores an unknown %s camera id', (_name, isCopilot) => {
      const { result } = renderAppState(CAMERAS);
      const before = result.current.state;

      act(() => {
        result.current.toggleCamera(99, isCopilot);
      });

      expect(result.current.state).toBe(before);
    });
  });

  describe('setCameraRecording', () => {
    it('marks a copilot camera as recording and back again', () => {
      const { result } = renderAppState(CAMERAS);

      act(() => {
        result.current.setCameraRecording(1, true, COPILOT);
      });

      expect(result.current.state.camerasCopilot[1].isRecording).toBe(true);
      expect(result.current.state.camerasDetection[1].isRecording).toBe(false);

      act(() => {
        result.current.setCameraRecording(1, false, COPILOT);
      });

      expect(result.current.state.camerasCopilot[1].isRecording).toBe(false);
    });

    it('marks a detection camera as recording without touching copilot', () => {
      const { result } = renderAppState(CAMERAS);

      act(() => {
        result.current.setCameraRecording(2, true, DETECTION);
      });

      expect(result.current.state.camerasDetection[2].isRecording).toBe(true);
      expect(result.current.state.camerasCopilot[2].isRecording).toBe(false);
    });

    it('ignores an unknown camera id', () => {
      const { result } = renderAppState(CAMERAS);
      const before = result.current.state;

      act(() => {
        result.current.setCameraRecording(99, true, COPILOT);
      });

      expect(result.current.state).toBe(before);
    });
  });

  describe('updateCameraStatus', () => {
    it('has no connection status until one is reported', () => {
      const { result } = renderAppState(CAMERAS);

      expect(result.current.state.camerasCopilot[1].connectionStatus).toBeUndefined();
    });

    it.each(['connecting', 'connected', 'failed', 'disconnected'] as const)(
      'stores the %s status on the copilot camera only',
      (status) => {
        const { result } = renderAppState(CAMERAS);

        act(() => {
          result.current.updateCameraStatus(1, status, COPILOT);
        });

        expect(result.current.state.camerasCopilot[1].connectionStatus).toBe(status);
        expect(result.current.state.camerasDetection[1].connectionStatus).toBeUndefined();
      },
    );

    it('stores the status on the detection camera only', () => {
      const { result } = renderAppState(CAMERAS);

      act(() => {
        result.current.updateCameraStatus(3, 'connected', DETECTION);
      });

      expect(result.current.state.camerasDetection[3].connectionStatus).toBe('connected');
      expect(result.current.state.camerasCopilot[3].connectionStatus).toBeUndefined();
    });

    it('keeps the enabled and recording flags of the camera', () => {
      const { result } = renderAppState(CAMERAS);

      act(() => {
        result.current.setCameraRecording(1, true, COPILOT);
        result.current.updateCameraStatus(1, 'connected', COPILOT);
      });

      expect(result.current.state.camerasCopilot[1]).toEqual({
        id: 1,
        enabled: true,
        isRecording: true,
        connectionStatus: 'connected',
      });
    });

    it('ignores an unknown camera id', () => {
      const { result } = renderAppState(CAMERAS);
      const before = result.current.state;

      act(() => {
        result.current.updateCameraStatus(99, 'connected', COPILOT);
      });

      expect(result.current.state).toBe(before);
    });
  });

  describe('canSelectMoreCameras', () => {
    it('always allows more copilot cameras', () => {
      const { result } = renderAppState(CAMERAS);

      act(() => {
        result.current.toggleCamera(2, COPILOT);
        result.current.toggleCamera(3, COPILOT);
      });

      expect(result.current.canSelectMoreCameras(COPILOT)).toBe(true);
    });

    it('allows a detection camera only while none is enabled', () => {
      // CAMERAS starts with camera 1 enabled by default.
      const { result } = renderAppState(CAMERAS);
      expect(result.current.canSelectMoreCameras(DETECTION)).toBe(false);

      act(() => {
        result.current.toggleCamera(1, DETECTION);
      });

      expect(result.current.canSelectMoreCameras(DETECTION)).toBe(true);
    });
  });

  describe('toggleTelemetry', () => {
    it('selects a field and reports success', () => {
      const { result } = renderAppState();

      const accepted = toggleTelemetry(result, 'depth', true, COPILOT);

      expect(accepted).toBe(true);
      expect(result.current.state.selectedTelemetryCopilot).toEqual(['depth']);
    });

    it('deselects a field that is already selected', () => {
      const { result } = renderAppState();
      toggleTelemetry(result, 'depth', true, COPILOT);

      const accepted = toggleTelemetry(result, 'depth', true, COPILOT);

      expect(accepted).toBe(true);
      expect(result.current.state.selectedTelemetryCopilot).toEqual([]);
    });

    it('keeps the copilot and telemetry page selections separate', () => {
      const { result } = renderAppState();

      toggleTelemetry(result, 'depth', true, COPILOT);
      toggleTelemetry(result, 'attitude_x', false, DETECTION);

      expect(result.current.state.selectedTelemetryCopilot).toEqual(['depth']);
      expect(result.current.state.selectedTelemetry).toEqual(['attitude_x']);
    });

    it('keeps fields in the order they were selected', () => {
      const { result } = renderAppState();

      toggleTelemetry(result, 'attitude_z', true, COPILOT);
      toggleTelemetry(result, 'depth', true, COPILOT);
      toggleTelemetry(result, 'attitude_x', true, COPILOT);

      expect(result.current.state.selectedTelemetryCopilot).toEqual([
        'attitude_z',
        'depth',
        'attitude_x',
      ]);
    });

    it('rejects a fourth selection when the maximum applies', () => {
      const { result } = renderAppState();
      toggleTelemetry(result, 'attitude_x', true, COPILOT);
      toggleTelemetry(result, 'attitude_y', true, COPILOT);
      toggleTelemetry(result, 'attitude_z', true, COPILOT);

      const accepted = toggleTelemetry(result, 'depth', true, COPILOT);

      expect(accepted).toBe(false);
      expect(result.current.state.selectedTelemetryCopilot).toEqual([
        'attitude_x',
        'attitude_y',
        'attitude_z',
      ]);
    });

    it('still allows deselecting when at the maximum', () => {
      const { result } = renderAppState();
      toggleTelemetry(result, 'attitude_x', true, COPILOT);
      toggleTelemetry(result, 'attitude_y', true, COPILOT);
      toggleTelemetry(result, 'attitude_z', true, COPILOT);

      const accepted = toggleTelemetry(result, 'attitude_y', true, COPILOT);

      expect(accepted).toBe(true);
      expect(result.current.state.selectedTelemetryCopilot).toEqual(['attitude_x', 'attitude_z']);
    });

    it('applies the maximum to the telemetry page too when asked', () => {
      const { result } = renderAppState();
      toggleTelemetry(result, 'attitude_x', true, DETECTION);
      toggleTelemetry(result, 'attitude_y', true, DETECTION);
      toggleTelemetry(result, 'attitude_z', true, DETECTION);

      const accepted = toggleTelemetry(result, 'depth', true, DETECTION);

      expect(accepted).toBe(false);
      expect(result.current.state.selectedTelemetry).toHaveLength(3);
    });

    it('lets the telemetry page exceed three fields when the maximum does not apply', () => {
      const { result } = renderAppState();
      toggleTelemetry(result, 'attitude_x', false, DETECTION);
      toggleTelemetry(result, 'attitude_y', false, DETECTION);
      toggleTelemetry(result, 'attitude_z', false, DETECTION);

      const accepted = toggleTelemetry(result, 'depth', false, DETECTION);

      expect(accepted).toBe(true);
      expect(result.current.state.selectedTelemetry).toEqual([
        'attitude_x',
        'attitude_y',
        'attitude_z',
        'depth',
      ]);
    });

    it('reports success for a fourth copilot field even though it is not added', () => {
      // Current behaviour: with maxApplies false the provider skips its own
      // limit check and returns true, but the reducer still caps copilot at 3.
      const { result } = renderAppState();
      toggleTelemetry(result, 'attitude_x', false, COPILOT);
      toggleTelemetry(result, 'attitude_y', false, COPILOT);
      toggleTelemetry(result, 'attitude_z', false, COPILOT);

      const accepted = toggleTelemetry(result, 'depth', false, COPILOT);

      expect(accepted).toBe(true);
      expect(result.current.state.selectedTelemetryCopilot).toEqual([
        'attitude_x',
        'attitude_y',
        'attitude_z',
      ]);
    });
  });

  describe('canSelectMoreTelemetry', () => {
    it('allows more copilot fields until three are selected', () => {
      const { result } = renderAppState();
      toggleTelemetry(result, 'attitude_x', true, COPILOT);
      toggleTelemetry(result, 'attitude_y', true, COPILOT);
      expect(result.current.canSelectMoreTelemetry(COPILOT)).toBe(true);

      toggleTelemetry(result, 'attitude_z', true, COPILOT);

      expect(result.current.canSelectMoreTelemetry(COPILOT)).toBe(false);
    });

    it('always allows more fields on the telemetry page', () => {
      const { result } = renderAppState();
      toggleTelemetry(result, 'attitude_x', false, DETECTION);
      toggleTelemetry(result, 'attitude_y', false, DETECTION);
      toggleTelemetry(result, 'attitude_z', false, DETECTION);
      toggleTelemetry(result, 'depth', false, DETECTION);

      expect(result.current.canSelectMoreTelemetry(DETECTION)).toBe(true);
    });
  });

  describe('setSidebarOpen', () => {
    it('closes and reopens the sidebar', () => {
      const { result } = renderAppState();

      act(() => {
        result.current.setSidebarOpen(false);
      });
      expect(result.current.state.sidebarOpen).toBe(false);

      act(() => {
        result.current.setSidebarOpen(true);
      });
      expect(result.current.state.sidebarOpen).toBe(true);
    });
  });

  describe('updateTelemetry', () => {
    it('stores the received telemetry', () => {
      const { result } = renderAppState();
      const payload = telemetry({ depth: point(3.2) });

      act(() => {
        result.current.updateTelemetry(payload);
      });

      expect(result.current.state.telemetry).toEqual({ depth: point(3.2) });
    });

    it('merges later payloads over earlier ones, keeping fields that were not resent', () => {
      const { result } = renderAppState();

      act(() => {
        result.current.updateTelemetry(
          telemetry({ depth: point(3.2), ambient_temperature: point(4, 'C') }),
        );
      });
      act(() => {
        result.current.updateTelemetry(telemetry({ depth: point(5.5) }));
      });

      expect(result.current.state.telemetry).toEqual({
        depth: point(5.5),
        ambient_temperature: point(4, 'C'),
      });
    });
  });

  describe('updateIcebergCalculationData', () => {
    it('replaces the iceberg inputs with the new values', () => {
      const { result } = renderAppState();
      const imageFile = new File(['img'], 'iceberg.jpg', { type: 'image/jpeg' });
      const next = {
        ...result.current.state.icebergCalculationData,
        icebergDepth: 120,
        icebergHeading: 45,
        icebergLatitude: 46.5,
        icebergLongitude: -48.5,
        imageFile,
      };

      act(() => {
        result.current.updateIcebergCalculationData(next);
      });

      expect(result.current.state.icebergCalculationData).toEqual(next);
      expect(result.current.state.icebergCalculationData.imageFile).toBe(imageFile);
    });

    it('stores updated platform threat levels', () => {
      const { result } = renderAppState();
      const current = result.current.state.icebergCalculationData;
      const platformData = current.platformData.map((platform) => ({
        ...platform,
        generalThreatLevel: ThreatLevel.RED,
      }));

      act(() => {
        result.current.updateIcebergCalculationData({ ...current, platformData });
      });

      const levels = result.current.state.icebergCalculationData.platformData.map(
        (platform) => platform.generalThreatLevel,
      );
      expect(levels).toEqual([ThreatLevel.RED, ThreatLevel.RED, ThreatLevel.RED, ThreatLevel.RED]);
    });
  });

  describe('updateFloatFile', () => {
    it('stores the uploaded csv file and can clear it again', () => {
      const { result } = renderAppState();
      const csvFile = new File(['1700000000,2.5'], 'float.csv', { type: 'text/csv' });

      act(() => {
        result.current.updateFloatFile({ csvFile });
      });
      expect(result.current.state.floatFile.csvFile).toBe(csvFile);

      act(() => {
        result.current.updateFloatFile({ csvFile: null });
      });
      expect(result.current.state.floatFile.csvFile).toBeNull();
    });
  });

  describe('updateCameraState', () => {
    // Current behaviour: the provider puts updateCameraState on the context
    // value, but it is missing from the AppStateContextValue type.
    type WithCameraInit = AppStateContextValue & {
      updateCameraState: (configs: CameraConfig[]) => void;
    };

    it('resets both camera maps to the defaults of the given configs', () => {
      const { result } = renderAppState(CAMERAS);
      act(() => {
        result.current.toggleCamera(2, COPILOT);
        result.current.setCameraRecording(2, true, COPILOT);
        result.current.toggleCamera(3, DETECTION);
      });

      act(() => {
        (result.current as WithCameraInit).updateCameraState(CAMERAS);
      });

      const expected = {
        1: { id: 1, enabled: true, isRecording: false, connectionStatus: 'disconnected' },
        2: { id: 2, enabled: false, isRecording: false, connectionStatus: 'disconnected' },
        3: { id: 3, enabled: false, isRecording: false, connectionStatus: 'disconnected' },
      };
      expect(result.current.state.camerasCopilot).toEqual(expected);
      expect(result.current.state.camerasDetection).toEqual(expected);
    });

    it('replaces the camera maps when given a different set of configs', () => {
      const { result } = renderAppState(CAMERAS);

      act(() => {
        (result.current as WithCameraInit).updateCameraState(OTHER_CAMERAS);
      });

      expect(Object.keys(result.current.state.camerasCopilot)).toEqual(['9']);
      expect(Object.keys(result.current.state.camerasDetection)).toEqual(['9']);
    });

    it('keeps the copilot and detection maps independent afterwards', () => {
      const { result } = renderAppState(CAMERAS);
      act(() => {
        (result.current as WithCameraInit).updateCameraState(CAMERAS);
      });

      act(() => {
        result.current.toggleCamera(2, COPILOT);
      });

      expect(result.current.state.camerasCopilot[2].enabled).toBe(true);
      expect(result.current.state.camerasDetection[2].enabled).toBe(false);
    });
  });

  describe('memoization', () => {
    it('returns the same context value when rerendered without a state change', () => {
      const { result, rerender } = renderAppState(CAMERAS);
      const first = result.current;

      rerender();

      expect(result.current).toBe(first);
    });

    it('keeps the action callbacks stable across state changes', () => {
      // MqttProvider and VideoStreamProvider depend on these identities in
      // their effects; a new function per update would re-run those effects.
      const { result } = renderAppState(CAMERAS);
      const first = result.current;

      act(() => {
        result.current.toggleCamera(2, COPILOT);
        result.current.updateTelemetry(telemetry({ depth: point(1) }));
        result.current.updateCameraStatus(1, 'connected', COPILOT);
      });

      expect(result.current).not.toBe(first);
      expect(result.current.toggleCamera).toBe(first.toggleCamera);
      expect(result.current.setCameraRecording).toBe(first.setCameraRecording);
      expect(result.current.updateCameraStatus).toBe(first.updateCameraStatus);
      expect(result.current.setSidebarOpen).toBe(first.setSidebarOpen);
      expect(result.current.updateTelemetry).toBe(first.updateTelemetry);
      expect(result.current.updateIcebergCalculationData).toBe(first.updateIcebergCalculationData);
      expect(result.current.updateFloatFile).toBe(first.updateFloatFile);
    });
  });

  describe('when the cameraConfigs prop changes after mount', () => {
    const CameraProbe = () => {
      const { state, copilotCameraConfigs } = useAppStateContext();

      return (
        <>
          <span data-testid="config-names">
            {copilotCameraConfigs.map((config) => config.name).join(',')}
          </span>
          <span data-testid="state-ids">{Object.keys(state.camerasCopilot).join(',')}</span>
        </>
      );
    };

    it('exposes the new configs but keeps the camera state from the first render', () => {
      // Current behaviour: camera state is only built once (lazy reducer init),
      // so it is not re-initialised for the new configs.
      const { rerender } = render(
        <AppStateProvider cameraConfigs={CAMERAS}>
          <CameraProbe />
        </AppStateProvider>,
      );

      rerender(
        <AppStateProvider cameraConfigs={OTHER_CAMERAS}>
          <CameraProbe />
        </AppStateProvider>,
      );

      expect(screen.getByTestId('config-names')).toHaveTextContent('Spare');
      expect(screen.getByTestId('state-ids')).toHaveTextContent('1,2,3');
    });
  });
});
