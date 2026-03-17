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

    const ArrowIcon = () => (
        <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
    );

    return (
        <div className="bg-gradient-to-b from-emerald-50 to-white rounded-3xl border border-emerald-100 p-8 shadow-lg">
            <h3 className="text-2xl font-extrabold text-emerald-900 mb-6 flex gap-2">
                <Check className="w-6 h-6" /> Settlement Plan (Rounded) 💸
            </h3>

            {results.transactions.length === 0 ? (
                <div className="text-center font-bold text-emerald-800 py-4 italic">🎉 All Settled! No more debts.</div>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {results.transactions.map((t, idx) => (
                        <div key={idx} className="relative group overflow-hidden bg-white p-4 rounded-2xl shadow-sm border border-emerald-100 transition-all hover:shadow-md hover:border-emerald-200">
                            <div className="flex items-center justify-between gap-4 transition-all duration-300 group-hover:opacity-20 group-hover:blur-[1px]">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm flex-shrink-0 border border-slate-200 shadow-inner">
                                        {t.from.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-slate-800 truncate text-sm">{t.from}</span>
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">to</span>
                                            <span className="text-[11px] font-black text-slate-500 truncate italic">{t.to}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="font-mono font-black text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-100 text-sm flex-shrink-0 animate-in zoom-in-50">
                                    ₹{t.amount}
                                </div>
                            </div>

                            {/* HOVER OVERLAY: Settle Action */}
                            <div className="absolute inset-0 flex items-center justify-center translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out bg-emerald-600/5 backdrop-blur-[2px]">
                                <button
                                    onClick={() => handleUnifiedSettle(t)}
                                    className="bg-slate-900 text-white px-5 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-slate-900/20 hover:bg-black transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <Check className="w-4 h-4" /> Settle
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-8 flex flex-col xl:flex-row gap-4">
                <button
                    onClick={handleCloseMonth}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-2xl font-bold shadow-md shadow-amber-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <Zap className="w-5 h-5" />
                    {isSettled ? 'Archive Month' : 'Archive & Analytics'}
                </button>
            </div>
        </div>
    );
};

export default SettlementPlan;
