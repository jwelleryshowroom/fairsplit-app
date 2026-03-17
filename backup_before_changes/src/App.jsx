import React, { useState, useEffect } from 'react';
import { signInWithCustomToken, onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import LoadingScreen from './components/LoadingScreen';
import LoginView from './components/LoginView';
import WelcomeDashboard from './components/WelcomeDashboard';
import ExpenseSplitter from './components/ExpenseSplitter';

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