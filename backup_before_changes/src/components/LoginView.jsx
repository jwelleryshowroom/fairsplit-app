import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, signInAnonymously } from "firebase/auth";
import { auth } from "../firebase";
import { IndianRupee, AlertCircle, Loader2, Mail, User, Shield } from 'lucide-react';
import LoadingScreen from './LoadingScreen';

const LoginView = () => {
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError('');
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (err) {
            if (err.code === 'auth/unauthorized-domain') {
                setError(`DOMAIN ERROR: Add "${window.location.hostname}" to Firebase Console.`);
            } else {
                setError(err.message);
            }
            setIsLoading(false);
        }
    };

    const handleGuestLogin = async () => {
        setIsLoading(true);
        setError('');
        try {
            await signInAnonymously(auth);
        } catch (err) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    if (isLoading) return <LoadingScreen message="Authenticating..." />;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 flex items-center justify-center p-4">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 md:p-12 rounded-3xl shadow-2xl max-w-md w-full relative overflow-hidden">
                <div className="relative z-10 text-center">
                    <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg border border-white/10">
                        <IndianRupee className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white mb-2">FairSplit</h1>
                    <p className="text-indigo-200 mb-8">Global Household Expense Manager</p>

                    {error && (
                        <div className="mb-4 text-left bg-red-900/50 p-4 rounded-xl text-sm border border-red-500/50 text-white">
                            <p className="font-bold flex items-center gap-2 mb-1"><AlertCircle className="w-4 h-4" /> Login Error</p>
                            <p className="opacity-90 break-words">{error}</p>
                        </div>
                    )}

                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full bg-white hover:bg-gray-50 active:scale-95 text-gray-800 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg mb-3"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                                <Mail className="w-5 h-5 text-red-500" />
                                Sign in with Google
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleGuestLogin}
                        disabled={isLoading}
                        className="w-full bg-indigo-600/50 hover:bg-indigo-600 active:scale-95 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-3 border border-indigo-400/30 hover:border-indigo-400"
                    >
                        <User className="w-5 h-5" />
                        Continue as Guest
                    </button>

                    <div className="mt-8 flex items-center justify-center gap-2 text-xs text-indigo-300">
                        <Shield className="w-3 h-3" /> Secure Google Authentication
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginView;
