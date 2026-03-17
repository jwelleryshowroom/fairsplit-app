import React from 'react';
import { Calculator, Calendar, Sparkles, History as HistoryIcon, Loader2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import DetailedBreakdown from './DetailedBreakdown';

const ResultsDashboard = ({
    results, isModifying, isSettled,
    isMonthlyMode, setIsMonthlyMode,
    daysInMonth, updateDays,
    pendingDebts,
    insights, isInsightsMinimized, setIsInsightsMinimized, generateInsights, isGeneratingInsights
}) => {
    return (
        <div className={`flex flex-col gap-6 min-w-0 transition-all duration-700 ${!isModifying && results ? 'lg:col-span-7' : 'lg:col-span-4'}`}>
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in zoom-in-95 duration-500">
                    <div className="bg-white/80 backdrop-blur-2xl rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-blue-100 rounded-full blur-xl group-hover:scale-150 transition-all duration-500"></div>
                        <div className="relative z-10 flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-100/50 rounded-xl">
                                    <Calculator className="w-4 h-4 text-blue-600" />
                                </div>
                                <p className="text-slate-500 text-[10px] sm:text-xs font-black uppercase tracking-widest">Total Expense</p>
                            </div>
                            <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">₹{results.totalVariable.toFixed(0)}</p>
                        </div>
                    </div>
                    
                    <div className="bg-white/80 backdrop-blur-2xl rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-rose-100 rounded-full blur-xl group-hover:scale-150 transition-all duration-500"></div>
                        <div className="relative z-10 flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-rose-100/50 rounded-xl">
                                    <Sparkles className="w-4 h-4 text-rose-600" />
                                </div>
                                <p className="text-slate-500 text-[10px] sm:text-xs font-black uppercase tracking-widest">Total Custom</p>
                            </div>
                            <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">₹{results.totalCustom.toFixed(0)}</p>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-2xl rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-amber-100 rounded-full blur-xl group-hover:scale-150 transition-all duration-500"></div>
                        <div className="relative z-10 flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-amber-100/50 rounded-xl">
                                    <HistoryIcon className="w-4 h-4 text-amber-600" />
                                </div>
                                <p className="text-slate-500 text-[10px] sm:text-xs font-black uppercase tracking-widest">Total Arrears</p>
                            </div>
                            <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">₹{pendingDebts.reduce((sum, tx) => sum + tx.amount, 0).toFixed(0)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Insights Bento Box - RGB Glow */}
            {results && !isModifying && (
                <div className="relative p-[2px] rounded-[2rem] group/ai mt-2">
                    {/* Animated RGB Border */}
                    <div className="absolute inset-0 rgb-border rounded-[2rem] opacity-70 group-hover/ai:opacity-100 transition-opacity" />

                    <div className="relative bg-white/90 backdrop-blur-3xl rounded-[calc(2rem-2px)] p-6 sm:p-8 h-full transition-all duration-300">
                        <div className={`flex justify-between items-center ${isInsightsMinimized ? '' : 'mb-5'}`}>
                            <h3 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center gap-2 cursor-pointer select-none" onClick={() => setIsInsightsMinimized(!isInsightsMinimized)}>
                                <Sparkles className="w-5 h-5 text-purple-600" /> AI Insights
                            </h3>
                            <div className="flex items-center gap-2">
                                {insights && !isInsightsMinimized && (
                                    <button
                                        onClick={generateInsights}
                                        disabled={isGeneratingInsights}
                                        title="Get a new roast"
                                        className="p-2 rounded-xl text-purple-500 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-40 transition-all active:scale-95 animate-in fade-in"
                                    >
                                        {isGeneratingInsights ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                    </button>
                                )}
                                {!insights && !isInsightsMinimized && (
                                    <button
                                        onClick={generateInsights}
                                        disabled={isGeneratingInsights}
                                        className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 hover:shadow-lg disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2 animate-in fade-in"
                                    >
                                        {isGeneratingInsights ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analyze Group"}
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsInsightsMinimized(!isInsightsMinimized)}
                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                                >
                                    {isInsightsMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        
                        {!isInsightsMinimized && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                {insights ? (
                                    <div className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-line">
                                        {insights}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-400">Generate an AI-driven roast or summary based on this month's spending patterns.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Detailed Breakdown Bento Box */}
            {results && !isModifying && (
                <div className="bg-white/60 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/40 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                    <DetailedBreakdown results={results} daysInMonth={daysInMonth} isMonthlyMode={isMonthlyMode} />
                </div>
            )}
        </div>
    );
};

export default ResultsDashboard;
