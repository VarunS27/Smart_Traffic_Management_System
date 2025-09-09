import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTrafficData } from '../utils/useTrafficData';
import Car from '../components/car';
import TrafficLight from '../components/TrafficLight';
import Loader from '../components/Loader';

const LiveIntersection = () => {
  const { 
    state, 
    metrics, 
    loading, 
    error, 
    useMock, 
    simulationSpeed,
    switchToMock, 
    switchToBackend, 
    setSpeed, 
    resetSimulation,
    manualOverride
  } = useTrafficData();

  // Mumbai-specific intelligent calculations
  const [mumbaiStats, setMumbaiStats] = useState({
    fuelSaved: 0,
    timeSaved: 0,
    co2Reduced: 0,
    totalSavings: 0,
    efficiencyGain: 0
  });

  // Manual override state
  const [showOverrideWarning, setShowOverrideWarning] = useState(false);
  const [selectedOverrideDirection, setSelectedOverrideDirection] = useState(null);
  const [overrideActive, setOverrideActive] = useState(false);
  const [overrideStartTime, setOverrideStartTime] = useState(null);
  const [overrideReason, setOverrideReason] = useState('');

  useEffect(() => {
    if (state && metrics) {
      // Real-time calculations based on actual performance vs traditional systems
      const avgWaitReduction = Math.max(0, 45 - (state.avg_wait_time || 0)); // 45s Mumbai average
      const carsPerMinute = metrics.throughput || 0;
      const carsPerHour = carsPerMinute * 60;
      
      // More accurate fuel saving calculation
      const fuelSavedPerHour = (state.total_fuel_saved || 0) * 3600; // Convert to hourly rate
      const actualFuelSaved = Math.max(fuelSavedPerHour, (avgWaitReduction / 3600) * carsPerHour * 0.8);
      
      // Time saved calculation (more cars passing = less overall time)
      const timeEfficiency = Math.max(0, carsPerMinute - 12); // 12 cars/min is Mumbai average
      const timeSaved = (avgWaitReduction * carsPerHour) / 60 + (timeEfficiency * 60);
      
      // CO2 reduction
      const co2Reduced = actualFuelSaved * 2.31;
      
      // Economic savings - fuel + time + productivity
      const fuelCostSaved = actualFuelSaved * 105;
      const timeCostSaved = (timeSaved / 60) * 200; // ₹200/hour time value
      const totalSavings = fuelCostSaved + timeCostSaved;
      
      // System efficiency improvement
      const efficiencyGain = metrics.efficiency_improvement || 0;
      
      setMumbaiStats({
        fuelSaved: Math.max(0, actualFuelSaved),
        timeSaved: Math.max(0, timeSaved),
        co2Reduced: Math.max(0, co2Reduced),
        totalSavings: Math.max(0, totalSavings),
        efficiencyGain: efficiencyGain
      });
    }
  }, [state, metrics]);

  // Handle manual override request
  const handleOverrideRequest = (direction) => {
    setSelectedOverrideDirection(direction);
    setShowOverrideWarning(true);
  };

  // Confirm manual override
  const confirmOverride = () => {
    if (selectedOverrideDirection && overrideReason.trim()) {
      // Log the override event
      const overrideEvent = {
        timestamp: new Date().toISOString(),
        direction: selectedOverrideDirection,
        reason: overrideReason,
        operator: 'Traffic Control Officer', // In real system, this would be authenticated user
        previousSignal: state?.signal
      };
      
      console.log('Manual Override Activated:', overrideEvent);
      
      // Activate override
      if (manualOverride) {
        manualOverride(selectedOverrideDirection, overrideReason);
      }
      
      setOverrideActive(true);
      setOverrideStartTime(Date.now());
      setShowOverrideWarning(false);
      setSelectedOverrideDirection(null);
      setOverrideReason('');
      
      // Auto-disable override after 60 seconds for safety
      setTimeout(() => {
        setOverrideActive(false);
        setOverrideStartTime(null);
        console.log('Manual override auto-disabled after 60 seconds');
      }, 60000);
    }
  };

  // Cancel override
  const cancelOverride = () => {
    setShowOverrideWarning(false);
    setSelectedOverrideDirection(null);
    setOverrideReason('');
  };

  // Disable manual override
  const disableOverride = () => {
    setOverrideActive(false);
    setOverrideStartTime(null);
    console.log('Manual override disabled by operator');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader message="Loading Intelligent Mumbai Traffic System..." />
      </div>
    );
  }

  // Get the highest queue lane for highlighting
  const getHighestQueueLane = () => {
    if (!state?.queues) return null;
    const queues = state.queues;
    let maxQueue = 0;
    let maxLane = null;
    Object.entries(queues).forEach(([lane, count]) => {
      if (count > maxQueue) {
        maxQueue = count;
        maxLane = lane;
      }
    });
    return maxLane;
  };

  const highestQueueLane = getHighestQueueLane();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6">
        
        {/* Override Warning Modal */}
        <AnimatePresence>
          {showOverrideWarning && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-lg p-8 max-w-md mx-4 shadow-2xl"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <h2 className="text-xl font-bold text-red-600 mb-2">MANUAL OVERRIDE WARNING</h2>
                  <p className="text-gray-700 text-sm">
                    You are about to override the AI traffic management system for direction <strong>{selectedOverrideDirection}</strong>.
                  </p>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-2">
                    <span className="text-yellow-600 text-sm">🚨</span>
                    <div className="text-sm text-yellow-800">
                      <p className="font-semibold mb-1">IMPORTANT NOTICE:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>This action will be logged and monitored by Mumbai Traffic Police</li>
                        <li>Override will automatically disable after 60 seconds</li>
                        <li>You are responsible for any traffic disruption caused</li>
                        <li>Emergency vehicles will still have priority</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Override *
                  </label>
                  <select
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select reason...</option>
                    <option value="VIP Movement">VIP Movement</option>
                    <option value="Accident Management">Accident Management</option>
                    <option value="Road Construction">Road Construction</option>
                    <option value="Special Event">Special Event</option>
                    <option value="System Malfunction">System Malfunction</option>
                    <option value="Manual Traffic Control">Manual Traffic Control</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={cancelOverride}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmOverride}
                    disabled={!overrideReason.trim()}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirm Override
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🧠 Intelligent Mumbai Traffic System</h1>
              <p className="text-gray-600 mt-2">AI-Powered Dynamic Signal Management</p>
              <p className="text-sm text-blue-600 mt-1">📍 Bandra-Kurla Complex, Mumbai - Junction 12A</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                {overrideActive ? 'Manual Override' : 'Intelligent Mode'}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <div className={`w-3 h-3 rounded-full animate-pulse ${
                  overrideActive ? 'bg-red-500' : 'bg-green-500'
                }`}></div>
                <span className={`font-semibold ${
                  overrideActive ? 'text-red-600' : 'text-green-600'
                }`}>
                  {overrideActive ? 'OVERRIDE' : 'ACTIVE'}
                </span>
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Efficiency: +{mumbaiStats.efficiencyGain.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Manual Override Alert */}
        <AnimatePresence>
          {overrideActive && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-red-100 border-2 border-red-400 text-red-800 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
                  <div>
                    <p className="font-semibold">
                      🚨 MANUAL OVERRIDE ACTIVE
                    </p>
                    <p className="text-sm">
                      Signal manually controlled • Auto-disable in {60 - Math.floor((Date.now() - overrideStartTime) / 1000)}s
                    </p>
                  </div>
                </div>
                <button
                  onClick={disableOverride}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Disable Override
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Emergency Alert */}
        <AnimatePresence>
          {state?.emergencyActive && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-orange-100 border-2 border-orange-400 text-orange-800 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-orange-500 rounded-full animate-ping"></div>
                  <p className="font-semibold">
                    🚨 EMERGENCY VEHICLE PRIORITY ACTIVE
                  </p>
                </div>
                <div className="text-sm">
                  Lane {state.emergencyDirection} • Priority Override
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Smart Queue Alert */}
        {highestQueueLane && state?.queues[highestQueueLane] > 8 && !overrideActive && (
          <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-lg">⚡</span>
                <p className="font-medium">
                  Smart Detection: High traffic in {highestQueueLane} direction ({state.queues[highestQueueLane]} vehicles)
                </p>
              </div>
              <div className="text-sm">
                Signal Duration: {state?.signal_duration}s
              </div>
            </div>
          </div>
        )}

        {/* Manual Override Control Buttons */}
        <div className="mb-8 bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">🚦 Manual Override Controls</h3>
              <p className="text-sm text-gray-600">Emergency traffic control - Use only when necessary</p>
            </div>
            <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
              Monitored by Traffic Police
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {[
    { direction: 'N', label: 'North (Kurla)', color: 'bg-blue-500 hover:bg-blue-600' },
    { direction: 'E', label: 'East (Chembur)', color: 'bg-green-500 hover:bg-green-600' },
    { direction: 'S', label: 'South (Fort)', color: 'bg-orange-500 hover:bg-orange-600' },
    { direction: 'W', label: 'West (Bandra)', color: 'bg-purple-500 hover:bg-purple-600' }
  ].map(({ direction, label, color }) => (
    <button
      key={direction}
      onClick={() => handleOverrideRequest(direction)}
      disabled={overrideActive || state?.emergencyActive}
      className={`p-4 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${color} ${
        state?.signal === direction ? 'ring-4 ring-yellow-400' : ''
      }`}
    >
      <div className="text-2xl mb-1">
        {direction === 'N' ? '⬆️' : direction === 'E' ? '➡️' : direction === 'S' ? '⬇️' : '⬅️'}
      </div>
      <div className="text-sm font-semibold">{direction}</div>
      <div className="text-xs opacity-90">{label.split(' ')[1]}</div>
      <div className="text-xs mt-1">
        Queue: {state?.queues?.[direction] || 0}
      </div>
    </button>
  ))}
