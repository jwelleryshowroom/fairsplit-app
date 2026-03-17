import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", type = "warning", hideCancel = false }) => {
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Only lock scroll when truly open and visible
    useEffect(() => {
        if (isOpen && !isAnimatingOut) {
            document.body.style.overflow = 'hidden';
            setShowSuccess(false);
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
        }, 300);
    };

    const handleConfirm = () => {
        if (type === 'success') {
            setShowSuccess(true);
            setTimeout(() => {
                setIsAnimatingOut(true);
                setTimeout(() => {
                    setIsAnimatingOut(false);
                    onConfirm();
                }, 300);
            }, 1200);
        } else {
            setIsAnimatingOut(true);
            setTimeout(() => {
                setIsAnimatingOut(false);
                onConfirm();
            }, 300);
        }
    };

    const isWarning = type === 'warning';
    const isSuccessType = type === 'success';

    // If not open and not animating out, visually hide it completely
    const isVisible = isOpen || isAnimatingOut;

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${isVisible && !isAnimatingOut ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={handleClose}
            ></div>

            <div className={`relative w-full max-w-sm bg-white/95 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl p-6 overflow-hidden transition-all duration-300 transform ${isVisible && !isAnimatingOut ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>

                {/* Decorative background element */}
                <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 ${isWarning ? 'bg-amber-400' : isSuccessType ? 'bg-emerald-400' : 'bg-indigo-400'}`}></div>

                <div className="relative flex flex-col items-center text-center">
                    {showSuccess ? (
                        <div className="flex flex-col items-center justify-center py-6 animate-in zoom-in duration-300">
                            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 bg-emerald-100 text-emerald-500 border-4 border-emerald-50 ring-8 ring-white/50">
                                <CheckCircle2 className="w-10 h-10 animate-bounce" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Success!</h3>
                            <p className="text-slate-500 font-medium">Debt officially settled.</p>
                        </div>
                    ) : (
                        <>
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border-4 ring-8 ring-white/50 ${isWarning ? 'bg-amber-100 text-amber-500 border-amber-50' : isSuccessType ? 'bg-emerald-100 text-emerald-500 border-emerald-50' : 'bg-indigo-100 text-indigo-500 border-indigo-50'}`}>
                                {isWarning ? <AlertCircle className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
                            </div>

                            <h3 className="text-xl font-bold text-slate-800 mb-2">
                                {title}
                            </h3>

                            <p className="text-slate-600 text-sm mb-8 leading-relaxed">
                                {message}
                            </p>

                            <div className="flex gap-3 w-full">
                                {!hideCancel && (
                                    <button
                                        onClick={handleClose}
                                        className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors active:scale-95"
                                    >
                                        {cancelText}
                                    </button>
                                )}
                                <button
                                    onClick={hideCancel ? handleClose : handleConfirm}
                                    className={`flex-1 py-3 px-4 font-bold rounded-xl transition-all shadow-lg active:scale-95 ${isWarning ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30 text-white border border-amber-400' : isSuccessType ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30 text-white border border-emerald-400' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30 text-white border border-indigo-500'}`}
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
