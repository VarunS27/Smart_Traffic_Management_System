import { motion } from 'framer-motion';

const StatCard = ({ title, value, unit, delta, icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900'
  };

  const getDeltaColor = (delta) => {
    if (delta > 0) return 'text-green-600';
    if (delta < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <motion.div
      className={`p-4 rounded-lg border-2 shadow-sm ${colorClasses[color]}`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-2xl font-bold mt-1">
            {typeof value === 'number' ? value.toFixed(1) : value}
            {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
          </p>
          
          {delta !== undefined && (
            <div className={`text-xs mt-1 flex items-center ${getDeltaColor(delta)}`}>
              <span className="mr-1">
                {delta > 0 ? '↗' : delta < 0 ? '↘' : '→'}
              </span>
              {Math.abs(delta).toFixed(1)}% from last period
            </div>
          )}
        </div>
        
        {icon && (
          <div className="ml-3 opacity-75">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;