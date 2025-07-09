from django.contrib.gis import admin
from .models import Airport, Pilot, Plane, Command

@admin.register(Airport)
class AirportAdmin(admin.GISModelAdmin):
    """
    Airport model for map display.
    """
    list_display = ('name', 'code')
    # Map widget is included by default.

@admin.register(Pilot)
class PilotAdmin(admin.ModelAdmin):
    list_display = ('user', 'rank', 'call_sign')
    search_fields = ('user__username', 'user__first_name', 'call_sign')

@admin.register(Plane)
class PlaneAdmin(admin.GISModelAdmin):
    """
    Plane model for map display.
    """
    list_display = ('tail_number', 'model', 'pilot', 'origin', 'destination')
    list_filter = ('model', 'status')
    search_fields = ('tail_number', 'pilot__user__username')
    # Location field for map
    gis_widget_kwargs = {
        "default_lon": 35,
        "default_lat": 39,
        "default_zoom": 5,
    }

@admin.register(Command)
class CommandAdmin(admin.GISModelAdmin):
    """
    Command model for map display.
    """
    list_display = ('id', 'plane', 'pilot', 'status', 'created_at')
    list_filter = ('status',)
    readonly_fields = ('created_at',)
        # Location field for map
    gis_widget_kwargs = {
        "default_lon": 35,
        "default_lat": 39,
        "default_zoom": 5,
    }