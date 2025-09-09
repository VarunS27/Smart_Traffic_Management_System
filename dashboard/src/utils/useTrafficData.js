  import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { TRAFFIC_CONSTANTS } from './constants';
import { VehicleManager } from './VehicleManager';
import { SignalManager } from './SignalManager';
import { getState, getMetrics } from './api';

export function useTrafficData() {
  const [state, setState] = useState({
    cars: { N: [], S: [], E: [], W: [] },
    cars_passed: 0,
    avg_wait_time: 0,
    queues: { N: 0, S: 0, E: 0, W: 0 },
    signal: 'N',
    signal_timer: 0,
    signal_duration: 30,
    emergencyActive: false,
    emergencyDirection: null
  });

  const [metrics, setMetrics] = useState({
    throughput: 0,
    emergency_count: 0,
    wait_times: [],
    historical_queues: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [useMock, setUseMock] = useState(true);
  const [simulationSpeed, setSimulationSpeed] = useState(1);

  const vehicleManager = useMemo(() => new VehicleManager(), []);
  const signalManager = useMemo(() => new SignalManager(), []);
  
  const intervalRef = useRef(null);
  const mockIntervalRef = useRef(null);

  const simulationTick = useCallback(() => {
    const emergencyVehicle = vehicleManager.spawnCar(signalManager.currentSignal);
    
    if (emergencyVehicle) {
      signalManager.handleEmergencyVehicle(emergencyVehicle);
    }

    signalManager.updateSignal(vehicleManager.getQueueLengths());
    vehicleManager.updateVehicles(signalManager.currentSignal);
    
    setState(vehicleManager.getState());
    setMetrics(vehicleManager.getMetrics());
  }, [vehicleManager, signalManager]);

  useEffect(() => {
    if (useMock) {
      try {
        vehicleManager.start();
        
        const mockTick = () => {
          simulationTick();
          setLoading(false);
          setError(null);
        };

        mockTick();
        mockIntervalRef.current = setInterval(
          mockTick, 
          Math.max(100, 500 / simulationSpeed)
        );

        return () => {
          if (mockIntervalRef.current) {
            clearInterval(mockIntervalRef.current);
          }
          vehicleManager.stop();
        };
      } catch (err) {
        setError(`Simulation error: ${err.message}`);
        setLoading(false);
      }
    }
  }, [useMock, simulationSpeed, simulationTick, vehicleManager]);

  useEffect(() => {
    if (!useMock) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const [stateData, metricsData] = await Promise.all([
            getState(),
            getMetrics()
          ]);
          
          setState(stateData);
          setMetrics(metricsData);
          setError(null);
        } catch (err) {
          console.warn('Backend not available, switching to mock mode:', err.message);
          setUseMock(true);
          setError(`Backend connection failed: ${err.message}`);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
      intervalRef.current = setInterval(fetchData, TRAFFIC_CONSTANTS.POLL_INTERVAL);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [useMock]);

  const switchToMock = () => {
    setUseMock(true);
    setError(null);
  };

  const switchToBackend = () => {
    setUseMock(false);
  };

  const setSpeed = (speed) => {
    setSimulationSpeed(Math.max(0.1, Math.min(5, speed)));
  };

  const resetSimulation = () => {
    if (useMock) {
      vehicleManager.reset();
      signalManager.reset();
    }
  };

  return {
    state,
    metrics,
    loading: useMock ? false : loading,
    error,
    useMock,
    simulationSpeed,
    switchToMock: useCallback(() => setUseMock(true), []),
    switchToBackend: useCallback(() => setUseMock(false), []),
    setSpeed: useCallback((speed) => 
      setSimulationSpeed(Math.max(0.1, Math.min(5, speed))), []),
    resetSimulation: useCallback(() => {
      if (useMock) {
        vehicleManager.reset();
        signalManager.reset();
      }
    }, [useMock, vehicleManager, signalManager])
  };
}