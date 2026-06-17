import { useState } from 'react';
import Modal from './Modal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../services/inventory';
import { useToast } from '../context/ToastContext';

interface AddLocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (newLocationId: number) => void;
}

export default function AddLocationModal({ isOpen, onClose, onSuccess }: AddLocationModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    const createMutation = useMutation({
        mutationFn: inventoryService.createLocation,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
            addToast({ title: 'Location Added', type: 'success' });
            setName('');
            setDescription('');
            if (onSuccess) onSuccess(data.id);
            onClose();
        },
        onError: (err: any) => {
            addToast({ title: 'Error adding location', message: err.message, type: 'error' });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate({ name, description });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Location">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Location Name *
                    </label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="e.g. Server Room A"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-y min-h-[80px]"
                        placeholder="Optional details about this location..."
                    />
                </div>

                <div className="flex justify-end gap-3 mt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={createMutation.isPending}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {createMutation.isPending ? 'Saving...' : 'Save Location'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
