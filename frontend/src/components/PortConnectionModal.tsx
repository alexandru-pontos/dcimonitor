import { useState, useEffect } from 'react';
import Modal from './Modal';
import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '../services/inventory';
import type { Device, Port } from '../services/inventory';
import RackVisualization from './RackVisualization';
import { Link, X, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

interface PortConnectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (remoteDevice: Device, remotePort: Port) => void;
    defaultLocationId?: number | null;
    excludePortId?: number | null;
}

export default function PortConnectionModal({ isOpen, onClose, onSelect, defaultLocationId, excludePortId }: PortConnectionModalProps) {
    const [locationId, setLocationId] = useState<number | ''>('');
    const [rackId, setRackId] = useState<number | ''>('');
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

    useEffect(() => {
        if (isOpen) {
            setLocationId(defaultLocationId || '');
            setRackId('');
            setSelectedDevice(null);
        }
    }, [isOpen, defaultLocationId]);

    const { data: locations } = useQuery({
        queryKey: ['locations'],
        queryFn: inventoryService.getLocations,
        enabled: isOpen,
    });

    const { data: racks } = useQuery({
        queryKey: ['racks', locationId],
        queryFn: () => inventoryService.getRacks(Number(locationId)),
        enabled: isOpen && !!locationId,
    });

    const activeRack = racks?.find(r => r.id === rackId);

    const { data: devices, isLoading: isDevicesLoading } = useQuery({
        queryKey: ['rack', rackId, 'devices'],
        queryFn: () => inventoryService.getDevices(Number(rackId)),
        enabled: isOpen && !!rackId,
    });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Select Remote Connection" size="4xl">
            <div className="flex flex-col h-[70vh]">
                <div className="flex gap-4 mb-6 shrink-0">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                        <select
                            value={locationId}
                            onChange={(e) => {
                                setLocationId(Number(e.target.value));
                                setRackId('');
                                setSelectedDevice(null);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="" disabled>Select Location</option>
                            {locations?.map(loc => (
                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rack</label>
                        <select
                            value={rackId}
                            onChange={(e) => {
                                setRackId(Number(e.target.value));
                                setSelectedDevice(null);
                            }}
                            disabled={!locationId}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                        >
                            <option value="" disabled>Select Rack</option>
                            {racks?.map(rack => (
                                <option key={rack.id} value={rack.id}>{rack.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex-1 relative border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-zinc-800/50 flex">
                    {!rackId ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                            <AlertCircle className="mb-2 opacity-50" size={32} />
                            <p>Select a location and rack to view devices.</p>
                        </div>
                    ) : isDevicesLoading ? (
                        <div className="flex-1 flex items-center justify-center text-gray-500">
                            <p>Loading devices...</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-6 flex justify-center custom-scrollbar">
                            {activeRack && devices && (
                                <RackVisualization
                                    heightU={activeRack.height_u}
                                    devices={devices}
                                    onDeviceClick={(device) => setSelectedDevice(device)}
                                />
                            )}
                        </div>
                    )}

                    {/* Device Ports Popover Sidebar */}
                    {selectedDevice && (
                        <div className="w-80 shrink-0 border-l border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.05)] z-10 animate-in slide-in-from-right-8 duration-200">
                            <div className="p-4 border-b border-gray-200 dark:border-zinc-700 flex items-start justify-between bg-gray-50/50 dark:bg-zinc-800/50">
                                <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{selectedDevice.name}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide">{selectedDevice.device_type}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedDevice(null)}
                                    className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded text-gray-500 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                <h5 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Available Ports</h5>
                                
                                {(!selectedDevice.ports || selectedDevice.ports.length === 0) ? (
                                    <div className="text-center p-4 text-sm text-gray-500 italic bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-dashed border-gray-200 dark:border-zinc-700">
                                        No ports defined on this device.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedDevice.ports.map((port) => {
                                            const isSelf = port.id === excludePortId;
                                            const isOccupied = !!port.connected_port || isSelf;
                                            
                                            return (
                                                <div 
                                                    key={port.id}
                                                    className={clsx(
                                                        "p-3 rounded-lg border flex flex-col gap-2 transition-all",
                                                        isOccupied 
                                                            ? "bg-gray-50 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700 opacity-60" 
                                                            : "bg-white dark:bg-zinc-800 border-indigo-100 dark:border-indigo-900/50 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 group"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                                                {port.name}
                                                                {port.visible_label && <span className="ml-1.5 text-xs font-normal text-gray-500">({port.visible_label})</span>}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                                                                {port.interface_type} {port.mac_address && `• ${port.mac_address}`}
                                                            </div>
                                                        </div>
                                                        {isOccupied && (
                                                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-gray-400 rounded">
                                                                {isSelf ? "Self" : "Occupied"}
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    {!isOccupied && (
                                                        <button
                                                            onClick={() => {
                                                                onSelect(selectedDevice, port);
                                                                onClose();
                                                            }}
                                                            className="mt-1 w-full flex items-center justify-center gap-2 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-white transition-colors text-xs font-medium opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Link size={12} />
                                                            Select Port
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
