import { useState, useEffect } from 'react';
import { doc, collection, onSnapshot, setDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";

export const useGroupData = (groupId, user, initialRoomName) => {
    const [daysInMonth, setDaysInMonth] = useState('30');
    const [members, setMembers] = useState([]);
    const [customSplits, setCustomSplits] = useState([]);
    const [archives, setArchives] = useState([]); // V4 Ledger Archives
    const [loadingData, setLoadingData] = useState(true);
    const [roomName, setRoomName] = useState(initialRoomName || '');
    const [groupExists, setGroupExists] = useState(true);

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

        return () => unsubs.forEach(u => u());
    }, [groupId, user, initialRoomName]);

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

    return {
        daysInMonth,
        setDaysInMonth,
        members,
        setMembers,
        customSplits,
        setCustomSplits,
        archives,
        loadingData,
        roomName,
        groupExists,
        saveData
    };
};
