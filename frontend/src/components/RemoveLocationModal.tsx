import { useState } from 'react';
import Modal from './Modal';
import { inventoryService } from '../services/inventory';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface RemoveLocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLocationDeleted: (id: number) => void;
}

export default function RemoveLocationModal({ isOpen, onClose, onLocationDeleted }: RemoveLocationModalProps) {
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const [confirmId, setConfirmId] = useState<number | null>(null);

    const { data: locations, isLoading } = useQuery({
        queryKey: ['locations'],
        queryFn: inventoryService.getLocations,
        enabled: isOpen,
    });

    const deleteMutation = useMutation({
        mutationFn: inventoryService.deleteLocation,
        onSuccess: (_, deletedId) => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
            queryClient.invalidateQueries({ queryKey: ['racks'] });
            queryClient.invalidateQueries({ queryKey: ['all_devices'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            addToast({ title: 'Location Deleted', type: 'success' });
            onLocationDeleted(deletedId);
            setConfirmId(null);
            
            // Close modal if no more locations left after this one
            if (locations && locations.length <= 1) {
                onClose();
            }
        },
        onError: () => {
            addToast({ title: 'Delete Failed', message: 'Could not delete the location.', type: 'error' });
        }
    });

    return (
        <Modal isOpen={isOpen} onClose={() => {
            setConfirmId(null);
            onClose();
        }} title="Remove Location" size="md">
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {isLoading ? (
                    <div className="text-gray-500 dark:text-gray-400 p-4">Loading locations...</div>
                ) : locations?.length === 0 ? (
                    <div className="text-gray-500 dark:text-gray-400 p-4">No locations available.</div>
                ) : (
                    <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {locations?.map((loc) => (
                            <li key={loc.id} className="py-4">
                                {confirmId === loc.id ? (
                                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800/30">
                                        <p className="text-sm text-red-800 dark:text-red-300 mb-4 font-medium">
                                            This action will delete all racks and devices associated with "{loc.name}".
                                            Remember to move said racks or devices before committing.
                                        </p>
                                        <div className="flex gap-3 justify-end">
                                            <button
                                                onClick={() => setConfirmId(null)}
                                                className="px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors border border-gray-300 dark:border-zinc-600"
                                                disabled={deleteMutation.isPending}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => deleteMutation.mutate(loc.id)}
                                                disabled={deleteMutation.isPending}
                                                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                                            >
                                                {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center group">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{loc.name}</h4>
                                            {loc.description && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{loc.description}</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setConfirmId(loc.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                            title={`Delete ${loc.name}`}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </Modal>
    );
}
