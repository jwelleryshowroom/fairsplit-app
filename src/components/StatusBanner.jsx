import React from 'react';
import { Check, Edit3, Sparkles, Zap, Loader2 } from 'lucide-react';

const StatusBanner = ({
    isSettled,
    setResults,
    generateInsights,
    isGeneratingInsights,
    setShowArchiveModal
}) => {
    if (!isSettled) return null;

    return (
        <div className="mb-6 bg-emerald-600 text-white p-4 lg:p-6 rounded-[2rem] shadow-lg flex flex-col xl:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

            <div className="flex items-center gap-4 relative z-10 w-full xl:w-auto">
                <div className="bg-emerald-500/50 p-3 rounded-2xl shadow-inner border border-emerald-400/50">
                    <Check className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h3 className="font-black text-2xl tracking-tight">Settlement Complete! ✨</h3>
                    <p className="text-emerald-100 font-medium whitespace-nowrap">All debts cleared. Ready to save analytics?</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 w-full xl:w-auto relative z-10">
                <button
                    onClick={generateInsights}
                    disabled={isGeneratingInsights}
                    className="flex-1 xl:flex-none bg-emerald-700/50 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl text-sm font-bold border border-emerald-400/50 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    {isGeneratingInsights ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    <span className="whitespace-nowrap">AI Insights</span>
                </button>

                <button
                    onClick={() => setShowArchiveModal(true)}
                    className="flex-1 xl:flex-none bg-amber-500 hover:bg-amber-600 text-white px-5 py-3 rounded-2xl text-sm font-bold shadow-md shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 animate-pulse"
                >
                    <Zap className="w-5 h-5" />
                    <span className="whitespace-nowrap">Archive & Analytics</span>
                </button>

                <button
                    onClick={() => setResults(null)}
                    className="w-full xl:w-auto bg-emerald-800 hover:bg-emerald-900 border border-emerald-500 text-white px-5 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <Edit3 className="w-5 h-5" />
                    <span className="whitespace-nowrap">Modify Entries</span>
                </button>
            </div>
        </div>
    );
};

export default StatusBanner;
