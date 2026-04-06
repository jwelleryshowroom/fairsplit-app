import { useState, useEffect, useCallback } from 'react';
import {
    collection, addDoc, onSnapshot, doc, setDoc,
    updateDoc, deleteDoc, serverTimestamp, query, orderBy, getDocs, where
} from 'firebase/firestore';
import { db } from '../firebase';

const AMOUNT_PATTERNS = [
    // Standard "INR 122.00 debited/credited" / "Rs. 500 paid/received"
    /(?:inr|rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)[^A-Za-z0-9]*(?:is |has been )?(?:debited|deducted|paid|spent|sent|transferred|credited|received|added|deposited)/i,
    // "debited/credited Rs. 500"
    /(?:debited|deducted|paid|spent|sent|transferred|credited|received|added|deposited)[^0-9]*(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    // UPI / VPA amounts "UPI ... Rs. 500"
    /upi.*?(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    // Generic fallback if standard keywords fail but amount is clear
    /(?:paid|sent|received|added)\s+(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i
];

const MERCHANT_PATTERNS = [
    // UPI standard format: UPI/P2A/205389639687/Miss RIYA KUMARI
    /UPI\/(?:P2M|P2A|P2P)\/[^\/]+\/([^\r\n]+)/i,
    // "to [Merchant]" or "at [Merchant]"
    /(?:to|at|for|from|->)\s+([A-Z][A-Za-z0-9\s&'-]{2,30}?)(?:\s+(?:on|via|ref|upi|txn|order)|[.,!]|$)/i,
    // "VPA: name@bank"
    /(?:VPA|UPI ID|to VPA|from VPA):\s*([a-zA-Z0-9._-]+@[a-zA-Z0-9]+)/i,
];

const parseAmount = (text) => {
    for (const pattern of AMOUNT_PATTERNS) {
        const match = text.match(pattern);
        if (match) {
            const cleaned = match[1].replace(/,/g, '');
            const amount = parseFloat(cleaned);
            if (!isNaN(amount) && amount > 0) return amount;
        }
    }
    return null;
};

const parseMerchant = (text) => {
    for (const pattern of MERCHANT_PATTERNS) {
        const match = text.match(pattern);
        if (match && match[1]) return match[1].trim();
    }
    return null;
};

const parseType = (text) => {
    return /(?:credited|received|added|deposited|refund|to you)/i.test(text) ? 'credit' : 'debit';
};

const isLikelyBankSMS = (text) => {
    return AMOUNT_PATTERNS.some(p => p.test(text));
};

export const useSmartInbox = (user) => {
    const [transactions, setTransactions] = useState([]);
    const [userGroups, setUserGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const userId = user?.uid;

    // --- Real-time listener on pending_transactions ---
    useEffect(() => {
        if (!userId) return;
        const ref = collection(db, 'pending_transactions', userId, 'items');
        const q = query(ref, orderBy('timestamp', 'desc'));

        const unsub = onSnapshot(q, (snap) => {
            const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setTransactions(items);
            setIsLoading(false);
        }, () => setIsLoading(false));

        return () => unsub();
    }, [userId]);

    // --- Fetch user's groups for the group picker ---
    useEffect(() => {
        if (!userId) return;
        const fetchGroups = async () => {
            try {
                const q = query(collection(db, 'v6_groups'), where('createdBy', '==', userId));
                const snap = await getDocs(q);
                const groups = snap.docs.map(d => ({ id: d.id, roomName: d.data().roomName || d.id }));
                setUserGroups(groups);
            } catch (e) {
                console.error('SmartInbox: failed to fetch groups', e);
            }
        };
        fetchGroups();
    }, [userId]);

    // --- Add a transaction ---
    const addTransaction = useCallback(async (amount, merchant, rawText = '', source = 'manual', type = 'debit') => {
        if (!userId) return;
        try {
            await addDoc(collection(db, 'pending_transactions', userId, 'items'), {
                amount,
                merchant: merchant || 'Unknown',
                rawText,
                source,
                type,
                status: 'pending',
                timestamp: serverTimestamp(),
            });
        } catch (e) {
            console.error('SmartInbox: addTransaction failed', e);
        }
    }, [userId]);

    // --- Assign as Home Bill: append amount to the paying member's expenseInput ---
    const assignAsHomeBill = useCallback(async (txId, groupId, groupName, groupMembers) => {
        if (!userId) return;
        try {
            const tx = transactions.find(t => t.id === txId);
            if (!tx) return;

            const activeMembers = (groupMembers || []).filter(m => m.isActive !== false);
            const myName = user?.displayName?.toLowerCase();
            const myEmailPrefix = user?.email?.split('@')[0].toLowerCase();
            const me = activeMembers.find(m =>
                (myName && m.name.toLowerCase() === myName) ||
                (myEmailPrefix && m.name.toLowerCase() === myEmailPrefix)
            ) || activeMembers[0];

            if (me) {
                // Append amount to the payer's expenseInput (space-separated numbers)
                const currentInput = me.expenseInput ? me.expenseInput.toString().trim() : '';
                const newInput = currentInput ? `${currentInput} ${tx.amount}` : `${tx.amount}`;
                await updateDoc(doc(db, 'v6_groups', groupId, 'members', me.id.toString()), {
                    expenseInput: newInput,
                });
            }

            await updateDoc(doc(db, 'pending_transactions', userId, 'items', txId), {
                status: 'group_home',
                assignedGroupId: groupId,
                assignedGroupName: groupName,
            });
        } catch (e) {
            console.error('SmartInbox: assignAsHomeBill failed', e);
        }
    }, [userId, transactions, user]);

    // --- Assign as Custom Split (only with selectedMemberIds) ---
    const assignAsCustomSplit = useCallback(async (txId, groupId, groupName, groupMembers, selectedMemberIds, customDescription) => {
        if (!userId) return;
        try {
            const tx = transactions.find(t => t.id === txId);
            if (!tx) return;

            const allActive = (groupMembers || []).filter(m => m.isActive !== false);
            const myName = user?.displayName?.toLowerCase();
            const myEmailPrefix = user?.email?.split('@')[0].toLowerCase();
            const me = allActive.find(m =>
                (myName && m.name.toLowerCase() === myName) ||
                (myEmailPrefix && m.name.toLowerCase() === myEmailPrefix)
            ) || allActive[0];

            const involvedIds = selectedMemberIds?.length > 0 ? selectedMemberIds : allActive.map(m => m.id);

            if (allActive.length > 0) {
                const splitId = Date.now().toString();
                await setDoc(doc(db, 'v6_groups', groupId, 'customSplits', splitId), {
                    id: splitId,
                    payerId: me?.id ?? allActive[0].id,
                    amount: tx.amount,
                    involvedIds,
                    description: customDescription || `👥 Split: ${tx.merchant || 'Expense'}`,
                });
            }

            await updateDoc(doc(db, 'pending_transactions', userId, 'items', txId), {
                status: 'group_split',
                assignedGroupId: groupId,
                assignedGroupName: groupName,
            });
        } catch (e) {
            console.error('SmartInbox: assignAsCustomSplit failed', e);
        }
    }, [userId, transactions, user]);

    // --- Mark as personal / ignore (Don't delete, just hide) ---
    const markPersonal = useCallback(async (txId) => {
        if (!userId) return;
        try {
            await updateDoc(doc(db, 'pending_transactions', userId, 'items', txId), {
                status: 'ignored',
            });
        } catch (e) {
            console.error('SmartInbox: markPersonal failed', e);
        }
    }, [userId]);

    const clearAllTransactions = useCallback(async (filterType = 'all') => {
        if (!userId) return;
        try {
            const pending = transactions.filter(t => t.status === 'pending');
            const toHide = filterType === 'all' 
                ? pending 
                : pending.filter(t => t.type === filterType);
                
            const batch = toHide.map(t =>
                updateDoc(doc(db, 'pending_transactions', userId, 'items', t.id), {
                    status: 'ignored'
                })
            );
            await Promise.all(batch);
        } catch (e) {
            console.error('SmartInbox: clearAllTransactions failed', e);
        }
    }, [userId, transactions]);

    // --- Auto-detect on window focus AND tab switch ---
    useEffect(() => {
        if (!userId) return;

        // --- Listen for native Android events (Phase 3) ---
        const handleNativeTransaction = (event) => {
            try {
                // Capacitor triggers a window event. The data is usually in event.detail or the data string itself
                // Our Java code does: triggerWindowJSEvent("nativeTransaction", data.toString())
                const data = typeof event.detail === 'string' ? JSON.parse(event.detail) : event.detail;
                if (data && data.amount) {
                    addTransaction(data.amount, data.merchant, data.rawText, data.source || 'native', data.type || 'debit');
                }
            } catch (e) {
                console.error('SmartInbox: failed to handle native event', e);
            }
        };

        window.addEventListener('nativeTransaction', handleNativeTransaction);

        return () => {
            window.removeEventListener('nativeTransaction', handleNativeTransaction);
        };
    }, [userId, addTransaction]);

    const pendingCount = transactions.filter(t => t.status === 'pending').length;
    const pendingTransactions = transactions.filter(t => t.status === 'pending');

    return {
        transactions,
        pendingTransactions,
        pendingCount,
        userGroups,
        isLoading,
        addTransaction,
        assignAsHomeBill,
        assignAsCustomSplit,
        markPersonal,
        clearAllTransactions,
    };
};
