from typing import List
from ninja import Router
from django.shortcuts import get_object_or_404
from .models import Location, Rack, Device
from .schemas import (
    LocationSchema, LocationCreateSchema,
    RackSchema, RackCreateSchema, RackUpdateSchema, RackResizePayload,
    DashboardStatsSchema,
    DeviceSchema, DeviceCreateSchema, DeviceUpdateSchema
)

router = Router()

# --- Locations ---
@router.get("/locations", response=List[LocationSchema])
def list_locations(request):
    return Location.objects.all()

@router.post("/locations", response=LocationSchema)
def create_location(request, payload: LocationCreateSchema):
    location = Location.objects.create(**payload.dict())
    return location

# --- Racks ---
@router.get("/racks", response=List[RackSchema])
def list_racks(request, location_id: int = None):
    qs = Rack.objects.select_related('location').all()
    if location_id:
        qs = qs.filter(location_id=location_id)
    return qs

@router.get("/racks/{rack_id}", response=RackSchema)
def get_rack(request, rack_id: int):
    return get_object_or_404(Rack, id=rack_id)

@router.post("/racks", response=RackSchema)
def create_rack(request, payload: RackCreateSchema):
    data = payload.dict()
    location_id = data.pop('location_id')
    location = get_object_or_404(Location, id=location_id)
    rack = Rack.objects.create(location=location, **data)
    return rack

@router.put("/racks/{rack_id}", response=RackSchema)
def update_rack(request, rack_id: int, payload: RackUpdateSchema):
    rack = get_object_or_404(Rack, id=rack_id)
    data = payload.dict(exclude_unset=True)
    
    if 'location_id' in data:
        location_id = data.pop('location_id')
        if location_id:
             rack.location = get_object_or_404(Location, id=location_id)
    
    for attr, value in data.items():
        setattr(rack, attr, value)
    
    rack.save()
    return rack

@router.post("/racks/{rack_id}/resize", response={200: dict})
def resize_rack(request, rack_id: int, payload: RackResizePayload):
    from django.db import transaction
    rack = get_object_or_404(Rack, id=rack_id)
    
    with transaction.atomic():
        # 1. Update Rack Height
        rack.height_u = payload.new_height
        rack.save()
        
        # 2. Process Moves
        for move in payload.device_moves:
            device = get_object_or_404(Device, id=move.id, rack=rack)
            device.position_u = move.new_position_u
            device.save()
            
        # 3. Process Removals
        for removal in payload.device_removals:
            device = get_object_or_404(Device, id=removal.id, rack=rack)
            if removal.strategy == 'delete':
                device.delete()
            elif removal.strategy == 'decommission':
                device.rack = None
                device.position_u = 0
                device.status = 'decommissioned'
                device.save()
            else:
                 from ninja.errors import HttpError
                 raise HttpError(400, f"Invalid strategy '{removal.strategy}' for device {removal.id}")
                 
    return {"success": True, "message": f"Rack resized to {payload.new_height}U"}

@router.delete("/racks/{rack_id}")
def delete_rack(request, rack_id: int, strategy: str = 'decommission'):
    rack = get_object_or_404(Rack, id=rack_id)
    
    if strategy == 'delete':
        # Default cascade delete (as per model definition)
        rack.delete()
    elif strategy == 'decommission':
        # Decommission devices first, then delete rack
        # Keep height_u, but clear placement
        Device.objects.filter(rack=rack).update(
            rack=None,
            position_u=0, # Or a specific value for unmounted?
                          # Later.
            status='decommissioned'
        )
        rack.delete()
    else:
        from ninja.errors import HttpError
        raise HttpError(400, "Invalid strategy. Use 'delete' or 'decommission'.")
    
    return {"success": True}

@router.get("/stats", response=DashboardStatsSchema)
def get_stats(request, location_id: int = None):
    racks_qs = Rack.objects.all()
    if location_id:
        racks_qs = racks_qs.filter(location_id=location_id)
        
    total_racks = racks_qs.count()
    
    # Active devices in the filtered racks or at the location
    if location_id:
        active_devices = Device.objects.filter(
            location_id=location_id,
            status='active'
        ).count()
    else:
        active_devices = Device.objects.filter(
            status='active'
        ).count()
    
    return {
        "total_racks": total_racks,
        "active_devices": active_devices
    }

