import React from 'react';
import { Check, Plus, Edit3 } from 'lucide-react';
import MemberCard from './MemberCard';
import { CustomSplitSummaryCard } from './CustomSplitManager';

const MembersGrid = ({
    members, isModifying, setIsModifying, results, setResults, isSettled,
    daysInMonth, isMonthlyMode,
    updateMember, removeMember, openSmartAddModal, handleNameSplit,
    invalidMemberIds, isShimmering, addMember,
    customSplits, setIsCustomSplitModalOpen
}) => {
    return (
        <>
            <div className="flex items-center justify-between mb-[-10px]">
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Active Members</h2>
                {!isModifying && results && (
                    <div className="bg-emerald-100/50 backdrop-blur-md text-emerald-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200/50 flex items-center gap-2 shadow-sm">
                        <Check className="w-3.5 h-3.5" /> Locked
                    </div>
                )}
            </div>

            {/* Members Grid Bento */}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 relative transition-all duration-500 ${!isModifying && results ? 'opacity-80' : ''}`}>
                {members.filter(m => m.isActive !== false).map(m => (
                    <MemberCard
                        key={m.id}
                        member={m}
                        daysInMonth={daysInMonth}
                        isMonthlyMode={isMonthlyMode}
                        updateMember={updateMember}
                        removeMember={removeMember}
                        onSmartParse={(id, text) => openSmartAddModal(id, text)}
                        onNameSplit={handleNameSplit}
                        isDuplicate={members.filter(mem => mem.name.trim().toLowerCase() === m.name.trim().toLowerCase() && mem.name.trim() !== '').length > 1}
                        isInvalid={invalidMemberIds.includes(m.id)}
                        isLocked={(!isModifying && !!results) || isSettled}
                        isShimmering={isShimmering}
                    />
                ))}

                {/* Add Member Bento */}
                {!isSettled && (isModifying || !results) && (
                    <button
                        onClick={addMember}
                        className="bg-white/40 backdrop-blur-md rounded-2xl border-2 border-dashed border-white/80 p-6 flex flex-col items-center justify-center gap-3 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-white/80 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all group animate-in zoom-in-95 min-h-[140px]"
                    >
                        <div className="bg-white shadow-sm p-4 rounded-full group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 group-hover:scale-110">
                            <Plus className="w-5 h-5" />
                        </div>
                        <span className="font-black text-[11px] uppercase tracking-[0.2em]">Add Member</span>
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
