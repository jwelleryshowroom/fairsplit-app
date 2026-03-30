import React, { useState } from 'react';
import { X, Inbox, Clock, ClipboardList, PlusCircle, Loader2, ScanLine, Home, Users, Check, MessageSquare, Bell } from 'lucide-react';

const formatTime = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const getSourceIcon = (source) => {
    if (source === 'sms') return <MessageSquare className="w-2 h-2" />;
    if (source === 'notification' || source === 'native') return <Bell className="w-2 h-2" />;
    if (source === 'clipboard') return <ClipboardList className="w-2 h-2" />;
    return <PlusCircle className="w-2 h-2" />;
};

const getSourceLabel = (source) => {
    if (source === 'sms') return 'SMS Auto';
    if (source === 'notification' || source === 'native') return 'Push Auto';
    if (source === 'clipboard') return 'Clipboard';
    return 'Manual';
};

const getSourceColor = (source) => {
    if (source === 'sms') return 'text-sky-500 bg-sky-50 border-sky-100';
    if (source === 'notification' || source === 'native') return 'text-amber-500 bg-amber-50 border-amber-100';
    if (source === 'clipboard') return 'text-violet-500 bg-violet-50 border-violet-100';
    return 'text-slate-400 bg-slate-50 border-slate-100';
};

