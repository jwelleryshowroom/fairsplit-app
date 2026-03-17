import React, { useState, useEffect, useMemo } from 'react';
import { doc, collection, onSnapshot, setDoc, writeBatch, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getEnv } from "../utils/env";
import { safeCopy, cleanText } from "../utils/helpers";
import { callGemini } from "../services/ai";
import { IndianRupee, Share2, Check, RefreshCw, HelpCircle, LogOut, Calendar, Users, Plus, AlertTriangle, Calculator, Sparkles, Loader2, AlertCircle, X, MessageSquare, Copy, Camera, Zap, BookOpen, History as HistoryIcon, Edit3, ChevronUp, ChevronDown } from 'lucide-react';

import LoadingScreen from './LoadingScreen';
import OnboardingTour from './OnboardingTour';
import MemberCard from './MemberCard';
import { CustomSplitSummaryCard, CustomSplitModal } from './CustomSplitManager';
import ReceiptSplitterModal from './ReceiptSplitterModal';
import LedgerModal from './LedgerModal';
import ArchiveMonthModal from './ArchiveMonthModal';
import ConfirmModal from './ConfirmModal';
import ActivityFeedModal from './ActivityFeedModal';
import GroupHeader from './GroupHeader';
import StatusBanner from './StatusBanner';
import DetailedBreakdown from './DetailedBreakdown';
import SettlementPlan from './SettlementPlan';
import Modal from './Modal';
import { useSettings } from '../context/SettingsContext';

// ExpenseSplitter handles the main business logic and state for the group dashboard.
const pulseAnimation = `
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
`;

const ExpenseSplitter = ({ user, groupId, initialRoomName, onLeaveGroup }) => {
    const { settings } = useSettings();
    const emoji = (e) => settings.showEmojis ? e : '';
    // Use optional chaining to safely access environment variables
    const apiKey = getEnv("VITE_GEMINI_API_KEY");
    const [daysInMonth, setDaysInMonth] = useState('30');
    const [isMonthlyMode, setIsMonthlyMode] = useState(false); // V7.5 Normal vs Monthly
    const [members, setMembers] = useState([]);
    const [customSplits, setCustomSplits] = useState([]);
    const [archives, setArchives] = useState([]); // V4 Ledger Archives
    const [loadingData, setLoadingData] = useState(true);
    const [roomName, setRoomName] = useState(initialRoomName || '');
    const [groupExists, setGroupExists] = useState(true);
    const [invalidMemberIds, setInvalidMemberIds] = useState([]); // Track members with empty names
    const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);

    // 👇👇👇 ADD THIS 👇👇👇
    const [devMode, setDevMode] = useState(false);
    const [logs, setLogs] = useState([]);
    const addLog = (msg) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg} `, ...prev]);
    // 👆👆👆 END ADD 👆👆👆



    useEffect(() => {
        if (!db || !groupId) return;
        const groupRef = doc(db, "v6_groups", groupId);
        const membersRef = collection(db, "v6_groups", groupId, "members");
        const splitsRef = collection(db, "v6_groups", groupId, "customSplits");
        const monthsRef = collection(db, "v6_groups", groupId, "months");

        const unsubs = [];

        // 1. Core Group Doc
        unsubs.push(onSnapshot(groupRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setGroupExists(true);
                setDaysInMonth(data.daysInMonth !== undefined ? data.daysInMonth : '30');
                setRoomName(data.roomName || initialRoomName || 'Group ' + groupId);

                // Update User History
                if (user && user.uid) {
                    const userRef = doc(db, "users", user.uid);
                    setDoc(userRef, { lastGroupId: groupId, lastRoomName: data.roomName || 'Untitled Group', lastVisited: new Date() }, { merge: true });
                }
            } else {
                setGroupExists(false);
            }
            setLoadingData(false);
        }));

        // 2. Members Sub-Collection
        unsubs.push(onSnapshot(membersRef, (snap) => {
            const arr = snap.docs.map(d => d.data());
            // Sort by a stable identifier so they don't jump around. ID is timestamp.
            arr.sort((a, b) => parseInt(a.id) - parseInt(b.id));
            setMembers(arr);
        }));

        // 3. Custom Splits Sub-Collection
        unsubs.push(onSnapshot(splitsRef, (snap) => {
            const arr = snap.docs.map(d => d.data());
            arr.sort((a, b) => parseInt(a.id) - parseInt(b.id));
            setCustomSplits(arr);
        }));

        // 4. Months Sub-Collection (V6 replaces archives)
        unsubs.push(onSnapshot(monthsRef, (snap) => {
            const arr = snap.docs.map(d => d.data());
            arr.sort((a, b) => new Date(a.closedAt) - new Date(b.closedAt));
            setArchives(arr); // Reuse existing state key for compatibility
        }));

        // Check for onboarding
        const hasOnboarded = localStorage.getItem('fairsplit_onboarded');
        if (!hasOnboarded) {
            setShowOnboarding(true);
        }

        return () => unsubs.forEach(u => u());
    }, [groupId, user]);

    const closeOnboarding = () => {
        setShowOnboarding(false);
        localStorage.setItem('fairsplit_onboarded', 'true');
    };

    const saveData = async (newMembers, newDays, newSplits) => {
        if (!db || !groupId) return;

        const batch = writeBatch(db);
        const groupRef = doc(db, "v6_groups", groupId);

        batch.set(groupRef, { lastUpdated: new Date() }, { merge: true });
        if (newDays !== undefined) batch.set(groupRef, { daysInMonth: newDays }, { merge: true });

        // Safely sync members sub-collection
        if (newMembers !== undefined) {
            const currentIds = new Set(newMembers.map(m => m.id.toString()));
            members.forEach(m => {
                if (!currentIds.has(m.id.toString())) {
                    batch.delete(doc(db, "v6_groups", groupId, "members", m.id.toString()));
                }
            });
            newMembers.forEach(m => {
                batch.set(doc(db, "v6_groups", groupId, "members", m.id.toString()), m, { merge: true });
            });
        }

        // Safely sync customSplits sub-collection
        if (newSplits !== undefined) {
            const currentIds = new Set(newSplits.map(s => s.id.toString()));
            customSplits.forEach(s => {
                if (!currentIds.has(s.id.toString())) {
                    batch.delete(doc(db, "v6_groups", groupId, "customSplits", s.id.toString()));
                }
            });
            newSplits.forEach(s => {
                batch.set(doc(db, "v6_groups", groupId, "customSplits", s.id.toString()), s, { merge: true });
            });
        }

        await batch.commit();
    };

    // Restore persisted state from localStorage (keyed per group)
    const storageKey = groupId ? `fairsplit_state_${groupId}` : null;
    const _savedState = storageKey ? (() => { try { return JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch { return null; } })() : null;

    const [results, _setResults] = useState(_savedState?.results ?? null);
    const isSettled = results && results.transactions.length === 0;
    const [pendingDebts, setPendingDebts] = useState([]); // Array of pending settlement txs
    const [error, setError] = useState('');
    const [showParseModal, setShowParseModal] = useState(false);
    const [activeMemberId, setActiveMemberId] = useState(null);
    const [isModifying, _setIsModifying] = useState(_savedState?.results ? (_savedState?.isModifying ?? false) : true);
    const [parseText, setParseText] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [draftedMessage, setDraftedMessage] = useState('');
    const [isDrafting, setIsDrafting] = useState(false);
    const [showDraftModal, setShowDraftModal] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [copyCodeSuccess, setCopyCodeSuccess] = useState(false);
    const [parseError, setParseError] = useState(''); // Added dedicated error state for Modal
    const [showLedger, setShowLedger] = useState(false); // V4 Ledger state
    const [showArchiveModal, setShowArchiveModal] = useState(false); // V4 Archive Modal
    const [showActivityFeed, setShowActivityFeed] = useState(false); // V5 Activity Feed
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', type: 'warning', hideCancel: false, onConfirm: () => { } });
    const [isShimmering, setIsShimmering] = useState(false); // Shimmer state for UX hook
    const [isCustomSplitModalOpen, setIsCustomSplitModalOpen] = useState(false);
    const [insights, _setInsights] = useState(_savedState?.insights ?? '');
    const [isInsightsMinimized, _setIsInsightsMinimized] = useState(_savedState?.isInsightsMinimized ?? false);

    // Wrapped setters that also persist to localStorage
    const persistState = (patch) => {
        if (!storageKey) return;
        try {
            const current = JSON.parse(localStorage.getItem(storageKey) || '{}');
            localStorage.setItem(storageKey, JSON.stringify({ ...current, ...patch }));
        } catch { }
    };
    const setResults = (val) => { _setResults(val); val ? persistState({ results: val }) : (storageKey && localStorage.removeItem(storageKey)); };
    const setIsModifying = (val) => { _setIsModifying(val); persistState({ isModifying: val }); };
    const setInsights = (val) => { _setInsights(val); persistState({ insights: val }); };
    const setIsInsightsMinimized = (val) => { _setIsInsightsMinimized(val); persistState({ isInsightsMinimized: val }); };

    // --- V4: LIVE PENDING DEBTS PREVIEW (From Arrears) ---
    useEffect(() => {
        if (!members || members.length === 0) {
            setPendingDebts([]);
            return;
        }

        // Map only valid members with their arrears to find current debts BEFORE any new expenses
        const validMembers = members.filter(m => m.name && m.name.trim() !== '');
        let db = validMembers.filter(m => parseFloat(m.arrears || 0) < -0.01).map(m => ({ ...m, amount: parseFloat(m.arrears) })).sort((a, b) => a.amount - b.amount);
        let cr = validMembers.filter(m => parseFloat(m.arrears || 0) > 0.01).map(m => ({ ...m, amount: parseFloat(m.arrears) })).sort((a, b) => b.amount - a.amount);

        const txs = [];
        let i = 0, j = 0;
        while (i < db.length && j < cr.length) {
            let d = db[i], c = cr[j];
            let exactAmt = Math.min(Math.abs(d.amount), c.amount);
            let displayAmt = Math.round(exactAmt);

            if (displayAmt > 0) {
                // Determine direction based on sign logic: Arrears Negative means they owe money. Arrears Positive means they are owed money.
                txs.push({ from: d.name, to: c.name, amount: displayAmt, fromId: d.id, toId: c.id });
            }

            d.amount += exactAmt; c.amount -= exactAmt;
            if (Math.abs(d.amount) < 0.01) i++;
            if (c.amount < 0.01) j++;
        }

        setPendingDebts(txs);
    }, [members]);
    // -----------------------------------------------------

    // --- V4 AUTO-CLEANUP: Remove old ghost "Settled" splits from V2 logic ---
    useEffect(() => {
        if (customSplits && customSplits.some(s => s.description && s.description.startsWith('Settled carried over debt'))) {
            const cleanedSplits = customSplits.filter(s => !(s.description && s.description.startsWith('Settled carried over debt')));
            saveData(members, undefined, cleanedSplits);
        }
    }, [customSplits]);
    // ------------------------------------------------------------------------

    // 1. Function to OPEN the UI (and accept text from Auto-Handoff)
    const openSmartAddModal = (id, initialText = '') => {
        setActiveMemberId(id);
        setParseText(initialText); // <--- This saves "two hundread" into the box
        setParseError('');
        setShowParseModal(true);
    };

    // 2. Function to RUN the AI (Renamed from handleSmartParse)
    const handleSmartParse = async () => {
        if (!parseText.trim()) return;
        setIsParsing(true);
        setParseError('');
        try {
            const member = members.find(m => m.id.toString() === activeMemberId.toString());
            const existingExpenses = member ? (member.expenseInput || '') : '';

            const prompt = `
                Analyze the following text and extract ONLY NEW expenditure amounts(deltas) and the number of days absent: "${parseText}".

    CONTEXT:
                Existing recorded expense amounts(Ignore these if they appear in the text): [${existingExpenses}]
                
                STRICT RULES:
