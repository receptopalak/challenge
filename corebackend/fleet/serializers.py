from rest_framework_gis.serializers import GeoFeatureModelSerializer
from rest_framework_gis.fields import GeometryField
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Pilot, Plane, Command, Airport

class UserSerializer(serializers.ModelSerializer):
    """
    Presents user information in a simple way.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'is_staff']

class PilotSerializer(serializers.ModelSerializer):
    """
    Presents the Pilot model in the format expected by the frontend.
    """
    fullName = serializers.SerializerMethodField()
    callSign = serializers.CharField(source='call_sign')

    class Meta:
        model = Pilot
        # The `id` field is required for the frontend to select pilots.
        fields = ['id', 'fullName', 'callSign']

    def get_fullName(self, obj):
        """
        Returns the user's full name or username.
        """
        if obj.user:
            full_name = obj.user.get_full_name()
            # get_full_name may return an empty string, check this situation
            return full_name.strip() if full_name.strip() else obj.user.username
        return 'N/A'

class AirportSerializer(serializers.ModelSerializer):
    """
    Presents airport information.
    """
    class Meta:
        model = Airport
        fields = ['name', 'code']

class PlaneDetailSerializer(serializers.ModelSerializer):
    """
    Presents all details of a single aircraft with pilot and route information.
    Not derived from GeoFeatureModelSerializer because this is for a single object, not a list.
    """
    pilot = PilotSerializer(read_only=True)
    # We add pilot_id as a writable field to be able to update.
    # Thanks to `source='pilot'`, this field will be written to the `pilot` model field.
    pilot_id = serializers.PrimaryKeyRelatedField(
        queryset=Pilot.objects.all(), 
        source='pilot', 
        write_only=True,
        required=False,
        allow_null=True # Accept null value to be able to unassign pilot
    )
    origin = AirportSerializer(read_only=True)
    destination = AirportSerializer(read_only=True)
    location = serializers.SerializerMethodField() # GeoJSON formatında sunmak için

    class Meta:
        model = Plane
        fields = [
            'id', 'model', 'tail_number', 'status', 
            'altitude', 'bearing', 'speed', 
            'origin', 'destination', 'pilot', 'pilot_id', 'location' # Add pilot_id
        ]

    def get_location(self, obj):
        # PointField'ı GeoJSON formatında döndür
        return {
            'type': 'Point',
            'coordinates': [obj.location.x, obj.location.y]
        }

class PlaneFeatureSerializer(serializers.ModelSerializer):
    """Tek bir uçağı GeoJSON Feature formatında serialize eder."""
    pilot = PilotSerializer(read_only=True)
    speed_kmh = serializers.SerializerMethodField()

    class Meta:
        model = Plane
        fields = [
            'id', 'model', 'tail_number', 'altitude', 
            'bearing', 'speed_kmh', 'status', 'pilot'
        ]
        
    def get_speed_kmh(self, obj):
        return round(obj.speed * 3600)

    def to_representation(self, instance):
        """Objeyi GeoJSON Feature formatına çevirir."""
        # Standart `properties` alanını al
        properties = super().to_representation(instance)
        # GeoJSON Feature yapısını oluştur
        return {
            'type': 'Feature',
            'id': instance.pk,
            'geometry': {
                'type': 'Point',
                'coordinates': [instance.location.x, instance.location.y]
            },
            'properties': properties
        }

class CommandSerializer(serializers.ModelSerializer):
    """
    Used to read and create commands.
    """
    target_location = GeometryField()

    class Meta:
        model = Command
        fields = [
            'id', 'plane', 'pilot', 'message', 
            'target_location', 'status', 'created_at'
        ]
        read_only_fields = ('pilot', 'created_at') # Pilot and creation date are automatically assigned

class UserAdminSerializer(serializers.ModelSerializer):
    """
    Used to list and edit users in the management panel.
    Does not show the password.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'is_staff', 'is_active', 'date_joined']
        read_only_fields = ['date_joined']

class UserCreateAdminSerializer(serializers.ModelSerializer):
    """
    Used by admin to create new users.
    Makes password mandatory and saves it hashed.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'first_name', 'last_name', 'email', 'is_staff', 'is_active']
        extra_kwargs = {'password': {'write_only': True, 'required': True}}

    def create(self, validated_data):
        # set_password method properly hashes the password.
        user = User.objects.create_user(**validated_data)
        # Also create a Pilot profile for each newly created user.
        Pilot.objects.create(user=user, call_sign=user.username.upper())
        return user

class PasswordResetSerializer(serializers.Serializer):
    """
    Parola sıfırlama için basit bir serializer.
    """
    new_password = serializers.CharField(required=True, style={'input_type': 'password'})