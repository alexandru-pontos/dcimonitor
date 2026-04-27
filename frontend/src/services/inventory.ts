import api from '../lib/api';

export interface Location {
    id: number;
    name: string;
    description: string;
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
    rack?: number | null; // Rack ID
    position_u?: number | null;
    height_u: number;
    device_type: 'server' | 'switch' | 'router' | 'pdu' | 'other';
    status: 'active' | 'maintenance' | 'offline' | 'decommissioned';
    mounting_configuration: string[]; // ['front', 'middle', 'back']
    tags: string[];
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
    created_at?: string;
    updated_at?: string;
}

export type DeviceCreate = Omit<Device, 'id' | 'created_at' | 'updated_at'>;

export const inventoryService = {
    getLocations: async () => {
        const { data } = await api.get<Location[]>('/inventory/locations');
        return data;
    },

    createLocation: async (location: Omit<Location, 'id'>) => {
        const { data } = await api.post<Location>('/inventory/locations', location);
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

    getAllDevices: async () => {
        const { data } = await api.get<Device[]>('/inventory/devices');
        return data;
    },

    createDevice: async (device: DeviceCreate) => {
        const { data } = await api.post<Device>('/inventory/devices', {
            ...device,
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
        const { data } = await api.put<Device>(`/inventory/devices/${id}`, {
            ...device,
            rack_id: device.rack !== undefined ? device.rack : undefined
        });
        return data;
    },

    deleteDevice: async (id: number) => {
        const { data } = await api.delete(`/inventory/devices/${id}`);
        return data;
    }
};
