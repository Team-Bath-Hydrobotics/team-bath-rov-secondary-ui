import { expect, test } from 'vitest';
import { AppStateReducer } from './AppStateReducer';
import type { AppState, AppStateAction, TelemetryPayload } from '../types/AppState';
import type { IcebergCalculationData } from '../types/platform.type';

// placeholder telemetry reading
const point = { value: 0, unit: '', timestamp: 0 };

// creates an app state for each test. Most fields are required by AppState even when tests dont use them
const createState = (): AppState => ({
  // one disabled camera so the camera tests can toggle it
  camerasCopilot: {
    1: { id: 1, enabled: false, isRecording: false },
  },
  camerasDetection: {},
  selectedTelemetryCopilot: [],
  selectedTelemetry: [],
  sidebarOpen: false,
  telemetry: {
    attitude_x: point,
    attitude_y: point,
    attitude_z: point,
    angular_velocity_x: point,
    angular_velocity_y: point,
    angular_velocity_z: point,
    angular_acceleration_x: point,
    angular_acceleration_y: point,
    angular_acceleration_z: point,
    acceleration_x: point,
    acceleration_y: point,
    acceleration_z: point,
    velocity_x: point,
    velocity_y: point,
    velocity_z: point,
    depth: point,
    ambient_temperature: point,
    internal_temperature: point,
    ambient_pressure: point,
    grove_water_sensor: point,
    cardinal_direction: point,
    actuator_1: point,
    actuator_2: point,
    actuator_3: point,
    actuator_4: point,
    actuator_5: point,
    actuator_6: point,
  },
  icebergCalculationData: {
    icebergDepth: 0,
    icebergHeading: 0,
    icebergLatitude: 0,
    icebergLongitude: 0,
    platformData: [],
    imageFile: null,
  },
  floatFile: { csvFile: null },
  settings: {
    networkSettings: {
      wsBaseUrl: 'ws://localhost:50000',
      photogrammetryApiUrl: '/photogrammetry-api',
      detectionApiUrl: '/detection-api',
    },
  },
});

// sidebar tests //

test('closes the sidebar ', () => {
  const state: AppState = {
    ...createState(),
    sidebarOpen: true,
  };
  const result = AppStateReducer(state, {
    type: 'SET_SIDEBAR_OPEN',
    open: false,
  });
  expect(result.sidebarOpen).toBe(false);
});

test('opens the sidebar ', () => {
  const state = createState();

  const result = AppStateReducer(state, {
    type: 'SET_SIDEBAR_OPEN',
    open: true,
  });
  expect(result.sidebarOpen).toBe(true);
});

// camera toggling tests //

test('enables copilot camera ', () => {
  const state = createState();

  const result = AppStateReducer(state, {
    type: 'TOGGLE_CAMERA',
    cameraId: 1,
    isCopilot: true,
  });
  expect(result.camerasCopilot[1].enabled).toBe(true);
});

// enabling a detection camera disables the others
test('enables a detection camera ', () => {
  const state: AppState = {
    ...createState(),
    camerasDetection: {
      1: { id: 1, enabled: true, isRecording: false },
      2: { id: 2, enabled: false, isRecording: false },
    },
  };
  const result = AppStateReducer(state, {
    type: 'TOGGLE_CAMERA',
    cameraId: 2,
    isCopilot: false,
  });
  expect(result.camerasDetection[1].enabled).toBe(false);
  expect(state.camerasDetection[1].enabled).toBe(true);
  expect(result.camerasDetection[2].enabled).toBe(true);
});

// disabling a detection camera doesnt affect the others
test('disables a detection camera ', () => {
  const state: AppState = {
    ...createState(),
    camerasDetection: {
      1: { id: 1, enabled: true, isRecording: false },
      2: { id: 2, enabled: false, isRecording: false },
    },
  };
  const result = AppStateReducer(state, {
    type: 'TOGGLE_CAMERA',
    cameraId: 1,
    isCopilot: false,
  });
  expect(result.camerasDetection[1].enabled).toBe(false);
  expect(result.camerasDetection[2]).toBe(state.camerasDetection[2]);
});

// toggling a copilot camera twice turns it back off
test('toggles copilot camera twice ', () => {
  const state: AppState = createState();

  const action = { type: 'TOGGLE_CAMERA', cameraId: 1, isCopilot: true } as const;
  const result = AppStateReducer(AppStateReducer(state, action), action);

  expect(result.camerasCopilot[1].enabled).toBe(false);
});

