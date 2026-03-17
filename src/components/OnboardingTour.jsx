import React, { useState } from 'react';
import { IndianRupee, Users, Split, Sparkles, X } from 'lucide-react';

const OnboardingTour = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(0);

    if (!isOpen) return null;

    const steps = [
        {
            title: "Welcome to FairSplit! 👋",
            desc: "The easiest way to split expenses for trips, flats, or events. We do the math so you don't have to.",
            icon: <IndianRupee className="w-12 h-12 text-indigo-500" />,
            color: "bg-indigo-50"
        },
        {
            title: "1. Add Members & Bills 👥",
            desc: "Add people first. Toggle between 'Daily' (Food) and 'Fixed' (Rent/Wifi). \n\n✨ PRO TIP: Click the 'AI Add' sparkle button to paste messy text like 'Lunch 500, Taxi 200'!",
            icon: <Users className="w-12 h-12 text-emerald-500" />,
            color: "bg-emerald-50"
        },
        {
            title: "2. Handle Side Expenses 🔀",
            desc: "Did someone pay for just 2 people? Use the 'Custom Splits' section below to handle specific side-expenses without messing up the main daily split.",
            icon: <Split className="w-12 h-12 text-orange-500" />,
            color: "bg-orange-50"
        },
        {
            title: "3. Get AI Insights 🤖",
            desc: "Scroll to the bottom! Click 'Generate' to let AI identify the 'Ambani' 🤑 and the 'Kanjoos' 🐜 of the group with a funny roast.",
            icon: <Sparkles className="w-12 h-12 text-purple-500" />,
            color: "bg-purple-50"
        }
    ];

    const handleNext = () => {
        if (step < steps.length - 1) setStep(step + 1);
        else onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 relative overflow-hidden transform transition-all scale-100">
                <div className="absolute top-0 left-0 h-1.5 bg-slate-100 w-full">
                    <div className="h-full bg-indigo-500 transition-all duration-300 ease-out" style={{ width: `${((step + 1) / steps.length) * 100}%` }}></div>
                </div>
                <div className="flex flex-col items-center text-center mt-4">
                    <div className={`mb-6 p-6 rounded-full shadow-inner ${steps[step].color}`}>
                        {steps[step].icon}
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-800 mb-3">{steps[step].title}</h3>
                    <p className="text-slate-500 mb-8 leading-relaxed text-sm whitespace-pre-line">{steps[step].desc}</p>
                </div>
                <div className="flex gap-3">
                    {step > 0 && (
                        <button onClick={() => setStep(step - 1)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors">Back</button>
                    )}
                    <button onClick={handleNext} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95">
                        {step === steps.length - 1 ? "Get Started 🚀" : "Next"}
                    </button>
                </div>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 p-1 rounded-full hover:bg-slate-100 transition-colors"><X className="w-5 h-5" /></button>
            </div>
        </div>
    );
};

export default OnboardingTour;
