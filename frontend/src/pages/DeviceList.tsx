import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '../services/inventory';
import { Plus, Monitor, Server, ArrowUpDown, ArrowUp, ArrowDown, Search, FilterX } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AddDeviceModal from '../components/AddDeviceModal';
import EditDeviceModal from '../components/EditDeviceModal';

type SortKey = 'name' | 'device_type' | 'rack' | 'status';

export default function DeviceList() {
    const navigate = useNavigate();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingDeviceId, setEditingDeviceId] = useState<number | null>(null);

    // Sorting
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
        key: 'name',
        direction: 'asc'
    });

    // Filtering
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterRack, setFilterRack] = useState('');

    const { data: devices, isLoading: isLoadingDevices, refetch } = useQuery({
        queryKey: ['all_devices'],
        queryFn: inventoryService.getAllDevices,
    });

    const { data: racks, isLoading: isLoadingRacks } = useQuery({
        queryKey: ['all_racks'],
        queryFn: () => inventoryService.getRacks(),
    });

    const isLoading = isLoadingDevices || isLoadingRacks;

    const handleSort = (key: SortKey) => {
        setSortConfig((current) => {
            if (current.key === key) {
                return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    const clearFilters = () => {
        setSearchQuery('');
        setFilterType('');
        setFilterStatus('');
        setFilterRack('');
    };

    const filteredAndSortedDevices = useMemo(() => {
        if (!devices) return [];

        let result = devices;

        // Apply filters
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
        if (filterRack !== '') {
            if (filterRack === 'unassigned') {
                result = result.filter(d => !d.rack);
            } else {
                result = result.filter(d => d.rack === parseInt(filterRack));
            }
        }

        // Apply sorting
        return result.sort((a, b) => {
            let aValue: any = a[sortConfig.key];
            let bValue: any = b[sortConfig.key];

            if (sortConfig.key === 'rack') {
                const rackA = racks?.find(r => r.id === a.rack);
                const rackB = racks?.find(r => r.id === b.rack);

                aValue = rackA ? `${rackA.name} ${rackA.location.name} ${a.position_u}` : '';
                bValue = rackB ? `${rackB.name} ${rackB.location.name} ${b.position_u}` : '';
            }

            if (aValue === null || aValue === undefined) aValue = '';
            if (bValue === null || bValue === undefined) bValue = '';

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [devices, racks, sortConfig, searchQuery, filterType, filterStatus, filterRack]);

    const renderSortIcon = (key: SortKey) => {
        if (sortConfig.key !== key) return <ArrowUpDown size={14} className="text-gray-400 opacity-50 group-hover:opacity-100 transition-opacity" />;
        return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-indigo-500" /> : <ArrowDown size={14} className="text-indigo-500" />;
    };

    if (isLoading) {
        return <div className="text-gray-500 dark:text-gray-400">Loading devices...</div>;
    }

    const hasActiveFilters = searchQuery !== '' || filterType !== '' || filterStatus !== '' || filterRack !== '';

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Devices</h2>
                    <p className="text-gray-500 dark:text-gray-400">Manage your devices across all datacenter</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shrink-0"
                >
                    <Plus size={20} />
                    <span>Add Device</span>
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 mb-6 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4 items-end lg:items-center">
                    {/* Search Input */}
                    <div className="flex-1 w-full lg:w-auto relative">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Search by Name</label>
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search common name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-gray-200 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap sm:flex-nowrap gap-4 w-full lg:w-auto">
                        <div className="flex-1 sm:w-40 shrink-0">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Type</label>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-gray-200 transition-colors appearance-none"
                            >
                                <option value="">All Types</option>
                                <option value="server">Server</option>
                                <option value="switch">Switch</option>
                                <option value="router">Router</option>
                                <option value="pdu">PDU</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="flex-1 sm:w-40 shrink-0">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-gray-200 transition-colors appearance-none"
                            >
                                <option value="">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="offline">Offline</option>
                                <option value="decommissioned">Decommissioned</option>
                            </select>
                        </div>
                        <div className="flex-1 sm:w-56 shrink-0">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Rack Location</label>
                            <select
                                value={filterRack}
                                onChange={(e) => setFilterRack(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-gray-200 transition-colors appearance-none"
                            >
                                <option value="">All Locations</option>
                                <option value="unassigned">Unassigned (Storage)</option>
                                {racks?.map(rack => (
                                    <option key={rack.id} value={rack.id!.toString()}>
                                        {rack.name} ({rack.location.name})
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex items-end">
                            <button
                                onClick={clearFilters}
                                disabled={!hasActiveFilters}
                                className={`p-2 h-[38px] flex items-center justify-center rounded-lg transition-colors border border-transparent ${
                                    hasActiveFilters 
                                        ? 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' 
                                        : 'text-gray-300 dark:text-zinc-700 cursor-not-allowed'
                                }`}
                                title="Clear filters"
                            >
                                <FilterX size={18} />
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Results Counter */}
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {filteredAndSortedDevices.length} matching {filteredAndSortedDevices.length === 1 ? 'entry' : 'entries'}
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                        <thead className="bg-gray-50 dark:bg-zinc-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-zinc-800">
                            <tr>
                                <th
                                    className="px-6 py-4 font-semibold cursor-pointer group select-none hover:bg-gray-100 dark:hover:bg-zinc-800/80 transition-colors"
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center gap-2">
                                        Common Name
                                        {renderSortIcon('name')}
                                    </div>
                                </th>
                                <th className="px-6 py-4 font-semibold">Label / Asset Tag</th>
                                <th
                                    className="px-6 py-4 font-semibold cursor-pointer group select-none hover:bg-gray-100 dark:hover:bg-zinc-800/80 transition-colors"
                                    onClick={() => handleSort('device_type')}
                                >
                                    <div className="flex items-center gap-2">
                                        Type
                                        {renderSortIcon('device_type')}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 font-semibold cursor-pointer group select-none hover:bg-gray-100 dark:hover:bg-zinc-800/80 transition-colors"
                                    onClick={() => handleSort('rack')}
                                >
                                    <div className="flex items-center gap-2">
                                        Location (Rack)
                                        {renderSortIcon('rack')}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 font-semibold cursor-pointer group select-none hover:bg-gray-100 dark:hover:bg-zinc-800/80 transition-colors"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center gap-2">
                                        Status
                                        {renderSortIcon('status')}
                                    </div>
                                </th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                            {filteredAndSortedDevices.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        {hasActiveFilters ? "No devices match the current filters." : "No devices found. Add one to get started."}
                                    </td>
                                </tr>
                            )}
                            {filteredAndSortedDevices.map((device) => {
                                const rack = racks?.find(r => r.id === device.rack);

                                return (
                                    <tr key={device.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded text-gray-500 dark:text-gray-400">
                                                    <Monitor size={16} />
                                                </div>
                                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                                    {device.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {device.label && <span className="text-xs text-gray-500">LBL: {device.label}</span>}
                                                {device.asset_tag && <span className="text-xs text-gray-500">TAG: {device.asset_tag}</span>}
                                                {!device.label && !device.asset_tag && <span className="text-gray-400">-</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="capitalize px-2.5 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 rounded text-xs font-medium border border-gray-200 dark:border-zinc-700">
                                                {device.device_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {rack ? (
                                                <div
                                                    onClick={() => navigate(`/racks/${device.rack}?device=${device.id}`)}
                                                    className="flex flex-col gap-1 text-indigo-600 dark:text-indigo-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/80 p-1.5 -ml-1.5 rounded transition-colors group/link"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Server size={14} />
                                                        <span className="font-medium group-hover/link:underline">{rack.name}</span>
                                                    </div>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 ml-[22px]">
                                                        {rack.location.name} &bull; U{device.position_u}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 dark:text-gray-500 italic">Unassigned (Storage)</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${device.status === 'active'
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
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setEditingDeviceId(device.id)}
                                                className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium text-sm transition-colors"
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddDeviceModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                rackId={null} // Null rack allows creating in storage
                onSuccess={() => {
                    setIsAddModalOpen(false);
                    refetch();
                }}
            />

            {editingDeviceId && devices?.find(d => d.id === editingDeviceId) && (
                <EditDeviceModal
                    isOpen={!!editingDeviceId}
                    onClose={() => setEditingDeviceId(null)}
                    device={devices.find(d => d.id === editingDeviceId)!}
                    onSuccess={() => {
                        setEditingDeviceId(null);
                        refetch();
                    }}
                />
            )}
        </div>
    );
}
