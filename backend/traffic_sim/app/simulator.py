from .models import Vehicle, Direction, TrafficSignal
from .config import Config
import random
import time

class TrafficSimulator:
    def __init__(self):
        self.vehicles = []
        self.signal = TrafficSignal()
        self.stats = {
            'total_vehicles': 0,
            'avg_wait_time': 0,
            'emergency_count': 0
        }
        
    def step(self):
        # Generate new vehicles
        self._generate_vehicles()
        
        # Update signal
        queue_lengths = self._get_queue_lengths()
        self.signal.update(queue_lengths)
        
        # Move vehicles
        self._update_vehicles()
        
        # Update statistics
        self._update_stats()
        
    def _generate_vehicles(self):
        for direction in Direction:
            if random.random() < 0.3:
                vehicle = Vehicle(
                    id=f"{time.time()}_{direction.value}",
                    direction=direction,
                    arrival_time=time.time(),
                    is_emergency=random.random() < 0.05
                )
                self.vehicles.append(vehicle)
                
    def _update_vehicles(self):
        updated_vehicles = []
        current_time = time.time()
        
        for vehicle in self.vehicles:
            # Move vehicles if they have green light or are emergency vehicles
            if (vehicle.direction == self.signal.current_direction or 
                vehicle.is_emergency):
                vehicle.position += 1
                
                # Vehicle passes through intersection
                if vehicle.position >= 100:
                    # Update statistics
                    self.stats['total_vehicles'] += 1
                    wait_time = current_time - vehicle.arrival_time
                    self.stats['avg_wait_time'] = (
                        (self.stats['avg_wait_time'] * (self.stats['total_vehicles'] - 1) + 
                         wait_time) / self.stats['total_vehicles']
                    )
                    continue
                    
            updated_vehicles.append(vehicle)
        
        self.vehicles = updated_vehicles
    
    def _get_queue_lengths(self):
        return {d: len([v for v in self.vehicles if v.direction == d]) 
                for d in Direction}
    
    def handle_command(self, command):
        if command == 'get_state':
            return {
                'vehicles': [vars(v) for v in self.vehicles],
                'signal': {
                    'current': self.signal.current_direction.value,
                    'timer': self.signal.timer,
                    'duration': self.signal.duration
                },
                'queues': self._get_queue_lengths()
            }
        elif command == 'get_metrics':
            return self.stats
        elif command.startswith('set_speed'):
            speed = float(command.split()[1])
            Config.SIMULATION_SPEED = speed
        elif command == 'reset':
            self.__init__()