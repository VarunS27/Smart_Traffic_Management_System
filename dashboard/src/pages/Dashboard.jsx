import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTrafficData } from '../utils/useTrafficData';
import Car from '../components/car';
import TrafficLight from '../components/TrafficLight';
import StatCard from '../components/StatCard';
import ChartPanel from '../components/ChartPanel';
import Loader from '../components/Loader';

const Dashboard = () => {
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
    resetSimulation 
  } = useTrafficData();

  // Control panel state
  const [showControls, setShowControls] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader message="Initializing Traffic System..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        
        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg"
            >
              <p className="text-sm">⚠️ {error}</p>
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
              className="mb-6 p-4 bg-red-100 border-2 border-red-400 text-red-800 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <p className="text-sm font-semibold">
                  🚨 EMERGENCY VEHICLE PRIORITY - Lane {state.emergencyDirection} active
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Section with enhanced status displays */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                🧠 Smart Traffic Management System
              </h1>
              <p className="text-lg text-gray-600 mb-4">
                AI-Powered Traffic Optimization Dashboard
              </p>
              <div className="flex items-center space-x-4">
                <span className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold border ${
                  state?.system_mode === 'Emergency' 
                    ? 'bg-red-100 text-red-800 border-red-200'
                    : state?.system_mode === 'Post-Emergency Rotation'
                      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                      : 'bg-blue-100 text-blue-800 border-blue-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full animate-pulse ${
                    state?.system_mode === 'Emergency' ? 'bg-red-500'
                      : state?.system_mode === 'Post-Emergency Rotation' ? 'bg-yellow-500'
                      : 'bg-blue-500'
                  }`}></span>
                  <span>{state?.system_mode || 'AI Intelligent'}</span>
                </span>
                <span className="text-sm text-gray-500">📍 Mumbai Traffic Junction</span>
              </div>
              
              {/* Enhanced status indicators */}
              {state?.empty_roads && state.empty_roads.length > 0 && (
                <div className="mt-2">
                  <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                    <span>🚫</span>
                    <span>Empty Roads: {state.empty_roads.join(', ')}</span>
                  </span>
                </div>
              )}
              
              {state?.postEmergencyMode && (
                <div className="mt-2">
                  <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs">
                    <span>🔄</span>
                    <span>Post-Emergency Rotation: {60 - state.postEmergencyTimer}s remaining</span>
                  </span>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">System Status</div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-600 font-semibold">OPERATIONAL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Vehicles Passed"
            value={state?.cars_passed || 0}
            icon="🚗"
            color="blue"
          />
          <StatCard
            title="Average Wait Time"
            value={state?.avg_wait_time || 0}
            unit="sec"
            icon="⏱️"
            color="orange"
          />
          <StatCard
            title="Total Throughput" 
            value={metrics?.throughput || 0}
            unit="cars/min"
            icon="📊"
            color="green"
          />
          <StatCard
            title="Emergency Vehicles"
            value={metrics?.emergency_count || 0}
            unit="active"
            icon="🚨"
            color="purple"
          />
        </div>

        {/* Main Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Intersection View */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Live Intersection View
                </h2>
                <div className="flex items-center space-x-4">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    state?.signal === 'N' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    North: {state?.signal === 'N' ? 'OPEN' : 'CLOSED'}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    state?.signal === 'S' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    South: {state?.signal === 'S' ? 'OPEN' : 'CLOSED'}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    state?.signal === 'E' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    East: {state?.signal === 'E' ? 'OPEN' : 'CLOSED'}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    state?.signal === 'W' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    West: {state?.signal === 'W' ? 'OPEN' : 'CLOSED'}
                  </div>
                </div>
              </div>

              {/* Intersection Container */}
              <div className="relative w-full h-96 bg-gray-200 rounded-lg overflow-hidden border-2">
                
                {/* Road lanes with improved styling */}
                <div className="absolute inset-0">
                  {/* Horizontal road */}
                  <div className="absolute top-1/2 left-0 w-full h-20 bg-gray-700 transform -translate-y-1/2 shadow-inner">
                    {/* Lane dividers */}
                    <div className="absolute top-6 left-0 w-full h-0.5 bg-yellow-300"></div>
                    <div className="absolute bottom-6 left-0 w-full h-0.5 bg-yellow-300"></div>
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-yellow-400 transform -translate-y-1/2 opacity-80"></div>
                  </div>
                  
                  {/* Vertical road */}
                  <div className="absolute left-1/2 top-0 w-20 h-full bg-gray-700 transform -translate-x-1/2 shadow-inner">
                    {/* Lane dividers */}
                    <div className="absolute left-6 top-0 w-0.5 h-full bg-yellow-300"></div>
                    <div className="absolute right-6 top-0 w-0.5 h-full bg-yellow-300"></div>
                    <div className="absolute left-1/2 top-0 w-1 h-full bg-yellow-400 transform -translate-x-1/2 opacity-80"></div>
                  </div>
                  
                  {/* Intersection center */}
                  <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-gray-800 transform -translate-x-1/2 -translate-y-1/2 shadow-lg">
                    {/* Crosswalk patterns */}
                    <div className="absolute inset-1 bg-white opacity-20 rounded-sm"></div>
                  </div>
                </div>

                {/* Traffic Lights */}
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

                {/* Queue length indicators */}
                {state?.queues && Object.entries(state.queues).map(([lane, count]) => (
                  <div
                    key={lane}
                    className={`absolute text-xs font-bold text-white bg-gray-800 px-2 py-1 rounded shadow ${
                      lane === 'N' ? 'top-2 left-1/2 transform -translate-x-1/2' :
                      lane === 'S' ? 'bottom-2 right-1/2 transform translate-x-1/2' :
                      lane === 'E' ? 'right-2 top-1/2 transform -translate-y-1/2' :
                      'left-2 bottom-1/2 transform translate-y-1/2'
                    }`}
                  >
                    {lane}: {count}
                  </div>
                ))}
              </div>

              {/* Signal Timer */}
              {state?.signal_timer !== undefined && (
                <div className="mt-4 flex justify-center space-x-4">
                  <div className="bg-gray-800 text-white px-4 py-2 rounded-lg">
                    <span className="text-sm">
                      Current: {state.signal} | Next change in: {state.signal_duration - state.signal_timer}s
                    </span>
                  </div>
                  {state.emergencyActive && (
                    <div className="bg-red-600 text-white px-4 py-2 rounded-lg animate-pulse">
                      <span className="text-sm">EMERGENCY MODE</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Analytics Panel with new metrics */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Analytics
              </h2>
              
              {/* Quick Stats */}
              <div className="space-y-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium">Current Signal</div>
                  <div className="text-2xl font-bold text-blue-800">{state?.signal || 'None'}</div>
                  {state?.empty_roads?.includes(state?.signal) && (
                    <div className="text-xs text-gray-500 mt-1">⚠️ Empty Road</div>
                  )}
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-green-600 font-medium">Active Roads</div>
                  <div className="text-2xl font-bold text-green-800">
                    {state?.roads_with_traffic?.length || 0}/4
                  </div>
                  <div className="text-xs text-green-700 mt-1">
                    {state?.roads_with_traffic?.join(', ') || 'None'}
                  </div>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-sm text-orange-600 font-medium">Wait Time</div>
                  <div className="text-2xl font-bold text-orange-800">
                    {(state?.avg_wait_time || 0).toFixed(1)}s
                  </div>
                </div>
                
                {state?.emergencyActive && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="text-sm text-red-600 font-medium">Emergency Mode</div>
                    <div className="text-lg font-bold text-red-800">
                      {state.emergencyDirection} Lane
                    </div>
                    <div className="text-xs text-red-700 mt-1">Priority Active</div>
                  </div>
                )}
                
                {state?.postEmergencyMode && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="text-sm text-yellow-600 font-medium">Post-Emergency</div>
                    <div className="text-lg font-bold text-yellow-800">
                      Rotation Mode
                    </div>
                    <div className="text-xs text-yellow-700 mt-1">
                      {60 - (state.postEmergencyTimer || 0)}s remaining
                    </div>
                  </div>
                )}
              </div>
              
              <ChartPanel metrics={metrics} />
            </div>
          </div>
        </div>

        {/* Controls Panel */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-8 bg-white rounded-lg shadow-sm border p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">System Controls</h3>
                <button
                  onClick={() => setShowControls(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Data Source Toggle */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Data Source
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={switchToMock}
                      className={`px-4 py-2 text-sm font-medium rounded-lg ${
                        useMock
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Mock Data
                    </button>
                    <button
                      onClick={switchToBackend}
                      className={`px-4 py-2 text-sm font-medium rounded-lg ${
                        !useMock
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Live Backend
                    </button>
                  </div>
                </div>

                {/* Simulation Speed */}
                {useMock && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Simulation Speed: {simulationSpeed}x
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.1"
                      value={simulationSpeed}
                      onChange={(e) => setSpeed(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Actions
                  </label>
                  <div className="space-x-2">
                    {useMock && (
                      <button
                        onClick={resetSimulation}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Show Controls Button (when collapsed) */}
        {!showControls && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setShowControls(true)}
              className="px-6 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
            >
              Show Controls
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;