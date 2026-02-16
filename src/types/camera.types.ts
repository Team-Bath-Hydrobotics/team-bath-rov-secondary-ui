/**
 * Camera type definitions for the CoPilot page.
 *
 * These types define the structure of camera configuration and state,
 * allowing us to manage multiple cameras with different settings.
 */

/**
 * Configuration for a single camera.
 * This is the "blueprint" - what properties a camera CAN have.
 */
export interface CameraConfig {
  /** Unique identifier for the camera (e.g., 'front', 'back', 'camera-1') */
  id: number;

  /** Human-readable name displayed in the UI */
  name: string;

  /** Optional stream identifier for connecting to video source later */
  streamId?: string;

  /** Whether this camera should be enabled when the page first loads */
  defaultEnabled: boolean;
}

/**
 * Runtime state for a single camera.
 * This tracks what's happening with the camera RIGHT NOW.
 */
export interface CameraState {
  /** Matches the id from CameraConfig */
  id: number;

  /** Is this camera currently visible in the grid? */
  enabled: boolean;

  /** Is this camera currently recording? */
  isRecording: boolean;

  /** Connection status for the camera stream */
  connectionStatus?: 'connecting' | 'connected' | 'failed' | 'disconnected';
}

/**
 * A map of camera IDs to their states.
 *
 * Record<number, CameraState> means:
 * - Keys are numbers (camera IDs)
 * - Values are CameraState objects
 *
 * Example:
 * {
 *   1: { id: 1, enabled: true, isRecording: false, connectionStatus: 'connected' },
 *   2: { id: 2, enabled: false, isRecording: false, connectionStatus: 'disconnected' }
 * }
 */
export type CameraStateMap = Record<number, CameraState>;
