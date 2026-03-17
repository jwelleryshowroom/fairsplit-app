import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('fairsplit_settings');
        return saved ? JSON.parse(saved) : {
            showEmojis: true,
            compactMode: false,
            theme: 'modern', // 'modern' | 'glass' | 'minimal'
            vibrationEnabled: true
        };
    });

    useEffect(() => {
        localStorage.setItem('fairsplit_settings', JSON.stringify(settings));
    }, [settings]);

    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSetting }}>
            {children}
        </SettingsContext.Provider>
    );
};
