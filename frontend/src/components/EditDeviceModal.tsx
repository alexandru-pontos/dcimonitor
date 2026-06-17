import { useState, useEffect } from 'react';
import Modal from './Modal';
import { inventoryService, type Device } from '../services/inventory';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import clsx from 'clsx';
import api from '../lib/api';
import AssignToRackModal from './AssignToRackModal';
import DeviceTagsModal from './DeviceTagsModal';
import ModalContentLayout from './ModalContentLayout';
import NetworkPortsSection from './NetworkPortsSection';
import PortConnectionModal from './PortConnectionModal';
import { AlertCircle } from 'lucide-react';
import type { PortCreateUpdate, Port } from '../services/inventory';

interface EditDeviceModalProps {
    isOpen: boolean;
    onClose: () => void;
    device: Device;
    rackHeight?: number;
    onSuccess?: () => void;
}

export default function EditDeviceModal({ isOpen, onClose, device, rackHeight, onSuccess }: EditDeviceModalProps) {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm_delete'>('idle');
    const [showStorageWarning, setShowStorageWarning] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);
    const [isPortModalOpen, setIsPortModalOpen] = useState(false);
    const [activePortIndex, setActivePortIndex] = useState<number | null>(null);

    // Basic fields
    const [name, setName] = useState(device.name);
    const [label, setLabel] = useState(device.label || '');
    const [assetTag, setAssetTag] = useState(device.asset_tag || '');
    const [heightU, setHeightU] = useState(device.height_u);
    const [type, setType] = useState<Device['device_type']>(device.device_type);
    const [status, setStatus] = useState<Device['status']>(device.status);
    const [mountingConfig, setMountingConfig] = useState<string[]>(device.mounting_configuration || []);

    // Positioning
    const [locationId, setLocationId] = useState<number>(device.location);
    const [rackId, setRackId] = useState<number | null>(device.rack || null);
    const [positionU, setPositionU] = useState<number | null>(device.position_u || null);

    const { data: locations } = useQuery({
        queryKey: ['locations'],
        queryFn: inventoryService.getLocations,
        enabled: isOpen,
    });

    const { data: globalTags } = useQuery({
        queryKey: ['tags'],
        queryFn: inventoryService.getTags,
        enabled: isOpen,
    });

    // Extra fields
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>(device.tags ? device.tags.map(t => t.id) : []);
    const [serialNumber, setSerialNumber] = useState(device.specs?.serial_number || '');
    const [contactPerson, setContactPerson] = useState(device.specs?.contact_person || '');
    const [hwType, setHwType] = useState(device.specs?.hardware_type || '');
    const [hwWarranty, setHwWarranty] = useState(device.specs?.hw_warranty_expiration || '');
    const [supportContact, setSupportContact] = useState(device.specs?.support_contact_expiration || '');
    const [os, setOs] = useState(device.specs?.software_type || '');
    const [swWarranty, setSwWarranty] = useState(device.specs?.sw_warranty_expiration || '');

    // Ports
    const [ports, setPorts] = useState<PortCreateUpdate[]>(device.ports || []);
    
    const navItems = [
        { id: 'basic-info', label: 'Basic Information' },
        { id: 'positioning', label: 'Positioning' },
        { id: 'network', label: 'Network Ports' },
        { id: 'extra-properties', label: 'Extra Properties' }
    ];

    // Fetch Rack Height if missing but device is mounted
    const { data: rackData } = useQuery({
        queryKey: ['rack', rackId],
        queryFn: async () => {
            const { data } = await api.get(`/inventory/racks/${rackId}`);
            return data;
        },
        enabled: isOpen && !!rackId && (!rackHeight || rackId !== device.rack),
    });

    const activeRackHeight = (rackId === device.rack && rackHeight) ? rackHeight : rackData?.height_u;

    useEffect(() => {
        if (isOpen) {
            setName(device.name);
            setLabel(device.label || '');
            setAssetTag(device.asset_tag || '');
            setHeightU(device.height_u);
            setType(device.device_type);
            setStatus(device.status);
            setMountingConfig(device.mounting_configuration || []);
            
            setLocationId(device.location);
            setRackId(device.rack || null);
            setPositionU(device.position_u || null);

            setSelectedTagIds(device.tags ? device.tags.map(t => t.id) : []);
            setSerialNumber(device.specs?.serial_number || '');
            setContactPerson(device.specs?.contact_person || '');
            setHwType(device.specs?.hardware_type || '');
            setHwWarranty(device.specs?.hw_warranty_expiration || '');
            setSupportContact(device.specs?.support_contact_expiration || '');
            setOs(device.specs?.software_type || '');
            setSwWarranty(device.specs?.sw_warranty_expiration || '');
            setPorts(device.ports || []);

            setDeleteStep('idle');
            setShowStorageWarning(false);
            setIsAssignModalOpen(false);
        }
    }, [isOpen, device]);

    const updateMutation = useMutation({
        mutationFn: (data: any) => inventoryService.updateDevice(device.id, data),
        onSuccess: () => {
            if (device.rack) {
                queryClient.invalidateQueries({ queryKey: ['rack', device.rack] });
                queryClient.invalidateQueries({ queryKey: ['rack', device.rack, 'devices'] });
            }
            if (rackId && rackId !== device.rack) {
                queryClient.invalidateQueries({ queryKey: ['rack', rackId] });
                queryClient.invalidateQueries({ queryKey: ['rack', rackId, 'devices'] });
            }
            queryClient.invalidateQueries({ queryKey: ['all_devices'] });
            
            addToast({ title: 'Device Updated', type: 'success' });
            if (onSuccess) onSuccess();
            onClose();
        },
        onError: (err: any) => {
            const detail = err.response?.data?.detail;
            const message = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail.map((d: any) => d.msg).join(', ') : 'Unknown error');
            addToast({ title: 'Update Failed', message, type: 'error' });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: inventoryService.deleteDevice,
        onSuccess: () => {
            if (device.rack) {
                queryClient.invalidateQueries({ queryKey: ['rack', device.rack] });
                queryClient.invalidateQueries({ queryKey: ['rack', device.rack, 'devices'] });
            }
            queryClient.invalidateQueries({ queryKey: ['all_devices'] });
            
            addToast({ title: 'Device Deleted', type: 'success' });
            if (onSuccess) onSuccess();
            onClose();
        }
    });

    const handleConfigChange = (col: string) => {
        setMountingConfig(prev => {
            if (prev.includes(col)) return prev.filter(c => c !== col);
            return [...prev, col];
        });
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (mountingConfig.length === 0) {
            alert("Please select at least one mounting depth.");
            return;
        }

        updateMutation.mutate({
            name,
            location: locationId,
            label: label || null,
            asset_tag: assetTag || null,
            rack: rackId, // Pass updated rackId
            position_u: rackId ? positionU : null, 
            height_u: heightU,
            device_type: type,
            status,
            mounting_configuration: mountingConfig,
            tags: selectedTagIds,
            specs: {
                ...device.specs,
                serial_number: serialNumber || undefined,
                contact_person: contactPerson || undefined,
                hardware_type: hwType || undefined,
                hw_warranty_expiration: hwWarranty || undefined,
                support_contact_expiration: supportContact || undefined,
                software_type: os || undefined,
                sw_warranty_expiration: swWarranty || undefined,
            },
            ports: ports
        });
    };

    const handleAssignConfirm = (newRackId: number, newU: number) => {
        setRackId(newRackId);
        setPositionU(newU);
        setIsAssignModalOpen(false);
    };

    const handleSendToStorage = () => {
        const hasConnections = ports.some(p => p.connected_port_id || (p as any).connected_port);
        if (hasConnections) {
            setShowStorageWarning(true);
        } else {
            commitSendToStorage();
        }
    };

    const commitSendToStorage = () => {
        setRackId(null);
        setPositionU(null);
        setPorts(prev => prev.map(p => ({ ...p, connected_port_id: null, connected_port: undefined, _remote_details: undefined } as any)));
        setShowStorageWarning(false);
    };

    const handleSelectRemotePort = (remoteDevice: Device, remotePort: Port) => {
        if (activePortIndex !== null) {
            setPorts(prev => {
                const newPorts = [...prev];
                const activePort: any = newPorts[activePortIndex];
                
                // 1. If currently connected internally, disconnect the old internal remote port
                if (activePort.connected_port && activePort.connected_port.device_id === device.id) {
                    const oldRemotePortIndex = newPorts.findIndex(p => p.id === activePort.connected_port!.id);
                    if (oldRemotePortIndex !== -1) {
                        newPorts[oldRemotePortIndex] = {
                            ...newPorts[oldRemotePortIndex],
                            connected_port_id: null,
                            connected_port: undefined
                        } as any;
                    }
                }

                // 2. Set new connection on local port
                newPorts[activePortIndex] = {
                    ...activePort,
                    connected_port_id: remotePort.id,
                    connected_port: {
                        id: remotePort.id,
                        name: remotePort.name,
                        visible_label: remotePort.visible_label,
                        mac_address: remotePort.mac_address,
                        device_id: remoteDevice.id,
                        device_name: remoteDevice.name,
                        location_name: ''
                    }
                } as any;
                
                // 3. If the new connection is internal, update the target port as well
                if (remoteDevice.id === device.id) {
                    const remotePortIndex = newPorts.findIndex(p => p.id === remotePort.id);
                    if (remotePortIndex !== -1) {
                        const remoteTarget: any = newPorts[remotePortIndex];
                        // If that remote port was connected to another internal port, disconnect that one
                        if (remoteTarget.connected_port && remoteTarget.connected_port.device_id === device.id && remoteTarget.connected_port.id !== activePort.id) {
                            const oldOfRemoteIndex = newPorts.findIndex(p => p.id === remoteTarget.connected_port!.id);
                            if (oldOfRemoteIndex !== -1) {
                                newPorts[oldOfRemoteIndex] = {
                                    ...newPorts[oldOfRemoteIndex],
                                    connected_port_id: null,
                                    connected_port: undefined
                                } as any;
                            }
                        }
                        
                        newPorts[remotePortIndex] = {
                            ...newPorts[remotePortIndex],
                            connected_port_id: activePort.id,
                            connected_port: {
                                id: activePort.id!,
                                name: activePort.name,
                                visible_label: activePort.visible_label,
                                mac_address: activePort.mac_address,
                                device_id: device.id,
                                device_name: device.name,
                                location_name: ''
                            }
                        } as any;
                    }
                }

                return newPorts;
            });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Edit ${device.name}`} size="7xl">
            <div className="relative flex flex-col h-full max-h-[75vh]">
                <form
                    onSubmit={handleSave}
                    className={clsx("flex flex-col flex-1 overflow-hidden transition-all duration-300",
                        (deleteStep !== 'idle' || showStorageWarning) && "blur-sm pointer-events-none opacity-50"
                    )}
                >
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <ModalContentLayout navItems={navItems}>
                            <div className="space-y-8 pb-8">
                                {/* --- BASIC INFO SECTION --- */}
                                <section id="basic-info">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Common Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location *</label>
                                    <select
                                        required
                                        value={locationId}
                                        onChange={(e) => {
                                            setLocationId(Number(e.target.value));
                                            setRackId(null);
                                            setPositionU(null);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="" disabled>Select Location</option>
                                        {locations?.map(loc => (
                                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Label</label>
                                    <input
                                        type="text"
                                        value={label}
                                        onChange={(e) => setLabel(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Asset Tag</label>
                                    <input
                                        type="text"
                                        value={assetTag}
                                        onChange={(e) => setAssetTag(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Height (U) *</label>
                                    <input
                                        type="number"
                                        required
                                        min={1}
                                        value={heightU}
                                        onChange={(e) => setHeightU(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as any)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="active">Active</option>
                                        <option value="maintenance">Maintenance</option>
                                        <option value="offline">Offline</option>
                                        <option value="decommissioned">Decommissioned</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mounting Depth *</label>
                                    <div className="flex gap-4 mt-2">
                                        {['back', 'middle', 'front'].map((col) => (
                                            <label key={col} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={mountingConfig.includes(col)}
                                                    onChange={() => handleConfigChange(col)}
                                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                                />
                                                <span className="text-sm capitalize text-gray-700 dark:text-gray-300">{col}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                                    <select
                                        value={type}
                                        onChange={(e) => setType(e.target.value as any)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="server">Server</option>
                                        <option value="switch">Switch</option>
                                        <option value="router">Router</option>
                                        <option value="pdu">PDU</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                                <hr className="border-gray-200 dark:border-zinc-800" />

                                {/* --- POSITIONING SECTION --- */}
                                <section id="positioning">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Positioning</h3>
                            
                            {rackId ? (
                                <div className="flex items-end gap-4 bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-gray-200 dark:border-zinc-700">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rack Assignment</label>
                                        <input 
                                            type="text" 
                                            readOnly 
                                            value={`Rack ID: ${rackId}`} 
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-gray-100 dark:bg-zinc-900 text-gray-500 dark:text-gray-400 outline-none cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="w-32">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Position (U) *</label>
                                        <input
                                            type="number"
                                            required
                                            min={1}
                                            max={activeRackHeight ? activeRackHeight - heightU + 1 : undefined}
                                            value={positionU || ''}
                                            onChange={(e) => setPositionU(Number(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleSendToStorage}
                                        className="px-4 py-2 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                    >
                                        Send device to storage
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-200 dark:border-zinc-700">
                                    <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">
                                        {device.rack 
                                            ? 'Device will be sent to storage after saving changes.' 
                                            : 'This device is currently unassigned (in Storage).'}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setIsAssignModalOpen(true)}
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                                    >
                                        Assign to rack
                                    </button>
                                </div>
                            )}
                        </section>

                                <hr className="border-gray-200 dark:border-zinc-800" />

                                {/* --- NETWORK PORTS SECTION --- */}
                                <NetworkPortsSection 
                                    ports={ports} 
                                    setPorts={setPorts} 
                                    isStorage={!rackId}
                                    onSelectRemotePort={(index) => {
                                        setActivePortIndex(index);
                                        setIsPortModalOpen(true);
                                    }}
                                    onDisconnectPort={(index) => {
                                        setPorts(prev => {
                                            const next = [...prev];
                                            const activePort: any = next[index];
                                            
                                            if (activePort.connected_port && activePort.connected_port.device_id === device.id) {
                                                const remotePortIndex = next.findIndex(p => p.id === activePort.connected_port!.id);
                                                if (remotePortIndex !== -1) {
                                                    next[remotePortIndex] = {
                                                        ...next[remotePortIndex],
                                                        connected_port_id: null,
                                                        connected_port: undefined
                                                    } as any;
                                                }
                                            }
                                            
                                            next[index] = {
                                                ...activePort,
                                                connected_port_id: null,
                                                connected_port: undefined
                                            } as any;
                                            
                                            return next;
                                        });
                                    }}
                                />

                                <hr className="border-gray-200 dark:border-zinc-800" />

                                {/* --- EXTRA PROPERTIES SECTION --- */}
                                <section id="extra-properties">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Extra Properties</h3>

                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tags</label>
                                    <button
                                        type="button"
                                        onClick={() => setIsTagsModalOpen(true)}
                                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                                    >
                                        Edit tags
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-200 dark:border-zinc-700 min-h-[46px]">
                                    {selectedTagIds.length === 0 ? (
                                        <span className="text-sm text-gray-500 dark:text-gray-400 italic">No tags assigned</span>
                                    ) : (
                                        selectedTagIds.map(id => {
                                            const tag = globalTags?.find(t => t.id === id);
                                            if (!tag) return null;
                                            return (
                                                <span 
                                                    key={tag.id}
                                                    className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                                                    style={{ backgroundColor: `${tag.color}20`, color: tag.color, border: `1px solid ${tag.color}40` }}
                                                >
                                                    {tag.name}
                                                </span>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Serial Number</label>
                                <input
                                    type="text"
                                    value={serialNumber}
                                    onChange={(e) => setSerialNumber(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Person</label>
                                    <input
                                        type="text"
                                        value={contactPerson}
                                        onChange={(e) => setContactPerson(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Support Contact Expiration Date</label>
                                    <input
                                        type="date"
                                        value={supportContact}
                                        onChange={(e) => setSupportContact(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hardware Type</label>
                                    <input
                                        type="text"
                                        value={hwType}
                                        onChange={(e) => setHwType(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">HW Warranty Expiration Date</label>
                                    <input
                                        type="date"
                                        value={hwWarranty}
                                        onChange={(e) => setHwWarranty(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Software Type / OS</label>
                                    <input
                                        type="text"
                                        value={os}
                                        onChange={(e) => setOs(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SW Warranty Expiration Date</label>
                                    <input
                                        type="date"
                                        value={swWarranty}
                                        onChange={(e) => setSwWarranty(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                                </section>
                            </div>
                        </ModalContentLayout>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900">
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setDeleteStep('confirm_delete')}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Delete Device"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={updateMutation.isPending}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </form>

                {/* Overlays */}
                {deleteStep !== 'idle' && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-4 animate-in fade-in zoom-in duration-200">
                        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm p-6 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-700 max-w-sm w-full">
                            <div className="flex justify-center mb-4">
                                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
                                    <Trash2 size={32} />
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                                Delete Device?
                            </h3>

                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Are you sure you want to permanently delete "{device.name}"? This action cannot be undone.
                            </p>

                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={() => setDeleteStep('idle')}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => deleteMutation.mutate(device.id)}
                                    className="px-4 py-2 text-white rounded-lg font-medium transition-colors bg-red-600 hover:bg-red-700"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showStorageWarning && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-4 animate-in fade-in zoom-in duration-200">
                        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm p-6 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-700 max-w-sm w-full">
                            <div className="flex justify-center mb-4">
                                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600 dark:text-amber-400">
                                    <AlertCircle size={32} />
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                                Send to Storage?
                            </h3>

                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Sending this device to storage will remove all connections between it and other devices.
                            </p>

                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={() => setShowStorageWarning(false)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Undo change
                                </button>
                                <button
                                    onClick={commitSendToStorage}
                                    className="px-4 py-2 text-white rounded-lg font-medium transition-colors bg-amber-600 hover:bg-amber-700"
                                >
                                    I understand
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <AssignToRackModal 
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                onConfirm={handleAssignConfirm}
                deviceHeightU={heightU}
                fixedLocationId={locationId}
            />

            <DeviceTagsModal
                isOpen={isTagsModalOpen}
                onClose={() => setIsTagsModalOpen(false)}
                selectedTagIds={selectedTagIds}
                onChange={setSelectedTagIds}
            />

            <PortConnectionModal
                isOpen={isPortModalOpen}
                onClose={() => setIsPortModalOpen(false)}
                onSelect={handleSelectRemotePort}
                defaultLocationId={typeof locationId === 'number' ? locationId : undefined}
                excludePortId={activePortIndex !== null ? ports[activePortIndex]?.id : undefined}
            />
        </Modal>
    );
}
