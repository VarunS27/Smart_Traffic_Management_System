from .simulator import TrafficSimulator
from .metrics import MetricsCollector
from .config import Config
import time
import json
import sys

def main():
    simulator = TrafficSimulator()
    metrics_collector = MetricsCollector()
    
    try:
        while True:
            # Read command from Node.js
            command = input().strip()
            
            if command:
                result = simulator.handle_command(command)
                if result:
                    print(json.dumps(result))
                continue
            
            # Regular simulation step
            simulator.step()
            metrics = metrics_collector.collect(simulator)
            time.sleep(1 / Config.SIMULATION_SPEED)
            
    except KeyboardInterrupt:
        print("Simulation stopped")
        sys.exit(0)

if __name__ == "__main__":
    main()