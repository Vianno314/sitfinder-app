import React, { useEffect, useState, useMemo, useRef } from "react";
// Importations Firebase
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  deleteUser // AJOUTÉ POUR LA SUPPRESSION
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
  deleteDoc, // AJOUTÉ POUR LA SUPPRESSION
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
// 2. UTILITAIRES DE DESIGN & LOGIQUE
// ==========================================

const SitFinderLogo = ({ className = "w-16 h-16", glow = true }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    {glow && (
      <>
        <div className="absolute inset-0 bg-emerald-400 rounded-3xl rotate-12 opacity-20 animate-pulse text-emerald-400"></div>
        <div className="absolute inset-0 bg-blue-400 rounded-3xl -rotate-6 opacity-20 animate-pulse delay-75 text-blue-400"></div>
      </>
    )}
    <div className="relative bg-white p-0.5 rounded-full shadow-xl ring-4 ring-white overflow-hidden flex items-center justify-center h-full w-full">
      <img src="/logo.png" alt="SitFinder Logo" className="w-full h-full object-cover" />
    </div>
  </div>
);

const RatingStars = ({ rating = 5, size = 14, interactive = false, onRate = null }) => (
  <div className="flex gap-0.5 text-amber-400">
    {[...Array(5)].map((_, i) => (
      <Star key={i} size={size} onClick={() => interactive && onRate && onRate(i + 1)} fill={i < Math.floor(rating) ? "currentColor" : "none"} className={`${i < Math.floor(rating) ? "" : "text-slate-200"} ${interactive ? "cursor-pointer hover:scale-125 transition-all" : ""}`} />
    ))}
  </div>
);

