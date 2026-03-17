import React, { useState, useEffect } from 'react';
import { Clock, IndianRupee, History as HistoryIcon, Zap, CheckCircle, ArrowRight } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { db } from "../firebase";
import Modal from './Modal';
import { useSettings } from '../context/SettingsContext';

const ActivityFeedModal = ({ isOpen, onClose, groupId }) => {
    const { settings } = useSettings();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const emoji = (e) => settings.showEmojis ? e : '';

    useEffect(() => {
        if (!isOpen || !groupId) return;

        const q = query(
            collection(db, "v6_groups", groupId, "ledger"),
            orderBy("timestamp", "desc"),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            const data = snap.docs.map(doc => doc.data());
            setEvents(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isOpen, groupId]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Activity Feed ${emoji('📜')}`}
            maxWidth="max-w-md"
        >
            <div className="flex flex-col gap-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                        <Zap className="w-8 h-8 text-indigo-400 animate-pulse mb-3" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing history...</p>
                    </div>
                ) : events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                        <Clock className="w-12 h-12 text-slate-200 mb-4" />
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">No activity yet</p>
                        <p className="text-[10px] text-slate-300 mt-2 font-medium">Settlements will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        {events.map((ev, i) => (
                            <div key={ev.id || i} className="bg-white p-5 rounded-[2rem] border-2 border-slate-50 shadow-sm flex items-start gap-4 animate-in slide-in-from-bottom-2 duration-300">
                                {ev.type === 'settlement' ? (
                                    <>
                                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
                                            <CheckCircle className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-700 leading-tight">
                                                <span className="text-indigo-600">{ev.fromName}</span> {emoji('💸')} <span className="text-emerald-600 font-black">{ev.toName}</span>
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-2 text-slate-900 font-black text-lg">
                                                <span className="text-slate-300 text-sm">₹</span>
                                                <span>{ev.amount}</span>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between">
                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(ev.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg uppercase">Settlement</span>
                                            </div>
                                        </div>
                                    </>
                                ) : ev.type === 'month_closed' ? (
                                    <>
                                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shrink-0">
                                            <HistoryIcon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-700 leading-tight">
                                                Month <span className="text-amber-600 font-black">{ev.monthName || 'Closed'}</span> {emoji('📦')} Finalized
                                            </p>
                                            <div className="flex items-center gap-3 mt-3">
                                                <span className="text-[9px] font-black text-indigo-400 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-wider">Var: ₹{ev.totalVariable}</span>
                                                <span className="text-[9px] font-black text-violet-400 bg-violet-50 px-2 py-1 rounded-lg uppercase tracking-wider">Fix: ₹{ev.totalFixed}</span>
                                            </div>
                                            <div className="mt-4 flex items-center justify-between">
                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(ev.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                <span className="text-[9px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded-lg uppercase">Archive</span>
                                            </div>
                                        </div>
                                    </>
                                ) : null}
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex justify-center mt-2">
                    <button onClick={onClose} className="w-full py-4 bg-slate-50 text-slate-400 font-black uppercase tracking-widest rounded-2xl hover:bg-slate-100 hover:text-slate-600 transition-all active:scale-[0.98]">
                        Dismiss {emoji('👋')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ActivityFeedModal;