// more than one copilot camera can be enabled at once
test('enables multiple copilot cameras ', () => {
  const state: AppState = {
    ...createState(),
    camerasCopilot: {
      1: { id: 1, enabled: true, isRecording: false },
      2: { id: 2, enabled: false, isRecording: false },
    },
  };

  const result = AppStateReducer(state, {
    type: 'TOGGLE_CAMERA',
    cameraId: 2,
    isCopilot: true,
  });
  expect(result.camerasCopilot[1].enabled).toBe(true);
  expect(result.camerasCopilot[2].enabled).toBe(true);
});

// unknown cameraIDs return the same state object
test('ignores toggling an unknown camera ', () => {
  const state: AppState = createState();

  const result = AppStateReducer(state, {
    type: 'TOGGLE_CAMERA',
    cameraId: 2, // doesnt exist in the defined app state above
    isCopilot: false,
  });
  expect(result).toBe(state);
});

// telemetry selection tests //

// selecting an unselected field adds it to the list
test('selects a telemetry field ', () => {
  const state = createState();

  const result = AppStateReducer(state, {
    type: 'TOGGLE_TELEMETRY',
    fieldId: 'depth',
    isCopilot: true,
  });
  expect(result.selectedTelemetryCopilot).toEqual(['depth']);
});

// selecting an already selected field removes it
test('deselects a telemetry field ', () => {
  const state: AppState = {
    ...createState(),
    selectedTelemetryCopilot: ['depth'],
  };

  const result = AppStateReducer(state, {
    type: 'TOGGLE_TELEMETRY',
    fieldId: 'depth',
    isCopilot: true,
  });
  expect(result.selectedTelemetryCopilot).toEqual([]);
});

// copilot can only have 3 MAX_TELEMETRY_SELECTIONS fields selected
test('ignores a 4th copilot telemetry selection ', () => {
  const state: AppState = {
    ...createState(),
    selectedTelemetryCopilot: ['attitude_x', 'attitude_y', 'attitude_z'],
  };

  const result = AppStateReducer(state, {
    type: 'TOGGLE_TELEMETRY',
    fieldId: 'depth',
    isCopilot: true,
  });
  expect(result).toBe(state);
});

// deselecting still works when 3 fields (the maximum) are selected
test('deselects a copilot telemetry field at the limit ', () => {
  const state: AppState = {
    ...createState(),
    selectedTelemetryCopilot: ['attitude_x', 'attitude_y', 'attitude_z'],
  };

  const result = AppStateReducer(state, {
    type: 'TOGGLE_TELEMETRY',
    fieldId: 'attitude_y',
    isCopilot: true,
  });
  expect(result.selectedTelemetryCopilot).toEqual(['attitude_x', 'attitude_z']);
});

// the non-copilot list has no limit
test('allows more than 3 non-copilot telemetry selections ', () => {
  const state: AppState = {
    ...createState(),
    selectedTelemetry: ['attitude_x', 'attitude_y', 'attitude_z'],
  };

  const result = AppStateReducer(state, {
    type: 'TOGGLE_TELEMETRY',
    fieldId: 'depth',
    isCopilot: false,
  });
  expect(result.selectedTelemetry).toEqual(['attitude_x', 'attitude_y', 'attitude_z', 'depth']);
});

// isCopilot is optional and defaults to the non-copilot list when isCopilot is left out
test('updates selectedTelemetry when isCopilot is left out ', () => {
  const state = createState();

  const result = AppStateReducer(state, {
    type: 'TOGGLE_TELEMETRY',
    fieldId: 'depth',
  });
  expect(result.selectedTelemetry).toEqual(['depth']);
  expect(result.selectedTelemetryCopilot).toEqual([]);
});

// camera setup tests //

test('initializes cameras from configs ', () => {
  const state = createState();

  const result = AppStateReducer(state, {
    type: 'INITIALIZE_CAMERAS',
    configs: [
      { id: 1, name: 'Front', defaultEnabled: true },
      { id: 2, name: 'Back', defaultEnabled: false },
    ],
  });
  const expected = {
    1: { id: 1, enabled: true, isRecording: false, connectionStatus: 'disconnected' },
    2: { id: 2, enabled: false, isRecording: false, connectionStatus: 'disconnected' },
  };
  expect(result.camerasCopilot).toEqual(expected);
  expect(result.camerasDetection).toEqual(expected);
});

// the two maps must not share camera objects, or changing one would change the other
test('initializes separate copilot and detection camera objects ', () => {
  const state = createState();

  const result = AppStateReducer(state, {
    type: 'INITIALIZE_CAMERAS',
    configs: [{ id: 1, name: 'Front', defaultEnabled: true }],
  });
  expect(result.camerasCopilot[1]).not.toBe(result.camerasDetection[1]);
});

// camera recording tests //

