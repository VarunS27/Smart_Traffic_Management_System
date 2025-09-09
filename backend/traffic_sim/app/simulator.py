import random
import time
from collections import deque
from dataclasses import dataclass
from typing import Dict, List
import threading
from datetime import datetime, timedelta

@dataclass
class Car:
    """Represents a car with unique ID and arrival time"""
    id: int
    arrival_time: float
    direction: str
    
class TrafficLight:
    """Manages traffic light states and timing"""
    def __init__(self, ns_duration: int = 30, ew_duration: int = 30):
        self.ns_duration = ns_duration  # North-South green duration
        self.ew_duration = ew_duration  # East-West green duration
        self.current_state = "NS"  # Start with North-South green
        self.state_start_time = time.time()
        self.cycle_count = 0
        
    def get_current_state(self) -> str:
        """Returns current light state (NS or EW)"""
        elapsed = time.time() - self.state_start_time
        
        if self.current_state == "NS":
            if elapsed >= self.ns_duration:
                self._switch_to_ew()
        else:  # EW
            if elapsed >= self.ew_duration:
                self._switch_to_ns()
                
        return self.current_state
    
    def _switch_to_ew(self):
        """Switch to East-West green"""
        self.current_state = "EW"
        self.state_start_time = time.time()
        
    def _switch_to_ns(self):
        """Switch to North-South green"""
        self.current_state = "NS"
        self.state_start_time = time.time()
        self.cycle_count += 1
    
    def time_remaining(self) -> float:
        """Returns time remaining in current state"""
        elapsed = time.time() - self.state_start_time
        if self.current_state == "NS":
            return max(0, self.ns_duration - elapsed)
        else:
            return max(0, self.ew_duration - elapsed)

class IntersectionQueue:
    """Manages car queue for one direction"""
    def __init__(self, direction: str):
        self.direction = direction
        self.queue = deque()
        self.total_cars_served = 0
        self.total_wait_time = 0.0
        self.max_queue_length = 0
        
    def add_car(self, car: Car):
        """Add a car to the queue"""
        self.queue.append(car)
        self.max_queue_length = max(self.max_queue_length, len(self.queue))
        
    def serve_cars(self, num_cars: int, current_time: float) -> List[Car]:
        """Serve specified number of cars from queue"""
        served_cars = []
        for _ in range(min(num_cars, len(self.queue))):
            if self.queue:
                car = self.queue.popleft()
                wait_time = current_time - car.arrival_time
                self.total_wait_time += wait_time
                self.total_cars_served += 1
                served_cars.append(car)
        return served_cars
    
    def get_stats(self) -> Dict:
        """Get statistics for this queue"""
        avg_wait_time = (self.total_wait_time / self.total_cars_served 
                        if self.total_cars_served > 0 else 0)
        return {
            'direction': self.direction,
            'current_queue_length': len(self.queue),
            'total_cars_served': self.total_cars_served,
            'average_wait_time': avg_wait_time,
            'max_queue_length': self.max_queue_length,
            'total_wait_time': self.total_wait_time
        }

