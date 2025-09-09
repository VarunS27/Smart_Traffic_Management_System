import { useState, useEffect, useRef } from 'react';
import { getState, getMetrics } from './api';

// Mock data generator for when backend is not available
class MockTrafficSimulator {
  constructor() {
    this.cars = {
      N: [], S: [], E: [], W: []
    };
    this.carIdCounter = 0;
    this.currentSignal = 'NS'; // NS = North-South green, EW = East-West green
    this.signalTimer = 0;
    this.signalDuration = 30; // seconds
    this.totalCarsPassed = 0;
    this.metrics = {
      waitTimes: [],
      throughputHistory: [],
      queueHistory: []
    };
    this.isRunning = false;
  }

  start() {
    this.isRunning = true;
  }

  stop() {
    this.isRunning = false;
  }

  // Spawn new cars randomly
  spawnCar() {
    if (Math.random() < 0.3) { // 30% chance per tick
      const lanes = ['N', 'S', 'E', 'W'];
      const lane = lanes[Math.floor(Math.random() * lanes.length)];
      
      this.cars[lane].push({
        id: this.carIdCounter++,
        position: 0,
        speed: 2 + Math.random() * 2, // 2-4 units per tick
        waitTime: 0,
        spawned: Date.now()
      });
    }
  }

  // Update simulation state
  tick() {
    if (!this.isRunning) return;

    // Spawn new cars
    this.spawnCar();

    // Update signal timing
    this.signalTimer += 1;
    if (this.signalTimer >= this.signalDuration) {
      this.currentSignal = this.currentSignal === 'NS' ? 'EW' : 'NS';
      this.signalTimer = 0;
    }

    // Move cars based on signal state
    ['N', 'S', 'E', 'W'].forEach(lane => {
      const isGreen = (lane === 'N' || lane === 'S') ? 
        this.currentSignal === 'NS' : 
        this.currentSignal === 'EW';

      this.cars[lane] = this.cars[lane].map(car => {
        // If green light and no car blocking, move forward
        if (isGreen && car.position < 90) {
          return {
            ...car,
            position: Math.min(100, car.position + car.speed)
          };
        }
        
        // If red light or blocked, increment wait time
        if (!isGreen || car.position >= 90) {
          return {
            ...car,
            waitTime: car.waitTime + 1
          };
        }

        return car;
      });

      // Remove cars that passed through intersection
      const passedCars = this.cars[lane].filter(car => car.position >= 100);
      this.cars[lane] = this.cars[lane].filter(car => car.position < 100);
      
      // Track metrics for passed cars
      passedCars.forEach(car => {
        this.totalCarsPassed++;
        this.metrics.waitTimes.push(car.waitTime);
        if (this.metrics.waitTimes.length > 100) {
          this.metrics.waitTimes.shift();
        }
      });
    });

    // Update throughput history
    this.metrics.throughputHistory.push({
      timestamp: Date.now(),
      throughput: this.calculateThroughput()
    });
    if (this.metrics.throughputHistory.length > 60) {
      this.metrics.throughputHistory.shift();
    }

    // Update queue history
    this.metrics.queueHistory.push({
      timestamp: Date.now(),
      queues: {
        N: this.cars.N.length,
        S: this.cars.S.length,
        E: this.cars.E.length,
        W: this.cars.W.length
      }
    });
    if (this.metrics.queueHistory.length > 60) {
      this.metrics.queueHistory.shift();
    }
  }

  calculateThroughput() {
    const lastMinute = this.metrics.throughputHistory.filter(
      entry => Date.now() - entry.timestamp < 60000
    );
    return lastMinute.length > 0 ? 
      lastMinute.reduce((sum, entry) => sum + entry.throughput, 0) / lastMinute.length :
      0;
  }

  calculateAvgWaitTime() {
    if (this.metrics.waitTimes.length === 0) return 0;
    return this.metrics.waitTimes.reduce((sum, time) => sum + time, 0) / this.metrics.waitTimes.length;
  }

  getState() {
    return {
      signal: this.currentSignal,
      queues: {
        N: this.cars.N.length,
        S: this.cars.S.length,
        E: this.cars.E.length,
        W: this.cars.W.length
      },
      cars: this.cars,
      cars_passed: this.totalCarsPassed,
      avg_wait_time: this.calculateAvgWaitTime(),
      signal_timer: this.signalTimer,
      signal_duration: this.signalDuration
    };
  }

  getMetrics() {
    return {
      total_cars: this.totalCarsPassed,
      avg_trip_time: this.calculateAvgWaitTime() * 0.5, // Mock calculation
      throughput: this.calculateThroughput(),
      queue_history: this.metrics.queueHistory.slice(-20),
      wait_time_history: this.metrics.waitTimes.slice(-20).map((time, index) => ({
        time: index,
        wait_time: time
      }))
    };
  }
}

// Create singleton mock simulator
const mockSimulator = new MockTrafficSimulator();

export function useTrafficData(pollInterval = 1000) {
  const [state, setState] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [useMock, setUseMock] = useState(true);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  
  const intervalRef = useRef(null);
  const mockIntervalRef = useRef(null);

  // Mock simulation ticker
  useEffect(() => {
    if (useMock) {
      mockSimulator.start();
      
      const mockTick = () => {
        mockSimulator.tick();
        setState(mockSimulator.getState());
        setMetrics(mockSimulator.getMetrics());
        setLoading(false);
        setError(null);
      };

      // Initial tick
      mockTick();

      // Set up interval based on simulation speed
      mockIntervalRef.current = setInterval(mockTick, Math.max(100, 500 / simulationSpeed));

      return () => {
        if (mockIntervalRef.current) {
          clearInterval(mockIntervalRef.current);
        }
        mockSimulator.stop();
      };
    }
  }, [useMock, simulationSpeed]);

  // Real API polling
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

      // Initial fetch
      fetchData();

      // Set up polling interval
      intervalRef.current = setInterval(fetchData, pollInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [useMock, pollInterval]);

  // Control functions
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
      mockSimulator.cars = { N: [], S: [], E: [], W: [] };
      mockSimulator.carIdCounter = 0;
      mockSimulator.totalCarsPassed = 0;
      mockSimulator.metrics = {
        waitTimes: [],
        throughputHistory: [],
        queueHistory: []
      };
    }
  };

  return {
    state,
    metrics,
    loading: useMock ? false : loading,
    error,
    useMock,
    simulationSpeed,
    switchToMock,
    switchToBackend,
    setSpeed,
    resetSimulation
  };
}