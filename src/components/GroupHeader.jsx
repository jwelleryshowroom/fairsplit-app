import React from 'react';
import { IndianRupee, Check, Share2, History as HistoryIcon, BookOpen } from 'lucide-react';

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
    setShowOnboarding,
    onOpenSettings,
    user
}) => {
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

            <div className="flex items-center gap-3 md:gap-4">
                <div className="hidden sm:flex items-center gap-2">
                    <button onClick={() => setShowActivityFeed(true)} className="flex items-center gap-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl text-sm font-black transition-all active:scale-95 shadow-sm border border-indigo-100/50">
                        <HistoryIcon className="w-4 h-4" />
                        <span className="hidden lg:inline uppercase tracking-tighter">Activity</span>
                    </button>
                    <button onClick={() => setShowLedger(true)} className="flex items-center gap-2 text-violet-600 bg-violet-50 hover:bg-violet-100 px-4 py-2 rounded-xl text-sm font-black transition-all active:scale-95 shadow-sm border border-violet-100/50">
                        <BookOpen className="w-4 h-4" />
                        <span className="hidden lg:inline uppercase tracking-tighter">Ledger</span>
                    </button>
                </div>

                {/* Profile Section - triggers SettingsDrawer at parent level */}
                <div
                    className="relative group cursor-pointer"
                    onClick={onOpenSettings}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center gap-3 bg-white/40 backdrop-blur-xl border border-white/60 p-1.5 pr-4 rounded-full shadow-sm hover:shadow-md transition-all hover:bg-white/60">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm transition-transform group-hover:scale-105">
                            <img
                                src={user?.photoURL || '/gmail-avatar.png'}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="text-xs font-black text-slate-800 tracking-tight">{user?.displayName?.split(' ')[0] || 'Ankit'}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Premium</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupHeader;