# --- Devices ---
@router.get("/devices", response=List[DeviceSchema])
def list_all_devices(request, location_id: int = None):
    qs = Device.objects.all()
    if location_id:
        qs = qs.filter(location_id=location_id)
    return qs

@router.get("/racks/{rack_id}/devices", response=List[DeviceSchema])
def list_rack_devices(request, rack_id: int):
    return Device.objects.filter(rack_id=rack_id)

@router.post("/devices", response=DeviceSchema)
def create_device(request, payload: DeviceCreateSchema):
    data = payload.dict()
    rack_id = data.pop('rack_id', None)
    location_id = data.pop('location_id')
    
    location = get_object_or_404(Location, id=location_id)
    rack = None
    if rack_id is not None:
        rack = get_object_or_404(Rack, id=rack_id)
        if rack.location_id != location.id:
            from ninja.errors import HttpError
            raise HttpError(400, "Device location must match Rack location.")
    
    # Validation: Check for intersection only if assigned to a rack
    if rack and data.get('position_u'):
        start_u = data['position_u']
        end_u = start_u + data['height_u'] - 1
        
        # Max height check
        if end_u > rack.height_u:
            from ninja.errors import HttpError
            raise HttpError(400, f"Device exceeds rack height. Max U is {rack.height_u}.")

        # Overlap check
        existing_devices = Device.objects.filter(rack=rack)
        for d in existing_devices:
            d_start = d.position_u
            d_end = d.position_u + d.height_u - 1
            if max(start_u, d_start) <= min(end_u, d_end):
                 from ninja.errors import HttpError
                 raise HttpError(409, f"Overlap detected with device '{d.name}' at U{d.position_u}.")

    device = Device.objects.create(location=location, rack=rack, **data)
    return device

# Update Device Endpoint
@router.put("/devices/{device_id}", response=DeviceSchema)
def update_device(request, device_id: int, payload: DeviceUpdateSchema):
    device = get_object_or_404(Device, id=device_id)
    data = payload.dict(exclude_unset=True)
    print(f"DEBUG update_device: {data}")
    
    # Handle Relations
    if 'location_id' in data:
        location_id = data.pop('location_id')
        if location_id is not None:
            device.location = get_object_or_404(Location, id=location_id)

    if 'rack_id' in data:
        rack_id = data.pop('rack_id')
        if rack_id is None:
            device.rack = None # Decommission / Unmount
        else:
            rack = get_object_or_404(Rack, id=rack_id)
            device.rack = rack
            # Sync location
            device.location = rack.location

    # Update simple fields
    for attr, value in data.items():
        setattr(device, attr, value)
        
    # Ensure rack location matches device location
    if device.rack and device.location_id != device.rack.location_id:
        device.location = device.rack.location

    # Validation: If moving/resizing on a rack
    if device.rack:
        # Check Max Height
        if (device.position_u + device.height_u - 1) > device.rack.height_u:
             from ninja.errors import HttpError
             raise HttpError(400, f"Device exceeds rack height. Max U is {device.rack.height_u}.")
        
        # Check Collision (Exclude self)
        existing_devices = Device.objects.filter(rack=device.rack).exclude(id=device.id)
        start_u = device.position_u
        end_u = start_u + device.height_u - 1
        
        for d in existing_devices:
            d_start = d.position_u
            d_end = d.position_u + d.height_u - 1
            if max(start_u, d_start) <= min(end_u, d_end):
                 from ninja.errors import HttpError
                 raise HttpError(409, f"Overlap detected with device '{d.name}' at U{d.position_u}.")

    device.save()
    return device

@router.delete("/devices/{device_id}")
def delete_device(request, device_id: int):
    device = get_object_or_404(Device, id=device_id)
    device.delete()
    return {"success": True}
