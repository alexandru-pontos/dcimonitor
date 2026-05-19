import { useState, useEffect } from 'react';
import Modal from './Modal';
import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '../services/inventory';
import RackVisualization from './RackVisualization';

interface AssignToRackModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (rackId: number, positionU: number) => void;
    deviceHeightU: number;
    fixedLocationId?: number;
}

export default function AssignToRackModal({ isOpen, onClose, onConfirm, deviceHeightU, fixedLocationId }: AssignToRackModalProps) {
    const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
    const [selectedRackId, setSelectedRackId] = useState<number | null>(null);
    const [selectedU, setSelectedU] = useState<number | null>(null);

    const { data: locations } = useQuery({
        queryKey: ['locations'],
        queryFn: inventoryService.getLocations,
        enabled: isOpen,
    });

    const { data: racks } = useQuery({
        queryKey: ['racks', selectedLocationId],
        queryFn: () => inventoryService.getRacks(selectedLocationId || undefined),
        enabled: isOpen,
    });

    const { data: rackDevices, isLoading: loadingDevices } = useQuery({
        queryKey: ['rack', selectedRackId, 'devices'],
        queryFn: () => inventoryService.getDevices(selectedRackId!),
        enabled: isOpen && !!selectedRackId,
    });

    const selectedRack = racks?.find(r => r.id === selectedRackId);

    // Reset state when opened/closed
    useEffect(() => {
        if (!isOpen) {
            setSelectedLocationId(null);
            setSelectedRackId(null);
            setSelectedU(null);
        } else if (fixedLocationId) {
            setSelectedLocationId(fixedLocationId);
        }
    }, [isOpen, fixedLocationId]);

    // Handle slot selection (validate if it fits)
    const handleSlotClick = (u: number) => {
        if (!selectedRack) return;
        
        // Validation check for collision
        const targetEnd = u + deviceHeightU - 1;
        
        // Does it exceed rack height?
        if (targetEnd > selectedRack.height_u) return;

        // Does it collide with existing devices?
        const hasCollision = rackDevices?.some(d => {
            const dEnd = d.position_u! + d.height_u - 1;
            return Math.max(u, d.position_u!) <= Math.min(targetEnd, dEnd);
        });

        if (!hasCollision) {
            setSelectedU(u);
        }
    };

    const handleConfirm = () => {
        if (selectedRackId && selectedU !== null) {
            onConfirm(selectedRackId, selectedU);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Assign Device to Rack" size="xl">
            <div className="flex flex-col h-[70vh] overflow-hidden">
                {/* Header controls */}
                <div className="grid grid-cols-2 gap-4 mb-4 shrink-0">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter by Location</label>
                        <select
                            value={selectedLocationId || ''}
                            onChange={(e) => {
                                setSelectedLocationId(e.target.value ? Number(e.target.value) : null);
                                setSelectedRackId(null);
                                setSelectedU(null);
                            }}
                            disabled={!!fixedLocationId}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                        >
                            <option value="">All Locations</option>
                            {locations?.map(loc => (
                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Rack *</label>
                        <select
                            value={selectedRackId || ''}
                            onChange={(e) => {
                                setSelectedRackId(e.target.value ? Number(e.target.value) : null);
                                setSelectedU(null);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="" disabled>Choose a rack...</option>
                            {racks?.map(rack => (
                                <option key={rack.id} value={rack.id}>{rack.name} ({rack.height_u}U)</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Main visualization area */}
                <div className="flex-1 overflow-hidden flex flex-col bg-gray-50 dark:bg-zinc-900/50 rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
                    {!selectedRackId ? (
                        <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
                            Please select a rack above to view its contents.
                        </div>
                    ) : loadingDevices ? (
                        <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
                            Loading rack devices...
                        </div>
                    ) : (
                        <div className="flex-1 overflow-auto flex justify-center min-h-0">
                            <RackVisualization
                                heightU={selectedRack!.height_u}
                                devices={rackDevices || []}
                                onSlotClick={handleSlotClick}
                                ghostDevice={selectedU !== null ? { u: selectedU, heightU: deviceHeightU } : null}
                            />
                        </div>
                    )}
                </div>
                
                {selectedRackId && (
                    <div className="text-center mt-2 text-sm text-gray-500 dark:text-gray-400 shrink-0">
                        {selectedU !== null ? (
                            <span>Selected Position: <strong className="text-indigo-600 dark:text-indigo-400">U{selectedU}</strong></span>
                        ) : (
                            <span>Click on an empty slot to place the device ({deviceHeightU}U required).</span>
                        )}
                    </div>
                )}

                {/* Footer buttons */}
                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-zinc-800 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={!selectedRackId || selectedU === null}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </Modal>
    );
}
