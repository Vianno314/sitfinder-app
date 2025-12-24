import React, { useEffect, useState, useMemo, useRef } from "react";
// Importations Firebase
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  deleteUser
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  arrayUnion,
  arrayRemove,
  query,
  orderBy
} from "firebase/firestore";
// Importations des icônes
import { 
  Baby, LogOut, Save, Search, Loader2, AlertCircle, ShieldCheck, 
  Euro, User, Mail, Lock, ChevronRight, Sparkles, Heart, Filter, Calendar,
  Clock, UserPlus, Cake, FileUp, FileText, CheckCircle2, MessageSquare, 
  Send, X, Check, ArrowLeft, MessageCircle, PartyPopper, Star, MapPin, Camera, SlidersHorizontal, Settings, KeyRound, Phone, Trash2, Palette, Image as ImageIcon, Share2, Quote, TrendingUp, Zap, Trophy, Languages, EyeOff, Moon, Sun, Bell, Flag, Eye, Wallet
} from "lucide-react";

// ==========================================
// 1. CONFIGURATION FIREBASE
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyCcg_EOypcJ79aqKEwgWCzZwGkSQ-cd_7s",
  authDomain: "sitfinder-df2e4.firebaseapp.com",
  projectId: "sitfinder-df2e4",
  storageBucket: "sitfinder-df2e4.firebasestorage.app",
  messagingSenderId: "696466258660",
  appId: "1:696466258660:web:b116371de7646bf0d6caf1",
  measurementId: "G-6LRHQJ50SH"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app, "default");
const appId = "sitfinder-prod-v1";

// ==========================================
// 2. UTILITAIRES DE DESIGN
// ==========================================

const SitFinderLogo = ({ className = "w-16 h-16" }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <div className="relative bg-white p-0.5 rounded-full shadow-xl ring-4 ring-white overflow-hidden flex items-center justify-center h-full w-full">
      <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
    </div>
  </div>
);

const SplashScreen = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-white">
    <SitFinderLogo className="w-40 h-40 animate-pulse" />
    <h1 className="text-4xl font-black italic mt-10 text-slate-800 uppercase">SIT<span className="text-emerald-500">FINDER</span></h1>
  </div>
);

// ==========================================
// 3. VUE PARAMÈTRES (CORRIGÉE)
// ==========================================

