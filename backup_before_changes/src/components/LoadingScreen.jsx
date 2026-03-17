import React from 'react';
import { Loader2, IndianRupee } from 'lucide-react';

const LoadingScreen = ({ message = "Hisaab-kitaab loading... 🚀" }) => (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 animate-in fade-in duration-500">
        <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center border border-indigo-50">
            <div className="bg-indigo-600 text-white p-4 rounded-2xl mb-6 shadow-lg shadow-indigo-200 animate-bounce">
                <IndianRupee className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">FairSplit</h2>
            <div className="flex items-center gap-3 text-indigo-500 font-bold bg-indigo-50 px-4 py-2 rounded-full">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">{message}</span>
            </div>
        </div>
    </div>
);

export default LoadingScreen;
