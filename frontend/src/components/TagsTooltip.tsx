import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface TagsTooltipProps {
    children: React.ReactNode;
    tagsContent: React.ReactNode;
}

export default function TagsTooltip({ children, tagsContent }: TagsTooltipProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + 8, // Fixed position relative to viewport
                left: rect.left,
            });
        }
        setIsOpen(true);
    };

    return (
        <div 
            className="inline-flex"
            ref={triggerRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setIsOpen(false)}
        >
            {children}
            {isOpen && createPortal(
                <div 
                    className="fixed z-[9999] flex flex-wrap gap-1 w-48 p-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-xl"
                    style={{ top: coords.top, left: coords.left }}
                >
                    {tagsContent}
                </div>,
                document.body
            )}
        </div>
    );
}
