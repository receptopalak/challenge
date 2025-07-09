import time
import asyncio
import random
import math
from django.core.management.base import BaseCommand
from channels.layers import get_channel_layer
from asgiref.sync import sync_to_async
from django.db import transaction
from fleet.models import Plane, Airport

# --- HELPER FUNCTIONS ---
def get_random_item(items):
    """Returns a random object from a given list or queryset."""
    if not items:
        return None
    return random.choice(list(items))

def calculate_bearing(lat1, lon1, lat2, lon2):
    """Calculates the initial bearing between two coordinates."""
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    dLon = lon2_rad - lon1_rad
    x = math.cos(lat2_rad) * math.sin(dLon)
    y = math.cos(lat1_rad) * math.sin(lat2_rad) - math.sin(lat1_rad) * math.cos(lat2_rad) * math.cos(dLon)
    
    initial_bearing = math.atan2(x, y)
    initial_bearing = math.degrees(initial_bearing)
    return (initial_bearing + 360) % 360

def calculate_new_position(lat, lon, bearing, distance_km):
    """Calculates a new point from a given point in a specific direction and distance."""
    R = 6371  # Earth's radius (km)
    lat_rad = math.radians(lat)
    lon_rad = math.radians(lon)
    bearing_rad = math.radians(bearing)

    new_lat_rad = math.asin(math.sin(lat_rad) * math.cos(distance_km / R) +
                            math.cos(lat_rad) * math.sin(distance_km / R) * math.cos(bearing_rad))
    new_lon_rad = lon_rad + math.atan2(math.sin(bearing_rad) * math.sin(distance_km / R) * math.cos(lat_rad),
                                       math.cos(distance_km / R) - math.sin(lat_rad) * math.sin(new_lat_rad))

    return (math.degrees(new_lat_rad), math.degrees(new_lon_rad))

@sync_to_async
def update_plane_positions_in_db():
    """
    Updates the positions of all aircraft in the database.
    This function is designed to run in an asynchronous environment.
    """
    time_delta_in_seconds = 2
    planes_to_update = []
    
    # Efficiently fetch all aircraft and related airport data in a single query
    all_planes = list(Plane.objects.select_related('origin', 'destination').all())
    all_airports = list(Airport.objects.all())

    if not all_airports:
        return []

    for plane in all_planes:
        step_distance = plane.speed * time_delta_in_seconds
        
        # Calculate the bearing from the plane's current location to its destination
        bearing = calculate_bearing(plane.location.y, plane.location.x, plane.destination.location.y, plane.destination.location.x)
        plane.bearing = bearing
        
        # Calculate new position
        new_lat, new_lon = calculate_new_position(plane.location.y, plane.location.x, plane.bearing, step_distance)
        
        # Check if the destination has been reached
        # (With a simple approach, if the new location "passes over" the target, it is considered to have reached the target)
        current_dest_bearing = calculate_bearing(new_lat, new_lon, plane.destination.location.y, plane.destination.location.x)
        if abs(current_dest_bearing - plane.bearing) > 90: # If direction deviates more than 90 degrees, we have passed the target
            plane.location.y = plane.destination.location.y
            plane.location.x = plane.destination.location.x
            
            # Determine a new route
            plane.origin = plane.destination
            new_dest = get_random_item(all_airports)
            while new_dest and new_dest.code == plane.origin.code:
                new_dest = get_random_item(all_airports)
            
            if new_dest:
                plane.destination = new_dest
            else:
                # Skip simulation if no airport is left
                continue
        else:
            plane.location.y = new_lat
            plane.location.x = new_lon
        
        planes_to_update.append(plane)
    
    # Update all aircraft with a single database operation (critical for performance)
    if planes_to_update:
        Plane.objects.bulk_update(planes_to_update, ['location', 'bearing', 'origin', 'destination'])

    # Prepare the WebSocket payload
    payload = [
        {'id': p.id, 'coordinates': [p.location.x, p.location.y], 'bearing': p.bearing} 
        for p in planes_to_update
    ]
    return payload


class Command(BaseCommand):
    help = 'Runs the real-time plane location simulation.'

    async def _simulation_loop(self):
        self.stdout.write(self.style.SUCCESS("Starting real-time simulation engine..."))
        channel_layer = get_channel_layer()

        if not channel_layer:
            self.stdout.write(self.style.ERROR("Cannot get channel layer. Is Redis running and configured?"))
            return

        while True:
            try:
                updated_locations = await update_plane_positions_in_db()

                if updated_locations:
                    await channel_layer.group_send(
                        'fleet_updates',
                        {
                            'type': 'broadcast.message',
                            'payload': {
                                'type': 'plane_locations',
                                'data': updated_locations
                            }
                        }
                    )
                
                await asyncio.sleep(2)
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"An error occurred in simulation loop: {e}"))
                await asyncio.sleep(5)

    def handle(self, *args, **kwargs):
        try:
            asyncio.run(self._simulation_loop())
        except KeyboardInterrupt:
            self.stdout.write(self.style.SUCCESS("Simulation stopped by user."))