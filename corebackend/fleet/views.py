from rest_framework import viewsets, permissions, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db.models import Q # Import Q object
from .models import Plane, Command, Pilot
from .serializers import (
    PlaneFeatureSerializer, PlaneDetailSerializer, CommandSerializer, PilotSerializer, 
    UserSerializer, UserAdminSerializer, UserCreateAdminSerializer, PasswordResetSerializer
)
from .permissions import IsAdminOrReadOnly, IsPilotOwner, IsAdminUser
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

class UserAdminViewSet(viewsets.ModelViewSet):
    """
    User management endpoint for administrators.
    Only admins can access.
    """
    queryset = User.objects.all().order_by('-date_joined')
    permission_classes = [IsAdminUser]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateAdminSerializer
        return UserAdminSerializer

    @action(detail=True, methods=['post'], url_path='set-password')
    def set_password(self, request, pk=None):
        """
        Resets a user's password.
        """
        user = self.get_object()
        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'status': 'password set'})
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserDetailView(generics.RetrieveAPIView):
    """
    Returns details of the requesting (logged in) user.
    Endpoint: /api/users/me/
    """
    queryset = User.objects.all() # Adding queryset is a good practice
    serializer_class = UserSerializer

    def get_object(self):
        # Add print statements for debugging
        user = self.request.user
        print("--- UserDetailView ---")
        print(f"Request User: {user}")
        print(f"User Type: {type(user)}")
        print(f"Is Authenticated: {user.is_authenticated}")
        print("----------------------")
        
        # This view always returns the requesting user
        return user

class PilotListView(generics.ListAPIView):
    """
    Lists pilots.
    - By default, only lists those who are available (not assigned to an aircraft).
    - If `?for_plane_id=<id>` parameter is given, it also includes the pilot
      already assigned to that aircraft in addition to available pilots.
    """
    serializer_class = PilotSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        plane_id = self.request.query_params.get('for_plane_id')
        
        # Base query: Available pilots
        query = Q(plane__isnull=True)

        if plane_id:
            try:
                # If an aircraft ID is given, include that aircraft's pilot in the query
                plane = Plane.objects.get(pk=plane_id)
                if plane.pilot:
                    query |= Q(pk=plane.pilot.pk)
            except Plane.DoesNotExist:
                # If aircraft is not found, return only available ones
                pass
        
        return Pilot.objects.filter(query).select_related('user').distinct()


class PlaneViewSet(viewsets.ModelViewSet): # Changed from ReadOnlyModelViewSet to ModelViewSet
    """
    Lists all aircraft. Only Admin or authenticated users can access.
    list: Returns GeoJSON list of aircraft. (For map)
    retrieve: Returns detailed information of a specific aircraft.
    update/partial_update: Updates aircraft information (e.g.: pilot).
    """
    queryset = Plane.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        """Return different serializer based on action."""
        if self.action in ['retrieve', 'update', 'partial_update']:
            return PlaneDetailSerializer
        return PlaneFeatureSerializer

    def get_permissions(self):
        """Require admin permission only for update and delete operations."""
        if self.action in ['update', 'partial_update', 'destroy', 'create']:
            self.permission_classes = [IsAdminUser]
        else:
            self.permission_classes = [permissions.IsAuthenticated]
        return super().get_permissions()

    def perform_update(self, serializer):
        """
        Runs additional logic when aircraft is updated.
        If a pilot is assigned, it unassigns that pilot from their previous aircraft if any.
        """
        # Check if `pilot` field is being updated
        if 'pilot' in serializer.validated_data:
            pilot_to_assign = serializer.validated_data['pilot']
            
            # Find other aircraft assigned to this pilot (if any).
            # We exclude the aircraft being updated from this query.
            Plane.objects.filter(pilot=pilot_to_assign).exclude(pk=self.get_object().pk).update(pilot=None)

        # Perform standard save operation.
        serializer.save()

    def list(self, request, *args, **kwargs):
        """Returns list in GeoJSON format for map."""
        queryset = self.filter_queryset(self.get_queryset())
        # PlaneFeatureSerializer is used
        serializer = self.get_serializer(queryset, many=True)
        feature_collection = {
            'type': 'FeatureCollection',
            'features': serializer.data
        }
        return Response(feature_collection)

    @action(detail=False, methods=['get'], url_path='management-list')
    def management_list(self, request):
        """Returns detailed aircraft list for management panel."""
        queryset = self.filter_queryset(self.get_queryset())
        # PlaneDetailSerializer is used
        serializer = PlaneDetailSerializer(queryset, many=True)
        return Response(serializer.data)


