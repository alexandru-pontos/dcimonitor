import { useState, useEffect } from 'react';
import Modal from './Modal';
import { inventoryService } from '../services/inventory';
import type { Device, DeviceCreate } from '../services/inventory';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useToast } from '../context/ToastContext';
import AssignToRackModal from './AssignToRackModal';

interface AddDeviceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    rackId: number | null;
    rackHeight?: number;
    initialPosition?: number;
}

export default function AddDeviceModal({ isOpen, onClose, onSuccess, rackId, rackHeight, initialPosition }: AddDeviceModalProps) {
    const { addToast } = useToast();
    const queryClient = useQueryClient();

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

    const { data: locations } = useQuery({
        queryKey: ['locations'],
        queryFn: inventoryService.getLocations,
        enabled: isOpen,
    });

    const { data: rackContext } = useQuery({
        queryKey: ['rack', rackId],
        queryFn: () => inventoryService.getRack(rackId!),
        enabled: isOpen && !!rackId,
    });

    // Basic fields
    const [name, setName] = useState('');
    const [label, setLabel] = useState('');
    const [assetTag, setAssetTag] = useState('');
    const [heightU, setHeightU] = useState(1);
    const [type, setType] = useState<Device['device_type']>('server');
    const [status, setStatus] = useState<Device['status']>('active');
    const [mountingConfig, setMountingConfig] = useState<string[]>(['middle']);

    // Positioning
    const [locationId, setLocationId] = useState<number | ''>('');
    const [assignedRackId, setAssignedRackId] = useState<number | null>(rackId);
    const [positionU, setPositionU] = useState<number | null>(initialPosition || 1);

    // Extra fields
    const [tagsInput, setTagsInput] = useState('');
    const [serialNumber, setSerialNumber] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [hwType, setHwType] = useState('');
    const [hwWarranty, setHwWarranty] = useState('');
    const [supportContact, setSupportContact] = useState('');
    const [os, setOs] = useState('');
    const [swWarranty, setSwWarranty] = useState('');

    const mutation = useMutation({
        mutationFn: inventoryService.createDevice,
        onSuccess: () => {
            addToast({ title: 'Device added successfully', type: 'success' });
            queryClient.invalidateQueries({ queryKey: ['all_devices'] });
            if (assignedRackId) {
                queryClient.invalidateQueries({ queryKey: ['rack', assignedRackId] });
                queryClient.invalidateQueries({ queryKey: ['rack', assignedRackId, 'devices'] });
            }
            onSuccess();
            resetForm();
        },
        onError: (err: any) => {
            const detail = err.response?.data?.detail;
            const message = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail.map((d: any) => d.msg).join(', ') : err.message);
            addToast({ title: 'Error adding device', message, type: 'error' });
        }
    });

    useEffect(() => {
        if (isOpen) {
            setAssignedRackId(rackId);
            setPositionU(initialPosition || 1);
            if (rackContext) {
                setLocationId(rackContext.location.id);
            }
        }
    }, [isOpen, rackId, initialPosition, rackContext]);

    const resetForm = () => {
        setName('');
        setLabel('');
        setAssetTag('');
        setHeightU(1);
        setType('server');
        setStatus('active');
        setMountingConfig(['middle']);
        setLocationId('');
        setAssignedRackId(rackId);
        setPositionU(initialPosition || 1);
        setTagsInput('');
        setSerialNumber('');
        setContactPerson('');
        setHwType('');
        setHwWarranty('');
        setSupportContact('');
        setOs('');
        setSwWarranty('');
        setIsAssignModalOpen(false);
    };

    const handleConfigChange = (col: string) => {
        setMountingConfig(prev => {
            if (prev.includes(col)) return prev.filter(c => c !== col);
            return [...prev, col];
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mountingConfig.length === 0) {
            alert("Please select at least one mounting depth.");
            return;
        }

        const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);

        const payload: DeviceCreate = {
            name,
            location: Number(locationId),
            label: label || null,
            asset_tag: assetTag || null,
            position_u: assignedRackId ? positionU : null,
            height_u: heightU,
            device_type: type,
            status,
            rack: assignedRackId,
            mounting_configuration: mountingConfig,
            tags,
            specs: {
                serial_number: serialNumber || undefined,
                contact_person: contactPerson || undefined,
                hardware_type: hwType || undefined,
                hw_warranty_expiration: hwWarranty || undefined,
                support_contact_expiration: supportContact || undefined,
                software_type: os || undefined,
                sw_warranty_expiration: swWarranty || undefined,
            }
        };

        mutation.mutate(payload);
    };

    const handleAssignConfirm = (newRackId: number, newU: number) => {
        setAssignedRackId(newRackId);
        setPositionU(newU);
        setIsAssignModalOpen(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Device" size="xl">
            <form onSubmit={handleSubmit} className="space-y-8 h-full max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                
                {/* --- BASIC INFO SECTION --- */}
                <section>
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
                                placeholder="e.g. Web Server 01"
                            />
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location *</label>
                            <select
                                required
                                value={locationId}
                                onChange={(e) => {
                                    setLocationId(Number(e.target.value));
                                    setAssignedRackId(null);
                                    setPositionU(null);
                                }}
                                disabled={!!rackId} // Disable if adding from a specific rack
                                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                            >
                                <option value="" disabled>Select Location</option>
                                {locations?.map(loc => (
                                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>

                <hr className="border-gray-200 dark:border-zinc-800" />

                {/* --- POSITIONING SECTION --- */}
                <section>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Positioning</h3>
                    
                    {assignedRackId ? (
                        <div className="flex items-end gap-4 bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-gray-200 dark:border-zinc-700">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rack Assignment</label>
                                <input 
                                    type="text" 
                                    readOnly 
                                    value={`Rack ID: ${assignedRackId}`} 
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-gray-100 dark:bg-zinc-900 text-gray-500 dark:text-gray-400 outline-none cursor-not-allowed"
                                />
                            </div>
                            <div className="w-32">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Position (U) *</label>
                                <input
                                    type="number"
                                    required
                                    min={1}
                                    max={rackHeight ? rackHeight - heightU + 1 : undefined}
                                    value={positionU || ''}
                                    onChange={(e) => setPositionU(Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setAssignedRackId(null);
                                    setPositionU(null);
                                }}
                                className="px-4 py-2 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                Send device to storage
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-200 dark:border-zinc-700">
                            <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">This device will be created unassigned (in Storage).</p>
                            <button
                                type="button"
                                onClick={() => setIsAssignModalOpen(true)}
                                disabled={!locationId}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
                            >
                                Assign to rack
                            </button>
                            {!locationId && <p className="text-xs text-red-500 mt-2">Select a location first.</p>}
                        </div>
                    )}
                </section>

                <hr className="border-gray-200 dark:border-zinc-800" />

                {/* --- EXTRA PROPERTIES SECTION --- */}
                <section>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Extra Properties</h3>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (Comma separated)</label>
                        <input
                            type="text"
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g. database, prod, high-priority"
                        />
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

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-zinc-800 sticky bottom-0 bg-white dark:bg-zinc-900">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {mutation.isPending ? 'Adding...' : 'Add Device'}
                    </button>
                </div>
            </form>

            <AssignToRackModal 
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                onConfirm={handleAssignConfirm}
                deviceHeightU={heightU}
                fixedLocationId={typeof locationId === 'number' ? locationId : undefined}
            />
        </Modal>
    );
}
