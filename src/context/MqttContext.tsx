import { createContext, useContext } from 'react';

interface MqttContextType {
  connected: boolean;
}

export const MqttContext = createContext<MqttContextType | undefined>(undefined);

export const useMqttContext = () => {
  const context = useContext(MqttContext);
  if (!context) {
    throw new Error('useMqttContext must be used within MqttProvider');
  }
  return context;
};