class CommandViewSet(viewsets.ModelViewSet):
    """
    Manages commands.
    - Admins can view, create, update and delete all commands.
    - Pilots can only list commands and view their details.
    """
    queryset = Command.objects.all().order_by('-created_at')
    serializer_class = CommandSerializer
    
    def get_permissions(self):
        """
        Dynamically determine permissions based on action.
        - 'create', 'update', 'partial_update', 'destroy' operations can only be performed by admins.
        - 'list' and 'retrieve' operations can be performed by all authenticated users.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAdminUser]
        else:
            self.permission_classes = [permissions.IsAuthenticated]
        return super().get_permissions()

    def perform_create(self, serializer):
        """
        Automatically assign pilot when creating a new command.
        Since this method can now only be called by admins,
        we should assign the pilot of the aircraft to which the command is sent, not the sending admin.
        """
        plane = serializer.validated_data.get('plane')
        if plane and plane.pilot:
            serializer.save(pilot=plane.pilot)
        else:
            # If the aircraft has no pilot or no aircraft is specified,
            # it can be temporarily saved without a pilot or an error can be returned.
            # For now, we're saving without a pilot.
            serializer.save()

    def get_queryset(self):
        """Filter commands based on user role."""
        user = self.request.user

        # Filter by ?plane_id=... query parameter
        plane_id = self.request.query_params.get('plane_id')
        if plane_id is not None:
            # If admin, show all; otherwise filter own commands by plane_id
            if user.is_staff:
                return Command.objects.filter(plane_id=plane_id).order_by('-created_at')
            try:
                pilot = Pilot.objects.get(user=user)
                return Command.objects.filter(plane_id=plane_id, pilot=pilot).order_by('-created_at')
            except Pilot.DoesNotExist:
                return Command.objects.none() # Return empty list if pilot profile doesn't exist

        # General filtering for list
        if user.is_staff: # If admin, see all commands
            return Command.objects.all().order_by('-created_at')
        
        # If pilot, only see own commands
        try:
            pilot = Pilot.objects.get(user=user)
            return Command.objects.filter(pilot=pilot).order_by('-created_at')
        except Pilot.DoesNotExist:
            return Command.objects.none() # Return empty list if pilot profile doesn't exist
    
    @action(detail=False, methods=['get'], url_path='my-commands')
    def my_commands(self, request):
        """
        Lists all commands belonging to the logged-in pilot.
        Special endpoint for mobile application.
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def _update_command_status(self, command, new_status):
        """Helper function to update status and notify clients."""
        command.status = new_status
        command.save()

        # Notify clients via WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            'fleet_updates',
            {
                'type': 'broadcast_message',
                # The entire payload dictionary is sent to the client.
                # It must match what the client expects.
                'payload': {
                    'type': 'command_update',
                    'data': CommandSerializer(command).data
                }
            }
        )
        return Response(CommandSerializer(command).data)

    @action(detail=True, methods=['post'])
    def accepted(self, request, pk=None):
        """Marks a command as accepted."""
        command = self.get_object()
        # Add any logic here to check if the user is allowed to accept
        return self._update_command_status(command, 'accepted')

    @action(detail=True, methods=['post'])
    def rejected(self, request, pk=None):
        """Marks a command as rejected."""
        command = self.get_object()
        return self._update_command_status(command, 'rejected')

    @action(detail=True, methods=['post'])
    def completed(self, request, pk=None):
        """Marks a command as completed."""
        command = self.get_object()
        return self._update_command_status(command, 'completed')

    def perform_update(self, serializer):
        updated_command = serializer.save()

        # Send message to channel
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            'fleet_updates',
            {
                'type': 'broadcast.message',
                'payload_type': 'command_update',
                'payload': CommandSerializer(updated_command).data
            }
        )