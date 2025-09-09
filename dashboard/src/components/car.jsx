import { motion } from 'framer-motion';

const Car = ({ id, lane, position, speed, type = 'normal' }) => {
  // Calculate position based on lane and progress
  const getPosition = () => {
    const basePositions = {
      N: { x: 47, y: 85 - (position * 0.65) }, // Coming from top, moving down
      S: { x: 53, y: 15 + (position * 0.65) }, // Coming from bottom, moving up
      E: { x: 15 + (position * 0.65), y: 47 }, // Coming from left, moving right
      W: { x: 85 - (position * 0.65), y: 53 }  // Coming from right, moving left
    };
    return basePositions[lane] || { x: 50, y: 50 };
  };

  const pos = getPosition();

  // Car colors based on type
  const getCarColor = () => {
    switch(type) {
      case 'ambulance':
        return 'bg-white border-2 border-red-500';
      case 'police':
        return 'bg-blue-600 border-2 border-white';
      case 'fire':
        return 'bg-red-600 border-2 border-yellow-400';
      default:
        const colors = ['bg-blue-600', 'bg-red-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-gray-600'];
        return colors[id % colors.length];
    }
  };

  // Car size based on type
  const getCarSize = () => {
    if (type === 'ambulance' || type === 'fire') {
      return lane === 'N' || lane === 'S' ? 'w-4 h-6' : 'w-6 h-4';
    }
    return lane === 'N' || lane === 'S' ? 'w-3 h-4' : 'w-4 h-3';
  };

  return (
    <motion.div
      key={id}
      className={`absolute ${getCarSize()} ${getCarColor()} rounded-sm shadow-lg z-10 ${
        lane === 'N' || lane === 'S' ? '' : ''
      } flex items-center justify-center`}
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
      }}
      animate={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
      }}
      transition={{
        duration: 0.3,
        ease: "linear"
      }}
      title={`${type === 'normal' ? 'Car' : type.toUpperCase()} ${id} - Lane ${lane} - Speed: ${speed?.toFixed(1) || 0}`}
    >
      {/* Car body details */}
      <div className="w-full h-full bg-inherit rounded-sm relative">
        {/* Windows */}
        <div className={`absolute bg-gray-300 ${
          lane === 'N' || lane === 'S' 
            ? 'top-1 left-0.5 right-0.5 h-1' 
            : 'left-1 top-0.5 bottom-0.5 w-1'
        } rounded-xs`}></div>
        
        {/* Emergency vehicle indicators */}
        {type === 'ambulance' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></div>
          </div>
        )}
        {type === 'police' && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
            <div className="w-1 h-0.5 bg-blue-300 animate-pulse"></div>
          </div>
        )}
        {type === 'fire' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Car;