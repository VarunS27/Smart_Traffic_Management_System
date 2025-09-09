import { useState, useEffect, useRef } from 'react';
import { getState, getMetrics } from './api';

// Mock data generator for when backend is not available
class MockTrafficSimulator {
  constructor() {
    this.cars = {
      N: [], S: [], E: [], W: []
    };
    this.carIdCounter = 0;
    this.currentSignal = 'N';
    this.signalTimer = 0;
    this.signalDuration = 25; // Will be dynamic based on queue
    this.totalCarsPassed = 0;
    this.emergencyVehicleCount = 0;
    this.emergencyCooldown = 0;
    this.emergencyActive = false;
    this.emergencyDirection = null;
    this.metrics = {
      waitTimes: [],
      throughputHistory: [],
      queueHistory: [],
      fuelSaved: 0,
      timeSaved: 0,
      costSaved: 0
    };
    this.isRunning = false;
    this.signalSequence = ['N', 'E', 'S', 'W'];
    this.currentSignalIndex = 0;
    // Smart timing parameters
    this.minSignalTime = 8; // Minimum signal duration
    this.maxSignalTime = 60; // Maximum signal duration
    this.baseTimePerCar = 2; // Seconds per car
    this.lastQueueCounts = { N: 0, S: 0, E: 0, W: 0 };
    this.totalFuelSaved = 0;
    this.totalCostSaved = 0;
  }

  start() {
    this.isRunning = true;
  }

  stop() {
    this.isRunning = false;
  }

  // Calculate dynamic signal duration based on queue length
  calculateSignalDuration(queueLength) {
    if (queueLength === 0) return this.minSignalTime;
    
    // Base calculation: 2 seconds per car + buffer time
    let duration = this.minSignalTime + (queueLength * this.baseTimePerCar);
    
    // Apply limits
    duration = Math.max(this.minSignalTime, Math.min(this.maxSignalTime, duration));
    
    return Math.floor(duration);
  }

  // Find the lane with highest queue for intelligent switching
  getHighestQueueLane() {
    const queues = {
      N: this.cars.N.length,
      S: this.cars.S.length,
      E: this.cars.E.length,
      W: this.cars.W.length
    };

    // Don't switch if current lane still has significant queue and time remaining
    const currentQueueSize = queues[this.currentSignal];
    const timeRemaining = this.signalDuration - this.signalTimer;
    
    if (currentQueueSize > 3 && timeRemaining > 5 && !this.emergencyActive) {
      return this.currentSignal; // Keep current signal
    }

    // Find lane with maximum queue
    let maxQueue = 0;
    let bestLane = this.currentSignal;
    
    Object.entries(queues).forEach(([lane, count]) => {
      if (count > maxQueue) {
        maxQueue = count;
        bestLane = lane;
      }
    });

    // Only switch if the difference is significant (at least 2 more cars)
    if (maxQueue >= queues[this.currentSignal] + 2) {
      return bestLane;
    }

    return this.currentSignal;
  }

  // Spawn new cars with realistic Mumbai traffic patterns
  spawnCar() {
    // Vary spawn rates based on time simulation (peak vs off-peak)
    const baseSpawnRate = 0.40; // 40% base chance
    const spawnChance = Math.random() < baseSpawnRate;
    
    if (spawnChance) {
      // Mumbai traffic patterns - more traffic from certain directions during peak
      const laneWeights = { N: 0.3, S: 0.25, E: 0.25, W: 0.2 }; // Weighted probabilities
      const rand = Math.random();
      let cumulativeWeight = 0;
      let selectedLane = 'N';
      
      for (const [lane, weight] of Object.entries(laneWeights)) {
        cumulativeWeight += weight;
        if (rand <= cumulativeWeight) {
          selectedLane = lane;
          break;
        }
      }
      
      let carType = 'normal';
      
      // Limited emergency vehicle spawning
      if (this.emergencyVehicleCount < 4 && this.emergencyCooldown <= 0) {
        const emergencyRand = Math.random();
        
        if (emergencyRand < 0.0008) { // 0.08% for ambulance
          carType = 'ambulance';
          this.emergencyVehicleCount++;
          this.emergencyCooldown = 300; // Longer cooldown
        } else if (emergencyRand < 0.0012) { // 0.04% for fire
          carType = 'fire';
          this.emergencyVehicleCount++;
          this.emergencyCooldown = 250;
        } else if (emergencyRand < 0.0015) { // 0.03% for police
          carType = 'police';
          this.emergencyVehicleCount++;
          this.emergencyCooldown = 200;
        }
      }

      const newCar = {
        id: this.carIdCounter++,
        position: 0,
        speed: carType === 'normal' ? 2.8 + Math.random() * 1.2 : 4.0 + Math.random() * 1.0,
        waitTime: 0,
        spawned: Date.now(),
        type: carType,
        hasPassedIntersection: false,
        fuelConsumed: 0 // Track fuel consumption while waiting
      };

      this.cars[selectedLane].push(newCar);

      if (carType !== 'normal') {
        this.handleEmergencyVehicle(selectedLane, carType);
      }
    }

    if (this.emergencyCooldown > 0) {
      this.emergencyCooldown--;
    }
  }

