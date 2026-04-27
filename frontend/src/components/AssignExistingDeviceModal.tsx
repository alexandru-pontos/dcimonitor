import { useState, useMemo } from 'react';
import Modal from './Modal';
import { Search, FilterX, Monitor } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '../services/inventory';

interface AssignExistingDeviceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAssignDevice: (deviceId: number) => void;
    isAssigning: boolean;
}

export default function AssignExistingDeviceModal({
    isOpen,
    onClose,
    onAssignDevice,
    isAssigning
}: AssignExistingDeviceModalProps) {
    const { data: devices, isLoading } = useQuery({
        queryKey: ['all_devices'],
        queryFn: inventoryService.getAllDevices,
        enabled: isOpen,
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const clearFilters = () => {
        setSearchQuery('');
        setFilterType('');
        setFilterStatus('');
    };

    const unassignedDevices = useMemo(() => {
        if (!devices) return [];
        let result = devices.filter(d => d.rack === null);

        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            result = result.filter(d => d.name.toLowerCase().includes(query));
        }
        if (filterType !== '') {
            result = result.filter(d => d.device_type === filterType);
        }
        if (filterStatus !== '') {
            result = result.filter(d => d.status === filterStatus);
        }

        return result.sort((a, b) => a.name.localeCompare(b.name));
    }, [devices, searchQuery, filterType, filterStatus]);

    const hasActiveFilters = searchQuery !== '' || filterType !== '' || filterStatus !== '';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Assign Existing Device" size="xl">
            {isLoading ? (
                <div className="py-8 text-center text-gray-500">Loading devices...</div>
            ) : (
                <div className="flex flex-col gap-4">
                    {/* Filters Bar */}
                    <div className="bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-800 rounded-xl p-4">
                        <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
                            {/* Search Input */}
                            <div className="flex-1 w-full relative">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Search by Name</label>
                                <div className="relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search common name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-gray-200 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="flex flex-wrap sm:flex-nowrap gap-4 w-full md:w-auto">
                                <div className="flex-1 sm:w-32 shrink-0">
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Type</label>
                                    <select
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-gray-200 transition-colors appearance-none"
                                    >
                                        <option value="">All Types</option>
                                        <option value="server">Server</option>
                                        <option value="switch">Switch</option>
                                        <option value="router">Router</option>
                                        <option value="pdu">PDU</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="flex-1 sm:w-32 shrink-0">
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-gray-200 transition-colors appearance-none"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="active">Active</option>
                                        <option value="maintenance">Maintenance</option>
                                        <option value="offline">Offline</option>
                                        <option value="decommissioned">Decommissioned</option>
                                    </select>
                                </div>
                                
                                <div className="flex items-end">
                                    <button
                                        onClick={clearFilters}
                                        disabled={!hasActiveFilters}
                                        className={`p-2 h-[38px] flex items-center justify-center rounded-lg transition-colors border border-transparent ${
                                            hasActiveFilters 
                                                ? 'text-gray-400 hover:text-red-500 hover:bg-white dark:hover:bg-zinc-800 border-gray-200 dark:border-zinc-700' 
                                                : 'text-gray-300 dark:text-zinc-700 cursor-not-allowed'
                                        }`}
                                        title="Clear filters"
                                    >
                                        <FilterX size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
                            {unassignedDevices.length} matching {unassignedDevices.length === 1 ? 'device' : 'devices'} in storage
                        </div>
                    </div>

                    <div className="border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                            <thead className="bg-gray-50 dark:bg-zinc-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-zinc-800 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Common Name</th>
                                    <th className="px-4 py-3 font-semibold">Label / Tag</th>
                                    <th className="px-4 py-3 font-semibold">Type</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                    <th className="px-4 py-3 font-semibold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                                {unassignedDevices.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                            {hasActiveFilters ? "No unassigned devices match the current filters." : "No unassigned devices available in storage."}
                                        </td>
                                    </tr>
                                )}
                                {unassignedDevices.map((device) => (
                                    <tr key={device.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-gray-100 dark:bg-zinc-800 rounded text-gray-500 dark:text-gray-400">
                                                    <Monitor size={14} />
                                                </div>
                                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                                    {device.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-1">
                                                {device.label && <span className="text-xs text-gray-500">LBL: {device.label}</span>}
                                                {device.asset_tag && <span className="text-xs text-gray-500">TAG: {device.asset_tag}</span>}
                                                {!device.label && !device.asset_tag && <span className="text-gray-400">-</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="capitalize px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 rounded text-xs font-medium border border-gray-200 dark:border-zinc-700">
                                                {device.device_type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                                                device.status === 'active' 
                                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30'
                                                    : device.status === 'offline'
                                                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/30'
                                                        : device.status === 'decommissioned'
                                                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700'
                                                            : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/30'
                                            }`}>
                                                {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button 
                                                onClick={() => onAssignDevice(device.id)}
                                                disabled={isAssigning}
                                                className="px-3 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                            >
                                                Assign
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="flex justify-end gap-3 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
}
