import { motion } from 'framer-motion';

const Car = ({ id, lane, position, type }) => {
  // Calculate position and rotation based on lane
  const getStyles = () => {
    const baseStyles = {
      position: 'absolute',
      width: '12px',
      height: '20px',
    };

    switch (lane) {
      case 'N':
        return {
          ...baseStyles,
          left: '50%',
          top: `${position}%`,
          transform: 'translateX(-50%)',
        };
      case 'S':
        return {
          ...baseStyles,
          left: '50%',
          bottom: `${position}%`,
          transform: 'translateX(-50%) rotate(180deg)',
        };
      case 'E':
        return {
          ...baseStyles,
          top: '50%',
          right: `${position}%`,
          transform: 'translateY(-50%) rotate(90deg)',
        };
      case 'W':
        return {
          ...baseStyles,
          top: '50%',
          left: `${position}%`,
          transform: 'translateY(-50%) rotate(-90deg)',
        };
      default:
        return baseStyles;
    }
  };

  return (
    <motion.div
      initial={getStyles()}
      animate={getStyles()}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1 }}
      className={`${
        type === 'emergency' ? 'bg-red-500' : 'bg-blue-500'
      } rounded shadow-sm`}
    >
      {type === 'emergency' && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      )}
    </motion.div>
  );
};

export default Car;