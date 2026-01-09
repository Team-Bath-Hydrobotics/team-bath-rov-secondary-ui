import mqtt from 'mqtt';
import type { TelemetryPayload } from '../types';

export const mqttClient = mqtt.connect(import.meta.env.VITE_MQTT_TLS_WEBSOCKET_URL, {
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

// Validate telemetry payload structure
export function isValidTelemetry(payload: unknown): payload is TelemetryPayload {
  if (typeof payload !== 'object' || payload === null) return false;

  const p = payload as Record<string, unknown>;

  // Check required top-level fields
  if (typeof p.id !== 'string' || typeof p.timestamp !== 'number') {
    return false;
  }

  // Check that all other fields (except id and timestamp) are valid telemetry fields
  for (const [key, value] of Object.entries(p)) {
    if (key === 'id' || key === 'timestamp') continue;
    if (!isValidTelemetryField(value)) {
      console.warn(`Invalid telemetry field: ${key}`, value);
      return false;
    }
  }

  return true;
}
