import React, { useEffect, useState, useMemo, useRef } from "react";
// Importations Firebase
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  deleteUser,
  sendPasswordResetEmail
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
  orderBy,
  where
} from "firebase/firestore";
// Importations des icônes (Nettoyées et Sécurisées)
import { 
  Baby, LogOut, Save, Search, Loader2, AlertCircle, ShieldCheck, 
  Euro, User, Mail, Lock, ChevronRight, Sparkles, Heart, Filter, Calendar,
  Clock, UserPlus, Cake, FileUp, FileText, CheckCircle2, MessageSquare, 
  Send, X, Check, ArrowLeft, MessageCircle, PartyPopper, Star, MapPin, Camera, SlidersHorizontal, Settings, KeyRound, Phone, Trash2, Palette, Image as ImageIcon, Share2, Quote, TrendingUp, Zap, Trophy, Languages, EyeOff, Moon, Sun, Bell, Flag, Eye, Wallet, Car, CreditCard, LockKeyhole, Crown, Info, Dog, Cat, Bone, PawPrint, RefreshCw, HelpCircle, Power, Inbox, Edit2
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
// 2. UTILITAIRES & CONSTANTES
// ==========================================

const DEFAULT_AVAILABILITY = {
  Lundi: { active: false, start: "08:00", end: "18:00" },
  Mardi: { active: false, start: "08:00", end: "18:00" },
  Mercredi: { active: false, start: "08:00", end: "18:00" },
  Jeudi: { active: false, start: "08:00", end: "18:00" },
  Vendredi: { active: false, start: "08:00", end: "18:00" },
  Samedi: { active: false, start: "08:00", end: "18:00" },
  Dimanche: { active: false, start: "08:00", end: "18:00" },
};

const SitFinderLogo = ({ className = "w-16 h-16", glow = true }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    {glow && (
      <>
        <div className="absolute inset-0 bg-[#E64545] rounded-3xl rotate-12 opacity-20 animate-pulse"></div>
        <div className="absolute inset-0 bg-[#E0720F] rounded-3xl -rotate-6 opacity-20 animate-pulse delay-75"></div>
      </>
    )}
    <div className="relative bg-white p-0.5 rounded-full shadow-xl ring-4 ring-white overflow-hidden flex items-center justify-center h-full w-full">
      <img src="/logo.png" alt="BabyKeeper Logo" className="w-full h-full object-cover" />
    </div>
  </div>
);

const RatingStars = ({ rating = 5, size = 14, interactive = false, onRate = null }) => (
  <div className="flex gap-0.5 text-[#E0720F]">
    {[...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        size={size} 
        onClick={() => interactive && onRate && onRate(i + 1)} 
        fill={i < Math.floor(rating) ? "currentColor" : "none"} 
        className={`${i < Math.floor(rating) ? "" : "text-slate-200"} ${interactive ? "cursor-pointer hover:scale-125 transition-all" : ""}`} 
      />
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

// Compression d'image (Sécurisée)
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 500;
        const scaleSize = MAX_WIDTH / img.width;
        if (scaleSize >= 1) {
            canvas.width = img.width; canvas.height = img.height;
        } else {
            canvas.width = MAX_WIDTH; canvas.height = img.height * scaleSize;
        }
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8)); 
      };
      img.onerror = (e) => reject(e);
    };
    reader.onerror = (e) => reject(e);
  });
};

const SplashScreen = ({ message = "La recherche en toute confiance" }) => (
  <div className="flex flex-col items-center justify-center h-screen bg-white font-sans overflow-hidden">
    <div className="relative mb-10 animate-in zoom-in duration-1000">
      <div className="absolute inset-0 bg-[#E64545] blur-[100px] opacity-10"></div>
      <SitFinderLogo className="w-40 h-40" />
    </div>
    <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
      <h1 className="text-6xl font-black tracking-tighter italic leading-none uppercase font-sans text-transparent bg-clip-text bg-gradient-to-r from-[#E64545] to-[#E0720F]">
        BABYKEEPER
      </h1>
      <p className="text-[#E64545]/60 font-bold uppercase tracking-[0.4em] text-[10px] px-4 font-sans">{message}</p>
    </div>
  </div>
);

const UserAvatar = ({ photoURL, size = "w-full h-full", className = "" }) => {
    // Protection anti-crash
    if (photoURL && typeof photoURL === 'string' && photoURL.length > 50) {
        return <img src={photoURL} alt="User" className={`${size} object-cover ${className}`} />;
    }
    return (
        <div className={`${size} bg-slate-200 flex items-center justify-center text-slate-400 ${className}`}>
            <User size="50%" />
        </div>
    );
};

// ==========================================
// 3. COMPOSANTS GLOBAUX
// ==========================================

const FAQModal = ({ onClose }) => {
    const faqs = [
        { q: "Comment payer le Sitter ?", r: "Le paiement se fait en direct (Espèces, Lydia, CESU) à la fin de la garde. BabyKeeper ne prend aucune commission." },
        { q: "C'est quoi le point vert ?", r: "C'est le mode 'Dispo Immédiate'. Le Sitter est prêt à intervenir tout de suite (urgence)." },
        { q: "Je veux garder des animaux aussi !", r: "Cliquez sur le bouton 'Mode' en haut à droite et choisissez 'Pet-Sitter'." },
        { q: "Comment avoir le badge Vérifié ?", r: "Remplissez votre profil à 100% et ajoutez une photo claire." },
        { q: "À quoi sert le Premium ?", r: "Le Premium (3€/mois) vous permet de contacter les Sitters en illimité." }
    ];

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[70] flex items-center justify-center p-6 text-slate-900 animate-in fade-in zoom-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[2rem] p-8 space-y-6 max-h-[80vh] overflow-y-auto shadow-2xl">
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-[#E64545]">Questions Freq.</h3>
                    <button onClick={onClose} className="p-3 bg-slate-100 rounded-full"><X size={20}/></button>
                </div>
                <div className="space-y-4">
                    {faqs.map((item, i) => (
                        <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                            <h4 className="font-black text-xs uppercase mb-2 flex items-center gap-2"><Info size={14} className="text-[#E0720F]"/> {item.q}</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">{item.r}</p>
                        </div>
                    ))}
                </div>
                <div className="text-center pt-4 border-t border-slate-100">
                    <a href="mailto:babykeeper.bordais@gmail.com" className="text-xs font-bold text-slate-400 hover:text-[#E64545] uppercase tracking-widest">Contacter le support</a>
                </div>
            </div>
        </div>
    );
};

const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstall, setShowInstall] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator.standalone);
        
        if (isIosDevice && !isInStandaloneMode) {
            setIsIOS(true);
            setShowInstall(true);
        }

        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstall(true);
        };
        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handleInstallClick = () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    setShowInstall(false);
                }
                setDeferredPrompt(null);
            });
        }
    };

    if (!showInstall) return null;

    return (
        <div className="fixed bottom-24 left-4 right-4 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl z-[60] flex items-center justify-between border border-slate-700 animate-in slide-in-from-bottom-10 fade-in duration-700">
            <div className="flex items-center gap-3">
                <div className="bg-white p-1 rounded-lg">
                    <img src="/logo.png" alt="Icon" className="w-8 h-8 rounded-md" />
                </div>
                <div>
                    <h4 className="font-bold text-sm">Installer BabyKeeper</h4>
                    <p className="text-[10px] text-slate-400">Pour un accès plus rapide</p>
                </div>
            </div>
            
            {isIOS ? (
                <div className="flex items-center gap-2 text-[10px] font-bold text-[#E0720F]">
                    <span>Partager <Share2 size={10} className="inline"/> puis "Sur l'écran d'accueil"</span>
                    <button onClick={() => setShowInstall(false)} className="bg-slate-800 p-2 rounded-full"><X size={14}/></button>
                </div>
            ) : (
                <div className="flex gap-2">
                    <button onClick={handleInstallClick} className="bg-[#E64545] px-4 py-2 rounded-xl text-xs font-black uppercase shadow-lg">Installer</button>
                    <button onClick={() => setShowInstall(false)} className="bg-slate-800 p-2 rounded-xl"><X size={16}/></button>
                </div>
            )}
        </div>
    );
};

const ModeSwitcher = ({ currentRole, currentService, uid }) => {
    const [isOpen, setIsOpen] = useState(false);

    const switchMode = async (role, service) => {
        setIsOpen(false);
        await updateDoc(doc(db, 'artifacts', appId, 'users', uid, 'settings', 'profile'), { 
            role: role, 
            serviceType: service 
        });
    };

    return (
        <div className="relative z-50">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 shadow-sm flex items-center gap-2 active:scale-95 transition-all">
                <RefreshCw size={18} className={isOpen ? "animate-spin" : ""} />
                <span className="text-[10px] font-black uppercase hidden md:inline">Mode</span>
            </button>
            
            {isOpen && (
                <div className="absolute top-12 right-0 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2">
                    <div className="text-[9px] font-black uppercase text-slate-300 px-2 py-1">Univers Enfants 👶</div>
                    <button onClick={() => switchMode('parent', 'baby')} className={`flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${currentRole === 'parent' && currentService === 'baby' ? 'bg-[#E64545] text-white' : 'hover:bg-slate-50 text-slate-600'}`}>
                        <Baby size={16} /> <span className="text-xs font-bold">Je suis Parent</span>
                    </button>
                    <button onClick={() => switchMode('sitter', 'baby')} className={`flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${currentRole === 'sitter' && currentService === 'baby' ? 'bg-[#E0720F] text-white' : 'hover:bg-slate-50 text-slate-600'}`}>
                        <User size={16} /> <span className="text-xs font-bold">Je suis Baby-Sitter</span>
                    </button>
                    
                    <div className="h-px bg-slate-100 my-1"></div>
                    
                    <div className="text-[9px] font-black uppercase text-slate-300 px-2 py-1">Univers Animaux 🐾</div>
                    <button onClick={() => switchMode('parent', 'pet')} className={`flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${currentRole === 'parent' && currentService === 'pet' ? 'bg-[#E64545] text-white' : 'hover:bg-slate-50 text-slate-600'}`}>
                        <Dog size={16} /> <span className="text-xs font-bold">Je suis Maître</span>
                    </button>
                    <button onClick={() => switchMode('sitter', 'pet')} className={`flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${currentRole === 'sitter' && currentService === 'pet' ? 'bg-[#E0720F] text-white' : 'hover:bg-slate-50 text-slate-600'}`}>
                        <PawPrint size={16} /> <span className="text-xs font-bold">Je suis Pet-Sitter</span>
                    </button>
                </div>
            )}
        </div>
    );
};

