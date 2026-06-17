import { Plus, Trash2, Link, GripVertical, Unplug } from 'lucide-react';
import clsx from 'clsx';
import type { PortCreateUpdate, ConnectedPortDetails } from '../services/inventory';
import { useState } from 'react';

interface NetworkPortsSectionProps {
    ports: PortCreateUpdate[];
    setPorts: (ports: PortCreateUpdate[] | ((prev: PortCreateUpdate[]) => PortCreateUpdate[])) => void;
    onSelectRemotePort: (index: number) => void;
    onDisconnectPort?: (index: number) => void;
    isStorage?: boolean;
}

export default function NetworkPortsSection({ ports, setPorts, onSelectRemotePort, onDisconnectPort, isStorage = false }: NetworkPortsSectionProps) {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [activeDragHandle, setActiveDragHandle] = useState<number | null>(null);
    const handleAddPort = () => {
        setPorts(prev => [...prev, {
            name: '',
            interface_type: 'rj45',
            visible_label: '',
            mac_address: '',
        }]);
    };

    const handleRemovePort = (index: number) => {
        setPorts(prev => prev.filter((_, i) => i !== index));
    };

    const handlePortChange = (index: number, field: keyof PortCreateUpdate | 'connected_port', value: any) => {
        setPorts(prev => {
            const newPorts = [...prev];
            newPorts[index] = { ...newPorts[index], [field]: value } as any;
            return newPorts;
        });
    };

    const interfaceOptions = [
        { value: 'rj45', label: 'RJ-45 (1G)' },
        { value: 'rj45_10g', label: 'RJ-45 (10G)' },
        { value: 'sfp', label: 'SFP (1G)' },
        { value: 'sfp_plus', label: 'SFP+ (10G)' },
        { value: 'sfp28', label: 'SFP28 (25G)' },
        { value: 'qsfp_plus', label: 'QSFP+ (40G)' },
        { value: 'qsfp28', label: 'QSFP28 (100G)' },
        { value: 'qsfp_dd', label: 'QSFP-DD (400G)' },
        { value: 'osfp', label: 'OSFP (800G)' },
        { value: 'cx4', label: 'CX4' },
        { value: 'fc', label: 'Fibre Channel' },
        { value: 'infiniband', label: 'InfiniBand' },
        { value: 'wireless', label: 'Wireless' },
        { value: 'virtual', label: 'Virtual' },
        { value: 'other', label: 'Other' },
    ];

    return (
        <div id="network" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Network Ports</h3>
                <button
                    type="button"
                    onClick={handleAddPort}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors text-sm font-medium"
                >
                    <Plus size={16} />
                    Add Port
                </button>
            </div>

            {ports.length === 0 ? (
                <div className="p-8 text-center text-gray-500 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700">
                    No ports defined yet.
                </div>
            ) : (
                <div className="border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-zinc-800 text-xs uppercase text-gray-500 border-b border-gray-200 dark:border-zinc-800">
                            <tr>
                                <th className="w-10 px-2 py-3 text-center">#</th>
                                <th className="px-4 py-3 font-semibold min-w-[200px]">Name <span className="text-red-500">*</span></th>
                                <th className="px-4 py-3 font-semibold min-w-[150px]">Visible Label</th>
                                <th className="px-4 py-3 font-semibold min-w-[150px]">Interface</th>
                                <th className="px-4 py-3 font-semibold min-w-[150px]">MAC Address</th>
                                <th className="px-4 py-3 font-semibold min-w-[200px]">Remote Connection</th>
                                <th className="px-4 py-3 font-semibold text-center w-16">Del</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                            {ports.map((port, index) => {
                                const connectedPort = (port as any).connected_port as ConnectedPortDetails | null;
                                const isConnected = port.connected_port_id || connectedPort;
                                
                                return (
                                    <tr 
                                        key={port.id || `port-${index}`}
                                        className={clsx(
                                            "group bg-white dark:bg-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-800/80 transition-all",
                                            draggedIndex === index && "opacity-50 bg-gray-100 dark:bg-zinc-700",
                                            dragOverIndex === index && "border-t-2 border-t-indigo-500"
                                        )}
                                        draggable={activeDragHandle === index}
                                        onDragStart={(e) => {
                                            setDraggedIndex(index);
                                            e.dataTransfer.effectAllowed = 'move';
                                        }}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            e.dataTransfer.dropEffect = 'move';
                                            setDragOverIndex(index);
                                        }}
                                        onDragLeave={() => setDragOverIndex(null)}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            if (draggedIndex !== null && draggedIndex !== index) {
                                                setPorts(prev => {
                                                    const next = [...prev];
                                                    const [moved] = next.splice(draggedIndex, 1);
                                                    next.splice(index, 0, moved);
                                                    return next;
                                                });
                                            }
                                            setDraggedIndex(null);
                                            setDragOverIndex(null);
                                            setActiveDragHandle(null);
                                        }}
                                        onDragEnd={() => {
                                            setDraggedIndex(null);
                                            setDragOverIndex(null);
                                            setActiveDragHandle(null);
                                        }}
                                    >
                                        <td className="px-2 py-2 align-middle text-center w-10">
                                            <div className="relative w-full h-full flex items-center justify-center min-h-[32px]">
                                                <span className="absolute inset-0 flex items-center justify-center opacity-100 group-hover:opacity-0 transition-opacity text-gray-400 dark:text-gray-500 font-mono text-xs font-semibold">
                                                    {index + 1}
                                                </span>
                                                <div 
                                                    className="absolute inset-0 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-gray-200 dark:hover:bg-zinc-700"
                                                    onMouseEnter={() => setActiveDragHandle(index)}
                                                    onMouseLeave={() => setActiveDragHandle(null)}
                                                >
                                                    <GripVertical size={16} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 min-w-[200px]">
                                            <input
                                                type="text"
                                                value={port.name}
                                                onChange={e => handlePortChange(index, 'name', e.target.value)}
                                                placeholder="e.g. eth0"
                                                className="w-full px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-gray-200"
                                                required
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="text"
                                                value={port.visible_label || ''}
                                                onChange={e => handlePortChange(index, 'visible_label', e.target.value)}
                                                placeholder="e.g. WAN"
                                                className="w-full px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-gray-200"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <select
                                                value={port.interface_type}
                                                onChange={e => handlePortChange(index, 'interface_type', e.target.value)}
                                                className="w-full px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-gray-200"
                                            >
                                                {interfaceOptions.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="text"
                                                value={port.mac_address || ''}
                                                onChange={e => handlePortChange(index, 'mac_address', e.target.value)}
                                                placeholder="00:00:00:00:00:00"
                                                className="w-full px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-gray-200 font-mono text-xs"
                                            />
                                        </td>
                                        <td className="px-4 py-2 min-w-[200px]">
                                            {isConnected ? (
                                                <div className="flex items-center justify-between gap-2 p-1.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded h-[34px]">
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="text-xs font-medium text-indigo-700 dark:text-indigo-400 truncate" title={connectedPort?.device_name}>
                                                            {connectedPort?.device_name || 'Selected Device'}
                                                        </span>
                                                        <span className="text-[10px] text-indigo-500 dark:text-indigo-300 truncate">
                                                            {connectedPort ? (connectedPort.visible_label ? `${connectedPort.name} (${connectedPort.visible_label})` : connectedPort.name) : 'Remote Port'}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (onDisconnectPort) {
                                                                onDisconnectPort(index);
                                                            } else {
                                                                handlePortChange(index, 'connected_port_id', null);
                                                                handlePortChange(index, 'connected_port', null);
                                                            }
                                                        }}
                                                        className="text-indigo-400 hover:text-red-600 dark:hover:text-red-400 p-1 shrink-0 transition-colors"
                                                        title="Disconnect"
                                                    >
                                                        <Unplug size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => onSelectRemotePort(index)}
                                                    disabled={isStorage}
                                                    className={clsx(
                                                        "flex items-center gap-2 px-3 py-1.5 w-full justify-center border border-dashed rounded transition-colors h-[34px]",
                                                        isStorage 
                                                            ? "bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-400 dark:text-gray-500 cursor-not-allowed" 
                                                            : "bg-gray-50 dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-700"
                                                    )}
                                                    title={isStorage ? "Devices in storage cannot be connected to ports" : "Connect to a remote port"}
                                                >
                                                    <Link size={14} />
                                                    Connect
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleRemovePort(index)}
                                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                title="Delete Port"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
