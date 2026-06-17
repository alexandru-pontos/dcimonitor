import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Server, Settings, Menu, Moon, Sun, MapPin, Monitor } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '../services/inventory';
import AddLocationModal from '../components/AddLocationModal';
import RemoveLocationModal from '../components/RemoveLocationModal';
import { useTheme } from '../context/ThemeContext';
import { ToastProvider } from '../context/ToastContext';

export default function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { theme, toggleTheme } = useTheme();
    const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
    const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
    const [isRemoveLocationOpen, setIsRemoveLocationOpen] = useState(false);

    const { data: locations } = useQuery({
        queryKey: ['locations'],
        queryFn: inventoryService.getLocations,
    });

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
        { icon: Server, label: 'Racks', to: '/racks' },
        { icon: Monitor, label: 'Devices', to: '/devices' },
        { icon: Settings, label: 'Settings', to: '/settings' },
    ];

    return (
        <ToastProvider>
            <div className="flex h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
                {/* Sidebar */}
                <aside
                    className={clsx(
                        "bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 transition-all duration-300 flex flex-col",
                        sidebarOpen ? "w-64" : "w-16"
                    )}
                >
                    <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-zinc-800">
                        <span className={clsx("font-bold text-xl text-indigo-600 dark:text-indigo-400 truncate", !sidebarOpen && "hidden")}>
                            Datacenter
                        </span>
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400">
                            <Menu size={20} />
                        </button>
                    </div>

                    {sidebarOpen && (
                        <div className="px-4 py-4 border-b border-gray-100 dark:border-zinc-800">
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                Location
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedLocationId === null ? '' : selectedLocationId}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === 'add_new') {
                                            setIsAddLocationOpen(true);
                                        } else if (val === 'remove_location') {
                                            setIsRemoveLocationOpen(true);
                                        } else if (val === '') {
                                            setSelectedLocationId(null);
                                        } else {
                                            setSelectedLocationId(Number(val));
                                        }
                                    }}
                                    className="w-full appearance-none bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">All Locations</option>
                                    {locations?.map(loc => (
                                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                                    ))}
                                    <option value="add_new">-- Add Location --</option>
                                    <option value="remove_location">-- Remove Location --</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-gray-400">
                                    <MapPin size={14} />
                                </div>
                            </div>
                        </div>
                    )}

                    <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) => clsx(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
                                    isActive
                                        ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium"
                                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-gray-200"
                                )}
                            >
                                <item.icon size={20} className={clsx("shrink-0", sidebarOpen ? "" : "mx-auto")} />
                                {sidebarOpen && <span>{item.label}</span>}

                                {!sidebarOpen && (
                                    <div className="fixed left-14 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap">
                                        {item.label}
                                    </div>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="border-t border-gray-100 dark:border-zinc-800 p-4 space-y-4">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className={clsx(
                                "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors",
                                !sidebarOpen && "justify-center px-0"
                            )}
                        >
                            {theme === 'dark' ? <Sun size={20} className={clsx("shrink-0", !sidebarOpen && "mx-auto")} /> : <Moon size={20} className={clsx("shrink-0", !sidebarOpen && "mx-auto")} />}
                            {sidebarOpen && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-sm shrink-0">
                                A
                            </div>
                            <div className="flex items-center gap-4">
                            </div>
                        </div>
                    </div>
                </aside>

                <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <div className="flex-1 overflow-auto p-8 bg-gray-50 dark:bg-zinc-950">
                        <Outlet context={{ selectedLocationId }} />
                    </div>
                </main>
            </div>
            
            <AddLocationModal 
                isOpen={isAddLocationOpen}
                onClose={() => setIsAddLocationOpen(false)}
                onSuccess={(newId) => setSelectedLocationId(newId)}
            />
            
            <RemoveLocationModal
                isOpen={isRemoveLocationOpen}
                onClose={() => setIsRemoveLocationOpen(false)}
                onLocationDeleted={(id) => {
                    if (selectedLocationId === id) {
                        setSelectedLocationId(null);
                    }
                }}
            />
        </ToastProvider>
    );
}
