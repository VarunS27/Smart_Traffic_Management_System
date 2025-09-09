import { motion } from 'framer-motion';

const StatCard = ({ title, value, unit, icon, color }) => {
  // Format the value to handle NaN and decimals
  const formattedValue = isNaN(value) 
    ? '0' 
    : Number.isInteger(value) 
      ? value.toString()
      : value.toFixed(2);

  return (
    <motion.div
      className={`bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between">
        <span className={`text-2xl ${icon ? '' : 'hidden'}`}>{icon}</span>
        <span className={`text-${color}-500 text-sm font-semibold uppercase`}>
          {title}
        </span>
      </div>
      <div className="mt-2 flex items-baseline">
        <span className="text-2xl font-bold text-gray-900">
          {formattedValue}
        </span>
        {unit && (
          <span className="ml-1 text-sm text-gray-600">
            {unit}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;