// ==========================================
// 4. COMPOSANT PARAMÈTRES
// ==========================================

const SettingsView = ({ user, profile, onBack, isDark, toggleDark }) => {
  const [newName, setNewName] = useState(profile?.name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [customPhoto, setCustomPhoto] = useState(profile?.photoURL || "");
  const [privateMode, setPrivateMode] = useState(profile?.privateMode || false);
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = async () => {
    if (window.confirm("⚠️ Supprimer définitivement ?")) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile'));
        if (profile.role === 'sitter') {
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sitters', user.uid));
        }
        await deleteUser(auth.currentUser);
        alert("Compte supprimé.");
      } catch (err) { alert("Erreur suppression."); } finally { setLoading(false); }
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        setCustomPhoto(compressedBase64);
      } catch (error) {
          alert("Image invalide");
      }
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updateData = { name: newName, phone, photoURL: customPhoto, privateMode };
      
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile'), updateData);
      
      const publicSitterRef = doc(db, 'artifacts', appId, 'public', 'data', 'sitters', user.uid);
      const publicDoc = await getDoc(publicSitterRef);
      if (publicDoc.exists()) {
          await updateDoc(publicSitterRef, { 
              name: newName, 
              photoURL: customPhoto, 
              phone,
              serviceType: profile.serviceType
          });
      }

      setStatus({ type: "success", msg: "Enregistré !" });
    } catch (err) { setStatus({ type: "error", msg: "Erreur..." }); }
    finally { setLoading(false); }
  };

  return (
    <div className={`min-h-screen font-sans ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-800'}`}>
      <div className={`p-6 border-b flex items-center gap-4 sticky top-0 z-50 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <button onClick={onBack}><ArrowLeft size={20}/></button>
        <h2 className="font-black text-xl italic uppercase text-[#E64545]">Réglages</h2>
      </div>

      <div className="max-w-2xl w-full mx-auto p-6 space-y-8 pb-52"> 
        {status.msg && <div className="p-4 bg-[#E0720F]/10 text-[#E0720F] rounded-2xl font-bold text-center text-xs uppercase">{status.msg}</div>}

        <div className={`p-8 rounded-[2rem] border flex justify-between items-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-50'}`}>
           <div className="flex items-center gap-4"><Moon size={24} className="text-[#E0720F]"/><p className="font-black text-xs uppercase">Mode Sombre</p></div>
           <button onClick={toggleDark} className={`w-14 h-7 rounded-full relative ${isDark ? 'bg-[#E64545]' : 'bg-slate-200'}`}><div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow ${isDark ? 'right-1' : 'left-1'}`}></div></button>
        </div>

        <div className="flex flex-col items-center gap-6">
            <div className="w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-[#E64545]/20 shadow-xl">
                <UserAvatar photoURL={customPhoto} />
            </div>
            <label className="py-3 px-8 rounded-xl font-black text-xs uppercase bg-[#E64545] text-white shadow-lg text-center cursor-pointer hover:bg-red-600 transition-colors">
                Changer ma photo <input type="file" hidden onChange={handlePhotoUpload} accept="image/*" />
            </label>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-6">
            <input value={newName} onChange={e=>setNewName(e.target.value)} className={`w-full p-4 rounded-xl font-bold outline-none border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`} placeholder="Prénom" />
            <input value={phone} onChange={e=>setPhone(e.target.value)} className={`w-full p-4 rounded-xl font-bold outline-none border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`} placeholder="Téléphone" />
            <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl">
                <div className="flex items-center gap-3"><EyeOff size={16} className="text-slate-400"/><p className="text-xs font-black uppercase">Mode Privé</p></div>
                <button type="button" onClick={() => setPrivateMode(!privateMode)} className={`w-12 h-6 rounded-full relative ${privateMode ? 'bg-[#E64545]' : 'bg-slate-300'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full ${privateMode ? 'right-1' : 'left-1'}`}></div></button>
            </div>
            <button disabled={loading} className="w-full bg-[#E64545] text-white py-4 rounded-2xl font-black uppercase shadow-xl hover:brightness-110">Sauvegarder</button>
        </form>

        <div className="space-y-6 pt-8"> 
          <a href="mailto:babykeeper.bordais@gmail.com" className="w-full p-5 border-2 border-[#E0720F]/20 text-[#E0720F] rounded-2xl font-black text-xs uppercase flex justify-center gap-2 hover:bg-[#E0720F]/5">Support Technique</a>
          
          <button onClick={() => signOut(auth)} className="w-full p-5 border-2 border-dashed border-red-200 rounded-2xl font-black text-xs uppercase flex justify-center gap-2 text-red-400 hover:bg-red-50">Déconnexion</button>
          <button onClick={handleDeleteAccount} className="w-full p-5 bg-red-50 text-red-500 rounded-2xl font-black text-xs uppercase flex justify-center gap-2">Supprimer le compte</button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 5. COMPOSANT PREMIUM (3€)
// ==========================================

const PremiumView = ({ onBack, isDark }) => {
  const STRIPE_LINK = "https://buy.stripe.com/test_8x2dRa29w7tj03KdAUbEA00"; 

  return (
    <div className={`min-h-screen font-sans pb-32 flex flex-col ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-800'}`}>
      <div className={`p-6 border-b flex items-center gap-4 sticky top-0 z-50 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <button onClick={onBack}><ArrowLeft size={20}/></button>
        <h2 className="font-black text-xl italic uppercase text-[#E0720F]">Offre Premium</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
         <div className="text-center space-y-4">
             <div className="inline-block p-6 bg-yellow-100 rounded-full mb-4 shadow-xl">
                 <Crown size={48} className="text-[#E0720F]" />
             </div>
             <h2 className="text-4xl font-black italic uppercase tracking-tighter">Limite Atteinte 🔒</h2>
             <p className="text-sm font-bold opacity-60 uppercase tracking-widest max-w-xs mx-auto">Vous avez déjà effectué une réservation cette semaine.</p>
         </div>

         <div className={`w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
             <div className="bg-[#E0720F] p-8 text-center text-white">
                 <span className="text-sm font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">Passez en illimité</span>
                 <div className="mt-4 flex justify-center items-end gap-1">
                     <span className="text-6xl font-black italic">3€</span>
                     <span className="text-xl font-bold opacity-80 mb-2">/mois</span>
                 </div>
             </div>
             <div className="p-8 space-y-6">
                 <ul className="space-y-4">
                     <li className="flex items-center gap-3"><CheckCircle2 className="text-green-500" size={24}/><span className="font-bold text-sm">Réservations ILLIMITÉES</span></li>
                     <li className="flex items-center gap-3"><CheckCircle2 className="text-green-500" size={24}/><span className="font-bold text-sm">Accès aux numéros directs</span></li>
                     <li className="flex items-center gap-3"><CheckCircle2 className="text-green-500" size={24}/><span className="font-bold text-sm">Badge "Parent Vérifié" ✅</span></li>
                     <li className="flex items-center gap-3"><CheckCircle2 className="text-green-500" size={24}/><span className="font-bold text-sm">Support Prioritaire 24/7</span></li>
                 </ul>
                 <a 
                    href={STRIPE_LINK}
                    target="_blank"
                    className="block w-full py-5 bg-[#E64545] text-white text-center rounded-2xl font-black uppercase shadow-xl hover:scale-105 transition-transform"
                 >
                     Je m'abonne (3€)
                 </a>
             </div>
         </div>
      </div>
    </div>
  );
};

// ==========================================
// 6. MESSAGERIE & CHAT
// ==========================================

const ChatRoom = ({ offer, currentUser, onBack, isDark }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [otherUserPhone, setOtherUserPhone] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [translations, setTranslations] = useState({});
  const [liveOffer, setLiveOffer] = useState(offer);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'offers', offer.id, 'messages');
    const unsubMsg = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      setMessages(msgs);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    const unsubOffer = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'offers', offer.id), (docSnap) => {
        if (docSnap.exists()) {
            setLiveOffer({ id: docSnap.id, ...docSnap.data() });
        }
    });
    
    const getContact = async () => {
        const otherId = currentUser.uid === offer.sitterId ? offer.parentId : offer.sitterId;
        try {
            const publicDoc = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sitters', otherId));
            if (publicDoc.exists() && publicDoc.data().phone) { setOtherUserPhone(publicDoc.data().phone); return; }
        } catch(e) {}
        try {
             const d = await getDoc(doc(db, 'artifacts', appId, 'users', otherId, 'settings', 'profile'));
             if (d.exists()) setOtherUserPhone(d.data().phone);
        } catch(e) {}
    };
    getContact();

    return () => { 
        unsubMsg(); 
        unsubOffer(); 
    };
  }, [offer.id]);

  const sendEmailNotification = async (msgText) => {
      if (!window.emailjs) return; 
      
      const otherId = currentUser.uid === offer.sitterId ? offer.parentId : offer.sitterId;
      try {
          const userDoc = await getDoc(doc(db, 'artifacts', appId, 'users', otherId, 'settings', 'profile'));
          if (userDoc.exists()) {
              const targetEmail = userDoc.data().email;
              const targetName = userDoc.data().name;
              
              await window.emailjs.send(
                  "service_hjonpe3", // TON SERVICE ID
                  "template_b2gl0lh", // TON TEMPLATE ID
                  {
                      to_email: targetEmail,
                      to_name: targetName,
                      from_name: currentUser.displayName || "Un utilisateur",
                      message: msgText
                  }
              );
          }
      } catch (error) { console.error(error); }
  };

  const handleReport = async () => {
    const reason = window.prompt("Quel est le problème ?");
    if (reason) {
      try {
        await addDoc(collection(db, 'reports'), {
          reporterId: currentUser.uid,
          reportedUserId: currentUser.uid === offer.sitterId ? offer.parentId : offer.sitterId,
          offerId: offer.id,
          reason: reason,
          createdAt: Timestamp.now()
        });
        alert("Signalement enregistré.");
      } catch (e) { console.error(e); }
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const txt = newMessage.trim();
    if (!txt) return;
    setNewMessage("");

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'offers', offer.id, 'messages'), {
        text: txt, senderId: currentUser.uid, parentId: offer.parentId, sitterId: offer.sitterId, createdAt: Timestamp.now()
      });
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'offers', offer.id), {
          lastMsg: txt, lastMsgAt: Timestamp.now(), hasUnread: true, lastSenderId: currentUser.uid
      });
      sendEmailNotification(txt);
    } catch (e) { console.error(e); }
  };

  const translateMsg = (id, text) => {
    setTranslations(prev => ({ ...prev, [id]: "Traduction (FR) : " + text }));
  };

  const updateOfferStatus = async (status) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'offers', offer.id), { status });
      let text = "";
      if (status === 'accepted') text = "🤝 Offre acceptée ! Vous pouvez échanger vos coordonnées. Rappel : Le paiement se fait en direct.";
      else if (status === 'declined') text = "L'offre a été refusée.";
      
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'offers', offer.id, 'messages'), { text, senderId: 'system', parentId: offer.parentId, sitterId: offer.sitterId, createdAt: Timestamp.now() });

      if(status === 'accepted') sendEmailNotification("Votre offre a été acceptée !");
    } catch (e) { console.error(e); }
  };

  const confirmService = async () => {
    if(window.confirm("La garde est terminée ? En validant, vous pourrez noter le Baby-sitter.")) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'offers', offer.id), { 
            status: 'completed', 
        });
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'offers', offer.id, 'messages'), { 
            text: "✅ Garde terminée ! Merci d'avoir utilisé BabyKeeper.", 
            senderId: 'system', parentId: offer.parentId, sitterId: offer.sitterId, createdAt: Timestamp.now() 
        });
        setShowReview(true);
    }
  };

  const submitReview = async () => {
      try {
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'sitters', offer.sitterId, 'reviews'), {
              parentId: currentUser.uid, parentName: currentUser.displayName || "Parent", rating: reviewRating, text: reviewText, createdAt: Timestamp.now()
          });
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'offers', offer.id), { status: 'reviewed' });
          alert("Votre avis a été publié ! ✨");
          setShowReview(false);
      } catch (e) { console.error(e); alert("Erreur lors de l'envoi."); }
  };

  return (
    <div className={`flex flex-col h-screen font-sans animate-in fade-in duration-300 ${isDark ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'}`}>
      <div className={`p-6 border-b flex items-center justify-between sticky top-0 z-20 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2 rounded-full ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}><ArrowLeft size={20}/></button>
          <div className="text-left"><h3 className="font-black tracking-tight uppercase italic text-xs text-transparent bg-clip-text bg-gradient-to-r from-[#E64545] to-[#E0720F]">BABYKEEPER CHAT</h3><p className="text-[10px] text-[#E0720F] font-black uppercase tracking-widest">{liveOffer.price}€/H • {liveOffer.status}</p></div>
        </div>
        <div className="flex gap-2">
            <button onClick={handleReport} className="p-3 text-slate-300 hover:text-red-500 transition-colors"><Flag size={18}/></button>
            {liveOffer.status === 'completed' && currentUser.uid === liveOffer.parentId && <button onClick={() => setShowReview(true)} className="p-3 bg-[#E0720F]/20 text-[#E0720F] rounded-xl"><Star size={18}/></button>}
            {(liveOffer.status === 'accepted' || liveOffer.status === 'completed' || liveOffer.status === 'reviewed') && otherUserPhone && <a href={`tel:${otherUserPhone}`} className="p-3 bg-[#E64545] text-white rounded-xl"><Phone size={18}/></a>}
        </div>
      </div>

      {liveOffer.status === 'accepted' && (
          <div className="p-4 bg-blue-50 border-b border-blue-100 flex flex-col gap-2 items-center text-center">
              <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest">
                  <Info size={16} /> Paiement en direct
              </div>
              <p className="text-xs font-bold text-blue-900/70 max-w-xs">
                  BabyKeeper ne prend aucune commission. Réglez votre sitter directement (Espèces, Lydia, Paylib ou CESU).
              </p>
              {currentUser.uid === liveOffer.parentId && (
                  <button onClick={confirmService} className="mt-2 w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-xs uppercase tracking-widest shadow-lg shadow-blue-200">
                        Confirmer la fin de la garde
                  </button>
              )}
          </div>
      )}

      <div className={`flex-1 overflow-y-auto p-6 space-y-4 ${isDark ? 'bg-slate-950' : 'bg-slate-50/30'}`}>
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.senderId === 'system' ? 'justify-center' : m.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-[2rem] text-sm ${
                m.senderId === 'system' ? 'bg-slate-100 text-slate-500 text-xs text-center border border-slate-200' : 
                m.senderId === currentUser.uid ? 'bg-[#E64545] text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'
            }`}> 
                {m.text} 
                {translations[m.id] && <p className="text-[10px] mt-2 opacity-70 italic border-t border-white/20 pt-1">{translations[m.id]}</p>}
                {m.senderId !== 'system' && m.senderId !== currentUser.uid && <button onClick={() => translateMsg(m.id, m.text)} className="ml-2 opacity-50 hover:opacity-100"><Languages size={12}/></button>}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {showReview && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-slate-900">
              <div className="bg-white w-full max-w-md rounded-[3.5rem] p-10 space-y-8 animate-in zoom-in duration-300">
                  <div className="text-center"><h3 className="text-2xl font-black italic uppercase tracking-tighter">Note la prestation</h3></div>
                  <div className="flex justify-center"><RatingStars rating={reviewRating} size={40} interactive={true} onRate={setReviewRating} /></div>
                  <textarea placeholder="Partage ton avis..." className="w-full p-6 bg-slate-50 rounded-3xl h-32 font-bold outline-none shadow-inner text-slate-800" value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
                  <div className="flex gap-3 pt-4">
                      <button onClick={() => setShowReview(false)} className="flex-1 py-4 font-black text-[10px] uppercase text-slate-400">Annuler</button>
                      <button onClick={submitReview} className="flex-[2] bg-[#E64545] text-white py-4 rounded-2xl font-black text-[10px] uppercase">Publier</button>
                  </div>
              </div>
          </div>
      )}

      {liveOffer.status === 'pending' && currentUser.uid === liveOffer.sitterId && (
        <div className="p-4 bg-white border-t border-slate-50 grid grid-cols-2 gap-4 dark:bg-slate-900 dark:border-slate-800">
          <button onClick={() => updateOfferStatus('declined')} className="bg-slate-100 text-slate-400 py-4 rounded-2xl font-black text-[10px] uppercase dark:bg-slate-800">Refuser</button>
          <button onClick={() => updateOfferStatus('accepted')} className="bg-[#E64545] text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg">Accepter</button>
        </div>
      )}

      <form onSubmit={sendMessage} className={`p-4 border-t flex gap-4 pb-12 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <input type="text" placeholder="Répondre..." className={`flex-1 p-4 rounded-2xl outline-none font-bold shadow-inner ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-700'}`} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
        <button type="submit" className="bg-[#E0720F] text-white p-4 rounded-2xl shadow-lg active:scale-95 transition-all"><Send size={20}/></button>
      </form>
    </div>
  );
};

