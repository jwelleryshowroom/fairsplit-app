import React, { useState } from 'react';
import { User } from 'lucide-react';

/**
 * Robust User Avatar Component with Image Error Handling
 * 
 * Falls back to an Initial-based gradient avatar if:
 * 1. photoURL is missing
 * 2. photoURL fails to load (onError)
 */
const UserAvatar = ({ 
    user, 
    name, 
    photoURL, 
    size = 'md', 
    className = "", 
    alt = "Profile" 
}) => {
    const [hasError, setHasError] = useState(false);

    // Dynamic props handling
    const displayPhoto = photoURL || user?.photoURL;
    const displayName = name || user?.displayName || user?.email || 'G';
    const initial = displayName[0].toUpperCase();

    // Deterministic Gradient for initials (same logic from CustomSplitManager)
    const getGradient = (seed = '') => {
        const gradients = [
            'from-indigo-500 to-purple-500',
            'from-emerald-500 to-teal-500',
            'from-rose-500 to-orange-500',
            'from-blue-500 to-indigo-500',
            'from-amber-500 to-orange-500',
            'from-violet-500 to-fuchsia-500',
            'from-cyan-500 to-blue-500',
        ];
        let hash = 0;
        for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
        return gradients[Math.abs(hash) % gradients.length];
    };

    const gradient = getGradient(displayName);

    // Size mappings
    const sizeClasses = {
        'xs': 'w-6 h-6 text-[10px]',
        'sm': 'w-8 h-8 text-xs',
        'md': 'w-10 h-10 text-sm',
        'lg': 'w-14 h-14 md:w-20 md:h-20 text-2xl md:text-3xl',
        'xl': 'w-24 h-24 text-3xl'
    };

    const currentSize = sizeClasses[size] || sizeClasses['md'];

    if (displayPhoto && !hasError) {
        return (
            <div className={`relative ${currentSize} rounded-full overflow-hidden border-2 border-white/60 shadow-sm flex-shrink-0 bg-slate-100 ${className}`}>
                <img 
                    src={displayPhoto} 
                    alt={alt} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={() => setHasError(true)}
                />
            </div>
        );
    }

    // Fallback Initial View
    return (
        <div className={`relative ${currentSize} rounded-full border-2 border-white/60 shadow-sm flex-shrink-0 bg-gradient-to-tr ${gradient} flex items-center justify-center text-white font-black tracking-tighter select-none ${className}`}>
            {initial}
        </div>
    );
};

export default UserAvatar;
