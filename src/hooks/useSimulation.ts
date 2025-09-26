import { useState, useEffect, useCallback, useRef } from 'react';
import { SimulationService } from '@/services/simulation.service';
import { useData } from '@/lib/data-context';
import type { SimulationState, SimulationConfig } from '@/types/emergency';

export interface SimulationEvent {
  type: string;
  data: any;
  timestamp: string;
}

export function useSimulation() {
  const { monitoringStations, authorities, resources } = useData();
  
  const [state, setState] = useState<SimulationState>({
    currentTime: '2025-05-17T06:00:00Z',
    isRunning: false,
    speed: 1,
    phase: 'detection'
  });
  
  const [events, setEvents] = useState<SimulationEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const simulationRef = useRef<SimulationService | null>(null);

  // Initialize services
  useEffect(() => {
    if (!simulationRef.current) {
      simulationRef.current = new SimulationService();
      
      // Set up event listeners
      simulationRef.current.on('simulation_started', (data) => {
        setState(data);
        addEvent('simulation_started', data);
      });
      
      simulationRef.current.on('simulation_paused', (data) => {
        setState(data);
        addEvent('simulation_paused', data);
      });
      
      simulationRef.current.on('simulation_stopped', (data) => {
        setState(data);
        addEvent('simulation_stopped', data);
      });
      
      simulationRef.current.on('time_advanced', (data) => {
        setState(prev => ({ ...prev, ...data }));
      });
      
      simulationRef.current.on('sensor_alert', (data) => {
        addEvent('sensor_alert', data);
      });
      
      simulationRef.current.on('authority_status_changed', (data) => {
        addEvent('authority_status_changed', data);
      });
      
      simulationRef.current.on('resource_deployed', (data) => {
        addEvent('resource_deployed', data);
      });
      
      simulationRef.current.on('evacuation_started', (data) => {
        addEvent('evacuation_started', data);
      });
      
      simulationRef.current.on('livestock_evacuation_started', (data) => {
        addEvent('livestock_evacuation_started', data);
      });
      
      simulationRef.current.on('disaster_event', (data) => {
        addEvent('disaster_event', data);
      });
      
    }
    
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, []);

  // Set data when available
  useEffect(() => {
    if (simulationRef.current && monitoringStations.length > 0 && authorities.length > 0 && resources.length > 0) {
      simulationRef.current.setData({
        monitoringStations,
        authorities,
        resources
      });
    }
  }, [monitoringStations, authorities, resources]);

  const addEvent = useCallback((type: string, data: any) => {
    const event: SimulationEvent = {
      type,
      data,
      timestamp: new Date().toISOString()
    };
    
    setEvents(prev => [...prev.slice(-99), event]); // Keep last 100 events
  }, []);

  // Simulation controls
  const start = useCallback(() => {
    if (simulationRef.current) {
      simulationRef.current.start();
    }
  }, []);

  const pause = useCallback(() => {
    if (simulationRef.current) {
      simulationRef.current.pause();
    }
  }, []);

  const stop = useCallback(() => {
    if (simulationRef.current) {
      simulationRef.current.stop();
    }
  }, []);

  const setSpeed = useCallback((speed: number) => {
    if (simulationRef.current) {
      simulationRef.current.setSpeed(speed);
    }
  }, []);

  const setTime = useCallback((time: string) => {
    if (simulationRef.current) {
      simulationRef.current.setTime(time);
    }
  }, []);

  // Data is now automatically loaded from the data context

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // Utility functions
  const formatTime = useCallback((time: string) => {
    if (!simulationRef.current) return time;
    return simulationRef.current.formatTime(time);
  }, []);

  const getTimeProgress = useCallback(() => {
    if (!simulationRef.current) return 0;
    return simulationRef.current.getTimeProgress();
  }, []);

  const getConfig = useCallback((): SimulationConfig | null => {
    if (!simulationRef.current) return null;
    return simulationRef.current.getConfig();
  }, []);

  return {
    // State
    state,
    events,
    isLoading,
    error,
    
    // Controls
    start,
    pause,
    stop,
    setSpeed,
    setTime,
    
    // Data operations
    clearEvents,
    
    // Utilities
    formatTime,
    getTimeProgress,
    getConfig,
    
    // Services (for advanced usage)
    simulationService: simulationRef.current
  };
}
