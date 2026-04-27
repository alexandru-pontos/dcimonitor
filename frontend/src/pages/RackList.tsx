import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '../services/inventory';
import { Plus, Server, Search } from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import { useState, useMemo } from 'react';
import AddRackModal from '../components/AddRackModal';

export default function RackList() {
    const { selectedLocationId } = useOutletContext<{ selectedLocationId: number | null }>();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    const { data: racks, isLoading: isLoadingRacks, refetch } = useQuery({
        queryKey: ['racks', selectedLocationId],
        queryFn: () => inventoryService.getRacks(selectedLocationId),
    });

    const { data: allDevices, isLoading: isLoadingDevices } = useQuery({
        queryKey: ['all_devices'],
        queryFn: inventoryService.getAllDevices,
    });

    const isLoading = isLoadingRacks || isLoadingDevices;

    const filteredRacks = useMemo(() => {
        if (!racks) return [];
        if (!searchQuery.trim()) return racks;
        const query = searchQuery.toLowerCase();
        return racks.filter(r => r.name.toLowerCase().includes(query));
    }, [racks, searchQuery]);

    if (isLoading) {
        return <div className="p-8 text-gray-500 dark:text-gray-400">Loading racks...</div>;
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Racks</h2>
                    <p className="text-gray-500 dark:text-gray-400">Manage your racks and devices</p>
                </div>
                
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search racks by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-gray-200 transition-colors shadow-sm"
                        />
                    </div>

                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shrink-0"
                    >
                        <Plus size={20} />
                        <span className="hidden sm:inline">Add Rack</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRacks?.map((rack) => (
                    <Link
                        key={rack.id}
                        to={`/racks/${rack.id}`}
                        className="group bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer block"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-lg group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                <Server size={24} className="text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                            </div>
                            <span className="text-xs font-medium bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                                {rack.height_u}U
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 mb-1">
                            {rack.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            {rack.location.name}
                        </p>

                        <div className="border-t border-gray-100 dark:border-zinc-800 pt-4 flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                {(() => {
                                    const rackDevices = allDevices?.filter(d => d.rack === rack.id) || [];
                                    const activeCount = rackDevices.filter(d => d.status === 'active').length;
                                    const maintenanceCount = rackDevices.filter(d => d.status === 'maintenance').length;
                                    const offlineCount = rackDevices.filter(d => d.status === 'offline').length;
                                    const otherCount = rackDevices.length - (activeCount + maintenanceCount + offlineCount);
                                    
                                    if (rackDevices.length === 0) {
                                        return <span className="text-gray-500 dark:text-gray-400">0 Devices</span>;
                                    }

                                    return (
                                        <div className="flex items-center gap-1.5">
                                            {activeCount > 0 && (
                                                <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30" title={`${activeCount} Active`}>
                                                    {activeCount}
                                                </span>
                                            )}
                                            {maintenanceCount > 0 && (
                                                <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/30" title={`${maintenanceCount} Maintenance`}>
                                                    {maintenanceCount}
                                                </span>
                                            )}
                                            {offlineCount > 0 && (
                                                <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-zinc-700" title={`${offlineCount} Offline`}>
                                                    {offlineCount}
                                                </span>
                                            )}
                                            {otherCount > 0 && (
                                                <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-zinc-700" title={`${otherCount} Other`}>
                                                    {otherCount}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                            <span className="text-indigo-600 dark:text-indigo-400 font-medium">View Rack &rarr;</span>
                        </div>
                    </Link>
                ))}

                {/* Empty State / Add New */}
                {(!filteredRacks || filteredRacks.length === 0) && (
                    <div className="col-span-full text-center py-12 bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700">
                        <Server className="mx-auto text-gray-400 dark:text-gray-600 mb-3" size={48} />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200">No Racks Found</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            {searchQuery ? "No racks match your search." : "Get started by creating your first rack."}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                            >
                                Create a Rack
                            </button>
                        )}
                    </div>
                )}
            </div>

            <AddRackModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => {
                    setIsAddModalOpen(false);
                    refetch();
                }}
                preselectedLocationId={selectedLocationId}
            />
        </div>
    );
}
