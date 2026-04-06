import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles } from 'lucide-react';

const DetailedBreakdown = ({ results, daysInMonth, isMonthlyMode, setIsMonthlyMode, onOpenAI, customSplits }) => {
    if (!results) return null;

    const [hoveredData, setHoveredData] = useState(null);

    const getMemberCustomBreakdown = (memberId) => {
        if (!customSplits) return [];
        const breakdown = [];
        customSplits.forEach(s => {
            if (s.description && s.description.startsWith('Settled')) return;
            if (s.splitType === 'exact' && s.allocations) {
                const allocKey = Object.keys(s.allocations).find(k => String(k) === String(memberId));
                if (allocKey) {
                    const amt = parseFloat(s.allocations[allocKey]) || 0;
                    if (amt > 0) breakdown.push({ desc: s.description || 'Custom Item', amt });
                }
            } else if (s.involvedIds && s.involvedIds.map(String).includes(String(memberId))) {
                const amt = s.amount / s.involvedIds.length;
                if (amt > 0) breakdown.push({ desc: s.description || 'Custom Item', amt });
            }
        });
        return breakdown;
    };

    return (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between p-6 sm:p-8 bg-slate-50/30 border-b border-slate-100">
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-3 shrink-0">
                    Bill Overview <span className="text-2xl">📊</span>
                </h2>
                
                <div className="flex items-center gap-3">
                    {/* Laptop Split/Month Toggle (Hidden on Mobile) */}
                    <div className="hidden sm:flex items-center bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-white shadow-sm">
                        <button onClick={() => setIsMonthlyMode?.(false)} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${!isMonthlyMode ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Split</button>
                        <button onClick={() => setIsMonthlyMode?.(true)} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${isMonthlyMode ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Month</button>
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
                                {results.totalCustom > 0 && (
                                    <td className="px-3 py-4 sm:px-8 text-slate-600 font-mono text-right font-medium">
                                        {m.displayCustomShare > 0 ? (
                                            <div 
                                                className="inline-flex items-center gap-1 cursor-help border-b border-dashed border-indigo-300 md:border-transparent md:hover:border-indigo-300 transition-colors pb-[1px]"
                                                onMouseEnter={(e) => {
                                                    setHoveredData({ rect: e.currentTarget.getBoundingClientRect(), breakdown: getMemberCustomBreakdown(m.id) });
                                                }}
                                                onMouseLeave={() => setHoveredData(null)}
                                                onClick={(e) => {
                                                    // Toggle on mobile
                                                    if (hoveredData) setHoveredData(null);
                                                    else setHoveredData({ rect: e.currentTarget.getBoundingClientRect(), breakdown: getMemberCustomBreakdown(m.id) });
                                                }}
                                            >
                                                ₹{m.displayCustomShare.toFixed(0)}
                                            </div>
                                        ) : (
                                            `₹${m.displayCustomShare.toFixed(0)}`
                                        )}
                                    </td>
                                )}
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

            {/* Portal Tooltip to completely bypass table clipping */}
            {hoveredData && typeof document !== 'undefined' && createPortal(
                <div 
                    className="fixed z-[99999] bg-slate-900 border border-slate-700 shadow-2xl rounded-xl p-4 w-56 text-left pointer-events-none transition-opacity duration-150 animate-in fade-in zoom-in-95"
                    style={{
                        top: hoveredData.rect.top + (hoveredData.rect.height / 2),
                        left: hoveredData.rect.left - 16,
                        transform: 'translate(-100%, -50%)'
                    }}
                >
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-700/50 pb-2 flex justify-between items-center">
                        Breakdown <span>🧾</span>
                    </p>
                    <ul className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto no-scrollbar">
                        {hoveredData.breakdown.map((item, idx) => (
                            <li key={idx} className="flex justify-between items-start text-[11px] gap-3">
                                <span className="text-slate-200 leading-tight">{item.desc}</span>
                                <span className="text-white font-mono shrink-0 font-medium">₹{item.amt.toFixed(0)}</span>
                            </li>
                        ))}
                    </ul>
                    {hoveredData.breakdown.length === 0 && (
                        <p className="text-xs text-slate-500 text-center italic">No itemized tracking available.</p>
                    )}
                    {/* Arrow pointing right */}
                    <div className="absolute top-1/2 -mt-1.5 -right-1.5 w-3 h-3 bg-slate-900 border-t border-r border-slate-700 rotate-45"></div>
                </div>, 
                document.body
            )}
        </div>
    );
};

export default DetailedBreakdown;
