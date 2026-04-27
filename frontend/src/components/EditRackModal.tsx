import { useState, useEffect } from 'react';
import Modal from './Modal';
import { inventoryService, type Rack, type Device } from '../services/inventory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useToast } from '../context/ToastContext';

interface EditRackModalProps {
    isOpen: boolean;
    onClose: () => void;
    rack: Rack;
}

type DeleteStep = 'idle' | 'confirm_intent' | 'choose_strategy' | 'deleting';
type ResizeStep = 'idle' | 'lengthen_choice' | 'lengthen_collision_check' | 'shorten_collision_check' | 'resizing';

export default function EditRackModal({ isOpen, onClose, rack }: EditRackModalProps) {
    const [name, setName] = useState(rack.name);
    const [description, setDescription] = useState(rack.description);
    const [height, setHeight] = useState(rack.height_u);
    const [deleteStep, setDeleteStep] = useState<DeleteStep>('idle');
    const [resizeStep, setResizeStep] = useState<ResizeStep>('idle');

    // Resize State
    const [pendingHeight, setPendingHeight] = useState<number>(rack.height_u);
    const [, setResizeDetails] = useState<{
        mode: 'lengthen' | 'shorten';
        delta: number;
        addToTop?: boolean; // For lengthen: true=Top, false=Bottom
        collisionDevice?: Device; // The device causing a conflict
    } | null>(null);

    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { addToast } = useToast();

    // Fetch devices for collision detection
    const { data: devices } = useQuery({
        queryKey: ['rack', rack.id, 'devices'],
        queryFn: () => inventoryService.getDevices(rack.id!),
        enabled: isOpen,
    });

    // Reset form when rack changes (or opens)
    useEffect(() => {
        if (isOpen) {
            setName(rack.name);
            setDescription(rack.description);
            setHeight(rack.height_u);
            setPendingHeight(rack.height_u);
            setDeleteStep('idle');
            setResizeStep('idle');
            setResizeDetails(null);
        }
    }, [isOpen, rack]);

    const updateMutation = useMutation({
        mutationFn: (data: { name: string; description: string }) =>
            inventoryService.updateRack(rack.id!, data),
        onSuccess: (updatedRack) => {
            queryClient.setQueryData(['rack', rack.id], updatedRack);
            queryClient.invalidateQueries({ queryKey: ['racks'] });
            onClose();
            addToast({ title: 'Rack Updated', type: 'success' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (strategy: 'decommission' | 'delete') =>
            inventoryService.deleteRack(rack.id!, strategy),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['racks'] });
            onClose();
            addToast({ title: 'Rack Deleted', type: 'success' });
            navigate('/inventory');
        },
    });

    const resizeMutation = useMutation({
        mutationFn: (payload: { new_height: number; device_moves: any[]; device_removals: any[] }) =>
            inventoryService.resizeRack(rack.id!, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rack', rack.id] });
            queryClient.invalidateQueries({ queryKey: ['racks'] });
            setResizeStep('idle');
            setResizeDetails(null);
            // After resize, we might want to continue saving Name/Desc if changed, or just close.
            // Assuming "Save Changes" handles everything.
            // If name/desc changed, we trigger that too.
            if (name !== rack.name || description !== rack.description) {
                updateMutation.mutate({ name, description });
            } else {
                onClose();
                addToast({ title: 'Rack Resized', message: `Height updated to ${pendingHeight} U`, type: 'success' });
            }
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Check for height change
        if (height !== rack.height_u) {
            handleResizeStart();
        } else {
            // Just update metadata
            updateMutation.mutate({ name, description });
        }
    };

    // --- Resize Logic ---

    const handleResizeStart = () => {
        const delta = height - rack.height_u;
        if (delta === 0) return;

        setPendingHeight(height);

        if (delta > 0) {
            // Lengthening (Always from Top)
            executeResize([], [], height);
        } else {
            // Shortening (Always from Top)
            checkForShortenCollision(height);
        }
    };

    const checkForShortenCollision = (newHeight: number) => {
        // Shortening from Top.
        // Any device sticking out above newHeight?
        // d.end_u > newHeight
        const stickingOutDevices = devices?.filter(d => (d.position_u! + d.height_u - 1) > newHeight);

        if (stickingOutDevices && stickingOutDevices.length > 0) {
            setResizeDetails({ mode: 'shorten', delta: newHeight - rack.height_u });
            setResizeStep('shorten_collision_check');
        } else {
            // Safe to shorten - Pass newHeight explicitly because pendingHeight state hasn't updated yet
            executeResize([], [], newHeight);
        }
    };

    const executeResize = (moves: any[], removals: any[], explicitHeight?: number) => {
        resizeMutation.mutate({
            new_height: explicitHeight ?? pendingHeight,
            device_moves: moves,
            device_removals: removals
        });
    };

    const cancelResize = () => {
        setHeight(rack.height_u);
        setResizeStep('idle');
        setResizeDetails(null);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Rack">
            <div className="relative">
                {/* Main Form */}
                <form
                    onSubmit={handleSubmit}
                    className={clsx("space-y-4 transition-all duration-300",
                        (deleteStep !== 'idle' || resizeStep !== 'idle') && "blur-sm pointer-events-none opacity-50"
                    )}
                >
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rack Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Height (U)</label>
                        <input
                            type="number"
                            required
                            min="1"
                            max="100"
                            value={height}
                            onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                        />
                    </div>

                    <div className="flex justify-between items-center mt-6 pt-2">
                        <button
                            type="button"
                            onClick={() => setDeleteStep('confirm_intent')}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete Rack"
                        >
                            <Trash2 size={20} />
                        </button>

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
                                disabled={updateMutation.isPending || resizeMutation.isPending}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                {updateMutation.isPending || resizeMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </form>

                {/* --- Overlays --- */}

                {/* 1. Delete Flow */}
                {deleteStep !== 'idle' && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-4 animate-in fade-in zoom-in duration-200">
                        {deleteStep === 'confirm_intent' && (
                            <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm p-6 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-700 max-w-sm w-full">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Delete this Rack?</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Are you sure you want to proceed with deleting "{rack.name}"?</p>
                                <div className="flex justify-center gap-4">
                                    <button onClick={() => setDeleteStep('idle')} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium">No</button>
                                    <button onClick={() => {
                                        if (devices && devices.length > 0) {
                                            setDeleteStep('choose_strategy');
                                        } else {
                                            deleteMutation.mutate('delete');
                                        }
                                    }} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium">Yes</button>
                                </div>
                            </div>
                        )}
                        {deleteStep === 'choose_strategy' && (
                            <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm p-6 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-700 max-w-sm w-full">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Choose Action</h3>
                                <div className="flex flex-col gap-3">
                                    <button onClick={() => deleteMutation.mutate('decommission')} className="px-4 py-3 bg-gray-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">Decommission Devices & Delete Rack</button>
                                    <button onClick={() => deleteMutation.mutate('delete')} className="px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium">Delete Everything</button>
                                    <button onClick={() => setDeleteStep('idle')} className="mt-2 text-sm text-gray-500 hover:underline">Cancel</button>
                                </div>
                            </div>
                        )}
                        {deleteMutation.isPending && (
                            <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm p-6 rounded-xl shadow-lg flex flex-col items-center">
                                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                                <p className="text-gray-900 dark:text-gray-100 font-medium">Processing...</p>
                            </div>
                        )}
                    </div>
                )}

                {/* 2. Resize Flow */}
                {resizeStep !== 'idle' && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-4 animate-in fade-in zoom-in duration-200">
                        {/* C. Shorten Collision */}
                        {resizeStep === 'shorten_collision_check' && (
                            <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm p-6 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-700 max-w-sm w-full">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Device Conflict</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                    There is a device at the top of the rack. Please move or remove it before resizing the rack.
                                </p>
                                <div className="flex flex-col gap-3">
                                    <button onClick={cancelResize} className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium">Okay</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}
