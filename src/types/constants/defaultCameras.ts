import type { CameraConfig } from '../camera.types';

/**
 * Default camera configurations for the ROV.
 *
 * These can be overridden by passing different configs to the CoPilotProvider.
 * The IDs should match what the video streaming system uses.
 */
export const DEFAULT_CAMERAS: CameraConfig[] = [
  {
    id: 'front',
    name: 'Front Camera',
    streamId: 'camera-front',
    defaultEnabled: true,
  },
  {
    id: 'back',
    name: 'Back Camera',
    streamId: 'camera-back',
    defaultEnabled: false,
  },
  {
    id: 'down',
    name: 'Down Camera',
    streamId: 'camera-down',
    defaultEnabled: true,
  },
  {
    id: 'arm',
    name: 'Arm Camera',
    streamId: 'camera-arm',
    defaultEnabled: false,
  },
];
