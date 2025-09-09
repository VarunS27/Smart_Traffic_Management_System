import { useState, useEffect, useRef } from 'react';
import { getState, getMetrics } from './api';

// Enhanced Mumbai Traffic Simulator with Realistic Wait Time Management
class MockTrafficSimulator {
  constructor() {
    this.cars = {
      N: [], S: [], E: [], W: []
    };
    this.carIdCounter = 0;
    this.currentSignal = 'N';
    this.signalTimer = 0;
    this.signalDuration = 35; // Increased for Mumbai conditions
    this.totalCarsPassed = 0;
    this.emergencyVehicleCount = 0;
    this.emergencyCooldown = 0;
    this.emergencyActive = false;
    this.emergencyDirection = null;
    this.emergencyVehicleId = null;
    
    // Enhanced emergency management - reduced frequency for Mumbai
    this.postEmergencyMode = false;
    this.postEmergencyTimer = 0;
    this.postEmergencyRotation = ['N', 'W', 'S', 'E'];
    this.postEmergencyIndex = 0;
    this.preEmergencyQueues = { N: 0, S: 0, E: 0, W: 0 };
    this.emergencyStartTime = null;
    
    // Mumbai-specific wait time tracking
    this.recentWaitTimes = []; // Last 50 cars for rolling average
    this.historicalWaitTimes = []; // For trend analysis
    this.systemEfficiency = 85; // Start at 85% efficiency (realistic)
    this.traditionalSystemWaitTime = 45; // Mumbai average wait time
    this.targetWaitTime = 32.5; // Target: 30-35 seconds (average 32.5)
    this.currentAvgWaitTime = 35; // Start with current Mumbai average
    
    this.metrics = {
      waitTimes: [],
      throughputHistory: [],
      queueHistory: [],
      efficiencyHistory: [],
      fuelSaved: 0,
      timeSaved: 0,
      costSaved: 0
    };
    
    this.isRunning = false;
    this.signalSequence = ['N', 'E', 'S', 'W'];
    this.currentSignalIndex = 0;
    
    // Mumbai-adapted timing parameters
    this.minSignalTime = 15; // Minimum 15 seconds for heavy traffic
    this.maxSignalTime = 60; // Maximum 90 seconds for extreme congestion
    this.baseTimePerCar = 2.5; // Slightly longer per car due to Mumbai traffic
    this.lastQueueCounts = { N: 0, S: 0, E: 0, W: 0 };
    this.totalFuelSaved = 0;
    this.totalCostSaved = 0;
    this.emptyRoadThreshold = 0;
    this.minSignalTimeForEmpty = 8; // Even empty roads need some time
    
    // Performance tracking
    this.tickCount = 0;
    this.lastEfficiencyUpdate = 0;
    this.consecutiveGoodDecisions = 0;
    this.consecutiveBadDecisions = 0;
    
    // Mumbai traffic improvement metrics
    this.improvementPercentage = 0; // Track improvement over traditional system
    this.totalTimeSavedPerHour = 0;
    this.totalFuelSavedPerHour = 0;
  }

  start() {
    this.isRunning = true;
  }

  stop() {
    this.isRunning = false;
  }

  // Enhanced empty road detection
  isRoadEmpty(direction) {
    const queueCount = this.cars[direction].length;
    return queueCount <= this.emptyRoadThreshold;
  }

  // Get all empty roads
  getEmptyRoads() {
    return ['N', 'S', 'E', 'W'].filter(direction => this.isRoadEmpty(direction));
  }

  // Get roads with traffic
  getRoadsWithTraffic() {
    return ['N', 'S', 'E', 'W'].filter(direction => !this.isRoadEmpty(direction));
  }