class TrafficIntersection:
    """Main intersection simulation class"""
    def __init__(self, 
                 ns_light_duration: int = 30,
                 ew_light_duration: int = 30,
                 cars_per_green: int = 8,
                 arrival_rate: float = 0.3):
        
        # Initialize components
        self.traffic_light = TrafficLight(ns_light_duration, ew_light_duration)
        self.cars_per_green = cars_per_green  # Cars that can pass per green light
        self.arrival_rate = arrival_rate  # Probability of car arrival per second
        
        # Initialize queues for each direction
        self.queues = {
            'N': IntersectionQueue('North'),
            'S': IntersectionQueue('South'),
            'E': IntersectionQueue('East'),
            'W': IntersectionQueue('West')
        }
        
        # Simulation state
        self.car_id_counter = 1
        self.simulation_start_time = time.time()
        self.running = False
        self.total_simulation_time = 0
        
    def generate_random_arrivals(self, current_time: float):
        """Generate random car arrivals for each direction"""
        for direction in ['N', 'S', 'E', 'W']:
            if random.random() < self.arrival_rate:
                car = Car(
                    id=self.car_id_counter,
                    arrival_time=current_time,
                    direction=direction
                )
                self.queues[direction].add_car(car)
                self.car_id_counter += 1
    
    def process_traffic_light(self, current_time: float):
        """Process cars based on current traffic light state"""
        light_state = self.traffic_light.get_current_state()
        
        if light_state == "NS":
            # Serve North and South directions
            self.queues['N'].serve_cars(self.cars_per_green, current_time)
            self.queues['S'].serve_cars(self.cars_per_green, current_time)
        else:  # EW
            # Serve East and West directions
            self.queues['E'].serve_cars(self.cars_per_green, current_time)
            self.queues['W'].serve_cars(self.cars_per_green, current_time)
    
    def get_simulation_stats(self) -> Dict:
        """Get comprehensive simulation statistics"""
        stats = {
            'simulation_time': self.total_simulation_time,
            'light_cycles_completed': self.traffic_light.cycle_count,
            'current_light_state': self.traffic_light.get_current_state(),
            'time_remaining_in_state': self.traffic_light.time_remaining(),
            'queue_stats': {}
        }
        
        # Get stats for each direction
        total_cars_in_system = 0
        total_cars_served = 0
        total_wait_time = 0
        
        for direction, queue in self.queues.items():
            queue_stats = queue.get_stats()
            stats['queue_stats'][direction] = queue_stats
            total_cars_in_system += queue_stats['current_queue_length']
            total_cars_served += queue_stats['total_cars_served']
            total_wait_time += queue_stats['total_wait_time']
        
        # Overall system stats
        stats['total_cars_in_system'] = total_cars_in_system
        stats['total_cars_served'] = total_cars_served
        stats['overall_avg_wait_time'] = (total_wait_time / total_cars_served 
                                        if total_cars_served > 0 else 0)
        
        return stats
    
    def print_status(self):
        """Print current intersection status"""
        stats = self.get_simulation_stats()
        
        print(f"\n{'='*60}")
        print(f"TRAFFIC INTERSECTION SIMULATION STATUS")
        print(f"{'='*60}")
        print(f"Simulation Time: {stats['simulation_time']:.1f} seconds")
        print(f"Light Cycles Completed: {stats['light_cycles_completed']}")
        print(f"Current Light State: {stats['current_light_state']} "
              f"(Time Remaining: {stats['time_remaining_in_state']:.1f}s)")
        print(f"Total Cars in System: {stats['total_cars_in_system']}")
        print(f"Total Cars Served: {stats['total_cars_served']}")
        print(f"Overall Average Wait Time: {stats['overall_avg_wait_time']:.2f}s")
        
        print(f"\nQUEUE STATUS:")
        print(f"{'Direction':<10} {'Queue':<8} {'Served':<8} {'Avg Wait':<10} {'Max Queue':<10}")
        print(f"{'-'*50}")
        
        for direction in ['N', 'S', 'E', 'W']:
            queue_stats = stats['queue_stats'][direction]
            direction_name = {'N': 'North', 'S': 'South', 'E': 'East', 'W': 'West'}[direction]
            print(f"{direction_name:<10} "
                  f"{queue_stats['current_queue_length']:<8} "
                  f"{queue_stats['total_cars_served']:<8} "
                  f"{queue_stats['average_wait_time']:<10.2f} "
                  f"{queue_stats['max_queue_length']:<10}")
    
    def run_simulation(self, duration: int = 120, status_interval: int = 10):
        """Run the traffic simulation for specified duration"""
        print(f"Starting traffic intersection simulation for {duration} seconds...")
        print(f"Configuration:")
        print(f"- NS Light Duration: {self.traffic_light.ns_duration}s")
        print(f"- EW Light Duration: {self.traffic_light.ew_duration}s")
        print(f"- Cars per Green Light: {self.cars_per_green}")
        print(f"- Arrival Rate: {self.arrival_rate} cars/second/direction")
        
        self.running = True
        self.simulation_start_time = time.time()
        start_time = self.simulation_start_time
        last_status_time = start_time
        
        try:
            while self.running and (time.time() - start_time) < duration:
                current_time = time.time()
                self.total_simulation_time = current_time - start_time
                
                # Generate random car arrivals
                self.generate_random_arrivals(current_time)
                
                # Process traffic light and serve cars
                self.process_traffic_light(current_time)
                
                # Print status at intervals
                if current_time - last_status_time >= status_interval:
                    self.print_status()
                    last_status_time = current_time
                
                # Small delay to control simulation speed
                time.sleep(0.1)
                
        except KeyboardInterrupt:
            print("\nSimulation interrupted by user.")
        
        finally:
            self.running = False
            print(f"\n{'='*60}")
            print("FINAL SIMULATION RESULTS")
            self.print_status()
            
            # Calculate efficiency metrics
            stats = self.get_simulation_stats()
            throughput = stats['total_cars_served'] / self.total_simulation_time * 60  # cars per minute
            print(f"\nPERFORMANCE METRICS:")
            print(f"Throughput: {throughput:.1f} cars/minute")
            print(f"System Utilization: {stats['total_cars_in_system']} cars waiting")

# Example usage and testing
if __name__ == "__main__":
    # Create intersection with custom parameters
    intersection = TrafficIntersection(
        ns_light_duration=25,      # North-South green duration
        ew_light_duration=30,      # East-West green duration  
        cars_per_green=6,          # Cars that can pass per green
        arrival_rate=0.4           # Car arrival probability per second
    )
    
    # Run simulation for 60 seconds with status updates every 10 seconds
    intersection.run_simulation(duration=60, status_interval=10)
    
    # You can also run shorter simulations or adjust parameters
    print(f"\n{'='*60}")
    print("RUNNING SECOND SIMULATION WITH DIFFERENT PARAMETERS")
    
    # Higher traffic scenario
    busy_intersection = TrafficIntersection(
        ns_light_duration=20,
        ew_light_duration=25,
        cars_per_green=5,
        arrival_rate=0.6  # Higher arrival rate
    )
    
    busy_intersection.run_simulation(duration=45, status_interval=15)