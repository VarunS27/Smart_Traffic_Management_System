import { motion } from 'framer-motion';

const TrafficLight = ({ direction, signal, emergencyActive = false }) => {
  const positions = {
    N: { top: '15%', left: '46%' },
    S: { bottom: '15%', right: '46%' },
    E: { right: '15%', top: '46%' },
    W: { left: '15%', bottom: '46%' }
  };

  const position = positions[direction];
  
  // Determine if this direction should be green
  const isGreen = signal === direction || (emergencyActive && signal.includes(direction));

  return (
    <div 
      className="absolute z-20"
      style={position}
    >
      <div className="bg-gray-900 rounded-lg p-1.5 shadow-lg border border-gray-700">
        <div className="flex flex-col space-y-1">
          {/* Red light */}
          <motion.div
            className={`w-3 h-3 rounded-full ${
              !isGreen ? 'bg-red-500 shadow-red-400' : 'bg-red-900'
            }`}
            animate={{
              boxShadow: !isGreen ? '0 0 10px rgba(239, 68, 68, 0.9)' : '0 0 2px rgba(153, 27, 27, 0.5)'
            }}
            transition={{ duration: 0.3 }}
          />
          
          {/* Yellow light */}
          <div className={`w-3 h-3 rounded-full ${
            emergencyActive ? 'bg-yellow-500 animate-pulse' : 'bg-yellow-900'
          }`} />
          
          {/* Green light */}
          <motion.div
            className={`w-3 h-3 rounded-full ${
              isGreen ? 'bg-green-500 shadow-green-400' : 'bg-green-900'
            }`}
            animate={{
              boxShadow: isGreen ? '0 0 10px rgba(34, 197, 94, 0.9)' : '0 0 2px rgba(20, 83, 45, 0.5)'
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
      
      {/* Direction label */}
      <div className="text-xs text-center mt-1 text-gray-700 font-bold bg-white px-1 rounded">
        {direction}
      </div>
      
      {/* Emergency indicator */}
      {emergencyActive && signal.includes(direction) && (
        <motion.div 
          className="absolute -top-2 -right-2 w-3 h-3 bg-red-500 rounded-full"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )}
    </div>
  );
};

export default TrafficLight;