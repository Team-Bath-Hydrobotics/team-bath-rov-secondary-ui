import type { CameraConfig } from '../camera.types';

/**
 * Default camera configurations for the ROV.
 *
 * These can be overridden by passing different configs to the CoPilotProvider.
 * The IDs should match what the video streaming system uses.
 */
export const DEFAULT_CAMERAS: CameraConfig[] = [
  {
    id: 1,
    name: 'Front Camera',
    streamId: 'camera-front',
    defaultEnabled: true,
  },
  {
    id: 2,
    name: 'Back Camera',
    streamId: 'camera-back',
    defaultEnabled: false,
  },
  {
    id: 3,
    name: 'Down Camera',
    streamId: 'camera-down',
    defaultEnabled: true,
  },
  {
    id: 4,
    name: 'Arm Camera',
    streamId: 'camera-arm',
    defaultEnabled: false,
  },
  {
    id: 5,
    name: 'Arm Camera 2',
    streamId: 'camera-arm-2',
    defaultEnabled: false,
  },
  {
    id: 6,
    name: 'Arm Camera 3',
    streamId: 'camera-arm-3',
    defaultEnabled: false,
  },
];
