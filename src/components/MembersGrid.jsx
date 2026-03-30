import React from 'react';
import { Check, Plus, Edit3 } from 'lucide-react';
import MemberCard from './MemberCard';
import { CustomSplitSummaryCard } from './CustomSplitManager';

const MembersGrid = ({
    members, isModifying, setIsModifying, results, setResults, isSettled,
    daysInMonth, isMonthlyMode, setIsMonthlyMode, updateDays,
    updateMember, removeMember, restoreMember, openSmartAddModal, handleNameSplit,
    invalidMemberIds, isShimmering, addMember,
    customSplits, setIsCustomSplitModalOpen
}) => {
    return (
        <>
            {/* Header row: Active Members + inline toggle on mobile */}
            <div className="flex items-center justify-between mb-[-10px]">
                <h2 className="text-base md:text-2xl font-black text-slate-800 uppercase tracking-tight">Active Members</h2>
                <div className="flex items-center gap-2">
                    {/* Mobile-only inline mode toggle */}
                    {(!results || isModifying) && (
                        <div className="flex md:hidden items-center bg-white/70 backdrop-blur p-0.5 rounded-xl border border-white gap-0.5 shadow-sm">
                            <button
                                onClick={() => setIsMonthlyMode(false)}
                                className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${!isMonthlyMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                            >Normal</button>
                            <button
                                onClick={() => setIsMonthlyMode(true)}
                                className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${isMonthlyMode ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                            >Monthly</button>
                            {isMonthlyMode && (
                                <input
                                    type="number"
                                    value={daysInMonth}
                                    onChange={e => updateDays(e.target.value)}
                                    className="w-8 text-[9px] font-black text-slate-700 text-center bg-transparent outline-none"
                                />
                            )}
                        </div>
                    )}
                    {!isModifying && results && (
                        <div className="bg-emerald-100/50 backdrop-blur-md text-emerald-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200/50 flex items-center gap-2 shadow-sm">
                            <Check className="w-3.5 h-3.5" /> Locked
                        </div>
                    )}
                </div>
            </div>

            {/* Members Grid Bento */}
            <div className={`grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-6 relative transition-all duration-500 ${!isModifying && results ? 'opacity-80' : ''}`}>
                {members.filter(m => m.isActive !== false).map(m => (
                    <MemberCard
                        key={m.id}
                        member={m}
                        daysInMonth={daysInMonth}
                        isMonthlyMode={isMonthlyMode}
                        updateDays={updateDays}
                        updateMember={updateMember}
                        removeMember={removeMember}
                        onSmartParse={(id, text) => openSmartAddModal(id, text)}
                        onNameSplit={handleNameSplit}
                        isDuplicate={members.filter(mem => mem.isActive !== false && mem.name.trim().toLowerCase() === m.name.trim().toLowerCase() && mem.name.trim() !== '').length > 1}
                        isInvalid={invalidMemberIds.includes(m.id)}
                        isLocked={(!isModifying && !!results) || isSettled}
                        isShimmering={isShimmering}
                    />
                ))}

                {/* Inactive Members (Ghost Cards to Reactivate) */}
                {!isSettled && (isModifying || !results) && members.filter(m => m.isActive === false && m.name.trim() !== '').map(m => (
                    <button
                        key={m.id}
                        onClick={() => restoreMember(m.id)}
                        className="group relative bg-slate-50/40 backdrop-blur-xl rounded-2xl p-4 lg:p-5 border-2 border-dashed border-slate-200 shadow-sm transition-all duration-300 overflow-hidden hover:border-indigo-300 hover:bg-white/80 hover:shadow-xl hover:shadow-indigo-500/5 hover:scale-[1.01] flex items-center gap-3 animate-in zoom-in-95 text-left"
                        title="Click to restore this inactive member"
                    >
                        <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-[14px] lg:rounded-[18px] bg-slate-200/50 flex items-center justify-center font-black text-sm lg:text-xl text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all duration-300 shadow-inner flex-shrink-0">
                            {m.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                            <h3 className="text-base font-black tracking-tight truncate text-slate-600 group-hover:text-indigo-700 transition-colors">
                                {m.name}
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 truncate tracking-wide mt-0.5">
                                Tap to restore (₹{parseFloat(m.arrears || 0).toFixed(0)} arrears)
                            </p>
                        </div>
                        <div className="bg-white shadow-sm p-2 lg:p-2.5 rounded-xl text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 scale-90 group-hover:scale-100 flex-shrink-0">
                            <Plus className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                        </div>
                    </button>
                ))}

                {/* Add Member Button (Compact) */}
                {!isSettled && (isModifying || !results) && (
                    <button
                        onClick={addMember}
                        className="bg-white/40 backdrop-blur-md rounded-2xl border-2 border-dashed border-white/80 p-4 lg:p-5 flex items-center justify-center gap-3 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-white/80 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all group animate-in zoom-in-95 h-full min-h-[72px] lg:min-h-[96px]"
                    >
                        <div className="bg-white shadow-sm p-2.5 rounded-full group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 group-hover:scale-110 flex-shrink-0">
                            <Plus className="w-5 h-5" />
                        </div>
                        <span className="font-black text-[11px] lg:text-xs uppercase tracking-[0.2em]">Add Member</span>
                    </button>
                )}

                {/* Custom Splits Dashboard Widget */}
                <div className={`w-full transition-all duration-500 ${isSettled || (!isModifying && results) ? 'pointer-events-none opacity-80' : ''}`}>
                    <CustomSplitSummaryCard
                        customSplits={customSplits}
                        members={members}
                        onClickManage={() => setIsCustomSplitModalOpen(true)}
                    />
                </div>

                {/* Hover Overlay — Modify Split */}
                {!isModifying && results && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 hover:opacity-100 hover:backdrop-blur-sm transition-all duration-500 bg-slate-900/5 rounded-3xl">
                        <button
                            onClick={() => {
                                if (isSettled) setResults(null);
                                else setIsModifying(true);
                            }}
                            className="bg-white/90 backdrop-blur-xl text-indigo-600 px-8 py-4 rounded-[2rem] font-black uppercase tracking-[0.1em] text-sm shadow-2xl hover:bg-indigo-600 hover:text-white active:scale-95 transition-all flex items-center gap-3 border border-white"
                        >
                            <Edit3 className="w-5 h-5" /> Modify Split
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default MembersGrid;
