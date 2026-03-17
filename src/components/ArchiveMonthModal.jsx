import React, { useState, useEffect } from 'react';
import { Archive, X, Calendar as CalendarIcon, ArrowRight, Loader2 } from 'lucide-react';

const ArchiveMonthModal = ({ isOpen, onClose, onConfirm }) => {
    const [monthName, setMonthName] = useState('');
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && !isAnimatingOut) {
            setMonthName('');
            setIsAnimatingOut(false);
            setIsSubmitting(false);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen, isAnimatingOut]);

    const handleClose = () => {
        if (isAnimatingOut) return;
        setIsAnimatingOut(true);
        setTimeout(() => {
            setIsAnimatingOut(false);
            onClose();
        }, 300); // match transition duration
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!monthName.trim()) return;
        setIsSubmitting(true);
        // Small delay for UX feel
        setTimeout(() => {
            onConfirm(monthName.trim());
            // Implicitly onClose will be called by parent or we call it here
            setIsAnimatingOut(true);
            setTimeout(() => {
                setIsAnimatingOut(false);
                setIsSubmitting(false);
                onClose();
            }, 300);
        }, 600);
    };

    // Use visibility control instead of return null
    const isVisible = isOpen || isAnimatingOut;

    // Suggest a default name based on current date
    const suggestedName = new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isVisible && !isAnimatingOut ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Backdrop Blur */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                onClick={handleClose}
            ></div>

            {/* Modal Content */}
            <div className={`relative w-full max-w-md bg-white/90 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 transform ${isVisible && !isAnimatingOut ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>

                {/* Decorative Header Background */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 opacity-10"></div>

                <div className="relative p-6 sm:p-8">
                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100/50 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Icon */}
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 mb-6 transform -rotate-6">
                        <Archive className="w-8 h-8 text-white transform rotate-6" />
                    </div>

                    <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Archive Month</h2>
                    <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                        You are about to close the current dashboard. All balances will be carried forward as pending debts, and the exact expense breakdown will be saved permanently to your Ledger.
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <CalendarIcon className="w-3.5 h-3.5 text-indigo-500" />
                                Name your Archive
                            </label>
                            <input
                                autoFocus
                                type="text"
                                value={monthName}
                                onChange={(e) => setMonthName(e.target.value)}
                                placeholder={`e.g. "${suggestedName}" or "Goa Trip"`}
                                className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800 placeholder-slate-400 text-lg shadow-inner"
                                required
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isSubmitting}
                                className="flex-1 px-5 py-3.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors active:scale-95 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!monthName.trim() || isSubmitting}
                                className="flex-1 px-5 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Archiving...</>
                                ) : (
                                    <>Save Archive <ArrowRight className="w-4 h-4" /></>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ArchiveMonthModal;
