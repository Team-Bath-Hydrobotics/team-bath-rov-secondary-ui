import type { TelemetryFieldMeta } from '../telemetry.types';

/**
 * All available telemetry fields with display metadata.
 *
 * These match the fields defined in rov_telemetry.schema.json
 * from the team-bath-rov-software repository.
 *
 * Grouped by category for easier navigation in the sidebar.
 */
export const TELEMETRY_FIELDS: TelemetryFieldMeta[] = [
  // Attitude (orientation in 3D space)
  { id: 'attitude_x', label: 'Roll', unit: 'deg', category: 'attitude' },
  { id: 'attitude_y', label: 'Pitch', unit: 'deg', category: 'attitude' },
  { id: 'attitude_z', label: 'Yaw', unit: 'deg', category: 'attitude' },

  // Angular velocity (how fast it's rotating)
  { id: 'angular_velocity_x', label: 'Angular Vel X', unit: 'rad/s', category: 'angular' },
  { id: 'angular_velocity_y', label: 'Angular Vel Y', unit: 'rad/s', category: 'angular' },
  { id: 'angular_velocity_z', label: 'Angular Vel Z', unit: 'rad/s', category: 'angular' },

  // Angular acceleration (how fast rotation is changing)
  { id: 'angular_acceleration_x', label: 'Angular Accel X', unit: 'rad/s²', category: 'angular' },
  { id: 'angular_acceleration_y', label: 'Angular Accel Y', unit: 'rad/s²', category: 'angular' },
  { id: 'angular_acceleration_z', label: 'Angular Accel Z', unit: 'rad/s²', category: 'angular' },

  // Linear acceleration (how fast speed is changing)
  { id: 'acceleration_x', label: 'Accel X', unit: 'm/s²', category: 'linear' },
  { id: 'acceleration_y', label: 'Accel Y', unit: 'm/s²', category: 'linear' },
  { id: 'acceleration_z', label: 'Accel Z', unit: 'm/s²', category: 'linear' },

  // Linear velocity (movement speed)
  { id: 'velocity_x', label: 'Velocity X', unit: 'm/s', category: 'linear' },
  { id: 'velocity_y', label: 'Velocity Y', unit: 'm/s', category: 'linear' },
  { id: 'velocity_z', label: 'Velocity Z', unit: 'm/s', category: 'linear' },

  // Environmental sensors
  { id: 'depth', label: 'Depth', unit: 'm', category: 'environment' },
  { id: 'ambient_temperature', label: 'Water Temp', unit: '°C', category: 'environment' },
  { id: 'internal_temperature', label: 'Internal Temp', unit: '°C', category: 'environment' },
  { id: 'ambient_pressure', label: 'Pressure', unit: 'Pa', category: 'environment' },
  { id: 'grove_water_sensor', label: 'Leak Sensor', unit: '', category: 'environment' },

  // Actuators (thrusters)
  { id: 'actuator_1', label: 'Thruster 1', unit: '%', category: 'actuator' },
  { id: 'actuator_2', label: 'Thruster 2', unit: '%', category: 'actuator' },
  { id: 'actuator_3', label: 'Thruster 3', unit: '%', category: 'actuator' },
  { id: 'actuator_4', label: 'Thruster 4', unit: '%', category: 'actuator' },
  { id: 'actuator_5', label: 'Thruster 5', unit: '%', category: 'actuator' },
  { id: 'actuator_6', label: 'Thruster 6', unit: '%', category: 'actuator' },
];

/**
 * Maximum number of telemetry fields that can be displayed at once.
 * This limit keeps the UI manageable and performant.
 */
export const MAX_TELEMETRY_SELECTIONS = 3;

/**
 * Human-readable labels for telemetry categories.
 * Used in the sidebar to group related fields.
 */
export const TELEMETRY_CATEGORY_LABELS: Record<string, string> = {
  attitude: 'Attitude',
  angular: 'Angular Motion',
  linear: 'Linear Motion',
  environment: 'Environment',
  actuator: 'Actuators',
};
