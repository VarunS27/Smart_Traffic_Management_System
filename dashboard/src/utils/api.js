import axios from 'axios';

// Base URL for the backend API
// Change this to your backend URL when ready to connect to real backend
const BASE_URL = 'http://localhost:8000';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// API endpoints
export const getState = async () => {
  try {
    const response = await api.get('/state');
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch state: ${error.message}`);
  }
};

export const getMetrics = async () => {
  try {
    const response = await api.get('/metrics');
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch metrics: ${error.message}`);
  }
};

export const postAction = async (action) => {
  try {
    const response = await api.post('/action', action);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to post action: ${error.message}`);
  }
};

// Export the axios instance for custom requests
export default api;

// Example backend response formats for reference:
/*
GET /state response:
{
  "signal": "NS",
  "queues": {"N": 3, "S": 2, "E": 1, "W": 0},
  "cars": {
    "N": [{"id": 1, "position": 45, "speed": 2.5}],
    "S": [{"id": 2, "position": 30, "speed": 3.0}],
    "E": [],
    "W": []
  },
  "cars_passed": 42,
  "avg_wait_time": 12.3,
  "signal_timer": 15,
  "signal_duration": 30
}

GET /metrics response:
{
  "total_cars": 120,
  "avg_trip_time": 35.7,
  "throughput": 8.2,
  "queue_history": [...],
  "wait_time_history": [...]
}
*/