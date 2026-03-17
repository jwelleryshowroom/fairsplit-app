import React, { useState } from 'react';
import { IndianRupee, Check, Share2, History as HistoryIcon, BookOpen, HelpCircle, LogOut, Settings } from 'lucide-react';
import SettingsModal from './SettingsModal';

const GroupHeader = ({
    onLeaveGroup,
    roomName,
    groupId,
    copyGroupCode,
    copyCodeSuccess,
    devMode,
    setDevMode,
    setShowActivityFeed,
    setShowLedger,
    setShowOnboarding
}) => {
    const [showSettings, setShowSettings] = useState(false);

    return (
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm px-4 md:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
                <div className="bg-indigo-600 text-white p-1.5 rounded-lg cursor-pointer" onClick={onLeaveGroup}>
                    <IndianRupee className="w-5 h-5" />
                </div>
                <span
                    className="font-extrabold text-lg text-slate-800 tracking-tight hidden md:inline cursor-pointer select-none"
                    onClick={() => {
                        if (window.devClickTimer && Date.now() - window.devClickTimer < 500) {
                            window.devClickCount++;
                        } else {
                            window.devClickCount = 1;
                        }
                        window.devClickTimer = Date.now();
                        if (window.devClickCount === 5) setDevMode(!devMode);
                    }}
                >
                    FairSplit {devMode && "🛠️"}
                </span>
                <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block"></div>
                <div className="flex flex-col md:flex-row md:items-center gap-0 md:gap-3">
                    <h1 className="font-bold text-slate-800 text-sm md:text-base truncate max-w-[150px] md:max-w-none">{roomName}</h1>
                    <button onClick={copyGroupCode} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md text-xs font-mono font-medium text-slate-500 transition-colors">
                        {copyCodeSuccess ? <Check className="w-3 h-3 text-green-500" /> : <Share2 className="w-3 h-3" />}
                        {groupId}
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button onClick={() => setShowActivityFeed(true)} className="flex items-center gap-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg text-sm font-bold transition-colors">
                    <HistoryIcon className="w-4 h-4" />
                    <span className="hidden md:inline">Activity</span>
                </button>
                <button onClick={() => setShowLedger(true)} className="flex items-center gap-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg text-sm font-bold transition-colors">
                    <BookOpen className="w-4 h-4" />
                    <span className="hidden md:inline">Ledger</span>
                </button>
                <button onClick={() => setShowSettings(true)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Settings">
                    <Settings className="w-5 h-5" />
                </button>
                <button onClick={() => setShowOnboarding(true)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Help & Tour">
                    <HelpCircle className="w-5 h-5" />
                </button>
                <button onClick={onLeaveGroup} className="flex items-center gap-2 text-red-500 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg text-sm font-bold transition-colors">
                    <LogOut className="w-4 h-4" />
                    <span className="hidden md:inline">Exit</span>
                </button>
            </div>
            <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
        </div>
    );
};

export default GroupHeader;
