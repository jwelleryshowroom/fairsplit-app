import { useState, useEffect } from 'react';
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export const useSettlementEngine = (
    groupId,
    members,
    customSplits,
    daysInMonth,
    setMembers,
    saveData,
    setConfirmConfig,
    settings
) => {
    const storageKey = groupId ? `fairsplit_state_${groupId}` : null;
    const _savedState = storageKey ? (() => { try { return JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch { return null; } })() : null;

    const [results, _setResults] = useState(_savedState?.results ?? null);
    const isSettled = results && results.transactions.length === 0;
    const [pendingDebts, setPendingDebts] = useState([]); // Array of pending settlement txs
    const [error, setError] = useState('');
    const [invalidMemberIds, setInvalidMemberIds] = useState([]); // Track members with empty names
    const [isModifying, _setIsModifying] = useState(_savedState?.results ? (_savedState?.isModifying ?? false) : true);
    const [isShimmering, setIsShimmering] = useState(false);

    const persistState = (patch) => {
        if (!storageKey) return;
        try {
            const current = JSON.parse(localStorage.getItem(storageKey) || '{}');
            localStorage.setItem(storageKey, JSON.stringify({ ...current, ...patch }));
        } catch { }
    };

    const setResults = (val) => { _setResults(val); val ? persistState({ results: val }) : (storageKey && localStorage.removeItem(storageKey)); };
    const setIsModifying = (val) => { _setIsModifying(val); persistState({ isModifying: val }); };

    // --- V4: LIVE PENDING DEBTS PREVIEW (From Arrears) ---
    useEffect(() => {
        if (!members || members.length === 0) {
            setPendingDebts([]);
            return;
        }
        const validMembers = members.filter(m => m.name && m.name.trim() !== '');
        let dbArr = validMembers.filter(m => parseFloat(m.arrears || 0) < -0.01).map(m => ({ ...m, amount: parseFloat(m.arrears) })).sort((a, b) => a.amount - b.amount);
        let crArr = validMembers.filter(m => parseFloat(m.arrears || 0) > 0.01).map(m => ({ ...m, amount: parseFloat(m.arrears) })).sort((a, b) => b.amount - a.amount);

        const txs = [];
        let i = 0, j = 0;
        while (i < dbArr.length && j < crArr.length) {
            let d = dbArr[i], c = crArr[j];
            let exactAmt = Math.min(Math.abs(d.amount), c.amount);
            let displayAmt = Math.round(exactAmt);

            if (displayAmt > 0) {
                txs.push({ from: d.name, to: c.name, amount: displayAmt, fromId: d.id, toId: c.id });
            }

            d.amount += exactAmt; c.amount -= exactAmt;
            if (Math.abs(d.amount) < 0.01) i++;
            if (c.amount < 0.01) j++;
        }
        setPendingDebts(txs);
    }, [members]);

    // --- V4 AUTO-CLEANUP: Remove old ghost "Settled" splits from V2 logic ---
    useEffect(() => {
        if (customSplits && customSplits.some(s => s.description && s.description.startsWith('Settled carried over debt'))) {
            const cleanedSplits = customSplits.filter(s => !(s.description && s.description.startsWith('Settled carried over debt')));
            saveData(members, undefined, cleanedSplits);
        }
    }, [customSplits]);

    const parseExpenses = (str) => {
        if (!str) return 0;
        const matches = str.toString().match(/\b\d+(\.\d+)?(?!(st|nd|rd|th| ST| ND| RD| TH))\b/gi);
        if (!matches) return 0;
        return matches.reduce((sum, val) => sum + parseFloat(val), 0);
    };

    const calculate = (overrideMembers = null, overrideSplits = null) => {
        setError('');
        setInvalidMemberIds([]);

        const membersToUse = Array.isArray(overrideMembers) ? overrideMembers : members;
        const splitsToUse = Array.isArray(overrideSplits) ? overrideSplits : customSplits;

        const validMembers = membersToUse.filter(m => m.name && m.name.trim() !== '');

        if (validMembers.length === 0) {
            setError('Please add at least one member to calculate.');
            return;
        }

        if (validMembers.length < membersToUse.length) {
            setMembers(validMembers);
            saveData(validMembers, undefined, undefined);
        }

        const activeMembers = validMembers.filter(m => m.isActive !== false);
        const activeNames = activeMembers.map(m => m.name.trim().toLowerCase());
        const uniqueActiveNames = new Set(activeNames);

        if (activeNames.length !== uniqueActiveNames.size) {
            setError("Duplicate active members detected. Please use unique names to distinguish them.");
            return;
        }

        const finalMembersMap = new Map();

        validMembers.forEach(m => {
            const key = m.name.trim().toLowerCase();
            if (finalMembersMap.has(key)) {
                const existing = finalMembersMap.get(key);
                if (m.isActive !== false) {
                    existing.isActive = true;
                    existing.daysAbsent = m.daysAbsent;
                    existing.expenseInput = m.expenseInput;
                    existing.fixedExpenseInput = m.fixedExpenseInput;
                    existing.id = m.id; 
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

        const validDays = parseInt(daysInMonth) || 30;
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
            displayCDebit: 0 
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
            if (!isSettlement) totalCustom += s.amount;

            const p = proc.find(m => m.id.toString() === s.payerId.toString());
            if (p) p.cCredit += s.amount;

            if (s.involvedIds.length > 0) {
                const share = s.amount / s.involvedIds.length;
                s.involvedIds.forEach(id => {
                    const d = proc.find(m => m.id.toString() === id.toString());
                    if (d) {
                        d.cDebit += share;
                        if (!isSettlement) d.displayCDebit += share; 
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

            if (Math.abs(arr) < 1) arr = 0;
            let net = (m.totalPaidVar + m.totalPaidFixed + m.cCredit) - (vShare + fShare + cShare) + arr;
            if (Math.abs(net) < 1) net = 0;

            return { ...m, variableShare: vShare, fixedShare: fShare, customShare: cShare, displayCustomShare: displayCShare, arrears: arr, netBalance: parseFloat(net.toFixed(2)) };
        });

        let dbArr = bals.filter(m => m.netBalance < -0.01).map(m => ({ ...m, amount: m.netBalance })).sort((a, b) => a.amount - b.amount);
        let crArr = bals.filter(m => m.netBalance > 0.01).map(m => ({ ...m, amount: m.netBalance })).sort((a, b) => b.amount - a.amount);

        const txs = []; let i = 0, j = 0;
        while (i < dbArr.length && j < crArr.length) {
            let d = dbArr[i], c = crArr[j];
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
        if (settings?.vibrationEnabled && window.navigator.vibrate) window.navigator.vibrate([15, 30, 15]);

        setTimeout(() => {
            calculate();
            setIsModifying(false);
            setIsShimmering(false);
        }, 800);
    };

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

                let settleArrearsAmt = 0;
                if (pArrears < -0.01 && rArrears > 0.01) {
                    settleArrearsAmt = Math.min(amountLeft, Math.abs(pArrears), rArrears);
                    if (settleArrearsAmt > 0.01) {
                        payer.arrears = pArrears + settleArrearsAmt;
                        payee.arrears = rArrears - settleArrearsAmt;
                        amountLeft -= settleArrearsAmt;
                    }
                }

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

                updatedMembers = updatedMembers.map(m => {
                    const arr = parseFloat(m.arrears || 0);
                    return { ...m, arrears: Math.abs(arr) < 1 ? "0.00" : arr.toFixed(2) };
                });

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
                setResults(null);
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    return {
        results,
        setResults,
        isSettled,
        pendingDebts,
        error,
        setError,
        invalidMemberIds,
        setInvalidMemberIds,
        isModifying,
        setIsModifying,
        isShimmering,
        calculate,
        handleCalculateWithShimmer,
        handleUnifiedSettle
    };
};