// ==========================================
// 7. AUTH SCREEN
// ==========================================

const AuthScreen = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("parent");
  const [serviceType, setServiceType] = useState("baby");
  const [level, setLevel] = useState("1");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('sitfinder_email');
    const savedPass = localStorage.getItem('sitfinder_pass');
    if (savedEmail && savedPass) {
        setEmail(savedEmail);
        setPassword(savedPass);
        setRemember(true);
    }
  }, []);

  const handleResetPassword = async () => {
    if (!email) return alert("Veuillez entrer votre email d'abord pour recevoir le lien.");
    try {
      await sendPasswordResetEmail(auth, email);
      alert("📧 Email de réinitialisation envoyé ! Vérifiez vos spams.");
    } catch (e) {
      alert("Erreur : Email introuvable ou invalide.");
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault(); 
    setLoading(true);

    if (remember) {
        localStorage.setItem('sitfinder_email', email);
        localStorage.setItem('sitfinder_pass', password);
    } else {
        localStorage.removeItem('sitfinder_email');
        localStorage.removeItem('sitfinder_pass');
    }

    try {
      if (isRegister) {
        if (password.length < 6) throw new Error("Mot de passe trop court.");
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'artifacts', appId, 'users', cred.user.uid, 'settings', 'profile'), {
          uid: cred.user.uid, name: name.trim() || "User", role, serviceType, email, level: role === 'sitter' ? level : null, favorites: [], createdAt: new Date().toISOString()
        });
      } else { await signInWithEmailAndPassword(auth, email, password); }
    } catch (err) { 
        if(err.code === 'auth/email-already-in-use') {
            alert("Compte existant ! Connectez-vous, puis changez de mode (Enfant/Animal) dans l'appli.");
            setIsRegister(false);
        } else {
            alert("Email ou mot de passe invalide."); 
        }
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative font-sans text-slate-900">
      <div className="absolute inset-0 bg-gradient-to-br from-[#E64545]/20 to-[#E0720F]/20 -z-10"></div>
      <div className="w-full max-w-lg bg-white p-10 md:p-12 rounded-[4rem] shadow-2xl border border-white z-10 shadow-slate-100">
        <div className="flex flex-col items-center mb-10 text-center">
          <SitFinderLogo className="mb-6 h-24 w-24" />
          <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-r from-[#E64545] to-[#E0720F]">BABYKEEPER</h2>
          <p className="text-[#E64545] text-sm font-bold uppercase tracking-widest mt-2">La recherche en toute confiance</p>
        </div>
        
        {isRegister && (
            <div className="flex gap-4 mb-6">
                <button type="button" onClick={() => setServiceType("baby")} className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase flex flex-col items-center gap-2 border-2 transition-all ${serviceType === "baby" ? "border-[#E64545] bg-[#E64545]/5 text-[#E64545]" : "border-slate-100 text-slate-400"}`}>
                    <Baby size={24} /> Enfants
                </button>
                <button type="button" onClick={() => setServiceType("pet")} className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase flex flex-col items-center gap-2 border-2 transition-all ${serviceType === "pet" ? "border-[#E0720F] bg-[#E0720F]/5 text-[#E0720F]" : "border-slate-100 text-slate-400"}`}>
                    <Dog size={24} /> Animaux
                </button>
            </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isRegister && <input required placeholder="Ton Prénom" className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold shadow-inner" value={name} onChange={(e) => setName(e.target.value)} />}
          <input required type="email" placeholder="Email" className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold shadow-inner" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input required type="password" placeholder="Mot de passe" className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold shadow-inner" value={password} onChange={(e) => setPassword(e.target.value)} />
           
          {!isRegister && (
             <div className="flex flex-wrap justify-between items-center pl-2 gap-2">
                 <div className="flex items-center gap-2">
                     <input type="checkbox" id="rem" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-5 h-5 accent-[#E64545] rounded-lg"/>
                     <label htmlFor="rem" className="text-xs font-bold text-slate-500 uppercase tracking-wide cursor-pointer">Se souvenir</label>
                 </div>
                 <button type="button" onClick={handleResetPassword} className="text-[10px] font-black uppercase text-[#E0720F] hover:underline whitespace-nowrap">Mot de passe oublié ?</button>
             </div>
          )}

          {isRegister && (
            <>
            <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-2xl mt-4">
              <button type="button" onClick={() => setRole("parent")} className={`py-3 rounded-xl font-black text-[10px] ${role === "parent" ? "bg-white shadow text-[#E64545]" : "text-slate-400"}`}>{serviceType === 'baby' ? 'PARENT' : 'MAÎTRE'}</button>
              <button type="button" onClick={() => setRole("sitter")} className={`py-3 rounded-xl font-black text-[10px] ${role === "sitter" ? "bg-white shadow text-[#E0720F]" : "text-slate-400"}`}>SITTER</button>
            </div>
            
            {role === "sitter" && serviceType === "baby" && (
              <div className="grid grid-cols-3 gap-1 mt-2">
                <button type="button" onClick={() => setLevel("1")} className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all ${level === "1" ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"}`}>NIV 1 🍼<br/><span className="text-[8px] opacity-70 font-normal">Garde+Repas</span></button>
                <button type="button" onClick={() => setLevel("2")} className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all ${level === "2" ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"}`}>NIV 2 🧸<br/><span className="text-[8px] opacity-70 font-normal">+ Change</span></button>
                <button type="button" onClick={() => setLevel("3")} className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all ${level === "3" ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"}`}>NIV 3 👑<br/><span className="text-[8px] opacity-70 font-normal">+ Bain/Soins</span></button>
              </div>
            )}

            {role === "sitter" && serviceType === "pet" && (
              <div className="grid grid-cols-3 gap-1 mt-2">
                <button type="button" onClick={() => setLevel("1")} className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all ${level === "1" ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"}`}>NIV 1 🐕<br/><span className="text-[8px] opacity-70 font-normal">Promenade</span></button>
                <button type="button" onClick={() => setLevel("2")} className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all ${level === "2" ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"}`}>NIV 2 🥘<br/><span className="text-[8px] opacity-70 font-normal">Visite/Repas</span></button>
                <button type="button" onClick={() => setLevel("3")} className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all ${level === "3" ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"}`}>NIV 3 🏠<br/><span className="text-[8px] opacity-70 font-normal">Hébergement</span></button>
              </div>
            )}
            </>
          )}
          <button disabled={loading} className="w-full bg-[#E64545] text-white py-6 rounded-[2rem] font-black text-sm shadow-xl mt-8 flex justify-center items-center gap-3 active:scale-95 transition-all uppercase tracking-widest hover:brightness-110">
            {loading ? <Loader2 className="animate-spin text-white" /> : (isRegister ? "CRÉER MON COMPTE" : "ME CONNECTER")}
          </button>
        </form>
        <div className="mt-10 pt-8 border-t border-slate-50 text-center">
          <button type="button" className="text-[#E0720F] font-black text-xs uppercase tracking-widest underline underline-offset-8" onClick={() => { setIsRegister(!isRegister); }}>
            {isRegister ? "Se connecter" : "Nouveau ? Créer un profil"}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- ECRAN COMPLÉTION PROFIL AVEC PHOTO OBLIGATOIRE ---
const CompleteProfileScreen = ({ uid, serviceType }) => {
  const [name, setName] = useState("");
  const [role, setRole] = useState("parent");
  const [level, setLevel] = useState("1");
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePhotoSelect = async (e) => {
      const file = e.target.files[0];
      if (file) {
          try {
             const compressedBase64 = await compressImage(file);
             setPhoto(compressedBase64);
          } catch (error) {
             alert("Impossible d'utiliser cette image.");
          }
      }
  };

  const finish = async () => {
    if (!name.trim()) return alert("Merci d'entrer votre prénom");
    if (!photo) return alert("Une photo de profil est obligatoire pour la confiance.");
    
    setLoading(true);
    try {
        await setDoc(doc(db, 'artifacts', appId, 'users', uid, 'settings', 'profile'), {
            uid, name: name.trim(), role, serviceType, level: role === 'sitter' ? level : null, photoURL: photo, favorites: [], createdAt: new Date().toISOString()
        });
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800 font-sans">
      <div className="bg-white p-12 rounded-[4rem] shadow-2xl max-w-md w-full text-center space-y-8 border border-slate-50 shadow-slate-100">
        <SitFinderLogo className="mx-auto" /><h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Profil & Photo</h2>
        
        {/* ZONE PHOTO OBLIGATOIRE */}
        <div className="flex justify-center">
            <label className="cursor-pointer group relative">
                <div className={`w-32 h-32 rounded-[2rem] border-4 ${photo ? 'border-[#E64545]' : 'border-slate-200 border-dashed'} overflow-hidden flex items-center justify-center bg-slate-50 shadow-inner group-hover:bg-slate-100 transition-colors`}>
                    {photo ? <img src={photo} className="w-full h-full object-cover" /> : <div className="text-center text-slate-400"><Camera size={32} className="mx-auto mb-1"/><span className="text-[10px] font-black uppercase">Ajouter Photo</span></div>}
                </div>
                <input type="file" hidden onChange={handlePhotoSelect} accept="image/*" />
                {!photo && <div className="absolute -bottom-6 left-0 w-full text-[10px] text-red-500 font-black uppercase animate-pulse">Obligatoire</div>}
            </label>
        </div>

        <input placeholder="Ton Prénom" className="w-full p-6 bg-slate-50 rounded-3xl outline-none font-bold shadow-inner" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl shadow-sm">
          <button onClick={() => setRole("parent")} className={`py-4 rounded-xl font-black text-[10px] ${role === "parent" ? "bg-white shadow text-[#E64545]" : "text-slate-400"}`}>{serviceType === 'baby' ? 'PARENT' : 'MAÎTRE'}</button>
          <button onClick={() => setRole("sitter")} className={`py-4 rounded-xl font-black text-[10px] ${role === "sitter" ? "bg-white shadow text-[#E0720F]" : "text-slate-400"}`}>SITTER</button>
        </div>
        {role === "sitter" && serviceType === 'baby' && (
              <div className="grid grid-cols-3 gap-1 mt-2">
                <button type="button" onClick={() => setLevel("1")} className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all ${level === "1" ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"}`}>NIV 1 🍼</button>
                <button type="button" onClick={() => setLevel("2")} className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all ${level === "2" ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"}`}>NIV 2 🧸</button>
                <button type="button" onClick={() => setLevel("3")} className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all ${level === "3" ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"}`}>NIV 3 👑</button>
              </div>
        )}
         {role === "sitter" && serviceType === 'pet' && (
              <div className="grid grid-cols-3 gap-1 mt-2">
                <button type="button" onClick={() => setLevel("1")} className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all ${level === "1" ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"}`}>NIV 1 🐕</button>
                <button type="button" onClick={() => setLevel("2")} className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all ${level === "2" ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"}`}>NIV 2 🥘</button>
                <button type="button" onClick={() => setLevel("3")} className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all ${level === "3" ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"}`}>NIV 3 🏠</button>
              </div>
        )}
        <button onClick={finish} disabled={loading || !photo} className={`w-full py-6 rounded-[2rem] font-black shadow-lg uppercase transition-all active:scale-95 ${!photo ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-[#E64545] text-white hover:brightness-110'}`}>VALIDER</button>
      </div>
    </div>
  );
};

// ==========================================
// 8. DASHBOARD PARENT (FIX NAVIGATION & EMPTY STATE)
// ==========================================

const ParentDashboard = ({ profile, user }) => {
  const [sitters, setSitters] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [maxPrice, setMaxPrice] = useState(100);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [dayFilter, setDayFilter] = useState(""); 
  
  const [activeTab, setActiveTab] = useState("search");
  const [selectedSitter, setSelectedSitter] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sitterReviews, setSitterReviews] = useState([]);
  const [isDark, setIsDark] = useState(localStorage.getItem('dark') === 'true');
  const [showFAQ, setShowFAQ] = useState(false);

  const isPet = profile.serviceType === 'pet';
  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
        updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile'), { isPremium: true })
        .then(() => {
            alert("Félicitations ! Votre abonnement Premium est activé 🌟");
            window.history.replaceState({}, document.title, window.location.pathname);
        });
    }
  }, [user.uid]); 

  // FONCTION POUR BASCULER ENTRE ENFANT ET ANIMAL
  const toggleServiceType = async () => {
      const newType = isPet ? 'baby' : 'pet';
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile'), { serviceType: newType });
  };

  useEffect(() => {
    localStorage.setItem('dark', isDark);
    const unsubSitters = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'sitters'), (snap) => {
      setSitters(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => s.serviceType === profile.serviceType));
      setLoading(false);
    });
    const qOffers = query(collection(db, 'artifacts', appId, 'public', 'data', 'offers'), where("parentId", "==", user.uid));
    const unsubOffers = onSnapshot(qOffers, (snap) => { 
        // FILTRE ICI : ON NE MONTRE PAS LES OFFRES QU'ON S'EST ENVOYÉ A SOI-MÊME DANS LA LISTE DE DISCUSSION
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(o => o.sitterId !== o.parentId);
        setOffers(list); 
    });
    return () => { unsubSitters(); unsubOffers(); };
  }, [user.uid, isDark, profile.serviceType]); 

  useEffect(() => {
      if (selectedSitter) {
          updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sitters', selectedSitter.id), { views: (selectedSitter.views || 0) + 1 });
          onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'sitters', selectedSitter.id, 'reviews'), (snap) => {
              setSitterReviews(snap.docs.map(d => d.data()));
          });
      }
  }, [selectedSitter]);

  const unreadCount = offers.filter(o => o.hasUnread && o.lastSenderId !== user.uid).length;

  const toggleFavorite = async (sitterId) => {
      const isFav = profile.favorites?.includes(sitterId);
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile'), {
          favorites: isFav ? arrayRemove(sitterId) : arrayUnion(sitterId)
      });
  };

  const filteredSitters = useMemo(() => {
    // 1. D'abord on filtre
    const filtered = sitters.filter(s => {
      const matchName = s.name?.toLowerCase().includes(search.toLowerCase());
      const matchLocation = !locationFilter || s.city?.toLowerCase().includes(locationFilter.toLowerCase());
      const matchPrice = (parseInt(s.price) || 0) <= maxPrice;
      const matchVerified = !onlyVerified || s.hasCV;
      const matchFav = !onlyFavorites || profile.favorites?.includes(s.id);
      const matchDay = !dayFilter || (s.availability && s.availability[dayFilter]?.active);

      return matchName && matchLocation && matchPrice && matchVerified && matchFav && matchDay;
    });

    // 2. Ensuite on trie (DISPO IMMEDIATE EN PREMIER)
    return filtered.sort((a, b) => {
        const isInstantA = a.instantAvailableUntil && new Date(a.instantAvailableUntil) > new Date();
        const isInstantB = b.instantAvailableUntil && new Date(b.instantAvailableUntil) > new Date();
        
        if (isInstantA && !isInstantB) return -1; // A en premier
        if (!isInstantA && isInstantB) return 1;  // B en premier
        
        // Si égalité, on trie par vues (popularité)
        return (b.views || 0) - (a.views || 0);
    });

  }, [sitters, search, locationFilter, maxPrice, onlyVerified, onlyFavorites, profile.favorites, dayFilter]);

  const handleBooking = async (s, p, h) => {
    // EMPECHER L'AUTO-RESERVATION
    if (s.id === user.uid) return alert("Vous ne pouvez pas réserver votre propre service !");

    try {
      const isPremium = profile?.isPremium === true;
      if (!isPremium) {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7); 
          const recentOffers = offers.filter(o => { const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt); return d > oneWeekAgo; });
          if (recentOffers.length >= 1) {
              alert("🔒 Limite atteinte ! Passez Premium.");
              setSelectedSitter(null); 
              setActiveTab("premium"); 
              return; 
          }
      }
      const offerText = `Offre : ${h}h à ${p}€/h`;
      const newOffer = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'offers'), {
        parentId: user.uid, parentName: profile.name, sitterId: s.id, sitterName: s.name, price: p, hours: h, status: 'pending', createdAt: Timestamp.now(), lastMsg: offerText, lastMsgAt: Timestamp.now(), hasUnread: true, lastSenderId: user.uid
      });
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'offers', newOffer.id, 'messages'), { text: `Bonjour ${s.name}, je souhaiterais réserver une garde de ${h}H au prix de ${p}€/H.`, senderId: user.uid, parentId: user.uid, sitterId: s.id, createdAt: Timestamp.now() });
      setSelectedSitter(null); setActiveTab("messages");
    } catch (e) { console.error(e); }
  };

  const markAsRead = async (offer) => {
    if (offer.hasUnread && offer.lastSenderId !== user.uid) { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'offers', offer.id), { hasUnread: false }); }
    setActiveChat(offer);
  };

  if (activeChat) return <ChatRoom offer={activeChat} currentUser={user} onBack={() => setActiveChat(null)} isDark={isDark} />;
  if (activeTab === "profile") return <SettingsView user={user} profile={profile} onBack={() => setActiveTab("search")} isDark={isDark} toggleDark={() => setIsDark(!isDark)} />;
  if (activeTab === "premium") return <PremiumView onBack={() => setActiveTab("search")} isDark={isDark} />;

  const getSPhoto = (s) => (s.useCustomPhoto && s.photoURL) ? s.photoURL : `https://api.dicebear.com/7.x/${s.avatarStyle || 'avataaars'}/svg?seed=${s.name}`;

  return (
    <div className={`min-h-screen font-sans pb-32 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-800'}`}>
      <nav className={`p-4 flex justify-between items-center sticky top-0 z-40 border-b shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className="flex items-center gap-2"><SitFinderLogo className="w-8 h-8" glow={false} /><span className="font-black italic text-lg md:text-2xl uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#E64545] to-[#E0720F]">BABYKEEPER</span></div>
        <div className="flex items-center gap-1.5">
          <ModeSwitcher currentRole={profile.role} currentService={profile.serviceType || 'baby'} uid={user.uid} />
          <button onClick={() => setShowFAQ(true)} className={`p-2 rounded-2xl transition-all shadow-sm flex items-center justify-center ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-white border border-slate-100 text-slate-400'}`}>
              <HelpCircle size={20} />
          </button>
          <button onClick={() => setActiveTab("premium")} className={`p-2 rounded-2xl transition-all shadow-md bg-gradient-to-br from-yellow-400 to-orange-500 text-white animate-pulse`}><Crown size={20} fill="white" /></button>
          <div className="relative p-2 text-slate-400"><Bell size={20}/>{unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-[#E64545] text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">{unreadCount}</span>}</div>
        </div>
      </nav>

      <main className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* --- VUE RECHERCHE --- */}
        {activeTab === "search" && (
            <>
            <div className={`p-10 md:p-14 rounded-[3.5rem] shadow-2xl relative overflow-hidden group transition-all duration-700 ${isDark ? 'bg-gradient-to-br from-[#E64545] to-slate-900' : 'bg-gradient-to-br from-[#E64545] to-[#E0720F]'}`}>
              <div className="relative z-10 text-white">
                  <h2 className="text-4xl font-black italic tracking-tighter font-sans leading-tight animate-in slide-in-from-left duration-700">Bonjour {profile.name} ! 👋</h2>
                  <p className="opacity-90 font-bold uppercase tracking-widest text-[10px] mt-2">
                      {isPet ? "Trouvez le gardien idéal 🐾" : "Trouvez l'aide idéale aujourd'hui"}
                  </p>
              </div>
              {isPet ? <Dog size={400} className="absolute -right-20 -bottom-20 opacity-10 rotate-12 text-white" /> : <Baby size={400} className="absolute -right-20 -bottom-20 opacity-10 rotate-12 text-white" />}
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="relative flex-1 group">
                  <Search className={`absolute left-6 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-slate-600' : 'text-slate-300'}`} size={24} />
                  <input type="text" placeholder="Rechercher par prénom..." className={`w-full pl-16 pr-8 py-6 border-none rounded-[2.5rem] shadow-sm outline-none focus:ring-4 font-bold ${isDark ? 'bg-slate-900 text-white focus:ring-[#E64545]/20' : 'bg-white text-slate-900 focus:ring-[#E64545]/10'}`} value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <button onClick={() => setShowFilters(!showFilters)} className={`p-6 rounded-[2.5rem] shadow-sm transition-all flex items-center gap-3 ${showFilters ? 'bg-[#E0720F] text-white shadow-orange-200' : (isDark ? 'bg-slate-900 text-slate-400' : 'bg-white text-slate-400')}`}><SlidersHorizontal size={24}/></button>
              </div>
              {showFilters && (
                <div className={`p-10 rounded-[3.5rem] shadow-2xl border grid grid-cols-1 md:grid-cols-3 gap-12 animate-in slide-in-from-top-4 duration-300 relative z-30 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                   <div className="space-y-4 text-left"><label className="text-[11px] font-black text-slate-400 uppercase italic">Ville</label><input type="text" placeholder="Paris, Lyon..." className={`w-full p-5 rounded-2xl outline-none font-bold ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`} value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} /></div>
                   
                   {/* NOUVEAU : SELECTEUR DE JOUR */}
                   <div className="space-y-4 text-left">
                       <label className="text-[11px] font-black text-slate-400 uppercase italic">Disponibilité</label>
                       <select value={dayFilter} onChange={(e) => setDayFilter(e.target.value)} className={`w-full p-5 rounded-2xl outline-none font-bold appearance-none ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-800'}`}>
                           <option value="">Tous les jours</option>
                           {days.map(d => <option key={d} value={d}>{d}</option>)}
                       </select>
                   </div>

                   <div className="space-y-4 text-left"><div className="flex justify-between items-center text-slate-800"><label className="text-[10px] font-black text-slate-400 uppercase italic">Budget ({maxPrice}€)</label><span className="text-xl font-black text-[#E64545] font-sans">{maxPrice}€/H</span></div><input type="range" min="10" max="100" step="5" className="w-full accent-[#E64545]" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} /></div>
                   <div className="flex gap-3 pt-6"><button onClick={() => setOnlyVerified(!onlyVerified)} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${onlyVerified ? 'bg-[#E64545]/10 text-[#E64545]' : (isDark ? 'bg-slate-800' : 'bg-slate-50')}`}>Sitter Pro ✨</button><button onClick={() => setOnlyFavorites(!onlyFavorites)} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${onlyFavorites ? 'bg-red-50 text-red-600' : (isDark ? 'bg-slate-800' : 'bg-slate-50')}`}>❤️</button></div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {loading ? <div className="col-span-full py-20 flex justify-center animate-pulse"><Loader2 className="animate-spin text-[#E64545]" size={64} /></div> 
              : filteredSitters.map((s) => {
                  // Vérification Dispo Immédiate
                  const isInstant = s.instantAvailableUntil && new Date(s.instantAvailableUntil) > new Date();

                  return (
                    <div key={s.id} className={`p-10 rounded-[3.5rem] shadow-xl border hover:shadow-2xl transition-all flex flex-col min-h-[520px] group/card relative ${isDark ? 'bg-slate-900 border-slate-800 shadow-slate-950' : 'bg-white border-slate-50 shadow-slate-200'} ${isInstant ? 'ring-4 ring-green-400/50' : ''}`}>
                      
                      {/* --- BADGE DISPO IMMEDIATE --- */}
                      {isInstant && (
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white px-6 py-2 rounded-full font-black text-xs uppercase shadow-lg shadow-green-500/30 animate-bounce z-10 flex items-center gap-2">
                              <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                              DISPO MAINTENANT
                          </div>
                      )}

                      <button onClick={() => toggleFavorite(s.id)} className={`absolute top-8 right-8 p-3 rounded-2xl transition-all ${profile.favorites?.includes(s.id) ? 'bg-red-50 text-red-500' : (isDark ? 'bg-slate-800 text-slate-600' : 'bg-slate-50 text-slate-300')} shadow-md`}><Heart size={20} fill={profile.favorites?.includes(s.id) ? "currentColor" : "none"}/></button>
                      <div className="flex flex-col gap-2.5 mb-8">
                        {(s.hasCV) && <div className="flex items-center gap-2 bg-[#E64545] text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest w-fit"><ShieldCheck size={10}/> VÉRIFIÉ</div>}
                        {s.level && !isPet && <div className="flex items-center gap-2 bg-[#E0720F] text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest w-fit mt-1">NIV {s.level} 👑</div>}
                        {s.level && isPet && <div className="flex items-center gap-2 bg-[#E0720F] text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest w-fit mt-1">NIV {s.level} 🐾</div>}
                      </div>
                      <div className={`w-28 h-28 rounded-[2.5rem] mb-6 overflow-hidden border-4 shadow-xl ring-4 group-hover/card:scale-110 transition-transform duration-500 ${isDark ? 'bg-slate-800 border-slate-700 ring-slate-900' : 'bg-slate-50 border-white ring-slate-50/50'}`}>
                          {/* --- ICI : Utilisation de la photoURL qui est désormais synchro --- */}
                          <UserAvatar photoURL={s.photoURL} />
                      </div>
                      <h4 className={`font-black text-4xl font-sans mb-1 leading-none tracking-tighter text-left ${isDark ? 'text-white' : 'text-slate-800'}`}>{s.name}</h4>
                      <div className="flex items-center gap-3 text-slate-400 mb-6"><RatingStars rating={s.rating || 5} size={18}/><span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>{s.city}</span></div>
                      
                      {s.skills && (
                        <div className="flex flex-wrap gap-1 mb-4">
                            {(s.skills || []).map((skill, i) => (
                              <span key={i} className="text-[8px] font-bold uppercase bg-slate-100 text-slate-500 px-2 py-1 rounded-lg border">{skill}</span>
                            ))}
                        </div>
                      )}

                      <p className={`italic mb-8 leading-relaxed text-sm flex-1 line-clamp-3 text-left ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>"{s.bio || "..."}"</p>
                      <div className={`flex justify-between items-center pt-8 border-t mt-auto ${isDark ? 'border-slate-800' : 'border-slate-50'}`}>
                        <span className="text-3xl font-black text-[#E64545] font-sans">{s.price || 0}€<span className="text-[10px] text-slate-400 ml-1">/H</span></span>
                        <button onClick={() => setSelectedSitter(s)} className={`px-10 py-5 rounded-[2.5rem] font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all hover:bg-[#E64545] tracking-widest ${isDark ? 'bg-[#E64545] text-white' : 'bg-slate-900 text-white'}`}>VOIR PROFIL</button>
                      </div>
                    </div>
                  );
              })}
            </div>
            </>
        )}

        {/* --- VUE MESSAGES --- */}
        {activeTab === "messages" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h2 className={`text-4xl font-black italic uppercase font-sans tracking-tight leading-none text-left ${isDark ? 'text-white' : 'text-slate-800'}`}>Discussions</h2>
            <div className="grid gap-6">
              {offers.length === 0 ? 
                 <div className={`py-24 text-center rounded-[4rem] border-2 border-dashed italic text-xl shadow-inner flex flex-col items-center justify-center gap-4 ${isDark ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-white border-slate-100 text-slate-400'}`}>
                    <Inbox size={48} className="opacity-20"/>
                    <p>Aucune offre en cours...</p>
                 </div>
              : offers.sort((a,b) => (b.lastMsgAt?.seconds || 0) - (a.lastMsgAt?.seconds || 0)).map(o => (
                  <div key={o.id} onClick={() => markAsRead(o)} className={`p-10 rounded-[3.5rem] shadow-xl border flex items-center justify-between hover:border-[#E0720F]/30 cursor-pointer transition-all active:scale-[0.99] shadow-md ${isDark ? 'bg-slate-900 border-slate-800 text-white shadow-slate-950' : 'bg-white border-slate-100 text-slate-900 shadow-slate-100'} ${o.hasUnread && o.lastSenderId !== user.uid ? 'ring-2 ring-[#E64545]' : ''}`}>
                    <div className="flex items-center gap-6 text-left">
                        <div className={`w-20 h-20 rounded-3xl overflow-hidden shadow-sm border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-[#E0720F]/10 border-[#E0720F]/20'}`}>
                            {/* Récupération de l'image du Sitter */}
                            <UserAvatar photoURL={sitters.find(x => x.id === o.sitterId)?.photoURL} />
                        </div>
                        <div className="text-left"><h4 className="font-black text-2xl font-sans leading-tight">{o.sitterName}</h4>
                        <p className={`text-[11px] font-bold truncate max-w-[150px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{o.lastMsg}</p>
                         {/* BADGE PAIEMENT */}
                        {o.status === 'paid_held' && <span className="text-[9px] bg-yellow-100 text-yellow-600 px-2 rounded-full mt-1 inline-block font-bold">Payé (En attente)</span>}
                        {o.status === 'completed' && <span className="text-[9px] bg-green-100 text-green-600 px-2 rounded-full mt-1 inline-block font-bold">Terminé</span>}
                        </div>
                    </div>
                    {o.hasUnread && o.lastSenderId !== user.uid && <div className="w-3 h-3 bg-[#E64545] rounded-full animate-pulse shadow-[#E64545]/20"></div>}
                    <ChevronRight className="text-slate-200" size={24}/>
                  </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-md backdrop-blur-xl p-2.5 rounded-[3rem] shadow-2xl flex items-center justify-between z-50 border ${isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-slate-900/95 border-white/10'}`}>
        <button onClick={() => setActiveTab("search")} className={`flex-1 flex flex-col items-center py-4 rounded-[2.5rem] transition-all duration-300 ${activeTab === "search" ? (isDark ? "bg-[#E64545] text-white" : "bg-[#E64545] text-white") : "text-slate-400 hover:text-white"}`}><Search size={22}/><span className="text-[9px] font-black uppercase mt-1.5 tracking-widest">Trouver</span></button>
        <button onClick={() => setActiveTab("messages")} className={`flex-1 flex flex-col items-center py-4 rounded-[2.5rem] transition-all duration-300 relative ${activeTab === "messages" ? (isDark ? "bg-[#E64545] text-white" : "bg-[#E64545] text-white") : "text-slate-400 hover:text-white"}`}><MessageSquare size={22}/><span className="text-[9px] font-black uppercase mt-1.5 font-sans tracking-widest">Offres</span></button>
        <button onClick={() => setActiveTab("profile")} className={`flex-1 flex flex-col items-center py-4 rounded-[2.5rem] ${activeTab === "profile" ? (isDark ? "bg-[#E64545] text-white" : "bg-[#E64545] text-white") : "text-slate-400 hover:text-white"}`}>
            <Settings size={22}/>
            <span className="text-[9px] font-black uppercase mt-1.5 tracking-widest font-sans">Réglages</span>
        </button>
      </div>

      {/* --- BANDEAU INSTALLATION PWA --- */}
      <InstallPrompt />

      {/* --- FAQ MODAL --- */}
      {showFAQ && <FAQModal onClose={() => setShowFAQ(false)} />}
      
      {/* --- FENÊTRE MODALE DETAIL SITTER (CORRIGÉE HEADER MOBILE) --- */}
      {selectedSitter && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-6 text-slate-900">
          <div className="bg-white w-full max-w-xl rounded-[4rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-500 flex flex-col max-h-[85vh]">
            
            {/* --- HEADER FIXE AVEC BOUTONS SEPARÉS --- */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white z-50 shrink-0">
                <button 
                    onClick={() => {
                        if (navigator.share) {
                            navigator.share({
                                title: `Profil de ${selectedSitter.name} sur BabyKeeper`,
                                text: `Regarde ce profil de Sitter (${selectedSitter.price}€/h) : ${selectedSitter.bio}`,
                                url: window.location.href
                            });
                        } else {
                            alert("Lien copié dans le presse-papier !"); 
                            navigator.clipboard.writeText(`Regarde ce profil de ${selectedSitter.name} sur BabyKeeper !`);
                        }
                    }} 
                    className="p-4 rounded-full transition-all bg-blue-50 text-blue-600 hover:bg-blue-100 shadow-sm"
                >
                    <Share2 size={24}/>
                </button>
                
                {/* NOM AU CENTRE */}
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-800">{selectedSitter.name}</h3>

                <button onClick={() => setSelectedSitter(null)} className="p-4 rounded-full transition-all bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 shadow-sm">
                    <X size={24}/>
                </button>
            </div>

            {/* --- CONTENU DÉFILANT --- */}
            <div className="overflow-y-auto p-8 space-y-8 custom-scrollbar">
                
                <div className="flex flex-col items-center gap-2">
                     <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 shadow-2xl border-white shadow-slate-200">
                         <UserAvatar photoURL={selectedSitter.photoURL} />
                     </div>
                     <RatingStars rating={selectedSitter.rating || 5} size={24}/>
                </div>

                <div className="space-y-6 text-left">
                    <div className="p-8 rounded-[3.5rem] space-y-6 shadow-inner border bg-slate-50 border-slate-100/50 shadow-slate-100">
                        <div className="flex justify-between items-center"><span className="font-black text-slate-500 text-[11px] uppercase tracking-widest italic">Lieu</span><span className="font-black uppercase">{selectedSitter.city || "France"}</span></div>
                        <div className="flex justify-between items-center"><span className="font-black text-slate-500 text-[11px] uppercase tracking-widest italic">Visites</span><span className="font-black uppercase">{selectedSitter.views || 0} 👀</span></div>
                        {selectedSitter.level && !isPet && <div className="flex justify-between items-center"><span className="font-black text-slate-500 text-[11px] uppercase tracking-widest italic">Niveau</span><span className="font-black uppercase text-[#E0720F]">NIV {selectedSitter.level} 👑</span></div>}
                        {selectedSitter.level && isPet && <div className="flex justify-between items-center"><span className="font-black text-slate-500 text-[11px] uppercase tracking-widest italic">Niveau</span><span className="font-black uppercase text-[#E0720F]">NIV {selectedSitter.level} 🐾</span></div>}
                        
                        {/* LISTE COMPETENCES DANS PROFIL COMPLET */}
                        {selectedSitter.skills && (
                            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                                {(selectedSitter.skills || []).map((skill, i) => (
                                    <span key={i} className="text-[10px] font-bold uppercase bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl border flex items-center gap-1">✨ {skill}</span>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="space-y-2">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 ml-5 italic">Bio</h4>
                        <p className="p-6 bg-slate-50 rounded-3xl text-sm italic leading-relaxed text-slate-600 border border-slate-100">"{selectedSitter.bio}"</p>
                    </div>

                    {sitterReviews.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-5 italic">Avis de parents</h4>
                            {sitterReviews.map((r, idx) => (
                                <div key={idx} className="p-6 rounded-[2rem] shadow-sm space-y-3 border bg-white border-slate-100">
                                    <div className="flex justify-between items-center"><span className="font-black text-xs">{r.parentName}</span><RatingStars rating={r.rating} size={12} /></div>
                                    <p className="text-xs italic leading-relaxed text-slate-500">"{r.text}"</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4 text-left">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase italic ml-4 text-slate-400 font-sans">Prix (€/H)</label>
                          <input id="neg-p" type="number" defaultValue={selectedSitter.price} className="w-full p-6 rounded-[2.5rem] outline-none font-black text-2xl shadow-inner bg-slate-50 text-slate-800" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase italic ml-4 text-slate-400 font-sans">Temps (H)</label>
                          <input id="neg-h" type="number" defaultValue="2" className="w-full p-6 rounded-[2.5rem] outline-none font-black text-2xl shadow-inner bg-slate-50 text-slate-800" />
                      </div>
                  </div>

                   <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                     <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><Car size={16}/> {selectedSitter.hasCar ? "Véhiculé 🚗" : "Non véhiculé"}</div>
                  </div>

                  {/* BOUTON ENVOYER DEMANDE : DESACTIVÉ SI C'EST TON PROPRE PROFIL */}
                  {selectedSitter.id === user.uid ? (
                      <button disabled className="w-full py-8 rounded-[2.5rem] font-black text-sm shadow-inner uppercase tracking-[0.2em] bg-slate-200 text-slate-400 cursor-not-allowed">
                          C'EST VOTRE PROFIL (APERÇU)
                      </button>
                  ) : (
                      <button onClick={() => {
                          const p = document.getElementById('neg-p').value;
                          const h = document.getElementById('neg-h').value;
                          handleBooking(selectedSitter, p, h);
                      }} className="w-full py-8 rounded-[2.5rem] font-black text-sm shadow-xl shadow-[#E64545]/20 uppercase tracking-[0.2em] active:scale-95 transition-all bg-[#E64545] text-white hover:bg-[#E64545]/90">ENVOYER LA DEMANDE</button>
                  )}
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 9. DASHBOARD SITTER (DESIGN MODERNE + COMPLET + ANTI-CRASH)
// ==========================================

const SitterDashboard = ({ user, profile }) => {
  const [bio, setBio] = useState("");
  const [price, setPrice] = useState("");
  const [city, setCity] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [cvName, setCvName] = useState("");
  const [hasCar, setHasCar] = useState(false);
  const [skills, setSkills] = useState([]); // Initialisé à tableau vide pour éviter le crash
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [offers, setOffers] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [isDark, setIsDark] = useState(localStorage.getItem('dark') === 'true');
  const [saveStatus, setSaveStatus] = useState("");
  const [isInstant, setIsInstant] = useState(false);
  const [availability, setAvailability] = useState(DEFAULT_AVAILABILITY);

  const isPet = profile.serviceType === 'pet';
  const AVAILABLE_SKILLS = isPet 
    ? ["🚗 Véhiculé", "💊 Soins", "🏃 Sportif", "🏠 Jardin Clos", "✂️ Toilettage", "🎓 Éducation"]
    : ["🚗 Permis B", "⛑️ PSC1", "🇬🇧 Anglais", "📚 Devoirs", "🎨 Créatif", "🍳 Cuisine"];

  useEffect(() => {
    localStorage.setItem('dark', isDark);
    const unsubPublic = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'sitters', user.uid), (snap) => {
      if (snap.exists()) {
        const d = snap.data(); setBio(d.bio || ""); setPrice(d.price || ""); setCity(d.city || "");
        setBirthDate(d.birthDate || ""); setCvName(d.cvName || ""); setHasCar(d.hasCar || false);
        // SECURITE : Utilisation de || [] et || {} pour éviter les erreurs si données manquantes
        if (d.skills) setSkills(d.skills); else setSkills([]);
        if (d.availability) setAvailability(d.availability); else setAvailability(DEFAULT_AVAILABILITY);
        if(d.instantAvailableUntil && new Date(d.instantAvailableUntil) > new Date()) setIsInstant(true);
      }
    });
    const qOffers = query(collection(db, 'artifacts', appId, 'public', 'data', 'offers'), where("sitterId", "==", user.uid));
    const unsubOffers = onSnapshot(qOffers, (snap) => { setOffers(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });
    return () => { unsubPublic(); unsubOffers(); };
  }, [user.uid, isDark]);

  const toggleInstantAvailability = async () => {
     const newStatus = !isInstant;
     setIsInstant(newStatus);
     const until = newStatus ? new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() : null;
     await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sitters', user.uid), { instantAvailableUntil: until });
  };

  const toggleSkill = (skill) => {
     const currentSkills = skills || [];
     if (currentSkills.includes(skill)) setSkills(currentSkills.filter(s => s !== skill));
     else setSkills([...currentSkills, skill]);
  };

  const handleSave = async () => {
    if (!bio || !price || !city || !birthDate) return alert("Champs requis manquants (Bio, Prix, Ville, Naissance)");
    const age = calculateAge(birthDate);
    if (age < 16) return alert("Vous devez avoir au moins 16 ans.");

    setLoading(true);
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sitters', user.uid), {
        name: profile.name, photoURL: profile.photoURL || "", bio, price, city, birthDate, availability, cvName, hasCV: !!cvName, hasCar, skills, serviceType: profile.serviceType, uid: user.uid, updatedAt: new Date().toISOString()
    }, { merge: true });
    setSaveStatus("PUBLIÉ ! ✨"); setTimeout(() => setSaveStatus(""), 3000);
    setLoading(false);
  };

  const handleDeleteAd = async () => {
    if(window.confirm("⚠️ Supprimer votre annonce ? Vous n'apparaîtrez plus dans les résultats.")) {
        setLoading(true);
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sitters', user.uid));
        setBio(""); setPrice(""); setCity(""); setSaveStatus(""); 
        setLoading(false); alert("Annonce supprimée.");
    }
  };

  if (activeChat) return <ChatRoom offer={activeChat} currentUser={user} onBack={() => setActiveChat(null)} isDark={isDark} />;
  if (activeTab === "settings") return <SettingsView user={user} profile={profile} onBack={() => setActiveTab("profile")} isDark={isDark} toggleDark={() => setIsDark(!isDark)} />;

  return (
    <div className={`min-h-screen font-sans pb-32 animate-in fade-in duration-500 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-800'}`}>
      <nav className={`p-4 flex justify-between items-center sticky top-0 z-40 border-b shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className="flex items-center gap-2"><SitFinderLogo className="w-8 h-8" glow={false} /><span className="font-black italic text-lg uppercase">BABYKEEPER</span></div>
        <div className="flex items-center gap-1.5">
          <ModeSwitcher currentRole={profile.role} currentService={profile.serviceType || 'baby'} uid={user.uid} />
          <button onClick={() => setShowFAQ(true)} className={`p-2 rounded-2xl transition-all shadow-sm flex items-center justify-center ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-white border border-slate-100 text-slate-400'}`}>
              <HelpCircle size={20} />
          </button>
          <button onClick={() => setActiveTab("premium")} className={`p-2 rounded-2xl transition-all shadow-md bg-gradient-to-br from-yellow-400 to-orange-500 text-white animate-pulse`}><Crown size={20} fill="white" /></button>
          <div className="relative p-2 text-slate-400"><Bell size={20}/>{unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-[#E64545] text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">{unreadCount}</span>}</div>
        </div>
      </nav>

      <main className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
        {activeTab === "profile" && (
            <div className="space-y-6">
                
                {/* --- HEADER CARDS --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* CARD PROFIL */}
                    <div className={`p-6 rounded-3xl shadow-sm border flex items-center gap-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm"><UserAvatar photoURL={profile.photoURL} /></div>
                        <div>
                            <h2 className="text-xl font-black italic">{profile.name}</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#E64545]">{profile.serviceType === 'baby' ? 'Baby-Sitter' : 'Pet-Sitter'}</p>
                        </div>
                    </div>

                    {/* CARD DISPO IMMEDIATE */}
                    <button onClick={toggleInstantAvailability} className={`p-6 rounded-3xl shadow-sm border flex items-center justify-between gap-4 transition-all active:scale-[0.98] ${isInstant ? 'bg-green-500 text-white border-green-600' : (isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100')}`}>
                        <div className="text-left">
                            <h3 className="font-black uppercase text-sm">{isInstant ? "MODE URGENCE : ON" : "DISPO IMMÉDIATE"}</h3>
                            <p className="text-[10px] opacity-70">Boost de visibilité (2h)</p>
                        </div>
                        <Power size={24} className={isInstant ? "animate-pulse" : "opacity-30"}/>
                    </button>
                </div>

                {/* --- FORMULAIRE EDITION COMPLET --- */}
                <div className={`p-8 rounded-[2.5rem] shadow-xl border space-y-8 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-50'}`}>
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                        <Edit2 size={20} className="text-slate-400"/>
                        <h3 className="font-black text-sm uppercase tracking-widest text-slate-500">Éditer mon annonce</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 text-left">
                            <label className="text-[11px] font-black uppercase text-slate-400 ml-2">Tarif horaire (€)</label>
                            <input type="number" placeholder="ex: 15" className={`w-full p-4 rounded-xl font-black text-xl outline-none border transition-all focus:ring-2 focus:ring-[#E64545]/20 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} value={price} onChange={(e) => setPrice(e.target.value)} />
                        </div>
                        <div className="space-y-2 text-left">
                            <label className="text-[11px] font-black uppercase text-slate-400 ml-2">Ville</label>
                            <input type="text" placeholder="ex: Paris" className={`w-full p-4 rounded-xl font-bold text-lg outline-none border transition-all focus:ring-2 focus:ring-[#E64545]/20 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} value={city} onChange={(e) => setCity(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 text-left">
                            <label className="text-[11px] font-black uppercase text-slate-400 ml-2">Naissance</label>
                            <input type="date" className={`w-full p-4 rounded-xl font-bold text-sm outline-none border transition-all ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                        </div>
                        <div className="space-y-2 text-left">
                            <label className="text-[11px] font-black uppercase text-slate-400 ml-2">Véhicule</label>
                            <button onClick={() => setHasCar(!hasCar)} className={`w-full p-4 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 border transition-all ${hasCar ? "bg-[#E0720F] text-white border-[#E0720F]" : "bg-slate-50 text-slate-400 border-slate-200"}`}>
                                <Car size={16}/> {hasCar ? "Je suis véhiculé" : "Pas de véhicule"}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2 text-left">
                        <label className="text-[11px] font-black uppercase text-slate-400 ml-2">Mes Compétences</label>
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_SKILLS.map((skill, index) => (
                                <button 
                                    key={index}
                                    onClick={() => toggleSkill(skill)}
                                    className={`px-3 py-2 rounded-lg font-bold text-[10px] uppercase transition-all border ${(skills || []).includes(skill) ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
                                >
                                    {skill}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2 text-left">
                        <label className="text-[11px] font-black uppercase text-slate-400 ml-2">Ma Présentation</label>
                        <textarea placeholder="Présentez-vous aux parents..." className={`w-full p-5 rounded-2xl h-32 font-medium text-sm outline-none border resize-none transition-all focus:ring-2 focus:ring-[#E64545]/20 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} value={bio} onChange={(e) => setBio(e.target.value)} />
                    </div>

                    {/* --- DISPONIBILITES RESTAUREES --- */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <h3 className="font-black text-xs uppercase tracking-widest text-slate-400">Mes Disponibilités</h3>
                        <div className="grid gap-3">
                           {Object.entries(availability).map(([day, data]) => (
                               <div key={day} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${data.active ? 'bg-white border-blue-200 shadow-sm' : 'bg-slate-50 border-transparent opacity-60'}`}>
                                   <button onClick={() => setAvailability(p => ({...p, [day]: {...p[day], active: !p[day].active}}))} className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase w-24 ${data.active ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-400'}`}>{day}</button>
                                   {data.active && (
                                       <div className="flex items-center gap-2">
                                           <input type="time" className="bg-transparent text-xs font-bold" value={data.start} onChange={(e) => setAvailability(p => ({...p, [day]: {...p[day], start: e.target.value}}))} />
                                           <span className="text-slate-300">-</span>
                                           <input type="time" className="bg-transparent text-xs font-bold" value={data.end} onChange={(e) => setAvailability(p => ({...p, [day]: {...p[day], end: e.target.value}}))} />
                                       </div>
                                   )}
                               </div>
                           ))}
                       </div>
                    </div>

                    <div className="space-y-3 pt-6 border-t border-slate-100">
                        <label className="text-[11px] font-black uppercase text-slate-400 ml-2">Joindre un CV (Optionnel)</label>
                        <input type="file" id="cv-f" className="hidden" onChange={(e) => setCvName(e.target.files[0]?.name || "")} accept=".pdf,image/*" />
                        <label htmlFor="cv-f" className={`w-full flex items-center justify-between p-4 border rounded-xl cursor-pointer hover:bg-slate-50 transition-all ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                            <div className="flex items-center gap-3">
                                <FileUp size={18} className="text-slate-400"/>
                                <span className="text-xs font-bold text-slate-600">{cvName || "Choisir un fichier..."}</span>
                            </div>
                            {cvName && <CheckCircle2 className="text-emerald-500" size={18}/>}
                        </label>
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                        <button onClick={handleSave} disabled={loading} className="w-full py-5 bg-[#E64545] text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-red-100 active:scale-[0.98] transition-all hover:bg-red-600">
                            {loading ? "..." : (saveStatus || "METTRE À JOUR / PUBLIER")}
                        </button>
                        <button onClick={handleDeleteAd} className="w-full py-4 text-red-400 rounded-xl font-black text-[10px] uppercase hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                            <Trash2 size={14}/> Supprimer mon annonce
                        </button>
                    </div>
                </div>
            </div>
        )}
        
        {activeTab === "messages" && (
            <div className="space-y-4">
                <h2 className="text-3xl font-black italic uppercase">Demandes</h2>
                {offers.length === 0 ? <div className="py-20 text-center text-slate-400 italic">Aucune demande reçue</div> : 
                 offers.map(o => (
                    <div key={o.id} onClick={() => setActiveChat(o)} className={`p-6 rounded-3xl shadow-sm border flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-12 h-12 bg-[#E64545]/10 rounded-xl flex items-center justify-center text-[#E64545] font-black italic">BK</div>
                            <div><h4 className="font-black italic text-lg">{o.parentName}</h4><p className="text-[10px] text-slate-400 font-bold uppercase">{o.lastMsg}</p></div>
                        </div>
                        <ChevronRight className="text-slate-200" />
                    </div>
                ))}
            </div>
        )}
      </main>

      <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-md backdrop-blur-xl p-2.5 rounded-[3rem] shadow-2xl flex items-center justify-between z-50 border ${isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-slate-900/95 border-white/10'}`}>
        <button onClick={() => setActiveTab("profile")} className={`flex-1 flex flex-col items-center py-4 rounded-[2.5rem] ${activeTab === "profile" ? "bg-[#E64545] text-white" : "text-slate-400"}`}><User size={22}/><span className="text-[9px] font-black uppercase mt-1.5 tracking-widest font-sans">Profil</span></button><button onClick={() => setActiveTab("messages")} className={`flex-1 flex flex-col items-center py-4 rounded-[2.5rem] ${activeTab === "messages" ? "bg-[#E64545] text-white" : "text-slate-400"}`}><MessageSquare size={22}/><span className="text-[9px] font-black uppercase mt-1.5 font-sans tracking-widest">Offres</span></button>
        <button onClick={() => setActiveTab("settings")} className={`flex-1 flex flex-col items-center py-4 rounded-[2.5rem] ${activeTab === "settings" ? "bg-[#E64545] text-white" : "text-slate-400"}`}><Settings size={22}/><span className="text-[9px] font-black uppercase mt-1.5 tracking-widest font-sans">Réglages</span></button>
      </div>
    </div>
  );
};

// ==========================================
// 10. LOGIQUE RACINE
// ==========================================

export default function App() {
  const [init, setInit] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let unsubP = null;
    const minSplashTimer = new Promise(resolve => setTimeout(resolve, 800));
    const unsubA = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        unsubP = onSnapshot(doc(db, 'artifacts', appId, 'users', u.uid, 'settings', 'profile'), async (snap) => {
          if (snap.exists()) setProfile(snap.data()); else setProfile(null);
          await minSplashTimer;
          setInit(true);
        });
      } else {
        setProfile(null); if (unsubP) unsubP();
        await minSplashTimer; setInit(true);
      }
    });
    return () => { unsubA(); if (unsubP) unsubP(); };
  }, []);

  if (!init) return <SplashScreen />;
  if (!user) return <AuthScreen />;
  if (user && !profile) return <CompleteProfileScreen uid={user.uid} />;
  
  return profile.role === "parent" ? <ParentDashboard profile={profile} user={user} /> : <SitterDashboard user={user} profile={profile} />;
}
