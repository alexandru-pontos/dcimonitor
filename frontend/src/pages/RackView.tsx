import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { inventoryService } from '../services/inventory';
import RackVisualization from '../components/RackVisualization';
import { ArrowLeft, Box } from 'lucide-react';
import { useState, useEffect } from 'react';
import AddDeviceModal from '../components/AddDeviceModal';
import EditRackModal from '../components/EditRackModal';
import EditDeviceModal from '../components/EditDeviceModal';
import AddDeviceChoiceModal from '../components/AddDeviceChoiceModal';
import AssignExistingDeviceModal from '../components/AssignExistingDeviceModal';
import { type Device } from '../services/inventory';

export default function RackView() {
    const { rackId: id } = useParams<{ rackId: string }>();
    const rackId = parseInt(id || '0');
    const [isAddChoiceModalOpen, setIsAddChoiceModalOpen] = useState(false);
    const [isAssignExistingOpen, setIsAssignExistingOpen] = useState(false);
    const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
    const [isEditRackOpen, setIsEditRackOpen] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

    const [selectedU, setSelectedU] = useState<number | null>(null);

    const [searchParams, setSearchParams] = useSearchParams();

    const { data: rack, isLoading: rackLoading } = useQuery({
        queryKey: ['rack', rackId],
        queryFn: () => inventoryService.getRack(rackId),
        enabled: !!rackId,
    });

    const { data: devices, isLoading: devicesLoading, refetch: refetchDevices } = useQuery({
        queryKey: ['rack', rackId, 'devices'],
        queryFn: () => inventoryService.getDevices(rackId),
        enabled: !!rackId,
    });

    useEffect(() => {
        const deviceId = searchParams.get('device');
        if (deviceId && devices) {
            const dev = devices.find(d => d.id === parseInt(deviceId));
            if (dev) {
                setSelectedDevice(dev);
                if (dev.position_u) setSelectedU(dev.position_u);
                
                // Clear the param so it doesn't reopen if the user closes it
                searchParams.delete('device');
                setSearchParams(searchParams, { replace: true });
            }
        }
    }, [searchParams, devices, setSearchParams]);

    const handleSlotClick = (u: number) => {
        if (selectedU === u) {
            // Double click (or second click) -> Open Choice Modal
            setIsAddChoiceModalOpen(true);
        } else {
            // Select row
            setSelectedU(u);
        }
    };

    const handleDeviceClick = (device: Device) => {
        if (selectedU === device.position_u) {
            // Already selected -> Open Edit Modal
            setSelectedDevice(device);
        } else {
            // Select row (by Device's Start U)
            setSelectedU(device.position_u!);
        }
    };

    const handleModalClose = () => {
        setIsAddChoiceModalOpen(false);
        setIsAssignExistingOpen(false);
        setIsAddDeviceOpen(false);
        setSelectedU(null); // Clear selection on close
    };

    const assignExistingDeviceMutation = useMutation({
        mutationFn: (deviceId: number) => 
            inventoryService.updateDevice(deviceId, { 
                rack: rackId, 
                position_u: selectedU || 1 
            }),
        onSuccess: () => {
            refetchDevices();
            setIsAssignExistingOpen(false);
            setSelectedU(null);
        }
    });

    const moveDeviceMutation = useMutation({
        mutationFn: (data: { id: number; position_u: number }) =>
            inventoryService.updateDevice(data.id, { position_u: data.position_u }),
        onSuccess: () => {
            refetchDevices();
            // todo: Toast
        },
        onError: () => {
            // todo
        }
    });

    const handleMoveDevice = (device: Device, newU: number) => {
        // Optimistic update could happen here, but for now we rely on mutation + refetch
        moveDeviceMutation.mutate({ id: device.id, position_u: newU });
        // Update selection to follow the device
        setSelectedU(newU);
    };

    if (rackLoading || devicesLoading) return <div className="p-8 dark:text-gray-300">Loading...</div>;
    if (!rack) return <div className="p-8 dark:text-gray-300">Rack not found</div>;

    return (
        <div className="flex gap-8 h-[calc(100vh-8rem)]">
            {/* Left Stats / Info */}
            <div className="w-80 shrink-0 flex flex-col gap-6">
                <div>
                    <Link to="/racks" className="flex items-center text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 mb-4 transition-colors">
                        <ArrowLeft size={16} className="mr-1" /> Back to Racks
                    </Link>

                    <div className="flex items-start justify-between group relative">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{rack.name}</h2>
                    </div>

                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mt-1">
                        <Box size={16} />
                        <span>{rack.location.name}</span>
                    </div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        {rack.description || "No description provided."}
                    </p>
                </div>

                <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm relative group">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-200">Stats</h4>
                        <button
                            onClick={() => setIsEditRackOpen(true)}
                            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline transition-colors"
                        >
                            Edit Rack
                        </button>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Total U Height</span>
                            <span className="font-mono text-gray-900 dark:text-gray-200">{rack.height_u}U</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Occupied U</span>
                            <span className="font-mono text-gray-900 dark:text-gray-200">
                                {devices?.reduce((acc, d) => acc + d.height_u, 0) || 0}U
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Devices</span>
                            <span className="font-mono text-gray-900 dark:text-gray-200">{devices?.length || 0}</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => {
                        setSelectedU(null);
                        setIsAddChoiceModalOpen(true);
                    }}
                    className="bg-indigo-600 text-white w-full py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    Add Device
                </button>
            </div>

            {/* Rack Visual */}
            <div
                className="flex-1 overflow-auto flex justify-center bg-gray-50 dark:bg-zinc-900/50 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 min-h-0"
                onClick={(e) => {
                    if (e.target === e.currentTarget) setSelectedU(null);
                }}
            >
                <RackVisualization
                    heightU={rack.height_u}
                    devices={devices || []}
                    onSlotClick={handleSlotClick}
                    onDeviceClick={handleDeviceClick}
                    onMoveDevice={handleMoveDevice}
                    selectedU={selectedU}
                />
            </div>

            <AddDeviceChoiceModal
                isOpen={isAddChoiceModalOpen}
                onClose={() => setIsAddChoiceModalOpen(false)}
                onSelectCreateNew={() => {
                    setIsAddChoiceModalOpen(false);
                    setIsAddDeviceOpen(true);
                }}
                onSelectAssignExisting={() => {
                    setIsAddChoiceModalOpen(false);
                    setIsAssignExistingOpen(true);
                }}
            />

            <AssignExistingDeviceModal
                isOpen={isAssignExistingOpen}
                onClose={handleModalClose}
                onAssignDevice={(deviceId) => assignExistingDeviceMutation.mutate(deviceId)}
                isAssigning={assignExistingDeviceMutation.isPending}
            />

            <AddDeviceModal
                isOpen={isAddDeviceOpen}
                onClose={handleModalClose}
                onSuccess={() => {
                    handleModalClose();
                    refetchDevices();
                }}
                rackId={rackId}
                rackHeight={rack?.height_u || 42}
                initialPosition={selectedU || 1}
            />

            <EditRackModal
                isOpen={isEditRackOpen}
                onClose={() => setIsEditRackOpen(false)}
                rack={rack}
            />

            {selectedDevice && (
                <EditDeviceModal
                    isOpen={!!selectedDevice}
                    onClose={() => setSelectedDevice(null)}
                    device={selectedDevice}
                    rackHeight={rack.height_u}
                />
            )}
        </div>
    );
}
