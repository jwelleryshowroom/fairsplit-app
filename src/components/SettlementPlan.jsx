import React from 'react';
import { Check, Sparkles, Zap, Loader2 } from 'lucide-react';

const SettlementPlan = ({
    results,
    isSettled,
    handleUnifiedSettle,
    handleDraftMessage,
    handleCloseMonth
}) => {
    if (!results) return null;

    return (
        <div className="bg-gradient-to-b from-emerald-50 to-white rounded-2xl sm:rounded-3xl border border-emerald-100 p-4 sm:p-8 shadow-lg">
            <h3 className="text-lg sm:text-2xl font-extrabold text-emerald-900 mb-4 sm:mb-6 flex items-center gap-2">
                <Check className="w-5 h-5 sm:w-6 sm:h-6" /> 
                <span className="truncate">Settlement Plan 💸</span>
            </h3>

            {results.transactions.length === 0 ? (
                <div className="text-center font-bold text-emerald-800 py-4 italic text-sm">🎉 All Settled!</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                    {results.transactions.map((t, idx) => (
                        <div key={idx} className="relative group overflow-hidden bg-white p-3 rounded-xl sm:rounded-2xl shadow-sm border border-emerald-100 transition-all hover:shadow-md hover:border-emerald-200">
                            <div className="flex items-center justify-between gap-2 sm:gap-4 transition-all duration-300 group-hover:opacity-20 group-hover:blur-[1px]">
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 font-black text-[10px] sm:text-sm flex-shrink-0 border border-slate-100 shadow-inner uppercase">
                                        {t.from.charAt(0)}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-slate-800 truncate text-[11px] sm:text-sm">{t.from}</span>
                                        <div className="flex items-center gap-1 min-w-0">
                                            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">to</span>
                                            <span className="text-[9px] sm:text-[11px] font-bold text-slate-400 truncate italic">{t.to}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="font-mono font-black text-emerald-600 bg-emerald-50/50 px-2 py-1 rounded-lg border border-emerald-100 text-[11px] sm:text-sm flex-shrink-0">
                                    ₹{t.amount}
                                </div>
                            </div>

                            {/* HOVER OVERLAY: Settle Action */}
                            <div className="absolute inset-0 flex items-center justify-center translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out bg-emerald-600/5 backdrop-blur-[2px]">
                                <button
                                    onClick={() => handleUnifiedSettle(t)}
                                    className="bg-slate-900 text-white px-4 py-1.5 rounded-lg font-black uppercase tracking-widest text-[9px] shadow-lg hover:bg-black transition-all active:scale-95 flex items-center gap-1.5"
                                >
                                    <Check className="w-3.5 h-3.5" /> Settle
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-6 sm:mt-8">
                <button
                    onClick={handleCloseMonth}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-base shadow-lg shadow-amber-200 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest"
                >
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                    {isSettled ? 'Archive Month' : 'Save & Archive'}
                </button>
            </div>
        </div>
    );
};

export default SettlementPlan;