const calculateAge = (birth) => {
  if (!birth) return null;
  const today = new Date();
  const birthDate = new Date(birth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

const SplashScreen = ({ message = "La recherche en toute confiance" }) => (
  <div className="flex flex-col items-center justify-center h-screen bg-white font-sans overflow-hidden">
    <div className="relative mb-10 animate-in zoom-in duration-1000">
      <div className="absolute inset-0 bg-blue-500 blur-[100px] opacity-10"></div>
      <SitFinderLogo className="w-40 h-40" />
    </div>
    <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
      <h1 className="text-6xl font-black tracking-tighter text-slate-800 italic leading-none uppercase">SIT<span className="text-emerald-500 font-sans italic">FINDER</span></h1>
      <p className="text-blue-600/60 font-bold uppercase tracking-[0.4em] text-[10px] px-4 font-sans">{message}</p>
    </div>
  </div>
);

// ==========================================
// 3. COMPOSANT PARAMÈTRES (AVEC SUPPRESSION)
// ==========================================

const SettingsView = ({ user, profile, onBack, isDark, toggleDark }) => {
  const [newName, setNewName] = useState(profile?.name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [customPhoto, setCustomPhoto] = useState(profile?.photoURL || "");
  const [avatarStyle, setAvatarStyle] = useState(profile?.avatarStyle || "avataaars");
  const [useCustomPhoto, setUseCustomPhoto] = useState(profile?.useCustomPhoto || false);
  const [privateMode, setPrivateMode] = useState(profile?.privateMode || false);
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [loading, setLoading] = useState(false);

  // FONCTION DE SUPPRESSION DE COMPTE
  const handleDeleteAccount = async () => {
    if (window.confirm("⚠️ ACTION IRRÉVERSIBLE : Veux-tu vraiment supprimer ton compte et toutes tes données SITFINDER ?")) {
      setLoading(true);
      try {
        // 1. Supprimer les données dans Firestore
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile'));
        if (profile.role === 'sitter') {
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sitters', user.uid));
        }
        
        // 2. Supprimer l'utilisateur de l'Auth
        await deleteUser(user);
        
        alert("Compte supprimé avec succès.");
      } catch (err) {
        console.error(err);
        alert("Sécurité : reconnecte-toi et réessaie immédiatement pour valider la suppression.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setCustomPhoto(reader.result); setUseCustomPhoto(true); };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updateData = { name: newName, phone, avatarStyle, photoURL: customPhoto, useCustomPhoto, privateMode };
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile'), updateData);
      if (profile.role === 'sitter') {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sitters', user.uid), { name: newName, avatarStyle, photoURL: customPhoto, useCustomPhoto, phone });
      }
      setStatus({ type: "success", msg: "Modifications enregistrées ! ✨" });
    } catch (err) { setStatus({ type: "error", msg: "Erreur..." }); }
    finally { setLoading(false); }
  };

  const currentPhoto = useCustomPhoto && customPhoto ? customPhoto : `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${newName}`;

  return (
    <div className={`min-h-screen font-sans animate-in slide-in-from-right duration-500 pb-32 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-800'}`}>
      <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} p-6 border-b flex items-center gap-4 sticky top-0 z-50 shadow-sm`}>
        <button onClick={onBack} className={`p-2 rounded-full ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}><ArrowLeft size={20}/></button>
        <h2 className="font-black text-xl italic uppercase">Réglages SITFINDER</h2>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-8 mt-4 text-left">
        {status.msg && <div className={`p-4 rounded-2xl font-bold text-center text-[10px] uppercase tracking-widest ${status.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>{status.msg}</div>}

        <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-50'} p-8 rounded-[3rem] shadow-xl border flex items-center justify-between`}>
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-50 text-amber-500'}`}>{isDark ? <Moon size={24}/> : <Sun size={24}/>}</div>
                <div className="text-left"><p className="text-xs font-black uppercase">Mode Sombre</p><p className="text-[10px] text-slate-400 font-bold">{isDark ? 'Activé' : 'Désactivé'}</p></div>
            </div>
            <button onClick={toggleDark} className={`w-14 h-7 rounded-full relative transition-all ${isDark ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${isDark ? 'right-1' : 'left-1'}`}></div>
            </button>
        </div>

        <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-50'} p-10 rounded-[3.5rem] shadow-xl border flex flex-col items-center gap-6`}>
            <div className="relative">
                <div className={`w-40 h-40 rounded-[3rem] border-4 ${isDark ? 'border-slate-800' : 'border-white'} shadow-2xl overflow-hidden ring-8 ${isDark ? 'ring-slate-900' : 'ring-slate-50/50'}`}>
                    <img src={currentPhoto} alt="profile" className="w-full h-full object-cover" />
                </div>
                <label htmlFor="p-upload" className="absolute -bottom-2 -right-2 p-4 bg-slate-900 text-white rounded-2xl shadow-xl cursor-pointer hover:scale-110 active:scale-95 transition-all">
                  <Camera size={20}/><input type="file" id="p-upload" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                </label>
            </div>
            <div className={`flex gap-2 p-1 rounded-2xl w-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <button onClick={() => setUseCustomPhoto(false)} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase ${!useCustomPhoto ? (isDark ? 'bg-slate-700 text-blue-400 shadow' : 'bg-white shadow text-blue-600') : 'text-slate-400'}`}>Avatar</button>
                <button onClick={() => setUseCustomPhoto(true)} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase ${useCustomPhoto ? (isDark ? 'bg-slate-700 text-blue-400 shadow' : 'bg-white shadow text-blue-600') : 'text-slate-400'}`}>Ma Photo</button>
            </div>
        </div>

        <form onSubmit={handleUpdateProfile} className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-50'} p-10 rounded-[3.5rem] shadow-xl border space-y-6`}>
            <div className="space-y-2"><label className="text-[10px] font-black text-slate-300 uppercase ml-2 italic">Prénom</label><input value={newName} onChange={(e) => setNewName(e.target.value)} className={`w-full p-4 rounded-2xl font-bold outline-none border border-transparent ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-50'}`} /></div>
            <div className="space-y-2"><label className="text-[10px] font-black text-slate-300 uppercase ml-2 italic">Téléphone</label><input placeholder="06..." value={phone} onChange={(e) => setPhone(e.target.value)} className={`w-full p-4 rounded-2xl font-bold outline-none border border-transparent ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-50'}`} /></div>
            <div className="flex items-center justify-between p-4 bg-slate-50/10 rounded-2xl">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg text-slate-400"><EyeOff size={16}/></div>
                    <div className="text-left"><p className="text-xs font-black uppercase">Mode Privé</p><p className="text-[10px] text-slate-500">Masque ton nom</p></div>
                </div>
                <button type="button" onClick={() => setPrivateMode(!privateMode)} className={`w-12 h-6 rounded-full relative transition-all ${privateMode ? 'bg-emerald-500' : 'bg-slate-300'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${privateMode ? 'right-1' : 'left-1'}`}></div></button>
            </div>
            <button disabled={loading} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black text-[10px] uppercase shadow-xl">Sauvegarder les réglages</button>
        </form>

        <div className="space-y-4">
          <button onClick={() => signOut(auth)} className="w-full p-6 border-2 border-dashed border-slate-200 text-slate-400 rounded-[2.5rem] font-black text-[10px] uppercase flex items-center justify-center gap-3 hover:bg-slate-50 transition-all"><LogOut size={18}/> Déconnexion</button>
          
          {/* BOUTON DE SUPPRESSION ROUGE */}
          <button onClick={handleDeleteAccount} className="w-full p-6 bg-red-50 text-red-500 rounded-[2.5rem] font-black text-[10px] uppercase flex items-center justify-center gap-3 hover:bg-red-500 hover:text-white transition-all border border-red-100"><Trash2 size={18}/> Supprimer mon compte</button>
        </div>
      </div>
    </div>
  );
};

// ... LE RESTE DU CODE (ChatRoom, Auth, Dashboards) RESTE IDENTIQUE ...
