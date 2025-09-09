import { TRAFFIC_CONSTANTS } from './constants';

export class VehicleManager {
  constructor() {
    this.cars = { N: [], S: [], E: [], W: [] };
    this.carIdCounter = 0;
    this.emergencyVehicleCount = 0;
    this.emergencyCooldown = 0;
    this.carsPassed = 0;
    this.isRunning = false;
  }

  updateVehicles(currentSignal) {
    Object.keys(this.cars).forEach(direction => {
      const updatedCars = this.cars[direction].filter(car => {
        // Update car position
        if (direction === currentSignal || car.type === 'emergency') {
          car.position += car.speed;
          
          // Check if car has passed intersection
          if (car.position >= 100) {
            this.carsPassed++;
            return false;
          }
        } else {
          // Increment wait time for stopped cars
          car.waitTime = (car.waitTime || 0) + 1;
        }
        return true;
      });

      this.cars[direction] = updatedCars;
    });

    // Generate new vehicles
    if (Math.random() < 0.3) {
      this.spawnCar(currentSignal);
    }

    // Update emergency cooldown
    if (this.emergencyCooldown > 0) {
      this.emergencyCooldown--;
    }
  }

  spawnCar(currentSignal) {
    const direction = this._getRandomDirection();
    const isEmergency = this.emergencyCooldown === 0 && Math.random() < 0.05;

    if (this.cars[direction].length < 10) { // Limit cars per lane
      const newCar = {
        id: `${direction}-${this.carIdCounter++}`,
        position: 0,
        speed: isEmergency ? 2 : 1,
        type: isEmergency ? 'emergency' : 'normal',
        waitTime: 0,
        direction
      };

      this.cars[direction].push(newCar);

      if (isEmergency) {
        this.emergencyVehicleCount++;
        this.emergencyCooldown = 300; // 5 seconds cooldown
        return { direction, type: 'emergency' };
      }
    }
    return null;
  }

  _getRandomDirection() {
    const directions = ['N', 'S', 'E', 'W'];
    const weights = [0.3, 0.25, 0.25, 0.2];
    const random = Math.random();
    let cumulativeWeight = 0;

    for (let i = 0; i < directions.length; i++) {
      cumulativeWeight += weights[i];
      if (random <= cumulativeWeight) {
        return directions[i];
      }
    }
    return 'N';
  }

  getQueueLengths() {
    return Object.keys(this.cars).reduce((acc, direction) => {
      acc[direction] = this.cars[direction].length;
      return acc;
    }, {});
  }

  getMetrics() {
    return {
      throughput: this.calculateThroughput(),
      emergency_count: this.emergencyVehicleCount,
      wait_times: this.calculateWaitTimes(),
      historical_queues: this.getQueueLengths()
    };
  }

  calculateThroughput() {
    // Cars passed per minute
    return (this.carsPassed * 60) / (Date.now() - this._startTime || 1) * 1000;
  }

  calculateWaitTimes() {
    const waitTimes = [];
    Object.values(this.cars).forEach(lane => {
      lane.forEach(car => {
        if (car.waitTime > 0) {
          waitTimes.push(car.waitTime);
        }
      });
    });
    return waitTimes;
  }

  start() {
    this.isRunning = true;
    this._startTime = Date.now();
    this.reset();
  }

  stop() {
    this.isRunning = false;
  }

  reset() {
    this.cars = { N: [], S: [], E: [], W: [] };
    this.carIdCounter = 0;
    this.emergencyVehicleCount = 0;
    this.emergencyCooldown = 0;
    this.carsPassed = 0;
    this._startTime = Date.now();
  }

  getState() {
    return {
      cars: this.cars,
      cars_passed: this.carsPassed,
      avg_wait_time: this.calculateAverageWaitTime(),
      queues: this.getQueueLengths(),
      emergencyActive: this.emergencyCooldown > 0,
      emergencyDirection: null // Will be set by SignalManager
    };
  }

  calculateAverageWaitTime() {
    const waitTimes = this.calculateWaitTimes();
    return waitTimes.length > 0 
      ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length 
      : 0;
  }
}