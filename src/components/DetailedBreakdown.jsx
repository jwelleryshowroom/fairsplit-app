import React from 'react';

const DetailedBreakdown = ({ results, daysInMonth, isMonthlyMode }) => {
    if (!results) return null;

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden mb-10">
            <div className="px-6 py-4 bg-slate-50 border-b flex items-center justify-between">
                <span className="font-bold text-slate-700">Detailed Breakdown 📊</span>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${isMonthlyMode
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : 'bg-blue-50 text-blue-600 border-blue-200'
                    }`}>
                    {isMonthlyMode ? 'Monthly Mode' : 'Normal Split'}
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="text-slate-500 uppercase text-[10px] tracking-widest">
                            <th className="px-6 py-4">Member</th>
                            {/* Days column only for Monthly mode */}
                            {isMonthlyMode && <th className="px-6 py-4 text-center">Days</th>}
                            {/* VAR SHARE for Monthly, EXPENSE SHARE for Normal */}
                            <th className="px-6 py-4">{isMonthlyMode ? 'Var Share' : 'Expense Share'}</th>
                            {results.totalFixed > 0 && <th className="px-6 py-4">Fixed Share</th>}
                            {results.totalCustom > 0 && <th className="px-6 py-4">{isMonthlyMode ? 'Side Share' : 'Custom Splits'}</th>}
                            <th className="px-6 py-4">Prev {isMonthlyMode ? 'Arrears' : 'Balance'}</th>
                            <th className="px-6 py-4">Net Balance</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {results.balances.map(m => (
                            <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-700">
                                    {m.name}
                                    {m.isGuest && <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded ml-2">GUEST</span>}
                                </td>
                                {/* Days cell only for Monthly */}
                                {isMonthlyMode && (
                                    <td className="px-6 py-4 text-center font-mono text-slate-500">
                                        {m.daysPresent}<span className="text-xs text-slate-300">/{daysInMonth}</span>
                                    </td>
                                )}
                                <td className="px-6 py-4 text-slate-600 font-mono">₹{m.variableShare.toFixed(2)}</td>
                                {results.totalFixed > 0 && <td className="px-6 py-4 text-slate-600 font-mono">₹{m.fixedShare.toFixed(2)}</td>}
                                {results.totalCustom > 0 && <td className="px-6 py-4 text-slate-600 font-mono">₹{m.displayCustomShare.toFixed(2)}</td>}
                                <td className={`px-6 py-4 font-mono font-medium ${m.arrears < 0 ? 'text-red-500' : m.arrears > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                    {m.arrears !== 0 ? `${m.arrears > 0 ? '+' : ''}₹${Math.abs(m.arrears).toFixed(2)}` : '-'}
                                </td>
                                <td className={`px-6 py-4 font-mono font-bold ${m.netBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {m.netBalance >= 0 ? '+' : ''}₹{Math.abs(m.netBalance).toFixed(2)}
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
