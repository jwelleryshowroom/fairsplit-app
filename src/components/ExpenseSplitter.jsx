import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, X, Check } from 'lucide-react';

// Hooks
import { useGroupData } from '../hooks/useGroupData';
import { useSettlementEngine } from '../hooks/useSettlementEngine';
import { useInsightsAI } from '../hooks/useInsightsAI';
import { useMonthManager } from '../hooks/useMonthManager';
import { useSettings } from '../context/SettingsContext';

// Layout Components
import LoadingScreen from './LoadingScreen';
import GroupHeader from './GroupHeader';
import StatusBanner from './StatusBanner';
import ResultsDashboard from './ResultsDashboard';
import MembersGrid from './MembersGrid';
import SettlementPlan from './SettlementPlan';
import ExpenseManagerModals from './ExpenseManagerModals';
import FloatingDock from './FloatingDock';
import SettingsDrawer from './SettingsDrawer';
import SmartInbox from './SmartInbox';
import { useSmartInbox } from '../hooks/useSmartInbox';

const pulseAnimation = `
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
`;

const shimmerAnimation = `
  @keyframes shimmer {
    100% { transform: translateX(200%); }
  }
`;

const ExpenseSplitter = ({ user, groupId, initialRoomName, onLeaveGroup }) => {
    const { settings } = useSettings();
    const emoji = (e) => settings.showEmojis ? e : '';

    // Modals & UI Toggles
    const [isMonthlyMode, setIsMonthlyMode] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(!localStorage.getItem('fairsplit_onboarded'));
    const closeOnboarding = () => { setShowOnboarding(false); localStorage.setItem('fairsplit_onboarded', 'true'); };
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [showLedger, setShowLedger] = useState(false);
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [showActivityFeed, setShowActivityFeed] = useState(false);
    const [isCustomSplitModalOpen, setIsCustomSplitModalOpen] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', type: 'warning', hideCancel: false, onConfirm: () => { } });
    const [showSettings, setShowSettings] = useState(false);
    const [showSmartInbox, setShowSmartInbox] = useState(false);

    // Dev Console
    const [devMode, setDevMode] = useState(false);
    const [copyCodeSuccess, setCopyCodeSuccess] = useState(false);
    const copyGroupCode = () => { navigator.clipboard.writeText(groupId); setCopyCodeSuccess(true); setTimeout(() => setCopyCodeSuccess(false), 2000); };

    // --- HOOKS ---
    const {
        daysInMonth, setDaysInMonth,
        members, setMembers,
        customSplits, setCustomSplits,
        archives, loadingData,
        roomName, groupExists, saveData
    } = useGroupData(groupId, user, initialRoomName);

    // Smart Inbox
    const {
        pendingTransactions, pendingCount, userGroups,
        isLoading: inboxLoading, addTransaction, assignToGroup, markPersonal, scanClipboard
    } = useSmartInbox(user);

    const {
        results, setResults, isSettled, pendingDebts,
        error, setError, invalidMemberIds, setInvalidMemberIds,
        isModifying, setIsModifying, isShimmering,
        handleCalculateWithShimmer, handleUnifiedSettle
    } = useSettlementEngine(groupId, members, customSplits, daysInMonth, setMembers, saveData, setConfirmConfig, settings);

    const [insights, setInsights] = useState('');
    const [isInsightsMinimized, setIsInsightsMinimized] = useState(false);
    const [mobileTab, setMobileTab] = useState('members');

    const {
        showParseModal, setShowParseModal, activeMemberId, openSmartAddModal,
        parseText, setParseText, isParsing, parseError, handleSmartParse,
        showDraftModal, setShowDraftModal, isDrafting, draftedMessage, handleDraftMessage,
        isGeneratingInsights, generateInsights
    } = useInsightsAI(members, results, roomName, saveData, setInsights);

    const { handleCloseMonth, confirmCloseMonth } = useMonthManager(
        groupId, members, customSplits, results, daysInMonth, isMonthlyMode, setConfirmConfig, setShowArchiveModal, saveData, setResults
    );
    // -------------

    // Member Manager Functions
    const addMember = () => {
        const newMember = { id: Date.now(), name: '', daysAbsent: 0, expenseInput: '', fixedExpenseInput: '', arrears: 0, isActive: true };
        saveData([newMember, ...members], undefined, undefined);
        setResults(null);
    };

    const removeMember = (id) => {
        const member = members.find(m => m.id.toString() === id.toString());
        if (!member) return;
        let newMembers = members;
        if (Math.abs(parseFloat(member.arrears || 0)) > 0.01) {
            newMembers = members.map(m => m.id.toString() === id.toString() ? { ...m, isActive: false } : m);
        } else {
            newMembers = members.filter(m => m.id.toString() !== id.toString());
        }
        saveData(newMembers, undefined, undefined);
        setResults(null);
    };

    const handleNameSplit = (memberId, rawNameStr) => {
        const names = rawNameStr.split(/[,&+\/\n]| and /i).map(n => n.trim()).filter(n => n !== '');
        if (names.length <= 1) return;
        const firstName = names[0];
        const newMembersToAdd = names.slice(1).map(name => ({ id: Date.now() + Math.random(), name: name, daysAbsent: 0, expenseInput: '', fixedExpenseInput: '' }));
        const updatedMembers = members.flatMap(m => (m.id.toString() === memberId.toString() ? [{ ...m, name: firstName }, ...newMembersToAdd] : m));
        saveData(updatedMembers, undefined, undefined);
        setResults(null);
    };

    const updateMember = (id, f, v) => {
        if (f === 'daysAbsent') {
            if (v !== '' && parseInt(v) < 0) v = '0';
            const maxDays = parseInt(daysInMonth) || 30;
            if (v !== '' && parseInt(v) > maxDays) v = String(maxDays);
        }
        const updatedMembers = members.map(m => m.id.toString() === id.toString() ? { ...m, [f]: v } : m);
        setMembers(updatedMembers);

        let updatedSplits = [...customSplits];
        if (f === 'name' && v.trim() !== '') {
            const newName = v.trim().toLowerCase();
            let splitsChanged = false;
            updatedSplits = updatedSplits.map(split => {
                const newInvolved = split.involvedIds.map(involvedId => {
                    if (typeof involvedId === 'string' && involvedId.startsWith('EXT:') && involvedId.replace('EXT:', '').toLowerCase() === newName) {
                        splitsChanged = true; return id;
                    }
                    return involvedId;
                });
                const uniqueInvolved = [...new Set(newInvolved)];
                if (uniqueInvolved.length !== split.involvedIds.length) splitsChanged = true;
                return { ...split, involvedIds: uniqueInvolved };
            });
            if (splitsChanged) {
                saveData(updatedMembers, undefined, updatedSplits);
                setResults(null); return;
            }
        }
        saveData(updatedMembers, undefined, undefined);
        setResults(null);
        if (f === 'name' && v.trim() !== '' && invalidMemberIds.includes(id)) {
            setInvalidMemberIds(prev => prev.filter(mid => mid !== id));
            if (invalidMemberIds.length <= 1) setError('');
        }
    };

    const updateDays = (val) => {
        if (val !== '' && parseInt(val) < 0) val = '0';
        setDaysInMonth(val);
        saveData(undefined, val, undefined);
    };

    const updateCustomSplits = (newSplits) => saveData(undefined, undefined, newSplits);
    const handleConfirmReceiptSplits = (newSplits) => { saveData(members, undefined, [...customSplits, ...newSplits]); setShowReceiptModal(false); };

    // Rendering Checks
    if (loadingData) return <LoadingScreen message="Loading expenses..." />;
    if (!groupExists) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-red-100 text-center max-w-sm">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Group Not Found</h3>
                <p className="text-slate-500 mb-6">This group (ID: {groupId}) does not exist or has been deleted.</p>
                <button onClick={onLeaveGroup} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800">Go Home</button>
            </div>
        </div>
    );

    const totalArr = members.reduce((sum, m) => sum + (parseFloat(m.arrears) || 0), 0);

    return (
        <div className="min-h-screen font-sans relative overflow-x-hidden" style={{ backgroundColor: '#F3F4F6' }}>
            <style>{pulseAnimation}{shimmerAnimation}</style>

            {/* Settings Drawer - rendered at root level to escape backdrop-filter stacking context */}
            <SettingsDrawer
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                onLeaveGroup={onLeaveGroup}
                onShowHelp={() => { setShowSettings(false); setShowOnboarding(true); }}
                user={user}
            />

            {/* Smart Inbox - rendered at root level, same z-index escape as SettingsDrawer */}
            <SmartInbox
                isOpen={showSmartInbox}
                onClose={() => setShowSmartInbox(false)}
                pendingTransactions={pendingTransactions}
                userGroups={userGroups}
                isLoading={inboxLoading}
                currentGroupId={groupId}
                currentGroupName={roomName}
                onAssign={assignToGroup}
                onPersonal={markPersonal}
                onAddManual={addTransaction}
                onScanClipboard={scanClipboard}
            />

            {/* Mesh Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-300/30 rounded-full blur-[100px] mix-blend-multiply animate-pulse duration-[10000ms]" />
                <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-purple-300/30 rounded-full blur-[100px] mix-blend-multiply animate-pulse duration-[8000ms]" />
                <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] bg-blue-300/30 rounded-full blur-[100px] mix-blend-multiply animate-pulse duration-[12000ms]" />
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
            </div>

            <ExpenseManagerModals
                showOnboarding={showOnboarding} closeOnboarding={closeOnboarding}
                showLedger={showLedger} setShowLedger={setShowLedger} archives={archives} groupId={groupId}
                showArchiveModal={showArchiveModal} setShowArchiveModal={setShowArchiveModal} confirmCloseMonth={confirmCloseMonth}
                showActivityFeed={showActivityFeed} setShowActivityFeed={setShowActivityFeed}
                isCustomSplitModalOpen={isCustomSplitModalOpen} setIsCustomSplitModalOpen={setIsCustomSplitModalOpen} members={members} customSplits={customSplits} updateCustomSplits={updateCustomSplits}
                showReceiptModal={showReceiptModal} setShowReceiptModal={setShowReceiptModal} handleConfirmReceiptSplits={handleConfirmReceiptSplits}
                confirmConfig={confirmConfig} setConfirmConfig={setConfirmConfig}
                showParseModal={showParseModal} setShowParseModal={setShowParseModal} emoji={emoji}
                parseError={parseError} parseText={parseText} setParseText={setParseText} handleSmartParse={handleSmartParse} isParsing={isParsing}
                showDraftModal={showDraftModal} setShowDraftModal={setShowDraftModal} isDrafting={isDrafting} draftedMessage={draftedMessage}
                copyToClipboard={() => { navigator.clipboard.writeText(draftedMessage); }} copySuccess={false}
            />

            <GroupHeader
                onLeaveGroup={onLeaveGroup} roomName={roomName} groupId={groupId}
                copyGroupCode={copyGroupCode} copyCodeSuccess={copyCodeSuccess}
                devMode={devMode} setDevMode={setDevMode}
                setShowActivityFeed={setShowActivityFeed} setShowLedger={setShowLedger} setShowOnboarding={setShowOnboarding}
                onOpenSettings={() => setShowSettings(true)}
                user={user}
            />

            <div className="relative z-10 w-full max-w-[1400px] mx-auto p-4 md:p-8 pb-32 md:pb-40">
                <StatusBanner isSettled={isSettled} setResults={setResults} generateInsights={generateInsights} isGeneratingInsights={isGeneratingInsights} setShowArchiveModal={setShowArchiveModal} />

                {Math.abs(totalArr) > 1 && members.length > 0 && (
                    <div className="mb-6 px-6 py-4 bg-red-50/80 backdrop-blur-xl border border-red-200/50 rounded-[2rem] shadow-sm animate-in slide-in-from-top-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 sm:mt-0" />
                            <span className="text-sm font-bold text-red-800 leading-tight">Warning: Group arrears are unbalanced by ₹{Math.abs(totalArr).toFixed(2)}. Final settlement checks may be offset.</span>
                        </div>
                        <button
                            onClick={() => { if (window.confirm("Zero out ALL arrears?")) saveData(members.map(m => ({ ...m, arrears: "0.00" }))); setResults(null); }}
                            className="text-xs font-black uppercase tracking-widest text-red-600 bg-white hover:bg-red-50 px-5 py-3 rounded-xl shadow-sm transition-colors"
                        >
                            Zero All Arrears
                        </button>
                    </div>
                )}

                {(!results || isModifying) && pendingDebts.length > 0 && (
                    <div className="mb-6 px-3 sm:px-6 py-3.5 sm:py-5 bg-orange-50/80 backdrop-blur-xl border border-orange-200/50 rounded-[1.25rem] sm:rounded-[2rem] shadow-sm animate-in slide-in-from-top-4 flex items-center gap-2.5 sm:gap-5 overflow-hidden">
                        {/* Label: Text on Laptop, Icon only on Mobile */}
                        <h3 className="hidden sm:flex text-xs font-black text-orange-800 items-center gap-2 uppercase tracking-[0.2em] flex-shrink-0">
                            <AlertCircle className="w-4 h-4" /> Pending Debts
                        </h3>
                        <div className="sm:hidden flex items-center justify-center w-8 h-8 bg-white/60 rounded-xl border border-orange-100 shadow-sm flex-shrink-0">
                            <AlertCircle className="w-4 h-4 text-orange-800" />
                        </div>

                        <div className="flex gap-2 sm:gap-3 flex-1 overflow-x-auto pb-1 -mb-1 no-scrollbar">
                            {pendingDebts.map((tx, idx) => (
                                <div key={idx} className="bg-white/95 p-2 sm:p-3 px-3 sm:px-4 rounded-xl sm:rounded-2xl shadow-sm border border-orange-100 flex items-center justify-between min-w-[180px] sm:min-w-[260px] flex-shrink-0 group overflow-hidden transition-all">
                                    <div className="text-[10px] sm:text-xs font-bold whitespace-nowrap overflow-hidden text-ellipsis">
                                        <span className="text-slate-800">{tx.from}</span> <span className="text-slate-400 font-medium">owes</span> <span className="text-slate-600">{tx.to}</span>
                                    </div>

                                    <div className="flex items-center gap-1.5 sm:gap-2 pl-2 sm:pl-4 ml-auto">
                                        <div className="font-mono font-black text-orange-600 text-xs sm:text-sm group-hover:-translate-x-1 transition-transform">₹{tx.amount}</div>
                                        <button
                                            onClick={() => handleUnifiedSettle(tx)}
                                            className="opacity-0 sm:opacity-0 group-hover:opacity-100 w-0 group-hover:w-6 sm:group-hover:w-7 h-6 sm:h-7 overflow-hidden ml-0 group-hover:ml-1 sm:group-hover:ml-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center justify-center transition-all duration-300 shadow-sm flex-shrink-0"
                                            title="Settle this debt instantly"
                                        >
                                            <Check className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {/* Mobile Tab Segmented Control */}
                <div className="lg:hidden flex bg-white/60 backdrop-blur-xl p-1.5 rounded-[1.25rem] mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/40 mx-auto max-w-sm sticky top-4 z-40">
                    <button
                        onClick={() => setMobileTab('members')}
                        className={`flex-1 py-3 px-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${mobileTab === 'members' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'}`}
                    >
                        Members Setup
                    </button>
                    <button
                        onClick={() => setMobileTab('overview')}
                        className={`flex-1 py-3 px-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${mobileTab === 'overview' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'}`}
                    >
                        Bill Overview
                    </button>
                </div>

                <div className={`grid lg:grid-cols-12 gap-6 lg:gap-8 transition-all duration-500 ${isSettled ? 'grayscale-[0.3]' : ''}`}>
                    <div className={`flex flex-col gap-6 lg:contents ${mobileTab !== 'overview' && 'hidden lg:flex'}`}>
                        <ResultsDashboard
                            results={results} isModifying={isModifying} isSettled={isSettled}
                            isMonthlyMode={isMonthlyMode} setIsMonthlyMode={setIsMonthlyMode}
                            daysInMonth={daysInMonth} updateDays={updateDays} pendingDebts={pendingDebts}
                            handleUnifiedSettle={handleUnifiedSettle}
                            insights={insights}
                            isInsightsMinimized={isInsightsMinimized}
                            setIsInsightsMinimized={setIsInsightsMinimized}
                            generateInsights={generateInsights}
                            isGeneratingInsights={isGeneratingInsights}
                            mobileHidden={false}
                        />

                        {/* Mobile Settlement Plan (Shows only in Overview Tab) */}
                        {mobileTab === 'overview' && results && !isModifying && (
                            <div className="lg:hidden w-full animate-in fade-in slide-in-from-bottom-4">
                                <SettlementPlan
                                    results={results} isSettled={isSettled}
                                    handleUnifiedSettle={handleUnifiedSettle} handleDraftMessage={handleDraftMessage} handleCloseMonth={handleCloseMonth}
                                />
                            </div>
                        )}
                    </div>

                    <div className={`${mobileTab !== 'members' ? 'hidden lg:flex' : 'flex'} flex-col gap-6 min-w-0 transition-all duration-700 ${!isModifying && results ? 'lg:col-span-5' : 'lg:col-span-8'}`}>
                        <MembersGrid
                            members={members} isModifying={isModifying} setIsModifying={setIsModifying} results={results} setResults={setResults} isSettled={isSettled}
                            daysInMonth={daysInMonth} isMonthlyMode={isMonthlyMode}
                            updateMember={updateMember} removeMember={removeMember} openSmartAddModal={openSmartAddModal} handleNameSplit={handleNameSplit}
                            invalidMemberIds={invalidMemberIds} isShimmering={isShimmering} addMember={addMember}
                            customSplits={customSplits} setIsCustomSplitModalOpen={setIsCustomSplitModalOpen}
                        />

                        {results && !isModifying && (
                            <div className="hidden lg:block w-full mt-4 animate-in fade-in slide-in-from-bottom-4">
                                <SettlementPlan
                                    results={results} isSettled={isSettled}
                                    handleUnifiedSettle={handleUnifiedSettle} handleDraftMessage={handleDraftMessage} handleCloseMonth={handleCloseMonth}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <FloatingDock
                isModifying={isModifying} results={results} isShimmering={isShimmering}
                handleCalculateWithShimmer={() => {
                    handleCalculateWithShimmer();
                    setMobileTab('overview');
                }} setShowReceiptModal={setShowReceiptModal} setIsModifying={setIsModifying}
                inboxCount={pendingCount}
                onOpenInbox={() => setShowSmartInbox(true)}
            />

            {error && (
                <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50">
                    <div className="bg-red-50/95 border-2 border-red-200 px-6 py-3 rounded-full flex gap-3 text-red-700">
                        <AlertTriangle className="w-5 h-5" />
                        <p className="text-xs font-black tracking-widest uppercase">{error}</p>
                        <button onClick={() => setError('')} className="p-1 hover:bg-red-100 rounded-full"><X className="w-4 h-4" /></button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpenseSplitter;
