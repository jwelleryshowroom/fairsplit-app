import React, { useState } from 'react';
import { Calculator, Calendar, Sparkles, History as HistoryIcon, Loader2, RefreshCw, ChevronDown, ChevronUp, Bot } from 'lucide-react';
import DetailedBreakdown from './DetailedBreakdown';
import Modal from './Modal';

const ResultsDashboard = ({
    results, isModifying, isSettled,
    isMonthlyMode, setIsMonthlyMode,
    daysInMonth, updateDays,
    pendingDebts, handleUnifiedSettle,
    insights, isInsightsMinimized, setIsInsightsMinimized, generateInsights, isGeneratingInsights,
    mobileHidden
}) => {
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);

    return (
        <div className={`flex flex-col gap-4 sm:gap-6 min-w-0 transition-all duration-700 ${!isModifying && results ? 'lg:col-span-7' : 'lg:col-span-4'}`}>
            {(!results || isModifying) && (
                <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-500">
                    <h2 className="text-2xl font-black text-slate-800 mb-[-10px]">Split Overview</h2>

                    {/* Control Bento Box */}
                    <div className="bg-white/60 backdrop-blur-2xl rounded-[2rem] p-3 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/40 flex justify-between items-center">
                        <div className={`flex items-center bg-white/50 p-1.5 rounded-2xl border border-white max-w-fit shadow-inner ${isSettled ? 'pointer-events-none opacity-50' : ''}`}>
                            <button
                                onClick={() => setIsMonthlyMode(false)}
                                className={`px-5 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${!isMonthlyMode ? 'bg-white text-indigo-600 shadow-md border border-slate-100 shrink-0' : 'text-slate-400 hover:text-slate-600 shrink-0'}`}
                            >
                                Normal Split
                            </button>
                            <button
                                onClick={() => setIsMonthlyMode(true)}
                                className={`px-5 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${isMonthlyMode ? 'bg-white text-emerald-600 shadow-md border border-slate-100 shrink-0' : 'text-slate-400 hover:text-slate-600 shrink-0'}`}
                            >
                                Monthly
                            </button>
                            {isMonthlyMode && (
                                <div className="flex items-center gap-2 px-3 border-l border-slate-200/50 shrink-0 animate-in fade-in slide-in-from-left-4">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <input type="number" value={daysInMonth} onChange={(e) => updateDays(e.target.value)} className="w-10 bg-transparent font-black text-slate-700 text-center outline-none" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Split Analysis Placeholder */}
                    <div className="bg-white/40 backdrop-blur-xl rounded-[2rem] p-10 shadow-sm border border-white/40 flex flex-col items-center justify-center text-center opacity-60">
                        <Calculator className="w-12 h-12 text-slate-300 mb-4" />
                        <p className="font-bold text-slate-500">Analysis Pending</p>
                    </div>
                </div>
            )}

            {/* Split Analysis Bento Box (KPIs for Results View) */}
            {results && !isModifying && (
                <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-500 w-full overflow-hidden">
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-4 w-full">
                        <div className="bg-white/80 backdrop-blur-2xl rounded-xl sm:rounded-3xl p-2 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 relative overflow-hidden group flex flex-col justify-center min-w-0">
                            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-10 sm:w-16 h-10 sm:h-16 bg-blue-100 rounded-full blur-lg sm:blur-xl opacity-40 group-hover:scale-150 transition-all duration-500"></div>
                            <div className="relative z-10 flex flex-col gap-0.5 sm:gap-2">
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <div className="p-1 sm:p-1.5 bg-blue-100/50 rounded-lg sm:rounded-xl">
                                        <Calculator className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-blue-600" />
                                    </div>
                                    <p className="text-slate-500 text-[7px] sm:text-xs font-black uppercase tracking-tighter sm:tracking-widest truncate">
                                        <span className="sm:hidden">Exp</span>
                                        <span className="hidden sm:inline">Total Expense</span>
                                    </p>
                                </div>
                                <p className="text-xs sm:text-3xl font-black sm:font-extrabold text-slate-800 tracking-tight truncate sm:pl-9">₹{results.totalVariable.toFixed(0)}</p>
                            </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-2xl rounded-xl sm:rounded-3xl p-2 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 relative overflow-hidden group flex flex-col justify-center min-w-0">
                            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-10 sm:w-16 h-10 sm:h-16 bg-rose-100 rounded-full blur-lg sm:blur-xl opacity-40 group-hover:scale-150 transition-all duration-500"></div>
                            <div className="relative z-10 flex flex-col gap-0.5 sm:gap-2">
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <div className="p-1 sm:p-1.5 bg-rose-100/50 rounded-lg sm:rounded-xl">
                                        <Sparkles className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-rose-600" />
                                    </div>
                                    <p className="text-slate-500 text-[7px] sm:text-xs font-black uppercase tracking-tighter sm:tracking-widest truncate">
                                        <span className="sm:hidden">Cust</span>
                                        <span className="hidden sm:inline">Total Custom</span>
                                    </p>
                                </div>
                                <p className="text-xs sm:text-3xl font-black sm:font-extrabold text-slate-800 tracking-tight truncate sm:pl-9">₹{results.totalCustom.toFixed(0)}</p>
                            </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-2xl rounded-xl sm:rounded-3xl p-2 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 relative overflow-hidden group flex flex-col justify-center min-w-0">
                            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-10 sm:w-16 h-10 sm:h-16 bg-amber-100 rounded-full blur-lg sm:blur-xl opacity-40 group-hover:scale-150 transition-all duration-500"></div>
                            <div className="relative z-10 flex flex-col gap-0.5 sm:gap-2">
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <div className="p-1 sm:p-1.5 bg-amber-100/50 rounded-lg sm:rounded-xl">
                                        <HistoryIcon className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-amber-600" />
                                    </div>
                                    <p className="text-slate-500 text-[7px] sm:text-xs font-black uppercase tracking-tighter sm:tracking-widest truncate">
                                        <span className="sm:hidden">Arr</span>
                                        <span className="hidden sm:inline">Total Arrears</span>
                                    </p>
                                </div>
                                <p className="text-xs sm:text-3xl font-black sm:font-extrabold text-slate-800 tracking-tight truncate sm:pl-9">₹{pendingDebts.reduce((sum, tx) => sum + tx.amount, 0).toFixed(0)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Premium AI Insights with RGB Glow */}
                    <div className="hidden sm:block">
                        <div className="relative p-[2px] rounded-3xl group/ai overflow-hidden">
                            {/* Animated RGB Border */}
                            <div className="absolute inset-0 rgb-border rounded-3xl opacity-70 group-hover/ai:opacity-100 transition-opacity" />

                            <div className="relative bg-white/90 backdrop-blur-3xl rounded-[calc(1.5rem-2px)] p-6 sm:p-8 h-full transition-all duration-300">
                                <div className={`flex justify-between items-center ${isInsightsMinimized ? '' : 'mb-6'}`}>
                                    <h3
                                        className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center gap-3 cursor-pointer select-none"
                                        onClick={() => setIsInsightsMinimized(!isInsightsMinimized)}
                                    >
                                        <Sparkles className="w-6 h-6 text-purple-600" /> AI Spending Analysis
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        {insights && !isInsightsMinimized && (
                                            <button
                                                onClick={generateInsights}
                                                disabled={isGeneratingInsights}
                                                title="Get a new roast"
                                                className="p-2 rounded-xl text-purple-500 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-40 transition-all active:scale-95 flex items-center gap-2 animate-in fade-in"
                                            >
                                                {isGeneratingInsights ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                                <span className="text-xs font-bold">Refresh</span>
                                            </button>
                                        )}
                                        {!insights && !isInsightsMinimized && (
                                            <button
                                                onClick={generateInsights}
                                                disabled={isGeneratingInsights}
                                                className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black hover:shadow-lg disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2 animate-in fade-in"
                                            >
                                                {isGeneratingInsights ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate Analysis"}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setIsInsightsMinimized(!isInsightsMinimized)}
                                            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                                        >
                                            {isInsightsMinimized ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {!isInsightsMinimized && (
                                    <div className="animate-in fade-in slide-in-from-top-3 duration-500">
                                        {insights ? (
                                            <div className="relative">
                                                <div className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-line border-l-3 border-indigo-100 pl-6 py-2">
                                                    {insights}
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-6 flex items-center gap-2 opacity-60">
                                                    <Bot className="w-4 h-4" /> Powered by Gemini Pro AI Engine
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-4 py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-300">
                                                    <Bot className="w-7 h-7" />
                                                </div>
                                                <p className="text-slate-500 text-sm font-medium">Get intelligent, witty insights on your spending patterns.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Detailed Breakdown Bento Box */}
            {results && !isModifying && (
                <div className="bg-white/60 backdrop-blur-2xl rounded-[1.5rem] sm:rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/40 overflow-hidden animate-in fade-in slide-in-from-bottom-4 w-full min-w-0 mt-2">
                    <DetailedBreakdown
                        results={results}
                        daysInMonth={daysInMonth}
                        isMonthlyMode={isMonthlyMode}
                        onOpenAI={() => setIsAIModalOpen(true)}
                        pendingDebts={pendingDebts}
                        handleUnifiedSettle={handleUnifiedSettle}
                    />
                </div>
            )}

            {/* AI Insights Modal (Still used for mobile) */}
            <Modal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                title="AI Insights ✨"
                maxWidth="max-w-2xl"
                variant="premium"
            >
                <div className="flex flex-col gap-6">
                    <div className="p-6 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-sm">
                        {insights ? (
                            <div className="text-sm sm:text-base font-medium text-slate-700 leading-relaxed whitespace-pre-line">
                                {insights}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4 py-8 text-center">
                                <Bot className="w-12 h-12 text-slate-300" />
                                <p className="text-slate-500 font-medium whitespace-nowrap">No analysis generated yet.</p>
                                <button
                                    onClick={generateInsights}
                                    disabled={isGeneratingInsights}
                                    className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-all active:scale-95 flex items-center gap-2"
                                >
                                    {isGeneratingInsights ? <Loader2 className="w-5 h-5 animate-spin" /> : "Analyze Spending Now"}
                                </button>
                            </div>
                        )}
                    </div>

                    {insights && (
                        <div className="flex justify-between items-center px-2">
                            <p className="text-xs text-slate-400 font-medium">Powered by Gemini AI</p>
                            <button
                                onClick={generateInsights}
                                disabled={isGeneratingInsights}
                                className="text-indigo-600 hover:text-indigo-700 text-sm font-bold flex items-center gap-2"
                            >
                                {isGeneratingInsights ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                Refresh Analysis
                            </button>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default ResultsDashboard;
