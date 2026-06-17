import type { ReactNode } from 'react';

interface ModalContentLayoutProps {
    children: ReactNode;
    navItems: { id: string; label: string }[];
}

export default function ModalContentLayout({ children, navItems }: ModalContentLayoutProps) {
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            // Find the closest scrollable container (in our case, the modal body)
            const scrollContainer = element.closest('.overflow-y-auto');
            if (scrollContainer) {
                const elementPosition = element.getBoundingClientRect().top;
                const containerPosition = scrollContainer.getBoundingClientRect().top;
                const offsetPosition = elementPosition - containerPosition + scrollContainer.scrollTop - 24; // 24px padding top

                scrollContainer.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            } else {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 relative">
            <div className="flex-1 min-w-0">
                {children}
            </div>
            
            <div className="w-48 shrink-0 hidden md:block">
                <div className="sticky top-0 bg-gray-50/50 dark:bg-zinc-800/50 rounded-xl p-4 border border-gray-100 dark:border-zinc-800">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Navigation</h4>
                    <ul className="space-y-2 text-sm">
                        {navItems.map(item => (
                            <li key={item.id}>
                                <button 
                                    type="button"
                                    onClick={() => scrollToSection(item.id)}
                                    className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-left w-full transition-colors"
                                >
                                    {item.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
