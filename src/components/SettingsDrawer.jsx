import { X, Moon, Sun, Smile, Layout, Zap, Check, HelpCircle, LogOut, Settings, User } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import UserAvatar from './UserAvatar';

const SettingsDrawer = ({ isOpen, onClose, onLeaveGroup, onShowHelp, user, isGroupView = true, onLogOut }) => {
    const { settings, updateSetting } = useSettings();

    if (!isOpen) return null;

    const Toggle = ({ active, onClick, label, icon: Icon, description }) => (
        <div
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${active ? 'border-indigo-500 bg-white/60' : 'border-white/20 bg-white/20 hover:bg-white/30'}`}
            onClick={onClick}
        >
            <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl transition-colors ${active ? 'bg-indigo-600 text-white' : 'bg-white/40 text-slate-500 group-hover:bg-white/60'}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 text-sm">{label}</h4>
                    <p className="text-[10px] sm:text-xs text-slate-500 font-medium">{description}</p>
                </div>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${active ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white/20'}`}>
                {active && <Check className="w-3 h-3 text-white" />}
            </div>
        </div>
    );

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', justifyContent: 'flex-end', overflow: 'hidden' }}>
            {/* Backdrop */}
            <div
                style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
                onClick={onClose}
            />

            {/* Drawer */}
            <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '380px',
                height: '100%',
                background: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                borderLeft: '1px solid rgba(255,255,255,0.35)',
                boxShadow: '-24px 0 80px rgba(0,0,0,0.12)',
                display: 'flex',
                flexDirection: 'column',
                animation: 'slideInFromRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) both'
            }}>
                {/* Drawer Header */}
                <div className="p-6 pb-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.25)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white">
                            <Settings className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-black text-white tracking-tight drop-shadow">Account</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-all active:scale-95"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Profile Card */}
                    <div className="flex flex-col items-center text-center p-6 rounded-3xl" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}>
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full blur-md opacity-40 group-hover:opacity-70 transition-opacity" />
                            <UserAvatar user={user} size="xl" className="border-4 border-white/60" />
                            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center shadow-lg" title="Active">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            </div>
                        </div>
                        <h3 className="mt-4 text-xl font-black text-white tracking-tight leading-none drop-shadow">{user?.displayName || user?.email?.split('@')[0] || 'Guest User'}</h3>
                        <p className="mt-2 text-xs font-black text-white/80 bg-white/20 px-3 py-1 rounded-full uppercase tracking-widest border border-white/30 backdrop-blur-sm">{user?.email || 'Premium Member'}</p>
                    </div>

                    {/* Preferences */}
                    <div className="space-y-3">
                        <h5 className="px-2 text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-4">App Preferences</h5>
                        <Toggle
                            active={settings.showEmojis}
                            onClick={() => updateSetting('showEmojis', !settings.showEmojis)}
                            label="Emoji Mode"
                            icon={Smile}
                            description="Enrich the UI with visual feedback"
                        />
                        <Toggle
                            active={settings.compactMode}
                            onClick={() => updateSetting('compactMode', !settings.compactMode)}
                            label="Compact View"
                            icon={Layout}
                            description="Maximize information density"
                        />
                        <Toggle
                            active={settings.vibrationEnabled}
                            onClick={() => updateSetting('vibrationEnabled', !settings.vibrationEnabled)}
                            label="Haptic Feedback"
                            icon={Zap}
                            description="Premium tactile response"
                        />
                    </div>

                    {/* Theme */}
                    <div className="space-y-4 pt-2">
                        <h5 className="px-2 text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-4">Visual Theme</h5>
                        <div className="grid grid-cols-3 gap-2">
                            {['modern', 'glass', 'minimal'].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => updateSetting('theme', t)}
                                    className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${settings.theme === t ? 'bg-white text-slate-900 border-white shadow-xl' : 'bg-white/10 border-white/20 text-white/70 hover:border-white/50 hover:bg-white/20'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Drawer Footer Actions */}
                <div className="p-6 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)' }}>
                    <button
                        onClick={() => { onClose(); onShowHelp(); }}
                        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-white/90 font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                        style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
                    >
                        <HelpCircle className="w-4 h-4" />
                        Help & Documentation
                    </button>
                    {isGroupView ? (
                        <button
                            onClick={onLeaveGroup}
                            className="w-full flex items-center justify-center gap-3 py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-500/20"
                        >
                            <LogOut className="w-4 h-4" />
                            Exit Group Session
                        </button>
                    ) : (
                        <button
                            onClick={onLogOut}
                            className="w-full flex items-center justify-center gap-3 py-4 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all active:scale-95 shadow-lg shadow-black/20"
                        >
                            <LogOut className="w-4 h-4" />
                            Log Out
                        </button>
                    )}
                    <p className="text-[9px] text-center text-white/40 font-bold uppercase tracking-[0.3em] mt-4">FairSplit Premium v1.3.0</p>
                </div>
            </div>
        </div>
    );
};

export default SettingsDrawer;
