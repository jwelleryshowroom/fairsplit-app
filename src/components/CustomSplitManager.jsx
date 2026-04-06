import React, { useState } from 'react';
import { Split, X, Check, UserPlus, AlertCircle, Plus, Trash2, Receipt, Users, ChevronDown, Edit3 } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

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
    const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' :
        size === 'lg' ? 'w-11 h-11 text-sm' : 'w-9 h-9 text-xs';
    return (
        <div className={`${sz} rounded-full ${c.bg} ${c.text} font-black flex items-center justify-center flex-shrink-0 uppercase
            ${selected ? `ring-2 ring-offset-2 ring-offset-white ${c.ring} scale-110` : 'hover:opacity-90'}
            transition-all duration-200 cursor-pointer select-none shadow-sm`}>
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
                    <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-[14px] lg:rounded-[18px] bg-orange-100 flex shadow-sm items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all duration-300 group-hover:scale-110 shrink-0">
                        <Split className="w-5 h-5 lg:w-6 lg:h-6 text-orange-500 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex flex-col items-start truncate pr-2">
                        <span className="text-base lg:text-lg font-black tracking-tight text-slate-700 group-hover:text-orange-600 transition-colors truncate w-full">Custom Splits</span>
                        <span className="text-[10px] lg:text-xs font-bold text-slate-400 tracking-wide mt-0.5 truncate w-full">Click to add a custom expense</span>
                    </div>
                </div>
                <div className="shrink-0 bg-white p-2 lg:p-2.5 rounded-xl text-orange-300 group-hover:text-orange-600 group-hover:bg-orange-100 transition-all shadow-sm">
                    <ChevronDown className="w-4 h-4 lg:w-5 lg:h-5" />
                </div>
            </button>
        );
    }

    return (
        <div className="bg-gradient-to-br from-orange-400 to-rose-500 rounded-2xl p-4 lg:p-5 flex items-center justify-between shadow-[0_8px_30px_rgb(249,115,22,0.2)] text-white w-full relative overflow-hidden group cursor-pointer border border-orange-300/50 hover:border-orange-300 transition-all active:scale-[0.99]" onClick={onClickManage}>
            {/* Premium Background Flare */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>

            <div className="w-full flex items-center justify-between gap-3 relative z-10 transition-all duration-300 group-hover:opacity-20 group-hover:blur-[2px] group-hover:scale-[0.98]">
                <div className="flex items-center gap-2.5 lg:gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 lg:w-16 lg:h-16 rounded-[14px] lg:rounded-[22px] bg-white/20 border border-white/30 flex shrink-0 items-center justify-center shadow-inner group-hover:rotate-6 transition-transform duration-500 backdrop-blur-md">
                        <Split className="w-5 h-5 lg:w-8 lg:h-8 text-white drop-shadow-sm" />
                    </div>

                    <div className="flex flex-col justify-center flex-1 min-w-0">
                        <h3 className="text-xl lg:text-3xl font-black tracking-tighter sm:tracking-tight truncate leading-none drop-shadow-md">
                            ₹{totalSideExpenses.toLocaleString('en-IN')}
                        </h3>
                        <div className="flex items-center mt-1 lg:mt-2">
                            <span className="bg-white/20 text-[9px] lg:text-[11px] font-black text-white px-2 py-0.5 rounded-lg border border-white/20 uppercase tracking-widest shrink-0 shadow-sm">
                                {visibleSplits.length} EXP
                            </span>
                            <span className="hidden sm:inline-block text-[10px] font-bold text-white/80 uppercase tracking-widest ml-2 truncate opacity-80 select-none">• Tap to manage</span>
                        </div>
                    </div>
                </div>

                <div className="hidden sm:flex -space-x-2 lg:-space-x-3 shrink-0 mr-1 sm:mr-2">
                    {Array.from(uniqueInvolved).slice(0, 3).map((id, i) => {
                        const memberInfo = members?.find(m => m.id.toString() === id.toString());
                        const nameToUse = memberInfo?.name || id.toString().replace('EXT:', '');
                        return (
                            <div key={i} className="relative z-10 ring-2 ring-white/30 rounded-full shadow-lg" style={{ zIndex: 10 - i }}>
                                <Avatar name={nameToUse} size="sm" selected={false} />
                            </div>
                        );
                    })}
                    {uniqueInvolved.size > 3 && (
                        <div className="w-7 h-7 lg:w-9 lg:h-9 rounded-full bg-slate-900/40 text-[9px] lg:text-[10px] font-black text-white flex items-center justify-center border border-white/30 backdrop-blur-md shadow-inner ring-2 ring-white/30">
                            +{uniqueInvolved.size - 3}
                        </div>
                    )}
                </div>
            </div>

            {/* HOVER OVERLAY: Styled exactly like the Settle button */}
            <div className="absolute inset-0 z-20 flex items-center justify-center translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out bg-white/5 backdrop-blur-[1px]">
                <div className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] lg:text-xs shadow-2xl flex items-center gap-2 border border-white/10 group-active:scale-95 transition-all">
                    <Edit3 className="w-4 h-4" /> Manage Splits
                </div>
            </div>
        </div>
    );
};


