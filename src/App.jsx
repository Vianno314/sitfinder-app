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

  const handleDeleteAccount = async () => {
    if (window.confirm("⚠️ ACTION IRRÉVERSIBLE : Veux-tu supprimer ton compte et tes données ?")) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile'));
        if (profile.role === 'sitter') {
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sitters', user.uid));
        }
        await deleteUser(auth.currentUser);
        alert("Compte supprimé avec succès.");
      } catch (err) {
        alert("Sécurité : merci de vous reconnecter avant de supprimer.");
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
        <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-50'} p-8 rounded-[3rem] shadow-xl border flex items-center justify-between`}>
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-50 text-amber-500'}`}>{isDark ? <Moon size={24}/> : <Sun size={24}/>}</div>
                <div className="text-left"><p className="text-xs font-black uppercase">Mode Sombre</p><p className="text-[10px] text-slate-400 font-bold">{isDark ? 'Activé' : 'Désactivé'}</p></div>
            </div>
            <button onClick={toggleDark} className={`w-14 h-7 rounded-full relative transition-all ${isDark ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${isDark ? 'right-1' : 'left-1'}`}></div>
            </button>
        </div>

        <form onSubmit={handleUpdateProfile} className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-50'} p-10 rounded-[3.5rem] shadow-xl border space-y-6`}>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} className={`w-full p-4 rounded-2xl font-bold outline-none ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-50'}`} placeholder="Prénom" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={`w-full p-4 rounded-2xl font-bold outline-none ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-50'}`} placeholder="Téléphone" />
            <button disabled={loading} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase">Sauvegarder</button>
        </form>

        <div className="space-y-4">
          <button onClick={() => signOut(auth)} className="w-full p-6 border-2 border-dashed border-slate-200 text-slate-400 rounded-[2.5rem] font-black uppercase flex items-center justify-center gap-3"><LogOut size={18}/> Déconnexion</button>
          <button onClick={handleDeleteAccount} className="w-full p-6 bg-red-50 text-red-500 rounded-[2.5rem] font-black uppercase flex items-center justify-center gap-3 hover:bg-red-500 hover:text-white transition-all border border-red-100"><Trash2 size={18}/> Supprimer mon compte</button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. MESSAGERIE & CHAT
// ==========================================

const ChatRoom = ({ offer, currentUser, onBack, isDark }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef(null);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'offers', offer.id, 'messages');
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)));
      setTimeout(scrollToBottom, 100);
    });
    return () => unsub();
  }, [offer.id]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'offers', offer.id, 'messages'), {
        text: newMessage, senderId: currentUser.uid, createdAt: Timestamp.now()
      });
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'offers', offer.id), {
          lastMsg: newMessage, lastMsgAt: Timestamp.now(), hasUnread: true, lastSenderId: currentUser.uid
      });
      setNewMessage("");
    } catch (e) { console.error(e); }
  };

  return (
    <div className={`flex flex-col h-screen font-sans ${isDark ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'}`}>
      <div className={`p-6 border-b flex items-center gap-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-500/10"><ArrowLeft size={20}/></button>
        <h3 className="font-black uppercase italic text-xs">Chat SITFINDER</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-4 rounded-2xl max-w-[80%] ${m.senderId === currentUser.uid ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-800'}`}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={sendMessage} className="p-6 border-t flex gap-4">
        <input className={`flex-1 p-4 rounded-2xl outline-none ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Message..." />
        <button type="submit" className="bg-blue-600 text-white p-4 rounded-2xl"><Send size={20}/></button>
      </form>
    </div>
  );
};

// ==========================================
// 5. AUTH & LOGIQUE RACINE
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
    } catch (err) { alert("Erreur d'authentification."); }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-slate-900">
      <SitFinderLogo className="mb-6 h-24 w-24" />
      <form onSubmit={handleAuth} className="w-full max-w-md space-y-4">
        {isRegister && <input placeholder="Prénom" className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold" value={name} onChange={(e) => setName(e.target.value)} />}
        <input placeholder="Email" className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Mot de passe" className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black uppercase">{isRegister ? "S'inscrire" : "Se connecter"}</button>
      </form>
      <button className="mt-8 text-blue-600 font-bold uppercase text-xs underline" onClick={() => setIsRegister(!isRegister)}>{isRegister ? "Déjà un compte ?" : "Créer un compte"}</button>
    </div>
  );
};

// ==========================================
// 6. DASHBOARDS (SIMPLIFIÉS POUR LE BUILD)
// ==========================================

const ParentDashboard = ({ profile, user }) => {
  const [activeTab, setActiveTab] = useState("search");
  const [isDark, setIsDark] = useState(false);

  if (activeTab === "settings") return <SettingsView user={user} profile={profile} onBack={() => setActiveTab("search")} isDark={isDark} toggleDark={() => setIsDark(!isDark)} />;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-800'}`}>
      <nav className="p-6 border-b flex justify-between bg-inherit">
        <h1 className="font-black italic text-xl uppercase">SITFINDER</h1>
        <button onClick={() => setActiveTab("settings")}><Settings/></button>
      </nav>
      <div className="p-10 text-center"><h2 className="text-3xl font-black">Bonjour {profile.name}</h2></div>
    </div>
  );
};

const SitterDashboard = ({ user, profile }) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [isDark, setIsDark] = useState(false);

  if (activeTab === "settings") return <SettingsView user={user} profile={profile} onBack={() => setActiveTab("profile")} isDark={isDark} toggleDark={() => setIsDark(!isDark)} />;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-800'}`}>
      <nav className="p-6 border-b flex justify-between bg-inherit">
        <h1 className="font-black italic text-xl uppercase">ESPACE SITTER</h1>
        <button onClick={() => setActiveTab("settings")}><Settings/></button>
      </nav>
      <div className="p-10 text-center"><h2 className="text-3xl font-black">Profil de {profile.name}</h2></div>
    </div>
  );
};

export default function App() {
  const [init, setInit] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        onSnapshot(doc(db, 'artifacts', appId, 'users', u.uid, 'settings', 'profile'), (snap) => {
          setProfile(snap.exists() ? snap.data() : null);
        });
      } else { setProfile(null); }
    });
    setTimeout(() => setInit(true), 2000);
  }, []);

  if (!init) return <SplashScreen />;
  if (!user) return <AuthScreen />;
  if (user && !profile) return <div className="p-20 text-center">Chargement profil...</div>;
  return profile.role === "parent" ? <ParentDashboard profile={profile} user={user} /> : <SitterDashboard user={user} profile={profile} />;
}