</div>
          
          <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <p><strong>Warning:</strong> Manual overrides are logged with timestamp, reason, and operator details. 
            Use only for emergency situations, VIP movements, or when AI system requires intervention.</p>
          </div>
        </div>

        {/* Enhanced Mumbai Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fuel Saved</p>
                <p className="text-2xl font-bold text-green-600">
                  {mumbaiStats.fuelSaved.toFixed(1)}L
                </p>
                <p className="text-xs text-green-700 mt-1">
                  ₹{(mumbaiStats.fuelSaved * 105).toFixed(0)} saved
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                ⛽
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Time Saved</p>
                <p className="text-2xl font-bold text-blue-600">
                  {mumbaiStats.timeSaved.toFixed(0)} min
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  per hour
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                ⏰
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CO₂ Reduced</p>
                <p className="text-2xl font-bold text-purple-600">
                  {mumbaiStats.co2Reduced.toFixed(1)} kg
                </p>
                <p className="text-xs text-purple-700 mt-1">
                  per hour
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                🌱
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Savings</p>
                <p className="text-2xl font-bold text-orange-600">
                  ₹{mumbaiStats.totalSavings.toFixed(0)}
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  per hour
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                💰
              </div>
            </div>
          </div>
        </div>

        {/* Intelligent System Status */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            🧠 AI Traffic Analysis {overrideActive && <span className="text-red-500 text-sm">(Override Active)</span>}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {['N', 'S', 'E', 'W'].map(direction => {
              const queueCount = state?.queues?.[direction] || 0;
              const isActive = state?.signal === direction;
              const isHighest = direction === highestQueueLane;
              
              return (
                <div key={direction} className={`p-4 rounded-lg border-2 ${
                  isActive 
                    ? 'border-green-400 bg-green-50' 
                    : isHighest 
                      ? 'border-yellow-400 bg-yellow-50'
                      : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">
                        {direction === 'N' ? 'North (Kurla)' : 
                         direction === 'S' ? 'South (Fort)' : 
                         direction === 'E' ? 'East (Chembur)' : 'West (Bandra)'}
                      </div>
                      <div className="text-sm text-gray-600">
                        Queue: {queueCount} vehicles
                      </div>
                      {isActive && (
                        <div className="text-xs text-green-600 font-medium">
                          Duration: {state?.signal_duration}s
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      {isActive && <span className="text-2xl">🟢</span>}
                      {isHighest && !isActive && <span className="text-2xl">⚡</span>}
                      {!isActive && !isHighest && <span className="text-2xl">🔴</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Intersection View */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Live Traffic Flow
            </h2>
            <div className={`text-sm px-3 py-2 rounded-full ${
              overrideActive 
                ? 'bg-red-100 text-red-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {overrideActive ? 'Manual Control' : 'Smart Signal'}: {state?.signal} ({state?.signal_duration - (state?.signal_timer || 0)}s remaining)
            </div>
          </div>

          {/* Intersection Container */}
          <div className="relative w-full h-[600px] bg-gradient-to-br from-gray-300 to-gray-400 rounded-xl overflow-hidden border-4 border-gray-500 shadow-inner">
            
            {/* Enhanced Road Infrastructure */}
            <div className="absolute inset-0">
              {/* Horizontal Road */}
              <div className="absolute top-1/2 left-0 w-full h-24 bg-gray-800 transform -translate-y-1/2 shadow-2xl">
                <div className="absolute top-4 left-0 w-full h-1 bg-yellow-400 opacity-80"></div>
                <div className="absolute bottom-4 left-0 w-full h-1 bg-yellow-400 opacity-80"></div>
                <div className="absolute top-1/2 left-0 w-full h-2 bg-yellow-300 transform -translate-y-1/2 opacity-90"></div>
                <div className="absolute top-0 left-0 w-full h-1 bg-white"></div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-white"></div>
              </div>
              
              {/* Vertical Road */}
              <div className="absolute left-1/2 top-0 w-24 h-full bg-gray-800 transform -translate-x-1/2 shadow-2xl">
                <div className="absolute left-4 top-0 w-1 h-full bg-yellow-400 opacity-80"></div>
                <div className="absolute right-4 top-0 w-1 h-full bg-yellow-400 opacity-80"></div>
                <div className="absolute left-1/2 top-0 w-2 h-full bg-yellow-300 transform -translate-x-1/2 opacity-90"></div>
                <div className="absolute left-0 top-0 w-1 h-full bg-white"></div>
                <div className="absolute right-0 top-0 w-1 h-full bg-white"></div>
              </div>
              
              {/* Intersection Center with Smart Indicators */}
              <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-gray-900 transform -translate-x-1/2 -translate-y-1/2 shadow-2xl border-4 border-yellow-400">
                <div className="absolute inset-2">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="absolute bg-white opacity-40" style={{
                      width: '2px',
                      height: '100%',
                      left: `${i * 12}%`,
                      top: 0
                    }}></div>
                  ))}
                </div>
                {/* Status indicator in center */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-yellow-400 text-xs font-bold">
                  {overrideActive ? 'MAN' : 'AI'}
                </div>
              </div>
            </div>

            {/* Enhanced Traffic Lights */}
            <TrafficLight 
              direction="N" 
              signal={state?.signal}
              emergencyActive={state?.emergencyActive && state?.emergencyDirection === 'N'}
            />
            <TrafficLight 
              direction="S" 
              signal={state?.signal}
              emergencyActive={state?.emergencyActive && state?.emergencyDirection === 'S'}
            />
            <TrafficLight 
              direction="E" 
              signal={state?.signal}
              emergencyActive={state?.emergencyActive && state?.emergencyDirection === 'E'}
            />
            <TrafficLight 
              direction="W" 
              signal={state?.signal}
              emergencyActive={state?.emergencyActive && state?.emergencyDirection === 'W'}
            />

            {/* Cars */}
            <AnimatePresence>
              {state?.cars && Object.entries(state.cars).map(([lane, cars]) =>
                cars.map(car => (
                  <Car
                    key={`${car.id}-${lane}`}
                    id={car.id}
                    lane={lane}
                    position={car.position}
                    speed={car.speed}
                    type={car.type}
                  />
                ))
              )}
            </AnimatePresence>

            {/* Enhanced queue indicators with priority highlighting */}
            {state?.queues && Object.entries(state.queues).map(([lane, count]) => (
              <div
                key={lane}
                className={`absolute text-white px-3 py-2 rounded-lg font-bold text-sm ${
                  lane === highestQueueLane && !overrideActive
                    ? 'bg-yellow-600 animate-pulse' 
                    : state?.signal === lane 
                      ? 'bg-green-600'
                      : 'bg-gray-800'
                } ${
                  lane === 'N' ? 'top-4 left-1/2 transform -translate-x-1/2' :
                  lane === 'S' ? 'bottom-4 right-1/2 transform translate-x-1/2' :
                  lane === 'E' ? 'right-4 top-1/2 transform -translate-y-1/2' :
                  'left-4 bottom-1/2 transform translate-y-1/2'
                }`}
              >
                {lane}: {count} vehicles
                {lane === highestQueueLane && count > 5 && !overrideActive && <span className="ml-1">⚡</span>}
              </div>
            ))}
          </div>

          {/* Enhanced Signal Status */}
          <div className="mt-6 flex justify-center space-x-6">
            <div className={`text-white px-6 py-3 rounded-xl shadow-lg ${
              overrideActive ? 'bg-red-600' : 'bg-gray-800'
            }`}>
              <span className="text-lg font-semibold">
                {overrideActive ? 'Manual Control' : 'Smart Signal'}: {state?.signal} | 
                Duration: {state?.signal_duration}s | 
                Remaining: {state?.signal_duration - (state?.signal_timer || 0)}s
              </span>
            </div>
            {state?.emergencyActive && (
              <div className="bg-orange-600 text-white px-6 py-3 rounded-xl animate-pulse shadow-lg">
                <span className="text-lg font-semibold">🚨 EMERGENCY MODE</span>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Real-time Statistics */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{state?.cars_passed || 0}</div>
              <div className="text-sm text-gray-600">Vehicles Processed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{(state?.avg_wait_time || 0).toFixed(1)}s</div>
              <div className="text-sm text-gray-600">Avg Wait Time</div>
              <div className="text-xs text-green-600">
                {mumbaiStats.efficiencyGain.toFixed(1)}% improvement
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{(metrics?.throughput || 0).toFixed(1)}</div>
              <div className="text-sm text-gray-600">Cars per Minute</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {Math.max(...Object.values(state?.queues || {0: 0}))}
              </div>
              <div className="text-sm text-gray-600">Highest Queue</div>
            </div>
          </div>
        </div>

        {/* System Controls */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Intelligent System Controls</h3>
          <div className="flex flex-wrap items-center space-x-4">
            <div className="flex space-x-2">
              <button
                onClick={switchToMock}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  useMock ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🧠 AI Simulation
              </button>
              <button
                onClick={switchToBackend}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  !useMock ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📡 Live Data
              </button>
            </div>
            
            {useMock && (
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Speed: {simulationSpeed}x</label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={simulationSpeed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-24 h-2 bg-gray-200 rounded-lg"
                />
              </div>
            )}
            
            {useMock && (
              <button
                onClick={resetSimulation}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600"
              >
                🔄 Reset System
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveIntersection;