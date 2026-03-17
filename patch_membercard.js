const fs = require('fs');

const code = fs.readFileSync('src/components/MemberCard.jsx', 'utf8');

// Find everything before the return statement to keep the logic intact
const returnIndex = code.indexOf('    return (');
const logicCode = code.substring(0, returnIndex);

// Re-write the entire JSX payload cleanly
const newJsx = `    return (
        <div className={\`group relative bg-white/60 backdrop-blur-xl rounded-2xl p-4 lg:p-5 border border-white/40 shadow-sm transition-all duration-300 overflow-hidden \${hasError ? 'border-red-200 bg-red-50/40' : 'hover:border-indigo-200/50 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 hover:scale-[1.01]'}\`}>
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">

                {/* Member Identity Section (Always Visible) */}
                <div className="flex-1 w-full min-w-[180px]">
                    <div className="flex items-center gap-3">
                        <div className={\`w-10 h-10 rounded-[14px] flex items-center justify-center font-black text-sm transition-transform duration-300 \${hasError ? 'bg-red-100 text-red-600' : 'bg-gradient-to-br from-indigo-50 to-violet-100 text-indigo-400 group-hover:scale-110 group-hover:from-indigo-500 group-hover:to-violet-500 group-hover:text-white shadow-inner'}\`}>
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
                                <div
                                    onClick={() => setIsEditingName(true)}
                                    className="flex items-center gap-2 cursor-text group/name truncate"
                                >
                                    <h3 className={\`text-base font-black tracking-tight truncate transition-colors \${hasError ? 'text-red-600' : 'text-slate-700 group-hover/name:text-indigo-600'}\`}>
                                        {member.name || 'Anonymous Member'}
                                    </h3>
                                    <Edit3 className="w-3.5 h-3.5 text-indigo-300 drop-shadow-sm flex-shrink-0" />
                                </div>
                            )}
                            <p className="text-[10px] font-bold text-slate-400 truncate tracking-wide mt-0.5">
                                ₹{currentBreakdown.total.toFixed(0)} spent out of pocket
                            </p>
                        </div>
                    </div>
                    {showSplitOption && (
                        <button
                            onClick={() => onNameSplit(member.id, member.name)}
                            className="w-full mt-2 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase py-2 rounded-xl border border-emerald-100 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                            <Merge className="w-3 h-3" /> Separate Members?
                        </button>
                    )}
                </div>

                {/* Collapsible Edit Area (Expanded on Hover) */}
                <div className="w-full lg:w-auto flex flex-col lg:flex-row gap-4 lg:items-center origin-left transition-all duration-300 max-h-0 opacity-0 group-hover:max-h-[500px] group-hover:opacity-100 lg:max-h-full lg:opacity-100 group-focus-within:max-h-[500px] group-focus-within:opacity-100">
                    
                    {/* Absence Section (Hidden in Normal Mode) */}
                    <div className="w-full lg:w-32 flex-shrink-0">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Absent</label>
                        {isEditingAbsent ? (
                            <div className="flex items-center gap-2">
                                <input
                                    ref={absentRef}
                                    type="number"
                                    min="0"
                                    max={daysInMonth}
                                    value={member.daysAbsent}
                                    onChange={(e) => updateMember(member.id, 'daysAbsent', e.target.value)}
                                    onBlur={() => setIsEditingAbsent(false)}
                                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingAbsent(false)}
                                    className="w-full bg-slate-50 border-2 border-indigo-200 rounded-xl px-3 py-2 font-black text-slate-800 text-center outline-none"
                                />
                            </div>
                        ) : (
                            <div
                                onClick={() => setIsEditingAbsent(true)}
                                className="bg-slate-50 hover:bg-indigo-50 px-4 py-2.5 rounded-2xl cursor-pointer transition-colors group/absent text-center"
                            >
                                <span className="text-sm font-black text-slate-700 group-hover/absent:text-indigo-600">
                                    {(parseInt(daysInMonth) || 30) - (parseInt(member.daysAbsent) || 0)} <span className="text-[10px] text-slate-400">/ {daysInMonth} Days</span>
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Expenses Section */}
                    <div className="flex-1 w-full min-w-[240px]">
                        <div className="flex justify-between items-center mb-1.5">
                            <div className="flex bg-slate-100/50 p-1 rounded-xl gap-1">
                                <button onClick={() => setExpenseType('variable')} className={\`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 \${expenseType === 'variable' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}\`}>{emoji('🍲')} Daily</button>
                                <button onClick={() => setExpenseType('fixed')} className={\`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 \${expenseType === 'fixed' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}\`}>{emoji('⚡')} Fixed</button>
                            </div>
                            {expenseType === 'variable' && (
                                <button
                                    onClick={() => onSmartParse(member.id)}
                                    className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-indigo-100 hover:scale-105 transition-all"
                                >
                                    <Sparkles className="w-3 h-3" /> AI Add
                                </button>
                            )}
                        </div>

                        <div className="relative group/expense">
                            {isEditingExpense ? (
                                <div className="flex gap-2">
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
                                            className={\`w-full pl-10 pr-4 py-3 border-2 border-indigo-200 bg-slate-50 rounded-2xl font-black text-slate-800 outline-none transition-all \${isCleaning ? 'scale-[1.02] border-emerald-400 bg-emerald-50' : ''}\`}
                                        />
                                    </div>
                                    <button onClick={handleAutoExtract} className="bg-slate-900 text-white px-4 rounded-2xl"><Check className="w-5 h-5" /></button>
                                </div>
                            ) : (
                                <div
                                    onClick={() => setIsEditingExpense(true)}
                                    className={\`group/val flex items-center justify-between px-5 py-3.5 rounded-2xl border-2 border-dashed cursor-text transition-all \${expenseType === 'variable' ? 'bg-indigo-50/20 border-indigo-100 hover:bg-indigo-50/50 hover:border-indigo-300' : 'bg-violet-50/20 border-violet-100 hover:bg-violet-50/50 hover:border-violet-300'}\`}
                                >
                                    <div className="flex flex-col">
                                        <span className={\`text-xl font-black \${expenseType === 'variable' ? 'text-indigo-600' : 'text-violet-600'}\`}>
                                            ₹{currentBreakdown.total.toFixed(0)}
                                        </span>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            {currentBreakdown.items.length} Entries recorded
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-2 rounded-xl shadow-sm text-slate-400 opacity-0 group-hover/val:opacity-100 transition-opacity">
                                            <Edit3 className="w-4 h-4" />
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowDetails(!showDetails); }}
                                            className={\`p-2 rounded-xl transition-all \${showDetails ? 'bg-slate-800 text-white' : 'bg-white text-slate-400 hover:text-indigo-600'}\`}
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                            {isCleaning && (
                                <div className="absolute -top-3 -right-3 animate-bounce">
                                    <Sparkles className="w-6 h-6 text-emerald-500" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions Section */}
                    <div className="flex gap-2 self-start lg:self-center mt-4 lg:mt-0">
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className={\`p-2.5 rounded-[14px] transition-all border \${showAdvanced ? 'bg-amber-50 text-amber-600 border-amber-200 shadow-sm' : 'bg-slate-50/50 text-slate-400 border-transparent hover:bg-slate-100 hover:text-slate-600'}\`}
                            title="Manual Arrears"
                        >
                            <TrendingUp className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => removeMember(member.id)}
                            className="p-3 bg-red-50 text-red-300 hover:text-red-500 hover:bg-red-100 rounded-2xl transition-all"
                            title="Remove Member"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Advanced Arrears Section */}
            {showAdvanced && (
                <div className="mt-6 pt-6 border-t-2 border-slate-50 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-4 bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
                        <div className="bg-amber-100 text-amber-600 p-3 rounded-xl">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-1">Carry Forward Arrears {emoji('📉')}</label>
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-amber-800">₹</span>
                                <input
                                    type="number"
                                    value={member.arrears || ''}
                                    onChange={(e) => updateMember(member.id, 'arrears', e.target.value)}
                                    placeholder="0.00"
                                    className="bg-transparent border-b-2 border-amber-200 outline-none w-32 font-black text-amber-900 placeholder-amber-200"
                                />
                                <p className="text-[10px] text-amber-600 italic">+ for credit, - for debt</p>
                            </div>
                        </div>
                        <button onClick={() => setShowAdvanced(false)} className="text-amber-400 p-2"><X className="w-4 h-4" /></button>
                    </div>
                </div>
            )}

            {/* Detailed Breakdown Section */}
            {showDetails && (
                <div className="mt-4 pt-4 border-t-2 border-slate-50 border-dashed animate-in slide-in-from-top-2">
                    <div className="flex flex-wrap gap-2">
                        {currentBreakdown.items.length > 0 ? (
                            currentBreakdown.items.map((val, i) => (
                                <span key={i} className="px-3 py-1.5 bg-slate-50 rounded-xl text-xs font-black text-slate-600 border border-slate-100">
                                    ₹{val}
                                </span>
                            ))
                        ) : (
                            <span className="text-xs text-slate-300 italic font-medium">No individual entries yet...</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MemberCard;
`;

fs.writeFileSync('src/components/MemberCard.jsx', logicCode + newJsx);
console.log('MemberCard.jsx patched with valid JSX structure.');
