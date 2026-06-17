import api from '../lib/api';

export interface Location {
    id: number;
    name: string;
    description: string;
}

export interface Tag {
    id: number;
    name: string;
    color: string;
}

export interface ConnectedPortDetails {
    id: number;
    name: string;
    visible_label?: string | null;
    mac_address?: string | null;
    device_id: number;
    device_name: string;
    location_name: string;
}

export interface Port {
    id: number;
    name: string;
    visible_label?: string | null;
    interface_type: string;
    mac_address?: string | null;
    connected_port?: ConnectedPortDetails | null;
}

export interface PortCreateUpdate {
    id?: number;
    name: string;
    visible_label?: string | null;
    interface_type: string;
    mac_address?: string | null;
    connected_port_id?: number | null;
}

export interface Rack {
    id?: number;
    name: string;
    location: Location;
    height_u: number;
    description: string;
}

export interface Device {
    id: number;
    name: string; // Used as Common Name visually
    label?: string | null;
    asset_tag?: string | null;
    location: number; // Location ID
    rack?: number | null; // Rack ID
    position_u?: number | null;
    height_u: number;
    device_type: 'server' | 'switch' | 'router' | 'pdu' | 'other';
    status: 'active' | 'maintenance' | 'offline' | 'decommissioned';
    mounting_configuration: string[]; // ['front', 'middle', 'back']
    tags: Tag[];
    specs: {
        serial_number?: string;
        contact_person?: string;
        hardware_type?: string;
        hw_warranty_expiration?: string;
        support_contact_expiration?: string;
        software_type?: string;
        sw_warranty_expiration?: string;
        [key: string]: any;
    };
    ports: Port[];
    created_at?: string;
    updated_at?: string;
}

export type DeviceCreate = Omit<Device, 'id' | 'created_at' | 'updated_at' | 'tags' | 'ports'> & { tags: number[], ports: PortCreateUpdate[] };

export const inventoryService = {
    getLocations: async () => {
        const { data } = await api.get<Location[]>('/inventory/locations');
        return data;
    },

    createLocation: async (location: Omit<Location, 'id'>) => {
        const { data } = await api.post<Location>('/inventory/locations', location);
        return data;
    },

    deleteLocation: async (id: number) => {
        const { data } = await api.delete(`/inventory/locations/${id}`);
        return data;
    },

    getTags: async () => {
        const { data } = await api.get<Tag[]>('/inventory/tags');
        return data;
    },

    createTag: async (tag: Omit<Tag, 'id'>) => {
        const { data } = await api.post<Tag>('/inventory/tags', tag);
        return data;
    },

    deleteTag: async (id: number) => {
        const { data } = await api.delete(`/inventory/tags/${id}`);
        return data;
    },

    getDashboardStats: async (locationId?: number | null) => {
        const url = locationId ? `/inventory/stats?location_id=${locationId}` : '/inventory/stats';
        const { data } = await api.get<{ total_racks: number; active_devices: number }>(url);
        return data;
    },

    getRacks: async (locationId?: number | null) => {
        const url = locationId ? `/inventory/racks?location_id=${locationId}` : '/inventory/racks';
        const { data } = await api.get<Rack[]>(url);
        return data;
    },

    getRack: async (id: number) => {
        const { data } = await api.get<Rack>(`/inventory/racks/${id}`);
        return data;
    },

    createRack: async (rack: Omit<Rack, 'id' | 'location'> & { location_id: number }) => {
        const { data } = await api.post<Rack>('/inventory/racks', rack);
        return data;
    },

    updateRack: async (id: number, rack: Partial<Omit<Rack, 'id' | 'location'>> & { location_id?: number }) => {
        const { data } = await api.put<Rack>(`/inventory/racks/${id}`, rack);
        return data;
    },

    getDevices: async (rackId: number) => {
        const { data } = await api.get<Device[]>(`/inventory/racks/${rackId}/devices`);
        return data;
    },

    getAllDevices: async (locationId?: number | null) => {
        const url = locationId ? `/inventory/devices?location_id=${locationId}` : '/inventory/devices';
        const { data } = await api.get<Device[]>(url);
        return data;
    },

    createDevice: async (device: DeviceCreate) => {
        const { data } = await api.post<Device>('/inventory/devices', {
            ...device,
            location_id: device.location,
            rack_id: device.rack !== undefined ? device.rack : null
        });
        return data;
    },

    deleteRack: async (id: number, strategy: 'decommission' | 'delete') => {
        const { data } = await api.delete(`/inventory/racks/${id}?strategy=${strategy}`);
        return data;
    },

    resizeRack: async (id: number, payload: { new_height: number; device_moves: { id: number; new_position_u: number }[]; device_removals: { id: number; strategy: string }[] }) => {
        const { data } = await api.post(`/inventory/racks/${id}/resize`, payload);
        return data;
    },

    updateDevice: async (id: number, device: Partial<DeviceCreate>) => {
        const payload: any = { ...device };
        if (device.rack !== undefined) payload.rack_id = device.rack;
        if (device.location !== undefined) payload.location_id = device.location;
        
        const { data } = await api.put<Device>(`/inventory/devices/${id}`, payload);
        return data;
    },

    deleteDevice: async (id: number) => {
        const { data } = await api.delete(`/inventory/devices/${id}`);
        return data;
    }
};
