from dataclasses import dataclass
from typing import List, Optional
from enum import Enum
import time

class Direction(Enum):
    NORTH = 'N'
    SOUTH = 'S'
    EAST = 'E'
    WEST = 'W'

@dataclass
class Vehicle:
    id: str
    direction: Direction
    arrival_time: float
    is_emergency: bool = False
    position: float = 0.0
    
class TrafficSignal:
    def __init__(self):
        self.current_direction = Direction.NORTH
        self.timer = 0
        self.duration = 30
        
    def update(self, queue_lengths: dict):
        self.timer += 1
        if self.timer >= self.duration:
            self._switch_signal(queue_lengths)
            
    def _switch_signal(self, queue_lengths: dict):
        directions = list(Direction)
        current_idx = directions.index(self.current_direction)
        self.current_direction = directions[(current_idx + 1) % len(directions)]
        self.timer = 0