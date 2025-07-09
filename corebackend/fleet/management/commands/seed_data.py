import random
import time
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group
from django.contrib.gis.geos import Point
from django.db import transaction, IntegrityError
from fleet.models import Airport, Pilot, Plane

# --- CONSTANT DATA (No changes) ---
ENGLISH_FIRST_NAMES = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Christopher", "Charles", "Daniel", "Matthew", "Anthony", "Mark", "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth"]
ENGLISH_LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson"]
RANKS = ["Lieutenant", "First Lieutenant", "Captain", "Major"]
PLANE_MODELS = ['Bayraktar TB2', 'Akinci', 'Kizilelma', 'Anka', 'Aksungur']
AIRPORTS_DATA = [
            {"code": "IST", "name": "Istanbul", "lat": 41.2753, "lon": 28.7519},
    {"code": "ESB", "name": "Ankara", "lat": 40.1281, "lon": 32.9951},
            {"code": "ADB", "name": "Izmir", "lat": 38.2924, "lon": 27.1569},
    {"code": "AYT", "name": "Antalya", "lat": 36.8987, "lon": 30.8005},
    {"code": "ADA", "name": "Adana", "lat": 36.9822, "lon": 35.2804},
    {"code": "TZX", "name": "Trabzon", "lat": 40.9951, "lon": 39.7897},
            {"code": "DIY", "name": "Diyarbakir", "lat": 37.8938, "lon": 40.2015},
    {"code": "ERZ", "name": "Erzurum", "lat": 39.9565, "lon": 41.1701},
    {"code": "VAN", "name": "Van", "lat": 38.4682, "lon": 43.3323},
    {"code": "GZT", "name": "Gaziantep", "lat": 36.9472, "lon": 37.4789},
    {"code": "KYA", "name": "Konya", "lat": 37.9790, "lon": 32.5619}
]
TURKEY_BOUNDS = {"minLat": 36, "maxLat": 42, "minLon": 26, "maxLon": 45}

def get_random_item(arr):
    return random.choice(arr)

def get_random_coord(min_val, max_val):
    return random.uniform(min_val, max_val)

class Command(BaseCommand):
    help = 'Seeds the database with initial mock data if it is empty.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=10000,
            help='Specifies the number of users, pilots, and planes to create.'
        )

    def handle(self, *args, **kwargs):
        count = kwargs['count']
        start_time = time.time()
        if Plane.objects.exists() or User.objects.count() > 1:
            self.stdout.write(self.style.SUCCESS('Database already contains data. Skipping seeding.'))
            return

        self.stdout.write(f'Database is empty. Seeding {count} records... This may take a few minutes.')

        try:
            with transaction.atomic():
                # Create groups
                self.stdout.write('Step 1: Creating user groups...')
                Group.objects.get_or_create(name='Admins')
                pilots_group, _ = Group.objects.get_or_create(name='Pilots')
                self.stdout.write(self.style.SUCCESS('Groups created.'))
                
                # Create airports
                self.stdout.write('Step 2: Creating airports...')
                airports = [Airport.objects.create(code=a['code'], name=a['name'], location=Point(a['lon'], a['lat'])) for a in AIRPORTS_DATA]
                self.stdout.write(self.style.SUCCESS(f'{len(airports)} airports created.'))

                # Create `count` number of Users
                self.stdout.write(f'Step 3: Generating {count} User objects in memory...')
                users_to_create = []
                for i in range(1, count + 1):
                    username = f'pilot{i}'
                    user = User(username=username, first_name=get_random_item(ENGLISH_FIRST_NAMES), last_name=get_random_item(ENGLISH_LAST_NAMES))
                    user.set_password('12345')
                    users_to_create.append(user)
                
                self.stdout.write(f'Bulk creating {count} Users...')
                # batch_size optimizes memory usage by allowing Django to process data in chunks.
                User.objects.bulk_create(users_to_create, batch_size=1000)
                self.stdout.write(self.style.SUCCESS('Users created.'))
                
                # PostgreSQL fills the PKs to the objects in the `users_to_create` list after `bulk_create`.
                # We can use these objects to perform subsequent steps without querying the database again.

                # Add users to 'Pilots' group in bulk (Biggest optimization here)
                self.stdout.write(f'Step 4: Assigning {count} Users to Pilot group...')
                UserGroup = User.groups.through
                user_groups = [
                    UserGroup(user_id=user.pk, group_id=pilots_group.pk)
                    for user in users_to_create
                ]
                UserGroup.objects.bulk_create(user_groups, batch_size=1000)
                self.stdout.write(self.style.SUCCESS('Users assigned to group.'))

                # Create `count` number of Pilots (without reading from database, using the user list in memory)
                self.stdout.write(f'Step 5: Generating and creating {count} Pilot objects...')
                pilots_to_create = [
                    Pilot(user=user, rank=get_random_item(RANKS), call_sign=f'Asena-{user.pk}')
                    for user in users_to_create
                ]
                Pilot.objects.bulk_create(pilots_to_create, batch_size=1000)
                self.stdout.write(self.style.SUCCESS('Pilots created.'))

                # Create `count` number of Aircraft (without reading from database, using the pilot list in memory)
                self.stdout.write(f'Step 6: Generating and creating {count} Plane objects...')
                # The PKs of objects in the `pilots_to_create` list will also be filled after `bulk_create`.
                planes_to_create = []
                for pilot in pilots_to_create:
                    origin = get_random_item(airports)
                    destination = get_random_item([a for a in airports if a.code != origin.code])
                    planes_to_create.append(Plane(
                        pilot=pilot, model=get_random_item(PLANE_MODELS), tail_number=f'TC-BYK-{pilot.pk:04d}',
                        origin=origin, destination=destination,
                        location=Point(get_random_coord(TURKEY_BOUNDS['minLon'], TURKEY_BOUNDS['maxLon']), get_random_coord(TURKEY_BOUNDS['minLat'], TURKEY_BOUNDS['maxLat'])),
                        speed=random.uniform(200, 400) / 3600
                    ))
                Plane.objects.bulk_create(planes_to_create, batch_size=1000)
                self.stdout.write(self.style.SUCCESS('Planes created.'))

        except IntegrityError as e:
            self.stdout.write(self.style.ERROR(f'An integrity error occurred: {e}'))
            self.stdout.write(self.style.ERROR('This might happen if the database was not completely empty. Try resetting the database.'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'An unexpected error occurred: {e}'))

        end_time = time.time()
        self.stdout.write(self.style.SUCCESS(f'Script finished in {end_time - start_time:.2f} seconds.'))