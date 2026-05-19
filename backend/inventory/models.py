from django.db import models

class Location(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Rack(models.Model):
    name = models.CharField(max_length=100)
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='racks')
    height_u = models.PositiveIntegerField(default=42, help_text="Height in Rack Units (U)")
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.name} ({self.location.name})"

class Device(models.Model):
    DEVICE_TYPES = [
        ('server', 'Server'),
        ('switch', 'Switch'),
        ('router', 'Router'),
        ('pdu', 'PDU'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('maintenance', 'Maintenance'),
        ('offline', 'Offline'),
        ('decommissioned', 'Decommissioned'),
    ]

    name = models.CharField(max_length=100)
    label = models.CharField(max_length=100, blank=True, null=True)
    asset_tag = models.CharField(max_length=100, blank=True, null=True)
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='devices')
    rack = models.ForeignKey(Rack, on_delete=models.CASCADE, related_name='devices', null=True, blank=True)
    position_u = models.PositiveIntegerField(help_text="Bottom-most U position", null=True, blank=True)
    height_u = models.PositiveIntegerField(default=1, help_text="Height in U")
    device_type = models.CharField(max_length=50, choices=DEVICE_TYPES, default='server')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='active')
    
    # Flexible specs for different hardware
    specs = models.JSONField(default=dict, blank=True)
    
    # Tags for filtering/identification
    tags = models.JSONField(default=list, blank=True, help_text="List of string tags")
    
    # Mounting Configuration: ['front', 'middle', 'back']
    mounting_configuration = models.JSONField(default=list, help_text="List of occupied columns: front, middle, back")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} [U{self.position_u}]"
