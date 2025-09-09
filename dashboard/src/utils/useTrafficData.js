import { useState, useEffect, useRef } from 'react';
import { getState, getMetrics } from './api';

// Mock data generator for when backend is not available
class MockTrafficSimulator {
  constructor() {
    this.cars = {
      N: [], S: [], E: [], W: []
    };
    this.carIdCounter = 0;
    this.currentSignal = 'N'; // Only one direction at a time: N, S, E, or W
    this.signalTimer = 0;
    this.signalDuration = 25; // seconds per direction
    this.totalCarsPassed = 0;
    this.emergencyVehicles = [];
    this.emergencyActive = false;
    this.emergencyDirection = null;
    this.metrics = {
      waitTimes: [],
      throughputHistory: [],
      queueHistory: []
    };
    this.isRunning = false;
    this.signalSequence = ['N', 'E', 'S', 'W']; // Clockwise rotation
    this.currentSignalIndex = 0;
  }

  start() {
    this.isRunning = true;
  }

  stop() {
    this.isRunning = false;
  }

  // Spawn new cars randomly including emergency vehicles
  spawnCar() {
    if (Math.random() < 0.4) { // 40% chance per tick
      const lanes = ['N', 'S', 'E', 'W'];
      const lane = lanes[Math.floor(Math.random() * lanes.length)];
      
      // Emergency vehicle spawn chance (2% for ambulance, 1% for police, 1% for fire)
      let carType = 'normal';
      const emergencyRand = Math.random();
      if (emergencyRand < 0.02) {
        carType = 'ambulance';
      } else if (emergencyRand < 0.03) {
        carType = 'police';
      } else if (emergencyRand < 0.04) {
        carType = 'fire';
      }

      const newCar = {
        id: this.carIdCounter++,
        position: 0,
        speed: carType === 'normal' ? 2 + Math.random() * 2 : 3 + Math.random() * 2, // Emergency vehicles faster
        waitTime: 0,
        spawned: Date.now(),
        type: carType
      };

      this.cars[lane].push(newCar);

      // Handle emergency vehicle priority
      if (carType !== 'normal') {
        this.handleEmergencyVehicle(lane, carType);
      }
    }
  }

  handleEmergencyVehicle(lane, type) {
    // Ambulance has highest priority, then fire, then police
    const priority = type === 'ambulance' ? 3 : type === 'fire' ? 2 : 1;
    
    if (!this.emergencyActive || priority > (this.getCurrentEmergencyPriority() || 0)) {
      this.emergencyActive = true;
      this.emergencyDirection = lane;
      this.currentSignal = lane;
      this.signalTimer = 0; // Reset timer to give emergency vehicle time
      console.log(`Emergency ${type} detected in lane ${lane}! Switching signal...`);
    }
  }

  getCurrentEmergencyPriority() {
    const emergencyTypes = ['ambulance', 'fire', 'police'];
    let maxPriority = 0;
    
    ['N', 'S', 'E', 'W'].forEach(lane => {
      this.cars[lane].forEach(car => {
        if (car.type !== 'normal') {
          const priority = car.type === 'ambulance' ? 3 : car.type === 'fire' ? 2 : 1;
          maxPriority = Math.max(maxPriority, priority);
        }
      });
    });
    
    return maxPriority;
  }

  checkEmergencyVehiclesPassed() {
    if (this.emergencyActive) {
      const hasEmergencyInDirection = this.cars[this.emergencyDirection]?.some(car => car.type !== 'normal');
      if (!hasEmergencyInDirection) {
        this.emergencyActive = false;
        this.emergencyDirection = null;
        console.log('Emergency vehicles cleared, returning to normal operation');
      }
    }
  }

  // Update simulation state
  tick() {
    if (!this.isRunning) return;

    // Spawn new cars
    this.spawnCar();

    // Update signal timing (only if no emergency)
    if (!this.emergencyActive) {
      this.signalTimer += 1;
      if (this.signalTimer >= this.signalDuration) {
        // Move to next signal in sequence
        this.currentSignalIndex = (this.currentSignalIndex + 1) % this.signalSequence.length;
        this.currentSignal = this.signalSequence[this.currentSignalIndex];
        this.signalTimer = 0;
      }
    }

    // Move cars based on signal state
    ['N', 'S', 'E', 'W'].forEach(lane => {
      const isGreen = this.currentSignal === lane;
      
      this.cars[lane] = this.cars[lane].map((car, index) => {
        // Check if car is blocked by car in front
        const carInFront = this.cars[lane][index - 1];
        const isBlocked = carInFront && (car.position + 8 >= carInFront.position);
        
        // If green light and not blocked, move forward
        if (isGreen && !isBlocked && car.position < 95) {
          return {
            ...car,
            position: Math.min(100, car.position + car.speed)
          };
        }
        
        // If red light or blocked, increment wait time
        if (!isGreen || isBlocked) {
          return {
            ...car,
            waitTime: car.waitTime + 1
          };
        }

        return car;
      });

      // Remove cars that passed through intersection (position >= 100)
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

    // Check if emergency vehicles have passed
    this.checkEmergencyVehiclesPassed();

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
    const recentHistory = this.metrics.throughputHistory.filter(
      entry => Date.now() - entry.timestamp < 60000
    );
    return recentHistory.length > 0 ? 
      this.totalCarsPassed / Math.max(1, recentHistory.length / 60) :
      0;
  }

  calculateAvgWaitTime() {
    if (this.metrics.waitTimes.length === 0) return 0;
    return this.metrics.waitTimes.reduce((sum, time) => sum + time, 0) / this.metrics.waitTimes.length;
  }

  getState() {
    return {
      signal: this.currentSignal,
      emergencyActive: this.emergencyActive,
      emergencyDirection: this.emergencyDirection,
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
      avg_trip_time: this.calculateAvgWaitTime() * 0.5,
      throughput: this.calculateThroughput(),
      queue_history: this.metrics.queueHistory.slice(-20),
      wait_time_history: this.metrics.waitTimes.slice(-20).map((time, index) => ({
        time: index,
        wait_time: time
      })),
      emergency_count: Object.values(this.cars).flat().filter(car => car.type !== 'normal').length
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

      fetchData();
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
      mockSimulator.emergencyActive = false;
      mockSimulator.emergencyDirection = null;
      mockSimulator.currentSignal = 'N';
      mockSimulator.currentSignalIndex = 0;
      mockSimulator.signalTimer = 0;
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