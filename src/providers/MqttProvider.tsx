// src/providers/MqttProvider.tsx
import { type ReactNode, useEffect, useRef, useState, useMemo } from 'react';
import { MqttContext } from '../context/MqttContext';
import { mqttClient } from '../utils/mqttClient';
import { useAppStateContext } from '../context/AppStateContext';
import type { TelemetryPayload } from '../types';
import { isValidTelemetry } from '../utils/mqttClient';

interface MqttProviderProps {
  children: ReactNode;
}

/**
 * Provides MQTT connectivity and telemetry updates to the app.
 * - Dispatches telemetry updates into AppStateProvider at frame rate
 * - Exposes connection status in context
 */
export const MqttProvider = ({ children }: MqttProviderProps) => {
  const { updateTelemetry } = useAppStateContext(); // Use action instead of raw dispatch
  const latestTelemetry = useRef<TelemetryPayload | null>(null);
  const scheduled = useRef(false);

  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Send a telemetry update at most once per animation frame
    const handleMessage = (_: string, payload: Uint8Array) => {
      const parsedData = JSON.parse(payload.toString()) as TelemetryPayload;
      // Skip malformed packets
      if (!isValidTelemetry(parsedData)) {
        console.warn('[MqttProvider] Received invalid telemetry payload:', parsedData);
        return;
      }
      latestTelemetry.current = parsedData;

      if (!scheduled.current) {
        scheduled.current = true;
        requestAnimationFrame(() => {
          if (latestTelemetry.current) {
            updateTelemetry(latestTelemetry.current);
          }
          scheduled.current = false;
        });
      }
    };

    const handleConnect = () => setConnected(true);
    const handleClose = () => setConnected(false);

    mqttClient.subscribe('hydrobotics/rov/<rov_id>/telemetry');

    mqttClient.on('message', handleMessage);
    mqttClient.on('connect', handleConnect);
    mqttClient.on('close', handleClose);

    return () => {
      mqttClient.off('message', handleMessage);
      mqttClient.off('connect', handleConnect);
      mqttClient.off('close', handleClose);
      mqttClient.unsubscribe('rov/telemetry');
    };
  }, [updateTelemetry]);

  const contextValue = useMemo(() => ({ connected }), [connected]);

  return <MqttContext.Provider value={contextValue}>{children}</MqttContext.Provider>;
};
