import React, { useState } from 'react';
import { Split, ChevronRight, X, Check, UserPlus, AlertCircle, Plus } from 'lucide-react';

const CustomSplitManager = ({ members, customSplits, setCustomSplits }) => {
    const [payerId, setPayerId] = useState('');
    const [amount, setAmount] = useState('');
    const [involvedIds, setInvolvedIds] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [addError, setAddError] = useState('');
    const [showExtInput, setShowExtInput] = useState(false);
    const [extName, setExtName] = useState('');

    const toggleInvolved = (id) => {
        if (involvedIds.includes(id)) { setInvolvedIds(involvedIds.filter(i => i !== id)); }
        else { setInvolvedIds([...involvedIds, id]); }
    };

    // --- UPDATED: Prevent adding duplicate guests ---
    const addExternal = () => {
        const nameToCheck = extName.trim();
        if (!nameToCheck) return;

        // 1. Check if real member exists with this name (Case insensitive)
        const existingMember = members.find(m => m.name.trim().toLowerCase() === nameToCheck.toLowerCase());
        if (existingMember) {
            // If it's a real member, simply toggle them in the list if not already there
            if (!involvedIds.includes(existingMember.id)) {
                setInvolvedIds([...involvedIds, existingMember.id]);
            }
            setExtName('');
            setShowExtInput(false);
            return;
        }

        // 2. Standard Guest Add (if not a real member)
        const newId = `EXT:${nameToCheck}`;
        if (!involvedIds.includes(newId)) {
            setInvolvedIds([...involvedIds, newId]);
        }
        setExtName('');
        setShowExtInput(false);
    };
    // ------------------------------------------------

    const addSplit = () => {
        setAddError('');
        if (!payerId) { setAddError('Please select who paid.'); return; }
        if (!amount) { setAddError('Please enter an amount.'); return; }
        if (involvedIds.length < 2) { setAddError('Select at least 2 people to split the expense.'); return; }

        setCustomSplits([...customSplits, { id: Date.now(), payerId: parseInt(payerId), amount: parseFloat(amount), involvedIds }]);
        setAmount(''); setInvolvedIds([]); setPayerId('');
    };
    const removeSplit = (id) => setCustomSplits(customSplits.filter(s => s.id !== id));

    const getName = (id) => {
        if (typeof id === 'string' && id.startsWith('EXT:')) return id.replace('EXT:', '') + ' (Guest)';
        const m = members.find(m => m.id === id);
        return m ? m.name : 'Unknown';
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mb-10 transition-all duration-300 hover:shadow-2xl">
            <div
                className="p-4 bg-gradient-to-r from-orange-50 to-white border-b border-orange-100 flex justify-between items-center cursor-pointer hover:bg-orange-50/80 transition-colors active:bg-orange-100"
                onClick={() => setIsOpen(!isOpen)}
            >
                <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2"><Split className="w-5 h-5 text-orange-500" /> Custom Splits <span className="text-sm font-normal text-slate-400">(Side Expenses)</span></h2>
                <div className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}><ChevronRight className="w-5 h-5 text-slate-400" /></div>
            </div>
            {isOpen && (
                <div className="p-6 bg-slate-50/50 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            <div className="md:col-span-3"><label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Who Paid?</label><select className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-400" value={payerId} onChange={(e) => setPayerId(e.target.value)}><option value="">Select...</option>{members.map(m => (<option key={m.id} value={m.id}>{m.name || 'Unnamed'}</option>))}</select></div>
                            <div className="md:col-span-3"><label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Amount</label><div className="relative"><span className="absolute left-3 top-2.5 text-gray-400">₹</span><input type="number" className="w-full pl-7 p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-400" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" /></div></div>
                            <div className="md:col-span-6">
                                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Split Between Whom?</label>
                                <div className="flex flex-wrap gap-2 items-center">
                                    {members.map(m => (<button key={m.id} onClick={() => toggleInvolved(m.id)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all active:scale-95 ${involvedIds.includes(m.id) ? 'bg-orange-100 border-orange-300 text-orange-700 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'}`}>{m.name || 'Unnamed'}</button>))}

                                    {involvedIds.filter(id => typeof id === 'string' && id.startsWith('EXT:')).map(extId => (
                                        <button key={extId} onClick={() => toggleInvolved(extId)} className="px-3 py-1.5 text-xs font-bold rounded-lg border bg-orange-100 border-orange-300 text-orange-700 flex items-center gap-1 active:scale-95 shadow-sm">
                                            {extId.replace('EXT:', '')} <X className="w-3 h-3" />
                                        </button>
                                    ))}

                                    {showExtInput ? (
                                        <div className="flex items-center gap-1 animate-in fade-in slide-in-from-left-2">
                                            <input type="text" className="w-24 px-2 py-1 text-xs border rounded-lg focus:ring-2 ring-orange-200 outline-none" placeholder="Name..." value={extName} onChange={(e) => setExtName(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && addExternal()} />
                                            <button onClick={addExternal} className="bg-green-500 text-white p-1 rounded hover:bg-green-600 active:scale-90 transition-transform"><Check className="w-3 h-3" /></button>
                                            <button onClick={() => setShowExtInput(false)} className="bg-gray-200 text-gray-500 p-1 rounded hover:bg-gray-300 active:scale-90 transition-transform"><X className="w-3 h-3" /></button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setShowExtInput(true)} className="px-3 py-1.5 text-xs font-bold rounded-lg border border-dashed border-gray-300 text-gray-400 hover:text-orange-500 hover:border-orange-300 hover:bg-orange-50 flex items-center gap-1 transition-all active:scale-95"><UserPlus className="w-3 h-3" /> Guest</button>
                                    )}
                                </div>
                            </div>
                        </div>
                        {addError && <p className="text-red-500 text-xs mt-2 font-bold flex items-center gap-1 animate-pulse"><AlertCircle className="w-3 h-3" /> {addError}</p>}
                        <button
                            onClick={addSplit}
                            className="mt-4 w-full bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] text-sm flex justify-center items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Add Custom Split
                        </button>
                    </div>
                    {/* Compact Grid Layout for Splits */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {customSplits.map(split => {
                            const payerName = members.find(m => m.id === split.payerId)?.name || 'Unknown';
                            const namesList = split.involvedIds.map(id => getName(id).replace(' (Guest)', '')).join(', ');

                            return (
                                <div key={split.id} className="flex flex-col justify-between bg-white p-3 rounded-lg border border-slate-100 shadow-sm relative group hover:shadow-md transition-shadow">
                                    <div className="text-sm text-slate-700 mb-1">
                                        <span className="font-bold text-orange-600">{payerName}</span> paid <span className="font-bold text-slate-800">₹{split.amount}</span>
                                    </div>
                                    <div className="text-xs text-slate-400 truncate" title={namesList}>
                                        Split with: {namesList}
                                    </div>
                                    <button onClick={() => removeSplit(split.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 rounded-full"><X className="w-4 h-4" /></button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomSplitManager;