  // Mumbai-specific signal duration calculation
  calculateSignalDuration(queueLength, isEmpty = false) {
    if (isEmpty) {
      return this.minSignalTimeForEmpty;
    }
    
    if (queueLength === 0) return this.minSignalTime;
    
    // Mumbai-adapted calculation for heavy traffic
    let duration = this.minSignalTime + (queueLength * this.baseTimePerCar);
    
    // Efficiency modifier - AI optimization reduces time needed
    const efficiencyModifier = this.systemEfficiency / 100;
    duration = duration * (2.2 - efficiencyModifier); // More conservative for Mumbai
    
    // Heavy congestion adjustments (common in Mumbai)
    if (queueLength > 12) {
      duration += 10; // Extra time for very heavy congestion
    } else if (queueLength > 8) {
      duration += 5; // Extra time for heavy congestion
    }
    
    // Rush hour simulation
    const timeOfDay = (Date.now() / 1000) % 86400;
    const isRushHour = (timeOfDay >= 28800 && timeOfDay <= 36000) || // 8 AM - 10 AM
                       (timeOfDay >= 64800 && timeOfDay <= 72000);    // 6 PM - 8 PM
    
    if (isRushHour) {
      duration *= 1.2; // 20% longer during rush hour
    }
    
    duration = Math.max(this.minSignalTime, Math.min(this.maxSignalTime, duration));
    
    return Math.floor(duration);
  }

  // Enhanced lane selection with Mumbai traffic patterns
  getHighestQueueLane() {
    const roadsWithTraffic = this.getRoadsWithTraffic();
    
    if (roadsWithTraffic.length === 0) {
      return this.currentSignal;
    }

    const queues = {};
    roadsWithTraffic.forEach(direction => {
      queues[direction] = this.cars[direction].length;
    });

    // Current lane analysis
    const currentQueueSize = this.cars[this.currentSignal].length;
    const timeRemaining = this.signalDuration - this.signalTimer;
    
    // Don't switch if current lane is still productive (conservative for Mumbai)
    if (currentQueueSize > 5 && timeRemaining > 8 && !this.emergencyActive && roadsWithTraffic.includes(this.currentSignal)) {
      return this.currentSignal;
    }

    // Find optimal lane switch with Mumbai-specific logic
    let maxQueue = 0;
    let bestLane = roadsWithTraffic[0] || this.currentSignal;
    
    Object.entries(queues).forEach(([lane, count]) => {
      // Priority to heavily congested lanes (Mumbai-specific)
      const adjustedCount = count > 10 ? count * 1.5 : count;
      if (adjustedCount > maxQueue) {
        maxQueue = count; // Use original count for duration calculation
        bestLane = lane;
      }
    });

    // Decision quality tracking
    const currentQueue = this.cars[this.currentSignal].length;
    const switchBenefit = maxQueue - currentQueue;
    
    if (switchBenefit >= 3) { // Higher threshold for Mumbai
      this.consecutiveGoodDecisions++;
      this.consecutiveBadDecisions = 0;
      return bestLane;
    } else if (switchBenefit < 0) {
      this.consecutiveBadDecisions++;
      this.consecutiveGoodDecisions = Math.max(0, this.consecutiveGoodDecisions - 1);
    }

    return this.currentSignal;
  }

