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
  { id: 'attitude_x', label: 'Roll', category: 'attitude' },
  { id: 'attitude_y', label: 'Pitch', category: 'attitude' },
  { id: 'attitude_z', label: 'Yaw', category: 'attitude' },

  // Angular velocity (how fast it's rotating)
  { id: 'angular_velocity_x', label: 'Angular Vel X', category: 'angular' },
  { id: 'angular_velocity_y', label: 'Angular Vel Y', category: 'angular' },
  { id: 'angular_velocity_z', label: 'Angular Vel Z', category: 'angular' },

  // Angular acceleration (how fast rotation is changing)
  { id: 'angular_acceleration_x', label: 'Angular Accel X', category: 'angular' },
  { id: 'angular_acceleration_y', label: 'Angular Accel Y', category: 'angular' },
  { id: 'angular_acceleration_z', label: 'Angular Accel Z', category: 'angular' },

  // Linear acceleration (how fast speed is changing)
  { id: 'acceleration_x', label: 'Accel X', category: 'linear' },
  { id: 'acceleration_y', label: 'Accel Y', category: 'linear' },
  { id: 'acceleration_z', label: 'Accel Z', category: 'linear' },

  // Linear velocity (movement speed)
  { id: 'velocity_x', label: 'Velocity X', category: 'linear' },
  { id: 'velocity_y', label: 'Velocity Y', category: 'linear' },
  { id: 'velocity_z', label: 'Velocity Z', category: 'linear' },

  // Environmental sensors
  { id: 'depth', label: 'Depth', category: 'environment' },
  { id: 'ambient_temperature', label: 'Water Temp', category: 'environment' },
  { id: 'internal_temperature', label: 'Internal Temp', category: 'environment' },
  { id: 'ambient_pressure', label: 'Pressure', category: 'environment' },
  { id: 'grove_water_sensor', label: 'Leak Sensor', category: 'environment' },

  // Actuators (thrusters)
  { id: 'actuator_1', label: 'Thruster 1', category: 'actuator' },
  { id: 'actuator_2', label: 'Thruster 2', category: 'actuator' },
  { id: 'actuator_3', label: 'Thruster 3', category: 'actuator' },
  { id: 'actuator_4', label: 'Thruster 4', category: 'actuator' },
  { id: 'actuator_5', label: 'Thruster 5', category: 'actuator' },
  { id: 'actuator_6', label: 'Thruster 6', category: 'actuator' },
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

export type TelemetryDataPoint = {
  value: number;
  unit: string;
  timestamp: number;
};
