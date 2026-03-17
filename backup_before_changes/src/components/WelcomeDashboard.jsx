import React, { useState, useEffect } from 'react';
import { doc, collection, where, getDocs, getDoc, setDoc, deleteDoc, query } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "../firebase";
import { generateRoomCode } from "../utils/helpers";
import { IndianRupee, Clock, History, ArrowRight, PlusCircle, Loader2, AlertCircle, Users, ArrowUpRight, Trash2, LogOut } from 'lucide-react';

const WelcomeDashboard = ({ user, onJoin, onCreate }) => {
    const [joinCode, setJoinCode] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [showNameInput, setShowNameInput] = useState(false);
    const [error, setError] = useState('');
    const [myGroups, setMyGroups] = useState([]);
    const [recentGroup, setRecentGroup] = useState(null);
    const [isLoadingGroups, setIsLoadingGroups] = useState(true);

    // Fetch user created groups and recent group
    useEffect(() => {
        if (!user) return;
        const fetchUserData = async () => {
            try {
                // Fetch created groups
                const q = query(collection(db, "groups"), where("createdBy", "==", user.uid));
                const querySnapshot = await getDocs(q);
                const groups = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setMyGroups(groups);

                // Fetch recent group from user profile
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    if (data.lastGroupId && data.lastRoomName) {
                        setRecentGroup({ id: data.lastGroupId, roomName: data.lastRoomName });
                    }
                }
            } catch (err) {
                console.error("Error fetching user data:", err);
            } finally {
                setIsLoadingGroups(false);
            }
        };
        fetchUserData();
    }, [user]);

    const handleCreateClick = () => {
        setShowNameInput(true);
        setError('');
    };

    const confirmCreate = async () => {
        if (!newRoomName.trim()) return;
        setIsCreating(true);
        setError('');

        try {
            const newCode = generateRoomCode();
            // Check if code exists (super rare collision check)
            const docRef = doc(db, "groups", newCode);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setError("Code collision! Please try again.");
                setIsCreating(false);
                return;
            }

            // Create the document FIRST
            await setDoc(docRef, {
                createdAt: new Date(),
                createdBy: user.uid,
                roomName: newRoomName,
                daysInMonth: '30',
                members: [{ id: Date.now(), name: user.isAnonymous ? 'Guest' : (user.displayName?.split(' ')[0] || 'Me'), daysAbsent: 0, expenseInput: '', fixedExpenseInput: '' }],
                customSplits: []
            });

            onCreate(newCode, newRoomName);
        } catch (err) {
            setError("Failed to create group. " + err.message);
            setIsCreating(false);
        }
    };

    const handleJoin = async () => {
        if (!joinCode.trim()) return;
        setIsJoining(true);
        setError('');
        const code = joinCode.toUpperCase().trim();

        try {
            const docRef = doc(db, "groups", code);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                onJoin(code, docSnap.data().roomName);
            } else {
                setError("Invalid Room Code. Group not found.");
                setIsJoining(false);
            }
        } catch (err) {
            setError("Connection error. Try again.");
            setIsJoining(false);
        }
    };

    const handleDeleteGroup = async (groupId, e) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this group? Data will be lost.")) return;
        try {
            await deleteDoc(doc(db, "groups", groupId));
            setMyGroups(myGroups.filter(g => g.id !== groupId));
            if (recentGroup && recentGroup.id === groupId) setRecentGroup(null);
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
            <div className="max-w-md w-full">
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-2.5 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
                        <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
                            <IndianRupee className="w-5 h-5" />
                        </div>
                        <span className="font-extrabold text-xl text-slate-800 tracking-tight">FairSplit</span>
                    </div>
                </div>

                <div className="text-center mb-10">
                    <h1 className="text-3xl font-extrabold text-slate-800 mb-2">
                        Welcome, {user.isAnonymous ? 'Guest' : user.displayName?.split(' ')[0]}! 👋
                    </h1>
                    <p className="text-slate-500">What would you like to do today?</p>
                </div>

                {/* SUGGESTION FOR RECENT GROUP */}
                {recentGroup && (
                    <div className="mb-8 animate-in fade-in slide-in-from-top-4">
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3 ml-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Continue Recent
                        </h3>
                        <div
                            onClick={() => onJoin(recentGroup.id, recentGroup.roomName)}
                            className="bg-white p-5 rounded-3xl shadow-sm border border-indigo-100 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-5"><History className="w-24 h-24 text-indigo-600" /></div>
                            <div className="relative z-10 flex items-center gap-4">
                                <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                                    <History className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-700 transition-colors">{recentGroup.roomName}</h3>
                                    <p className="text-slate-400 text-xs font-mono">ID: {recentGroup.id}</p>
                                </div>
                            </div>
                            <div className="relative z-10 bg-indigo-50 text-indigo-600 p-2 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <ArrowRight className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-5">
                    {/* Create Section */}
                    {!showNameInput ? (
                        <button
                            onClick={handleCreateClick}
                            className="w-full bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 active:bg-emerald-100 p-5 rounded-3xl text-left flex items-center gap-4 transition-all group shadow-sm hover:shadow-md active:scale-[0.98]"
                        >
                            <div className="bg-emerald-100 text-emerald-600 w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                <PlusCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">Create New Group</h3>
                                <p className="text-slate-500 text-sm">For house expenses, trips, or events.</p>
                            </div>
                        </button>
                    ) : (
                        <div className="bg-white border border-emerald-200 p-5 rounded-3xl shadow-md animate-in fade-in slide-in-from-bottom-2">
                            <label className="block text-xs font-bold text-emerald-600 uppercase mb-2 ml-1">Group Name</label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    autoFocus
                                    type="text"
                                    className="flex-1 bg-emerald-50 border-emerald-100 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-200 font-bold text-slate-700 placeholder-emerald-300/70"
                                    placeholder="e.g. Flat 301, Goa Trip..."
                                    value={newRoomName}
                                    onChange={(e) => setNewRoomName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && confirmCreate()}
                                />
                                <button
                                    onClick={confirmCreate}
                                    disabled={!newRoomName.trim() || isCreating}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 rounded-xl font-bold shadow-md shadow-emerald-200 transition-all flex items-center justify-center"
                                >
                                    {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                                </button>
                            </div>

                            {/* ERROR MESSAGE IN CONTEXT (Create) */}
                            {error && (
                                <div className="text-red-500 text-xs font-bold flex items-center gap-1 mb-2 ml-1 animate-pulse">
                                    <AlertCircle className="w-3 h-3" /> {error}
                                </div>
                            )}

                            <button onClick={() => { setShowNameInput(false); setError(''); }} className="text-xs text-slate-400 hover:text-slate-600 ml-1">Cancel</button>
                        </div>
                    )}

                    {/* Join Section */}
                    <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-orange-100 text-orange-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">Join Existing Group</h3>
                                <p className="text-slate-500 text-sm">Enter a code shared by your friend.</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="e.g. K9X2M4"
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-200 font-bold text-slate-700 uppercase transition-all"
                                value={joinCode}
                                onChange={(e) => { setJoinCode(e.target.value); setError(''); }}
                            />
                            <button
                                onClick={handleJoin}
                                disabled={!joinCode.trim() || isJoining}
                                className="bg-slate-900 text-white px-5 rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-90 shadow-md shadow-slate-200 flex items-center justify-center w-16"
                            >
                                {isJoining ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUpRight className="w-6 h-6" />}
                            </button>
                        </div>

                        {/* ERROR MESSAGE IN CONTEXT (Join) */}
                        {error && !showNameInput && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-xl mt-3 text-sm font-bold flex items-center justify-center gap-2 animate-pulse">
                                <AlertCircle className="w-4 h-4" /> {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* My Groups Section - GRID LAYOUT */}
                {!user.isAnonymous && (
                    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 ml-2">Groups Created by You</h3>

                        {isLoadingGroups ? (
                            <div className="text-center text-slate-400 py-4"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
                        ) : myGroups.length === 0 ? (
                            <div className="text-center text-slate-400 text-sm italic py-4">You haven't created any groups yet.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {myGroups.map(group => (
                                    <div key={group.id} onClick={() => onJoin(group.id, group.roomName)} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group h-full">
                                        <div className="flex flex-col gap-1 overflow-hidden">
                                            <div className="font-bold text-slate-700 truncate w-full">{group.roomName}</div>
                                            <div className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-md font-bold text-[10px] w-fit">{group.id}</div>
                                        </div>
                                        <button onClick={(e) => handleDeleteGroup(group.id, e)} className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-10 text-center">
                    <button onClick={() => signOut(auth)} className="text-sm text-slate-400 hover:text-red-500 flex items-center justify-center gap-2 mx-auto transition-colors active:scale-95">
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WelcomeDashboard;
