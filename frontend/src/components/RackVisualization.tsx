import { useState, useEffect, useRef } from 'react';
import type { Device } from '../services/inventory';
import clsx from 'clsx';
import { Server, Box, Globe, Cpu, Plus, Pencil, Hand } from 'lucide-react';

interface RackVisualizationProps {
    heightU: number;
    devices: Device[];
    onSlotClick?: (u: number) => void;
    onDeviceClick?: (device: Device) => void;
    onMoveDevice?: (device: Device, newU: number) => void; // DnD Callback
    selectedU?: number | null;
    ghostDevice?: { u: number; heightU: number } | null;
}

export default function RackVisualization({ heightU, devices, onSlotClick, onDeviceClick, onMoveDevice, selectedU, ghostDevice }: RackVisualizationProps) {
    const us = Array.from({ length: heightU }, (_, i) => heightU - i);

    // DnD State
    const [draggingId, setDraggingId] = useState<number | null>(null);
    const [dragTargetU, setDragTargetU] = useState<number | null>(null);
    const [isValidDrop, setIsValidDrop] = useState(true);

    // Refs for drag calculations
    const dragStartRef = useRef<{ y: number, u: number, device: Device } | null>(null);

    // Global Mouse Listeners for Dragging
    useEffect(() => {
        if (draggingId === null) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!dragStartRef.current) return;
            const { y: startY, u: startU, device } = dragStartRef.current;

            // 1 U = 2.5rem = 40px (approx, but we should rely on delta)
            // Actually, we can assume 1U is roughly 40px (2.5 * 16).
            // But let's verify visual scale. The container has w-full, but U height is explicit 2.5rem.
            const PIXELS_PER_U = 40;

            const deltaY = e.clientY - startY;
            // Moving Mouse DOWN (positive deltaY) -> Lower U (negative deltaU)
            // So +DeltaY => -DeltaU
            const deltaU = -Math.round(deltaY / PIXELS_PER_U);

            let target = startU + deltaU;

            // Clamp
            const maxU = heightU - device.height_u + 1;
            target = Math.max(1, Math.min(maxU, target));

            if (target !== dragTargetU) {
                setDragTargetU(target);

                // Validate
                // Check collision with ANY other device (exclude self)
                const targetEnd = target + device.height_u - 1;
                const hasCollision = devices.some(d => {
                    if (d.id === device.id) return false;
                    const dEnd = d.position_u! + d.height_u - 1;
                    return Math.max(target, d.position_u!) <= Math.min(targetEnd, dEnd);
                });

                setIsValidDrop(!hasCollision);
            }
        };

        const handleMouseUp = () => {
            if (draggingId && dragStartRef.current && onMoveDevice) {
                const { device, u: startU } = dragStartRef.current;
                // Commit if valid and changed
                if (isValidDrop && dragTargetU !== null && dragTargetU !== startU) {
                    onMoveDevice(device, dragTargetU);
                }
            }
            // Cleanup
            setDraggingId(null);
            setDragTargetU(null);
            dragStartRef.current = null;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggingId, dragTargetU, isValidDrop, heightU, devices, onMoveDevice]);


    // Mappings
    const headSlots = new Map<number, Device>();
    const occupiedSlots = new Map<number, Device>();

    devices.forEach(d => {
        headSlots.set(d.position_u!, d);
        for (let i = 0; i < d.height_u; i++) {
            occupiedSlots.set(d.position_u! + i, d);
        }
    });

    const getDeviceIcon = (type: Device['device_type']) => {
        switch (type) {
            case 'server': return Server;
            case 'switch': return Globe;
            case 'router': return Globe;
            case 'pdu': return Box;
            default: return Cpu;
        }
    };

    const handleDragStart = (e: React.MouseEvent, device: Device) => {
        e.stopPropagation();
        e.preventDefault();
        setDraggingId(device.id);
        setDragTargetU(device.position_u!);
        setIsValidDrop(true);
        dragStartRef.current = { y: e.clientY, u: device.position_u!, device };
    };

    return (
        <div className="flex flex-col w-full max-w-2xl shrink-0 h-fit relative gap-4 select-none">
            {/* 1. Sticky Top Bar (Detached & Rounded) */}
            <div className="sticky top-0 z-20 flex bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider py-2 rounded-lg shadow-lg">
                <div className="w-10 text-center border-r border-gray-300 dark:border-gray-800">U</div>
                <div className="flex-1 grid grid-cols-6 h-full">
                    <div className="col-span-1 text-center border-r border-gray-300 dark:border-gray-800">Back</div>
                    <div className="col-span-4 text-center border-r border-gray-300 dark:border-gray-800">Middle</div>
                    <div className="col-span-1 text-center">Front</div>
                </div>
            </div>

            {/* 2. Rack Slots (Grid) & Drag Overlay */}
            <div className="flex flex-col bg-gray-300 dark:bg-gray-900 rounded-lg shadow-xl border border-gray-400 dark:border-gray-700 relative">

                {/* Drag Ghost Overlay */}
                {draggingId !== null && dragTargetU !== null && dragStartRef.current && (
                    <div
                        className={clsx(
                            "absolute left-0 right-0 z-50 pointer-events-none transition-all duration-75 border-4 rounded-lg flex items-center justify-center backdrop-blur-sm",
                            isValidDrop
                                ? "border-green-500 bg-green-500/20"
                                : "border-red-500 bg-red-500/10"
                        )}
                        style={{
                            height: `${dragStartRef.current.device.height_u * 2.5}rem`,
                            top: `${(heightU - (dragTargetU + dragStartRef.current.device.height_u - 1)) * 2.5}rem`
                        }}
                    >
                        <span className={clsx(
                            "font-bold px-3 py-1 rounded bg-black/50 text-white backdrop-blur-md",
                            isValidDrop ? "text-green-100" : "text-red-100"
                        )}>
                            U{dragTargetU}
                        </span>
                    </div>
                )}

                {/* Explicit Ghost Device Overlay (for assigning) */}
                {ghostDevice && (
                    <div
                        className="absolute left-0 right-0 z-40 pointer-events-none transition-all duration-200 border-4 rounded-lg flex items-center justify-center backdrop-blur-sm border-indigo-500 bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                        style={{
                            height: `${ghostDevice.heightU * 2.5}rem`,
                            top: `${(heightU - (ghostDevice.u + ghostDevice.heightU - 1)) * 2.5}rem`
                        }}
                    >
                        <span className="font-bold px-3 py-1 rounded bg-indigo-900/80 text-white backdrop-blur-md">
                            Assign to U{ghostDevice.u}
                        </span>
                    </div>
                )}

                {us.map((u) => {
                    // Check if this slot is part of a device
                    const device = headSlots.get(u);
                    const isOccupied = occupiedSlots.has(u);

                    // If occupied but not the head, render nothing (merged cells)
                    if (isOccupied && !device) return null;

                    if (device) {
                        const isDragging = draggingId === device.id;
                        const Icon = getDeviceIcon(device.device_type);
                        const configs = device.mounting_configuration || ['middle'];
                        const isBack = configs.includes('back');
                        const isMid = configs.includes('middle');
                        const isFront = configs.includes('front');

                        const isSelected = selectedU === device.position_u;

                        return (
                            <div
                                key={u}
                                className={clsx(
                                    "relative w-full flex border-b border-gray-400/50 dark:border-gray-800 transition-all group",
                                    isSelected
                                        ? "bg-indigo-100/50 dark:bg-indigo-900/30"
                                        : "hover:bg-white/20 dark:hover:bg-white/5"
                                )}
                                style={{ height: `${device.height_u * 2.5}rem` }}
                                onClick={() => !isDragging && onDeviceClick?.(device)}
                            >
                                {/* U Label */}
                                <div className={clsx(
                                    "w-10 flex flex-col items-center justify-center font-mono text-xs border-r border-gray-400 dark:border-gray-800 transition-colors",
                                    isSelected
                                        ? "bg-indigo-100/50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold"
                                        : "bg-gray-200 dark:bg-gray-900/50 text-gray-600 dark:text-gray-500"
                                )}>
                                    {device.height_u > 1 ? (
                                        <>
                                            <span>{u + device.height_u - 1}</span>
                                            <div className="h-4 w-[1px] bg-gray-400 dark:bg-gray-700 my-1"></div>
                                            <span>{u}</span>
                                        </>
                                    ) : u}
                                </div>

                                {/* Drag Handle LEFT */}
                                {isSelected && !isDragging && (
                                    <div
                                        className="absolute left-0 top-0 bottom-0 w-8 -ml-10 z-30 flex items-center justify-center cursor-grab active:cursor-grabbing group/handle"
                                        onMouseDown={(e) => handleDragStart(e, device)}
                                    >
                                        <div className="bg-yellow-400 border border-yellow-500 text-yellow-900 p-1.5 rounded-lg shadow-md hover:scale-110 transition-transform">
                                            <Hand size={16} />
                                        </div>
                                    </div>
                                )}

                                {/* Drag Handle RIGHT */}
                                {isSelected && !isDragging && (
                                    <div
                                        className="absolute right-0 top-0 bottom-0 w-8 -mr-10 z-30 flex items-center justify-center cursor-grab active:cursor-grabbing group/handle"
                                        onMouseDown={(e) => handleDragStart(e, device)}
                                    >
                                        <div className="bg-yellow-400 border border-yellow-500 text-yellow-900 p-1.5 rounded-lg shadow-md hover:scale-110 transition-transform">
                                            <Hand size={16} />
                                        </div>
                                    </div>
                                )}

                                {/* Grid Area for Columns */}
                                <div className="flex-1 grid grid-cols-6 p-1 gap-1 relative">
                                    <div
                                        className={clsx(
                                            "rounded border flex items-center px-4 gap-3 relative transition-all overflow-hidden shadow-sm",
                                            // Status Colors
                                            device.status === 'active'
                                                ? "bg-emerald-100 border-emerald-300 text-emerald-900 dark:bg-green-900/40 dark:border-green-700 dark:text-gray-100"
                                                : device.status === 'maintenance'
                                                    ? "bg-amber-100 border-amber-300 text-amber-900 dark:bg-yellow-900/40 dark:border-yellow-700 dark:text-gray-100"
                                                    : "bg-white border-gray-300 text-gray-700 dark:bg-gray-700/60 dark:border-gray-600 dark:text-gray-200",

                                            // Column Spans
                                            isBack && isMid && isFront ? "col-span-6" :
                                                isBack && isMid ? "col-span-5" :
                                                    isMid && isFront ? "col-start-2 col-span-5" :
                                                        isMid ? "col-start-2 col-span-4" :
                                                            isBack ? "col-span-1 justify-center px-0" :
                                                                isFront ? "col-start-6 col-span-1 justify-center px-0" : "hidden"
                                        )}
                                    >
                                        {(isMid || (isBack && isFront && !isMid) || (configs.length === 1)) && (
                                            <>
                                                <div className={clsx("w-2 h-2 rounded-full shrink-0",
                                                    device.status === 'active' ? 'bg-emerald-500 dark:bg-green-400' : 'bg-amber-500 dark:bg-yellow-400'
                                                )} />

                                                {(isMid || configs.length > 1) ? (
                                                    <>
                                                        <Icon className="opacity-70 shrink-0" size={20} />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-bold text-sm truncate leading-tight">{device.name}</p>
                                                            <p className="text-[10px] opacity-75 uppercase tracking-wider">{device.device_type}</p>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span className="text-[10px] font-bold opacity-75">{isBack ? 'Bk' : 'Fr'}</span>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Moving Label Overlay (On Original Device) */}
                                    {isDragging && (
                                        <div className="absolute inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-[1px] flex items-center justify-center rounded border-2 border-dashed border-white/50">
                                            <span className="bg-black/75 text-white px-2 py-1 rounded text-xs font-bold uppercase tracking-wider animate-pulse">
                                                Moving...
                                            </span>
                                        </div>
                                    )}

                                    {/* Edit Overlay (Pencil) - Hide if Dragging */}
                                    {!isDragging && (
                                        <div className={clsx(
                                            "absolute inset-0 flex items-center justify-center transition-opacity duration-200 pointer-events-none",
                                            selectedU === device.position_u ? "opacity-100" : "opacity-0"
                                        )}>
                                            <div className={clsx(
                                                "rounded-full p-2 transition-transform duration-200 shadow-lg",
                                                selectedU === device.position_u
                                                    ? "bg-indigo-600 text-white scale-110"
                                                    : "bg-white/90 dark:bg-zinc-800/90 text-gray-700 dark:text-gray-200 scale-90"
                                            )}>
                                                <Pencil size={20} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    }

                    // Empty Row
                    const isSelected = selectedU === u;

                    return (
                        <div
                            key={u}
                            className={clsx(
                                "flex w-full h-10 border-b border-gray-400/30 dark:border-gray-700 transition-all cursor-pointer group relative",
                                isSelected
                                    ? "bg-indigo-100/50 dark:bg-indigo-900/30 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/50"
                                    : "hover:bg-white/20 dark:hover:bg-white/5"
                            )}
                            onClick={() => onSlotClick?.(u)}
                        >
                            {/* U Label */}
                            <div className={clsx(
                                "w-10 flex items-center justify-center font-mono text-xs border-r border-gray-400 dark:border-gray-700 select-none transition-colors",
                                isSelected ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-gray-600 dark:text-gray-500"
                            )}>
                                {u}
                            </div>

                            {/* Columns Grid with faint guidelines */}
                            <div className="flex-1 grid grid-cols-6 h-full relative">
                                <div className="col-span-1 border-r border-gray-400/30 dark:border-gray-700"></div>
                                <div className="col-span-4 border-r border-gray-400/30 dark:border-gray-700"></div>
                                <div className="col-span-1"></div>

                                {/* Plus Icon Overlay (Visible on Hover OR Selected) */}
                                <div className={clsx(
                                    "absolute inset-0 flex items-center justify-center transition-opacity duration-200",
                                    isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-50"
                                )}>
                                    <div className={clsx(
                                        "rounded-full p-1 transition-transform duration-200",
                                        isSelected ? "bg-indigo-600 text-white scale-110" : "bg-gray-400/20 text-gray-600 scale-90"
                                    )}>
                                        <Plus size={16} strokeWidth={3} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );

                })}
            </div>
        </div>
    );
}
