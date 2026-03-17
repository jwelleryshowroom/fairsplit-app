import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getEnv } from "../utils/env";
import { safeCopy, cleanText } from "../utils/helpers";
import { IndianRupee, Share2, Check, HelpCircle, LogOut, Calendar, Users, Plus, AlertTriangle, Calculator, Sparkles, Loader2, AlertCircle, X, MessageSquare, Copy } from 'lucide-react';

import LoadingScreen from './LoadingScreen';
import OnboardingTour from './OnboardingTour';
import MemberCard from './MemberCard';
import CustomSplitManager from './CustomSplitManager';

const ArrowIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
);

const ExpenseSplitter = ({ user, groupId, initialRoomName, onLeaveGroup }) => {
    // Use optional chaining to safely access environment variables
    const apiKey = getEnv("VITE_GEMINI_API_KEY");
    const [daysInMonth, setDaysInMonth] = useState('30');
    const [members, setMembers] = useState([]);
    const [customSplits, setCustomSplits] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [roomName, setRoomName] = useState(initialRoomName || '');
    const [groupExists, setGroupExists] = useState(true);
    const [invalidMemberIds, setInvalidMemberIds] = useState([]); // Track members with empty names
    const [insights, setInsights] = useState('');
    const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);

    // 👇👇👇 ADD THIS 👇👇👇
    const [devMode, setDevMode] = useState(false);
    const [logs, setLogs] = useState([]);
    const addLog = (msg) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
    // 👆👆👆 END ADD 👆👆👆

    useEffect(() => {
        if (!db || !groupId) return;
        const groupRef = doc(db, "groups", groupId);

        const unsubscribe = onSnapshot(groupRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setDaysInMonth(data.daysInMonth !== undefined ? data.daysInMonth : '30');
                setMembers(data.members || []);
                setCustomSplits(data.customSplits || []);
                if (data.roomName) setRoomName(data.roomName);

                // Update User History
                if (user && user.uid) {
                    const userRef = doc(db, "users", user.uid);
                    setDoc(userRef, { lastGroupId: groupId, lastRoomName: data.roomName || 'Untitled Group', lastVisited: new Date() }, { merge: true });
                }
                setLoadingData(false);
            } else {
                setGroupExists(false);
                setLoadingData(false);
            }
        });

        // Check for onboarding
        const hasOnboarded = localStorage.getItem('fairsplit_onboarded');
        if (!hasOnboarded) {
            setShowOnboarding(true);
        }

        return () => unsubscribe();
    }, [groupId, user]);

    const closeOnboarding = () => {
        setShowOnboarding(false);
        localStorage.setItem('fairsplit_onboarded', 'true');
    };

    const saveData = async (newMembers, newDays, newSplits) => {
        if (!db || !groupId) return;
        const groupRef = doc(db, "groups", groupId);
        setDoc(groupRef, {
            daysInMonth: newDays !== undefined ? newDays : daysInMonth,
            members: newMembers !== undefined ? newMembers : members,
            customSplits: newSplits !== undefined ? newSplits : customSplits,
            lastUpdated: new Date()
        }, { merge: true });
    };

    const [results, setResults] = useState(null);
    const [error, setError] = useState('');
    const [showParseModal, setShowParseModal] = useState(false);
    const [activeMemberId, setActiveMemberId] = useState(null);
    const [parseText, setParseText] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [draftedMessage, setDraftedMessage] = useState('');
    const [isDrafting, setIsDrafting] = useState(false);
    const [showDraftModal, setShowDraftModal] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [copyCodeSuccess, setCopyCodeSuccess] = useState(false);
    const [parseError, setParseError] = useState(''); // Added dedicated error state for Modal

    const callGemini = async (prompt) => {
        const performRequest = async (model) => {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ role: "user", parts: [{ text: prompt }] }]
                    })
                }
            );

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`${response.status} - ${errText}`);
            }

            return response.json();
        };

        try {
            addLog("Attempting Primary Model (gemini-2.0-flash)...");
            const data = await performRequest("gemini-2.0-flash");

            return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        } catch (primaryError) {
            addLog(`Primary Failed (${primaryError.message}). Trying fallback...`);

            try {
                const data = await performRequest("gemini-2.0-flash-lite");
                return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
            } catch (fallbackError) {
                addLog(`CRITICAL ERROR: ${fallbackError.message}`);
                throw new Error("AI Service Unavailable");
            }
        }
    };


    // 1. Function to OPEN the UI (and accept text from Auto-Handoff)
    const openSmartAddModal = (id, initialText = '') => {
        setActiveMemberId(id);
        setParseText(initialText); // <--- This saves "two hundread" into the box
        setParseError('');
        setShowParseModal(true);
    };

    // 2. Function to RUN the AI (Renamed from handleSmartParse)
    const performSmartParse = async () => {
        if (!parseText.trim()) return;
        setIsAnalyzing(true);
        setParseError('');
        try {
            const result = await callGemini(`Extract numbers from text: "${parseText}". Return comma-separated list.`);

            const extractedNumbers = result.match(/(\d+(\.\d+)?)/g);

            if (!extractedNumbers || extractedNumbers.length === 0) {
                setParseError("No expenses found in text.");
                setIsAnalyzing(false);
                return;
            }

            const newExpensesString = extractedNumbers.join(', ');
            const member = members.find(m => m.id === activeMemberId);
            let finalExpenseInput = newExpensesString;

            if (member) {
                const currentExpenses = (member.expenseInput || '').toString().trim();
                if (currentExpenses) {
                    const prefix = currentExpenses.endsWith(',') ? currentExpenses : `${currentExpenses},`;
                    finalExpenseInput = `${prefix} ${newExpensesString}`;
                }
            }

            const updatedMembers = members.map(m => m.id === activeMemberId ? { ...m, expenseInput: finalExpenseInput } : m);
            saveData(updatedMembers, undefined, undefined);
            setShowParseModal(false);
            setParseText('');
        } catch (err) { setParseError("AI Parsing failed. Try manually."); } finally { setIsAnalyzing(false); }
    };

    const handleDraftMessage = async () => {
        if (!results) return;
        setIsDrafting(true); setShowDraftModal(true);
        try {
            const prompt = `
            Act like a dramatic, funny Gen Z Indian friend handling the group accounts. 
            Write a WhatsApp settlement message for the group "${roomName}" in **Hinglish** (mix of Hindi and English).
            
            Data:
            Transactions: ${JSON.stringify(results.transactions)}

            STRICT CONSTRAINTS:
            1. **Keep it under 50-100 words** (excluding the list).

            Style Guidelines:
            - Tone: Casual, witty, slightly dramatic banter.
            - Slang to use (optional examples): "Bhai", "Yaar", "Paisa nikal", "Gareebi", "Party kab hai?", "Hisab kitab", "Udhari".
            - Intro: Start with something funny like "Guys, hisab ka waqt aa gaya 💀" or "Bhai log, settlement time! 💸".
            - Body: List the transactions clearly (Name ➡️ Name: ₹Amount).
            - Outro: End with a call to action like "Jaldi settle karo, phir party karte hain 🍕" or "GPay fast, I am broke".
            - Use Indian Rupee symbol (₹).
            - Use lots of emojis.
            `;

            const message = await callGemini(prompt);
            setDraftedMessage(cleanText(message));
        } catch (err) {
            setDraftedMessage("Error generating banter. Try again!");
        } finally {
            setIsDrafting(false);
        }
    };

    const generateInsights = async () => {
        if (!results) return;
        setIsGeneratingInsights(true);

        // 1. Random Rich Names (Variety)
        const richNames = ["Ambani", "Adani", "Tata", "Birla", "Murthy", "Mahindra", "Poonawalla", "Jhunjhunwala"];
        const selectedRichName = richNames[Math.floor(Math.random() * richNames.length)];

        // 2. Random Savage Roast Lines (To prevent repetition)
        const roastLines = [
            "udhari ka kha-kha ke pet nahi phool gaya tera?",
            "tera hisaab dekh ke calculator bhi sharma gaya hai!",
            "agli baar kidney bech ke hisaab barabar karna padega lagta hai.",
            "itna udhaar toh Vijay Mallya ne bhi nahi liya tha!",
            "dost hai isliye chhod rahe hain, varna police case banta hai ispe!",
            "gareebi hatao yojana ka brand ambassador ban ja tu ab.",
            "bhai/behen maaf kar de, ab toh ATM bhi tujhe dekh ke error dikha deta hai.",
            "kya karega itna paisa bacha ke? Kabr mein leke jayega kya?",
            "Agli baar tu hi sponsor karega pura trip, likh ke lele!"
        ];
        const selectedRoast = roastLines[Math.floor(Math.random() * roastLines.length)];

        // 3. Round numbers BEFORE sending to AI (Clean Integers)
        const roundedTotalVar = Math.round(results.totalVariable);
        const roundedTotalFixed = Math.round(results.totalFixed);
        const roundedBalances = results.balances.map(m =>
            `${m.name}: Net Balance ${Math.round(m.netBalance)}`
        ).join(', ');

        const prompt = `
        Analyze these expenses for group "${roomName}".
        Total Variable Cost: ₹${roundedTotalVar}
        Total Fixed Cost: ₹${roundedTotalFixed}
        Breakdown:
        ${roundedBalances}
        
        Provide a fun, "roast-style" 3-bullet summary in **Hinglish** for a Gen Z Indian group.
        
        1. Identify the **"${selectedRichName} of the Group"** 🤑 (Highest spender/creditor). 
           - **GENDER CHECK:** If female, use "Queen ${selectedRichName}" or "Madam". If male, use "Bhai" or "Sir".
           - Roast them gently about being rich.
        
        2. Identify the **"Kanjoos Makkhichoos"** 🐜 (Lowest spender/debtor). 
           - **GENDER CHECK:** If female, use "Didi". If male, use "Bhai".
           - Roast them BADLY for not spending money.

        3. **Vibe Check** 🧐: A funny, unhinged observation. 
           - **MANDATORY:** You MUST include this specific roast phrase naturally in the sentence: **"${selectedRoast}"** (Adjust 'bhai/behen' in the phrase based on context).
        
        STRICT OUTPUT RULES:
        - **Round ALL numbers**. No decimals allowed.
        - **Start DIRECTLY** with the first emoji. Do NOT say "Here is a roast".
        - Use Indian Rupee symbol (₹). 
        `;

        try {
            const text = await callGemini(prompt);
            setInsights(cleanText(text));
        } catch (e) {
            setInsights("Insights generate nahi ho paaye. Server lunch pe gaya hai! 🍕");
        } finally {
            setIsGeneratingInsights(false);
        }
    };

    const copyToClipboard = () => { safeCopy(draftedMessage); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); };
    const copyGroupCode = () => { safeCopy(groupId); setCopyCodeSuccess(true); setTimeout(() => setCopyCodeSuccess(false), 2000); };

    const parseExpenses = (str) => { try { return str.split(',').reduce((a, c) => a + (parseFloat(c.trim()) || 0), 0); } catch { return 0; } };
    const addMember = () => { const newMembers = [...members, { id: Date.now(), name: '', daysAbsent: 0, expenseInput: '', fixedExpenseInput: '' }]; saveData(newMembers, undefined, undefined); setResults(null); };
    // --- ADVANCED MAGIC SPLIT LOGIC ---
    const handleNameSplit = (memberId, rawNameStr) => {
        // Split by: comma, ampersand, plus, slash, newline, or the word "and"
        // The regex /[,&+\/\n]| and /i handles all these cases case-insensitively
        const names = rawNameStr
            .split(/[,&+\/\n]| and /i)
            .map(n => n.trim())
            .filter(n => n !== '');

        if (names.length <= 1) return;

        const firstName = names[0];
        const remainingNames = names.slice(1);

        const newMembersToAdd = remainingNames.map(name => ({
            id: Date.now() + Math.random(),
            name: name,
            daysAbsent: 0,
            expenseInput: '',
            fixedExpenseInput: ''
        }));

        const updatedMembers = members.flatMap(m => {
            if (m.id === memberId) {
                return [{ ...m, name: firstName }, ...newMembersToAdd];
            }
            return m;
        });

        saveData(updatedMembers, undefined, undefined);
        setResults(null);
    };
    const removeMember = (id) => { const newMembers = members.filter(m => m.id !== id); saveData(newMembers, undefined, undefined); setResults(null); };
    const updateCustomSplits = (newSplits) => { saveData(undefined, undefined, newSplits); };
    const updateDays = (val) => { saveData(undefined, val, undefined); };

    // --- UPDATED updateMember to handle MERGING guests ---
    const updateMember = (id, f, v) => {
        const updatedMembers = members.map(m => m.id === id ? { ...m, [f]: v } : m);
        let updatedSplits = [...customSplits];

        if (f === 'name' && v.trim() !== '') {
            const newName = v.trim().toLowerCase();
            // Scan customSplits for any guests matching this name
            let splitsChanged = false;
            updatedSplits = updatedSplits.map(split => {
                const newInvolved = split.involvedIds.map(involvedId => {
                    if (typeof involvedId === 'string' && involvedId.startsWith('EXT:')) {
                        const guestName = involvedId.replace('EXT:', '');
                        if (guestName.toLowerCase() === newName) {
                            splitsChanged = true;
                            return id; // Merge: Replace guest ID with the actual member ID
                        }
                    }
                    return involvedId;
                });
                // Deduplicate in case both guest and member were selected
                const uniqueInvolved = [...new Set(newInvolved)];
                if (uniqueInvolved.length !== split.involvedIds.length) splitsChanged = true;
                return { ...split, involvedIds: uniqueInvolved };
            });

            if (splitsChanged) {
                saveData(updatedMembers, undefined, updatedSplits);
                setResults(null);
                return;
            }
        }

        saveData(updatedMembers, undefined, undefined);
        setResults(null);
        // Clear error if name is provided for this field
        if (f === 'name' && v.trim() !== '' && invalidMemberIds.includes(id)) {
            setInvalidMemberIds(prev => prev.filter(memberId => memberId !== id));
            if (invalidMemberIds.length <= 1) setError(''); // Clear error if this was the last one
        }
    };
    // ---------------------------------------------------

    const calculate = () => {
        setError('');
        setInvalidMemberIds([]);

        // --- 1. AUTO-CLEANUP: Filter out rows with empty names ---
        const validMembers = members.filter(m => m.name && m.name.trim() !== '');

        // Guard: If list is empty after cleanup, stop
        if (validMembers.length === 0) {
            setError('Please add at least one member to calculate.');
            return;
        }

        // Sync: If empty rows were found, update State & DB immediately so they disappear visually
        if (validMembers.length < members.length) {
            setMembers(validMembers);
            saveData(validMembers, undefined, undefined);
        }

        // --- 2. DUPLICATE CHECK (Run on cleaned list) ---
        const names = validMembers.map(m => m.name.trim().toLowerCase());
        const uniqueNames = new Set(names);
        if (names.length !== uniqueNames.size) {
            setError("Duplicate names detected. Please ensure all members have unique names.");
            return;
        }
        // ---------------------------------------------

        const validDays = parseInt(daysInMonth) || 30;

        // Use 'validMembers' here instead of 'members'
        let extendedMembers = [...validMembers];

        customSplits.forEach(s => {
            s.involvedIds.forEach(id => {
                if (typeof id === 'string' && id.startsWith('EXT:') && !extendedMembers.find(m => m.id === id)) {
                    extendedMembers.push({
                        id: id,
                        name: id.replace('EXT:', ''),
                        daysAbsent: validDays,
                        expenseInput: '',
                        fixedExpenseInput: '',
                        isGuest: true
                    });
                }
            });
        });

        const proc = extendedMembers.map(m => ({
            ...m,
            daysPresent: Math.max(0, validDays - (parseInt(m.daysAbsent) || 0)),
            totalPaidVar: parseExpenses(m.expenseInput),
            totalPaidFixed: parseExpenses(m.fixedExpenseInput),
            cCredit: 0,
            cDebit: 0
        }));

        const totalVar = proc.reduce((s, m) => s + m.totalPaidVar, 0);
        const realMembers = proc.filter(m => !m.isGuest);
        const totalPD = realMembers.reduce((s, m) => s + m.daysPresent, 0);

        const costPerDay = totalPD > 0 ? totalVar / totalPD : 0;
        const totalFixed = proc.reduce((s, m) => s + m.totalPaidFixed, 0);
        const fixedPerPerson = realMembers.length > 0 ? totalFixed / realMembers.length : 0;

        let totalCustom = 0;
        customSplits.forEach(s => {
            totalCustom += s.amount;
            const p = proc.find(m => m.id === s.payerId);
            if (p) p.cCredit += s.amount;

            if (s.involvedIds.length > 0) {
                const share = s.amount / s.involvedIds.length;
                s.involvedIds.forEach(id => {
                    const d = proc.find(m => m.id === id);
                    if (d) d.cDebit += share;
                });
            }
        });

        const bals = proc.map(m => {
            const vShare = m.isGuest ? 0 : (m.daysPresent * costPerDay);
            const fShare = m.isGuest ? 0 : fixedPerPerson;
            const cShare = m.cDebit;
            const net = (m.totalPaidVar + m.totalPaidFixed + m.cCredit) - (vShare + fShare + cShare);
            return { ...m, variableShare: vShare, fixedShare: fShare, customShare: cShare, netBalance: parseFloat(net.toFixed(2)) };
        });

        let db = bals.filter(m => m.netBalance < -0.01).map(m => ({ ...m, amount: m.netBalance })).sort((a, b) => a.amount - b.amount);
        let cr = bals.filter(m => m.netBalance > 0.01).map(m => ({ ...m, amount: m.netBalance })).sort((a, b) => b.amount - a.amount);

        const txs = []; let i = 0, j = 0;
        while (i < db.length && j < cr.length) {
            let d = db[i], c = cr[j];
            // Round transaction amounts for display ease
            let exactAmt = Math.min(Math.abs(d.amount), c.amount);
            let displayAmt = Math.round(exactAmt);

            if (displayAmt > 0) {
                txs.push({ from: d.name || 'Unknown', to: c.name || 'Unknown', amount: displayAmt });
            }

            d.amount += exactAmt; c.amount -= exactAmt;
            if (Math.abs(d.amount) < 0.01) i++; if (c.amount < 0.01) j++;
        }
        setResults({ totalVariable: totalVar, totalFixed: totalFixed, totalCustom: totalCustom, totalPersonDays: totalPD, costPerPersonDay: costPerDay, balances: bals, transactions: txs });
    };

    if (loadingData) return <LoadingScreen message="Loading expenses..." />;

    if (!groupExists) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-red-100 text-center max-w-sm">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Group Not Found</h3>
                <p className="text-slate-500 mb-6">This group (ID: {groupId}) does not exist or has been deleted.</p>
                <button onClick={onLeaveGroup} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800">Go Home</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
            {/* ONBOARDING TOUR MODAL */}
            <OnboardingTour isOpen={showOnboarding} onClose={closeOnboarding} />

            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm px-4 md:px-8 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="bg-indigo-600 text-white p-1.5 rounded-lg cursor-pointer" onClick={onLeaveGroup}>
                        <IndianRupee className="w-5 h-5" />
                    </div>
                    <span
                        className="font-extrabold text-lg text-slate-800 tracking-tight hidden md:inline cursor-pointer select-none"
                        onClick={() => {
                            // Toggle Dev Mode on 5 clicks
                            if (window.devClickTimer && Date.now() - window.devClickTimer < 500) {
                                window.devClickCount++;
                            } else {
                                window.devClickCount = 1;
                            }
                            window.devClickTimer = Date.now();
                            if (window.devClickCount === 5) setDevMode(!devMode);
                        }}
                    >
                        FairSplit {devMode && "🛠️"}
                    </span>
                    <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block"></div>
                    <div className="flex flex-col md:flex-row md:items-center gap-0 md:gap-3">
                        <h1 className="font-bold text-slate-800 text-sm md:text-base truncate max-w-[150px] md:max-w-none">{roomName}</h1>
                        <button onClick={copyGroupCode} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md text-xs font-mono font-medium text-slate-500 transition-colors">
                            {copyCodeSuccess ? <Check className="w-3 h-3 text-green-500" /> : <Share2 className="w-3 h-3" />}
                            {groupId}
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={() => setShowOnboarding(true)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Help & Tour">
                        <HelpCircle className="w-5 h-5" />
                    </button>
                    <button onClick={onLeaveGroup} className="flex items-center gap-2 text-red-500 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg text-sm font-bold transition-colors">
                        <LogOut className="w-4 h-4" />
                        <span className="hidden md:inline">Exit</span>
                    </button>
                </div>
            </div>

            <div className="relative z-10 max-w-5xl mx-auto p-4 md:p-8">
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mb-10">
                    <div className="p-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm"><Calendar className="w-4 h-4 text-indigo-500" /><label className="text-xs font-bold text-slate-500 uppercase">Days in Month</label><input type="number" value={daysInMonth} onChange={(e) => updateDays(e.target.value)} className="w-12 p-1 bg-transparent font-bold text-indigo-700 text-center outline-none" /></div>
                        <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2"><Users className="w-5 h-5 text-indigo-600" /> Members & Expenses</h2>
                        <button onClick={addMember} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95"><Plus className="w-4 h-4" /> Add Member</button>
                    </div>
                    <div className="p-6 space-y-4 bg-slate-50/50">
                        {members.map(m => {
                            // Check if this member's name appears more than once in the list
                            const isDuplicate = members.filter(mem => mem.name.trim().toLowerCase() === m.name.trim().toLowerCase() && mem.name.trim() !== '').length > 1;
                            const isInvalid = invalidMemberIds.includes(m.id);
                            return (
                                <MemberCard
                                    key={m.id}
                                    member={m}
                                    daysInMonth={daysInMonth}
                                    updateMember={updateMember}
                                    removeMember={removeMember}
                                    onSmartParse={(id, text) => openSmartAddModal(id, text)}
                                    onNameSplit={handleNameSplit}
                                    isDuplicate={isDuplicate}
                                    isInvalid={isInvalid}
                                />
                            );
                        })}
                    </div>
                    <div className="px-6 pb-6 bg-slate-50/50"><CustomSplitManager members={members} customSplits={customSplits} setCustomSplits={updateCustomSplits} /></div>
                    <div className="p-6 bg-white border-t border-slate-100 text-center">
                        {error && (
                            <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl flex items-center gap-4 text-red-700 shadow-sm animate-in slide-in-from-top-2">
                                <div className="bg-red-100 p-2 rounded-full">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-sm">Action Required</p>
                                    <p className="text-sm opacity-90">{error}</p>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={calculate}
                            className="w-full md:w-auto px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all flex justify-center items-center gap-3"
                        >
                            <Calculator className="w-6 h-6" /> Calculate Split
                        </button>
                    </div>
                </div>
                {results && (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-xl transform hover:scale-[1.02] transition-transform">
                                <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">Total Variable (Food)</p>
                                <p className="text-3xl font-bold">₹{results.totalVariable.toFixed(0)}</p>
                                <p className="text-xs text-blue-200 mt-1">₹{results.costPerPersonDay.toFixed(2)} / person-day</p>
                            </div>
                            <div className="bg-gradient-to-br from-pink-500 to-rose-600 text-white p-6 rounded-2xl shadow-xl transform hover:scale-[1.02] transition-transform">
                                <p className="text-rose-100 text-xs font-bold uppercase tracking-wider">Total Fixed (Bills)</p>
                                <p className="text-3xl font-bold">₹{results.totalFixed.toFixed(0)}</p>
                                <p className="text-xs text-rose-200 mt-1">₹{(results.totalFixed / members.length).toFixed(2)} / member</p>
                            </div>
                            <div className="bg-gradient-to-br from-orange-400 to-orange-500 text-white p-6 rounded-2xl shadow-xl transform hover:scale-[1.02] transition-transform"><p className="text-orange-100 text-xs font-bold uppercase tracking-wider">Custom Splits</p><p className="text-3xl font-bold">₹{results.totalCustom.toFixed(0)}</p></div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden mb-10">
                            <div className="px-6 py-4 bg-slate-50 border-b font-bold text-slate-700">Detailed Breakdown</div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr>
                                            <th className="px-6 py-4">Member</th>
                                            <th className="px-6 py-4 text-center">Days</th>
                                            <th className="px-6 py-4">Var Share</th>
                                            {results.totalFixed > 0 && <th className="px-6 py-4">Fixed Share</th>}
                                            {results.totalCustom > 0 && <th className="px-6 py-4">Side Share</th>}
                                            <th className="px-6 py-4">Net Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.balances.map(m => (
                                            <tr key={m.id} className="border-b hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-slate-700">
                                                    {m.name}
                                                    {m.isGuest && <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded ml-2">GUEST</span>}
                                                </td>
                                                <td className="px-6 py-4 text-center font-mono text-slate-500">
                                                    {m.daysPresent}<span className="text-xs text-slate-300">/{daysInMonth}</span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">₹{m.variableShare.toFixed(2)}</td>
                                                {results.totalFixed > 0 && <td className="px-6 py-4 text-slate-600">₹{m.fixedShare.toFixed(2)}</td>}
                                                {results.totalCustom > 0 && <td className="px-6 py-4 text-slate-600">₹{m.customShare.toFixed(2)}</td>}
                                                <td className={`px-6 py-4 font-bold ${m.netBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {m.netBalance > 0 ? '+' : ''}{m.netBalance.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="bg-gradient-to-b from-emerald-50 to-white rounded-3xl border border-emerald-100 p-8 shadow-lg">
                            <h3 className="text-2xl font-extrabold text-emerald-900 mb-6 flex gap-2"><Check className="w-6 h-6" /> Settlement Plan (Rounded)</h3>
                            {results.transactions.length === 0 ? <div className="text-center font-bold text-emerald-800">All Settled!</div> :
                                <div className="grid md:grid-cols-2 gap-4">
                                    {results.transactions.map((t, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 hover:shadow-md transition-shadow group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                                                    {t.from.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800">{t.from}</span>
                                                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                                        pays <ArrowIcon /> {t.to}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="font-mono font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                                ₹{t.amount}
                                            </div>
                                        </div>
                                    ))}
                                </div>}
                            <div className="mt-6 flex gap-3"><button onClick={handleDraftMessage} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold shadow-md transition-all active:scale-95"><Sparkles className="w-4 h-4 inline mr-2" /> Draft Message</button></div>
                        </div>

                        {/* AI Insights Section */}
                        <div className="mt-6 bg-gradient-to-r from-violet-50 to-purple-50 rounded-3xl border border-purple-100 p-6 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-purple-600" /> AI Spending Insights
                                </h3>
                                {!insights && (
                                    <button
                                        onClick={generateInsights}
                                        disabled={isGeneratingInsights}
                                        className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50 transition-colors"
                                    >
                                        {isGeneratingInsights ? <Loader2 className="w-3 h-3 animate-spin" /> : "Generate"}
                                    </button>
                                )}
                            </div>

                            {insights ? (
                                <div className="text-sm text-purple-800 leading-relaxed whitespace-pre-line animate-in fade-in">
                                    {insights}
                                    <button onClick={() => setInsights('')} className="block mt-3 text-xs text-purple-500 underline hover:text-purple-700">Refresh</button>
                                </div>
                            ) : (
                                <p className="text-xs text-purple-400 italic">
                                    Get an AI-powered summary of who spent what and spending habits.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {showParseModal && (
                <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowParseModal(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 relative" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2"><Sparkles className="w-6 h-6 text-purple-600" /> AI Smart Add</h3>
                        <p className="text-slate-500 text-sm mb-4">Paste your expenses below (e.g., "Lunch 350, Taxi 120"). AI will extract and add them.</p>

                        {parseError && (
                            <div className="text-red-500 text-sm font-bold mb-3 bg-red-50 p-3 rounded-lg flex items-center gap-2 animate-pulse">
                                <AlertCircle className="w-4 h-4" /> {parseError}
                            </div>
                        )}

                        <textarea
                            className="w-full h-32 border border-slate-200 p-4 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none transition-all resize-none bg-slate-50"
                            value={parseText}
                            onChange={e => setParseText(e.target.value)}
                            placeholder="e.g. Paid 500 for lunch and 200 for snacks..."
                            autoFocus
                        />
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowParseModal(false)} className="flex-1 bg-white border border-slate-200 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors">Cancel</button>
                            <button onClick={performSmartParse} disabled={isAnalyzing} className="flex-[2] bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-bold hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                                {isAnalyzing ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</> : 'Add Expenses'}
                            </button>
                        </div>
                        <button onClick={() => setShowParseModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"><X className="w-5 h-5" /></button>
                    </div>
                </div>
            )}

            {showDraftModal && (
                <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowDraftModal(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 relative" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2"><MessageSquare className="w-6 h-6 text-emerald-600" /> Draft Message</h3>
                        {isDrafting ? (
                            <div className="h-48 flex flex-col items-center justify-center text-slate-400 gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                                <span className="text-sm font-medium">Writing perfect message...</span>
                            </div>
                        ) : (
                            <textarea readOnly className="w-full h-48 bg-slate-50 p-4 rounded-xl text-sm border border-slate-200 focus:outline-none resize-none font-mono text-slate-600" value={draftedMessage} />
                        )}
                        <div className="flex gap-2 mt-4">
                            <button onClick={copyToClipboard} className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2">
                                {copySuccess ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Text</>}
                            </button>
                        </div>
                        <button onClick={() => setShowDraftModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"><X className="w-5 h-5" /></button>
                    </div>
                </div>
            )}
            {/* 👇👇👇 DEVELOPER CONSOLE 👇👇👇 */}
            {devMode && (
                <div className="fixed bottom-0 left-0 right-0 h-48 bg-black/90 text-green-400 p-4 font-mono text-xs overflow-y-auto z-[60] border-t-2 border-green-500">
                    <div className="flex justify-between mb-2">
                        <span className="font-bold">DEVELOPER CONSOLE</span>
                        <button onClick={() => setDevMode(false)} className="text-red-400">CLOSE</button>
                    </div>
                    <div>API Key Present: {apiKey ? "YES" : "NO"}</div>
                    {logs.map((log, i) => <div key={i} className="border-b border-gray-800 py-1">{log}</div>)}
                </div>
            )}
            {/* 👆👆👆 END PASTE 👆👆👆 */}
        </div>
    );
};

export default ExpenseSplitter;
