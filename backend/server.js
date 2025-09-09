const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PythonShell } = require('python-shell');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Python simulation
let pyshell = null;

// Start simulation
app.post('/api/simulation/start', (req, res) => {
  if (!pyshell) {
    pyshell = new PythonShell('traffic_sim/app/main.py');
    pyshell.on('message', (message) => {
      console.log('Python:', message);
    });
    res.json({ status: 'Simulation started' });
  } else {
    res.status(400).json({ error: 'Simulation already running' });
  }
});

// Stop simulation
app.post('/api/simulation/stop', (req, res) => {
  if (pyshell) {
    pyshell.end((err) => {
      if (err) throw err;
      pyshell = null;
      res.json({ status: 'Simulation stopped' });
    });
  } else {
    res.status(400).json({ error: 'No simulation running' });
  }
});

// Get current simulation state
app.get('/api/simulation/state', (req, res) => {
  if (pyshell) {
    pyshell.send('get_state');
    pyshell.once('message', (message) => {
      try {
        const state = JSON.parse(message);
        res.json(state);
      } catch (err) {
        res.status(500).json({ error: 'Invalid state data' });
      }
    });
  } else {
    res.status(400).json({ error: 'Simulation not running' });
  }
});

// Get metrics
app.get('/api/simulation/metrics', (req, res) => {
  if (pyshell) {
    pyshell.send('get_metrics');
    pyshell.once('message', (message) => {
      try {
        const metrics = JSON.parse(message);
        res.json(metrics);
      } catch (err) {
        res.status(500).json({ error: 'Invalid metrics data' });
      }
    });
  } else {
    res.status(400).json({ error: 'Simulation not running' });
  }
});

// Set simulation speed
app.post('/api/simulation/speed', (req, res) => {
  const { speed } = req.body;
  if (pyshell) {
    pyshell.send(`set_speed ${speed}`);
    res.json({ status: 'Speed updated' });
  } else {
    res.status(400).json({ error: 'Simulation not running' });
  }
});

// Reset simulation
app.post('/api/simulation/reset', (req, res) => {
  if (pyshell) {
    pyshell.send('reset');
    res.json({ status: 'Simulation reset' });
  } else {
    res.status(400).json({ error: 'Simulation not running' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});