import mqtt from 'mqtt';
import type { TelemetryPayload } from '../types';

const host = import.meta.env.VITE_MQTT_HOST;
const port = import.meta.env.VITE_MQTT_PORT;
const brokerUrl = `wss://${host}:${port}/mqtt`;

export const mqttClient = mqtt.connect(brokerUrl, {
  username: import.meta.env.VITE_MQTT_USERNAME,
  password: import.meta.env.VITE_MQTT_PASSWORD,
});

// Minimal type checking for telemetry payload
function isValidTelemetryField(
  field: unknown,
): field is { value: number; unit: string; timestamp: number } {
  if (typeof field !== 'object' || field === null) return false;
  const f = field as Record<string, unknown>;
  return (
    typeof f.value === 'number' && typeof f.unit === 'string' && typeof f.timestamp === 'number'
  );
}

// Check if field is a string value (for fields like cardinal_direction)
function isValidStringField(field: unknown): field is string {
  return typeof field === 'string';
}

// Validate telemetry payload structure
export function isValidTelemetry(payload: unknown): payload is TelemetryPayload {
  if (typeof payload !== 'object' || payload === null) return false;

  const p = payload as Record<string, unknown>;

  // Check required top-level fields
  if (typeof p.id !== 'string' || typeof p.timestamp !== 'number') {
    return false;
  }

  for (const [key, value] of Object.entries(p)) {
    if (key === 'id' || key === 'timestamp') continue;

    if (key === 'cardinal_direction') {
      if (!isValidStringField(value)) {
        console.warn(`Invalid telemetry field: ${key}`, value);
        return false;
      }
      continue;
    }

    if (!isValidTelemetryField(value)) {
      console.warn(`Invalid telemetry field: ${key}`, value);
      return false;
    }
  }

  return true;
}
