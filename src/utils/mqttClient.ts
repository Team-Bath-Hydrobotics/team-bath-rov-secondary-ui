import mqtt from 'mqtt';
import type { SessionConfig, TelemetryPayload } from '../types';

export const SESSION_CONFIG_TOPIC = 'session/config';

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

/**
 * Publish a session config to `session/config`. Retained so any
 * processor/db-writer that connects mid-session receives the latest
 * mapping. Resolves on broker ack, rejects on transport error.
 */
export function publishSessionConfig(config: SessionConfig): Promise<void> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(config);
    mqttClient.publish(SESSION_CONFIG_TOPIC, payload, { qos: 1, retain: true }, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
