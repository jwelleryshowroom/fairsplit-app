import { useState, useEffect, useCallback } from 'react';
import {
    collection, addDoc, onSnapshot, doc,
    updateDoc, deleteDoc, serverTimestamp, query, orderBy, getDocs, where
} from 'firebase/firestore';
import { db } from '../firebase';

// --- Bank SMS / UPI regex patterns (Indian formats) ---
const AMOUNT_PATTERNS = [
    // "INR 122.00 debited" (Axis Bank style)
    /(?:inr|₹)\s*([\d,]+(?:\.\d{1,2})?)\s*.{0,40}(?:debited|deducted|paid|spent|sent)/i,
    // "debited Rs. 500 from your account"
    /(?:debited|deducted|paid|spent|sent|transferred).{0,40}(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    // "Rs. 500 debited" or "Rs.500 paid to"
    /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)\s*.{0,40}(?:debited|deducted|paid|spent|sent|transferred)/i,
    // "Rs. 500 was paid to"
    /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:was\s+)?(?:paid|sent|transferred)\s+(?:to|at|for)/i,
    // "paid Rs. 500"
    /paid\s+(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    // "UPI ... Rs. 500"
    /upi.{0,20}(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
];

const MERCHANT_PATTERNS = [
    /(?:to|at|for|->)\s+([A-Z][A-Za-z0-9\s&'-]{2,30}?)(?:\s+(?:on|via|ref|upi|txn|order)|[.,!]|$)/,
    /(?:VPA|UPI ID):\s*([a-zA-Z0-9._-]+@[a-zA-Z0-9]+)/,
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
    const addTransaction = useCallback(async (amount, merchant, rawText = '', source = 'manual') => {
        if (!userId) return;
        try {
            await addDoc(collection(db, 'pending_transactions', userId, 'items'), {
                amount,
                merchant: merchant || 'Unknown',
                rawText,
                source,
                status: 'pending',
                timestamp: serverTimestamp(),
            });
        } catch (e) {
            console.error('SmartInbox: addTransaction failed', e);
        }
    }, [userId]);

    // --- Mark as assigned to group ---
    const assignToGroup = useCallback(async (txId, groupId, groupName) => {
        if (!userId) return;
        try {
            await updateDoc(doc(db, 'pending_transactions', userId, 'items', txId), {
                status: 'group',
                assignedGroupId: groupId,
                assignedGroupName: groupName,
            });
        } catch (e) {
            console.error('SmartInbox: assignToGroup failed', e);
        }
    }, [userId]);

    // --- Mark as personal / ignore ---
    const markPersonal = useCallback(async (txId) => {
        if (!userId) return;
        try {
            await deleteDoc(doc(db, 'pending_transactions', userId, 'items', txId));
        } catch (e) {
            console.error('SmartInbox: markPersonal failed', e);
        }
    }, [userId]);

    // --- Clipboard scan function (exposed for manual button + auto triggers) ---
    const scanClipboard = useCallback(async () => {
        try {
            if (!navigator.clipboard?.readText) return;
            const text = await navigator.clipboard.readText();
            if (!text || text.length > 800) return;
            if (!isLikelyBankSMS(text)) return;

            // Avoid duplicating the same clipboard entry
            const existingRaw = transactions.map(t => t.rawText);
            if (existingRaw.includes(text)) return;

            const amount = parseAmount(text);
            const merchant = parseMerchant(text);
            if (amount) {
                await addTransaction(amount, merchant, text, 'clipboard');
            }
        } catch {
            // Clipboard read permission denied — silently ignore
        }
    }, [transactions, addTransaction]);

    // --- Auto-detect on window focus AND tab switch ---
    useEffect(() => {
        if (!userId) return;

        const handleFocus = () => scanClipboard();
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') scanClipboard();
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibility);
        return () => {
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [userId, scanClipboard]);

    const pendingCount = transactions.filter(t => t.status === 'pending').length;
    const pendingTransactions = transactions.filter(t => t.status === 'pending');

    return {
        transactions,
        pendingTransactions,
        pendingCount,
        userGroups,
        isLoading,
        addTransaction,
        assignToGroup,
        markPersonal,
        scanClipboard,
    };
};
