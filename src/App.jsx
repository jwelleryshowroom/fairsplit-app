import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Calculator, IndianRupee, Users, 
  AlertCircle, Sparkles, MessageSquare, Loader2, 
  X, Copy, Check, Download, Share2, Eye, EyeOff, 
  ChevronRight, Calendar, Zap, Utensils, Split, 
  ArrowRight, Shield, Mail, LogOut, Home, User, 
  History, PlusCircle, ArrowUpRight, UserPlus, Star, 
  LayoutDashboard, RefreshCw, Clock
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  signInWithCustomToken
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  deleteDoc
} from "firebase/firestore";

// --- FIREBASE CONFIGURATION ---
// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  // Use the import.meta.env object to access the key
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, 
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  
  // You can leave these hardcoded if you rarely change them, 
  // or move them to .env as well:
  storageBucket: "fairsplit-ab339.firebasestorage.app",
  messagingSenderId: "935976689696",
  appId: "1:935976689696:web:d89f3a22886a8624e9dc45"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- UTILITIES ---
const safeCopy = (text) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  textArea.style.top = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try { document.execCommand('copy'); } catch (err) { console.error('Copy failed', err); }
  document.body.removeChild(textArea);
};

const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result; 
};

// --- SUB-COMPONENTS ---

const LoadingScreen = ({ message = "Please wait..." }) => (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 animate-in fade-in duration-500">
        <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center border border-indigo-50">
            <div className="bg-indigo-600 text-white p-4 rounded-2xl mb-6 shadow-lg shadow-indigo-200 animate-bounce">
                <IndianRupee className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">FairSplit</h2>
            <div className="flex items-center gap-3 text-indigo-500 font-bold bg-indigo-50 px-4 py-2 rounded-full">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">{message}</span>
            </div>
        </div>
    </div>
);

