import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    Users, Trash2, TrendingDown, TrendingUp, HelpCircle,
    Utensils, Zap, Sparkles, AlertCircle, Settings2,
    Eye, EyeOff, Merge, Edit3, Check, X
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import Modal from './Modal';

const MemberCard = ({
    member, daysInMonth, isMonthlyMode, updateMember, removeMember,
    onSmartParse, onNameSplit, isDuplicate, isInvalid, isLocked, isShimmering
}) => {
    const { settings } = useSettings();
    const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingAbsent, setIsEditingAbsent] = useState(false);
    const [isEditingExpense, setIsEditingExpense] = useState(false);
    const [expenseType, setExpenseType] = useState('variable');
    const [isCleaning, setIsCleaning] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    const nameRef = useRef(null);
    const absentRef = useRef(null);
    const expenseRef = useRef(null);

    const emoji = (e) => settings.showEmojis ? e : '';

    // Auto-focus logic
    useEffect(() => {
        if (isEditingName && nameRef.current) nameRef.current.focus();
    }, [isEditingName]);

    useEffect(() => {
        if (isEditingAbsent && absentRef.current) absentRef.current.focus();
    }, [isEditingAbsent]);

    useEffect(() => {
        if (isEditingExpense && expenseRef.current) expenseRef.current.focus();
    }, [isEditingExpense]);

    const currentInput = expenseType === 'variable' ? member.expenseInput : member.fixedExpenseInput;

    const handleAutoExtract = () => {
        if (!currentInput) {
            setIsEditingExpense(false);
            return;
        }
        const str = currentInput.toString();
        const hasLetters = /[a-zA-Z]/.test(str);
        const hasNumbers = /\d/.test(str);
        const numbers = str.match(/\b\d+(\.\d+)?(?!(st|nd|rd|th| ST| ND| RD| TH))\b/gi);

        if (numbers && (numbers.length > 1 || hasLetters)) {
            const cleanString = numbers.join(', ');
            setIsCleaning(true);
            updateMember(member.id, expenseType === 'variable' ? 'expenseInput' : 'fixedExpenseInput', cleanString);
            if (settings.vibrationEnabled && window.navigator.vibrate) window.navigator.vibrate(10);
            setTimeout(() => setIsCleaning(false), 500);
        } else if (hasLetters && !hasNumbers) {
            onSmartParse(member.id, str);
            updateMember(member.id, expenseType === 'variable' ? 'expenseInput' : 'fixedExpenseInput', '');
        }
        setIsEditingExpense(false);
    };

    const handleNameBlur = () => {
        let cleanedName = member.name
            .replace(/(\s+(and|or)\s+)|[,&+\/\s]+$/i, "")
            .trim();

        if (cleanedName) {
            cleanedName = cleanedName.split(/\s+/).map(word => {
                if (!word) return word;
                if (word === word.toUpperCase() && /[a-zA-Z]/.test(word)) return word;
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            }).join(' ');
        }

        if (cleanedName !== member.name) {
            updateMember(member.id, 'name', cleanedName);
        }
        setIsEditingName(false);
    };

    const getBreakdown = (input) => {
        if (!input) return { items: [], total: 0 };
        const matches = input.toString().match(/\b\d+(\.\d+)?(?!(st|nd|rd|th| ST| ND| RD| TH))\b/gi);
        if (!matches) return { items: [], total: 0 };
        const items = matches.map(val => parseFloat(val));
        return { items, total: items.reduce((a, b) => a + b, 0) };
    };

    const variableBreakdown = useMemo(() => getBreakdown(member.expenseInput), [member.expenseInput]);
    const fixedBreakdown = useMemo(() => getBreakdown(member.fixedExpenseInput), [member.fixedExpenseInput]);
    const currentBreakdown = expenseType === 'variable' ? variableBreakdown : fixedBreakdown;

    const removeExpenseEntry = (indexToRemove) => {
        const field = expenseType === 'variable' ? 'expenseInput' : 'fixedExpenseInput';
        const str = member[field] || '';
        const currentItems = getBreakdown(str).items;

        if (currentItems.length > indexToRemove) {
            currentItems.splice(indexToRemove, 1);
            const newValue = currentItems.length > 0 ? currentItems.join(' + ') : '';
            updateMember(member.id, field, newValue);
        }
    };

    const hasError = isDuplicate || isInvalid;
    const splitRegex = /[,&+\/\n]| and /i;
    const potentialNames = splitRegex.test(member.name)
        ? member.name.split(splitRegex).filter(n => n.trim().length > 0)
        : [];
    const renderEditorContent = () => (
        <div className="w-full">
            <div className="flex justify-between items-center mb-1.5">
                <div className="flex bg-slate-100/50 p-1 rounded-xl gap-1">
                    <button onClick={() => setExpenseType('variable')} className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 ${expenseType === 'variable' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{emoji('🍲')} Daily</button>
                    <button onClick={() => setExpenseType('fixed')} className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 ${expenseType === 'fixed' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{emoji('⚡')} Fixed</button>
                </div>
                {expenseType === 'variable' && (
                    <button
                        onClick={() => { setIsMobileModalOpen(false); onSmartParse(member.id); }}
                        className="flex items-center justify-center gap-1 bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-2 py-1.5 rounded-lg text-[9px] font-black uppercase shadow-sm hover:scale-105 transition-all w-20 flex-shrink-0"
                    >
                        <Sparkles className="w-3 h-3" /> AI ADD
                    </button>
                )}
            </div>

            <div className="flex items-stretch gap-3 w-full">
                <div className="relative group/expense flex-1 min-w-0">
                    {isEditingExpense ? (
                        <div className="flex gap-2 h-full">
                            <div className="relative flex-1">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                <input
                                    ref={expenseRef}
                                    type="text"
                                    placeholder={expenseType === 'variable' ? "50 100 200..." : "Rent, WiFi..."}
                                    value={currentInput}
                                    onChange={(e) => updateMember(member.id, expenseType === 'variable' ? 'expenseInput' : 'fixedExpenseInput', e.target.value)}
                                    onBlur={handleAutoExtract}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAutoExtract()}
                                    className={`w-full h-full pl-10 pr-4 py-3 border-2 border-indigo-200 bg-slate-50 rounded-2xl font-black text-slate-800 outline-none transition-all ${isCleaning ? 'scale-[1.02] border-emerald-400 bg-emerald-50' : ''}`}
                                />
                            </div>
                            <button onClick={handleAutoExtract} className="bg-slate-900 text-white px-4 rounded-2xl"><Check className="w-5 h-5" /></button>
                        </div>
                    ) : (
                        <div
                            onClick={() => setIsEditingExpense(true)}
                            className={`group/val relative overflow-hidden flex items-center justify-between px-5 py-3.5 h-full rounded-2xl border-2 border-dashed cursor-text transition-all ${expenseType === 'variable' ? 'bg-indigo-50/20 border-indigo-100 hover:bg-indigo-50/50 hover:border-indigo-300' : 'bg-violet-50/20 border-violet-100 hover:bg-violet-50/50 hover:border-violet-300'}`}
                        >
                            <div className="flex flex-col truncate pr-2">
                                <span className={`text-xl font-black truncate ${expenseType === 'variable' ? 'text-indigo-600' : 'text-violet-600'}`}>
                                    ₹{currentBreakdown.total.toFixed(0)}
                                </span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">
                                    {currentBreakdown.items.length} Record{currentBreakdown.items.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            {!showAdvanced && (
                                <div className="flex items-center gap-2 flex-shrink-0 animate-in fade-in duration-200">
                                    <div className="bg-white p-2 rounded-xl shadow-sm text-slate-400 opacity-0 group-hover/val:opacity-100 transition-opacity hidden sm:block">
                                        <Edit3 className="w-4 h-4" />
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowDetails(!showDetails); }}
                                        className={`p-2 rounded-xl transition-all ${showDetails ? 'bg-slate-800 text-white' : 'bg-white text-slate-400 hover:text-indigo-600'}`}
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            {showAdvanced && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] opacity-0 group-hover/val:opacity-100 transition-opacity flex items-center justify-center z-10">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowDetails(!showDetails); }}
                                        className={`p-2 rounded-xl transition-all shadow-sm ${showDetails ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'}`}
                                    >
                                        <Eye className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    {isCleaning && (
                        <div className="absolute -top-3 -right-3 animate-bounce z-10">
                            <Sparkles className="w-6 h-6 text-emerald-500" />
                        </div>
                    )}
                </div>

                {/* Expandable Manual Arrears Input */}
                {showAdvanced && (
                    <div className="flex flex-col justify-center bg-amber-50/50 p-2.5 rounded-2xl border border-amber-200/50 animate-in slide-in-from-right-2 flex-shrink-0 w-28">
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-[9px] font-black text-amber-600 uppercase tracking-widest truncate">Arrear {emoji('📉')}</label>
                            <button onClick={() => setShowAdvanced(false)} className="text-amber-400 hover:text-amber-600 p-0.5 bg-amber-100/50 rounded flex-shrink-0 transition-colors -mr-1 -mt-1"><X className="w-3 h-3" /></button>
                        </div>
                        <div className="flex items-center gap-1 w-full">
                            <span className="font-bold text-amber-800 text-sm">₹</span>
                            <input
                                type="number"
                                value={member.arrears || ''}
                                onChange={(e) => updateMember(member.id, 'arrears', e.target.value)}
                                placeholder="0"
                                className="bg-transparent border-b border-amber-200 outline-none w-full font-black text-amber-900 placeholder-amber-200 text-sm"
                                autoFocus
                            />
                        </div>
                    </div>
                )}

                {/* Vertical Action Buttons */}
                <div className="flex flex-col gap-2 flex-shrink-0 justify-between">
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={`p-2.5 rounded-xl transition-all border flex-1 flex items-center justify-center ${showAdvanced ? 'bg-amber-50 text-amber-600 border-amber-200 shadow-sm' : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100 hover:text-slate-600'}`}
                        title="Manual Arrears"
                    >
                        <TrendingUp className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => removeMember(member.id)}
                        className="p-2.5 bg-red-50 text-red-300 hover:text-red-500 hover:bg-red-100 rounded-xl transition-all flex-1 flex items-center justify-center"
                        title="Remove Member"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Detailed Breakdown Section */}
            {showDetails && (
                <div className="mt-4 pt-4 border-t-2 border-slate-50 border-dashed animate-in slide-in-from-top-2">
                    <div className="flex flex-wrap gap-2">
                        {currentBreakdown.items.length > 0 ? (
                            currentBreakdown.items.map((val, i) => (
                                <div
                                    key={i}
                                    onClick={(e) => { e.stopPropagation(); removeExpenseEntry(i); }}
                                    className="group/item relative flex items-center pr-1 bg-slate-50 hover:bg-red-50 hover:pr-7 rounded-xl transition-all border border-slate-100 hover:border-red-100 overflow-hidden cursor-pointer"
                                    title="Click to remove"
                                >
                                    <span className="px-3 py-1.5 text-xs font-black text-slate-600 group-hover/item:text-red-600 transition-colors">
                                        ₹{val}
                                    </span>
                                    <div className="absolute right-0 top-0 bottom-0 w-7 flex items-center justify-center bg-red-100 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                        <X className="w-3 h-3 text-red-600" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">No individual entries yet</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <>
            <div 
                className={`group relative bg-white/60 backdrop-blur-xl rounded-2xl p-4 lg:p-5 border border-white/40 shadow-sm transition-all duration-300 overflow-hidden ${hasError ? 'border-red-200 bg-red-50/40' : 'hover:border-indigo-200/50 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 hover:scale-[1.01]'}`}
                onClick={() => {
                    if (!isLocked && window.innerWidth < 1024) setIsMobileModalOpen(true);
                }}
            >
                {/* Shimmer Overlay for AI Calculation */}
                {isShimmering && (
                    <div className="absolute inset-0 z-50 bg-gradient-to-r from-transparent via-white/80 to-transparent -translate-x-[150%] animate-[shimmer_0.8s_ease-in-out_infinite] pointer-events-none mix-blend-overlay blur-[1px]" />
                )}

                <div className="flex flex-col w-full relative z-10">
                    {/* Member Identity Section (Always Visible) */}
                    <div className="w-full flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`w-10 h-10 lg:w-14 lg:h-14 rounded-[14px] lg:rounded-[18px] flex items-center justify-center font-black text-sm lg:text-xl transition-all duration-300 ${hasError ? 'bg-red-100 text-red-600' : 'bg-gradient-to-br from-indigo-50 to-violet-100 text-indigo-400 group-hover:scale-110 group-hover:from-indigo-500 group-hover:to-violet-500 group-hover:text-white shadow-inner'}`}>
                                {member.name.charAt(0).toUpperCase() || emoji('👤')}
                            </div>
                            <div className="flex-1 min-w-0">
                                {isEditingName ? (
                                    <input
                                        ref={nameRef}
                                        type="text"
                                        value={member.name}
                                        onChange={(e) => updateMember(member.id, 'name', e.target.value)}
                                        onBlur={handleNameBlur}
                                        onKeyDown={(e) => e.key === 'Enter' && handleNameBlur()}
                                        className="w-full bg-slate-100/50 border border-indigo-200/50 rounded-xl px-3 py-1.5 font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                                    />
                                ) : (
                                    <div className={`flex items-center gap-2 truncate ${isLocked ? 'cursor-default' : ''}`}>
                                        <h3
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // On desktop: clicking name opens inline edit
                                                if (!isLocked && window.innerWidth >= 1024) setIsEditingName(true);
                                                // On mobile: do nothing here — card onClick handles popup
                                            }}
                                            className={`text-base font-black tracking-tight truncate transition-colors ${hasError ? 'text-red-600' : 'text-slate-700'} ${!isLocked ? 'lg:cursor-text lg:hover:text-indigo-600' : 'cursor-default'}`}
                                        >
                                            {member.name || 'Anonymous Member'}
                                        </h3>
                                        {!isLocked && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsEditingName(true);
                                                }}
                                                className="p-0.5 rounded-md flex-shrink-0 text-indigo-300 hover:text-indigo-500 hover:bg-indigo-50 transition-all active:scale-90"
                                                title="Edit name"
                                            >
                                                <Edit3 className="w-3.5 h-3.5 drop-shadow-sm" />
                                            </button>
                                        )}
                                    </div>
                                )}
                                <p className="text-[10px] font-bold text-slate-400 truncate tracking-wide mt-0.5">
                                    ₹{(variableBreakdown.total + fixedBreakdown.total).toFixed(0)} total spent
                                </p>

                                {(!isLocked || variableBreakdown.total > 0 || fixedBreakdown.total > 0) && (
                                    <div className="h-1 w-[85%] bg-slate-200/50 rounded-full mt-1.5 overflow-hidden flex gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                        <div
                                            className="h-full bg-indigo-400 transition-all duration-[1500ms] ease-out rounded-full shadow-[0_0_8px_rgba(129,140,248,0.5)]"
                                            style={{ width: `${Math.min(Math.max((variableBreakdown.total / 1500) * 15, variableBreakdown.total > 0 ? 5 : 0), 80)}%` }}
                                        />
                                        <div
                                            className="h-full bg-violet-400 transition-all duration-[1500ms] ease-out rounded-full shadow-[0_0_8px_rgba(167,139,250,0.5)]"
                                            style={{ width: `${Math.min(Math.max((fixedBreakdown.total / 1500) * 15, fixedBreakdown.total > 0 ? 5 : 0), 80)}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {isMonthlyMode && (
                            <div className="flex items-center gap-2 flex-shrink-0 translate-y-[-2px]">
                                {isEditingAbsent && !isLocked ? (
                                    <input
                                        ref={absentRef}
                                        type="number"
                                        min="0"
                                        max={daysInMonth}
                                        value={member.daysAbsent}
                                        onChange={(e) => updateMember(member.id, 'daysAbsent', e.target.value)}
                                        onBlur={() => setIsEditingAbsent(false)}
                                        onKeyDown={(e) => e.key === 'Enter' && setIsEditingAbsent(false)}
                                        className="w-16 bg-slate-50 border-2 border-indigo-200 rounded-lg px-2 py-1 text-xs font-black text-slate-800 text-center outline-none"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <div
                                        onClick={(e) => { e.stopPropagation(); !isLocked && setIsEditingAbsent(true); }}
                                        className={`bg-slate-50 px-3 py-2 rounded-2xl transition-colors flex flex-col items-center justify-center min-w-[70px] ${isLocked ? 'cursor-default' : 'hover:bg-emerald-50 cursor-pointer group/absent'}`}
                                    >
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Absent</span>
                                        <span className={`text-sm font-black text-slate-700 leading-none ${!isLocked && 'group-hover/absent:text-emerald-600'}`}>
                                            {member.daysAbsent || 0} <span className="text-[10px] text-slate-400">/ {daysInMonth}</span>
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Desktop Inline Edit Area */}
                    <div className={`hidden lg:flex w-full flex-col gap-4 origin-top transition-all duration-300 max-h-0 opacity-0 overflow-hidden mt-0 ${!isLocked ? 'lg:group-hover:max-h-[800px] lg:group-hover:opacity-100 lg:group-hover:overflow-visible lg:group-focus-within:max-h-[800px] lg:group-focus-within:opacity-100 lg:group-focus-within:overflow-visible lg:group-hover:mt-4 lg:group-focus-within:mt-4' : ''}`}>
                        {renderEditorContent()}
                    </div>
                </div>
            </div>

            {/* Mobile Popup Edit Area */}
            <Modal isOpen={isMobileModalOpen} onClose={() => setIsMobileModalOpen(false)} title={`Edit ${member.name || 'Member'}`}>
                {renderEditorContent()}
            </Modal>
        </>
    );
};

export default MemberCard;
