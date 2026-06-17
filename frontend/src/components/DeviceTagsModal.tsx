import { useState } from 'react';
import Modal from './Modal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../services/inventory';
import { Trash2, Plus } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface DeviceTagsModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedTagIds: number[];
    onChange: (ids: number[]) => void;
}

export default function DeviceTagsModal({ isOpen, onClose, selectedTagIds, onChange }: DeviceTagsModalProps) {
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#374151');

    const { data: tags, isLoading } = useQuery({
        queryKey: ['tags'],
        queryFn: inventoryService.getTags,
        enabled: isOpen,
    });

    const createMutation = useMutation({
        mutationFn: inventoryService.createTag,
        onSuccess: (newTag) => {
            queryClient.invalidateQueries({ queryKey: ['tags'] });
            setNewTagName('');
            // Auto select it
            onChange([...selectedTagIds, newTag.id]);
            addToast({ title: 'Tag Created', type: 'success' });
        },
        onError: (err: any) => {
            const detail = err.response?.data?.detail;
            const msg = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail.map((d: any) => d.msg).join(', ') : 'Failed to create tag');
            addToast({ title: 'Error', message: msg, type: 'error' });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: inventoryService.deleteTag,
        onSuccess: (_, deletedId) => {
            queryClient.invalidateQueries({ queryKey: ['tags'] });
            onChange(selectedTagIds.filter(id => id !== deletedId));
            addToast({ title: 'Tag Deleted', type: 'success' });
        }
    });

    const toggleTag = (id: number) => {
        if (selectedTagIds.includes(id)) {
            onChange(selectedTagIds.filter(t => t !== id));
        } else {
            onChange([...selectedTagIds, id]);
        }
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = newTagName.trim();
        if (!trimmedName) return;
        
        // Regex validation for plaintext (letters and spaces only)
        if (!/^[a-zA-Z\s]+$/.test(trimmedName)) {
            addToast({ title: 'Invalid Tag Name', message: 'Only letters and spaces are allowed.', type: 'error' });
            return;
        }

        createMutation.mutate({ name: trimmedName, color: newTagColor });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manage Tags" size="md">
            <div className="space-y-6">
                {/* Create Tag Section */}
                <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Create New Tag</h4>
                    <form onSubmit={handleCreate} className="flex gap-2">
                        <input
                            type="color"
                            value={newTagColor}
                            onChange={(e) => setNewTagColor(e.target.value)}
                            className="w-10 h-10 p-1 rounded border border-gray-300 dark:border-zinc-700 cursor-pointer bg-white dark:bg-zinc-800"
                        />
                        <input
                            type="text"
                            placeholder="Tag name (letters only)"
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <button
                            type="submit"
                            disabled={createMutation.isPending || !newTagName.trim()}
                            className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                        >
                            <Plus size={20} />
                        </button>
                    </form>
                </div>

                {/* Available Tags */}
                <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Available Tags</h4>
                    {isLoading ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Loading tags...</p>
                    ) : tags?.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No tags defined yet.</p>
                    ) : (
                        <ul className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                            {tags?.map(tag => {
                                const isSelected = selectedTagIds.includes(tag.id);
                                return (
                                    <li key={tag.id} className="flex items-center justify-between p-2 rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <label className="flex items-center gap-3 flex-1 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleTag(tag.id)}
                                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300 dark:border-zinc-600"
                                            />
                                            <span 
                                                className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                                                style={{ backgroundColor: `${tag.color}20`, color: tag.color, border: `1px solid ${tag.color}40` }}
                                            >
                                                {tag.name}
                                            </span>
                                        </label>
                                        
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (confirm(`Are you sure you want to globally delete the tag "${tag.name}"?`)) {
                                                    deleteMutation.mutate(tag.id);
                                                }
                                            }}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                            title={`Delete tag ${tag.name}`}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-zinc-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </Modal>
    );
}
