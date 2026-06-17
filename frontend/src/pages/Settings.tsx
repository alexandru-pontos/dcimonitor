import { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Save, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function Settings() {
    const { compactTagsView, setCompactTagsView } = useSettings();
    const { addToast } = useToast();
    
    // Local state for unsaved edits
    const [localCompactTagsView, setLocalCompactTagsView] = useState(compactTagsView);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        setHasChanges(localCompactTagsView !== compactTagsView);
    }, [localCompactTagsView, compactTagsView]);

    // If the global context updates from somewhere else, stay in sync if no unsaved changes
    useEffect(() => {
        if (!hasChanges) {
            setLocalCompactTagsView(compactTagsView);
        }
    }, [compactTagsView, hasChanges]);

    const handleSave = () => {
        setCompactTagsView(localCompactTagsView);
        addToast({ title: 'Preferences saved successfully', type: 'success' });
    };

    const handleCancel = () => {
        setLocalCompactTagsView(compactTagsView);
    };

    return (
        <div className="flex flex-col h-full relative pb-20">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
                <p className="text-gray-500 dark:text-gray-400">Manage your application preferences</p>
            </div>

            <div className="flex-1 w-full border-t border-gray-200 dark:border-zinc-800">
                <section className="py-6 border-b border-gray-200 dark:border-zinc-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Device List Preferences</h3>
                    
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Compact Tags View</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Collapse tags into a tooltip when a device has more than 3 tags. This helps keep the device list clean when you have many tags assigned.
                            </p>
                        </div>
                        
                        {/* Toggle Switch */}
                        <button 
                            type="button"
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${localCompactTagsView ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-zinc-700'}`}
                            onClick={() => setLocalCompactTagsView(!localCompactTagsView)}
                            role="switch"
                            aria-checked={localCompactTagsView}
                        >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${localCompactTagsView ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </section>
            </div>

            {/* Sticky Footer for unsaved changes */}
            <div className={`fixed bottom-0 right-0 md:left-64 left-0 p-4 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-transform duration-300 transform ${hasChanges ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="w-full flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">You have unsaved changes</p>
                    <div className="flex gap-3">
                        <button
                            onClick={handleCancel}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors font-medium text-sm"
                        >
                            <X size={16} />
                            <span>Cancel edits</span>
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
                        >
                            <Save size={16} />
                            <span>Save changes</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
