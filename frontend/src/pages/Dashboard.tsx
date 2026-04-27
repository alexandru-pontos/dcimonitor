import { useQuery } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { inventoryService } from '../services/inventory';

export default function Dashboard() {
    const { selectedLocationId } = useOutletContext<{ selectedLocationId: number | null }>();

    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboardStats', selectedLocationId],
        queryFn: () => inventoryService.getDashboardStats(selectedLocationId),
    });
    return (
        <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Welcome Back</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Total Racks</p>
                    <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-gray-100">
                        {isLoading ? '--' : stats?.total_racks || 0}
                    </p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Active Devices</p>
                    <p className="text-3xl font-bold mt-2 text-emerald-600 dark:text-emerald-500">
                        {isLoading ? '--' : stats?.active_devices || 0}
                    </p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Power Usage</p>
                    <p className="text-3xl font-bold mt-2 text-orange-600 dark:text-orange-500">12.4 kW</p>
                </div>
            </div>
        </div>
    );
}
