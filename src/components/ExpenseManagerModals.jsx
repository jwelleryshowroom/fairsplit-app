import React from 'react';
import { AlertCircle, Loader2, MessageSquare, Check, Copy, X } from 'lucide-react';
import Modal from './Modal';
import OnboardingTour from './OnboardingTour';
import LedgerModal from './LedgerModal';
import ArchiveMonthModal from './ArchiveMonthModal';
import ActivityFeedModal from './ActivityFeedModal';
import { CustomSplitModal } from './CustomSplitManager';
import ReceiptSplitterModal from './ReceiptSplitterModal';
import ConfirmModal from './ConfirmModal';

const ExpenseManagerModals = ({
    // Modals visibility state
    showOnboarding, closeOnboarding,
    showLedger, setShowLedger, archives, groupId,
    showArchiveModal, setShowArchiveModal, confirmCloseMonth,
    showActivityFeed, setShowActivityFeed,
    isCustomSplitModalOpen, setIsCustomSplitModalOpen, members, customSplits, updateCustomSplits,
    customSplitInitialData, setCustomSplitInitialData,
    showReceiptModal, setShowReceiptModal, handleConfirmReceiptSplits,
    confirmConfig, setConfirmConfig,
    
    // Smart Parse State
    showParseModal, setShowParseModal, emoji,
    parseError, parseText, setParseText, handleSmartParse, isParsing,
    
    // Draft Message State
    showDraftModal, setShowDraftModal, isDrafting, draftedMessage,
    copyToClipboard, copySuccess,
    user
}) => {
    return (
        <>
            <OnboardingTour isOpen={showOnboarding} onClose={closeOnboarding} />
            <LedgerModal isOpen={showLedger} onClose={() => setShowLedger(false)} archives={archives} groupId={groupId} user={user} />
            <ArchiveMonthModal
                isOpen={showArchiveModal}
                onClose={() => setShowArchiveModal(false)}
                onConfirm={confirmCloseMonth}
            />
            <ActivityFeedModal
                isOpen={showActivityFeed}
                onClose={() => setShowActivityFeed(false)}
                groupId={groupId}
            />

            <Modal
                isOpen={showParseModal}
                onClose={() => setShowParseModal(false)}
                title={`AI Smart Add ${emoji('✨')}`}
                maxWidth="max-w-md"
            >
                <p className="text-slate-400 text-xs font-medium mb-6 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    Paste raw text (messages, notes, or bills). Our AI will extract individual amounts and add them instantly.
                </p>

                {
                    parseError && (
                        <div className="text-red-500 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 bg-red-50 p-3 rounded-xl border border-red-100 animate-pulse">
                            <AlertCircle className="w-4 h-4" /> {parseError}
                        </div>
                    )
                }

                <textarea
                    autoFocus
                    className="w-full h-40 bg-slate-50 border-2 border-slate-100 p-5 rounded-[2rem] outline-none focus:border-indigo-500 font-bold text-slate-700 placeholder-slate-300 transition-all mb-6 resize-none"
                    placeholder="Example: Dinner 450, Drinks 200, Car 100"
                    value={parseText}
                    onChange={(e) => setParseText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && e.metaKey && handleSmartParse()}
                />

                <div className="flex gap-3">
                    <button onClick={() => setShowParseModal(false)} className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600">Cancel</button>
                    <button
                        onClick={handleSmartParse}
                        disabled={!parseText.trim() || isParsing}
                        className="flex-[2] bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                    >
                        {isParsing ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Extract Now {emoji('🚀')}</>}
                    </button>
                </div>
            </Modal>

            {
                showDraftModal && (
                    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowDraftModal(false)}>
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 relative" onClick={e => e.stopPropagation()}>
                            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2"><MessageSquare className="w-6 h-6 text-emerald-600" /> Draft Message</h3>
                            {isDrafting ? (
                                <div className="h-48 flex flex-col items-center justify-center text-slate-400 gap-3">
                                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                                    <span className="text-sm font-medium">Writing perfect message...</span>
                                </div>
                            ) : (
                                <textarea readOnly className="w-full h-48 bg-slate-50 p-4 rounded-xl text-sm border border-slate-200 focus:outline-none resize-none font-mono text-slate-600" value={draftedMessage} />
                            )}
                            <div className="flex gap-2 mt-4">
                                <button onClick={copyToClipboard} className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2">
                                    {copySuccess ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Text</>}
                                </button>
                            </div>
                            <button onClick={() => setShowDraftModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                    </div>
                )
            }

            <CustomSplitModal
                isOpen={isCustomSplitModalOpen}
                onClose={() => setIsCustomSplitModalOpen(false)}
                members={members}
                customSplits={customSplits}
                setCustomSplits={updateCustomSplits}
                initialData={customSplitInitialData}
                setInitialData={setCustomSplitInitialData}
            />

            <ReceiptSplitterModal
                isOpen={showReceiptModal}
                onClose={() => setShowReceiptModal(false)}
                members={members}
                onConfirmSplits={handleConfirmReceiptSplits}
            />

            <ConfirmModal
                {...confirmConfig}
                onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </>
    );
};

export default ExpenseManagerModals;
