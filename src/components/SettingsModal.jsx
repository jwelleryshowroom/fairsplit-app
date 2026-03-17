import React from 'react';
import { useSettings } from '../context/SettingsContext';
import Modal from './Modal';
import { Moon, Sun, Smile, Layout, Zap, Check } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose }) => {
    const { settings, updateSetting } = useSettings();

    const Toggle = ({ active, onClick, label, icon: Icon, description }) => (
        <div
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group ${active ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
            onClick={onClick}
        >
            <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl transition-colors ${active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 text-sm">{label}</h4>
                    <p className="text-xs text-slate-500">{description}</p>
                </div>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${active ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200'}`}>
                {active && <Check className="w-4 h-4 text-white" />}
            </div>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="App Settings ⚙️" maxWidth="max-w-md">
            <div className="space-y-4">
                <Toggle
                    active={settings.showEmojis}
                    onClick={() => updateSetting('showEmojis', !settings.showEmojis)}
                    label="Emoji Mode"
                    icon={Smile}
                    description="Infuse the UI with helpful emojis"
                />

                <Toggle
                    active={settings.compactMode}
                    onClick={() => updateSetting('compactMode', !settings.compactMode)}
                    label="Compact View"
                    icon={Layout}
                    description="Fit more information on screen"
                />

                <Toggle
                    active={settings.vibrationEnabled}
                    onClick={() => updateSetting('vibrationEnabled', !settings.vibrationEnabled)}
                    label="Haptic Feedback"
                    icon={Zap}
                    description="Tactile response on actions"
                />

                <div className="pt-4 border-t border-slate-100">
                    <h4 className="font-bold text-slate-800 text-sm mb-3 px-1">Visual Theme</h4>
                    <div className="grid grid-cols-3 gap-2">
                        {['modern', 'glass', 'minimal'].map((t) => (
                            <button
                                key={t}
                                onClick={() => updateSetting('theme', t)}
                                className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition-all border-2 ${settings.theme === t ? 'border-indigo-600 bg-indigo-600 text-white shadow-md' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-4 mt-2 text-center">
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">FairSplit V7.0.0 — Premium Build</p>
                </div>
            </div>
        </Modal>
    );
};

export default SettingsModal;