// isCopilot: true updates the copilot map and leaves the detection map alone
test('sets recording on a copilot camera ', () => {
  const state = createState();

  const result = AppStateReducer(state, {
    type: 'SET_CAMERA_RECORDING',
    cameraId: 1,
    isRecording: true,
    isCopilot: true,
  });
  expect(result.camerasCopilot[1].isRecording).toBe(true);
  expect(result.camerasDetection).toBe(state.camerasDetection);
});

// isCopilot: false updates the detection map and leaves the copilot map alone
test('sets recording on a detection camera ', () => {
  const state: AppState = {
    ...createState(),
    camerasDetection: {
      1: { id: 1, enabled: true, isRecording: false },
    },
  };

  const result = AppStateReducer(state, {
    type: 'SET_CAMERA_RECORDING',
    cameraId: 1,
    isRecording: true,
    isCopilot: false,
  });
  expect(result.camerasDetection[1].isRecording).toBe(true);
  expect(result.camerasCopilot).toBe(state.camerasCopilot);
});

// unknown cameraIDs return the same state object
test('ignores recording on an unknown camera ', () => {
  const state = createState();

  const result = AppStateReducer(state, {
    type: 'SET_CAMERA_RECORDING',
    cameraId: 2, // doesnt exist in the defined app state above
    isRecording: true,
    isCopilot: true,
  });
  expect(result).toBe(state);
});

// camera connection tests //

// isCopilot: true updates the copilot map and leaves the detection map alone
test('updates the status of a copilot camera ', () => {
  const state = createState();

  const result = AppStateReducer(state, {
    type: 'UPDATE_CAMERA_STATUS',
    cameraId: 1,
    connectionStatus: 'connected',
    isCopilot: true,
  });
  expect(result.camerasCopilot[1].connectionStatus).toBe('connected');
  expect(result.camerasDetection).toBe(state.camerasDetection);
});

// isCopilot: false updates the detection map and leaves the copilot map alone
test('updates the status of a detection camera', () => {
  const state: AppState = {
    ...createState(),
    camerasDetection: {
      1: { id: 1, enabled: true, isRecording: false },
    },
  };

  const result = AppStateReducer(state, {
    type: 'UPDATE_CAMERA_STATUS',
    cameraId: 1,
    connectionStatus: 'failed',
    isCopilot: false,
  });
  expect(result.camerasDetection[1].connectionStatus).toBe('failed');
  expect(result.camerasCopilot).toBe(state.camerasCopilot);
});

// unknown cameraIDs return the same state object
test('ignores a status update for an unknown camera ', () => {
  const state = createState();

  const result = AppStateReducer(state, {
    type: 'UPDATE_CAMERA_STATUS',
    cameraId: 2, // doesnt exist in the defined app state above
    connectionStatus: 'connected',
    isCopilot: true,
  });
  expect(result).toBe(state);
});

//telemetry data tests //

// a partial update only changes the fields it includes
test('merges a partial telemetry update ', () => {
  const state = createState();
  const newDepth = { value: 12.5, unit: 'm', timestamp: 1000 };

  const result = AppStateReducer(state, {
    type: 'UPDATE_TELEMETRY',
    // the type expects every field, but the reducer merges partial updates
    payload: { depth: newDepth } as TelemetryPayload,
  });
  expect(result.telemetry.depth).toEqual(newDepth);
  expect(result.telemetry.attitude_x).toBe(state.telemetry.attitude_x);
});

// iceberg data test //

// a partial update only changes the fields it includes
test('merges a partial iceberg data update ', () => {
  const state = createState();

  const result = AppStateReducer(state, {
    type: 'UPDATE_ICEBERG_DATA',
    // the type expects every field, but the reducer merges partial updates
    icebergCalculationData: { icebergDepth: 25 } as IcebergCalculationData,
  });
  expect(result.icebergCalculationData.icebergDepth).toBe(25);
  expect(result.icebergCalculationData.icebergHeading).toBe(0);
});

// float file test //

test('replaces the float file ', () => {
  const state = createState();
  const file = new File(['time,depth'], 'float.csv', { type: 'text/csv' });

  const result = AppStateReducer(state, {
    type: 'UPDATE_FLOAT_FILE',
    file: { csvFile: file },
  });
  expect(result.floatFile.csvFile).toBe(file);
});

// unknown action test //

// action types the reducer doesn't handle return the same state object
test('ignores an unknown action type ', () => {
  const state = createState();

  // the cast is needed because TypeScript won't allow an action type that doesn't exist
  const result = AppStateReducer(state, { type: 'NOT_REAL' } as unknown as AppStateAction);
  expect(result).toBe(state);
});
