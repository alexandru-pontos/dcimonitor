import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface SettingsContextType {
    compactTagsView: boolean;
    setCompactTagsView: (value: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
    // Initialize from localStorage, defaulting to false if not present
    const [compactTagsView, setCompactTagsView] = useState<boolean>(() => {
        const stored = localStorage.getItem('settings_compactTagsView');
        return stored !== null ? JSON.parse(stored) : false;
    });

    // Save to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('settings_compactTagsView', JSON.stringify(compactTagsView));
    }, [compactTagsView]);

    return (
        <SettingsContext.Provider value={{ compactTagsView, setCompactTagsView }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
