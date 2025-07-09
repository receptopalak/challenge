import json
from channels.generic.websocket import AsyncWebsocketConsumer

class FleetConsumer(AsyncWebsocketConsumer):
    """
    This consumer manages all real-time updates related to the fleet.
    """

    async def connect(self):
        """
        Runs when a new WebSocket connection is established.
        """
        # Name of the group where all fleet updates will be broadcast.
        self.room_group_name = 'fleet_updates'

        # Include the client in this group.
        # This way, every message sent to this group is also forwarded to this client.
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        # Accept WebSocket connection.
        await self.accept()
        print(f"WebSocket connected: {self.channel_name} to group '{self.room_group_name}'")

    async def disconnect(self, close_code):
        """
        Runs when WebSocket connection is closed.
        """
        # Remove the client from the group.
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        print(f"WebSocket disconnected: {self.channel_name}")

    async def receive(self, text_data):
        """
        This function runs when a message is received from a client.
        It receives the incoming message and broadcasts it to everyone in the group.
        """
        data = json.loads(text_data)
        
        # To send incoming message to all clients in the group
        # channel_layer.group_send is used.
        # The 'type' field specifies which method will handle this message.
        # 'broadcast.message' -> triggers the broadcast_message method.
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'broadcast.message',
                'payload': data  # We put the incoming data directly into the payload
            }
        )

            # The name of this method must match the 'type' key in channel_layer.group_send.
            # Example: 'type': 'broadcast.message' -> calls broadcast_message function.
    async def broadcast_message(self, event):
        """
        This function runs when a message is received from the 'fleet_updates' group.
        It sends the message to the connected client.
        """
        # Extract the actual payload (content) from the incoming event.
        # This payload contains 'type' (e.g.: 'plane_locations') and 'data' fields.
        payload = event['payload']

        # Send the received message to the client via WebSocket in JSON format.
        await self.send(text_data=json.dumps(payload))