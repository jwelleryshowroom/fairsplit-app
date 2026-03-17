import React from 'react';
import { Loader2, Calculator, Camera, X } from 'lucide-react';

const FloatingDock = ({
    isModifying, results, isShimmering,
    handleCalculateWithShimmer, setShowReceiptModal, setIsModifying
}) => {
    return (
        <div className="fixed bottom-6 left-0 right-0 z-40 pointer-events-none flex justify-center px-4">
            {(isModifying || !results) ? (
                /* EDITING MODE: Full dock */
                <div className="pointer-events-auto bg-white/80 backdrop-blur-2xl p-2 rounded-[2.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-white/50 flex items-center gap-2 max-w-[600px] w-full animate-in slide-in-from-bottom-8">
                    <button
                        onClick={handleCalculateWithShimmer}
                        className="flex-1 px-8 py-5 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-[0.15em] text-xs rounded-[2rem] shadow-[0_5px_20px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 flex justify-center items-center gap-3 group"
                    >
                        {isShimmering ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calculator className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
                        <span>{isShimmering ? "Calculating..." : "Show Results"}</span>
                    </button>

                    <div className="w-px h-8 bg-slate-200 mx-1 hidden sm:block"></div>

                    <button
                        onClick={() => setShowReceiptModal(true)}
                        className="px-6 py-5 bg-white hover:bg-slate-50 text-slate-800 font-bold tracking-wide rounded-[2rem] text-sm shadow-sm transition-all active:scale-[0.98] flex items-center gap-2 flex-shrink-0"
                    >
                        <Camera className="w-5 h-5" />
                        <span className="hidden sm:inline">Scan Bill</span>
                    </button>
                </div>
            ) : (
                /* RESULTS MODE: Compact close pill — small, unobtrusive */
                <div className="pointer-events-auto animate-in slide-in-from-bottom-4">
                    <button
                        onClick={() => setIsModifying(true)}
                        className="bg-white/70 backdrop-blur-xl hover:bg-white text-slate-500 hover:text-slate-800 px-5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest border border-slate-200/60 shadow-lg transition-all active:scale-95 flex items-center gap-2"
                    >
                        <X className="w-3.5 h-3.5" /> Modify
                    </button>
                </div>
            )}
        </div>
    );
};

export default FloatingDock;