1. SMART DEDUPLICATION: We want to avoid adding the same bill twice.If the text contains an expense(e.g., "Egg 200") and we already have a "200" in the context list that likely corresponds to this item, SKIP it.
                2. SAME PRICE, DIFFERENT ITEMS: If the text says "Milk 15, Choc 15" but the context only has one "15", then you MUST extract the second "15" as a new expense.
                3. NEW ITEMS ONLY: Return ONLY the expenses that are NOT already accounted for in the context list.
                4. MATH: If you see "110+637", treat them as individual amounts.
                5. DATES: Ignore any date numbers(15th, 22 feb, etc.).
                
                Return ONLY a JSON object:
{
    "expenses": [number, number, ...],
        "daysAbsent": number or null
}

Example: Context[200, 15].Text "Egg 200, Milk 15, Choc 15, 9 days absent".
    Output: { "expenses": [15], "daysAbsent": 9 }
`;

            const result = await callGemini(prompt, addLog);

            // Extract JSON from response (handling potential markdown formatting)
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("Could not parse AI response");

            const parsed = JSON.parse(jsonMatch[0]);
            const { expenses, daysAbsent } = parsed;

            if ((!expenses || expenses.length === 0) && daysAbsent === null) {
                setParseError("Could not find any expenses or absence days.");
                setIsParsing(false);
                return;
            }

            if (!member) return;

            let finalExpenseInput = member.expenseInput || '';
            if (expenses && expenses.length > 0) {
                const newExpensesString = expenses.join(', ');
                const currentExpenses = finalExpenseInput.toString().trim();
                if (currentExpenses) {
                    const prefix = currentExpenses.endsWith(',') ? currentExpenses : `${currentExpenses}, `;
                    finalExpenseInput = `${prefix} ${newExpensesString} `;
                } else {
                    finalExpenseInput = newExpensesString;
                }
            }

            const updatedMembers = members.map(m =>
                m.id.toString() === activeMemberId.toString()
                    ? {
                        ...m,
                        expenseInput: finalExpenseInput,
                        daysAbsent: daysAbsent !== null ? daysAbsent.toString() : m.daysAbsent
                    }
                    : m
            );

            saveData(updatedMembers, undefined, undefined);
            setShowParseModal(false);
            setParseText('');
        } catch (err) {
            console.error(err);
            setParseError("AI Parsing failed. Try manually.");
        } finally {
            setIsParsing(false);
        }
    };

    const handleDraftMessage = async () => {
        if (!results) return;
        setIsDrafting(true); setShowDraftModal(true);
        try {
            const prompt = `
            Act like a dramatic, funny Gen Z Indian friend handling the group accounts. 
            Write a WhatsApp settlement message for the group "${roomName}" in ** Hinglish ** (mix of Hindi and English).

