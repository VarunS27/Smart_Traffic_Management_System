import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ChartPanel = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-500">Loading charts...</p>
        </div>
      </div>
    );
  }

  // Prepare wait time history data
  const waitTimeData = metrics.wait_time_history || [];
  
  // Prepare queue data for bar chart
  const queueData = metrics.queue_history?.slice(-1)[0]?.queues || { N: 0, S: 0, E: 0, W: 0 };
  const queueChartData = Object.entries(queueData).map(([lane, count]) => ({
    lane,
    count,
    color: lane === 'N' ? '#3B82F6' : lane === 'S' ? '#10B981' : lane === 'E' ? '#F59E0B' : '#EF4444'
  }));

  return (
    <div className="space-y-6">
      {/* Wait Time Chart */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Average Wait Time</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={waitTimeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="time" 
              stroke="#666"
              fontSize={12}
            />
            <YAxis 
              stroke="#666"
              fontSize={12}
              label={{ value: 'Wait Time (s)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #ddd',
                borderRadius: '6px'
              }}
              formatter={(value) => [`${value.toFixed(1)}s`, 'Wait Time']}
            />
            <Line 
              type="monotone" 
              dataKey="wait_time" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, fill: '#1D4ED8' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Queue Length Chart */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Current Queue Lengths</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={queueChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="lane" 
              stroke="#666"
              fontSize={12}
            />
            <YAxis 
              stroke="#666"
              fontSize={12}
              label={{ value: 'Cars', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #ddd',
                borderRadius: '6px'
              }}
              formatter={(value, name, props) => [
                `${value} cars`, 
                `Lane ${props.payload.lane}`
              ]}
            />
            <Bar 
              dataKey="count" 
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Traffic Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Cars:</span>
            <span className="ml-2 font-medium">{metrics.total_cars || 0}</span>
          </div>
          <div>
            <span className="text-gray-600">Avg Trip Time:</span>
            <span className="ml-2 font-medium">{(metrics.avg_trip_time || 0).toFixed(1)}s</span>
          </div>
          <div>
            <span className="text-gray-600">Throughput:</span>
            <span className="ml-2 font-medium">{(metrics.throughput || 0).toFixed(1)} cars/min</span>
          </div>
          <div>
            <span className="text-gray-600">Active Queues:</span>
            <span className="ml-2 font-medium">
              {Object.values(queueData).reduce((sum, count) => sum + count, 0)} cars
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartPanel;