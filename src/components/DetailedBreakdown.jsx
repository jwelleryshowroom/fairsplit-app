import { Sparkles } from 'lucide-react';

const DetailedBreakdown = ({ results, daysInMonth, isMonthlyMode, onOpenAI }) => {
    if (!results) return null;

    return (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between p-6 sm:p-8 bg-slate-50/30 border-b border-slate-100">
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-3 shrink-0">
                    Bill Overview <span className="text-2xl">📊</span>
                </h2>
                
                <div className="flex items-center gap-3">
                    {/* Laptop Split/Month Toggle (Hidden on Mobile) */}
                    <div className="hidden sm:flex items-center bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-white shadow-sm">
                        <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${!isMonthlyMode ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}>Split</span>
                        <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${isMonthlyMode ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>Month</span>
                    </div>

                    {/* Premium RGB Mobile AI Button (Inline on Mobile) */}
                    <button
                        onClick={onOpenAI}
                        className="sm:hidden relative p-[1px] rounded-lg overflow-hidden group/ai active:scale-95 transition-all shadow-lg shadow-indigo-100/50"
                    >
                        <div className="absolute inset-0 rgb-border opacity-80 group-hover/ai:opacity-100" />
                        <div className="relative bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-[7px] flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                            <span className="text-[9px] font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 uppercase tracking-tighter">AI Insights</span>
                        </div>
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-[10px] sm:text-base text-left">
                    <thead>
                        <tr className="text-slate-400 uppercase text-[8px] sm:text-[10px] tracking-widest sm:tracking-[0.2em] bg-slate-50/50">
                            <th className="px-3 py-4 sm:px-8 whitespace-nowrap">Member 👤</th>
                            {isMonthlyMode && <th className="px-2 py-4 text-center whitespace-nowrap">Days 🗓️</th>}
                            <th className="px-3 py-4 sm:px-8 text-right whitespace-nowrap">
                                <span className="sm:hidden">Exp 💸</span>
                                <span className="hidden sm:inline">{isMonthlyMode ? 'Variable Expense' : 'Expense'}</span>
                            </th>
                            {results.totalFixed > 0 && (
                                <th className="px-3 py-4 sm:px-8 text-right whitespace-nowrap">
                                    <span className="sm:hidden">Fix 🏠</span>
                                    <span className="hidden sm:inline">Fixed Cost</span>
                                </th>
                            )}
                            {results.totalCustom > 0 && (
                                <th className="px-4 py-4 sm:px-6 text-right whitespace-nowrap">
                                    <span className="sm:hidden">{isMonthlyMode ? 'Side' : 'Cust'}</span>
                                    <span className="hidden sm:inline">{isMonthlyMode ? 'Extra Items' : 'Custom Split'}</span>
                                </th>
                            )}
                            <th className="px-3 py-4 sm:px-8 text-right whitespace-nowrap">
                                <span className="sm:hidden">Prev 🔙</span>
                                <span className="hidden sm:inline">Previous Bal</span>
                            </th>
                            <th className="px-3 py-4 sm:px-8 text-right whitespace-nowrap">
                                <span className="sm:hidden">Net 🎯</span>
                                <span className="hidden sm:inline">Net Balance</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {results.balances.map(m => (
                            <tr key={m.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-3 py-4 sm:px-8 font-bold text-slate-700 whitespace-nowrap">
                                    {m.name}
                                    {m.isGuest && <span className="text-[7px] bg-orange-100 text-orange-600 px-1 py-0.5 rounded ml-1 font-black">G</span>}
                                </td>
                                {isMonthlyMode && (
                                    <td className="px-2 py-4 text-center font-mono text-slate-400 text-[10px] sm:text-sm">
                                        {m.daysPresent}<span className="text-[8px] sm:text-[10px] opacity-50 ml-0.5">/D</span>
                                    </td>
                                )}
                                <td className="px-3 py-4 sm:px-8 text-slate-600 font-mono text-right font-medium">₹{m.variableShare.toFixed(0)}</td>
                                {results.totalFixed > 0 && <td className="px-3 py-4 sm:px-8 text-slate-600 font-mono text-right font-medium">₹{m.fixedShare.toFixed(0)}</td>}
                                {results.totalCustom > 0 && <td className="px-3 py-4 sm:px-8 text-slate-600 font-mono text-right font-medium">₹{m.displayCustomShare.toFixed(0)}</td>}
                                <td className={`px-3 py-4 sm:px-8 font-mono font-bold text-right ${m.arrears < 0 ? 'text-rose-500' : m.arrears > 0 ? 'text-emerald-500' : 'text-slate-300'}`}>
                                    {m.arrears !== 0 ? `${m.arrears > 0 ? '+' : '-'}${Math.abs(m.arrears).toFixed(0)}` : '-'}
                                </td>
                                <td className={`px-3 py-4 sm:px-8 font-mono font-black text-right ${m.netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {m.netBalance >= 0 ? '+' : '-'}{Math.abs(m.netBalance).toFixed(0)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DetailedBreakdown;
