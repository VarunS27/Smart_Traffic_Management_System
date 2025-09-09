export const TRAFFIC_CONSTANTS = {
  MIN_SIGNAL_TIME: 8,
  MAX_SIGNAL_TIME: 60,
  BASE_TIME_PER_CAR: 2,
  POLL_INTERVAL: 1000,
  FUEL_CONSUMPTION_RATE: 0.00022, // L/second
  FUEL_COST: 105, // INR/L
  TRADITIONAL_WAIT_TIME: 45, // seconds
  EMERGENCY_TYPES: {
    AMBULANCE: { priority: 3, spawnRate: 0.0008 },
    FIRE: { priority: 2, spawnRate: 0.0004 },
    POLICE: { priority: 1, spawnRate: 0.0003 }
  },
  DIRECTIONS: ['N', 'S', 'E', 'W'],
  LANE_WEIGHTS: { N: 0.3, S: 0.25, E: 0.25, W: 0.2 }
};