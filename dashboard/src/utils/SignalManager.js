import { TRAFFIC_CONSTANTS } from './constants';

export class SignalManager {
  constructor() {
    this.currentSignal = 'N';
    this.signalTimer = 0;
    this.signalDuration = 30;
    this.currentSignalIndex = 0;
    this.signalSequence = ['N', 'E', 'S', 'W'];
    this.emergencyActive = false;
    this.emergencyDirection = null;
  }

  updateSignal(queues) {
    if (this.emergencyActive) {
      return;
    }

    this.signalTimer += 1;
    if (this.signalTimer >= this.signalDuration) {
      this.switchSignal(queues);
    }
  }

  switchSignal(queues) {
    const nextSignal = this.determineNextSignal(queues);
    this.currentSignal = nextSignal;
    this.signalTimer = 0;
    this.signalDuration = this.calculateSignalDuration(queues[nextSignal]);
  }

  determineNextSignal(queues) {
    // Find direction with longest queue
    let maxQueue = -1;
    let bestDirection = this.currentSignal;

    Object.entries(queues).forEach(([direction, queueLength]) => {
      if (direction !== this.currentSignal && queueLength > maxQueue) {
        maxQueue = queueLength;
        bestDirection = direction;
      }
    });

    // If no significant queues, follow normal sequence
    if (maxQueue <= 2) {
      const currentIndex = this.signalSequence.indexOf(this.currentSignal);
      return this.signalSequence[(currentIndex + 1) % this.signalSequence.length];
    }

    return bestDirection;
  }

  calculateSignalDuration(queueLength) {
    // Base duration plus additional time per car in queue
    const duration = TRAFFIC_CONSTANTS.MIN_SIGNAL_TIME + 
                    (queueLength * TRAFFIC_CONSTANTS.BASE_TIME_PER_CAR);
    
    return Math.min(
      Math.max(duration, TRAFFIC_CONSTANTS.MIN_SIGNAL_TIME),
      TRAFFIC_CONSTANTS.MAX_SIGNAL_TIME
    );
  }

  handleEmergencyVehicle(emergency) {
    if (!this.emergencyActive && emergency) {
      this.emergencyActive = true;
      this.emergencyDirection = emergency.direction;
      this.currentSignal = emergency.direction;
      this.signalTimer = 0;
      this.signalDuration = TRAFFIC_CONSTANTS.MAX_SIGNAL_TIME;

      // Reset emergency state after passage
      setTimeout(() => {
        this.emergencyActive = false;
        this.emergencyDirection = null;
      }, 15000); // 15 seconds for emergency vehicle passage
    }
  }

  reset() {
    this.currentSignal = 'N';
    this.signalTimer = 0;
    this.signalDuration = 30;
    this.currentSignalIndex = 0;
    this.emergencyActive = false;
    this.emergencyDirection = null;
  }

  getState() {
    return {
      current_signal: this.currentSignal,
      timer: this.signalTimer,
      duration: this.signalDuration,
      emergency_active: this.emergencyActive,
      emergency_direction: this.emergencyDirection
    };
  }
}