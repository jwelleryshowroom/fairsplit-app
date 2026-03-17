import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, signInAnonymously } from "firebase/auth";
import { auth } from "../firebase";
import { IndianRupee, AlertCircle, Loader2, Mail, User, Shield } from 'lucide-react';
import LoadingScreen from './LoadingScreen';

const LoginView = () => {
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isButtonHovered, setIsButtonHovered] = useState(false);

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
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Atmospheric Mesh Gradient Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[10000ms]" />
                <div className="absolute top-[20%] right-[-20%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[8000ms]" />
                <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[12000ms]" />

                {/* SVG Grain Texture */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
                />
            </div>

            {/* Subtle Glow Behind Card (Triggered by Button Hover) */}
            <div
                className={`absolute w-full max-w-md h-[500px] bg-indigo-500 rounded-[3rem] blur-[100px] -z-10 transition-opacity duration-700 ease-out pointer-events-none ${isButtonHovered ? 'opacity-30' : 'opacity-0'}`}
            />

            {/* The "Jewel" Card */}
            <div className="bg-white/[0.04] backdrop-blur-3xl border border-white/10 p-8 md:p-12 rounded-[2.5rem] shadow-2xl max-w-md w-full relative z-10 shadow-black/50">
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-[2.5rem] pointer-events-none" />

                <div className="relative z-20 text-center">
                    <div className="bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_8px_32px_rgba(0,0,0,0.2)] border border-white/20 backdrop-blur-md">
                        <IndianRupee className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">FairSplit</h1>
                    <p className="text-indigo-200/80 mb-10 text-sm font-medium tracking-wide uppercase">Global Household Expense Manager</p>

                    {error && (
                        <div className="mb-6 text-left bg-red-900/30 p-4 rounded-xl text-sm border border-red-500/30 text-red-200 backdrop-blur-md">
                            <p className="font-bold flex items-center gap-2 mb-1"><AlertCircle className="w-4 h-4" /> Login Error</p>
                            <p className="opacity-90 break-words">{error}</p>
                        </div>
                    )}

                    <div
                        className="space-y-4"
                        onMouseEnter={() => setIsButtonHovered(true)}
                        onMouseLeave={() => setIsButtonHovered(false)}
                    >
                        <button
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="w-full bg-[#F9FAFB] hover:bg-white active:scale-[0.98] text-slate-800 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.2)]"
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
                            className="w-full bg-white/5 hover:bg-white/10 active:scale-[0.98] text-white font-semibold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 border border-white/10 hover:border-white/30 backdrop-blur-sm"
                        >
                            <User className="w-5 h-5 opacity-70" />
                            Continue as Guest
                        </button>
                    </div>

                    <div className="mt-10 flex items-center justify-center gap-2 text-xs text-indigo-200/50 font-medium">
                        <Shield className="w-3.5 h-3.5" /> Secure Google Authentication
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginView;
