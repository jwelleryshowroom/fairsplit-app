import { writeBatch, setDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

export const useMonthManager = (groupId, members, customSplits, results, daysInMonth, isMonthlyMode, setConfirmConfig, setShowArchiveModal, saveData, setResults) => {

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
                        share: parseFloat((s.amount / involvedCount).toFixed(2))
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

    return {
        handleCloseMonth,
        confirmCloseMonth
    };
};