// --- Avatar chip for member selection ---
const MemberChip = ({ member, selected, onToggle }) => (
    <button
        onClick={() => onToggle(member.id)}
        className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${selected ? '' : 'opacity-40'}`}
    >
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black uppercase border-2 transition-all ${selected ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}>
            {member.name?.charAt(0) || '?'}
            {selected && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border border-white flex items-center justify-center">
                    <Check className="w-1.5 h-1.5 text-white" />
                </span>
            )}
        </div>
        <span className={`text-[9px] font-bold truncate max-w-[36px] ${selected ? 'text-slate-700' : 'text-slate-400'}`}>
            {member.name?.split(' ')[0]}
        </span>
    </button>
);

// --- Individual Transaction Card ---
const TransactionCard = ({ tx, currentGroupId, currentGroupName, currentGroupMembers, onHomeBill, onCustomSplit, onIgnore }) => {
    const activeMembers = (currentGroupMembers || []).filter(m => m.isActive !== false);
    const inactiveMembers = (currentGroupMembers || []).filter(m => m.isActive === false);

    const [mode, setMode] = useState('idle'); // 'idle' | 'splitting' | 'loading'
    const [selectedIds, setSelectedIds] = useState([]);

    const handleSplitOpen = () => {
        setSelectedIds(activeMembers.map(m => m.id.toString()));
        setMode('splitting');
    };

    const toggleMember = (id) => {
        const sid = id.toString();
        setSelectedIds(prev => prev.includes(sid) ? prev.filter(x => x !== sid) : [...prev, sid]);
    };

    const handleHomeBill = async () => {
        setMode('loading');
        await onHomeBill(tx.id, currentGroupId, currentGroupName, currentGroupMembers);
    };

    const handleConfirmSplit = async () => {
        if (selectedIds.length === 0) return;
        setMode('loading');
        await onCustomSplit(tx.id, currentGroupId, currentGroupName, currentGroupMembers, selectedIds);
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:border-slate-200">
            {/* Card Top: Amount + Merchant + Time */}
            <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                <div className={`h-11 px-3 py-1 rounded-xl flex flex-col items-center justify-center flex-shrink-0 shadow-inner ${tx.type === 'credit' ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}>
                    <div className="flex items-baseline gap-0.5 mt-0.5">
                        <span className={`text-[10px] font-black ${tx.type === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>₹</span>
                        <span className={`text-base font-black tracking-tight leading-none ${tx.type === 'credit' ? 'text-emerald-700' : 'text-red-700'}`}>
                            {tx.amount?.toLocaleString('en-IN')}
                        </span>
                    </div>
                    <span className={`text-[7px] font-black uppercase tracking-widest text-center mt-0.5 ${tx.type === 'credit' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {tx.type === 'credit' ? 'IN' : 'OUT'}
                    </span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-800 text-sm truncate">{tx.merchant || 'Unknown Merchant'}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${getSourceColor(tx.source)}`}>
                            {getSourceIcon(tx.source)}
                            {getSourceLabel(tx.source)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />{formatTime(tx.timestamp)}
                        </span>
                    </div>
                </div>

                {/* Group badge */}
                {currentGroupName && (
                    <span className="text-[9px] bg-indigo-50 text-indigo-500 border border-indigo-100 px-2 py-1 rounded-full font-bold flex-shrink-0 truncate max-w-[80px]">
                        → {currentGroupName}
                    </span>
                )}
            </div>

            {/* Action Buttons or Inline Picker */}
            {mode === 'loading' ? (
                <div className="px-4 pb-4 flex items-center justify-center py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                </div>
            ) : mode === 'splitting' ? (
                /* Inline member picker */
                <div className="px-4 pb-4 space-y-3 border-t border-slate-50 pt-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Split with:</p>
                    <div className="flex flex-wrap gap-3">
                        {activeMembers.map(m => (
                            <div key={m.id} className="relative">
                                <MemberChip member={m} selected={selectedIds.includes(m.id.toString())} onToggle={toggleMember} />
                            </div>
                        ))}
                        {inactiveMembers.length > 0 && (
                            <>
                                <div className="w-full flex items-center gap-2">
                                    <div className="h-px flex-1 bg-slate-100" />
                                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Inactive</span>
                                    <div className="h-px flex-1 bg-slate-100" />
                                </div>
                                {inactiveMembers.map(m => (
                                    <div key={m.id} className="relative opacity-50">
                                        <MemberChip member={m} selected={selectedIds.includes(m.id.toString())} onToggle={toggleMember} />
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={() => setMode('idle')}
                            className="flex-shrink-0 px-3 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmSplit}
                            disabled={selectedIds.length === 0}
                            className="flex-1 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-md shadow-indigo-100"
                        >
                            <Check className="w-3.5 h-3.5" />
                            Confirm Split ({selectedIds.length} member{selectedIds.length !== 1 ? 's' : ''})
                        </button>
                    </div>
                </div>
            ) : (
                /* 3-Action Buttons */
                <div className="flex gap-2 px-4 pb-4">
                    <button
                        onClick={handleHomeBill}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-black bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-100 hover:border-amber-200 rounded-xl transition-all active:scale-[0.97]"
                    >
                        <Home className="w-3.5 h-3.5" /> Home Bill
                    </button>
                    <button
                        onClick={handleSplitOpen}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-black bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 hover:border-indigo-200 rounded-xl transition-all active:scale-[0.97]"
                    >
                        <Users className="w-3.5 h-3.5" /> Split
                    </button>
                    <button
                        onClick={() => onIgnore(tx.id)}
                        className="w-10 flex items-center justify-center py-2 text-[11px] font-black bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-400 border border-slate-100 hover:border-red-100 rounded-xl transition-all active:scale-[0.97]"
                        title="Ignore"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
};

// --- Smart Inbox (responsive: right panel on desktop, bottom sheet on mobile) ---
const SmartInbox = ({
    isOpen,
    onClose,
    pendingTransactions,
    isLoading,
    currentGroupId,
    currentGroupName,
    currentGroupMembers,
    onHomeBill,
    onCustomSplit,
    onPersonal,
    onClearAll, // new
    setConfirmConfig,
}) => {
    const [filter, setFilter] = useState('all'); // 'all' | 'credit' | 'debit'
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);

    if (!isOpen) return null;

    const filteredTransactions = pendingTransactions.filter(tx => {
        if (filter === 'all') return true;
        return tx.type === filter;
    });

    const FilterControls = () => (
        <div className="flex items-center bg-slate-50/50 rounded-2xl p-1 border border-slate-100 shadow-inner overflow-hidden">
            {isFilterExpanded && (
                <div className="flex items-center gap-1 px-1 animate-in slide-in-from-right-2 duration-300">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('credit')}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'credit' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-emerald-500'}`}
                    >
                        IN
                    </button>
                    <button
                        onClick={() => setFilter('debit')}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'debit' ? 'bg-red-500 text-white shadow-md' : 'text-slate-400 hover:text-red-500'}`}
                    >
                        OUT
                    </button>
                </div>
            )}
            <button
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all active:scale-90 ${isFilterExpanded ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                title="Filter Transactions"
            >
                {/* Custom Funnel-like character or Filter icon */}
                🔍
            </button>
        </div>
    );

    const handleClearAll = () => {
        const filterName = filter === 'all' ? 'ALL' : filter.toUpperCase() + 'S';
        setConfirmConfig({
            isOpen: true,
            title: `Sweep ${filterName}? 🧹`,
            message: `Are you sure you want to dismiss all pending ${filterName.toLowerCase()} transactions? This will move them to 'Ignored'.`,
            type: 'warning',
            onConfirm: () => {
                onClearAll?.(filter);
            }
        });
    };

    const ClearControl = () => (
        <button
            onClick={handleClearAll}
            className="w-9 h-9 bg-slate-50 hover:bg-white text-lg rounded-xl border border-slate-100 flex items-center justify-center transition-all active:scale-90 shadow-sm"
            title="Clear All"
        >
            🧹
        </button>
    );

    const EmptyState = () => (
        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                <Inbox className="w-7 h-7 text-indigo-300" />
            </div>
            <p className="font-black text-slate-700 text-base">
                {filter === 'all' ? 'Inbox is clear' : `No ${filter}s found`}
            </p>
            <p className="text-sm text-slate-400 mt-2 max-w-[220px] leading-relaxed font-medium">
                {filter === 'all' 
                    ? "Capture screenshots or copy bank SMS to see them pop up here automatically."
                    : `Try changing your filters to see other transactions.`}
            </p>
        </div>
    );

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99998 }}>
            {/* Backdrop */}
            <div
                style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(2px)' }}
                onClick={onClose}
            />

            {/* === DESKTOP: Right-Side Panel (md+) === */}
            <div
                className="hidden md:flex flex-col"
                style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: '380px',
                    background: 'rgba(248,250,252,0.98)',
                    backdropFilter: 'blur(40px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                    boxShadow: '-24px 0 80px rgba(0,0,0,0.12)',
                    animation: 'slideInFromRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
                }}
            >
                <style>{`
                    @keyframes slideInFromRight {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                    @keyframes slideInFromBottom {
                        from { transform: translateY(100%); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                `}</style>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
                            <Inbox className="w-4 h-4 text-white" />
                        </div>
                        <div className={isFilterExpanded ? 'hidden' : 'block'}>
                            <h2 className="font-black text-slate-800 text-base leading-none">Smart Inbox</h2>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-widest">
                                {pendingTransactions.length} pending
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <FilterControls />
                        <ClearControl />
                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-all active:scale-90"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>



                {/* Transaction List */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar pb-8">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <EmptyState />
                    ) : (
                        filteredTransactions.map(tx => (
                            <TransactionCard
                                key={tx.id}
                                tx={tx}
                                currentGroupId={currentGroupId}
                                currentGroupName={currentGroupName}
                                currentGroupMembers={currentGroupMembers}
                                onHomeBill={onHomeBill}
                                onCustomSplit={onCustomSplit}
                                onIgnore={onPersonal}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* === MOBILE: Bottom Sheet (< md) === */}
            <div
                className="md:hidden flex flex-col"
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    maxHeight: '90vh',
                    background: 'rgba(248,250,252,0.97)',
                    backdropFilter: 'blur(40px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                    borderRadius: '28px 28px 0 0',
                    boxShadow: '0 -24px 80px rgba(0,0,0,0.12)',
                    animation: 'slideInFromBottom 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
                }}
            >
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                    <div className="w-10 h-1 bg-slate-200 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
                            <Inbox className="w-4 h-4 text-white" />
                        </div>
                        <div className={isFilterExpanded ? 'hidden' : 'block'}>
                            <h2 className="font-black text-slate-800 text-base leading-none">Smart Inbox</h2>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-widest">
                                {pendingTransactions.length} pending
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <FilterControls />
                        <ClearControl />
                        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 active:scale-90">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>



                {/* Transaction List */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar pb-10">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <EmptyState />
                    ) : (
                        filteredTransactions.map(tx => (
                            <TransactionCard
                                key={tx.id}
                                tx={tx}
                                currentGroupId={currentGroupId}
                                currentGroupName={currentGroupName}
                                currentGroupMembers={currentGroupMembers}
                                onHomeBill={onHomeBill}
                                onCustomSplit={onCustomSplit}
                                onIgnore={onPersonal}
                            />
                        ))
                    )}
                </div>

                <div className="h-4 flex-shrink-0" />
            </div>
        </div>
    );
};

export default SmartInbox;