const MemberCard = ({ member, daysInMonth, updateMember, removeMember, onSmartParse }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [expenseType, setExpenseType] = useState('variable'); 

  const getBreakdown = (input) => {
    if (!input) return { items: [], total: 0 };
    const items = input.split(',').map(s => {
      const val = parseFloat(s.trim());
      return isNaN(val) ? null : val;
    }).filter(v => v !== null);
    return { items, total: items.reduce((a, b) => a + b, 0) };
  };

  const variableBreakdown = useMemo(() => getBreakdown(member.expenseInput), [member.expenseInput]);
  const fixedBreakdown = useMemo(() => getBreakdown(member.fixedExpenseInput), [member.fixedExpenseInput]);
  const currentBreakdown = expenseType === 'variable' ? variableBreakdown : fixedBreakdown;

  return (
    <div className="group relative bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all duration-300">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
        {/* Name Input */}
        <div className="flex-1 w-full min-w-[150px]">
          <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Name</label>
          <div className="relative group/input">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within/input:text-indigo-500"><Users className="h-4 w-4 text-gray-300" /></div>
            <input type="text" placeholder="e.g. Rahul" value={member.name} onChange={(e) => updateMember(member.id, 'name', e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium text-gray-700 placeholder-gray-400"/>
          </div>
        </div>

        {/* Absent Days */}
        <div className="w-full md:w-24">
          <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Absent</label>
          <input type="number" min="0" max={parseInt(daysInMonth) || 30} value={member.daysAbsent} onChange={(e) => updateMember(member.id, 'daysAbsent', e.target.value)} className="w-full px-2 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium text-center text-gray-700"/>
        </div>

        {/* Expenses Section */}
        <div className="flex-1 w-full min-w-[280px]">
          <div className="flex justify-between items-center mb-2">
            <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                <button 
                  onClick={() => setExpenseType('variable')} 
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all flex items-center gap-1 active:scale-95 ${expenseType === 'variable' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/50'}`}
                >
                  <Utensils className="w-3 h-3" /> Daily
                </button>
                <button 
                  onClick={() => setExpenseType('fixed')} 
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all flex items-center gap-1 active:scale-95 ${expenseType === 'fixed' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/50'}`}
                >
                  <Zap className="w-3 h-3" /> Fixed Bills
                </button>
            </div>
            
            {/* AI Add Button */}
            {expenseType === 'variable' && (
                <button 
                  onClick={() => onSmartParse(member.id)} 
                  className="group/ai relative overflow-hidden px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-100 to-fuchsia-100 text-violet-700 text-[10px] font-bold uppercase tracking-wide shadow-sm hover:shadow-md hover:from-violet-200 hover:to-fuchsia-200 active:scale-95 transition-all duration-200 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-fuchsia-600 animate-pulse" />
                  <span className="relative z-10">AI Add</span>
                  <div className="absolute inset-0 bg-white/40 translate-y-full group-hover/ai:translate-y-0 transition-transform duration-300"></div>
                </button>
            )}
          </div>

          <div className="flex gap-2">
            <div className="relative w-full group-focus-within:z-10">
              <span className="absolute left-3 top-2.5 text-gray-400 font-serif">₹</span>
              <input type="text" placeholder={expenseType === 'variable' ? "Food, Groceries..." : "Rent, WiFi, Electricity..."} value={expenseType === 'variable' ? member.expenseInput : member.fixedExpenseInput} onChange={(e) => updateMember(member.id, expenseType === 'variable' ? 'expenseInput' : 'fixedExpenseInput', e.target.value)} className={`w-full pl-8 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:border-transparent outline-none transition-all font-mono text-gray-700 ${expenseType === 'variable' ? 'bg-indigo-50/30 border-indigo-100 focus:bg-white focus:ring-indigo-500' : 'bg-pink-50/30 border-pink-100 focus:bg-white focus:ring-pink-500'}`}/>
            </div>
            <button 
              onClick={() => setShowDetails(!showDetails)} 
              className={`p-2.5 rounded-xl border transition-all active:scale-95 ${showDetails ? 'bg-gray-800 border-gray-800 text-white shadow-md' : 'bg-white border-gray-200 text-gray-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50'}`}
            >
              {showDetails ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <button 
          onClick={() => removeMember(member.id)} 
          className="hidden md:flex p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-95 self-end"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
      
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-dashed border-gray-200 animate-in fade-in slide-in-from-top-2 duration-300">
           <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-500 uppercase">{expenseType === 'variable' ? 'Daily Expenses' : 'Fixed Bills'} Breakdown</div>
           <div className="flex flex-wrap gap-2">
              {currentBreakdown.items.length > 0 ? (currentBreakdown.items.map((val, i) => (<span key={i} className="px-2 py-1 bg-white shadow-sm rounded-md text-xs font-mono text-gray-700 border border-gray-100">₹{val}</span>))) : <span className="text-xs text-gray-400 italic">No entries</span>}
              <span className="ml-auto text-sm font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded-md">Total: ₹{currentBreakdown.total}</span>
           </div>
        </div>
      )}
      <button onClick={() => removeMember(member.id)} className="md:hidden w-full mt-4 flex items-center justify-center gap-2 p-3 text-red-500 bg-red-50 active:bg-red-100 rounded-xl text-sm font-medium transition-colors active:scale-95"><Trash2 className="w-4 h-4" /> Remove Member</button>
    </div>
  );
};

const CustomSplitManager = ({ members, customSplits, setCustomSplits }) => {
    const [payerId, setPayerId] = useState('');
    const [amount, setAmount] = useState('');
    const [involvedIds, setInvolvedIds] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [addError, setAddError] = useState('');
    const [showExtInput, setShowExtInput] = useState(false);
    const [extName, setExtName] = useState('');

    const toggleInvolved = (id) => {
        if (involvedIds.includes(id)) { setInvolvedIds(involvedIds.filter(i => i !== id)); } 
        else { setInvolvedIds([...involvedIds, id]); }
    };
    
    const addExternal = () => {
        if (!extName.trim()) return;
        const newId = `EXT:${extName.trim()}`;
        if (!involvedIds.includes(newId)) {
            setInvolvedIds([...involvedIds, newId]);
        }
        setExtName('');
        setShowExtInput(false);
    };

    const addSplit = () => {
        setAddError('');
        if (!payerId) { setAddError('Please select who paid.'); return; }
        if (!amount) { setAddError('Please enter an amount.'); return; }
        if (involvedIds.length < 2) { setAddError('Select at least 2 people to split the expense.'); return; }
        
        setCustomSplits([...customSplits, { id: Date.now(), payerId: parseInt(payerId), amount: parseFloat(amount), involvedIds }]);
        setAmount(''); setInvolvedIds([]); setPayerId('');
    };
    const removeSplit = (id) => setCustomSplits(customSplits.filter(s => s.id !== id));

    const getName = (id) => {
        if (typeof id === 'string' && id.startsWith('EXT:')) return id.replace('EXT:', '') + ' (Guest)';
        const m = members.find(m => m.id === id);
        return m ? m.name : 'Unknown';
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mb-10 transition-all duration-300 hover:shadow-2xl">
            <div 
                className="p-4 bg-gradient-to-r from-orange-50 to-white border-b border-orange-100 flex justify-between items-center cursor-pointer hover:bg-orange-50/80 transition-colors active:bg-orange-100" 
                onClick={() => setIsOpen(!isOpen)}
            >
                 <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2"><Split className="w-5 h-5 text-orange-500" /> Custom Splits <span className="text-sm font-normal text-slate-400">(Side Expenses)</span></h2>
                <div className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}><ChevronRight className="w-5 h-5 text-slate-400" /></div>
            </div>
            {isOpen && (
                <div className="p-6 bg-slate-50/50 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            <div className="md:col-span-3"><label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Who Paid?</label><select className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-400" value={payerId} onChange={(e) => setPayerId(e.target.value)}><option value="">Select...</option>{members.map(m => (<option key={m.id} value={m.id}>{m.name || 'Unnamed'}</option>))}</select></div>
                            <div className="md:col-span-3"><label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Amount</label><div className="relative"><span className="absolute left-3 top-2.5 text-gray-400">₹</span><input type="number" className="w-full pl-7 p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-400" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"/></div></div>
                            <div className="md:col-span-6">
                                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Split Between Whom?</label>
                                <div className="flex flex-wrap gap-2 items-center">
                                    {members.map(m => (<button key={m.id} onClick={() => toggleInvolved(m.id)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all active:scale-95 ${involvedIds.includes(m.id) ? 'bg-orange-100 border-orange-300 text-orange-700 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'}`}>{m.name || 'Unnamed'}</button>))}
                                    
                                    {involvedIds.filter(id => typeof id === 'string' && id.startsWith('EXT:')).map(extId => (
                                        <button key={extId} onClick={() => toggleInvolved(extId)} className="px-3 py-1.5 text-xs font-bold rounded-lg border bg-orange-100 border-orange-300 text-orange-700 flex items-center gap-1 active:scale-95 shadow-sm">
                                            {extId.replace('EXT:', '')} <X className="w-3 h-3"/>
                                        </button>
                                    ))}

                                    {showExtInput ? (
                                        <div className="flex items-center gap-1 animate-in fade-in slide-in-from-left-2">
                                            <input type="text" className="w-24 px-2 py-1 text-xs border rounded-lg focus:ring-2 ring-orange-200 outline-none" placeholder="Name..." value={extName} onChange={(e) => setExtName(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && addExternal()} />
                                            <button onClick={addExternal} className="bg-green-500 text-white p-1 rounded hover:bg-green-600 active:scale-90 transition-transform"><Check className="w-3 h-3"/></button>
                                            <button onClick={() => setShowExtInput(false)} className="bg-gray-200 text-gray-500 p-1 rounded hover:bg-gray-300 active:scale-90 transition-transform"><X className="w-3 h-3"/></button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setShowExtInput(true)} className="px-3 py-1.5 text-xs font-bold rounded-lg border border-dashed border-gray-300 text-gray-400 hover:text-orange-500 hover:border-orange-300 hover:bg-orange-50 flex items-center gap-1 transition-all active:scale-95"><UserPlus className="w-3 h-3"/> Guest</button>
                                    )}
                                </div>
                            </div>
                        </div>
                        {addError && <p className="text-red-500 text-xs mt-2 font-bold flex items-center gap-1 animate-pulse"><AlertCircle className="w-3 h-3"/> {addError}</p>}
                        <button 
                            onClick={addSplit} 
                            className="mt-4 w-full bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] text-sm flex justify-center items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Add Custom Split
                        </button>
                    </div>
                    {/* Compact Grid Layout for Splits */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {customSplits.map(split => { 
                            const payerName = members.find(m => m.id === split.payerId)?.name || 'Unknown'; 
                            const namesList = split.involvedIds.map(id => getName(id).replace(' (Guest)', '')).join(', ');
                            
                            return (
                                <div key={split.id} className="flex flex-col justify-between bg-white p-3 rounded-lg border border-slate-100 shadow-sm relative group hover:shadow-md transition-shadow">
                                    <div className="text-sm text-slate-700 mb-1">
                                        <span className="font-bold text-orange-600">{payerName}</span> paid <span className="font-bold text-slate-800">₹{split.amount}</span>
                                    </div>
                                    <div className="text-xs text-slate-400 truncate" title={namesList}>
                                        Split with: {namesList}
                                    </div>
                                    <button onClick={() => removeSplit(split.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 rounded-full"><X className="w-4 h-4" /></button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- VIEWS ---

const LoginView = () => {
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError('');
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (err) {
            if (err.code === 'auth/unauthorized-domain') {
                setError(`DOMAIN ERROR: Add "${window.location.hostname}" to Firebase Console.`);
            } else {
                setError(err.message);
            }
            setIsLoading(false);
        }
    };

    const handleGuestLogin = async () => {
        setIsLoading(true);
        setError('');
        try {
            await signInAnonymously(auth);
        } catch (err) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    if (isLoading) return <LoadingScreen message="Authenticating..." />;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 flex items-center justify-center p-4">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 md:p-12 rounded-3xl shadow-2xl max-w-md w-full relative overflow-hidden">
                <div className="relative z-10 text-center">
                    <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg border border-white/10">
                        <IndianRupee className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white mb-2">FairSplit</h1>
                    <p className="text-indigo-200 mb-8">Global Household Expense Manager</p>

                    {error && (
                        <div className="mb-4 text-left bg-red-900/50 p-4 rounded-xl text-sm border border-red-500/50 text-white">
                            <p className="font-bold flex items-center gap-2 mb-1"><AlertCircle className="w-4 h-4" /> Login Error</p>
                            <p className="opacity-90 break-words">{error}</p>
                        </div>
                    )}

                    <button 
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full bg-white hover:bg-gray-50 active:scale-95 text-gray-800 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg mb-3"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                                <Mail className="w-5 h-5 text-red-500" />
                                Sign in with Google
                            </>
                        )}
                    </button>

                    <button 
                        onClick={handleGuestLogin}
                        disabled={isLoading}
                        className="w-full bg-indigo-600/50 hover:bg-indigo-600 active:scale-95 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-3 border border-indigo-400/30 hover:border-indigo-400"
                    >
                        <User className="w-5 h-5" />
                        Continue as Guest (Test Mode)
                    </button>
                    
                    <div className="mt-8 flex items-center justify-center gap-2 text-xs text-indigo-300">
                        <Shield className="w-3 h-3" /> Secure Google Authentication
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- WELCOME DASHBOARD ---
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
        if(!window.confirm("Are you sure you want to delete this group? Data will be lost.")) return;
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
                            <Clock className="w-3 h-3"/> Continue Recent
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
                                    {isCreating ? <Loader2 className="w-5 h-5 animate-spin"/> : <ArrowRight className="w-5 h-5"/>}
                                </button>
                             </div>
                             
                             {/* ERROR MESSAGE IN CONTEXT (Create) */}
                             {error && (
                                <div className="text-red-500 text-xs font-bold flex items-center gap-1 mb-2 ml-1 animate-pulse">
                                    <AlertCircle className="w-3 h-3"/> {error}
                                </div>
                             )}

                             <button onClick={() => {setShowNameInput(false); setError('');}} className="text-xs text-slate-400 hover:text-slate-600 ml-1">Cancel</button>
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
                                onChange={(e) => {setJoinCode(e.target.value); setError('');}}
                            />
                            <button 
                                onClick={handleJoin}
                                disabled={!joinCode.trim() || isJoining}
                                className="bg-slate-900 text-white px-5 rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-90 shadow-md shadow-slate-200 flex items-center justify-center w-16"
                            >
                                {isJoining ? <Loader2 className="w-5 h-5 animate-spin"/> : <ArrowUpRight className="w-6 h-6" />}
                            </button>
                        </div>

                        {/* ERROR MESSAGE IN CONTEXT (Join) */}
                        {error && !showNameInput && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-xl mt-3 text-sm font-bold flex items-center justify-center gap-2 animate-pulse">
                                <AlertCircle className="w-4 h-4"/> {error}
                            </div>
                        )}
                    </div>
                </div>
                
                {/* My Groups Section - GRID LAYOUT */}
                {!user.isAnonymous && (
                    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 ml-2">Groups Created by You</h3>
                        
                        {isLoadingGroups ? (
                            <div className="text-center text-slate-400 py-4"><Loader2 className="w-5 h-5 animate-spin mx-auto"/></div> 
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

const ExpenseSplitter = ({ user, groupId, initialRoomName, onLeaveGroup }) => {
    // CHANGE THIS LINE:
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 
    
    // ... rest of your code
    const [daysInMonth, setDaysInMonth] = useState('30');
    const [members, setMembers] = useState([]);
    const [customSplits, setCustomSplits] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [roomName, setRoomName] = useState(initialRoomName || '');
    const [groupExists, setGroupExists] = useState(true);

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
        return () => unsubscribe();
    }, [groupId, user]);

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
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
          if (!response.ok) throw new Error("API Error"); // Handle API failure explicitely
          const data = await response.json();
          return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        } catch (err) { console.error(err); throw new Error("Failed"); }
    };
    
    const handleSmartParse = async () => {
        if (!parseText.trim()) return;
        setIsAnalyzing(true);
        setParseError(''); // Clear previous error
        try {
          const result = await callGemini(`Extract numbers from text: "${parseText}". Return comma-separated list.`);
          
          const extractedNumbers = result.match(/(\d+(\.\d+)?)/g);
          
          if (!extractedNumbers || extractedNumbers.length === 0) {
              setParseError("No expenses found in text."); // Use local error state
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
        try { const message = await callGemini(`Write whatsapp msg for split: ${JSON.stringify(results.transactions)}`); setDraftedMessage(message); } catch (err) { setDraftedMessage("Error."); } finally { setIsDrafting(false); }
    };
    const copyToClipboard = () => { safeCopy(draftedMessage); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); };
    const copyGroupCode = () => { safeCopy(groupId); setCopyCodeSuccess(true); setTimeout(() => setCopyCodeSuccess(false), 2000); };
    
    const parseExpenses = (str) => { try { return str.split(',').reduce((a, c) => a + (parseFloat(c.trim()) || 0), 0); } catch { return 0; } };
    const addMember = () => { const newMembers = [...members, { id: Date.now(), name: '', daysAbsent: 0, expenseInput: '', fixedExpenseInput: '' }]; saveData(newMembers, undefined, undefined); setResults(null); };
    const removeMember = (id) => { const newMembers = members.filter(m => m.id !== id); saveData(newMembers, undefined, undefined); setResults(null); };
    const updateMember = (id, f, v) => { const newMembers = members.map(m => m.id === id ? { ...m, [f]: v } : m); saveData(newMembers, undefined, undefined); setResults(null); };
    const updateCustomSplits = (newSplits) => { saveData(undefined, undefined, newSplits); };
    const updateDays = (val) => { saveData(undefined, val, undefined); };
    
    const calculate = () => {
        setError('');
        if (members.length < 1) { setError('Add member'); return; }
        const validDays = parseInt(daysInMonth) || 30;
        
        let extendedMembers = [...members];
        customSplits.forEach(s => {
            s.involvedIds.forEach(id => {
                if (typeof id === 'string' && id.startsWith('EXT:') && !extendedMembers.find(m => m.id === id)) {
                    extendedMembers.push({
                        id: id,
                        name: id.replace('EXT:', '') + ' (Guest)',
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
            daysPresent: Math.max(0, validDays - (parseInt(m.daysAbsent)||0)), 
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
            if(p) p.cCredit += s.amount;
            
            if(s.involvedIds.length > 0) { 
                const share = s.amount/s.involvedIds.length; 
                s.involvedIds.forEach(id => { 
                    const d = proc.find(m => m.id === id); 
                    if(d) d.cDebit += share; 
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

        let db = bals.filter(m => m.netBalance < -0.01).map(m => ({...m, amount: m.netBalance})).sort((a,b)=>a.amount-b.amount);
        let cr = bals.filter(m => m.netBalance > 0.01).map(m => ({...m, amount: m.netBalance})).sort((a,b)=>b.amount-a.amount);
        
        const txs = []; let i=0,j=0;
        while(i<db.length && j<cr.length) {
            let d = db[i], c = cr[j];
            // Round transaction amounts for display ease
            let exactAmt = Math.min(Math.abs(d.amount), c.amount);
            let displayAmt = Math.round(exactAmt); // ROUNDING OFF AS REQUESTED
            
            if (displayAmt > 0) {
                 txs.push({from: d.name||'Unknown', to: c.name||'Unknown', amount: displayAmt});
            }
            
            d.amount += exactAmt; c.amount -= exactAmt;
            if(Math.abs(d.amount)<0.01) i++; if(c.amount<0.01) j++;
        }
        setResults({ totalVariable: totalVar, totalFixed: totalFixed, totalCustom: totalCustom, totalPersonDays: totalPD, costPerPersonDay: costPerDay, balances: bals, transactions: txs });
    };

    if (loadingData) return <LoadingScreen message="Loading expenses..." />;
    
    if (!groupExists) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-red-100 text-center max-w-sm">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4"/>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Group Not Found</h3>
                <p className="text-slate-500 mb-6">This group (ID: {groupId}) does not exist or has been deleted.</p>
                <button onClick={onLeaveGroup} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800">Go Home</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
             <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm px-4 md:px-8 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="bg-indigo-600 text-white p-1.5 rounded-lg cursor-pointer" onClick={onLeaveGroup}>
                        <IndianRupee className="w-5 h-5" />
                    </div>
                    <span className="font-extrabold text-lg text-slate-800 tracking-tight hidden md:inline cursor-pointer" onClick={onLeaveGroup}>FairSplit</span>
                    <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block"></div>
                    <div className="flex flex-col md:flex-row md:items-center gap-0 md:gap-3">
                        <h1 className="font-bold text-slate-800 text-sm md:text-base truncate max-w-[150px] md:max-w-none">{roomName}</h1>
                        <button onClick={copyGroupCode} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md text-xs font-mono font-medium text-slate-500 transition-colors">
                            {copyCodeSuccess ? <Check className="w-3 h-3 text-green-500"/> : <Share2 className="w-3 h-3"/>}
                            {groupId}
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={onLeaveGroup} className="flex items-center gap-2 text-red-500 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg text-sm font-bold transition-colors">
                        <LogOut className="w-4 h-4"/>
                        <span className="hidden md:inline">Exit</span>
                    </button>
                </div>
             </div>

             <div className="relative z-10 max-w-5xl mx-auto p-4 md:p-8">
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mb-10">
                    <div className="p-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm"><Calendar className="w-4 h-4 text-indigo-500"/><label className="text-xs font-bold text-slate-500 uppercase">Days in Month</label><input type="number" value={daysInMonth} onChange={(e)=>updateDays(e.target.value)} className="w-12 p-1 bg-transparent font-bold text-indigo-700 text-center outline-none"/></div>
                        <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2"><Users className="w-5 h-5 text-indigo-600"/> Members & Expenses</h2>
                        <button onClick={addMember} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95"><Plus className="w-4 h-4"/> Add Member</button>
                    </div>
                    <div className="p-6 space-y-4 bg-slate-50/50">
                        {members.map(m => <MemberCard key={m.id} member={m} daysInMonth={daysInMonth} updateMember={updateMember} removeMember={removeMember} onSmartParse={(id)=>{setActiveMemberId(id);setParseText('');setParseError('');setShowParseModal(true)}} />)}
                    </div>
                    <div className="px-6 pb-6 bg-slate-50/50"><CustomSplitManager members={members} customSplits={customSplits} setCustomSplits={updateCustomSplits}/></div>
                    <div className="p-6 bg-white border-t border-slate-100 text-center">
                        {error && <div className="text-red-600 mb-4 bg-red-50 p-2 rounded flex justify-center gap-2"><AlertCircle className="w-5 h-5"/>{error}</div>}
                        <button 
                            onClick={calculate} 
                            className="w-full md:w-auto px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all flex justify-center items-center gap-3"
                        >
                            <Calculator className="w-6 h-6"/> Calculate Split
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
                         <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr><th className="px-6 py-4">Member</th><th className="px-6 py-4">Var Share</th><th className="px-6 py-4">Fixed Share</th><th className="px-6 py-4">Side Share</th><th className="px-6 py-4">Net Balance</th></tr></thead><tbody>{results.balances.map(m=><tr key={m.id} className="border-b"><td className="px-6 py-4 font-bold">{m.name}</td><td className="px-6 py-4">₹{m.variableShare.toFixed(2)}</td><td className="px-6 py-4">₹{m.fixedShare.toFixed(2)}</td><td className="px-6 py-4">₹{m.customShare.toFixed(2)}</td><td className={`px-6 py-4 font-bold ${m.netBalance>=0?'text-emerald-600':'text-red-600'}`}>{m.netBalance}</td></tr>)}</tbody></table></div>
                    </div>
                    <div className="bg-gradient-to-b from-emerald-50 to-white rounded-3xl border border-emerald-100 p-8 shadow-lg">
                        <h3 className="text-2xl font-extrabold text-emerald-900 mb-6 flex gap-2"><Check className="w-6 h-6"/> Settlement Plan (Rounded)</h3>
                        {results.transactions.length===0?<div className="text-center font-bold text-emerald-800">All Settled!</div>:
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
                        <div className="mt-6 flex gap-3"><button onClick={handleDraftMessage} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold shadow-md transition-all active:scale-95"><Sparkles className="w-4 h-4 inline mr-2"/> Draft Message</button></div>
                    </div>
                  </div>
                )}
             </div>
             
             {showParseModal && (
                <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowParseModal(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 relative" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2"><Sparkles className="w-6 h-6 text-purple-600"/> AI Smart Add</h3>
                        <p className="text-slate-500 text-sm mb-4">Paste your expenses below (e.g., "Lunch 350, Taxi 120"). AI will extract and add them.</p>
                        
                        {parseError && (
                            <div className="text-red-500 text-sm font-bold mb-3 bg-red-50 p-3 rounded-lg flex items-center gap-2 animate-pulse">
                                <AlertCircle className="w-4 h-4"/> {parseError}
                            </div>
                        )}

                        <textarea 
                            className="w-full h-32 border border-slate-200 p-4 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none transition-all resize-none bg-slate-50" 
                            value={parseText} 
                            onChange={e=>setParseText(e.target.value)} 
                            placeholder="e.g. Paid 500 for lunch and 200 for snacks..." 
                            autoFocus
                        />
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowParseModal(false)} className="flex-1 bg-white border border-slate-200 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors">Cancel</button>
                            <button onClick={handleSmartParse} disabled={isAnalyzing} className="flex-[2] bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-bold hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                                {isAnalyzing ? <><Loader2 className="w-5 h-5 animate-spin"/> Analyzing...</> : 'Add Expenses'}
                            </button>
                        </div>
                        <button onClick={()=>setShowParseModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"><X className="w-5 h-5"/></button>
                    </div>
                </div>
             )}
             
             {showDraftModal && (
                <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowDraftModal(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 relative" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2"><MessageSquare className="w-6 h-6 text-emerald-600"/> Draft Message</h3>
                        {isDrafting ? (
                            <div className="h-48 flex flex-col items-center justify-center text-slate-400 gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-emerald-500"/>
                                <span className="text-sm font-medium">Writing perfect message...</span>
                            </div>
                        ) : (
                            <textarea readOnly className="w-full h-48 bg-slate-50 p-4 rounded-xl text-sm border border-slate-200 focus:outline-none resize-none font-mono text-slate-600" value={draftedMessage}/>
                        )}
                        <div className="flex gap-2 mt-4">
                            <button onClick={copyToClipboard} className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2">
                                {copySuccess ? <><Check className="w-4 h-4"/> Copied!</> : <><Copy className="w-4 h-4"/> Copy Text</>}
                            </button>
                        </div>
                        <button onClick={()=>setShowDraftModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"><X className="w-5 h-5"/></button>
                    </div>
                </div>
             )}
        </div>
    );
};

// --- MAIN ORCHESTRATOR ---

export default function App() {
    const [user, setUser] = useState(null);
    const [groupId, setGroupId] = useState(null);
    const [initialRoomName, setInitialRoomName] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    useEffect(() => {
        // --- REACT + FIREBASE PATTERN: AUTH FIRST ---
        const initAuth = async () => {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                try {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } catch (e) {
                    console.error("Custom token login failed", e);
                }
            }
        };
        initAuth();

        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            setUser(u);
            if (u) {
                // Restore session from local storage to prevent refresh wipe
                const savedGroupId = localStorage.getItem('fs_groupId');
                if (savedGroupId) {
                    setGroupId(savedGroupId);
                }
            }
            setLoadingAuth(false);
        });
        return () => unsubscribe();
    }, []);

    const handleCreateRoom = (code, name) => {
        localStorage.setItem('fs_groupId', code);
        setGroupId(code);
        setInitialRoomName(name);
    };

    const handleJoinRoom = (code, name) => {
        localStorage.setItem('fs_groupId', code);
        setGroupId(code);
        setInitialRoomName(name); 
    };

    const handleLeaveRoom = () => {
        localStorage.removeItem('fs_groupId');
        setGroupId(null);
        setInitialRoomName(null); 
    };

    if (loadingAuth) return <LoadingScreen />;

    if (!user) return <LoginView />;
    
    if (!groupId) return (
        <WelcomeDashboard 
            user={user} 
            onJoin={handleJoinRoom} 
            onCreate={handleCreateRoom} 
        />
    );

    return (
        <ExpenseSplitter 
            user={user} 
            groupId={groupId} 
            initialRoomName={initialRoomName}
            onLeaveGroup={handleLeaveRoom} 
        />
    );
}

const ArrowIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
);