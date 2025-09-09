import MainLayout from '../layout/MainLayout';

const About = () => {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            About Smart Traffic Management System
          </h1>
          
          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              System Overview
            </h2>
            <p className="text-gray-600 mb-6">
              The Smart Traffic Management System (STMS) is an intelligent intersection 
              control solution that uses real-time data analysis and adaptive algorithms 
              to optimize traffic flow and reduce wait times.
            </p>

            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Key Features
            </h2>
            <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
              <li>Real-time traffic monitoring and visualization</li>
              <li>Adaptive signal timing based on queue lengths</li>
              <li>Performance analytics and historical data</li>
              <li>Multi-lane intersection support</li>
              <li>Emergency vehicle priority handling</li>
              <li>Weather-aware signal optimization</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Technical Architecture
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">Frontend</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• React with Vite</li>
                  <li>• Tailwind CSS styling</li>
                  <li>• Framer Motion animations</li>
                  <li>• Recharts for data visualization</li>
                </ul>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">Backend</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Python FastAPI server</li>
                  <li>• Real-time sensor integration</li>
                  <li>• Machine learning optimization</li>
                  <li>• SQLite data persistence</li>
                </ul>
              </div>
            </div>

            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Performance Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">35%</div>
                <div className="text-sm text-blue-800">Reduced Wait Times</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">28%</div>
                <div className="text-sm text-green-800">Improved Throughput</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">99.9%</div>
                <div className="text-sm text-purple-800">System Uptime</div>
              </div>
            </div>

            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Development Team
            </h2>
            <p className="text-gray-600">
              This system was developed as part of an intelligent transportation 
              research project, focusing on practical applications of AI in urban 
              traffic management.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default About;