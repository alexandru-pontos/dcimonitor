from typing import List, Optional
from ninja import ModelSchema, Schema
from .models import Location, Rack, Device

class LocationSchema(ModelSchema):
    class Meta:
        model = Location
        fields = ['id', 'name', 'description']

class LocationCreateSchema(ModelSchema):
    class Meta:
        model = Location
        fields = ['name', 'description']

class RackSchema(ModelSchema):
    location: LocationSchema
    
    class Meta:
        model = Rack
        fields = ['id', 'name', 'location', 'height_u', 'description']

class RackCreateSchema(ModelSchema):
    location_id: int
    
    class Meta:
        model = Rack
        fields = ['name', 'height_u', 'description']

class DeviceMove(Schema):
    id: int
    new_position_u: int

class DeviceRemoval(Schema):
    id: int
    strategy: str # 'delete' or 'decommission'

class RackResizePayload(Schema):
    new_height: int
    device_moves: List[DeviceMove] = []
    device_removals: List[DeviceRemoval] = []
    
class RackUpdateSchema(Schema):
    name: str = None
    description: str = None
    location_id: int = None
    height_u: int = None

class DashboardStatsSchema(Schema):
    total_racks: int
    active_devices: int

class DeviceSchema(ModelSchema):
    mounting_configuration: list[str] = []
    tags: list[str] = []
    class Meta:
        model = Device
        fields = ['id', 'name', 'label', 'asset_tag', 'location', 'rack', 'position_u', 'height_u', 'device_type', 'status', 'specs', 'created_at', 'updated_at', 'mounting_configuration', 'tags']

class DeviceCreateSchema(ModelSchema):
    location_id: int
    rack_id: Optional[int] = None
    position_u: Optional[int] = None
    mounting_configuration: list[str] = ['middle'] # Default to middle
    tags: list[str] = []
    
    class Meta:
        model = Device
        fields = ['name', 'label', 'asset_tag', 'position_u', 'height_u', 'device_type', 'status', 'specs', 'mounting_configuration', 'tags']

class DeviceUpdateSchema(Schema):
    name: str = None
    label: Optional[str] = None
    asset_tag: Optional[str] = None
    location_id: Optional[int] = None
    rack_id: Optional[int] = None
    position_u: Optional[int] = None
    height_u: int = None
    status: str = None
    device_type: str = None
    mounting_configuration: List[str] = None
    tags: List[str] = None
    specs: dict = None
