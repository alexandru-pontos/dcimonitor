from django.db import models
from django.core.validators import RegexValidator

alpha_only = RegexValidator(r'^[a-zA-Z\s]+$', 'Only letters and spaces are allowed.')

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True, validators=[alpha_only])
    color = models.CharField(max_length=7, default='#374151')

    def __str__(self):
        return self.name

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
    tags = models.ManyToManyField(Tag, blank=True, related_name='devices')
    
    # Mounting Configuration: ['front', 'middle', 'back']
    mounting_configuration = models.JSONField(default=list, help_text="List of occupied columns: front, middle, back")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} [U{self.position_u}]"

class Port(models.Model):
    INTERFACE_CHOICES = [
        ('rj45', 'RJ-45 (1G)'),
        ('rj45_10g', 'RJ-45 (10G)'),
        ('sfp', 'SFP (1G)'),
        ('sfp_plus', 'SFP+ (10G)'),
        ('sfp28', 'SFP28 (25G)'),
        ('qsfp_plus', 'QSFP+ (40G)'),
        ('qsfp28', 'QSFP28 (100G)'),
        ('qsfp_dd', 'QSFP-DD (400G)'),
        ('osfp', 'OSFP (800G)'),
        ('cx4', 'CX4'),
        ('fc', 'Fibre Channel'),
        ('infiniband', 'InfiniBand'),
        ('wireless', 'Wireless'),
        ('virtual', 'Virtual'),
        ('other', 'Other'),
    ]

    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='ports')
    name = models.CharField(max_length=100)
    visible_label = models.CharField(max_length=100, blank=True, null=True)
    interface_type = models.CharField(max_length=50, choices=INTERFACE_CHOICES, default='rj45')
    mac_address = models.CharField(max_length=17, blank=True, null=True)
    connected_port = models.OneToOneField('self', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        unique_together = ('device', 'name')

    def __str__(self):
        return f"{self.device.name} - {self.name}"