Data:
Transactions: ${JSON.stringify(results.transactions)}

            STRICT CONSTRAINTS:
1. ** Keep it under 50 - 100 words ** (excluding the list).

            Style Guidelines:
- Tone: Casual, witty, slightly dramatic banter.
            - Slang to use(optional examples): "Bhai", "Yaar", "Paisa nikal", "Gareebi", "Party kab hai?", "Hisab kitab", "Udhari".
            - Intro: Start with something funny like "Guys, hisab ka waqt aa gaya 💀" or "Bhai log, settlement time! 💸".
            - Body: List the transactions clearly(Name ➡️ Name: ₹Amount).
            - Outro: End with a call to action like "Jaldi settle karo, phir party karte hain 🍕" or "GPay fast, I am broke".
            - Use Indian Rupee symbol(₹).
            - Use lots of emojis.
            `;

            const message = await callGemini(prompt, addLog);
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
            `${m.name}: Net Balance ${Math.round(m.netBalance)} `
        ).join(', ');

        const prompt = `
        Analyze these expenses for group "${roomName}".
        Total Variable Cost: ₹${roundedTotalVar}
        Total Fixed Cost: ₹${roundedTotalFixed}
Breakdown:
        ${roundedBalances}
        
        Provide a fun, "roast-style" 3 - bullet summary in ** Hinglish ** for a Gen Z Indian group.
        
        1. Identify the ** "${selectedRichName} of the Group" ** 🤑 (Highest spender / creditor). 
           - ** GENDER CHECK:** If clearly a female name(e.g.Priya, Neha), use "Queen ${selectedRichName}" or "Madam".If male or unsure(e.g.Hasan, Umair, Ankit), use "Bhai" or "Sir".
           - Roast them gently about being rich.
        
        2. Identify the ** "Kanjoos Makkhichoos" ** 🐜 (Lowest spender / debtor). 
           - ** GENDER CHECK:** If clearly female, use "Didi" or "Behen".If male or unsure, use "Bhai" or "Bro".
           - Roast them BADLY for not spending money.

        3. ** Vibe Check ** 🧐: A funny, unhinged observation. 
           - ** MANDATORY:** You MUST include this specific roast phrase naturally in the sentence: ** "${selectedRoast}" ** (Adjust 'bhai/behen' in the phrase based on context.Default to 'bhai' if unsure).
        
        STRICT OUTPUT RULES:
        - ** Round ALL numbers **.No decimals allowed.
        - ** Start DIRECTLY ** with the first emoji.Do NOT say "Here is a roast".
        - Use Indian Rupee symbol(₹). 
        `;

        try {
            const text = await callGemini(prompt, addLog);
            setInsights(cleanText(text));
        } catch (e) {
            setInsights("Insights generate nahi ho paaye. Server lunch pe gaya hai! 🍕");
        } finally {
            setIsGeneratingInsights(false);
        }
    };

    const copyToClipboard = () => { safeCopy(draftedMessage); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); };
    const copyGroupCode = () => { safeCopy(groupId); setCopyCodeSuccess(true); setTimeout(() => setCopyCodeSuccess(false), 2000); };

    const parseExpenses = (str) => {
        if (!str) return 0;
        const matches = str.toString().match(/\b\d+(\.\d+)?(?!(st|nd|rd|th| ST| ND| RD| TH))\b/gi);
        if (!matches) return 0;
        return matches.reduce((sum, val) => sum + parseFloat(val), 0);
    };
    const addMember = () => {
        const newMember = { id: Date.now(), name: '', daysAbsent: 0, expenseInput: '', fixedExpenseInput: '', arrears: 0, isActive: true };
        const newMembers = [newMember, ...members];
        saveData(newMembers, undefined, undefined);
        setResults(null);
    };
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
            if (m.id.toString() === memberId.toString()) {
                return [{ ...m, name: firstName }, ...newMembersToAdd];
            }
            return m;
        });

        saveData(updatedMembers, undefined, undefined);
        setResults(null);
    };
    const removeMember = (id) => {
        const member = members.find(m => m.id.toString() === id.toString());
        if (!member) return;

        let newMembers;
        if (Math.abs(parseFloat(member.arrears || 0)) > 0.01) {
            newMembers = members.map(m => m.id.toString() === id.toString() ? { ...m, isActive: false } : m);
        } else {
            newMembers = members.filter(m => m.id.toString() !== id.toString());
        }
        saveData(newMembers, undefined, undefined);
        setResults(null);
    };
    const updateCustomSplits = (newSplits) => { saveData(undefined, undefined, newSplits); };
    const updateDays = (val) => {
        if (val !== '' && parseInt(val) < 0) val = '0';
        setDaysInMonth(val);
        saveData(undefined, val, undefined);
    };

    // --- UPDATED updateMember to handle MERGING guests ---
    const updateMember = (id, f, v) => {
        // Prevent out of bounds for days absent
        if (f === 'daysAbsent') {
            if (v !== '' && parseInt(v) < 0) v = '0';
            const maxDays = parseInt(daysInMonth) || 30;
            if (v !== '' && parseInt(v) > maxDays) v = String(maxDays);
        }

        const updatedMembers = members.map(m => m.id.toString() === id.toString() ? { ...m, [f]: v } : m);
        setMembers(updatedMembers); // Optimistic UI update to prevent cursor jumping
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

    // --- UNIFIED SETTLEMENT ENGINE ---
    const handleUnifiedSettle = (tx) => {
        setConfirmConfig({
            isOpen: true,
            title: "Settle Debt",
            message: `Mark ₹${tx.amount} from ${tx.from} to ${tx.to} as paid?`,
            type: "success",
            hideCancel: false,
            onConfirm: () => {
                const actualAmount = tx.exactAmount || tx.amount;
                let amountLeft = actualAmount;

                let updatedMembers = [...members];
                const payer = updatedMembers.find(m => m.id.toString() === tx.fromId.toString());
                const payee = updatedMembers.find(m => m.id.toString() === tx.toId.toString());

                let pArrears = parseFloat(payer?.arrears || 0);
                let rArrears = parseFloat(payee?.arrears || 0);

                // 1. Settle against historical Arrears if both have opposite historical debts
                let settleArrearsAmt = 0;
                if (pArrears < -0.01 && rArrears > 0.01) {
                    settleArrearsAmt = Math.min(amountLeft, Math.abs(pArrears), rArrears);
                    if (settleArrearsAmt > 0.01) {
                        payer.arrears = pArrears + settleArrearsAmt;
                        payee.arrears = rArrears - settleArrearsAmt;
                        amountLeft -= settleArrearsAmt;
                    }
                }

                // 2. Excess (or all) becomes a Custom Split to clear Current Month debts
                let updatedSplits = [...customSplits];
                if (amountLeft > 0.01) {
                    updatedSplits.push({
                        id: Date.now(),
                        payerId: tx.fromId,
                        amount: parseFloat(amountLeft.toFixed(2)),
                        involvedIds: [tx.toId],
                        description: `Settled debt to ${tx.to}`
                    });
                }

                // 3. Clean zero drift in arrears
                updatedMembers = updatedMembers.map(m => {
                    const arr = parseFloat(m.arrears || 0);
                    return { ...m, arrears: Math.abs(arr) < 1 ? "0.00" : arr.toFixed(2) };
                });

                // 4. Create Immutable Ledger Audit Record
                const ledgerId = Date.now().toString();
                setDoc(doc(db, "v6_groups", groupId, "ledger", ledgerId), {
                    id: ledgerId,
                    timestamp: new Date().toISOString(),
                    type: 'settlement',
                    fromId: tx.fromId,
                    fromName: tx.from,
                    toId: tx.toId,
                    toName: tx.to,
                    amount: actualAmount,
                    settledArrears: settleArrearsAmt,
                    createdSplitAmount: amountLeft > 0.01 ? parseFloat(amountLeft.toFixed(2)) : 0
                });

                saveData(updatedMembers, undefined, updatedSplits);

                if (results) calculate(updatedMembers, updatedSplits);
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleConfirmReceiptSplits = (newSplits) => {
        const updatedSplits = [...customSplits, ...newSplits];
        saveData(members, undefined, updatedSplits);
        setShowReceiptModal(false);
    };

    const handleCloseMonth = () => {
        if (!results) {
            setConfirmConfig({
                isOpen: true,
                title: "Action Required",
                message: "Please calculate the split first to determine final balances.",
                type: "warning",
                hideCancel: true,
                confirmText: "Got it",
                onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
            });
            return;
        }
        // Open the custom modal instead of window.prompt
        setShowArchiveModal(true);
    };

    const confirmCloseMonth = async (monthName) => {
        const monthId = Date.now().toString();
        const closedAt = new Date().toISOString();

        // 1. Wipe member state for the new month (carry arrears forward)
        const updatedMembers = members.map(m => {
            const balRecord = results.balances.find(b => b.id.toString() === m.id.toString());
            const newArrears = balRecord ? balRecord.netBalance : 0;
            return {
                ...m,
                arrears: newArrears,
                expenseInput: '',
                fixedExpenseInput: '',
                daysAbsent: 0
            };
        });

        // 2. Write the months/{monthId} root summary doc
        const monthRef = doc(db, "v6_groups", groupId, "months", monthId);
        await setDoc(monthRef, {
            id: monthId,
            name: monthName,
            closedAt,
            daysInMonth: parseInt(daysInMonth),
            mode: isMonthlyMode ? 'monthly' : 'normal',
            totalVariable: results.totalVariable || 0,
            totalFixed: results.totalFixed || 0,
            totalCustom: results.totalCustom || 0
        });

        // 3. Write a memberSnapshots/{memberId} sub-doc for each member (QUERYABLE numbers)
        const snapshotBatch = writeBatch(db);
        results.balances.forEach(balRecord => {
            const rawMember = members.find(m => m.id.toString() === balRecord.id.toString());
            const parseExpense = (str) => {
                if (!str) return 0;
                const nums = String(str).split(/[\s,]+/).map(Number).filter(n => !isNaN(n) && n > 0);
                return nums.reduce((a, b) => a + b, 0);
            };

            // Find custom splits this member was involved in
            const memberCustomSplits = customSplits
                .filter(s => s.involvedIds && s.involvedIds.map(String).includes(balRecord.id.toString()))
                .map(s => {
                    const involvedCount = s.involvedIds.length || 1;
                    return {
                        description: s.description || 'Unnamed',
                        amount: s.amount,
                        paidById: s.payerId,
                        paidByName: members.find(m => m.id.toString() === s.payerId.toString())?.name || 'Unknown',
                        yourShare: parseFloat((s.amount / involvedCount).toFixed(2)),
                        involvedCount
                    };
                });

            const snapshotRef = doc(db, "v6_groups", groupId, "months", monthId, "memberSnapshots", balRecord.id.toString());
            snapshotBatch.set(snapshotRef, {
                memberId: balRecord.id.toString(),
                memberName: balRecord.name,
                variableExpense: parseExpense(rawMember?.expenseInput),
                fixedExpense: parseExpense(rawMember?.fixedExpenseInput),
                daysPresent: balRecord.daysPresent || 0,
                daysAbsent: rawMember?.daysAbsent || 0,
                netBalance: parseFloat(balRecord.netBalance.toFixed(2)),
                arrearsCarriedIn: parseFloat((parseFloat(rawMember?.arrears || 0)).toFixed(2)),
                arrearsCarriedOut: parseFloat(balRecord.netBalance.toFixed(2)),
                customSplitItems: memberCustomSplits
            });
        });
        await snapshotBatch.commit();

        // 4. V6 Ledger: month_closed event linked to monthId
        const ledgerId = (Date.now() + 1).toString();
        await setDoc(doc(db, "v6_groups", groupId, "ledger", ledgerId), {
            id: ledgerId,
            timestamp: closedAt,
            type: 'month_closed',
            monthId,
            monthName,
            totalVariable: results.totalVariable || 0,
            totalFixed: results.totalFixed || 0
        });

        // 5. Clear current month data
        saveData(updatedMembers, undefined, []);
        setResults(null);
        setShowArchiveModal(false);
    };
    // ---------------------------------------------------

    const calculate = (overrideMembers = null, overrideSplits = null) => {
        setError('');
        setInvalidMemberIds([]);

        // Ensure overrideMembers is actually an array, not a React Event from onClick
        const membersToUse = Array.isArray(overrideMembers) ? overrideMembers : members;
        const splitsToUse = Array.isArray(overrideSplits) ? overrideSplits : customSplits;

        // --- 1. AUTO-CLEANUP: Filter out rows with empty names ---
        const validMembers = membersToUse.filter(m => m.name && m.name.trim() !== '');

        // Guard: If list is empty after cleanup, stop
        if (validMembers.length === 0) {
            setError('Please add at least one member to calculate.');
            return;
        }

        // Sync: If empty rows were found, update State & DB immediately so they disappear visually
        if (validMembers.length < membersToUse.length) {
            setMembers(validMembers);
            saveData(validMembers, undefined, undefined);
        }

        // --- 2. DUPLICATE CHECK & INACTIVE MERGE ---
        const activeMembers = validMembers.filter(m => m.isActive !== false);
        const activeNames = activeMembers.map(m => m.name.trim().toLowerCase());
        const uniqueActiveNames = new Set(activeNames);

        if (activeNames.length !== uniqueActiveNames.size) {
            setError("Duplicate active members detected. Please use unique names to distinguish them.");
            return;
        }

        // Auto-merge inactive members with the same name into the active members to gracefully restore arrears
        const finalMembersMap = new Map();

        validMembers.forEach(m => {
            const key = m.name.trim().toLowerCase();
            if (finalMembersMap.has(key)) {
                const existing = finalMembersMap.get(key);

                // If the new one is active, its inputs override the existing inactive placeholder
                if (m.isActive !== false) {
                    existing.isActive = true;
                    existing.daysAbsent = m.daysAbsent;
                    existing.expenseInput = m.expenseInput;
                    existing.fixedExpenseInput = m.fixedExpenseInput;
                    existing.id = m.id; // Switch ID to match active DOM input 
                }

                existing.arrears = ((parseFloat(existing.arrears) || 0) + (parseFloat(m.arrears) || 0)).toFixed(2);
            } else {
                finalMembersMap.set(key, { ...m });
            }
        });

        const dedupedMembers = Array.from(finalMembersMap.values());
        if (dedupedMembers.length !== validMembers.length) {
            setMembers(dedupedMembers);
            saveData(dedupedMembers, undefined, undefined);
        }
        // ---------------------------------------------

        const validDays = parseInt(daysInMonth) || 30;

        // Use deduped list going forward
        let extendedMembers = [...dedupedMembers];

        splitsToUse.forEach(s => {
            s.involvedIds.forEach(id => {
                if (typeof id === 'string' && id.startsWith('EXT:') && !extendedMembers.find(m => m.id.toString() === id.toString())) {
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
            daysPresent: m.isActive === false ? 0 : Math.max(0, validDays - (parseInt(m.daysAbsent) || 0)),
            totalPaidVar: m.isActive === false ? 0 : parseExpenses(m.expenseInput),
            totalPaidFixed: m.isActive === false ? 0 : parseExpenses(m.fixedExpenseInput),
            cCredit: 0,
            cDebit: 0,
            displayCDebit: 0 // Track for UI Side Share specifically
        }));

        const totalVar = proc.reduce((s, m) => s + m.totalPaidVar, 0);
        const realMembers = proc.filter(m => !m.isGuest);
        const totalPD = realMembers.reduce((s, m) => s + m.daysPresent, 0);

        const costPerDay = totalPD > 0 ? totalVar / totalPD : 0;
        const totalFixed = proc.reduce((s, m) => s + m.totalPaidFixed, 0);
        const fixedPerPerson = realMembers.length > 0 ? totalFixed / realMembers.length : 0;

        let totalCustom = 0;
        splitsToUse.forEach(s => {
            const isSettlement = s.description && s.description.startsWith('Settled');

            if (!isSettlement) {
                totalCustom += s.amount; // Only non-settlements count towards the top UI Custom Split total
            }

            // ALL splits (including current-month settlements) must affect actual math for Net Balance
            const p = proc.find(m => m.id.toString() === s.payerId.toString());
            if (p) p.cCredit += s.amount;

            if (s.involvedIds.length > 0) {
                const share = s.amount / s.involvedIds.length;
                s.involvedIds.forEach(id => {
                    const d = proc.find(m => m.id.toString() === id.toString());
                    if (d) {
                        d.cDebit += share;
                        if (!isSettlement) {
                            d.displayCDebit += share; // Only non-settlements show in Detailed Breakdown UI
                        }
                    }
                });
            }
        });

        const bals = proc.map(m => {
            const vShare = m.isGuest ? 0 : (m.daysPresent * costPerDay);
            const fShare = m.isGuest ? 0 : fixedPerPerson;
            const cShare = m.cDebit;
            const displayCShare = m.displayCDebit;
            let arr = parseFloat(m.arrears) || 0;

            // Wipe out floating point noise in historical arrears before math
            if (Math.abs(arr) < 1) arr = 0;

            let net = (m.totalPaidVar + m.totalPaidFixed + m.cCredit) - (vShare + fShare + cShare) + arr;

            // Wipe out floating point noise in the final net balance
            if (Math.abs(net) < 1) net = 0;

            return { ...m, variableShare: vShare, fixedShare: fShare, customShare: cShare, displayCustomShare: displayCShare, arrears: arr, netBalance: parseFloat(net.toFixed(2)) };
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
                txs.push({ from: d.name || 'Unknown', to: c.name || 'Unknown', amount: displayAmt, exactAmount: exactAmt, fromId: d.id, toId: c.id });
            }

            d.amount += exactAmt; c.amount -= exactAmt;
            if (Math.abs(d.amount) < 0.01) i++; if (c.amount < 0.01) j++;
        }
        setResults({ totalVariable: totalVar, totalFixed: totalFixed, totalCustom: totalCustom, totalPersonDays: totalPD, costPerPersonDay: costPerDay, balances: bals, transactions: txs });
    };

    const handleCalculateWithShimmer = () => {
        setIsShimmering(true);
        // Haptic feedback if supported
        if (settings?.vibrationEnabled && window.navigator.vibrate) window.navigator.vibrate([15, 30, 15]);

        setTimeout(() => {
            calculate();
            setIsModifying(false);
            setIsShimmering(false);
        }, 800);
    };

    // Shimmer CSS
    const shimmerAnimation = `
      @keyframes shimmer {
        100% { transform: translateX(200%); }
      }
      @keyframes rgbGlow {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      .rgb-border {
         background: linear-gradient(90deg, #ff007f, #7f00ff, #00d4ff, #4ade80, #ff007f);
         background-size: 300% 300%;
         animation: rgbGlow 4s ease infinite;
      }
    `;

    if (loadingData) return <LoadingScreen message="Loading expenses..." />;

    if (!groupExists) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-red-100 text-center max-w-sm">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Group Not Found</h3>
                <p className="text-slate-500 mb-6">This group (ID: {groupId}) does not exist or has been deleted.</p>
                <button onClick={onLeaveGroup} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800">Go Home</button>
            </div>
        </div>
    );

    return (
        <>
            <div className="min-h-screen font-sans relative overflow-x-hidden" style={{ backgroundColor: '#F3F4F6' }}>
                <style>{pulseAnimation}{shimmerAnimation}</style>

                {/* Mesh Background */}
                <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-300/30 rounded-full blur-[100px] mix-blend-multiply animate-pulse duration-[10000ms]" />
                    <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-purple-300/30 rounded-full blur-[100px] mix-blend-multiply animate-pulse duration-[8000ms]" />
                    <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] bg-blue-300/30 rounded-full blur-[100px] mix-blend-multiply animate-pulse duration-[12000ms]" />
                    <div
                        className="absolute inset-0 opacity-[0.04]"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
                    />
                </div>

                {/* MODALS */}
                <OnboardingTour isOpen={showOnboarding} onClose={closeOnboarding} />
                <LedgerModal isOpen={showLedger} onClose={() => setShowLedger(false)} archives={archives} groupId={groupId} />
                <ArchiveMonthModal
                    isOpen={showArchiveModal}
                    onClose={() => setShowArchiveModal(false)}
                    onConfirm={confirmCloseMonth}
                />
                <ActivityFeedModal
                    isOpen={showActivityFeed}
                    onClose={() => setShowActivityFeed(false)}
                    groupId={groupId}
                />

                <GroupHeader
                    onLeaveGroup={onLeaveGroup}
                    roomName={roomName}
                    groupId={groupId}
                    copyGroupCode={copyGroupCode}
                    copyCodeSuccess={copyCodeSuccess}
                    devMode={devMode}
                    setDevMode={setDevMode}
                    setShowActivityFeed={setShowActivityFeed}
                    setShowLedger={setShowLedger}
                    setShowOnboarding={setShowOnboarding}
                />

                <div className="relative z-10 w-full max-w-[1400px] mx-auto p-4 md:p-8 pb-32 md:pb-40">
                    <StatusBanner
                        isSettled={isSettled}
                        setResults={setResults}
                        generateInsights={generateInsights}
                        isGeneratingInsights={isGeneratingInsights}
                        setShowArchiveModal={setShowArchiveModal}
                    />

                    {/* Unbalanced Arrears Warning */}
                    {(() => {
                        const totalArr = members.reduce((sum, m) => sum + (parseFloat(m.arrears) || 0), 0);
                        if (Math.abs(totalArr) > 1 && members.length > 0) {
                            return (
                                <div className="mb-6 px-6 py-4 bg-red-50/80 backdrop-blur-xl border border-red-200/50 rounded-[2rem] shadow-sm animate-in slide-in-from-top-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-start sm:items-center gap-3">
                                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 sm:mt-0" />
                                        <span className="text-sm font-bold text-red-800 leading-tight">
                                            Warning: Group arrears are unbalanced by ₹{Math.abs(totalArr).toFixed(2)}. Final settlement checks may be offset.
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (window.confirm("Are you sure you want to zero out ALL arrears for the group? This cannot be undone.")) {
                                                const zeroedMembers = members.map(m => ({ ...m, arrears: "0.00" }));
                                                saveData(zeroedMembers);
                                                setResults(null);
                                            }
                                        }}
                                        className="text-xs font-black uppercase tracking-widest text-red-600 bg-white hover:bg-red-50 px-5 py-3 rounded-xl shadow-sm transition-colors whitespace-nowrap focus:outline-none"
                                    >
                                        Zero All Arrears
                                    </button>
                                </div>
                            );
                        }
                        return null;
                    })()}

                    {/* Pending Debts (Arrears Preview) */}
                    {(!results || isModifying) && pendingDebts.length > 0 && (
                        <div className="mb-6 px-6 py-5 bg-orange-50/80 backdrop-blur-xl border border-orange-200/50 rounded-[2rem] shadow-sm animate-in slide-in-from-top-4">
                            <div className="flex flex-col xl:flex-row xl:items-center gap-5">
                                <h3 className="text-xs font-black text-orange-800 flex items-center gap-2 uppercase tracking-[0.2em] flex-shrink-0">
                                    <AlertCircle className="w-4 h-4" /> Pending Debts
                                </h3>
                                <div className="flex flex-wrap gap-3 flex-1">
                                    {pendingDebts.map((tx, idx) => (
                                        <div key={idx} className="bg-white/90 backdrop-blur-sm p-3 px-4 rounded-2xl shadow-sm border border-orange-100 flex items-center justify-between flex-1 min-w-[240px] max-w-[320px] group hover:border-orange-300 hover:-translate-y-0.5 transition-all">
                                            <div className="text-xs font-bold">
                                                <span className="text-slate-800">{tx.from}</span> <span className="text-slate-400 font-medium whitespace-nowrap">owes {tx.to}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-black text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg text-xs tracking-tight">₹{tx.amount}</span>
                                                <button
                                                    onClick={() => handleUnifiedSettle(tx)}
                                                    className="opacity-0 group-hover:opacity-100 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg p-1.5 transition-all shadow-sm translate-x-2 group-hover:translate-x-0 outline-none focus:outline-none"
                                                    title="Settle this debt instantly"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Bento Grid */}
                    <div className={`grid lg:grid-cols-12 gap-6 lg:gap-8 transition-all duration-500 ${isSettled ? 'grayscale-[0.3]' : ''}`}>

                        {/* LEFT COLUMN */}
                        <div className={`flex flex-col gap-6 min-w-0 transition-all duration-700 ${!isModifying && results ? 'lg:col-span-7' : 'lg:col-span-4'}`}>
                            {(!results || isModifying) && (
                                <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-500">
                                    <h2 className="text-2xl font-black text-slate-800 mb-[-10px]">Split Overview</h2>

                                    {/* Control Bento Box */}
                                    <div className="bg-white/60 backdrop-blur-2xl rounded-[2rem] p-3 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/40 flex justify-between items-center">
                                        <div className={`flex items-center bg-white/50 p-1.5 rounded-2xl border border-white max-w-fit shadow-inner ${isSettled ? 'pointer-events-none opacity-50' : ''}`}>
                                            <button
                                                onClick={() => setIsMonthlyMode(false)}
                                                className={`px-5 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${!isMonthlyMode ? 'bg-white text-indigo-600 shadow-md border border-slate-100 shrink-0' : 'text-slate-400 hover:text-slate-600 shrink-0'}`}
                                            >
                                                Normal Split
                                            </button>
                                            <button
                                                onClick={() => setIsMonthlyMode(true)}
                                                className={`px-5 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${isMonthlyMode ? 'bg-white text-emerald-600 shadow-md border border-slate-100 shrink-0' : 'text-slate-400 hover:text-slate-600 shrink-0'}`}
                                            >
                                                Monthly
                                            </button>
                                            {isMonthlyMode && (
                                                <div className="flex items-center gap-2 px-3 border-l border-slate-200/50 shrink-0 animate-in fade-in slide-in-from-left-4">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    <input type="number" value={daysInMonth} onChange={(e) => updateDays(e.target.value)} className="w-10 bg-transparent font-black text-slate-700 text-center outline-none" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Split Analysis Placeholder */}
                                    <div className="bg-white/40 backdrop-blur-xl rounded-[2rem] p-10 shadow-sm border border-white/40 flex flex-col items-center justify-center text-center opacity-60">
                                        <Calculator className="w-12 h-12 text-slate-300 mb-4" />
                                        <p className="font-bold text-slate-500">Analysis Pending</p>
                                    </div>
                                </div>
                            )}

                            {/* Split Analysis Bento Box (KPIs for Results View) */}
                            {results && !isModifying && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in zoom-in-95 duration-500">
                                    <div className="bg-white/80 backdrop-blur-2xl rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-blue-100 rounded-full blur-xl group-hover:scale-150 transition-all duration-500"></div>
                                        <div className="relative z-10 flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-blue-100/50 rounded-xl">
                                                    <Calculator className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <p className="text-slate-500 text-[10px] sm:text-xs font-black uppercase tracking-widest">Total Expense</p>
                                            </div>
                                            <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">₹{results.totalVariable.toFixed(0)}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white/80 backdrop-blur-2xl rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-rose-100 rounded-full blur-xl group-hover:scale-150 transition-all duration-500"></div>
                                        <div className="relative z-10 flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-rose-100/50 rounded-xl">
                                                    <Sparkles className="w-4 h-4 text-rose-600" />
                                                </div>
                                                <p className="text-slate-500 text-[10px] sm:text-xs font-black uppercase tracking-widest">Total Custom</p>
                                            </div>
                                            <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">₹{results.totalCustom.toFixed(0)}</p>
                                        </div>
                                    </div>

                                    <div className="bg-white/80 backdrop-blur-2xl rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-amber-100 rounded-full blur-xl group-hover:scale-150 transition-all duration-500"></div>
                                        <div className="relative z-10 flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-amber-100/50 rounded-xl">
                                                    <HistoryIcon className="w-4 h-4 text-amber-600" />
                                                </div>
                                                <p className="text-slate-500 text-[10px] sm:text-xs font-black uppercase tracking-widest">Total Arrears</p>
                                            </div>
                                            <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">₹{pendingDebts.reduce((sum, tx) => sum + tx.amount, 0).toFixed(0)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* AI Insights Bento Box - RGB Glow */}
                            {results && !isModifying && (
                                <div className="relative p-[2px] rounded-[2rem] group/ai mt-2">
                                    {/* Animated RGB Border */}
                                    <div className="absolute inset-0 rgb-border rounded-[2rem] opacity-70 group-hover/ai:opacity-100 transition-opacity" />

                                    <div className="relative bg-white/90 backdrop-blur-3xl rounded-[calc(2rem-2px)] p-6 sm:p-8 h-full transition-all duration-300">
                                        <div className={`flex justify-between items-center ${isInsightsMinimized ? '' : 'mb-5'}`}>
                                            <h3 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center gap-2 cursor-pointer select-none" onClick={() => setIsInsightsMinimized(!isInsightsMinimized)}>
                                                <Sparkles className="w-5 h-5 text-purple-600" /> AI Insights
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                {insights && !isInsightsMinimized && (
                                                    <button
                                                        onClick={generateInsights}
                                                        disabled={isGeneratingInsights}
                                                        title="Get a new roast"
                                                        className="p-2 rounded-xl text-purple-500 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-40 transition-all active:scale-95 animate-in fade-in"
                                                    >
                                                        {isGeneratingInsights ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                                    </button>
                                                )}
                                                {!insights && !isInsightsMinimized && (
                                                    <button
                                                        onClick={generateInsights}
                                                        disabled={isGeneratingInsights}
                                                        className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 hover:shadow-lg disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2 animate-in fade-in"
                                                    >
                                                        {isGeneratingInsights ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analyze Group"}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setIsInsightsMinimized(!isInsightsMinimized)}
                                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                                                >
                                                    {isInsightsMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {!isInsightsMinimized && (
                                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                                {insights ? (
                                                    <div className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-line">
                                                        {insights}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-slate-400">Generate an AI-driven roast or summary based on this month's spending patterns.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Detailed Breakdown Bento Box */}
                            {results && !isModifying && (
                                <div className="bg-white/60 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/40 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                                    <DetailedBreakdown results={results} daysInMonth={daysInMonth} isMonthlyMode={isMonthlyMode} />
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className={`flex flex-col gap-6 min-w-0 transition-all duration-700 ${!isModifying && results ? 'lg:col-span-5' : 'lg:col-span-8'}`}>
                            <div className="flex items-center justify-between mb-[-10px]">
                                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Active Members</h2>
                                {!isModifying && results && (
                                    <div className="bg-emerald-100/50 backdrop-blur-md text-emerald-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200/50 flex items-center gap-2 shadow-sm">
                                        <Check className="w-3.5 h-3.5" /> Locked
                                    </div>
                                )}
                            </div>

                            {/* Members Grid Bento */}
                            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 relative transition-all duration-500 ${!isModifying && results ? 'opacity-80' : ''}`}>
                                {members.filter(m => m.isActive !== false).map(m => (
                                    <MemberCard
                                        key={m.id}
                                        member={m}
                                        daysInMonth={daysInMonth}
                                        isMonthlyMode={isMonthlyMode}
                                        updateMember={updateMember}
                                        removeMember={removeMember}
                                        onSmartParse={(id, text) => openSmartAddModal(id, text)}
                                        onNameSplit={handleNameSplit}
                                        isDuplicate={members.filter(mem => mem.name.trim().toLowerCase() === m.name.trim().toLowerCase() && mem.name.trim() !== '').length > 1}
                                        isInvalid={invalidMemberIds.includes(m.id)}
                                        isLocked={(!isModifying && !!results) || isSettled}
                                        isShimmering={isShimmering}
                                    />
                                ))}

                                {/* Add Member Bento */}
                                {!isSettled && (isModifying || !results) && (
                                    <button
                                        onClick={addMember}
                                        className="bg-white/40 backdrop-blur-md rounded-2xl border-2 border-dashed border-white/80 p-6 flex flex-col items-center justify-center gap-3 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-white/80 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all group animate-in zoom-in-95 min-h-[140px]"
                                    >
                                        <div className="bg-white shadow-sm p-4 rounded-full group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 group-hover:scale-110">
                                            <Plus className="w-5 h-5" />
                                        </div>
                                        <span className="font-black text-[11px] uppercase tracking-[0.2em]">Add Member</span>
                                    </button>
                                )}

                                {/* Custom Splits Dashboard Widget */}
                                <div className={`w-full transition-all duration-500 ${isSettled || (!isModifying && results) ? 'pointer-events-none opacity-80' : ''}`}>
                                    <CustomSplitSummaryCard
                                        customSplits={customSplits}
                                        onClickManage={() => setIsCustomSplitModalOpen(true)}
                                    />
                                </div>

                                {/* Hover Overlay — Modify Split */}
                                {!isModifying && results && (
                                    <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 hover:opacity-100 hover:backdrop-blur-sm transition-all duration-500 bg-slate-900/5 rounded-3xl">
                                        <button
                                            onClick={() => {
                                                if (isSettled) setResults(null);
                                                else setIsModifying(true);
                                            }}
                                            className="bg-white/90 backdrop-blur-xl text-indigo-600 px-8 py-4 rounded-[2rem] font-black uppercase tracking-[0.1em] text-sm shadow-2xl hover:bg-indigo-600 hover:text-white active:scale-95 transition-all flex items-center gap-3 border border-white"
                                        >
                                            <Edit3 className="w-5 h-5" /> Modify Split
                                        </button>
                                    </div>
                                )}
                            </div>

                        {/* Action / Settlement bottom bar docked relative */}
                        {results && !isModifying && (
                            <div className="w-full mt-4 transition-all duration-500 opacity-100 scale-100 animate-in fade-in slide-in-from-bottom-4">
                                <SettlementPlan
                                    results={results}
                                    isSettled={isSettled}
                                    handleUnifiedSettle={handleUnifiedSettle}
                                    handleDraftMessage={handleDraftMessage}
                                    handleCloseMonth={handleCloseMonth}
                                />
                            </div>
                        )}

                    </div>
                </div>

                {/* Sticky Floating Dock for Calculation / Scanning */}
                <div className="fixed bottom-6 left-0 right-0 z-40 pointer-events-none flex justify-center px-4">
                    {(isModifying || !results) ? (
                        /* EDITING MODE: Full dock */
                        <div className="pointer-events-auto bg-white/80 backdrop-blur-2xl p-2 rounded-[2.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-white/50 flex items-center gap-2 max-w-[600px] w-full animate-in slide-in-from-bottom-8">
                            <button
                                onClick={handleCalculateWithShimmer}
                                className="flex-1 px-8 py-5 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-[0.15em] text-xs rounded-[2rem] shadow-[0_5px_20px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 flex justify-center items-center gap-3 group"
                            >
                                {isShimmering ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calculator className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
                                <span>{isShimmering ? "Calculating..." : "Show Results"}</span>
                            </button>

                            <div className="w-px h-8 bg-slate-200 mx-1 hidden sm:block"></div>

                            <button
                                onClick={() => setShowReceiptModal(true)}
                                className="px-6 py-5 bg-white hover:bg-slate-50 text-slate-800 font-bold tracking-wide rounded-[2rem] text-sm shadow-sm transition-all active:scale-[0.98] flex items-center gap-2 flex-shrink-0"
                            >
                                <Camera className="w-5 h-5" />
                                <span className="hidden sm:inline">Scan Bill</span>
                            </button>
                        </div>
                    ) : (
                        /* RESULTS MODE: Compact close pill — small, unobtrusive */
                        <div className="pointer-events-auto animate-in slide-in-from-bottom-4">
                            <button
                                onClick={() => setIsModifying(true)}
                                className="bg-white/70 backdrop-blur-xl hover:bg-white text-slate-500 hover:text-slate-800 px-5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest border border-slate-200/60 shadow-lg transition-all active:scale-95 flex items-center gap-2"
                            >
                                <X className="w-3.5 h-3.5" /> Modify
                            </button>
                        </div>
                    )}
                </div>

            </div>

            {/* ERROR TOAST - Overlays floating dock */}
            {
                error && (
                    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50">
                        <div className="bg-red-50/95 backdrop-blur-xl border-2 border-red-200/50 px-6 py-3 rounded-[2rem] shadow-2xl flex items-center gap-3 text-red-700 animate-in slide-in-from-bottom-4 fade-in">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <p className="text-xs font-black tracking-widest uppercase">{error}</p>
                            <button onClick={() => setError('')} className="p-1 hover:bg-red-100 rounded-full ml-2 transition-colors"><X className="w-4 h-4" /></button>
                        </div>
                    </div>
                )
            }

            {/* MODALS START HERE (Outside main container for layering) */}

            <Modal
                isOpen={showParseModal}
                onClose={() => setShowParseModal(false)}
                title={`AI Smart Add ${emoji('✨')}`}
                maxWidth="max-w-md"
            >
                <p className="text-slate-400 text-xs font-medium mb-6 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    Paste raw text (messages, notes, or bills). Our AI will extract individual amounts and add them instantly.
                </p>

                {
                    parseError && (
                        <div className="text-red-500 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 bg-red-50 p-3 rounded-xl border border-red-100 animate-pulse">
                            <AlertCircle className="w-4 h-4" /> {parseError}
                        </div>
                    )
                }

                <textarea
                    autoFocus
                    className="w-full h-40 bg-slate-50 border-2 border-slate-100 p-5 rounded-[2rem] outline-none focus:border-indigo-500 font-bold text-slate-700 placeholder-slate-300 transition-all mb-6 resize-none"
                    placeholder="Example: Dinner 450, Drinks 200, Car 100"
                    value={parseText}
                    onChange={(e) => setParseText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && e.metaKey && handleSmartParse()}
                />

                <div className="flex gap-3">
                    <button onClick={() => setShowParseModal(false)} className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600">Cancel</button>
                    <button
                        onClick={handleSmartParse}
                        disabled={!parseText.trim() || isParsing}
                        className="flex-[2] bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                    >
                        {isParsing ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Extract Now {emoji('🚀')}</>}
                    </button>
                </div>
            </Modal >

            {
                showDraftModal && (
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
                )
            }

            <CustomSplitModal
                isOpen={isCustomSplitModalOpen}
                onClose={() => setIsCustomSplitModalOpen(false)}
                members={members}
                customSplits={customSplits}
                setCustomSplits={updateCustomSplits}
            />

            <ReceiptSplitterModal
                isOpen={showReceiptModal}
                onClose={() => setShowReceiptModal(false)}
                members={members}
                onConfirmSplits={handleConfirmReceiptSplits}
            />

            <ConfirmModal
                {...confirmConfig}
                onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
            />

            {/* 👇👇👇 DEVELOPER CONSOLE 👇👇👇 */}
            {
                devMode && (
                    <div className="fixed bottom-0 left-0 right-0 h-48 bg-black/90 text-green-400 p-4 font-mono text-xs overflow-y-auto z-[60] border-t-2 border-green-500">
                        <div className="flex justify-between mb-2">
                            <span className="font-bold">DEVELOPER CONSOLE</span>
                            <button onClick={() => setDevMode(false)} className="text-red-400">CLOSE</button>
                        </div>
                        <div>API Key Present: {apiKey ? "YES" : "NO"}</div>
                        {logs.map((log, i) => <div key={i} className="border-b border-gray-800 py-1">{log}</div>)}
                    </div>
                )
            }
            </div>
        </>
    );
};

export default ExpenseSplitter;