// ============================================================================
// 2. FULL MANAGEMENT MODAL (The Overlay)
// ============================================================================
export const CustomSplitModal = ({ isOpen, onClose, members, customSplits, setCustomSplits, initialData, setInitialData }) => {
    const [payerId, setPayerId] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [involvedIds, setInvolvedIds] = useState([]);
    const [addError, setAddError] = useState('');
    const [showExtInput, setShowExtInput] = useState(false);
    const [extName, setExtName] = useState('');
    
    // Exact Split Features
    const [splitType, setSplitType] = useState('equal'); // 'equal' | 'exact'
    const [allocations, setAllocations] = useState({});

    // Edit mode
    const [isEditing, setIsEditing] = useState(false);
    const [editSnapshot, setEditSnapshot] = useState(null);

    // Mobile tap-to-reveal actions
    const [tappedCardId, setTappedCardId] = useState(null);

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState(null); // split object to confirm-delete

    React.useEffect(() => {
        if (isOpen && initialData) {
            setAmount(initialData.amount ? initialData.amount.toString() : '');
            setDescription(initialData.description || '');
            setPayerId(initialData.payerId?.toString() || '');
            setSplitType('equal');
            setAllocations({});
        }
    }, [isOpen, initialData]);

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
        
        const numericAmount = parseFloat(amount);
        
        if (splitType === 'equal') {
            if (involvedIds.length < 2) { setAddError('Select at least 2 people to split with.'); return; }
            setCustomSplits([...customSplits, {
                id: Date.now(),
                payerId: payerId.toString(),
                amount: numericAmount,
                splitType: 'equal',
                description: description.trim(),
                involvedIds
            }]);
        } else {
            const activeAllocations = Object.entries(allocations).filter(([k, v]) => parseFloat(v || 0) > 0);
            if (activeAllocations.length === 0) { setAddError('Enter at least one amount.'); return; }
            
            const totalAllocated = activeAllocations.reduce((sum, [k, v]) => sum + parseFloat(v), 0);
            if (Math.abs(numericAmount - totalAllocated) > 0.05) { 
                setAddError(`Allocated (₹${totalAllocated}) must exactly equal the total amount (₹${numericAmount}).`); 
                return; 
            }
            
            const exactInvolvedIds = activeAllocations.map(([k, v]) => k);
            const cleanAllocations = {};
            activeAllocations.forEach(([k, v]) => { cleanAllocations[k] = parseFloat(v); });

            setCustomSplits([...customSplits, {
                id: Date.now(),
                payerId: payerId.toString(),
                amount: numericAmount,
                splitType: 'exact',
                description: description.trim(),
                involvedIds: exactInvolvedIds,
                allocations: cleanAllocations
            }]);
        }
        
        setAmount(''); setInvolvedIds([]); setPayerId(''); setDescription(''); setAddError('');
        setAllocations({}); setSplitType('equal');
        setIsEditing(false); setEditSnapshot(null);
        if (setInitialData) setInitialData(null);
    };

    const removeSplit = (id) => setCustomSplits(customSplits.filter(s => s.id !== id));

    const loadToEdit = (split) => {
        // Save snapshot so we can restore on cancel
        setEditSnapshot(split);
        setIsEditing(true);
        // Remove from the list
        setCustomSplits(customSplits.filter(s => s.id !== split.id));
        // Populate form — normalize IDs to the same type as member.id for pill matching
        setPayerId(split.payerId?.toString() || '');
        setAmount(split.amount?.toString() || '');
        // Strip the auto-prefix emoji added by Smart Inbox
        const cleanDesc = (split.description || '').replace(/^👥 Split:\s*/i, '');
        setDescription(cleanDesc);
        setSplitType(split.splitType || 'equal');
        // Normalize involvedIds to match the type of member.id (could be number or string)
        const normalizedIds = (split.involvedIds || []).map(id => {
            const asNum = Number(id);
            const matchedMember = members.find(m => m.id === asNum || m.id === id || m.id?.toString() === id?.toString());
            return matchedMember ? matchedMember.id : id;
        });
        setInvolvedIds(normalizedIds);
        setAllocations(
            split.splitType === 'exact' && split.allocations
                ? Object.fromEntries(Object.entries(split.allocations).map(([k, v]) => [k, v.toString()]))
                : {}
        );
        setAddError('');
    };

    const cancelEdit = () => {
        const snapshot = editSnapshot; // capture before any state clears
        // Reset form first
        setIsEditing(false);
        setEditSnapshot(null);
        setPayerId(''); setAmount(''); setDescription(''); setInvolvedIds([]);
        setAllocations({}); setSplitType('equal'); setAddError('');
        // Restore the original entry back to the list
        if (snapshot) {
            setCustomSplits(prev => {
                const alreadyExists = prev.some(s => s.id === snapshot.id);
                if (alreadyExists) return prev;
                return [...prev, snapshot]; // append to end, preserving original order
            });
        }
    };

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
        if (!perPersonMap[split.payerId]) perPersonMap[split.payerId] = { name: getName(split.payerId), paid: 0, share: 0 };
        perPersonMap[split.payerId].paid += split.amount;

        if (split.splitType === 'exact' && split.allocations) {
            Object.entries(split.allocations).forEach(([id, exactAmt]) => {
                if (!perPersonMap[id]) perPersonMap[id] = { name: getName(id), paid: 0, share: 0 };
                perPersonMap[id].share += exactAmt;
            });
        } else {
            const count = split.involvedIds.length;
            const perShare = split.amount / count;
            split.involvedIds.forEach(id => {
                if (!perPersonMap[id]) perPersonMap[id] = { name: getName(id), paid: 0, share: 0 };
                perPersonMap[id].share += perShare;
            });
        }
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
                            {isEditing && (
                                <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
                                    <span className="text-[11px] font-black text-indigo-600 uppercase tracking-widest flex-1">✏️ Editing entry</span>
                                    <button onClick={cancelEdit} className="text-[10px] font-black text-slate-500 hover:text-red-500 bg-white border border-slate-200 px-2 py-0.5 rounded-lg transition-colors">Cancel</button>
                                </div>
                            )}

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
                                            type="text"
                                            className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-300 text-sm font-bold text-slate-800"
                                            value={amount}
                                            onChange={e => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
                                            placeholder="0"
                                            inputMode="decimal"
                                            autoComplete="off"
                                            data-form-type="other"
                                            aria-autocomplete="none"
                                            name="fsq_zx_cs_amt"
                                            spellCheck="false"
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
                                    autoComplete="off"
                                    data-form-type="other"
                                    aria-autocomplete="none"
                                    name="fsq_zx_cs_desc"
                                    spellCheck="false"
                                />
                            </div>

                            {/* Row 3: Split Between — avatar pills */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Split Type</label>
                                    <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 shadow-inner">
                                        <button onClick={() => setSplitType('equal')} className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${splitType === 'equal' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>Equal</button>
                                        <button onClick={() => setSplitType('exact')} className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${splitType === 'exact' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}>Exact</button>
                                    </div>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 items-center bg-slate-50/50 p-3 rounded-2xl border border-slate-100 shadow-sm animate-in fade-in duration-300 mb-2">
                                    {members.map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => toggleInvolved(m.id)}
                                            className="flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full border transition-all duration-200 active:scale-95 text-xs font-bold"
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
                                                autoComplete="new-password"
                                                name="fsq_cs_ext_name"
                                                spellCheck="false"
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
                                            className="flex items-center gap-1.5 pl-2.5 pr-3.5 py-1.5 rounded-full border border-dashed border-slate-300 text-xs font-bold text-slate-400 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 transition-all font-black"
                                        >
                                            <UserPlus className="w-3.5 h-3.5" /> Guest
                                        </button>
                                    )}
                                </div>
                                
                                {splitType === 'exact' && (
                                    <div className="flex flex-col gap-2 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 shadow-sm animate-in fade-in duration-300">
                                        {(() => {
                                            const totalAllocated = Object.values(allocations).reduce((sum, val) => sum + parseFloat(val || 0), 0);
                                            const numericAmount = parseFloat(amount || 0);
                                            const remainder = numericAmount - totalAllocated;
                                            
                                            // Handle dynamically added guests and filter currently involved
                                            const allInvolved = [];
                                            involvedIds.forEach(id => {
                                                if (typeof id === 'string' && id.startsWith('EXT:')) {
                                                    allInvolved.push({ id, name: id.replace('EXT:', '') });
                                                } else {
                                                    const m = members.find(x => x.id === id);
                                                    if (m) allInvolved.push(m);
                                                }
                                            });

                                            if (allInvolved.length === 0) {
                                                return (
                                                    <div className="py-6 text-center text-slate-400 text-xs font-bold">
                                                        Select members above to allocate precise amounts.
                                                    </div>
                                                );
                                            }

                                            return (
                                                <>
                                                    <div className="flex items-center justify-between mb-1 pb-2 border-b border-slate-200 border-dashed">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                            Allocated: ₹{totalAllocated.toLocaleString('en-IN')}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            {remainder > 0.05 && (
                                                                <button
                                                                    onClick={() => {
                                                                        const emptyIds = allInvolved.filter(x => !(parseFloat(allocations[x.id] || 0) > 0)).map(x => x.id);
                                                                        if (emptyIds.length === 0) return;
                                                                        const share = remainder / emptyIds.length;
                                                                        const newAllocs = { ...allocations };
                                                                        emptyIds.forEach(id => newAllocs[id] = share.toFixed(2));
                                                                        setAllocations(newAllocs);
                                                                    }}
                                                                    className="text-[9px] font-black bg-orange-500 text-white hover:bg-orange-600 px-2 py-1 rounded shadow-sm hover:shadow-orange-200 transition-all uppercase tracking-widest active:scale-95 flex items-center gap-1"
                                                                >
                                                                    Split Rest <Check className="w-2.5 h-2.5" />
                                                                </button>
                                                            )}
                                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${Math.abs(remainder) < 0.05 ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                                                                {Math.abs(remainder) < 0.05 ? 'Perfect ✅' : `₹${remainder.toFixed(0)} left`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto no-scrollbar pt-1 pr-1">
                                                        {allInvolved.map(m => (
                                                            <div key={m.id} className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-100 hover:border-orange-200 transition-colors">
                                                                <Avatar name={m.name} size="sm" selected={parseFloat(allocations[m.id] || 0) > 0} />
                                                                <span className="text-xs font-bold text-slate-700 flex-1 truncate">{m.name}</span>
                                                                <div className="relative w-28">
                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-black">₹</span>
                                                                    <input 
                                                                        type="text"
                                                                        className="w-full pl-6 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-orange-400 focus:bg-orange-50 transition-all"
                                                                        placeholder="0"
                                                                        value={allocations[m.id] || ''}
                                                                        onChange={e => {
                                                                            const val = e.target.value.replace(/[^\d.]/g, '');
                                                                            setAllocations({...allocations, [m.id]: val});
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>

                            {/* Guidance banner (replaces raw error for remainder shortfall) */}
                            {addError && (() => {
                                const isRemainderError = addError.includes('must exactly equal');
                                const numericAmount = parseFloat(amount || 0);
                                const totalAllocated = Object.values(allocations).reduce((s, v) => s + parseFloat(v || 0), 0);
                                const remainder = numericAmount - totalAllocated;

                                if (isRemainderError) {
                                    return (
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 flex items-center gap-2">
                                            <span className="text-lg">💡</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-amber-800">₹{remainder.toFixed(0)} still unallocated</p>
                                                <p className="text-[10px] text-amber-600 font-medium">Click <strong>"Split Rest"</strong> above to divide equally, or enter amounts manually.</p>
                                            </div>
                                        </div>
                                    );
                                }
                                return (
                                    <p className="text-red-500 text-xs font-bold flex items-center gap-1.5 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
                                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {addError}
                                    </p>
                                );
                            })()}

                            {/* Add / Update button */}
                            <button
                                onClick={addSplit}
                                className="w-full bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white font-black py-3 rounded-2xl transition-all shadow-md hover:shadow-orange-200 hover:-translate-y-0.5 active:scale-[0.98] text-sm flex justify-center items-center gap-2"
                            >
                                {isEditing ? <><Check className="w-4 h-4" /> Save Changes</> : <><Plus className="w-4 h-4" /> Add Expense</>}
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
                                            const isExact = split.splitType === 'exact';
                                            const count = split.involvedIds?.length || 0;
                                            const perShare = isExact ? null : (count > 0 ? split.amount / count : 0);
                                            const namesList = (split.involvedIds || []).map(id => getName(id).replace(' (Guest)', ''));
                                            // Strip auto-prefix added by Smart Inbox
                                            const displayDesc = (split.description || '').replace(/^👥 Split:\s*/i, '');

                                            return (
                                                <div
                                                    key={split.id}
                                                    className="group relative px-4 py-3 hover:bg-orange-50/40 transition-colors border-b border-slate-50 last:border-0 cursor-pointer"
                                                    onClick={() => setTappedCardId(prev => prev === split.id ? null : split.id)}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <Avatar name={payerName} size="sm" selected />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <p className="text-sm font-black text-slate-800 truncate flex-1">
                                                                    {displayDesc || <span className="italic text-slate-400 font-normal">No description</span>}
                                                                </p>
                                                                <p className="text-sm font-black text-emerald-600 flex-shrink-0">₹{split.amount.toLocaleString('en-IN')}</p>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Paid by {payerName}</span>
                                                                <span className="text-slate-200">·</span>
                                                                <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${
                                                                    isExact ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'
                                                                }`}>
                                                                    {isExact ? '⚖️ Exact' : '÷ Equal'}
                                                                </span>
                                                                {isExact ? (
                                                                    <span className="text-[9px] font-bold text-slate-400">{count} people</span>
                                                                ) : (
                                                                    <span className="text-[9px] font-bold text-slate-400">₹{perShare?.toFixed(0)} each · {count} people</span>
                                                                )}
                                                            </div>
                                                            {/* Bottom row: pills + reveal buttons */}
                                                            <div className="flex items-center justify-between gap-2 mt-1.5">
                                                                <div className="flex items-center gap-1 flex-wrap">
                                                                    {namesList.slice(0, 5).map((name, i) => (
                                                                        <span key={i} className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{name}</span>
                                                                    ))}
                                                                    {namesList.length > 5 && (
                                                                        <span className="text-[9px] font-bold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full">+{namesList.length - 5}</span>
                                                                    )}
                                                                </div>
                                                                <div
                                                                    className={`flex gap-1 flex-shrink-0 transition-opacity duration-200 ${
                                                                        tappedCardId === split.id
                                                                            ? 'opacity-100'
                                                                            : 'opacity-0 md:group-hover:opacity-100'
                                                                    }`}
                                                                    onClick={e => e.stopPropagation()}
                                                                >
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); loadToEdit(split); setTappedCardId(null); }}
                                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] sm:text-[10px] font-black text-indigo-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-all active:scale-95 whitespace-nowrap"
                                                                    >
                                                                        <Edit3 className="w-3 h-3" /> 
                                                                        <span>EDIT</span>
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(split); setTappedCardId(null); }}
                                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] sm:text-[10px] font-black text-red-500 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-all active:scale-95 whitespace-nowrap"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" /> 
                                                                        <span>DELETE</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
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

            {/* Delete confirmation dialog */}
            <ConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => { removeSplit(deleteTarget.id); setDeleteTarget(null); }}
                type="warning"
                title="Delete this entry?"
                message={`"${(deleteTarget?.description || '').replace(/^👥 Split:\s*/i, '') || 'This expense'}" will be permanently removed from this split.`}
                confirmText="Yes, Delete"
                cancelText="Keep it"
            />
        </div>
    );
};
