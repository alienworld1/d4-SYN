import { useEffect, useState, useRef } from 'react';
import { useYellow } from './useYellow';

export interface TelemetryPoint {
  timestamp: number;
  latency: number;
  payment: number;
  isPenalty: boolean;
}

export function useTelemetry(bufferSize = 50) {
  const { eventBus } = useYellow();
  const [data, setData] = useState<TelemetryPoint[]>([]);
  
  // Initialize with zeroes so chart fills width immediately
  const bufferRef = useRef<TelemetryPoint[]>(Array(bufferSize).fill({
      timestamp: 0,
      latency: 0, 
      payment: 0,
      isPenalty: false
  }));

  // FPS Throttle state
  const lastUpdateRef = useRef(0);
  const FRAME_DURATION = 1000 / 15; // 15 FPS

  useEffect(() => {
    if (!eventBus) return;

    const handleUpdate = (e: Event) => {
       const customEvent = e as CustomEvent;
       const payload = customEvent.detail as TelemetryPoint;

       // Add to buffer immediately
       bufferRef.current.push(payload);
       if (bufferRef.current.length > bufferSize) {
           bufferRef.current.shift();
       }

       // Throttle React Updates
       const now = performance.now();
       if (now - lastUpdateRef.current > FRAME_DURATION) {
           setData([...bufferRef.current]);
           lastUpdateRef.current = now;
       }
    };

    eventBus.addEventListener('TELEMETRY_UPDATE', handleUpdate);

    return () => {
      eventBus.removeEventListener('TELEMETRY_UPDATE', handleUpdate);
    };
  }, [eventBus, bufferSize]);

  return data;
}
