import React, { useState } from 'react';
import { X, Inbox, Clock, Smartphone, ClipboardList, Users, PlusCircle, UserX, ChevronRight, Loader2, Sparkles, ScanLine } from 'lucide-react';

const SOURCE_LABELS = {
    clipboard: { label: 'Clipboard', icon: ClipboardList, color: 'text-violet-500 bg-violet-50 border-violet-100' },
    manual: { label: 'Manual', icon: PlusCircle, color: 'text-slate-400 bg-slate-50 border-slate-100' },
};

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

// --- Individual Transaction Card ---
const TransactionCard = ({ tx, userGroups, currentGroupId, currentGroupName, onAssign, onPersonal }) => {
    const [expanded, setExpanded] = useState(false);
    const [assigning, setAssigning] = useState(false);

    const sourceInfo = SOURCE_LABELS[tx.source] || SOURCE_LABELS.manual;
    const SourceIcon = sourceInfo.icon;

    const handleAssign = async (groupId, groupName) => {
        setAssigning(true);
        await onAssign(tx.id, groupId, groupName);
        setAssigning(false);
    };

    return (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden transition-all">
            {/* Card Header */}
            <div
                className="flex items-center gap-4 p-4 cursor-pointer active:bg-slate-50 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                {/* Amount Badge */}
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-100 flex flex-col items-center justify-center shadow-inner">
                    <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">₹</span>
                    <span className="text-base font-black text-indigo-700 leading-none">{tx.amount?.toLocaleString('en-IN')}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-800 text-sm truncate">{tx.merchant || 'Unknown Merchant'}</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${sourceInfo.color}`}>
                            <SourceIcon className="w-2.5 h-2.5" />
                            {sourceInfo.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {formatTime(tx.timestamp)}
                        </span>
                    </div>
                </div>

                <ChevronRight className={`w-4 h-4 text-slate-300 flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
            </div>

            {/* Expanded Action Panel */}
            {expanded && (
                <div className="border-t border-slate-50 bg-slate-50/50 p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    {/* Raw SMS preview */}
                    {tx.rawText && (
                        <p className="text-[10px] text-slate-400 font-medium bg-white rounded-xl p-3 border border-slate-100 leading-relaxed line-clamp-2">
                            "{tx.rawText}"
                        </p>
                    )}

                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Route to group</p>

                    {/* Current active group (highlighted) */}
                    {currentGroupId && (
                        <button
                            onClick={() => handleAssign(currentGroupId, currentGroupName)}
                            disabled={assigning}
                            className="w-full flex items-center gap-3 p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all active:scale-[0.98] shadow-md shadow-indigo-200 font-black text-sm"
                        >
                            {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            <span className="flex-1 text-left truncate">{currentGroupName || 'Current Group'}</span>
                            <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-widest">Active</span>
                        </button>
                    )}

                    {/* Other user groups */}
                    {userGroups.filter(g => g.id !== currentGroupId).map(group => (
                        <button
                            key={group.id}
                            onClick={() => handleAssign(group.id, group.roomName)}
                            disabled={assigning}
                            className="w-full flex items-center gap-3 p-3 bg-white hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 text-slate-700 rounded-xl transition-all active:scale-[0.98] font-bold text-sm"
                        >
                            <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <span className="flex-1 text-left truncate">{group.roomName}</span>
                        </button>
                    ))}

                    {userGroups.length === 0 && !currentGroupId && (
                        <p className="text-[10px] text-slate-400 text-center py-2 font-bold">No groups found. Create one first!</p>
                    )}

                    {/* Divider */}
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-px bg-slate-200" />
                        <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">or</span>
                        <div className="flex-1 h-px bg-slate-200" />
                    </div>

                    {/* Personal / Ignore */}
                    <button
                        onClick={() => onPersonal(tx.id)}
                        className="w-full flex items-center gap-3 p-3 bg-white hover:bg-red-50 border border-slate-100 hover:border-red-200 text-slate-400 hover:text-red-500 rounded-xl transition-all active:scale-[0.98] font-bold text-sm"
                    >
                        <UserX className="w-4 h-4 flex-shrink-0" />
                        Personal / Ignore
                    </button>
                </div>
            )}
        </div>
    );
};

// --- Smart Inbox Drawer ---
const SmartInbox = ({
    isOpen,
    onClose,
    pendingTransactions,
    userGroups,
    isLoading,
    currentGroupId,
    currentGroupName,
    onAssign,
    onPersonal,
    onAddManual,
    onScanClipboard,
}) => {
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [manualAmount, setManualAmount] = useState('');
    const [manualMerchant, setManualMerchant] = useState('');
    const [isScanning, setIsScanning] = useState(false);

    const handleScan = async () => {
        setIsScanning(true);
        await onScanClipboard?.();
        setTimeout(() => setIsScanning(false), 1000);
    };

    const handleAddManual = () => {
        const amount = parseFloat(manualAmount);
        if (!amount || amount <= 0) return;
        onAddManual(amount, manualMerchant || 'Manual Entry');
        setManualAmount('');
        setManualMerchant('');
        setShowManualEntry(false);
    };

    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99998 }}>
            {/* Backdrop */}
            <div
                style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}
                onClick={onClose}
            />

            {/* Drawer — slides up from bottom on mobile, right panel on desktop */}
            <div style={{
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
                display: 'flex',
                flexDirection: 'column',
                animation: 'slideInFromBottom 0.4s cubic-bezier(0.16,1,0.3,1) both',
            }}>
                <style>{`
                    @keyframes slideInFromBottom {
                        from { transform: translateY(100%); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                `}</style>

                {/* Handle bar */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 bg-slate-200 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
                            <Inbox className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="font-black text-slate-800 text-base leading-none">Smart Inbox</h2>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-widest">
                                {pendingTransactions.length} pending
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Manual Scan Clipboard Button */}
                        <button
                            onClick={handleScan}
                            disabled={isScanning}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all active:scale-95 ${
                                isScanning
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                    : 'bg-slate-100 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600'
                            }`}
                            title="Scan clipboard for bank SMS"
                        >
                            {isScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ScanLine className="w-3.5 h-3.5" />}
                            {isScanning ? 'Scanning...' : 'Scan'}
                        </button>
                        <button
                            onClick={() => setShowManualEntry(!showManualEntry)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-black transition-all active:scale-95"
                        >
                            <PlusCircle className="w-3.5 h-3.5" />
                            Add
                        </button>
                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-all active:scale-90"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Manual Entry Panel */}
                {showManualEntry && (
                    <div className="px-5 py-4 border-b border-slate-100 bg-white animate-in slide-in-from-top-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Add transaction manually</p>
                        <div className="flex gap-2">
                            <div className="relative flex-shrink-0 w-28">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                                <input
                                    type="number"
                                    placeholder="Amount"
                                    value={manualAmount}
                                    onChange={e => setManualAmount(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-black text-slate-800 outline-none focus:border-indigo-400 bg-slate-50 transition-colors"
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="Merchant (optional)"
                                value={manualMerchant}
                                onChange={e => setManualMerchant(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddManual()}
                                className="flex-1 px-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 bg-slate-50 transition-colors"
                            />
                            <button
                                onClick={handleAddManual}
                                className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-sm active:scale-95 transition-all"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                )}

                {/* Transaction List */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                        </div>
                    ) : pendingTransactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                                <Inbox className="w-7 h-7 text-indigo-300" />
                            </div>
                            <p className="font-black text-slate-700 text-base">Inbox is clear</p>
                            <p className="text-sm text-slate-400 mt-2 max-w-[220px] leading-relaxed">
                                Copy a bank SMS and switch back to the app — we'll auto-detect the amount.
                            </p>
                        </div>
                    ) : (
                        pendingTransactions.map(tx => (
                            <TransactionCard
                                key={tx.id}
                                tx={tx}
                                userGroups={userGroups}
                                currentGroupId={currentGroupId}
                                currentGroupName={currentGroupName}
                                onAssign={onAssign}
                                onPersonal={onPersonal}
                            />
                        ))
                    )}
                </div>

                {/* Safe area bottom padding */}
                <div className="h-safe-bottom pb-4" />
            </div>
        </div>
    );
};

export default SmartInbox;