  // Reduced emergency vehicle handling (max 3-4 at a time)
  handleEmergencyVehicle(lane, type) {
    const priority = type === 'ambulance' ? 3 : type === 'fire' ? 2 : 1;
    
    if (!this.emergencyActive || priority > (this.getCurrentEmergencyPriority() || 0)) {
      console.log(`🚨 Emergency ${type} detected in lane ${lane}!`);
      
      this.preEmergencyQueues = { ...this.lastQueueCounts };
      this.emergencyStartTime = Date.now();
      
      const emergencyVehicle = this.cars[lane].find(car => car.type === type);
      this.emergencyVehicleId = emergencyVehicle ? emergencyVehicle.id : null;
      
      this.emergencyActive = true;
      this.emergencyDirection = lane;
      this.currentSignal = lane;
      this.signalTimer = 0;
      this.signalDuration = Math.min(45, this.calculateSignalDuration(this.cars[lane].length));
      
      // Emergency mode affects efficiency but less severely
      this.systemEfficiency = Math.max(75, this.systemEfficiency - 8);
      
      console.log(`Emergency signal activated: ${lane} for ${this.signalDuration}s`);
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

  // Enhanced emergency vehicle clearance detection
  checkEmergencyVehiclesPassed() {
    if (this.emergencyActive && this.emergencyDirection && this.emergencyVehicleId) {
      // Check if the specific emergency vehicle has passed
      const emergencyLaneCars = this.cars[this.emergencyDirection] || [];
      const emergencyVehiclePresent = emergencyLaneCars.some(car => 
        car.id === this.emergencyVehicleId && car.type !== 'normal'
      );
      
      if (!emergencyVehiclePresent) {
        console.log(`🚨 Emergency vehicle ${this.emergencyVehicleId} has passed.`);
        this.initiatePostEmergencyMode();
      }
    }
  }

  // Post-emergency management system
  initiatePostEmergencyMode() {
    this.emergencyActive = false;
    this.postEmergencyMode = true;
    this.postEmergencyTimer = 0;
    this.postEmergencyIndex = 0;
    
    // Close the emergency direction signal immediately
    console.log(`🚦 Closing emergency lane ${this.emergencyDirection}`);
    
    // Determine if we should start rotation or go to AI mode
    const totalWaitingCars = Object.values(this.cars).reduce((total, cars) => total + cars.length, 0);
    
    if (totalWaitingCars > 12) { // Higher threshold for Mumbai
      this.startPostEmergencyRotation();
    } else {
      this.switchToAIMode();
    }
    
    this.emergencyDirection = null;
    this.emergencyVehicleId = null;
  }

  startPostEmergencyRotation() {
    // Find the highest congestion lane to start with
    const roadsWithTraffic = this.getRoadsWithTraffic();
    
    if (roadsWithTraffic.length === 0) {
      this.switchToAIMode();
      return;
    }

    let highestQueue = 0;
    let startDirection = roadsWithTraffic[0];
    
    roadsWithTraffic.forEach(direction => {
      const queueSize = this.cars[direction].length;
      if (queueSize > highestQueue) {
        highestQueue = queueSize;
        startDirection = direction;
      }
    });

    // Set up rotation starting with highest congestion
    this.currentSignal = startDirection;
    this.signalTimer = 0;
    this.signalDuration = Math.min(45, this.calculateSignalDuration(highestQueue));
    this.postEmergencyIndex = 0;
  }

  managePostEmergencyRotation() {
    this.postEmergencyTimer += 1;
    this.signalTimer += 1;

    // Check if current signal duration is complete
    if (this.signalTimer >= this.signalDuration) {
      this.postEmergencyIndex += 1;

      // Check if we should end rotation (after 90 seconds or one full cycle)
      if (this.postEmergencyTimer >= 90 || this.postEmergencyIndex >= 4) { // Longer for Mumbai
        this.switchToAIMode();
        return;
      }

      // Move to next direction with traffic
      const roadsWithTraffic = this.getRoadsWithTraffic();
      
      if (roadsWithTraffic.length === 0) {
        this.switchToAIMode();
        return;
      }

      // Get next direction in rotation that has traffic
      let nextDirection = this.postEmergencyRotation[this.postEmergencyIndex % 4];
      let attempts = 0;
      
      while (!roadsWithTraffic.includes(nextDirection) && attempts < 4) {
        this.postEmergencyIndex += 1;
        nextDirection = this.postEmergencyRotation[this.postEmergencyIndex % 4];
        attempts += 1;
      }

      if (attempts >= 4) {
        // No roads with traffic found, switch to AI
        this.switchToAIMode();
        return;
      }

      this.currentSignal = nextDirection;
      this.signalTimer = 0;
      const queueSize = this.cars[nextDirection].length;
      this.signalDuration = Math.min(40, this.calculateSignalDuration(queueSize));
    }
  }

  switchToAIMode() {
    this.postEmergencyMode = false;
    this.postEmergencyTimer = 0;
    this.postEmergencyIndex = 0;
    
    this.systemEfficiency = Math.min(100, this.systemEfficiency + 10);
    
    const bestLane = this.getHighestQueueLane();
    this.currentSignal = bestLane;
    this.signalTimer = 0;
    
    const isEmpty = this.isRoadEmpty(bestLane);
    this.signalDuration = this.calculateSignalDuration(this.cars[bestLane].length, isEmpty);
  }

  // Enhanced car spawning with Mumbai traffic patterns
  spawnCar() {
    // Mumbai-specific spawn rate (higher base rate)
    const baseSpawnRate = 0.45; // Higher spawn rate for Mumbai density
    const efficiencyFactor = (100 - this.systemEfficiency) / 300; // Less aggressive
    const finalSpawnRate = Math.min(0.7, baseSpawnRate + efficiencyFactor);
    
    const spawnChance = Math.random() < finalSpawnRate;
    
    if (spawnChance) {
      // Mumbai traffic pattern simulation
      const timeOfDay = (Date.now() / 1000) % 86400;
      let laneWeights = { N: 0.28, S: 0.28, E: 0.22, W: 0.22 }; // Balanced for Mumbai
      
      // Rush hour adjustments
      const isRushHour = (timeOfDay >= 28800 && timeOfDay <= 36000) || // 8 AM - 10 AM
                         (timeOfDay >= 64800 && timeOfDay <= 72000);    // 6 PM - 8 PM
      
      if (isRushHour) {
        laneWeights = { N: 0.32, S: 0.30, E: 0.20, W: 0.18 }; // North-South bias during rush
      }
      
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
      
      // Reduced emergency vehicle spawning (max 3-4 total)
      if (this.emergencyVehicleCount < 3 && this.emergencyCooldown <= 0) {
        const emergencyRand = Math.random();
        
        if (emergencyRand < 0.0005) { // Reduced from 0.0008
          carType = 'ambulance';
          this.emergencyVehicleCount++;
          this.emergencyCooldown = 450; // Longer cooldown
        } else if (emergencyRand < 0.0008) { // Reduced from 0.0012
          carType = 'fire';
          this.emergencyVehicleCount++;
          this.emergencyCooldown = 400;
        } else if (emergencyRand < 0.0010) { // Reduced from 0.0015
          carType = 'police';
          this.emergencyVehicleCount++;
          this.emergencyCooldown = 350;
        }
      }

      const newCar = {
        id: this.carIdCounter++,
        position: 0,
        speed: carType === 'normal' ? 1.8 + Math.random() * 1.2 : 3.5 + Math.random() * 1.0, // Slower speeds for Mumbai
        waitTime: 0,
        spawned: Date.now(),
        type: carType,
        hasPassedIntersection: false,
        fuelConsumed: 0,
        totalWaitTime: 0
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

  // Main simulation tick
  tick() {
    if (!this.isRunning) return;

    this.tickCount++;
    
    this.spawnCar();

    // Handle different modes
    if (this.emergencyActive) {
      this.signalTimer += 1;
      this.checkEmergencyVehiclesPassed();
    } else if (this.postEmergencyMode) {
      this.managePostEmergencyRotation();
    } else {
      this.manageNormalOperation();
    }

    this.moveCarsAndCalculateMetrics();
    
    // Update efficiency every 45 ticks (45 seconds)
    if (this.tickCount % 45 === 0) {
      this.updateSystemEfficiency();
      this.calculateMumbaiImprovements();
    }
    
    this.lastQueueCounts = {
      N: this.cars.N.length,
      S: this.cars.S.length,
      E: this.cars.E.length,
      W: this.cars.W.length
    };

    this.updateMetrics();
  }

  // Mumbai-specific improvement calculations
  calculateMumbaiImprovements() {
    // Calculate improvement percentage over traditional system
    const traditionalWait = 45; // Mumbai traditional average
    const currentWait = this.currentAvgWaitTime;
    this.improvementPercentage = Math.max(0, ((traditionalWait - currentWait) / traditionalWait) * 100);
    
    // Calculate real-world benefits for Mumbai
    const carsPerHour = this.calculateThroughput() * 60;
    const timeSavedPerCar = Math.max(0, traditionalWait - currentWait);
    this.totalTimeSavedPerHour = (timeSavedPerCar * carsPerHour) / 60; // in minutes
    
    // Fuel savings (Mumbai-specific consumption rates)
    const fuelPerSecondIdle = 0.00028; // Liters per second while idling (Mumbai traffic)
    this.totalFuelSavedPerHour = timeSavedPerCar * carsPerHour * fuelPerSecondIdle;
    
    // Update totals
    this.totalFuelSaved += this.totalFuelSavedPerHour / 3600; // Convert to per-tick
    this.totalCostSaved += (this.totalFuelSavedPerHour / 3600) * 105; // ₹105 per liter
  }

  // Enhanced system efficiency calculation for Mumbai
  updateSystemEfficiency() {
    // Target efficiency: achieve 30-35 second average wait time
    const targetWaitTime = 32.5; // Target average
    const currentWaitTime = this.currentAvgWaitTime;
    
    // Factors that improve efficiency
    let efficiencyBoost = 0;
    
    // Achievement of target wait time
    if (currentWaitTime <= 35 && currentWaitTime >= 30) {
      efficiencyBoost += 5; // Big boost for achieving target
    } else if (currentWaitTime < 40) {
      efficiencyBoost += 3;
    } else if (currentWaitTime < 45) {
      efficiencyBoost += 1;
    }
    
    // Good decision making
    if (this.consecutiveGoodDecisions > this.consecutiveBadDecisions) {
      efficiencyBoost += 2;
    }
    
    // High throughput
    const currentThroughput = this.calculateThroughput();
    if (currentThroughput > 12) { // Lower threshold for Mumbai traffic
      efficiencyBoost += 2;
    }
    
    // Balanced queue lengths
    const queueVariance = this.calculateQueueVariance();
    if (queueVariance < 6) { // Higher tolerance for Mumbai
      efficiencyBoost += 1;
    }
    
    // Factors that decrease efficiency
    let efficiencyPenalty = 0;
    
    // High wait times (penalty for exceeding traditional system)
    if (currentWaitTime > 45) {
      efficiencyPenalty += 5; // Heavy penalty for performing worse than traditional
    } else if (currentWaitTime > 40) {
      efficiencyPenalty += 3;
    } else if (currentWaitTime > 35) {
      efficiencyPenalty += 1;
    }
    
    // Poor decision making
    if (this.consecutiveBadDecisions > 4) {
      efficiencyPenalty += 3;
    }
    
    // Emergency disruptions (reduced penalty)
    if (this.emergencyActive) {
      efficiencyPenalty += 1;
    }
    
    // Update efficiency (bounded between 60 and 100 for Mumbai conditions)
    const netChange = (efficiencyBoost - efficiencyPenalty) * 0.5; // Slower change
    this.systemEfficiency = Math.max(60, Math.min(100, this.systemEfficiency + netChange));
    
    // Record efficiency history
    this.metrics.efficiencyHistory.push({
      timestamp: Date.now(),
      efficiency: this.systemEfficiency,
      avgWaitTime: this.currentAvgWaitTime,
      improvementPercentage: this.improvementPercentage
    });
    
    if (this.metrics.efficiencyHistory.length > 100) {
      this.metrics.efficiencyHistory.shift();
    }
    
    console.log(`🎯 Mumbai System - Efficiency: ${this.systemEfficiency.toFixed(1)}% | Wait: ${this.currentAvgWaitTime.toFixed(1)}s | Improvement: ${this.improvementPercentage.toFixed(1)}%`);
  }

  calculateQueueVariance() {
    const queues = Object.values(this.lastQueueCounts);
    const mean = queues.reduce((sum, q) => sum + q, 0) / queues.length;
    const variance = queues.reduce((sum, q) => sum + Math.pow(q - mean, 2), 0) / queues.length;
    return Math.sqrt(variance);
  }

  manageNormalOperation() {
    this.signalTimer += 1;
    
    if (this.signalTimer >= this.signalDuration) {
      const previousSignal = this.currentSignal;
      const bestLane = this.getHighestQueueLane();
      const roadsWithTraffic = this.getRoadsWithTraffic();
      
      // Smart lane switching logic for Mumbai
      if (this.isRoadEmpty(this.currentSignal) && roadsWithTraffic.length > 0) {
        this.currentSignal = bestLane;
      } else if (bestLane !== this.currentSignal && this.cars[bestLane].length > this.cars[this.currentSignal].length + 3) {
        this.currentSignal = bestLane;
      } else {
        // Sequential rotation with traffic-aware skipping
        const availableRoads = roadsWithTraffic.length > 0 ? roadsWithTraffic : ['N', 'E', 'S', 'W'];
        this.currentSignalIndex = (this.currentSignalIndex + 1) % this.signalSequence.length;
        let nextSignal = this.signalSequence[this.currentSignalIndex];
        
        let attempts = 0;
        while (this.isRoadEmpty(nextSignal) && roadsWithTraffic.length > 0 && !roadsWithTraffic.includes(nextSignal) && attempts < 4) {
          this.currentSignalIndex = (this.currentSignalIndex + 1) % this.signalSequence.length;
          nextSignal = this.signalSequence[this.currentSignalIndex];
          attempts++;
        }
        
        this.currentSignal = nextSignal;
      }
      
      // Efficiency tracking for lane switches
      if (previousSignal !== this.currentSignal) {
        const switchBenefit = this.cars[this.currentSignal].length - this.cars[previousSignal].length;
        if (switchBenefit > 0) {
          this.consecutiveGoodDecisions++;
        }
      }
      
      const isEmpty = this.isRoadEmpty(this.currentSignal);
      this.signalDuration = this.calculateSignalDuration(this.cars[this.currentSignal].length, isEmpty);
      this.signalTimer = 0;
      
      const status = isEmpty ? 'Empty road' : `${this.cars[this.currentSignal].length} cars`;
      console.log(`🤖 Mumbai AI: ${this.currentSignal} for ${this.signalDuration}s (${status})`);
    }
  }

  // Enhanced car movement with Mumbai traffic conditions
  moveCarsAndCalculateMetrics() {
    ['N', 'S', 'E', 'W'].forEach(lane => {
      const isGreen = this.currentSignal === lane;
      
      this.cars[lane] = this.cars[lane].map((car, index) => {
        const carInFront = this.cars[lane][index - 1];
        const isBlocked = carInFront && (car.position + 6 >= carInFront.position); // Closer following distance in Mumbai
        
        const intersectionStart = 42;
        const intersectionEnd = 58;
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
            position: Math.min(120, car.position + car.speed),
            waitTime: isInIntersection || car.hasPassedIntersection ? car.waitTime : 0
          };
        }
        
        if (shouldStop || isBlocked) {
          const fuelConsumedThisTick = 0.00028; // Mumbai-specific fuel consumption
          
          return {
            ...car,
            waitTime: car.waitTime + 1,
            totalWaitTime: car.totalWaitTime + 1,
            fuelConsumed: car.fuelConsumed + fuelConsumedThisTick
          };
        }

        return car;
      });

      // Process cars that have passed through
      const passedCars = this.cars[lane].filter(car => car.position >= 120);
      this.cars[lane] = this.cars[lane].filter(car => car.position < 120);
      
      passedCars.forEach(car => {
        this.totalCarsPassed++;
        
        // Use total accumulated wait time for accurate measurement
        const actualWaitTime = car.totalWaitTime;
        this.recentWaitTimes.push(actualWaitTime);
        this.metrics.waitTimes.push(actualWaitTime);
        
        // Keep rolling average of recent wait times
        if (this.recentWaitTimes.length > 100) { // Larger sample for Mumbai
          this.recentWaitTimes.shift();
        }
        
        // Calculate current rolling average (target: 30-35 seconds)
        this.currentAvgWaitTime = this.recentWaitTimes.length > 0 
          ? this.recentWaitTimes.reduce((sum, time) => sum + time, 0) / this.recentWaitTimes.length 
          : 35; // Start with 35 seconds
        
        if (car.type !== 'normal') {
          this.emergencyVehicleCount = Math.max(0, this.emergencyVehicleCount - 1);
        }
        
        if (this.metrics.waitTimes.length > 300) {
          this.metrics.waitTimes.shift();
        }
      });
    });
  }

  updateMetrics() {
    const currentThroughput = this.calculateThroughput();
    
    this.metrics.throughputHistory.push({
      timestamp: Date.now(),
      throughput: currentThroughput
    });
    if (this.metrics.throughputHistory.length > 120) { // Longer history
      this.metrics.throughputHistory.shift();
    }

    this.metrics.queueHistory.push({
      timestamp: Date.now(),
      queues: { ...this.lastQueueCounts }
    });
    if (this.metrics.queueHistory.length > 120) {
      this.metrics.queueHistory.shift();
    }
  }

  calculateThroughput() {
    const recentHistory = this.metrics.throughputHistory.filter(
      entry => Date.now() - entry.timestamp < 120000 // 2 minutes
    );
    return recentHistory.length > 0 ? 
      this.totalCarsPassed / Math.max(1, recentHistory.length / 60) :
      0;
  }

  getState() {
    const emptyRoads = this.getEmptyRoads();
    const roadsWithTraffic = this.getRoadsWithTraffic();
    
    return {
      signal: this.currentSignal,
      emergencyActive: this.emergencyActive,
      emergencyDirection: this.emergencyDirection,
      postEmergencyMode: this.postEmergencyMode,
      postEmergencyTimer: this.postEmergencyTimer,
      queues: { ...this.lastQueueCounts },
      cars: this.cars,
      cars_passed: this.totalCarsPassed,
      avg_wait_time: this.currentAvgWaitTime,
      signal_timer: this.signalTimer,
      signal_duration: this.signalDuration,
      intelligent_mode: !this.postEmergencyMode,
      total_fuel_saved: this.totalFuelSaved,
      total_cost_saved: this.totalCostSaved,
      empty_roads: emptyRoads,
      roads_with_traffic: roadsWithTraffic,
      system_mode: this.emergencyActive ? 'Emergency' : 
                   this.postEmergencyMode ? 'Post-Emergency Rotation' : 'AI Intelligent',
      system_efficiency: this.systemEfficiency,
      wait_time_trend: this.getWaitTimeTrend(),
      mumbai_improvement_percentage: this.improvementPercentage,
      mumbai_target_achieved: this.currentAvgWaitTime >= 30 && this.currentAvgWaitTime <= 35,
      time_saved_per_hour: this.totalTimeSavedPerHour,
      fuel_saved_per_hour: this.totalFuelSavedPerHour
    };
  }

  getWaitTimeTrend() {
    if (this.recentWaitTimes.length < 20) return 'stable';
    
    const recent20 = this.recentWaitTimes.slice(-20);
    const previous20 = this.recentWaitTimes.slice(-40, -20);
    
    if (previous20.length === 0) return 'stable';
    
    const recentAvg = recent20.reduce((sum, time) => sum + time, 0) / recent20.length;
    const previousAvg = previous20.reduce((sum, time) => sum + time, 0) / previous20.length;
    
    const difference = recentAvg - previousAvg;
    
    if (difference < -3) return 'improving';
    if (difference > 3) return 'worsening';
    return 'stable';
  }

  getMetrics() {
    const currentThroughput = this.calculateThroughput();
    const avgWaitTime = this.currentAvgWaitTime;
    
    return {
      total_cars: this.totalCarsPassed,
      avg_trip_time: avgWaitTime * 0.6, // Adjusted for Mumbai conditions
      throughput: currentThroughput,
      queue_history: this.metrics.queueHistory.slice(-30),
      wait_time_history: this.recentWaitTimes.slice(-30).map((time, index) => ({
        time: index,
        wait_time: time
      })),
      emergency_count: Object.values(this.cars).flat().filter(car => car.type !== 'normal').length,
      fuel_saved_total: this.totalFuelSaved,
      cost_saved_total: this.totalCostSaved,
      efficiency_improvement: this.systemEfficiency,
      empty_road_count: this.getEmptyRoads().length,
      active_road_count: this.getRoadsWithTraffic().length,
      system_efficiency: this.systemEfficiency,
      wait_time_trend: this.getWaitTimeTrend(),
      traditional_wait_time: this.traditionalSystemWaitTime,
      current_avg_wait_time: this.currentAvgWaitTime,
      target_wait_time: this.targetWaitTime,
      improvement_percentage: this.improvementPercentage,
      target_achieved: this.currentAvgWaitTime >= 30 && this.currentAvgWaitTime <= 35,
      time_saved_per_hour_minutes: this.totalTimeSavedPerHour,
      fuel_saved_per_hour_liters: this.totalFuelSavedPerHour
    };
  }

  // Manual override remains the same but with Mumbai context
  manualOverride(direction, reason) {
    console.log(`Mumbai Traffic Control - Manual override: ${direction} - Reason: ${reason}`);
    
    this.systemEfficiency = Math.max(70, this.systemEfficiency - 15);
    
    this.emergencyActive = false;
    this.postEmergencyMode = false;
    this.emergencyDirection = null;
    this.emergencyVehicleId = null;
    
    this.currentSignal = direction;
    this.signalTimer = 0;
    this.signalDuration = 60;
    
    const overrideLog = {
      timestamp: new Date().toISOString(),
      action: 'MANUAL_OVERRIDE_ACTIVATED',
      direction: direction,
      reason: reason,
      operator: 'Mumbai Traffic Control Officer',
      location: 'Mumbai Traffic Junction',
      previous_mode: this.postEmergencyMode ? 'Post-Emergency' : 'AI',
      system_efficiency_impact: -15
    };
    
    console.log('Mumbai Override logged:', overrideLog);
  }

  resetSimulation() {
    this.cars = { N: [], S: [], E: [], W: [] };
    this.carIdCounter = 0;
    this.totalCarsPassed = 0;
    this.emergencyVehicleCount = 0;
    this.emergencyCooldown = 0;
    this.emergencyActive = false;
    this.emergencyDirection = null;
    this.emergencyVehicleId = null;
    this.postEmergencyMode = false;
    this.postEmergencyTimer = 0;
    this.postEmergencyIndex = 0;
    this.currentSignal = 'N';
    this.currentSignalIndex = 0;
    this.signalTimer = 0;
    this.signalDuration = 35;
    this.totalFuelSaved = 0;
    this.totalCostSaved = 0;
    this.lastQueueCounts = { N: 0, S: 0, E: 0, W: 0 };
    
    // Reset Mumbai-specific metrics
    this.systemEfficiency = 85;
    this.currentAvgWaitTime = 35;
    this.recentWaitTimes = [];
    this.historicalWaitTimes = [];
    this.consecutiveGoodDecisions = 0;
    this.consecutiveBadDecisions = 0;
    this.tickCount = 0;
    this.improvementPercentage = 0;
    this.totalTimeSavedPerHour = 0;
    this.totalFuelSavedPerHour = 0;
    
    this.metrics = {
      waitTimes: [],
      throughputHistory: [],
      queueHistory: [],
      efficiencyHistory: [],
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
    resetSimulation,
    manualOverride: useMock ? mockSimulator.manualOverride.bind(mockSimulator) : null
  };
}