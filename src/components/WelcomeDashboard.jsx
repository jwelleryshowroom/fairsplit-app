import React, { useState, useEffect } from 'react';
import { doc, collection, where, getDocs, getDoc, setDoc, deleteDoc, query, arrayUnion, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "../firebase";
import { generateRoomCode } from "../utils/helpers";
import { useSettings } from "../context/SettingsContext";
import {
    IndianRupee, Clock, History as HistoryIcon, ArrowRight,
    PlusCircle, Loader2, AlertCircle, Users, ArrowUpRight,
    Trash2, LogOut, Settings as SettingsIcon, User as UserIcon,
    Shield, Globe, Sparkles
} from 'lucide-react';
import SettingsDrawer from './SettingsDrawer';
import UserAvatar from './UserAvatar';

const WelcomeDashboard = ({ user, onJoin, onCreate }) => {
    const { settings } = useSettings();
    const [joinCode, setJoinCode] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [showNameInput, setShowNameInput] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [error, setError] = useState('');
    const [myGroups, setMyGroups] = useState([]);
    const [recentGroup, setRecentGroup] = useState(null);
    const [isLoadingGroups, setIsLoadingGroups] = useState(true);

    const emoji = (e) => settings.showEmojis ? e : '';

    useEffect(() => {
        if (!user) return;
        const fetchUserData = async () => {
            try {
                const q = query(collection(db, "v6_groups"), where("memberUids", "array-contains", user.uid));
                const querySnapshot = await getDocs(q);
                const groups = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setMyGroups(groups);

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

    const confirmCreate = async () => {
        if (!newRoomName.trim()) return;
        setIsCreating(true);
        setError('');

        try {
            const newCode = generateRoomCode();
            const docRef = doc(db, "v6_groups", newCode);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setError("Code collision! Please try again.");
                setIsCreating(false);
                return;
            }

            await setDoc(docRef, {
                createdAt: new Date(),
                createdBy: user.uid,
                memberUids: [user.uid],
                roomName: newRoomName,
                daysInMonth: '30'
            });

            const firstMemberId = Date.now().toString();
            await setDoc(doc(db, "v6_groups", newCode, "members", firstMemberId), {
                id: firstMemberId,
                name: user.isAnonymous ? 'Guest' : (user.displayName?.split(' ')[0] || 'Me'),
                daysAbsent: 0,
                expenseInput: '',
                fixedExpenseInput: '',
                arrears: "0.00"
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
            const docRef = doc(db, "v6_groups", code);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                await updateDoc(docRef, { memberUids: arrayUnion(user.uid) });
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
        if (!window.confirm("Are you sure? This will delete the group forever.")) return;
        try {
            await deleteDoc(doc(db, "v6_groups", groupId));
            setMyGroups(myGroups.filter(g => g.id !== groupId));
            if (recentGroup && recentGroup.id === groupId) setRecentGroup(null);
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center p-4 md:p-6 pt-8 md:pt-16 animate-in fade-in duration-700">
            <div className="max-w-2xl w-full">

                {/* Modern Bento Profile Header */}
                <div className="flex flex-col md:flex-row items-stretch gap-3 mb-2">
                    <div className="flex-1 bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 transition-all hover:shadow-md flex items-center justify-between">
                        <div className="flex items-center gap-4 md:gap-6">
                            <div className="relative">
                                <UserAvatar user={user} size="lg" className="rounded-2xl md:rounded-[1.8rem] shadow-xl shadow-indigo-100" />
                                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 md:w-7 md:h-7 bg-emerald-500 border-[3px] md:border-4 border-white rounded-full shadow-sm"></div>
                            </div>
                            <div>
                                <h1 className="text-xl md:text-4xl font-black text-slate-800 tracking-tighter mb-0.5">
                                    Hey, {user.isAnonymous ? 'Guest' : user.displayName?.split(' ')[0]}! {emoji('👋')}
                                </h1>
                                <p className="text-slate-400 text-[9px] md:text-sm font-bold flex items-center gap-1 uppercase tracking-widest opacity-70">
                                    <Shield className="w-3 h-3 md:w-3.5 md:h-3.5" /> {user.isAnonymous ? 'Guest User' : 'Verified Profile'}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowSettings(true)}
                                className="p-3 md:p-4 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl md:rounded-2xl transition-all active:scale-95 border border-transparent hover:border-indigo-100 shadow-sm"
                            >
                                <SettingsIcon className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                            <button
                                onClick={() => signOut(auth)}
                                className="hidden sm:flex p-4 bg-rose-50 text-rose-400 hover:bg-rose-100 hover:text-rose-600 rounded-2xl transition-all active:scale-95 border border-transparent hover:border-rose-100 shadow-sm"
                            >
                                <LogOut className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
                    {/* Create Group Bento */}
                    <div className="flex flex-col">
                        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 mt-2 ml-4">New Adventure {emoji('🚀')}</h3>
                        {!showNameInput ? (
                            <button
                                onClick={() => setShowNameInput(true)}
                                className="flex-1 bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-sm border border-slate-100 text-left transition-all hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 active:scale-[0.98] group relative overflow-hidden flex flex-col justify-center min-h-[160px] md:min-h-[220px]"
                            >
                                <div className="flex flex-row items-center gap-4 md:gap-8 relative z-10 w-full">
                                    <div className="w-24 h-24 md:w-36 md:h-36 flex-none rounded-2xl md:rounded-[2rem] overflow-hidden shadow-xl rotate-2 group-hover:rotate-0 transition-transform duration-500 bg-slate-50/50 flex items-center justify-center p-2 border border-slate-100">
                                        <img
                                            src="/create_group_3d.png"
                                            alt="Create Group"
                                            className="w-full h-full object-contain scale-125 group-hover:scale-110 transition-transform duration-700 drop-shadow-md"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-black text-slate-800 text-xl md:text-3xl mb-1">Create Group</h3>
                                        <p className="text-slate-400 text-xs md:text-base leading-tight md:leading-relaxed font-medium">Start a new room for flatmates or trips.</p>
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-100/50 transition-colors"></div>
                            </button>
                        ) : (
                            <div className="flex-1 bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-indigo-100 animate-in zoom-in-95 duration-300 relative overflow-hidden flex flex-col justify-center min-h-[160px] md:min-h-[220px]">
                                <div className="relative z-10 w-full">
                                    <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-3 ml-1">Assign a Name</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        className="w-full bg-slate-50 border-slate-100 border-2 rounded-xl md:rounded-2xl px-5 py-3 md:py-4 outline-none focus:border-indigo-500 font-bold text-lg md:text-xl text-slate-700 placeholder-slate-200 transition-all mb-4"
                                        placeholder="e.g. Dream House"
                                        value={newRoomName}
                                        onChange={(e) => setNewRoomName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && confirmCreate()}
                                        autoComplete="new-password"
                                        name="fsq_new_room"
                                        spellCheck="false"
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={() => setShowNameInput(false)} className="flex-1 py-3 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-slate-600 transition-colors">Cancel</button>
                                        <button
                                            onClick={confirmCreate}
                                            disabled={!newRoomName.trim() || isCreating}
                                            className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl md:rounded-[1.5rem] py-3 md:py-4 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                                        >
                                            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Initialize {emoji('✨')}</>}
                                        </button>
                                    </div>
                                    {error && <p className="text-red-500 text-[10px] font-bold mt-2 text-center animate-pulse">{error}</p>}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Join Group Bento */}
                    <div className="flex flex-col">
                        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 mt-2 ml-4">Shared Code {emoji('🔑')}</h3>
                        <div className="flex-1 bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-sm border border-slate-100 flex flex-col justify-center transition-all hover:shadow-2xl hover:shadow-slate-500/5 hover:-translate-y-1 active:scale-[0.98] group min-h-[160px] md:min-h-[220px]">
                            <div className="w-full">
                                <div className="flex items-center gap-4 md:gap-5 mb-4 md:mb-5">
                                    <div className="w-16 h-16 md:w-20 md:h-20 flex-none rounded-2xl md:rounded-[1.5rem] overflow-hidden shadow-sm bg-slate-50/50 flex items-center justify-center p-2 border border-slate-100 group-hover:bg-indigo-50/50 transition-colors duration-500">
                                        <img
                                            src="/join_group_couple.png"
                                            alt="Join Group"
                                            className="w-full h-full object-contain scale-[1.15] group-hover:scale-[1.25] transition-transform duration-700 mix-blend-multiply opacity-90 group-hover:opacity-100"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800 text-xl md:text-3xl">Join Group</h3>
                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5 group-hover:text-indigo-500 transition-colors">Access Room</p>
                                    </div>
                                </div>
                                <p className="text-slate-400 text-xs md:text-base font-medium mb-5 md:mb-8 leading-tight md:leading-relaxed">Enter your friend's 6-digit room code.</p>
                            </div>

                            <div className="flex gap-2 w-full">
                                <input
                                    type="text"
                                    placeholder="CODE"
                                    className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-xl md:rounded-[1.5rem] px-5 py-3 md:py-4 outline-none focus:border-indigo-500 font-black text-slate-700 uppercase tracking-[0.3em] text-sm transition-all min-w-0"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    autoComplete="off"
                                    data-form-type="other"
                                    aria-autocomplete="none"
                                    name="fsq_zx_join_code"
                                    spellCheck="false"
                                />
                                <button
                                    onClick={handleJoin}
                                    disabled={!joinCode.trim() || isJoining}
                                    className="bg-slate-900 text-white w-14 md:w-[80px] rounded-xl md:rounded-[1.4rem] hover:bg-slate-800 transition-all flex items-center justify-center shadow-lg shadow-slate-200 active:scale-90 flex-none group/btn"
                                >
                                    {isJoining ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-6 h-6 md:w-7 md:h-7 group-hover/btn:translate-x-1 transition-transform" />}
                                </button>
                            </div>
                            {error && !showNameInput && <p className="text-red-500 text-[9px] font-black mt-3 text-center uppercase tracking-widest">{error}</p>}
                        </div>
                    </div>
                </div>

                {/* Groups Section */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center justify-between mb-3 px-2">
                        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Active Groups {emoji('📂')}</h3>
                        <span className="bg-slate-100 text-slate-400 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                            {myGroups.length}
                        </span>
                    </div>

                    {isLoadingGroups ? (
                        <div className="bg-white p-10 md:p-16 rounded-[2rem] md:rounded-[3rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-4 md:gap-6">
                            <Loader2 className="w-8 h-8 md:w-12 md:h-12 animate-spin text-indigo-500" />
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Syncing...</p>
                        </div>
                    ) : myGroups.length === 0 ? (
                        <div className="bg-white p-10 md:p-16 rounded-[2rem] md:rounded-[3rem] shadow-sm border border-slate-100 border-dashed border-2 flex flex-col items-center justify-center text-center">
                            <div className="bg-slate-50 w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-[2rem] flex items-center justify-center mb-4 md:mb-6 shadow-inner">
                                <Globe className="w-8 h-8 md:w-10 md:h-10 text-slate-200" />
                            </div>
                            <h4 className="font-black text-slate-800 text-lg mb-1">No groups found</h4>
                            <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-[200px]">Create or join a room to get started.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5 pb-10">
                            {myGroups.map(group => (
                                <div
                                    key={group.id}
                                    onClick={() => onJoin(group.id, group.roomName)}
                                    className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-3 md:gap-4 cursor-pointer transition-all hover:bg-slate-50 hover:border-slate-200 hover:shadow-xl hover:shadow-slate-500/5 active:scale-[0.98] relative group overflow-hidden"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-indigo-200 group-hover:rotate-6">
                                            <Sparkles className="w-5 h-5" />
                                        </div>
                                        <button
                                            onClick={(e) => handleDeleteGroup(group.id, e)}
                                            className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 group-hover:scale-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="mt-1 flex flex-col flex-1 justify-end">
                                        <div className="font-black text-slate-800 text-sm md:text-lg group-hover:text-indigo-900 transition-colors line-clamp-2 md:truncate mb-1 md:mb-1.5 leading-tight">{group.roomName}</div>
                                        <div className="flex items-center justify-between mt-auto">
                                            <div className="text-[9px] md:text-[10px] font-black text-slate-400 font-mono tracking-widest bg-slate-100 px-2 py-0.5 rounded transition-colors uppercase">ID: {group.id}</div>
                                            <div className="flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-1 bg-slate-50 rounded-full w-full mt-1 overflow-hidden">
                                        <div className="h-full bg-slate-200 w-1/3 group-hover:bg-indigo-500 group-hover:w-full transition-all duration-1000"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <SettingsDrawer
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                onLeaveGroup={() => setShowSettings(false)}
                onShowHelp={() => { }}
                user={user}
                isGroupView={false}
                onLogOut={() => signOut(auth)}
            />

            {/* Branding Footer */}
            <div className="mt-auto py-8 opacity-20 flex items-center gap-2 grayscale brightness-50">
                <div className="bg-slate-900 text-white p-1 rounded">
                    <IndianRupee className="w-2.5 h-2.5" />
                </div>
                <span className="font-black text-[10px] uppercase tracking-[0.4em] text-slate-900">FairSplit Premium</span>
            </div>
        </div>
    );
};

export default WelcomeDashboard;
