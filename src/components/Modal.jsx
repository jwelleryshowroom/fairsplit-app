import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg', variant = 'classic' }) => {
    const contentRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    // Keyboard-aware: when virtual keyboard opens, scroll focused input into view
    useEffect(() => {
        if (!isOpen) return;
        const handleFocus = (e) => {
            const el = e.target;
            if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
                setTimeout(() => {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 350); // wait for keyboard to fully open
            }
        };
        document.addEventListener('focusin', handleFocus);
        return () => document.removeEventListener('focusin', handleFocus);
    }, [isOpen]);

    if (!isOpen) return null;

    const isPremium = variant === 'premium';

    return (
        <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className={`w-full ${maxWidth} relative overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 ${isPremium ? 'p-[1.5px] rounded-t-[2rem] sm:rounded-[2rem]' : 'bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl'}`}
                onClick={e => e.stopPropagation()}
            >
                {isPremium && <div className="absolute inset-0 rgb-border" />}
                <div className={`relative h-full w-full overflow-hidden ${isPremium ? 'bg-white/40 backdrop-blur-3xl rounded-t-[calc(2rem-1.5px)] sm:rounded-[calc(2rem-1.5px)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]' : 'rounded-t-3xl sm:rounded-3xl'}`}>
                    {/* Drag handle on mobile */}
                    <div className="sm:hidden flex justify-center pt-3 pb-0">
                        <div className="w-10 h-1 bg-slate-200 rounded-full" />
                    </div>

                    {/* Honeypot: Visually hidden inputs to distract browser autofill heuristics */}
                    <div className="sr-only" aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, width: 1, height: 1, overflow: 'hidden', opacity: 0 }}>
                        <input type="text" name="name" autoComplete="name" tabIndex="-1" />
                        <input type="text" name="cc-number" autoComplete="cc-number" tabIndex="-1" />
                        <input type="text" name="address-level1" autoComplete="address-level1" tabIndex="-1" />
                    </div>

                    {/* Header */}
                    <div className={`px-5 py-3 md:px-8 md:py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 ${isPremium ? 'bg-white/20 backdrop-blur-xl' : 'bg-white'}`}>
                        <h3 className={`text-xl md:text-2xl font-bold ${isPremium ? 'text-slate-900 drop-shadow-sm' : 'text-slate-800'}`}>{title}</h3>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-full transition-all ${isPremium ? 'text-slate-600 hover:text-slate-900 hover:bg-white/40' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content — uses max-h with env(safe-area-inset-bottom) for keyboard safety */}
                    <div
                        ref={contentRef}
                        className="p-4 md:p-8 overflow-y-auto"
                        style={{ maxHeight: 'min(80vh, calc(100dvh - 120px))' }}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Modal;
