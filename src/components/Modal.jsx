import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg', variant = 'classic' }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    const isPremium = variant === 'premium';

    return (
        <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className={`w-full ${maxWidth} relative overflow-hidden animate-in zoom-in-95 duration-200 ${isPremium ? 'p-[1.5px] rounded-[2rem]' : 'bg-white rounded-3xl shadow-2xl'}`}
                onClick={e => e.stopPropagation()}
            >
                {isPremium && <div className="absolute inset-0 rgb-border" />}
                <div className={`relative h-full w-full overflow-hidden ${isPremium ? 'bg-white/40 backdrop-blur-3xl rounded-[calc(2rem-1.5px)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]' : 'rounded-3xl'}`}>
                    {/* Header */}
                    <div className={`px-8 py-6 border-b border-white/20 flex items-center justify-between sticky top-0 z-10 ${isPremium ? 'bg-white/20 backdrop-blur-xl' : 'bg-white'}`}>
                        <h3 className={`text-2xl font-bold ${isPremium ? 'text-slate-900 drop-shadow-sm' : 'text-slate-800'}`}>{title}</h3>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-full transition-all ${isPremium ? 'text-slate-600 hover:text-slate-900 hover:bg-white/40' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-8 max-h-[80vh] overflow-y-auto">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Modal;
