/**
 * Telemetry type definitions matching the rov_telemetry.schema.json
 *
 * These types ensure we only use valid telemetry field names throughout
 * the application. If you typo a field name, TypeScript will catch it!
 */

/**
 * All valid telemetry field identifiers.
 *
 * This is a "union type" - TelemetryFieldId can ONLY be one of these exact strings.
 * TypeScript will error if you try to use 'depht' (typo) instead of 'depth'.
 *
 * Grouped by category for readability:
 * - Attitude: Roll, Pitch, Yaw (orientation in 3D space)
 * - Angular: Rotation speeds and accelerations
 * - Linear: Movement speeds and accelerations
 * - Environment: Sensors measuring the surroundings
 * - Actuators: Motor/thruster states
 */
export type TelemetryFieldId =
  // Attitude (orientation angles in degrees)
  | 'attitude_x' // Roll
  | 'attitude_y' // Pitch
  | 'attitude_z' // Yaw
  // Angular velocity (rotation speed in rad/s)
  | 'angular_velocity_x'
  | 'angular_velocity_y'
  | 'angular_velocity_z'
  // Angular acceleration (rotation acceleration in rad/s²)
  | 'angular_acceleration_x'
  | 'angular_acceleration_y'
  | 'angular_acceleration_z'
  // Linear acceleration (movement acceleration in m/s²)
  | 'acceleration_x'
  | 'acceleration_y'
  | 'acceleration_z'
  // Linear velocity (movement speed in m/s)
  | 'velocity_x'
  | 'velocity_y'
  | 'velocity_z'
  // Environmental sensors
  | 'depth'
  | 'ambient_temperature'
  | 'internal_temperature'
  | 'ambient_pressure'
  | 'grove_water_sensor'
  | 'cardinal_direction'
  // Actuators (thrusters, 6 total)
  | 'actuator_1'
  | 'actuator_2'
  | 'actuator_3'
  | 'actuator_4'
  | 'actuator_5'
  | 'actuator_6';

/**
 * Categories for grouping telemetry fields in the UI sidebar.
 * Makes it easier for users to find related sensors.
 */
export type TelemetryCategory = 'attitude' | 'angular' | 'linear' | 'environment' | 'actuator';

/**
 * Metadata about a telemetry field.
 * Contains display information for the UI.
 */
export interface TelemetryFieldMeta {
  /** The field identifier (must match TelemetryFieldId) */
  id: TelemetryFieldId;

  /** Human-readable label for display (e.g., "Depth", "Roll Angle") */
  label: string;

  /** Category for grouping in the sidebar */
  category: TelemetryCategory;
}

/**
 * State for telemetry selection.
 * Tracks which fields the user has chosen to display.
 */
export interface TelemetrySelectionState {
  /** Array of selected field IDs (maximum 3) */
  selectedFields: TelemetryFieldId[];

  /** Maximum number of fields that can be selected */
  maxSelections: number;
}