  handleEmergencyVehicle(lane, type) {
    const priority = type === 'ambulance' ? 3 : type === 'fire' ? 2 : 1;
    
    if (!this.emergencyActive || priority > (this.getCurrentEmergencyPriority() || 0)) {
      this.emergencyActive = true;
      this.emergencyDirection = lane;
      this.currentSignal = lane;
      this.signalTimer = 0;
      // Emergency vehicles get priority duration
      this.signalDuration = Math.min(30, this.calculateSignalDuration(this.cars[lane].length));
      console.log(`Emergency ${type} detected in lane ${lane}! Signal duration: ${this.signalDuration}s`);
    }
  }

  getCurrentEmergencyPriority() {
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
        console.log('Emergency vehicles cleared, returning to intelligent operation');
      }
    }
  }

  // Update simulation state with intelligent signal management
  tick() {
    if (!this.isRunning) return;

    this.spawnCar();

    // Intelligent signal timing
    if (!this.emergencyActive) {
      this.signalTimer += 1;
      
      // Check if we should switch signals based on queue analysis
      if (this.signalTimer >= this.signalDuration) {
        const bestLane = this.getHighestQueueLane();
        
        if (bestLane !== this.currentSignal) {
          this.currentSignal = bestLane;
        } else {
          // Move to next in sequence if no clear priority
          this.currentSignalIndex = (this.currentSignalIndex + 1) % this.signalSequence.length;
          this.currentSignal = this.signalSequence[this.currentSignalIndex];
        }
        
        // Set new dynamic duration based on queue
        this.signalDuration = this.calculateSignalDuration(this.cars[this.currentSignal].length);
        this.signalTimer = 0;
        
        console.log(`Switched to ${this.currentSignal} for ${this.signalDuration}s (${this.cars[this.currentSignal].length} cars waiting)`);
      }
    }

    // Move cars and calculate fuel savings
    ['N', 'S', 'E', 'W'].forEach(lane => {
      const isGreen = this.currentSignal === lane;
      
      this.cars[lane] = this.cars[lane].map((car, index) => {
        const carInFront = this.cars[lane][index - 1];
        const isBlocked = carInFront && (car.position + 8 >= carInFront.position);
        
        const intersectionStart = 45;
        const intersectionEnd = 55;
        const isInIntersection = car.position >= intersectionStart && car.position <= intersectionEnd;
        
        if (car.position >= intersectionStart && !car.hasPassedIntersection) {
          car.hasPassedIntersection = true;
        }
        
        const shouldMove = 
          isInIntersection || 
          car.hasPassedIntersection || 
          (isGreen && !isBlocked);
          
        const shouldStop = 
          !isGreen && 
          !isInIntersection && 
          !car.hasPassedIntersection && 
          car.position < intersectionStart;
        
        if (shouldMove && car.position < 120) {
          return {
            ...car,
            position: Math.min(120, car.position + car.speed)
          };
        }
        
        if (shouldStop || isBlocked) {
          // Calculate fuel consumption while waiting (0.8L per hour = 0.00022L per second)
          const fuelConsumedThisTick = 0.00022; // liters per second
          car.fuelConsumed += fuelConsumedThisTick;
          
          return {
            ...car,
            waitTime: car.waitTime + 1,
            fuelConsumed: car.fuelConsumed
          };
        }

        return car;
      });

      // Remove cars that have completely passed
      const passedCars = this.cars[lane].filter(car => car.position >= 120);
      this.cars[lane] = this.cars[lane].filter(car => car.position < 120);
      
      // Calculate savings for passed cars
      passedCars.forEach(car => {
        this.totalCarsPassed++;
        this.metrics.waitTimes.push(car.waitTime);
        
        // Calculate fuel and cost savings compared to traditional system
        const traditionalWaitTime = 45; // Mumbai average wait time in seconds
        const actualWaitTime = car.waitTime;
        const timeSaved = Math.max(0, traditionalWaitTime - actualWaitTime);
        const fuelSaved = (timeSaved * 0.00022); // liters saved
        const costSaved = fuelSaved * 105; // INR saved (fuel cost)
        
        this.totalFuelSaved += fuelSaved;
        this.totalCostSaved += costSaved;
        
        if (car.type !== 'normal') {
          this.emergencyVehicleCount = Math.max(0, this.emergencyVehicleCount - 1);
        }
        
        if (this.metrics.waitTimes.length > 100) {
          this.metrics.waitTimes.shift();
        }
      });
    });

    // Store current queue counts for analysis
    this.lastQueueCounts = {
      N: this.cars.N.length,
      S: this.cars.S.length,
      E: this.cars.E.length,
      W: this.cars.W.length
    };

    this.checkEmergencyVehiclesPassed();

    // Update metrics
    this.updateMetrics();
  }

  updateMetrics() {
    this.metrics.throughputHistory.push({
      timestamp: Date.now(),
      throughput: this.calculateThroughput()
    });
    if (this.metrics.throughputHistory.length > 60) {
      this.metrics.throughputHistory.shift();
    }

    this.metrics.queueHistory.push({
      timestamp: Date.now(),
      queues: { ...this.lastQueueCounts }
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
      queues: { ...this.lastQueueCounts },
      cars: this.cars,
      cars_passed: this.totalCarsPassed,
      avg_wait_time: this.calculateAvgWaitTime(),
      signal_timer: this.signalTimer,
      signal_duration: this.signalDuration,
      intelligent_mode: true,
      total_fuel_saved: this.totalFuelSaved,
      total_cost_saved: this.totalCostSaved
    };
  }

  getMetrics() {
    const currentThroughput = this.calculateThroughput();
    const avgWaitTime = this.calculateAvgWaitTime();
    
    return {
      total_cars: this.totalCarsPassed,
      avg_trip_time: avgWaitTime * 0.5,
      throughput: currentThroughput,
      queue_history: this.metrics.queueHistory.slice(-20),
      wait_time_history: this.metrics.waitTimes.slice(-20).map((time, index) => ({
        time: index,
        wait_time: time
      })),
      emergency_count: Object.values(this.cars).flat().filter(car => car.type !== 'normal').length,
      fuel_saved_total: this.totalFuelSaved,
      cost_saved_total: this.totalCostSaved,
      efficiency_improvement: Math.max(0, ((45 - avgWaitTime) / 45) * 100) // Percentage improvement
    };
  }

  resetSimulation() {
    this.cars = { N: [], S: [], E: [], W: [] };
    this.carIdCounter = 0;
    this.totalCarsPassed = 0;
    this.emergencyVehicleCount = 0;
    this.emergencyCooldown = 0;
    this.emergencyActive = false;
    this.emergencyDirection = null;
    this.currentSignal = 'N';
    this.currentSignalIndex = 0;
    this.signalTimer = 0;
    this.signalDuration = 25;
    this.totalFuelSaved = 0;
    this.totalCostSaved = 0;
    this.lastQueueCounts = { N: 0, S: 0, E: 0, W: 0 };
    this.metrics = {
      waitTimes: [],
      throughputHistory: [],
      queueHistory: [],
      fuelSaved: 0,
      timeSaved: 0,
      costSaved: 0
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

      mockTick();
      mockIntervalRef.current = setInterval(mockTick, Math.max(100, 500 / simulationSpeed));

      return () => {
        if (mockIntervalRef.current) {
          clearInterval(mockIntervalRef.current);
        }
        mockSimulator.stop();
      };
    }
  }, [useMock, simulationSpeed]);

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
      mockSimulator.resetSimulation();
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