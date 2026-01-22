import { useContext } from 'react';
import { MqttContext } from '../context/MqttContext';
export const useMqtt = () => useContext(MqttContext);
