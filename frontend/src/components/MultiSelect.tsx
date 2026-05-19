import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import clsx from 'clsx';

export interface MultiSelectOption {
    value: string;
    label: string;
}

interface MultiSelectProps {
    options: MultiSelectOption[];
    selectedValues: string[];
    onChange: (values: string[]) => void;
    placeholder: string;
    label: string;
}

export default function MultiSelect({
    options,
    selectedValues,
    onChange,
    placeholder,
    label
}: MultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (value: string) => {
        if (selectedValues.includes(value)) {
            onChange(selectedValues.filter(v => v !== value));
        } else {
            onChange([...selectedValues, value]);
        }
    };

    const displayValue = selectedValues.length === 0
        ? placeholder
        : selectedValues.length === 1
            ? options.find(o => o.value === selectedValues[0])?.label
            : `${selectedValues.length} selected`;

    return (
        <div className="relative w-full" ref={containerRef}>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "w-full px-3 py-2 flex items-center justify-between text-sm transition-colors rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500/50",
                    isOpen 
                        ? "bg-white dark:bg-zinc-800 border-indigo-500 dark:border-indigo-500" 
                        : "bg-gray-50 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600",
                    selectedValues.length === 0 ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-gray-100"
                )}
            >
                <span className="truncate pr-2">{displayValue}</span>
                <ChevronDown size={16} className={clsx("text-gray-400 transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg max-h-60 overflow-y-auto py-1">
                    {options.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">No options available</div>
                    ) : (
                        options.map(option => {
                            const isSelected = selectedValues.includes(option.value);
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => toggleOption(option.value)}
                                    className="w-full px-3 py-2 text-sm text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-gray-700 dark:text-gray-200"
                                >
                                    <span className="truncate">{option.label}</span>
                                    {isSelected && <Check size={16} className="text-indigo-600 dark:text-indigo-400 ml-2 shrink-0" />}
                                </button>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
