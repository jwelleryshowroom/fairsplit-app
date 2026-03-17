import React, { useState, useMemo } from 'react';
import { Users, Trash2, HelpCircle, Utensils, Zap, Sparkles, Eye, EyeOff, AlertCircle, Merge } from 'lucide-react';

const MemberCard = ({ member, daysInMonth, updateMember, removeMember, onSmartParse, onNameSplit, isDuplicate, isInvalid }) => {
    const [showDetails, setShowDetails] = useState(false);
    const [expenseType, setExpenseType] = useState('variable');
    const [isCleaning, setIsCleaning] = useState(false); // NEW: Animation state

    const currentInput = expenseType === 'variable' ? member.expenseInput : member.fixedExpenseInput;

    const handleAutoExtract = () => {
        if (!currentInput) return;
        const str = currentInput.toString();

        const hasLetters = /[a-zA-Z]/.test(str);
        const hasNumbers = /\d/.test(str);

        // Case 1: Mixed (e.g. "Lunch 200") -> Clean it up here
        if (hasLetters && hasNumbers) {
            const numbers = str.match(/(\d+(\.\d+)?)/g);
            if (numbers && numbers.length > 0) {
                const cleanString = numbers.join(', ');
                setIsCleaning(true);
                updateMember(member.id, expenseType === 'variable' ? 'expenseInput' : 'fixedExpenseInput', cleanString);
                setTimeout(() => setIsCleaning(false), 500);
            }
        }
        // Case 2: Letters ONLY (e.g. "two hundred") -> Handoff to AI
        else if (hasLetters && !hasNumbers) {
            // Pass the text to the parent AI handler
            onSmartParse(member.id, str);
            // Clear the field locally so it doesn't stay 'dirty'
            updateMember(member.id, expenseType === 'variable' ? 'expenseInput' : 'fixedExpenseInput', '');
        }
    };

    // --- 2. NAME CLEANUP (Removes trailing commas/spaces) ---
    const handleNameBlur = () => {
        if (!member.name) return;

        // Regex: Replaces trailing commas, &, +, /, "and", and spaces with nothing
        // Example: "Ankit, " -> "Ankit"
        const cleanedName = member.name
            .replace(/(\s+(and|or)\s+)|[,&+\/\s]+$/i, "")
            .trim();

        if (cleanedName !== member.name) {
            updateMember(member.id, 'name', cleanedName);
        }
    };

    const getBreakdown = (input) => {
        if (!input) return { items: [], total: 0 };
        const items = input.toString().split(',').map(s => {
            const val = parseFloat(s.trim());
            return isNaN(val) ? null : val;
        }).filter(v => v !== null);
        return { items, total: items.reduce((a, b) => a + b, 0) };
    };

    const variableBreakdown = useMemo(() => getBreakdown(member.expenseInput), [member.expenseInput]);
    const fixedBreakdown = useMemo(() => getBreakdown(member.fixedExpenseInput), [member.fixedExpenseInput]);
    const currentBreakdown = expenseType === 'variable' ? variableBreakdown : fixedBreakdown;

    const hasError = isDuplicate || isInvalid;
    const errorMessage = isDuplicate ? "Name already exists" : (isInvalid ? "Name is required" : "");
    // NEW (Advanced Detection)
    // Checks for comma, &, +, /, newline, or " and "
    const splitRegex = /[,&+\/\n]| and /i;
    const potentialNames = splitRegex.test(member.name)
        ? member.name.split(splitRegex).filter(n => n.trim().length > 0)
        : [];
    const showSplitOption = potentialNames.length > 1;

    return (
        <div className={`group relative bg-white rounded-2xl p-5 border ${hasError ? 'border-red-300 shadow-red-100 bg-red-50/30' : 'border-gray-100'} shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all duration-300`}>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                {/* Name Input */}
                <div className="flex-1 w-full min-w-[150px]">
                    <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${hasError ? 'text-red-500' : 'text-gray-400'}`}>Name</label>
                    <div className="relative group/input">
                        <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${hasError ? 'text-red-400' : 'group-focus-within/input:text-indigo-500'}`}><Users className={`h-4 w-4 ${hasError ? 'text-red-400' : 'text-gray-300'}`} /></div>
                        <input
                            type="text"
                            placeholder="e.g. Ankit"
                            value={member.name}
                            onChange={(e) => updateMember(member.id, 'name', e.target.value)}
                            onBlur={handleNameBlur}
                            className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border ${hasError ? 'border-red-500 focus:ring-red-200 bg-white' : 'border-gray-200 focus:ring-indigo-500'} rounded-xl focus:bg-white focus:ring-2 focus:border-transparent outline-none transition-all font-medium text-gray-700 placeholder-gray-400`}
                        />
                        {/* NEW: MAGIC SPLIT BUTTON */}
                        {showSplitOption && (
                            <button
                                onClick={() => onNameSplit(member.id, member.name)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-md animate-in fade-in zoom-in duration-200 flex items-center gap-1"
                            >
                                <Merge className="w-3 h-3 rotate-90" /> Separate?
                            </button>
                        )}
                    </div>
                    {hasError && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 flex items-center gap-1 animate-in slide-in-from-top-1"><AlertCircle className="w-3 h-3" /> {errorMessage}</p>}
                </div>

                {/* Absent Days */}
                <div className="w-full md:w-24">
                    <label className="text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider flex items-center gap-1 group/label cursor-help">
                        Absent
                        <div className="relative">
                            <HelpCircle className="w-3 h-3 text-gray-300 group-hover/label:text-indigo-400 transition-colors" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-[10px] rounded-lg opacity-0 group-hover/label:opacity-100 pointer-events-none transition-opacity z-50 normal-case font-normal text-center shadow-lg">
                                Enter days this person was away.
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                            </div>
                        </div>
                    </label>
                    <input type="number" min="0" max={parseInt(daysInMonth) || 30} value={member.daysAbsent} onChange={(e) => updateMember(member.id, 'daysAbsent', e.target.value)} className="w-full px-2 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium text-center text-gray-700" />
                </div>

                {/* Expenses Section */}
                <div className="flex-1 w-full min-w-[280px]">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                            <button onClick={() => setExpenseType('variable')} className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all flex items-center gap-1 active:scale-95 ${expenseType === 'variable' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/50'}`}><Utensils className="w-3 h-3" /> Daily</button>
                            <button onClick={() => setExpenseType('fixed')} className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all flex items-center gap-1 active:scale-95 ${expenseType === 'fixed' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/50'}`}><Zap className="w-3 h-3" /> Fixed Bills</button>
                        </div>

                        {/* UPDATED: AI ADD BUTTON WITH TOOLTIP */}
                        {expenseType === 'variable' && (
                            <div className="relative group/tooltip">
                                <button onClick={() => onSmartParse(member.id)} className="group/ai relative overflow-hidden px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-100 to-fuchsia-100 text-violet-700 text-[10px] font-bold uppercase tracking-wide shadow-sm hover:shadow-md hover:from-violet-200 hover:to-fuchsia-200 active:scale-95 transition-all duration-200 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-fuchsia-600 animate-pulse" />
                                    <span className="relative z-10">AI Add</span>
                                </button>
                                {/* Tooltip Element */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-slate-800 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none text-center shadow-lg z-50">
                                    Paste text like "Lunch 200, Tea 50"
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <div className="relative w-full group-focus-within:z-10">
                            <span className="absolute left-3 top-2.5 text-gray-400 font-serif">₹</span>

                            {/* UPDATED: INPUT WITH AUTO-EXTRACT & ANIMATION */}
                            <input
                                type="text"
                                placeholder={expenseType === 'variable' ? "Food, Groceries..." : "Rent, WiFi..."}
                                value={currentInput}
                                onChange={(e) => updateMember(member.id, expenseType === 'variable' ? 'expenseInput' : 'fixedExpenseInput', e.target.value)}
                                onBlur={handleAutoExtract}
                                className={`
                      w-full pl-8 pr-4 py-2.5 border rounded-xl outline-none transition-all duration-300 font-mono text-gray-700
                      ${expenseType === 'variable' ? 'bg-indigo-50/30 border-indigo-100 focus:bg-white focus:ring-indigo-500' : 'bg-pink-50/30 border-pink-100 focus:bg-white focus:ring-pink-500'}
                      ${isCleaning ? 'ring-2 ring-yellow-400 bg-yellow-50 scale-[1.02]' : 'ring-0'}
                  `}
                            />
                            {/* Sparkle Overlay (Visible during clean animation) */}
                            <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-yellow-500 transition-all duration-500 pointer-events-none ${isCleaning ? 'opacity-100 scale-125' : 'opacity-0 scale-0'}`}>
                                <Sparkles className="w-5 h-5 animate-spin" />
                            </div>
                        </div>

                        <button onClick={() => setShowDetails(!showDetails)} className={`p-2.5 rounded-xl border transition-all active:scale-95 ${showDetails ? 'bg-gray-800 border-gray-800 text-white shadow-md' : 'bg-white border-gray-200 text-gray-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50'}`}>
                            {showDetails ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
                <button onClick={() => removeMember(member.id)} className="hidden md:flex p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-95 self-end">
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>

            {showDetails && (
                <div className="mt-4 pt-4 border-t border-dashed border-gray-200 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-500 uppercase">{expenseType === 'variable' ? 'Daily Expenses' : 'Fixed Bills'} Breakdown</div>
                    <div className="flex flex-wrap gap-2">
                        {currentBreakdown.items.length > 0 ? (currentBreakdown.items.map((val, i) => (<span key={i} className="px-2 py-1 bg-white shadow-sm rounded-md text-xs font-mono text-gray-700 border border-gray-100">₹{val}</span>))) : <span className="text-xs text-gray-400 italic">No entries</span>}
                        <span className="ml-auto text-sm font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded-md">Total: ₹{currentBreakdown.total}</span>
                    </div>
                </div>
            )}
            <button onClick={() => removeMember(member.id)} className="md:hidden w-full mt-4 flex items-center justify-center gap-2 p-3 text-red-500 bg-red-50 active:bg-red-100 rounded-xl text-sm font-medium transition-colors active:scale-95"><Trash2 className="w-4 h-4" /> Remove Member</button>
        </div>
    );
};

export default MemberCard;
