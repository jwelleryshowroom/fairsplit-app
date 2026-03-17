import React, { useState, useEffect } from 'react';
import { ChevronDown, BarChart3, TrendingUp, Wallet, Receipt, ArrowUpRight, ArrowDownLeft, Home, BookOpen, Activity, Settings, HelpCircle, LogOut, Loader2, X, Info, Lightbulb, ShoppingCart, UtensilsCrossed, Shirt, CreditCard } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

// ---------------------------------------------------------------------------
// 1. Data Hook
// ---------------------------------------------------------------------------
const useMemberSnapshots = (groupId, monthId, nodeRef) => {
    const [snapshots, setSnapshots] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = () => {
        if (!groupId || !monthId || snapshots !== null || loading) return;
        setLoading(true);
        setError(null);
        getDocs(collection(db, "v6_groups", groupId, "months", monthId.toString(), "memberSnapshots"))
            .then(snap => {
                const data = snap.docs.map(d => d.data());
                data.sort((a, b) => a.memberName.localeCompare(b.memberName));
                setSnapshots(data);
            })
            .catch(err => {
                console.error('Snapshot load failed:', err);
                setError('Failed to load member data.');
            })
            .finally(() => setLoading(false));
    };

    // Prefetch as soon as the card enters the viewport (IntersectionObserver)
    useEffect(() => {
        const el = nodeRef?.current;
        if (!el || snapshots !== null) return;
        const observer = new IntersectionObserver(
            (entries) => { if (entries[0].isIntersecting) { fetchData(); observer.disconnect(); } },
            { rootMargin: '200px' }  // start 200px before the card is visible
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [nodeRef, groupId, monthId]); // eslint-disable-line

    return { snapshots, loading, error, retry: fetchData };
};


// ---------------------------------------------------------------------------
// 2. Custom CSS & Animations (Injected safely)
// ---------------------------------------------------------------------------
const globalStyles = `
  @keyframes meshGlow {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  .bg-mesh-dark {
    background: radial-gradient(circle at 15% 50%, rgba(59, 130, 246, 0.08), transparent 45%),
                radial-gradient(circle at 85% 30%, rgba(139, 92, 246, 0.08), transparent 45%);
    background-size: 200% 200%;
    animation: meshGlow 15s ease infinite;
    background-color: #0b0e14; /* Deep dark base */
  }
  
  .glass-card {
    background: rgba(255, 255, 255, 0.02);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
  }
  
  .glass-nav {
    background: rgba(11, 14, 20, 0.6);
    backdrop-filter: blur(24px) saturate(150%);
    -webkit-backdrop-filter: blur(24px) saturate(150%);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .drawer-blur {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .dim-overlay {
    background: rgba(0, 0, 0, 0.4);
    pointer-events: auto;
  }
  
  .text-glow-blue {
    text-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
  }
  
  /* Connecting line for timeline */
  .timeline-line::before {
    content: '';
    position: absolute;
    top: 60px;
    bottom: -40px;
    left: 28px;
    width: 2px;
    background: linear-gradient(to bottom, rgba(59,130,246,0.3), rgba(255,255,255,0.05));
    z-index: 0;
  }
  .timeline-node:last-child .timeline-line::before {
    display: none;
  }
`;

// ---------------------------------------------------------------------------
// 3. Mini Dashboard Charts
// ---------------------------------------------------------------------------
const MiniGauge = ({ value, max, colorHex, label, icon, caption }) => {
    const pct = Math.min((value / (max || 1)) * 100, 100);
    // Arc: viewBox 0 0 80 60 — arc at y=44, leaves ~16px of room below for the amount text
    const r = 36;
    const cx = 40, cy = 44;
    const circumference = Math.PI * r;
    const strokeDash = circumference;
    const strokeOffset = circumference * (1 - pct / 100);
    const color = colorHex || '#3b82f6';

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-white/[0.02] rounded-3xl border border-white/[0.05]">
            <div className="flex items-center gap-1.5 mb-2">
                {icon && <span className="text-slate-400">{icon}</span>}
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
            </div>
            {/* Arc + Amount in a single block; viewBox extends to 60px tall to hold amount text below arc */}
            <div className="relative w-28 h-16">
                <svg viewBox="0 0 80 60" className="w-full h-full">
                    {/* Track */}
                    <path
                        d={`M${cx - r},${cy} A${r},${r} 0 0,1 ${cx + r},${cy}`}
                        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" strokeLinecap="round"
                    />
                    {/* Value arc */}
                    <path
                        d={`M${cx - r},${cy} A${r},${r} 0 0,1 ${cx + r},${cy}`}
                        fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
                        strokeDasharray={strokeDash}
                        strokeDashoffset={strokeOffset}
                        style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 4px ${color}88)` }}
                    />
                    {/* Amount text centered below arc, inside SVG at y=58 */}
                    <text
                        x="40" y="58"
                        textAnchor="middle"
                        fill="white"
                        fontWeight="900"
                        fontSize="13"
                        fontFamily="inherit"
                        style={{ letterSpacing: '-0.02em' }}
                    >
                        ₹{(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </text>
                </svg>
            </div>
            {caption && <p className="text-[9px] text-slate-600 font-medium mt-1">{caption}</p>}
        </div>
    );
};



// ---------------------------------------------------------------------------
// 4. Ledger Node (Timeline View)
// ---------------------------------------------------------------------------
const LedgerNode = ({ archive, groupId, onSelectMember, selectedMemberId }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const nodeRef = React.useRef(null);
    const { snapshots, loading, error, retry } = useMemberSnapshots(groupId, archive?.id, nodeRef);

    // Guard after hooks (hooks must always run unconditionally)
    if (!archive || !archive.id) return null;

    const dateStr = archive.closedAt || archive.date;
    const dateObj = dateStr ? new Date(dateStr) : null;
    const niceDate = dateObj && !isNaN(dateObj)
        ? dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()
        : 'UNKNOWN DATE';

    const totalVar = Number(archive.totalVariable ?? archive.results?.totalVariable ?? 0) || 0;
    const totalFixed = Number(archive.totalFixed ?? archive.results?.totalFixed ?? 0) || 0;
    const totalCustom = Number(archive.totalCustom ?? archive.results?.totalCustom ?? 0) || 0;
    const isNormal = archive.mode === 'normal';
    const grandTotal = isNormal ? totalVar + totalCustom : totalVar + totalFixed;
    const totalArrearsIn = snapshots?.reduce((s, snap) => s + Math.max(snap.arrearsCarriedIn || 0, 0), 0) ?? 0;


    return (
        <div ref={nodeRef} className="relative flex gap-6 mb-8 timeline-node">
            {/* Timeline Axis & Dot */}
            <div className="timeline-line relative z-10 flex flex-col items-center">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-xl shadow-[0_0_20px_rgba(59,130,246,0.2)] border-2 transition-all duration-500 ${isExpanded ? 'bg-blue-600 border-blue-400 text-white' : 'bg-[#151a26] border-slate-700 text-slate-300'}`}>
                    {archive.name ? archive.name.charAt(0).toUpperCase() : 'M'}
                </div>
            </div>

            {/* Content Card — ALWAYS overflow-hidden so glass never bleeds */}
            <div className={`flex-1 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isExpanded ? 'scale-[1.01]' : 'hover:translate-x-1'}`}>
                <div
                    className="glass-card rounded-[2rem] overflow-hidden cursor-pointer relative group transition-all duration-500"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {/* Hover glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                    {/* Header row — always visible */}
                    <div className="p-6 flex items-center justify-between relative z-10">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-extrabold text-white text-xl tracking-tight">{archive.name || 'Unnamed Entry'}</h3>
                                <div className="flex gap-2">
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border ${archive.mode === 'normal'
                                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        }`}>
                                        {archive.mode === 'normal' ? 'Normal' : 'Monthly'}
                                    </span>
                                    <span className="bg-white/5 text-slate-400 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-white/10">
                                        Settled
                                    </span>
                                </div>
                            </div>
                            <div className="text-[10px] font-black text-slate-500 tracking-[0.2em]">{niceDate}</div>
                        </div>

                        <div className="flex items-center gap-6">
                            {!isExpanded && (
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Grand Total</p>
                                    <p className="font-black text-white text-xl">₹{grandTotal.toLocaleString('en-IN')}</p>
                                </div>
                            )}
                            <div className={`w-10 h-10 rounded-full bg-white/[0.05] flex items-center justify-center transition-transform duration-500 ${isExpanded ? 'rotate-180 bg-white/[0.1]' : ''}`}>
                                <ChevronDown className="w-5 h-5 text-slate-400" />
                            </div>
                        </div>
                    </div>

                    {/* Expandable body — grid-rows animation, still inside overflow-hidden card */}
                    <div
                        className="grid transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                        style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
                    >
                        <div className="min-h-0 overflow-hidden">
                            <div className={`px-6 pb-6 transition-opacity duration-500 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>

                                {/* Divider */}
                                <div className="h-px bg-white/[0.04] mb-6"></div>

                                {/* Internal Stats (Gauges) — Mode Aware */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                                    {isNormal ? (
                                        <>
                                            <MiniGauge value={totalVar} max={grandTotal || totalVar} colorHex="#6366f1" label="Expense Total" icon={<BarChart3 className="w-3.5 h-3.5" />} caption="Shared pool split equally" />
                                            <MiniGauge value={totalCustom} max={grandTotal || totalCustom || 1} colorHex="#f97316" label="Side Expenses" icon={<UtensilsCrossed className="w-3.5 h-3.5" />} caption="Custom & individual splits" />
                                            <div className="flex flex-col items-center justify-center p-4 bg-white/[0.02] rounded-3xl border border-white/[0.05]">
                                                <div className="flex items-center gap-1.5 mb-3"><Wallet className="w-3.5 h-3.5 text-slate-400" /><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prev Balance</span></div>
                                                <span className={`text-2xl font-black ${totalArrearsIn > 0 ? 'text-amber-400' : 'text-white'}`}>{totalArrearsIn > 0 ? '+' : ''}₹{totalArrearsIn.toLocaleString('en-IN')}</span>
                                                <p className="text-[9px] text-slate-600 mt-1">Carried into this split</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <MiniGauge value={totalVar} max={grandTotal || totalVar} colorHex="#3b82f6" label="Variable Total" icon={<Activity className="w-3.5 h-3.5" />} caption="Attendance-weighted" />
                                            <MiniGauge value={totalFixed} max={grandTotal || totalFixed || 1} colorHex="#f43f5e" label="Fixed Bills" icon={<Receipt className="w-3.5 h-3.5" />} caption="Equal group split" />
                                            <div className="flex flex-col items-center justify-center p-4 bg-white/[0.02] rounded-3xl border border-white/[0.05]">
                                                <div className="flex items-center gap-1.5 mb-3"><Wallet className="w-3.5 h-3.5 text-slate-400" /><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Arrears In</span></div>
                                                <span className={`text-2xl font-black ${totalArrearsIn > 0 ? 'text-amber-400' : 'text-white'}`}>{totalArrearsIn > 0 ? '+' : ''}₹{totalArrearsIn.toLocaleString('en-IN')}</span>
                                                <p className="text-[9px] text-slate-600 mt-1">Previous month debts</p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Member Cards grid */}
                                {error ? (
                                    /* Error state with retry */
                                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                                        <p className="text-slate-500 text-sm">{error}</p>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); retry(); }}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl transition-colors"
                                        >
                                            Retry
                                        </button>
                                    </div>
                                ) : loading || !snapshots ? (
                                    /* Skeleton shimmer cards */
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 p-1">
                                        {[0, 1, 2, 3].map(i => (
                                            <div key={i} className="bg-[#111622] rounded-[1.5rem] p-5 border border-white/[0.03] flex items-center justify-between animate-pulse">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-slate-800"></div>
                                                    <div className="space-y-2">
                                                        <div className="h-3.5 w-24 bg-slate-700 rounded-full"></div>
                                                        <div className="h-2 w-16 bg-slate-800 rounded-full"></div>
                                                        <div className="h-1.5 w-28 bg-slate-800/60 rounded-full"></div>
                                                    </div>
                                                </div>
                                                <div className="h-8 w-20 bg-slate-800 rounded-xl"></div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    /* Real member cards */
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 p-1">
                                        {(snapshots || []).map(s => {
                                            const isMonthlyCard = !isNormal;
                                            const totalDaysPresent = snapshots.reduce((acc, curr) => acc + (curr.daysPresent || 0), 0) || 1;
                                            const memberCount = snapshots.length || 1;
                                            const fixedShare = totalFixed / memberCount;
                                            const varShare = isMonthlyCard
                                                ? (totalVar / totalDaysPresent) * (s.daysPresent || 0)
                                                : totalVar / memberCount;
                                            const paidAmount = (s.variableExpense || 0) + (s.fixedExpense || 0);
                                            const customShare = paidAmount + (s.arrearsCarriedIn || 0) - varShare - fixedShare - (s.netBalance || 0);
                                            const varPercent = Math.min((varShare / (varShare + fixedShare || 1)) * 100, 100);
                                            const fixedPercent = 100 - varPercent;
                                            const isSelected = selectedMemberId === s.memberId;

                                            return (
                                                <div
                                                    key={s.memberId}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onSelectMember({ ...s, calcDetails: { varShare, fixedShare, customShare, paidAmount } }, niceDate, archive.mode);
                                                    }}
                                                    className={`bg-[#111622] rounded-[1.5rem] p-5 border flex items-center justify-between group/card hover:bg-[#151b29] transition-all duration-500 cursor-pointer relative overflow-hidden ${isSelected ? 'border-rose-500/50 shadow-[0_0_30px_rgba(244,68,68,0.2)] z-20 scale-[1.02]' : 'border-white/[0.03]'
                                                        }`}
                                                    style={isSelected ? { opacity: 1, filter: 'none' } : {}}
                                                >
                                                    <div className="absolute inset-0 bg-blue-500/[0.02] opacity-0 group-hover/card:opacity-100 transition-opacity"></div>

                                                    <div className="flex items-center gap-4 relative z-10">
                                                        <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-300 font-black flex items-center justify-center text-lg border border-slate-700 overflow-hidden">
                                                            {s.photoURL ? <img src={s.photoURL} alt={s.memberName} className="w-full h-full object-cover" /> : s.memberName.charAt(0)}
                                                        </div>
                                                        <div className="flex flex-col justify-center min-w-0">
                                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                                <h4 className="font-bold text-white text-base truncate">{s.memberName}</h4>
                                                                <Info className="w-3 h-3 shrink-0 text-slate-600 group-hover/card:text-blue-400 transition-colors" />
                                                            </div>
                                                            {isMonthlyCard && (
                                                                <p className="text-[11px] text-slate-500 font-medium mb-1.5">{s.daysPresent || 0} Days Present</p>
                                                            )}
                                                            <div className="flex items-center gap-1.5 opacity-70 group-hover/card:opacity-100 transition-opacity mt-1">
                                                                {isMonthlyCard ? (
                                                                    <>
                                                                        <div className="flex items-center gap-1 w-20">
                                                                            <span className="text-[8px] font-black text-blue-400 tracking-wider">VAR</span>
                                                                            <div className="h-1.5 rounded-full bg-blue-500/20 flex-1 overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${varPercent}%` }}></div></div>
                                                                        </div>
                                                                        <div className="flex items-center gap-1 w-20">
                                                                            <span className="text-[8px] font-black text-rose-400 tracking-wider">FIX</span>
                                                                            <div className="h-1.5 rounded-full bg-rose-500/20 flex-1 overflow-hidden"><div className="h-full bg-rose-500" style={{ width: `${fixedPercent}%` }}></div></div>
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <div className="flex items-center gap-1 w-32">
                                                                        <span className="text-[8px] font-black text-indigo-400 tracking-wider">EXP</span>
                                                                        <div className="h-1.5 rounded-full bg-indigo-500/20 flex-1 overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: `${Math.min((paidAmount / ((grandTotal / memberCount) || 1)) * 100, 100)}%` }}></div></div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end relative z-10">
                                                        <div className={`px-4 py-2 rounded-xl text-sm font-black flex items-center gap-2 mb-1 ${s.netBalance >= 0.5 ? 'bg-[#064e3b]/40 text-[#34d399] border border-[#34d399]/20' :
                                                            s.netBalance <= -0.5 ? 'bg-[#7f1d1d]/40 text-[#f87171] border border-[#f87171]/20' :
                                                                'bg-white/[0.05] text-slate-400 border border-white/[0.1]'
                                                            }`}>
                                                            {s.netBalance >= 0.5 ? (<>Get ₹{s.netBalance.toFixed(0)} <ArrowUpRight className="w-4 h-4" /></>) :
                                                                s.netBalance <= -0.5 ? (<>Pay ₹{Math.abs(s.netBalance).toFixed(0)} <ArrowDownLeft className="w-4 h-4" /></>) :
                                                                    'Cleared'}
                                                        </div>
                                                        <div className="text-[10px] font-medium text-slate-500">
                                                            Paid ₹{((s.variableExpense || 0) + (s.fixedExpense || 0)).toFixed(0)}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

// 5. Member Detailed Breakdown Drawer (Level 2)
// ---------------------------------------------------------------------------
const MemberDetailDrawer = ({ isOpen, member, onClose }) => {
    if (!member) return null;

    const { calcDetails, mode } = member;
    const isMonthly = mode === 'monthly';
    const customItems = member.customSplitItems || [];

    // --- Section 1: Core Shared Expenses (mode-aware) ---
    const sharedItems = [];
    sharedItems.push({
        icon: <BarChart3 className="w-4 h-4" />,
        name: "Variable Share",
        desc: isMonthly
            ? `${member.daysPresent || 0} Days Attendance Factor`
            : "Equal Group Expense Share",
        amount: `₹${(calcDetails?.varShare || 0).toFixed(0)}`,
        type: 'debit'
    });
    if ((calcDetails?.fixedShare || 0) > 0) {
        sharedItems.push({
            icon: <Receipt className="w-4 h-4" />,
            name: "Fixed Basic Share",
            desc: "Equal Group Split",
            amount: `₹${(calcDetails?.fixedShare || 0).toFixed(0)}`,
            type: 'debit'
        });
    }

    // --- Section 2: Real Custom Split Items from "For What?" field ---
    const customSplitSection = customItems.map(it => ({
        icon: <UtensilsCrossed className="w-4 h-4" />,
        name: it.description || 'Unnamed Expense',
        desc: `Paid by ${it.paidByName} · Split ${it.involvedCount} ways`,
        amount: `₹${(it.yourShare || 0).toFixed(0)}`,
        type: 'debit'
    }));

    // --- Section 3: Adjustments & Credits ---
    const adjustmentItems = [{
        icon: <ArrowUpRight className="w-4 h-4" />,
        name: "Your Payments",
        desc: isMonthly ? "Total Contributed This Month" : "Total Amount You Paid",
        amount: `₹${(calcDetails?.paidAmount || 0).toFixed(0)}`,
        type: 'credit'
    }];
    if (Math.abs(member.arrearsCarriedIn || 0) > 0) {
        adjustmentItems.push({
            icon: <TrendingUp className="w-4 h-4" />,
            name: isMonthly ? "Previous Month Arrears" : "Previous Balance",
            desc: member.arrearsCarriedIn > 0 ? "Owed to you — Credit" : "Your Previous Debt",
            amount: `₹${Math.abs(member.arrearsCarriedIn || 0).toFixed(0)}`,
            type: member.arrearsCarriedIn > 0 ? 'credit' : 'debit'
        });
    }

    const categoryGroups = [
        { section: "GROUP SHARED EXPENSES", items: sharedItems },
        ...(customSplitSection.length > 0
            ? [{ section: "CUSTOM SPLITS (SIDE EXPENSES)", items: customSplitSection }]
            : []),
        { section: "ADJUSTMENTS & CREDITS", items: adjustmentItems }
    ];

    return (
        <div className={`fixed inset-y-0 right-0 w-full sm:w-[480px] z-[60] p-4 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="h-full bg-[#161a24] rounded-[2.5rem] border border-white/[0.1] shadow-2xl overflow-hidden flex flex-col relative">

                {/* Visual Glass Edge Light */}
                <div className="absolute top-0 left-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>

                {/* Header */}
                <div className="p-8 pt-10">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-white/10 flex items-center justify-center text-2xl font-black text-white overflow-hidden shadow-xl">
                                {member.photoURL ? (
                                    <img src={member.photoURL} alt={member.memberName} className="w-full h-full object-cover" />
                                ) : member.memberName.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight leading-none mb-2">{member.memberName}</h2>
                                <div className="flex flex-wrap gap-2">
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${member.netBalance >= 0
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                        }`}>
                                        {member.netBalance >= 0 ? 'Get' : 'Owe'} ₹{Math.abs(member.netBalance).toFixed(0)}
                                    </div>
                                    <div className="px-3 py-1 bg-white/5 border border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                                        {isMonthly ? 'Monthly Ledger' : 'Normal Split'}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 rounded-full bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-8 pb-36">
                    {categoryGroups.map((sec, i) => (
                        <div key={i} className="mb-8">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 pl-1">{sec.section}</h4>
                            <div className="space-y-3">
                                {sec.items.map((it, j) => (
                                    <div key={j} className="bg-white/[0.03] p-4 rounded-3xl border border-white/[0.05] group/row transition-all hover:bg-white/[0.05]">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                {/* Icon with always-visible tint */}
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-colors ${it.type === 'credit'
                                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                    : 'bg-slate-700/50 border-white/10 text-slate-300'
                                                    }`}>
                                                    {it.icon}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-white">{it.name}</p>
                                                    <p className="text-[10px] text-slate-500 font-medium">{it.desc}</p>
                                                </div>
                                            </div>
                                            <div className="text-right ml-4">
                                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-0.5">
                                                    {it.type === 'credit' ? 'CREDIT' : 'DEBIT'}
                                                </p>
                                                <p className={`font-black text-base tracking-tight ${it.type === 'credit' ? 'text-emerald-400' : 'text-white'}`}>
                                                    {it.type === 'credit' ? '+' : ''}{it.amount}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Net Summary */}
                    <div className="mb-8 p-4 rounded-3xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
                        <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Net Balance</p>
                            <p className="text-xs text-slate-500 font-medium">Payments − Total Costs</p>
                        </div>
                        <p className={`font-black text-2xl tracking-tight ${member.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {member.netBalance >= 0 ? '+' : ''}₹{member.netBalance.toFixed(0)}
                        </p>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="absolute bottom-0 left-0 right-0 p-8 glass-nav">
                    <button className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex justify-center items-center gap-3 ${member.netBalance >= 0
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
                        : 'bg-[#F24444] hover:bg-[#ff5555] text-white shadow-rose-900/40'
                        }`}>
                        <CreditCard className="w-5 h-5" />
                        {member.netBalance >= 0
                            ? `RECEIVE ₹${member.netBalance.toFixed(0)}`
                            : `PAY ₹${Math.abs(member.netBalance).toFixed(0)} NOW`}
                    </button>
                </div>

            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// 6. Main Component Route/Overlay
// ---------------------------------------------------------------------------
const LedgerModal = ({ isOpen, onClose, archives, groupId }) => {
    const [selectedMember, setSelectedMember] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const PAGE_SIZE = 5;

    if (!isOpen) return null;

    const totalMonths = archives?.length ?? 0;
    const totalVariable = archives?.reduce((s, a) => s + (a.totalVariable || 0), 0) ?? 0;
    const totalFixed = archives?.reduce((s, a) => s + (a.totalFixed || 0), 0) ?? 0;
    const totalSpend = totalVariable + totalFixed;

    const handleSelectMember = (member, date, mode) => {
        setSelectedMember({ ...member, date, mode });
        setIsDrawerOpen(true);
    };

    // Sort once, then slice for current page
    const sortedArchives = [...(archives || [])]
        .filter(a => a && (a.id || a.docId))
        .map(a => ({ ...a, id: a.id || a.docId }))
        .sort((a, b) => new Date(b.closedAt || b.date) - new Date(a.closedAt || a.date));
    const totalPages = Math.ceil(sortedArchives.length / PAGE_SIZE);
    const pageArchives = sortedArchives.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);


    return (
        <div className="fixed inset-0 z-50 bg-mesh-dark overflow-y-auto selection:bg-blue-500/30">
            <style>{globalStyles}</style>

            {/* Dimming/Dark Overlay for Progressive Disclosure Drawer */}
            <div
                className={`fixed inset-0 z-[55] transition-all duration-700 drawer-blur ${isDrawerOpen ? 'dim-overlay opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsDrawerOpen(false)}
            />

            {/* Level 2 Drawer */}
            <MemberDetailDrawer
                isOpen={isDrawerOpen}
                member={selectedMember}
                onClose={() => setIsDrawerOpen(false)}
            />

            {/* Global Header */}
            <div className={`fixed top-0 left-0 right-0 h-16 glass-nav z-40 px-6 flex items-center justify-between transition-all duration-700 ${isDrawerOpen ? 'blur-sm scale-[0.98] opacity-50' : ''}`}>
                <div className="flex items-center gap-4">
                    {/* Logo styled like image */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 text-white font-black">
                            ₹
                        </div>
                        <span className="font-extrabold text-white tracking-tight font-inter">FairSplit</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.05] text-slate-400 flex items-center justify-center hover:bg-white/[0.1] hover:text-white transition-colors">
                        <Activity className="w-5 h-5" />
                    </button>
                    {/* Glowing active header icon mock */}
                    <button className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/[0.1] text-white flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                        <BookOpen className="w-5 h-5" />
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-[#0b0e14]"></div>
                    </button>
                    <button className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.05] text-slate-400 flex items-center justify-center hover:bg-white/[0.1] hover:text-white transition-colors">
                        <Settings className="w-5 h-5" />
                    </button>
                    <div className="w-px h-6 bg-white/[0.1] mx-1"></div>
                    <button className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.05] text-slate-400 flex items-center justify-center hover:bg-white/[0.1] hover:text-white transition-colors">
                        <HelpCircle className="w-5 h-5" />
                    </button>
                    <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.05] text-slate-400 flex items-center justify-center hover:bg-white/[0.1] hover:text-white transition-colors">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Main Content Container */}
            <div className={`pt-28 pb-32 px-4 max-w-6xl mx-auto min-h-screen transition-all duration-700 ${isDrawerOpen ? 'blur-md scale-[0.98] opacity-50' : ''}`}>

                {/* 3D Coin Graphic and Title Area */}
                <div className="flex items-start gap-8 mb-10 pl-4 relative">
                    {/* Simplified CSS 3D stack representation */}
                    <div className="relative w-24 h-24 hidden md:block">
                        {[0, 1, 2, 3].map(i => (
                            <div
                                key={i}
                                className="absolute w-16 h-16 rounded-full border border-blue-400/30 backdrop-blur-md shadow-xl flex items-center justify-center text-white/50 font-black text-2xl"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)',
                                    top: `${i * -6}px`,
                                    left: `${i * 6}px`,
                                    zIndex: 10 - i,
                                    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2), 0 5px 15px rgba(0,0,0,0.5)'
                                }}
                            >
                                {i === 0 && '₹'}
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 w-full">
                        {/* Top Metric Panels */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
                            {/* Panel 1: Total Spend */}
                            <div className="glass-card rounded-[1.5rem] p-5 relative overflow-hidden">
                                <div className="flex items-center gap-2 text-slate-400 mb-3">
                                    <TrendingUp className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Total Spend</span>
                                </div>
                                <div className="text-2xl font-black text-white mb-3">₹{totalSpend.toLocaleString('en-IN')}</div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-[70%]"></div>
                                </div>
                            </div>

                            {/* Panel 2: Variable */}
                            <div className="glass-card rounded-[1.5rem] p-5">
                                <div className="flex items-center justify-between text-slate-400 mb-2">
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Variable</span>
                                    </div>
                                    <Activity className="w-4 h-4 text-blue-500" />
                                </div>
                                <div className="text-2xl font-black text-white mb-2">₹{totalVariable.toLocaleString('en-IN')}</div>
                                <div className="flex items-end gap-1 h-6 mt-2 opacity-50">
                                    {[30, 50, 20, 80, 40, 60, 90, 40, 70, 50, 30].map((h, i) => (
                                        <div key={i} className="flex-1 bg-blue-500 rounded-t-sm" style={{ height: `${h}%` }}></div>
                                    ))}
                                </div>
                            </div>

                            {/* Panel 3: Fixed Bills */}
                            <div className="glass-card rounded-[1.5rem] p-5">
                                <div className="flex items-center justify-between text-slate-400 mb-4">
                                    <div className="flex items-center gap-2">
                                        <Receipt className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Fixed Bills</span>
                                    </div>
                                    <Settings className="w-4 h-4" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-400">
                                        <span>Paid</span>
                                        <span className="text-white text-lg">₹{totalFixed.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        <span>Capacity (PD)</span>
                                        <span className="text-slate-300">₹0</span>
                                    </div>
                                </div>
                            </div>

                            {/* Panel 4: Archives Count */}
                            <div className="glass-card rounded-[1.5rem] p-5">
                                <div className="flex items-center justify-between text-slate-400 mb-2">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Archives</span>
                                    </div>
                                    <BookOpen className="w-4 h-4 text-purple-500" />
                                </div>
                                <div className="text-2xl font-black text-white mb-2">{totalMonths} Records</div>
                                <div className="flex items-end gap-1.5 h-6 mt-2 opacity-50">
                                    {[40, 70, 50, 80, 90, 40, 60, 100].map((h, i) => (
                                        <div key={i} className="flex-1 bg-purple-500 rounded-t-sm" style={{ height: `${h}%` }}></div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Main Ledger Timeline Body */}
                        <div className="relative pl-2 md:pl-6 max-w-4xl">
                            {!archives || archives.length === 0 ? (
                                <div className="text-center py-20 border border-white/[0.05] rounded-[2rem] bg-white/[0.02]">
                                    <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Empty History</h3>
                                    <p className="text-xs text-slate-500 font-bold max-w-xs mx-auto mt-2">Historical records will be permanently snapshotted here in the integrated node tree.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Current page of ledger nodes */}
                                    {pageArchives.map(archive => (
                                        <LedgerNode
                                            key={archive.id}
                                            archive={archive}
                                            groupId={groupId}
                                            onSelectMember={handleSelectMember}
                                            selectedMemberId={selectedMember?.memberId}
                                        />
                                    ))}

                                    {/* Pagination Controls */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.05]">
                                            {/* Page info */}
                                            <div className="text-center">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Page</p>
                                                <p className="text-white font-black text-lg">{currentPage + 1}<span className="text-slate-600 text-sm font-bold"> / {totalPages}</span></p>
                                            </div>

                                            {/* Dot indicators */}
                                            <div className="flex items-center gap-2">
                                                {Array.from({ length: totalPages }).map((_, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setCurrentPage(i)}
                                                        className={`transition-all duration-300 rounded-full ${i === currentPage
                                                                ? 'w-6 h-2 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]'
                                                                : 'w-2 h-2 bg-slate-700 hover:bg-slate-500'
                                                            }`}
                                                    />
                                                ))}
                                            </div>

                                            {/* Prev / Next buttons */}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                                    disabled={currentPage === 0}
                                                    className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed bg-white/[0.03] border-white/[0.06] text-slate-400 hover:bg-white/[0.08] hover:text-white"
                                                >
                                                    ← Prev
                                                </button>
                                                <button
                                                    onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                                                    disabled={currentPage === totalPages - 1}
                                                    className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed bg-blue-600/20 border-blue-500/30 text-blue-400 hover:bg-blue-600/40 hover:text-white"
                                                >
                                                    Next →
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                    </div>
                </div>

            </div>

            {/* Persistent Floating Bottom Dock */}
            <div className={`fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4 transition-all duration-700 ${isDrawerOpen ? 'blur-sm scale-[0.98] opacity-50' : ''}`}>
                <div className="glass-nav p-2 rounded-full border border-white/[0.1] shadow-2xl flex items-center gap-2 pointer-events-auto">

                    {/* Home Button (Inactive, clicking exits overlay) */}
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-full flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors"
                    >
                        <Home className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
                    </button>

                    {/* Ledger Button (Active Glow) */}
                    <button className="px-8 py-3 rounded-full flex flex-col items-center gap-1 bg-white/[0.05] border border-white/[0.05] shadow-[0_0_20px_rgba(59,130,246,0.15)] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-500 rounded-t-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
                        <BookOpen className="w-5 h-5 text-blue-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white text-glow-blue relative z-10">Ledger</span>
                    </button>

                </div>
            </div>

        </div>
    );
};

export default LedgerModal;
