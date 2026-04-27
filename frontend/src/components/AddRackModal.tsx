import { useState, useEffect } from 'react';
import Modal from './Modal';
import { inventoryService } from '../services/inventory';
import type { Location } from '../services/inventory';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../lib/api';

interface AddRackModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    preselectedLocationId?: number | null;
}

export default function AddRackModal({ isOpen, onClose, onSuccess, preselectedLocationId }: AddRackModalProps) {
    const [name, setName] = useState('');
    const [heightU, setHeightU] = useState(42);
    const [locationId, setLocationId] = useState<number | ''>('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (isOpen) {
            setLocationId(preselectedLocationId || '');
        }
    }, [isOpen, preselectedLocationId]);

    // Locations needed for dropdown
    const { data: locations } = useQuery({
        queryKey: ['locations'],
        queryFn: async () => {
            const { data } = await api.get<Location[]>('/inventory/locations');
            return data;
        },
        enabled: isOpen, // Fetch only when open
    });

    const mutation = useMutation({
        mutationFn: inventoryService.createRack,
        onSuccess: () => {
            onSuccess();
            resetForm();
        },
    });

    const resetForm = () => {
        setName('');
        setHeightU(42);
        setLocationId(preselectedLocationId || '');
        setDescription('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!locationId) {
            alert("Please select a location (create one via API if none exist)");
            return;
        }
        mutation.mutate({
            name,
            height_u: heightU,
            location_id: Number(locationId),
            description
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Rack">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rack Name</label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="e.g. Rack A1"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Height (U)</label>
                    <input
                        type="number"
                        required
                        value={heightU}
                        onChange={(e) => setHeightU(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                    <select
                        required
                        value={locationId}
                        onChange={(e) => setLocationId(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="">Select Location</option>
                        {locations?.map((loc) => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                    </select>
                    {(!locations || locations.length === 0) && (
                        <p className="text-xs text-red-500 mt-1">No locations found. Add a location first.</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                    />
                </div>

                <div className="flex justify-end gap-3 mt-6">
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
                        {mutation.isPending ? 'Creating...' : 'Create Rack'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
