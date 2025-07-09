from django.contrib.gis.db import models
from django.contrib.auth.models import User

class Airport(models.Model):
    code = models.CharField(max_length=3, unique=True)
    name = models.CharField(max_length=100)
    location = models.PointField()

    def __str__(self):
        return self.name

class Pilot(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    rank = models.CharField(max_length=50)
    call_sign = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.user.get_full_name()

class Plane(models.Model):
    pilot = models.OneToOneField(Pilot, on_delete=models.SET_NULL, null=True, blank=True)
    model = models.CharField(max_length=100)
    tail_number = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=50, default='In Flight')
    
    # Route Information
    origin = models.ForeignKey(Airport, related_name='departures', on_delete=models.CASCADE)
    destination = models.ForeignKey(Airport, related_name='arrivals', on_delete=models.CASCADE)
    
    # Simulation Information
    location = models.PointField()
    altitude = models.FloatField(default=20000.0)
    bearing = models.FloatField(default=0.0)
    speed = models.FloatField(default=0.0) # km/s

    def __str__(self):
        return self.tail_number

class Command(models.Model):
    STATUS_CHOICES = [('pending', 'Pending'), ('accepted', 'Accepted'), ('rejected', 'Rejected')]
    
    plane = models.ForeignKey(Plane, on_delete=models.CASCADE)
    pilot = models.ForeignKey(Pilot, on_delete=models.CASCADE)
    message = models.TextField()
    target_location = models.PointField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Command for {self.plane.tail_number} - {self.status}"