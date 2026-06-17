import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '../services/inventory';
import { Plus, Monitor, Server, ArrowUpDown, ArrowUp, ArrowDown, Search, FilterX, Pencil, MoreVertical } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import AddDeviceModal from '../components/AddDeviceModal';
import EditDeviceModal from '../components/EditDeviceModal';
import MultiSelect from '../components/MultiSelect';
import TagsTooltip from '../components/TagsTooltip';
import { useSettings } from '../context/SettingsContext';

type SortKey = 'name' | 'device_type' | 'rack' | 'status';

export default function DeviceList() {
    const navigate = useNavigate();
    const { selectedLocationId } = useOutletContext<{ selectedLocationId: number | null }>();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingDeviceId, setEditingDeviceId] = useState<number | null>(null);
    const { compactTagsView } = useSettings();

    // Sorting
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
        key: 'name',
        direction: 'asc'
    });

    // Filtering
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string[]>([]);
    const [filterStatus, setFilterStatus] = useState<string[]>([]);
    const [filterRack, setFilterRack] = useState<string[]>([]);
    const [filterTags, setFilterTags] = useState<string[]>([]);

    const { data: devices, isLoading: isLoadingDevices, refetch } = useQuery({
        queryKey: ['all_devices', selectedLocationId],
        queryFn: () => inventoryService.getAllDevices(selectedLocationId),
    });

    const { data: locations } = useQuery({
        queryKey: ['locations'],
        queryFn: inventoryService.getLocations,
    });

    const { data: racks, isLoading: isLoadingRacks } = useQuery({
        queryKey: ['all_racks', selectedLocationId],
        queryFn: () => inventoryService.getRacks(selectedLocationId),
    });

    const { data: globalTags, isLoading: isLoadingTags } = useQuery({
        queryKey: ['tags'],
        queryFn: inventoryService.getTags,
    });

    const isLoading = isLoadingDevices || isLoadingRacks || isLoadingTags;

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
        setFilterType([]);
        setFilterStatus([]);
        setFilterRack([]);
        setFilterTags([]);
    };

    const filteredAndSortedDevices = useMemo(() => {
        if (!devices) return [];

        let result = devices;

        // Apply filters
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            result = result.filter(d => d.name.toLowerCase().includes(query));
        }
        if (filterType.length > 0) {
            result = result.filter(d => filterType.includes(d.device_type));
        }
        if (filterStatus.length > 0) {
            result = result.filter(d => filterStatus.includes(d.status));
        }
        if (filterRack.length > 0) {
            result = result.filter(d => {
                if (filterRack.includes('unassigned') && !d.rack) return true;
                if (d.rack && filterRack.includes(d.rack.toString())) return true;
                return false;
            });
        }
        if (filterTags.length > 0) {
            result = result.filter(d => d.tags && d.tags.some(t => filterTags.includes(t.id.toString())));
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
    }, [devices, racks, sortConfig, searchQuery, filterType, filterStatus, filterRack, filterTags]);

    const renderSortIcon = (key: SortKey) => {
        if (sortConfig.key !== key) return <ArrowUpDown size={14} className="text-gray-400 opacity-50 group-hover:opacity-100 transition-opacity" />;
        return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-indigo-500" /> : <ArrowDown size={14} className="text-indigo-500" />;
    };

    if (isLoading) {
        return <div className="text-gray-500 dark:text-gray-400">Loading devices...</div>;
    }

    const hasActiveFilters = searchQuery !== '' || filterType.length > 0 || filterStatus.length > 0 || filterRack.length > 0 || filterTags.length > 0;

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
                            <MultiSelect
                                label="Type"
                                placeholder="All Types"
                                selectedValues={filterType}
                                onChange={setFilterType}
                                options={[
                                    { value: 'server', label: 'Server' },
                                    { value: 'switch', label: 'Switch' },
                                    { value: 'router', label: 'Router' },
                                    { value: 'pdu', label: 'PDU' },
                                    { value: 'other', label: 'Other' }
                                ]}
                            />
                        </div>
                        <div className="flex-1 sm:w-40 shrink-0">
                            <MultiSelect
                                label="Status"
                                placeholder="All Statuses"
                                selectedValues={filterStatus}
                                onChange={setFilterStatus}
                                options={[
                                    { value: 'active', label: 'Active' },
                                    { value: 'maintenance', label: 'Maintenance' },
                                    { value: 'offline', label: 'Offline' },
                                    { value: 'decommissioned', label: 'Decommissioned' }
                                ]}
                            />
                        </div>
                        <div className="flex-1 sm:w-56 shrink-0">
                            <MultiSelect
                                label="Rack Location"
                                placeholder="All Locations"
                                selectedValues={filterRack}
                                onChange={setFilterRack}
                                options={[
                                    { value: 'unassigned', label: 'Unassigned (Storage)' },
                                    ...(racks?.map(rack => ({
                                        value: rack.id!.toString(),
                                        label: `${rack.name} (${rack.location.name})`
                                    })) || [])
                                ]}
                            />
                        </div>
                        <div className="flex-1 sm:w-48 shrink-0">
                            <MultiSelect
                                label="Tags"
                                placeholder="All Tags"
                                selectedValues={filterTags}
                                onChange={setFilterTags}
                                options={globalTags?.map(tag => ({
                                    value: tag.id.toString(),
                                    label: tag.name
                                })) || []}
                            />
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={clearFilters}
                                disabled={!hasActiveFilters}
                                className={`p-2 h-[38px] flex items-center justify-center rounded-lg transition-colors border border-transparent ${hasActiveFilters
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
                                <th className="px-6 py-4 font-semibold">Tags</th>
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
                                            <div className="flex flex-wrap gap-1 max-w-[150px]">
                                                {device.tags && device.tags.length > 0 ? (
                                                    compactTagsView && device.tags.length > 3 ? (
                                                        <>
                                                            {device.tags.slice(0, 3).map(tag => (
                                                                <span
                                                                    key={tag.id}
                                                                    className="px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap"
                                                                    style={{ backgroundColor: `${tag.color}20`, color: tag.color, border: `1px solid ${tag.color}40` }}
                                                                >
                                                                    {tag.name}
                                                                </span>
                                                            ))}
                                                            <TagsTooltip
                                                                tagsContent={
                                                                    <>
                                                                        {device.tags.map(tag => (
                                                                            <span
                                                                                key={tag.id}
                                                                                className="px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap"
                                                                                style={{ backgroundColor: `${tag.color}20`, color: tag.color, border: `1px solid ${tag.color}40` }}
                                                                            >
                                                                                {tag.name}
                                                                            </span>
                                                                        ))}
                                                                    </>
                                                                }
                                                            >
                                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-zinc-800 text-gray-500 border border-gray-200 dark:border-zinc-700 cursor-help flex items-center justify-center">
                                                                    <MoreVertical size={12} />
                                                                </span>
                                                            </TagsTooltip>
                                                        </>
                                                    ) : (
                                                        device.tags.map(tag => (
                                                            <span
                                                                key={tag.id}
                                                                className="px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap"
                                                                style={{ backgroundColor: `${tag.color}20`, color: tag.color, border: `1px solid ${tag.color}40` }}
                                                            >
                                                                {tag.name}
                                                            </span>
                                                        ))
                                                    )
                                                ) : (
                                                    <span className="text-gray-400 text-xs">-</span>
                                                )}
                                            </div>
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
                                                <span className="text-gray-400 dark:text-gray-500 italic">
                                                    Unassigned (In storage at {locations?.find(l => l.id === device.location)?.name || 'Unknown'})
                                                </span>
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
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                                title="Edit Device"
                                            >
                                                <Pencil size={18} />
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
