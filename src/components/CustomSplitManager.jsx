import React, { useState } from 'react';
import { Split, X, Check, UserPlus, AlertCircle, Plus, Trash2, Receipt, Users, ChevronDown, Edit3 } from 'lucide-react';

// Deterministic color per member name
const memberColor = (name = '') => {
    const colors = [
        { bg: 'bg-violet-500', text: 'text-white', ring: 'ring-violet-400' },
        { bg: 'bg-blue-500', text: 'text-white', ring: 'ring-blue-400' },
        { bg: 'bg-emerald-500', text: 'text-white', ring: 'ring-emerald-400' },
        { bg: 'bg-rose-500', text: 'text-white', ring: 'ring-rose-400' },
        { bg: 'bg-amber-500', text: 'text-white', ring: 'ring-amber-400' },
        { bg: 'bg-cyan-500', text: 'text-white', ring: 'ring-cyan-400' },
        { bg: 'bg-fuchsia-500', text: 'text-white', ring: 'ring-fuchsia-400' },
        { bg: 'bg-teal-500', text: 'text-white', ring: 'ring-teal-400' },
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
};

const Avatar = ({ name = '?', size = 'md', selected = false }) => {
    const c = memberColor(name);
    const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs';
    return (
        <div className={`${sz} rounded-full ${c.bg} ${c.text} font-black flex items-center justify-center flex-shrink-0 uppercase
            ${selected ? `ring-2 ring-offset-2 ring-offset-[#111827] ${c.ring} scale-110` : 'opacity-60 hover:opacity-90'}
            transition-all duration-200 cursor-pointer select-none`}>
            {(name || '?').charAt(0).toUpperCase()}
        </div>
    );
};

// ============================================================================
// 1. DASHBOARD COMPACT CARD (Summary Widget)
// ============================================================================
export const CustomSplitSummaryCard = ({ customSplits, members, onClickManage }) => {
    const visibleSplits = customSplits.filter(s => !(s.description && s.description.startsWith('Settled')));
    const totalSideExpenses = visibleSplits.reduce((sum, s) => sum + s.amount, 0);

    // Get unique involved members (by taking first letter)
    const uniqueInvolved = new Set();
    visibleSplits.forEach(s => {
        uniqueInvolved.add(s.payerId);
        s.involvedIds.forEach(id => uniqueInvolved.add(id));
    });

    if (visibleSplits.length === 0) {
        return (
            <button
                onClick={onClickManage}
                className="bg-white/40 backdrop-blur-md rounded-2xl border-2 border-dashed border-orange-200/80 p-4 lg:p-5 flex items-center justify-between text-orange-400 hover:text-orange-600 hover:bg-orange-50/50 transition-all group animate-in zoom-in-95 w-full h-full text-left"
            >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="bg-orange-100 shadow-sm w-10 h-10 rounded-[14px] flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all duration-300 group-hover:scale-110 shrink-0">
                        <Split className="w-5 h-5 text-orange-500 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex flex-col items-start truncate pr-2">
                        <span className="text-base font-black tracking-tight text-slate-700 group-hover:text-orange-600 transition-colors truncate w-full">Custom Splits</span>
                        <span className="text-[10px] font-bold text-slate-400 tracking-wide mt-0.5 truncate w-full">Click to add a custom expense</span>
                    </div>
                </div>
                <div className="shrink-0 bg-white p-2 rounded-xl text-orange-300 group-hover:text-orange-600 group-hover:bg-orange-100 transition-all shadow-sm">
                   <ChevronDown className="w-4 h-4" />
                </div>
            </button>
        );
    }

    return (
        <div className="bg-gradient-to-br from-orange-400 to-rose-500 rounded-2xl p-4 lg:p-5 flex items-center justify-between shadow-[0_8px_30px_rgb(249,115,22,0.2)] text-white w-full h-full relative overflow-hidden group cursor-pointer" onClick={onClickManage}>
            {/* Background design elements */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
            
            <div className="flex items-center gap-3 relative z-10 w-full min-w-0">
                <div className="w-10 h-10 rounded-[14px] bg-white/20 flex shrink-0 items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                    <Split className="w-5 h-5 text-white" />
                </div>
                
                <div className="flex-1 min-w-0 pr-2">
                    <div className="flex flex-col">
                        <h3 className="text-base font-black tracking-tight truncate flex items-center gap-2 group-hover:text-amber-100 transition-colors">
                            ₹{totalSideExpenses.toLocaleString('en-IN')}
                        </h3>
                        <p className="text-[10px] font-bold text-orange-100 truncate tracking-wide mt-0.5 flex flex-wrap items-center gap-[6px]">
                            <span>{visibleSplits.length} {visibleSplits.length === 1 ? 'CUSTOM SPLIT' : 'CUSTOM SPLITS'}</span>
                            <span className="text-white/40 mb-[1px]">•</span>
                            <span className="text-white flex items-center gap-1 uppercase tracking-widest bg-white/10 px-1.5 py-[2px] rounded-md shadow-sm border border-white/20 group-hover:bg-white/30 group-hover:border-white/40 transition-all"><Edit3 className="w-2.5 h-2.5" /> Manage</span>
                        </p>
                    </div>
                </div>

                <div className="flex -space-x-1.5 shrink-0 bg-white/10 p-1 rounded-full border border-white/20 shadow-inner">
                    {Array.from(uniqueInvolved).slice(0, 3).map((id, i) => {
                        const memberInfo = members?.find(m => m.id.toString() === id.toString());
                        const nameToUse = memberInfo?.name || id.toString().replace('EXT:', '');
                        return (
                            <div key={i} className="relative z-10" style={{ zIndex: 10 - i }}>
                                <Avatar name={nameToUse} size="sm" selected={false} />
                            </div>
                        );
                    })}
                    {uniqueInvolved.size > 3 && (
                        <div className="w-7 h-7 rounded-full bg-orange-950/40 text-[9px] font-black text-white flex items-center justify-center border border-white/20 relative z-0">
                            +{uniqueInvolved.size - 3}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


// ============================================================================
// 2. FULL MANAGEMENT MODAL (The Overlay)
// ============================================================================
export const CustomSplitModal = ({ isOpen, onClose, members, customSplits, setCustomSplits }) => {
    const [payerId, setPayerId] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [involvedIds, setInvolvedIds] = useState([]);
    const [addError, setAddError] = useState('');
    const [showExtInput, setShowExtInput] = useState(false);
    const [extName, setExtName] = useState('');

    const toggleInvolved = (id) => {
        setInvolvedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const addExternal = () => {
        const nameToCheck = extName.trim();
        if (!nameToCheck) return;
        const existingMember = members.find(m => m.name.trim().toLowerCase() === nameToCheck.toLowerCase());
        if (existingMember) {
            if (!involvedIds.includes(existingMember.id)) setInvolvedIds([...involvedIds, existingMember.id]);
            setExtName(''); setShowExtInput(false); return;
        }
        const newId = `EXT:${nameToCheck}`;
        if (!involvedIds.includes(newId)) setInvolvedIds([...involvedIds, newId]);
        setExtName(''); setShowExtInput(false);
    };

    const addSplit = () => {
        setAddError('');
        if (!payerId) { setAddError('Select who paid.'); return; }
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) { setAddError('Enter a valid amount.'); return; }
        if (involvedIds.length < 2) { setAddError('Select at least 2 people to split with.'); return; }
        setCustomSplits([...customSplits, {
            id: Date.now(),
            payerId: payerId.toString(),
            amount: parseFloat(amount),
            description: description.trim(),
            involvedIds
        }]);
        setAmount(''); setInvolvedIds([]); setPayerId(''); setDescription(''); setAddError('');
    };

    const removeSplit = (id) => setCustomSplits(customSplits.filter(s => s.id !== id));

    const getName = (id) => {
        if (typeof id === 'string' && id.startsWith('EXT:')) return id.replace('EXT:', '') + ' (Guest)';
        const m = members.find(m => m.id.toString() === id.toString());
        return m ? m.name : 'Unknown';
    };

    // Visible (non-settlement) splits
    const visibleSplits = customSplits.filter(s => !(s.description && s.description.startsWith('Settled')));
    const totalSideExpenses = visibleSplits.reduce((sum, s) => sum + s.amount, 0);

    // Per-person net across all side splits
    const perPersonMap = {};
    visibleSplits.forEach(split => {
        const count = split.involvedIds.length;
        const perShare = split.amount / count;
        split.involvedIds.forEach(id => {
            if (!perPersonMap[id]) perPersonMap[id] = { name: getName(id), paid: 0, share: 0 };
            perPersonMap[id].share += perShare;
        });
        if (!perPersonMap[split.payerId]) perPersonMap[split.payerId] = { name: getName(split.payerId), paid: 0, share: 0 };
        perPersonMap[split.payerId].paid += split.amount;
    });

    const selectedPayer = members.find(m => m.id.toString() === payerId.toString());
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 pb-24 sm:pb-6 overflow-y-auto">
            {/* Dark glass backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-5xl bg-slate-50 rounded-[2rem] shadow-2xl border border-white/20 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-white shadow-sm relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center">
                            <Split className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none">Manage Side Expenses</h2>
                            <p className="text-xs font-bold text-slate-500 mt-1">Add, edit, or remove custom splits.</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {/* Section header */}
                    <div className="flex items-center gap-2 mb-4 px-1">
                        <Split className="w-4 h-4 text-orange-400" />
                        <h2 className="text-sm font-black text-slate-600 uppercase tracking-[0.15em]">Side Expenses</h2>
                        {visibleSplits.length > 0 && (
                            <span className="ml-auto text-xs font-black text-orange-500 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full">
                                ₹{totalSideExpenses.toLocaleString('en-IN')} total
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                        {/* ─── LEFT: Add a Split Form ─── */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Add Side Expense</p>

                            {/* Row 1: Who Paid + Amount */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Who Paid?</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                            {selectedPayer
                                                ? <Avatar name={selectedPayer.name} size="sm" selected />
                                                : <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
                                                    <Users className="w-3 h-3 text-slate-400" />
                                                </div>
                                            }
                                        </div>
                                        <select
                                            className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-300 text-sm font-semibold text-slate-700 appearance-none cursor-pointer"
                                            value={payerId}
                                            onChange={e => setPayerId(e.target.value)}
                                        >
                                            <option value="">Select...</option>
                                            {members.map(m => (
                                                <option key={m.id} value={m.id}>{m.name || 'Unnamed'}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <ChevronDown className="w-4 h-4 text-slate-400" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">₹</span>
                                        <input
                                            type="number"
                                            className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-300 text-sm font-bold text-slate-800"
                                            value={amount}
                                            onChange={e => setAmount(e.target.value)}
                                            placeholder="0"
                                            min="0"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: For What */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">For What?</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-300 text-sm text-slate-700"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="e.g. Wifi, Pizza, Grab..."
                                    onKeyDown={e => e.key === 'Enter' && addSplit()}
                                />
                            </div>

                            {/* Row 3: Split Between — avatar pills */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Split Between</label>
                                <div className="flex flex-wrap gap-2 items-center">
                                    {members.map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => toggleInvolved(m.id)}
                                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-200 active:scale-95 text-xs font-bold"
                                            style={involvedIds.includes(m.id)
                                                ? { background: 'rgba(249,115,22,0.12)', border: '1.5px solid rgba(249,115,22,0.4)', color: '#ea580c' }
                                                : { background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#64748b' }
                                            }
                                        >
                                            <Avatar name={m.name} size="sm" selected={involvedIds.includes(m.id)} />
                                            {m.name || 'Unnamed'}
                                        </button>
                                    ))}

                                    {/* Existing guest chips */}
                                    {involvedIds
                                        .filter(id => typeof id === 'string' && id.startsWith('EXT:'))
                                        .map(extId => (
                                            <button
                                                key={extId}
                                                onClick={() => toggleInvolved(extId)}
                                                className="flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold"
                                                style={{ background: 'rgba(249,115,22,0.12)', border: '1.5px solid rgba(249,115,22,0.4)', color: '#ea580c' }}
                                            >
                                                {extId.replace('EXT:', '')}
                                                <X className="w-2.5 h-2.5" />
                                            </button>
                                        ))
                                    }

                                    {showExtInput ? (
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="text"
                                                className="w-20 px-2 py-1 text-xs border border-orange-200 rounded-lg outline-none ring-1 ring-orange-200 bg-orange-50"
                                                placeholder="Name..."
                                                value={extName}
                                                onChange={e => setExtName(e.target.value)}
                                                autoFocus
                                                onKeyDown={e => e.key === 'Enter' && addExternal()}
                                            />
                                            <button onClick={addExternal} className="bg-emerald-500 text-white p-1 rounded-lg hover:bg-emerald-600 transition-colors">
                                                <Check className="w-3 h-3" />
                                            </button>
                                            <button onClick={() => setShowExtInput(false)} className="bg-slate-200 text-slate-500 p-1 rounded-lg hover:bg-slate-300 transition-colors">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setShowExtInput(true)}
                                            className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-slate-300 text-xs font-bold text-slate-400 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 transition-all"
                                        >
                                            <UserPlus className="w-3 h-3" /> Guest
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Error */}
                            {addError && (
                                <p className="text-red-500 text-xs font-bold flex items-center gap-1.5 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
                                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {addError}
                                </p>
                            )}

                            {/* Add button */}
                            <button
                                onClick={addSplit}
                                className="w-full bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white font-black py-3 rounded-2xl transition-all shadow-md hover:shadow-orange-200 hover:-translate-y-0.5 active:scale-[0.98] text-sm flex justify-center items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Add Expense
                            </button>
                        </div>

                        {/* ─── RIGHT: Live Split Feed ─── */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">

                            {/* Feed header */}
                            <div className="px-5 pt-5 pb-3 border-b border-slate-100">
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                                            {visibleSplits.length} {visibleSplits.length === 1 ? 'Expense' : 'Expenses'}
                                        </p>
                                        <p className="text-2xl font-black text-slate-800">
                                            ₹{totalSideExpenses.toLocaleString('en-IN')}
                                            <span className="text-sm font-bold text-slate-400 ml-1">total</span>
                                        </p>
                                    </div>
                                    <Receipt className="w-6 h-6 text-orange-200" />
                                </div>
                            </div>

                            {/* Split entries */}
                            <div className="flex-1 overflow-y-auto" style={{ maxHeight: '280px' }}>
                                {visibleSplits.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full py-12 text-slate-300">
                                        <Split className="w-10 h-10 mb-3" />
                                        <p className="text-xs font-bold text-slate-400 text-center">No side expenses yet.<br />Add one using the form.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-50">
                                        {visibleSplits.map(split => {
                                            const payerName = members.find(m => m.id.toString() === split.payerId?.toString())?.name || 'Unknown';
                                            const count = split.involvedIds.length;
                                            const perShare = split.amount / count;
                                            const namesList = split.involvedIds.map(id => getName(id).replace(' (Guest)', '')).join(', ');

                                            return (
                                                <div key={split.id} className="flex items-center gap-3 px-5 py-3.5 group hover:bg-orange-50/40 transition-colors">
                                                    <Avatar name={payerName} size="sm" selected />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-slate-700 truncate">
                                                            {payerName}
                                                            {split.description && <span className="text-slate-400 font-normal"> · {split.description}</span>}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 truncate" title={namesList}>
                                                            Split with {namesList}
                                                        </p>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-sm font-black text-emerald-600">₹{split.amount.toLocaleString('en-IN')}</p>
                                                        <p className="text-[10px] text-slate-400 font-semibold text-right">{perShare.toFixed(0)} each</p>
                                                    </div>
                                                    <button
                                                        onClick={() => removeSplit(split.id)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-100 text-slate-300 hover:text-red-500 rounded-lg ml-1"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Per-person summary chips */}
                            {Object.keys(perPersonMap).length > 0 && (
                                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/60">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Net per person</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {Object.entries(perPersonMap).map(([id, data]) => {
                                            const net = data.paid - data.share;
                                            if (Math.abs(net) < 0.5) return null;
                                            const isPositive = net > 0;
                                            return (
                                                <span
                                                    key={id}
                                                    className={`text-[10px] font-black px-2.5 py-1 rounded-full ${isPositive
                                                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                        : 'bg-rose-100 text-rose-700 border border-rose-200'
                                                        }`}
                                                >
                                                    {data.name.split(' ')[0]} {isPositive ? `gets ₹${Math.round(net)}` : `owes ₹${Math.round(Math.abs(net))}`}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