const SettingsView = ({ user, profile, onBack, isDark, toggleDark }) => {
  const [newName, setNewName] = useState(profile?.name || "");
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = async () => {
    if (window.confirm("⚠️ Supprimer définitivement votre compte ?")) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile'));
        if (profile?.role === 'sitter') {
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sitters', user.uid));
        }
        await deleteUser(auth.currentUser);
        alert("Compte supprimé.");
      } catch (err) {
        alert("Action sécurisée : déconnectez-vous et reconnectez-vous avant de supprimer.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-800'}`}>
      <div className="p-6 border-b flex items-center gap-4 bg-inherit sticky top-0 z-50">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-500/10"><ArrowLeft size={20}/></button>
        <h2 className="font-black text-xl uppercase italic">Réglages</h2>
      </div>
      <div className="max-w-2xl mx-auto p-6 space-y-10 mt-10">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-black uppercase text-slate-400 mb-6 tracking-widest italic">Mon Profil</h3>
            <div className="space-y-4">
                <p className="font-bold text-lg">Prénom : {profile?.name}</p>
                <p className="text-slate-400 text-sm">Email : {user?.email}</p>
            </div>
        </div>
        
        <div className="space-y-4">
          <button onClick={() => signOut(auth)} className="w-full p-6 border-2 border-dashed rounded-[2rem] font-black uppercase flex items-center justify-center gap-3 text-slate-400 hover:bg-slate-100 transition-all"><LogOut size={18}/> Déconnexion</button>
          <button onClick={handleDeleteAccount} className="w-full p-6 bg-red-50 text-red-500 rounded-[2rem] font-black uppercase flex items-center justify-center gap-3 hover:bg-red-500 hover:text-white transition-all border border-red-100"><Trash2 size={18}/> Supprimer mon compte</button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. AUTH & DASHBOARDS
// ==========================================

const AuthScreen = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("parent");

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'artifacts', appId, 'users', cred.user.uid, 'settings', 'profile'), {
          uid: cred.user.uid, name, role, email, favorites: [], createdAt: new Date().toISOString()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) { alert("Erreur : vérifiez vos identifiants."); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-10 rounded-[3rem] shadow-xl w-full max-w-md text-center">
        <SitFinderLogo className="mx-auto mb-6" />
        <h2 className="text-3xl font-black italic uppercase mb-8">SIT<span className="text-emerald-500">FINDER</span></h2>
        <form onSubmit={handleAuth} className="space-y-4">
          {isRegister && <input placeholder="Ton Prénom" className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold" value={name} onChange={(e) => setName(e.target.value)} />}
          <input placeholder="Email" className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Mot de passe" className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold" value={password} onChange={(e) => setPassword(e.target.value)} />
          {isRegister && (
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button type="button" onClick={() => setRole("parent")} className={`py-3 rounded-lg font-black text-[10px] ${role === "parent" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400"}`}>PARENT</button>
              <button type="button" onClick={() => setRole("sitter")} className={`py-3 rounded-lg font-black text-[10px] ${role === "sitter" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"}`}>SITTER</button>
            </div>
          )}
          <button className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black uppercase mt-4 shadow-lg">{isRegister ? "Créer mon compte" : "Se connecter"}</button>
        </form>
        <button className="mt-8 text-blue-600 font-black text-xs uppercase underline tracking-widest" onClick={() => setIsRegister(!isRegister)}>{isRegister ? "Déjà un compte ?" : "Nouveau ? Créer un profil"}</button>
      </div>
    </div>
  );
};

const Dashboard = ({ profile, user }) => {
  const [activeTab, setActiveTab] = useState("home");
  const [isDark, setIsDark] = useState(false);

  if (activeTab === "settings") return <SettingsView user={user} profile={profile} onBack={() => setActiveTab("home")} isDark={isDark} toggleDark={() => setIsDark(!isDark)} />;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <nav className="p-6 flex justify-between items-center bg-white border-b sticky top-0 z-40">
        <h1 className="font-black italic text-2xl uppercase tracking-tighter">SIT<span className="text-emerald-500">FINDER</span></h1>
        <button onClick={() => setActiveTab("settings")} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all"><Settings size={22}/></button>
      </nav>
      <main className="p-10 max-w-4xl mx-auto text-center space-y-6">
          <div className="p-16 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-[4rem] text-white shadow-2xl">
              <h2 className="text-5xl font-black italic tracking-tighter mb-4">Bonjour {profile?.name} !</h2>
              <p className="uppercase font-black tracking-[0.3em] text-[10px] opacity-80">Bienvenue sur votre espace {profile?.role}</p>
          </div>
          <div className="py-20 border-4 border-dashed border-slate-200 rounded-[4rem] text-slate-300 italic text-xl font-bold">
              Recherche de baby-sitters bientôt disponible...
          </div>
      </main>
    </div>
  );
};

// ==========================================
// 5. RACINE
// ==========================================

export default function App() {
  const [init, setInit] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        onSnapshot(doc(db, 'artifacts', appId, 'users', u.uid, 'settings', 'profile'), (snap) => {
          setProfile(snap.exists() ? snap.data() : null);
        });
      } else {
        setProfile(null);
      }
    });
    setTimeout(() => setInit(true), 1500);
    return () => unsub();
  }, []);

  if (!init) return <SplashScreen />;
  if (!user) return <AuthScreen />;
  if (user && !profile) return <div className="h-screen flex items-center justify-center font-black uppercase tracking-widest animate-pulse">Chargement du profil...</div>;
  
  return <Dashboard profile={profile} user={user} />;
}
