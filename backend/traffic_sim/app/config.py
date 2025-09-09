class Config:
    SIMULATION_SPEED = 1.0
    MAX_VEHICLES = 100
    INTERSECTION_SIZE = 4
    SIGNAL_TIMING = {
        'min_duration': 20,
        'max_duration': 60,
        'default_duration': 30
    }
    
    # API configurations
    API_HOST = 'localhost'
    API_PORT = 5000