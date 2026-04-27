import Modal from './Modal';
import { PlusSquare, ArchiveRestore } from 'lucide-react';

interface AddDeviceChoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectCreateNew: () => void;
    onSelectAssignExisting: () => void;
}

export default function AddDeviceChoiceModal({
    isOpen,
    onClose,
    onSelectCreateNew,
    onSelectAssignExisting
}: AddDeviceChoiceModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Device to Rack">
            <div className="flex flex-col gap-4">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Would you like to create a new device, or assign an existing unassigned device from storage?
                </p>

                <button
                    onClick={onSelectAssignExisting}
                    className="flex items-start gap-4 p-4 border border-gray-200 dark:border-zinc-800 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-left group"
                >
                    <div className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-lg group-hover:bg-white dark:group-hover:bg-zinc-900 transition-colors shrink-0">
                        <ArchiveRestore size={24} className="text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                            Assign Existing Device
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Choose a device from your storage inventory and mount it into this rack.
                        </p>
                    </div>
                </button>

                <button
                    onClick={onSelectCreateNew}
                    className="flex items-start gap-4 p-4 border border-gray-200 dark:border-zinc-800 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-left group"
                >
                    <div className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-lg group-hover:bg-white dark:group-hover:bg-zinc-900 transition-colors shrink-0">
                        <PlusSquare size={24} className="text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                            Create New Device
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Create a brand new device from scratch and immediately mount it here.
                        </p>
                    </div>
                </button>
            </div>
            <div className="mt-6 flex justify-end">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                    Cancel
                </button>
            </div>
        </Modal>
    );
}
