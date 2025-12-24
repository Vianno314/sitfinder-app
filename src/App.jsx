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
  orderBy,
  where
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
// 3. COMPOSANT PARAMÈTRES
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
    if (window.confirm("⚠️ Action irréversible : Supprimer définitivement votre compte et vos données ?")) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile'));
        if (profile.role === 'sitter') {
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sitters', user.uid));
        }
        await deleteUser(auth.currentUser);
        alert("Compte supprimé avec succès.");
      } catch (err) {
        alert("Sécurité : merci de vous reconnecter avant de supprimer votre compte.");
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
          <a href="mailto:vianney.bordais@gmail.com" className="w-full p-6 border-2 border-blue-100 text-blue-500 rounded-[2.5rem] font-black text-[10px] uppercase flex items-center justify-center gap-3 hover:bg-blue-50 transition-all">
            <Mail size={18}/> Support Technique
          </a>
          <button onClick={() => signOut(auth)} className="w-full p-6 border-2 border-dashed border-red-100 text-red-500 rounded-[2.5rem] font-black text-[10px] uppercase flex items-center justify-center gap-3"><LogOut size={18}/> Déconnexion</button>
          <button onClick={handleDeleteAccount} className="w-full p-6 bg-red-50 text-red-600 rounded-[2.5rem] font-black text-[10px] uppercase flex items-center justify-center gap-3 border-2 border-dashed border-red-200 hover:bg-red-100 transition-all"><Trash2 size={18}/> Supprimer mon compte</button>
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
  const [otherUserPhone, setOtherUserPhone] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [translations, setTranslations] = useState({});
  const chatEndRef = useRef(null);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'offers', offer.id, 'messages');
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)));
      setTimeout(scrollToBottom, 100);
    });
    const getContact = async () => {
        const otherId = currentUser.uid === offer.sitterId ? offer.parentId : offer.sitterId;
        const d = await getDoc(doc(db, 'artifacts', appId, 'users', otherId, 'settings', 'profile'));
        if (d.exists()) setOtherUserPhone(d.data().phone);
    };
    getContact();
    return () => unsub();
  }, [offer.id]);

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
    if (!newMessage.trim()) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'offers', offer.id, 'messages'), {
        text: newMessage, 
        senderId: currentUser.uid, 
        parentId: offer.parentId, // ESSENTIEL
        sitterId: offer.sitterId, // ESSENTIEL
        createdAt: Timestamp.now()
      });
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'offers', offer.id), {
          lastMsg: newMessage, lastMsgAt: Timestamp.now(), hasUnread: true, lastSenderId: currentUser.uid
      });
      setNewMessage("");
    } catch (e) { console.error(e); }
  };

  const translateMsg = (id, text) => {
    setTranslations(prev => ({ ...prev, [id]: "Traduction (FR) : " + text }));
  };

  const updateOfferStatus = async (status) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'offers', offer.id), { status });
      const text = status === 'accepted' ? "✨ Offre acceptée ! Appelez-vous pour caler les détails." : "L'offre a été refusée.";
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'offers', offer.id, 'messages'), { 
        text, 
        senderId: 'system', 
        parentId: offer.parentId, // ESSENTIEL
        sitterId: offer.sitterId, // ESSENTIEL
        createdAt: Timestamp.now() 
      });
    } catch (e) { console.error(e); }
  };

  const submitReview = async () => {
      try {
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'sitters', offer.sitterId, 'reviews'), {
              parentId: currentUser.uid, parentName: currentUser.displayName || "Parent",
              rating: reviewRating, text: reviewText, createdAt: Timestamp.now()
          });
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'offers', offer.id), { status: 'reviewed' });
          setShowReview(false);
      } catch (e) { console.error(e); }
  };

  return (
    <div className={`flex flex-col h-screen font-sans animate-in fade-in duration-300 ${isDark ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'}`}>
      <div className={`p-6 border-b flex items-center justify-between sticky top-0 z-20 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2 rounded-full ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}><ArrowLeft size={20}/></button>
          <div className="text-left"><h3 className="font-black tracking-tight uppercase italic text-xs">SITFINDER CHAT</h3><p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">{offer.price}€/H • {offer.status}</p></div>
        </div>
        <div className="flex gap-2">
            <button onClick={handleReport} className="p-3 text-slate-300 hover:text-red-500 transition-colors"><Flag size={18}/></button>
            {offer.status === 'accepted' && currentUser.uid === offer.parentId && (
                <button onClick={() => setShowReview(true)} className="p-3 bg-amber-50 text-amber-600 rounded-xl animate-pulse"><Star size={18}/></button>
            )}
            {(offer.status === 'accepted' || offer.status === 'reviewed') && otherUserPhone && (
                <a href={`tel:${otherUserPhone}`} className="p-3 bg-blue-50 text-blue-600 rounded-xl shadow-lg"><Phone size={18}/></a>
            )}
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto p-6 space-y-4 ${isDark ? 'bg-slate-950' : 'bg-slate-50/30'}`}>
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.senderId === 'system' ? 'justify-center' : m.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-[2rem] text-sm shadow-sm relative group ${
              m.senderId === 'system' ? (isDark ? 'bg-slate-800 text-emerald-400 border-slate-700' : 'bg-emerald-50 text-emerald-700 border-emerald-100') + ' text-[10px] font-black uppercase border px-6 py-2 text-center' :
              m.senderId === currentUser.uid ? 'bg-blue-600 text-white rounded-br-none' : (isDark ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-slate-700 border-slate-100') + ' rounded-bl-none border'
            }`}> 
                {m.text} 
                {translations[m.id] && <p className="text-[10px] mt-2 opacity-70 italic border-t border-white/20 pt-1">{translations[m.id]}</p>}
                {m.senderId !== 'system' && m.senderId !== currentUser.uid && (
                    <button onClick={() => translateMsg(m.id, m.text)} className="absolute -right-8 top-1 text-slate-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"><Languages size={14}/></button>
                )}
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
                  <textarea placeholder="Partage ton avis..." className="w-full p-6 bg-slate-50 rounded-3xl h-32 font-bold outline-none shadow-inner" value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
                  <div className="flex gap-3 pt-4">
                      <button onClick={() => setShowReview(false)} className="flex-1 py-4 font-black text-[10px] uppercase text-slate-400">Annuler</button>
                      <button onClick={submitReview} className="flex-[2] bg-emerald-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase">Publier</button>
                  </div>
              </div>
          </div>
      )}

      {offer.status === 'pending' && currentUser.uid === offer.sitterId && (
        <div className="p-4 bg-white border-t border-slate-50 grid grid-cols-2 gap-4 dark:bg-slate-900 dark:border-slate-800">
          <button onClick={() => updateOfferStatus('declined')} className="bg-slate-100 text-slate-400 py-4 rounded-2xl font-black text-[10px] uppercase dark:bg-slate-800">Refuser</button>
          <button onClick={() => updateOfferStatus('accepted')} className="bg-emerald-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg">Accepter</button>
        </div>
      )}

      <form onSubmit={sendMessage} className={`p-4 border-t flex gap-4 pb-12 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <input type="text" placeholder="Répondre..." className={`flex-1 p-4 rounded-2xl outline-none font-bold shadow-inner ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-700'}`} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
        <button type="submit" className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg active:scale-95 transition-all"><Send size={20}/></button>
      </form>
    </div>
  );
};

// ==========================================
// 5. AUTH
// ==========================================

const AuthScreen = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("parent");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if (isRegister) {
        if (password.length < 6) throw new Error("Mot de passe trop court.");
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'artifacts', appId, 'users', cred.user.uid, 'settings', 'profile'), {
          uid: cred.user.uid, name: name.trim() || "User", role, email, avatarStyle: "avataaars", favorites: [], createdAt: new Date().toISOString()
        });
      } else { await signInWithEmailAndPassword(auth, email, password); }
    } catch (err) { alert("Email ou mot de passe invalide."); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative font-sans text-slate-900">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 to-blue-50/30 -z-10"></div>
      <div className="w-full max-w-lg bg-white p-10 md:p-12 rounded-[4rem] shadow-2xl border border-white z-10 shadow-slate-100">
        <div className="flex flex-col items-center mb-10 text-center">
          <SitFinderLogo className="mb-6 h-24 w-24" />
          <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none">SIT<span className="text-emerald-500 italic">FINDER</span></h2>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2">La recherche en toute confiance</p>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          {isRegister && <input required placeholder="Ton Prénom" className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold shadow-inner" value={name} onChange={(e) => setName(e.target.value)} />}
          <input required type="email" placeholder="Email" className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold shadow-inner" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input required type="password" placeholder="Mot de passe" className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold shadow-inner" value={password} onChange={(e) => setPassword(e.target.value)} />
          {isRegister && (
            <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-2xl mt-4">
              <button type="button" onClick={() => setRole("parent")} className={`py-3 rounded-xl font-black text-[10px] ${role === "parent" ? "bg-white shadow text-emerald-600" : "text-slate-400"}`}>PARENT</button>
              <button type="button" onClick={() => setRole("sitter")} className={`py-3 rounded-xl font-black text-[10px] ${role === "sitter" ? "bg-white shadow text-blue-600" : "text-slate-400"}`}>SITTER</button>
            </div>
          )}
          <button disabled={loading} className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-sm shadow-xl mt-8 flex justify-center items-center gap-3 active:scale-95 transition-all uppercase tracking-widest">
            {loading ? <Loader2 className="animate-spin text-white" /> : (isRegister ? "CRÉER MON COMPTE" : "ME CONNECTER")}
          </button>
        </form>
        <div className="mt-10 pt-8 border-t border-slate-50 text-center">
          <button type="button" className="text-blue-600 font-black text-xs uppercase tracking-widest underline underline-offset-8" onClick={() => { setIsRegister(!isRegister); }}>
            {isRegister ? "Se connecter" : "Nouveau ? Créer un profil"}
          </button>
        </div>
      </div>
    </div>
  );
};

const CompleteProfileScreen = ({ uid }) => {
  const [name, setName] = useState("");
  const [role, setRole] = useState("parent");
  const [loading, setLoading] = useState(false);
  const finish = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
        await setDoc(doc(db, 'artifacts', appId, 'users', uid, 'settings', 'profile'), {
            uid, name: name.trim(), role, avatarStyle: "avataaars", favorites: [], createdAt: new Date().toISOString()
        });
    } catch(e) { console.error(e); }
    setLoading(false);
  };
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800 font-sans">
      <div className="bg-white p-12 rounded-[4rem] shadow-2xl max-w-md w-full text-center space-y-8 border border-slate-50 shadow-slate-100">
        <SitFinderLogo className="mx-auto" /><h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Presque fini !</h2>
        <input placeholder="Ton Prénom" className="w-full p-6 bg-slate-50 rounded-3xl outline-none font-bold shadow-inner" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl shadow-sm">
          <button onClick={() => setRole("parent")} className={`py-4 rounded-xl font-black text-[10px] ${role === "parent" ? "bg-white shadow text-emerald-600" : "text-slate-400"}`}>PARENT</button>
          <button onClick={() => setRole("sitter")} className={`py-4 rounded-xl font-black text-[10px] ${role === "sitter" ? "bg-white shadow text-blue-600" : "text-slate-400"}`}>SITTER</button>
        </div>
        <button onClick={finish} disabled={loading} className="w-full bg-emerald-600 text-white py-6 rounded-[2rem] font-black shadow-lg uppercase transition-all active:scale-95 shadow-emerald-200">VALIDER</button>
      </div>
    </div>
  );
};

// ==========================================
// 6. DASHBOARD PARENT
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
  const [activeTab, setActiveTab] = useState("search");
  const [selectedSitter, setSelectedSitter] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sitterReviews, setSitterReviews] = useState([]);
  const [isDark, setIsDark] = useState(localStorage.getItem('dark') === 'true');

  useEffect(() => {
    localStorage.setItem('dark', isDark);
    const unsubSitters = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'sitters'), (snap) => {
      setSitters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    // FILTRE SÉCURISÉ POUR PARENT
    const qOffers = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'offers'), 
      where("parentId", "==", user.uid)
    );
    const unsubOffers = onSnapshot(qOffers, (snap) => {
      setOffers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubSitters(); unsubOffers(); };
  }, [user.uid, isDark]);

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
    return sitters.filter(s => {
      const matchName = s.name?.toLowerCase().includes(search.toLowerCase());
      const matchLocation = !locationFilter || s.city?.toLowerCase().includes(locationFilter.toLowerCase());
      const matchPrice = (parseInt(s.price) || 0) <= maxPrice;
      const matchVerified = !onlyVerified || s.hasCV;
      const matchFav = !onlyFavorites || profile.favorites?.includes(s.id);
      return matchName && matchLocation && matchPrice && matchVerified && matchFav;
    });
  }, [sitters, search, locationFilter, maxPrice, onlyVerified, onlyFavorites, profile.favorites]);

  const handleBooking = async (s, p, h) => {
    try {
      const offerText = `Offre : ${h}h à ${p}€/h`;
      // CRUCIAL : On ajoute tous les marqueurs de messagerie dès la création de l'offre
      const newOffer = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'offers'), {
        parentId: user.uid, 
        parentName: profile.name, 
        sitterId: s.id, 
        sitterName: s.name,
        price: p, 
        hours: h, 
        status: 'pending', 
        createdAt: Timestamp.now(), 
        lastMsg: offerText,
        lastMsgAt: Timestamp.now(), 
        hasUnread: true,
        lastSenderId: user.uid
      });

      // CRUCIAL : On ajoute les ID de sécurité dans le premier message
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'offers', newOffer.id, 'messages'), {
        text: `Bonjour ${s.name}, je souhaiterais réserver une garde de ${h}H au prix de ${p}€/H.`, 
        senderId: user.uid, 
        parentId: user.uid, // Indispensable pour la sécurité
        sitterId: s.id,     // Indispensable pour la sécurité
        createdAt: Timestamp.now()
      });

      setSelectedSitter(null); 
      setActiveTab("messages");
    } catch (e) { console.error(e); }
  };

  const markAsRead = async (offer) => {
    if (offer.hasUnread && offer.lastSenderId !== user.uid) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'offers', offer.id), { hasUnread: false });
    }
    setActiveChat(offer);
  };

  if (activeChat) return <ChatRoom offer={activeChat} currentUser={user} onBack={() => setActiveChat(null)} isDark={isDark} />;
  if (activeTab === "settings") return <SettingsView user={user} profile={profile} onBack={() => setActiveTab("search")} isDark={isDark} toggleDark={() => setIsDark(!isDark)} />;

  const getSPhoto = (s) => (s.useCustomPhoto && s.photoURL) ? s.photoURL : `https://api.dicebear.com/7.x/${s.avatarStyle || 'avataaars'}/svg?seed=${s.name}`;

  return (
    <div className={`min-h-screen font-sans pb-32 animate-in fade-in duration-500 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-800'}`}>
      <nav className={`p-6 flex justify-between items-center sticky top-0 z-40 border-b shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className="flex items-center gap-3"><SitFinderLogo className="w-10 h-10" glow={false} /><span className="font-black italic text-2xl uppercase tracking-tight">SIT<span className="text-emerald-500">FINDER</span></span></div>
        <div className="flex items-center gap-2">
          <div className="relative p-2 text-slate-400">
              <Bell size={22}/>
              {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">{unreadCount}</span>}
          </div>
          <button onClick={() => setActiveTab("settings")} className={`p-3 rounded-2xl transition-all ${isDark ? 'bg-slate-800 text-indigo-400' : 'bg-slate-50 text-slate-300'}`}><Settings size={22} /></button>
          <button onClick={() => signOut(auth)} className={`p-3 rounded-2xl transition-all ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-300'}`}><LogOut size={22} /></button>
        </div>
      </nav>

      <main className="p-6 max-w-7xl mx-auto space-y-8">
        {activeTab === "search" ? (
          <>
            <div className={`p-10 md:p-14 rounded-[3.5rem] shadow-2xl relative overflow-hidden group transition-all duration-700 ${isDark ? 'bg-gradient-to-br from-indigo-600 to-slate-900' : 'bg-gradient-to-br from-emerald-500 to-blue-700'}`}>
              <div className="relative z-10 text-white"><h2 className="text-4xl font-black italic tracking-tighter font-sans leading-tight animate-in slide-in-from-left duration-700">Bonjour {profile.name} ! 👋</h2><p className="opacity-90 font-bold uppercase tracking-widest text-[10px] mt-2">Trouvez l'aide idéale aujourd'hui</p></div>
              <Baby size={400} className="absolute -right-20 -bottom-20 opacity-10 rotate-12 transition-transform group-hover:rotate-0 duration-1000 text-white" />
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="relative flex-1 group">
                  <Search className={`absolute left-6 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-slate-600' : 'text-slate-300'}`} size={24} />
                  <input type="text" placeholder="Rechercher par prénom..." className={`w-full pl-16 pr-8 py-6 border-none rounded-[2.5rem] shadow-sm outline-none focus:ring-4 font-bold ${isDark ? 'bg-slate-900 text-white focus:ring-indigo-500/20' : 'bg-white text-slate-900 focus:ring-emerald-500/10'}`} value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <button onClick={() => setShowFilters(!showFilters)} className={`p-6 rounded-[2.5rem] shadow-sm transition-all flex items-center gap-3 ${showFilters ? 'bg-emerald-500 text-white shadow-emerald-200' : (isDark ? 'bg-slate-900 text-slate-400' : 'bg-white text-slate-400')}`}><SlidersHorizontal size={24}/></button>
              </div>
              {showFilters && (
                <div className={`p-10 rounded-[3.5rem] shadow-2xl border grid grid-cols-1 md:grid-cols-3 gap-12 animate-in slide-in-from-top-4 duration-300 relative z-30 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                   <div className="space-y-4 text-left"><label className="text-[11px] font-black text-slate-400 uppercase italic">Ville</label><input type="text" placeholder="Paris, Lyon..." className={`w-full p-5 rounded-2xl outline-none font-bold ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`} value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} /></div>
                   <div className="space-y-4 text-left"><div className="flex justify-between items-center text-slate-800"><label className="text-[10px] font-black text-slate-400 uppercase italic">Budget ({maxPrice}€)</label><span className="text-xl font-black text-emerald-600 font-sans">{maxPrice}€/H</span></div><input type="range" min="10" max="100" step="5" className="w-full accent-emerald-500" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} /></div>
                   <div className="flex gap-3 pt-6"><button onClick={() => setOnlyVerified(!onlyVerified)} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${onlyVerified ? 'bg-emerald-100 text-emerald-600' : (isDark ? 'bg-slate-800' : 'bg-slate-50')}`}>Sitter Pro ✨</button><button onClick={() => setOnlyFavorites(!onlyFavorites)} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${onlyFavorites ? 'bg-red-50 text-red-600' : (isDark ? 'bg-slate-800' : 'bg-slate-50')}`}>❤️</button></div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {loading ? <div className="col-span-full py-20 flex justify-center animate-pulse"><Loader2 className="animate-spin text-emerald-500" size={64} /></div> 
              : filteredSitters.sort((a,b) => (b.views || 0) - (a.views || 0)).map((s) => (
                <div key={s.id} className={`p-10 rounded-[3.5rem] shadow-xl border hover:shadow-2xl transition-all flex flex-col min-h-[520px] group/card relative ${isDark ? 'bg-slate-900 border-slate-800 shadow-slate-950' : 'bg-white border-slate-50 shadow-slate-200'}`}>
                  <button onClick={() => toggleFavorite(s.id)} className={`absolute top-8 right-8 p-3 rounded-2xl transition-all ${profile.favorites?.includes(s.id) ? 'bg-red-50 text-red-500' : (isDark ? 'bg-slate-800 text-slate-600' : 'bg-slate-50 text-slate-300')} shadow-md`}><Heart size={20} fill={profile.favorites?.includes(s.id) ? "currentColor" : "none"}/></button>
                  <div className="flex flex-col gap-2.5 mb-8">{(s.hasCV) && <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest w-fit border border-emerald-100"><ShieldCheck size={10}/> VÉRIFIÉ</div>}</div>
                  <div className={`w-28 h-28 rounded-[2.5rem] mb-6 overflow-hidden border-4 shadow-xl ring-4 group-hover/card:scale-110 transition-transform duration-500 ${isDark ? 'bg-slate-800 border-slate-700 ring-slate-900' : 'bg-slate-50 border-white ring-slate-50/50'}`}><img src={getSPhoto(s)} alt="profile" className="w-full h-full object-cover" /></div>
                  <h4 className={`font-black text-4xl font-sans mb-1 leading-none tracking-tighter text-left ${isDark ? 'text-white' : 'text-slate-800'}`}>{s.name}</h4>
                  <div className="flex items-center gap-3 text-slate-400 mb-6"><RatingStars rating={s.rating || 5} size={18}/><span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>{s.city}</span></div>
                  <p className={`italic mb-8 leading-relaxed text-sm flex-1 line-clamp-3 text-left ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>"{s.bio || "..."}"</p>
                  <div className={`flex justify-between items-center pt-8 border-t mt-auto ${isDark ? 'border-slate-800' : 'border-slate-50'}`}>
                    <span className="text-3xl font-black text-emerald-600 font-sans">{s.price || 0}€<span className="text-[10px] text-slate-400 ml-1">/H</span></span>
                    <button onClick={() => setSelectedSitter(s)} className={`px-10 py-5 rounded-[2.5rem] font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all hover:bg-emerald-600 tracking-widest ${isDark ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'}`}>VOIR PROFIL</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h2 className={`text-4xl font-black italic uppercase font-sans tracking-tight leading-none text-left ${isDark ? 'text-white' : 'text-slate-800'}`}>Discussions</h2>
            <div className="grid gap-6">
              {offers.length === 0 ? <div className={`py-24 text-center rounded-[4rem] border-2 border-dashed italic text-xl shadow-inner ${isDark ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-white border-slate-100 text-slate-400'}`}>Aucune offre active...</div>
              : offers.sort((a,b) => (b.lastMsgAt?.seconds || 0) - (a.lastMsgAt?.seconds || 0)).map(o => (
                  <div key={o.id} onClick={() => markAsRead(o)} className={`p-10 rounded-[3.5rem] shadow-xl border flex items-center justify-between hover:border-emerald-200 cursor-pointer transition-all active:scale-[0.99] shadow-md ${isDark ? 'bg-slate-900 border-slate-800 text-white shadow-slate-950' : 'bg-white border-slate-100 text-slate-900 shadow-slate-100'} ${o.hasUnread && o.lastSenderId !== user.uid ? 'ring-2 ring-blue-500' : ''}`}>
                    <div className="flex items-center gap-6 text-left">
                        <div className={`w-20 h-20 rounded-3xl overflow-hidden shadow-sm border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-blue-50 border-blue-100'}`}><img src={getSPhoto(sitters.find(x => x.id === o.sitterId) || {})} alt="avatar" className="w-full h-full object-cover" /></div>
                        <div className="text-left"><h4 className="font-black text-2xl font-sans leading-tight">{o.sitterName}</h4><p className={`text-[11px] font-bold truncate max-w-[150px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{o.lastMsg || "Nouvelle offre"}</p></div>
                    </div>
                    {o.hasUnread && o.lastSenderId !== user.uid && <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-blue-500/20"></div>}
                    <ChevronRight className="text-slate-200" size={24}/>
                  </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-md backdrop-blur-xl p-2.5 rounded-[3rem] shadow-2xl flex items-center justify-between z-50 border transition-all ${isDark ? 'bg-slate-900/95 border-slate-800 text-white' : 'bg-slate-900/95 border-white/10 text-slate-100'}`}>
        <button onClick={() => setActiveTab("search")} className={`flex-1 flex flex-col items-center py-4 rounded-[2.5rem] transition-all duration-300 ${activeTab === "search" ? (isDark ? "bg-indigo-500 text-white" : "bg-emerald-500 text-white") : "text-slate-400 hover:text-white"}`}><Search size={22}/><span className="text-[9px] font-black uppercase mt-1.5 tracking-widest">Trouver</span></button>
        <button onClick={() => setActiveTab("messages")} className={`flex-1 flex flex-col items-center py-4 rounded-[2.5rem] transition-all duration-300 relative ${activeTab === "messages" ? (isDark ? "bg-indigo-500 text-white" : "bg-emerald-500 text-white") : "text-slate-400 hover:text-white"}`}><MessageSquare size={22}/><span className="text-[9px] font-black uppercase mt-1.5 font-sans tracking-widest">Offres</span>{unreadCount > 0 && <div className="absolute top-3 right-1/3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse"></div>}</button>
      </div>

      {selectedSitter && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-end md:items-center justify-center p-4">
          <div className={`w-full max-w-xl rounded-[4rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-500 p-10 space-y-10 ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
            <div className="flex justify-between items-start">
              <div className="flex gap-8 items-center text-left">
                 <div className={`w-28 h-28 rounded-[2.5rem] overflow-hidden border-4 shadow-2xl ${isDark ? 'bg-slate-800 border-slate-700 shadow-slate-950' : 'bg-white border-white shadow-slate-200'}`}><img src={getSPhoto(selectedSitter)} alt="profile" className="w-full h-full object-cover" /></div>
                 <div className="space-y-1"><h3 className="text-4xl font-black tracking-tighter font-sans leading-none">{selectedSitter.name}</h3><RatingStars rating={selectedSitter.rating || 5} size={20}/></div>
              </div>
              <button onClick={() => setSelectedSitter(null)} className={`p-4 rounded-full transition-all ${isDark ? 'bg-slate-800 text-white hover:bg-red-500/20' : 'bg-slate-50 text-slate-800 hover:bg-red-50'}`}><X size={24}/></button>
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-6 pr-2 text-left custom-scrollbar">
                <div className={`p-10 rounded-[3.5rem] space-y-6 shadow-inner border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100/50 shadow-slate-100'}`}>
                    <div className="flex justify-between items-center"><span className="font-black text-slate-500 text-[11px] uppercase tracking-widest italic">Lieu</span><span className="font-black uppercase">{selectedSitter.city || "France"}</span></div>
                    <div className="flex justify-between items-center"><span className="font-black text-slate-500 text-[11px] uppercase tracking-widest italic">Visites</span><span className="font-black uppercase">{selectedSitter.views || 0} 👀</span></div>
                </div>
                {sitterReviews.length > 0 && (
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-5 italic">Avis de parents</h4>
                        {sitterReviews.map((r, idx) => (
                            <div key={idx} className={`p-6 rounded-[2rem] shadow-sm space-y-3 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                                <div className="flex justify-between items-center"><span className="font-black text-xs">{r.parentName}</span><RatingStars rating={r.rating} size={12} /></div>
                                <p className={`text-xs italic leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>"{r.text}"</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase italic ml-4 text-slate-400 font-sans">Prix (€/H)</label>
                      <input id="neg-p" type="number" defaultValue={selectedSitter.price} className={`w-full p-6 rounded-[2.5rem] outline-none font-black text-2xl shadow-inner ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-800'}`} />
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase italic ml-4 text-slate-400 font-sans">Temps (H)</label>
                      <input id="neg-h" type="number" defaultValue="2" className={`w-full p-6 rounded-[2.5rem] outline-none font-black text-2xl shadow-inner ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-800'}`} />
                  </div>
              </div>
              <button onClick={() => {
                  const p = document.getElementById('neg-p').value;
                  const h = document.getElementById('neg-h').value;
                  handleBooking(selectedSitter, p, h);
              }} className={`w-full py-8 rounded-[2.5rem] font-black text-sm shadow-xl shadow-emerald-500/20 uppercase tracking-[0.2em] active:scale-95 transition-all ${isDark ? 'bg-indigo-600 text-white' : 'bg-emerald-500 text-white'}`}>ENVOYER LA DEMANDE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 7. DASHBOARD SITTER
// ==========================================

const SitterDashboard = ({ user, profile }) => {
  const [bio, setBio] = useState("");
  const [price, setPrice] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [cvName, setCvName] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [offers, setOffers] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [saveStatus, setSaveStatus] = useState("");
  const [reviews, setReviews] = useState([]);
  const [isDark, setIsDark] = useState(localStorage.getItem('dark') === 'true');
  const [views, setViews] = useState(0);

  useEffect(() => {
    localStorage.setItem('dark', isDark);
    const unsubPublic = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'sitters', user.uid), (snap) => {
      if (snap.exists()) {
        const d = snap.data(); setBio(d.bio || ""); setPrice(d.price || ""); setBirthDate(d.birthDate || ""); setCity(d.city || ""); setCvName(d.cvName || ""); setViews(d.views || 0);
        if (d.availability) setAvailability(d.availability);
      }
    });
    // FILTRE SÉCURITÉ POUR LE SITTER
    const qOffers = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'offers'), 
      where("sitterId", "==", user.uid)
    );
    const unsubOffers = onSnapshot(qOffers, (snap) => {
      setOffers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubReviews = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'sitters', user.uid, 'reviews'), (snap) => {
        setReviews(snap.docs.map(d => d.data()));
    });
    return () => { unsubPublic(); unsubOffers(); unsubReviews(); };
  }, [user.uid, isDark]);

  const totalEarnings = useMemo(() => {
      return offers.filter(o => o.status === 'accepted' || o.status === 'reviewed').reduce((acc, o) => acc + ( (parseFloat(o.price) || 0) * (parseFloat(o.hours) || 1) ), 0);
  }, [offers]);

  const [availability, setAvailability] = useState({
    Lundi: { active: false, start: "08:00", end: "18:00" }, Mardi: { active: false, start: "08:00", end: "18:00" },
    Mercredi: { active: false, start: "08:00", end: "18:00" }, Jeudi: { active: false, start: "08:00", end: "18:00" },
    Vendredi: { active: false, start: "08:00", end: "18:00" }, Samedi: { active: false, start: "08:00", end: "18:00" },
    Dimanche: { active: false, start: "08:00", end: "18:00" },
  });

  const unreadCount = offers.filter(o => o.hasUnread && o.lastSenderId !== user.uid).length;

  const handleSave = async () => {
    if (!bio || !price || !city || !birthDate) return alert("Champs requis : Bio, Tarif, Ville, Naissance.");
    setLoading(true);
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sitters', user.uid), {
        name: profile.name, avatarStyle: profile.avatarStyle || 'avataaars', photoURL: profile.photoURL || "", useCustomPhoto: !!profile.useCustomPhoto, views,
        phone: profile.phone || "", bio: bio.trim(), price, birthDate, availability, cvName, hasCV: !!cvName, city, rating: 5, uid: user.uid, updatedAt: new Date().toISOString()
      });
      setSaveStatus("PUBLIÉ ! ✨"); setTimeout(() => setSaveStatus(""), 4000);
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  const markAsRead = async (offer) => {
    if (offer.hasUnread && offer.lastSenderId !== user.uid) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'offers', offer.id), { hasUnread: false });
    }
    setActiveChat(offer);
  };

  if (activeChat) return <ChatRoom offer={activeChat} currentUser={user} onBack={() => setActiveChat(null)} isDark={isDark} />;
  if (activeTab === "settings") return <SettingsView user={user} profile={profile} onBack={() => setActiveTab("profile")} isDark={isDark} toggleDark={() => setIsDark(!isDark)} />;

  const myP = (profile.useCustomPhoto && profile.photoURL) ? profile.photoURL : `https://api.dicebear.com/7.x/${profile.avatarStyle || 'avataaars'}/svg?seed=${profile.name}`;

  return (
    <div className={`min-h-screen font-sans pb-32 animate-in fade-in duration-500 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-800'}`}>
      <nav className={`p-6 flex justify-between items-center sticky top-0 z-40 border-b shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className="flex items-center gap-3 text-slate-900"><SitFinderLogo className="w-10 h-10" glow={false} /><span className="font-black italic text-xl uppercase tracking-tighter leading-none">SIT<span className="text-emerald-500 italic">FINDER</span></span></div>
        <div className="flex items-center gap-2">
          <div className="relative p-2 text-slate-400">
              <Bell size={22}/>
              {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">{unreadCount}</span>}
          </div>
          <button onClick={() => setActiveTab("settings")} className={`p-3 rounded-2xl transition-all ${isDark ? 'bg-slate-800 text-indigo-400' : 'bg-slate-50 text-slate-300'}`}><Settings size={22} /></button>
          <button onClick={() => signOut(auth)} className={`p-3 rounded-2xl transition-all ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-300'}`}><LogOut size={22} /></button>
        </div>
      </nav>
      <main className="p-6 max-w-4xl mx-auto space-y-12">
        {activeTab === "profile" ? (
          <div className="space-y-10 text-left animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-8 rounded-[3rem] shadow-xl border flex flex-col items-center text-center space-y-4 ${isDark ? 'bg-slate-900 border-slate-800 shadow-slate-950' : 'bg-white'}`}>
                    <div className="relative">
                        <div className={`w-28 h-28 rounded-[2.5rem] border-4 shadow-2xl overflow-hidden ring-4 ${isDark ? 'bg-slate-800 border-slate-700 ring-slate-950' : 'bg-white'}`}><img src={myP} alt="profile" className="w-full h-full object-cover" /></div>
                        <button onClick={() => setActiveTab("settings")} className="absolute -bottom-1 -right-1 p-3 bg-slate-900 text-white rounded-xl shadow-xl active:scale-95 transition-all"><Camera size={16}/></button>
                    </div>
                    <div><h2 className={`text-2xl font-black italic ${isDark ? 'text-white' : 'text-slate-800'}`}>{profile.name}</h2><p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 inline-block">Sitter Pro ✨</p></div>
                </div>
                <div className={`p-8 rounded-[3rem] shadow-xl text-white flex flex-col justify-center space-y-2 transition-all ${isDark ? 'bg-indigo-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
                    <Wallet className="mb-1" size={24}/><p className="text-[10px] font-black uppercase tracking-widest opacity-70">Mon Revenu</p>
                    <h3 className="text-4xl font-black italic tracking-tighter">{totalEarnings}€</h3>
                    <p className="text-[8px] font-bold opacity-50 uppercase tracking-widest font-sans italic">Total cumulé</p>
                </div>
            </div>

            <div className={`p-12 md:p-16 rounded-[4.5rem] shadow-2xl border space-y-12 relative overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800 shadow-slate-950' : 'bg-white border-white shadow-slate-200'}`}>
                <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-emerald-400 to-blue-500 shadow-md shadow-emerald-400/20"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-slate-800">
                    <div className="space-y-3 text-left"><label className="text-[11px] font-black text-blue-300 uppercase tracking-widest ml-4 font-sans italic">Tarif (€/H)</label><input type="number" className={`w-full p-8 rounded-[2.5rem] font-black text-4xl outline-none shadow-inner border border-transparent ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-800'}`} value={price} onChange={(e) => setPrice(e.target.value)} /></div>
                    <div className="space-y-3 text-left"><label className="text-[11px] font-black text-blue-300 uppercase tracking-widest ml-4 font-sans italic">Ma Ville</label><input type="text" placeholder="Ville" className={`w-full p-8 rounded-[2.5rem] font-bold outline-none shadow-inner border border-transparent ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-800'}`} value={city} onChange={(e) => setCity(e.target.value)} /></div>
                </div>
                <div className="space-y-3 text-left"><label className="text-[11px] font-black text-blue-300 uppercase tracking-widest ml-4 font-sans italic">Naissance</label><input type="date" className={`w-full p-8 rounded-[2.5rem] font-bold outline-none shadow-inner border border-transparent ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-800'}`} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} /></div>
                <div className="space-y-3 text-left"><label className="text-[11px] font-black text-blue-300 uppercase tracking-widest ml-4 font-sans italic">Ma Bio Professionnelle</label><textarea placeholder="Expériences..." className={`w-full p-10 rounded-[3.5rem] h-64 font-bold outline-none shadow-inner resize-none leading-relaxed ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-800'}`} value={bio} onChange={(e) => setBio(e.target.value)} /></div>
                <div className="space-y-3 text-left"><label className="text-[11px] font-black text-blue-300 uppercase tracking-widest ml-4 font-sans italic">Mon CV</label><input type="file" id="cv-f" className="hidden" onChange={(e) => setCvName(e.target.files[0]?.name || "")} accept=".pdf,image/*" /><label htmlFor="cv-f" className={`w-full flex items-center justify-between p-8 border-2 border-dashed rounded-[2.5rem] cursor-pointer hover:bg-emerald-500/5 transition-all shadow-inner ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}><div className="flex items-center gap-6"><div className="p-5 bg-white rounded-3xl text-blue-400 shadow-md transition-transform group-hover:scale-110"><FileUp size={32}/></div><p className={`text-sm font-black ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{cvName || "Joindre CV"}</p></div>{cvName && <CheckCircle2 className="text-emerald-500" size={32}/>}</label></div>
                <button onClick={handleSave} disabled={loading} className={`w-full py-10 rounded-[3.5rem] font-black shadow-2xl flex justify-center items-center gap-4 active:scale-95 transition-all uppercase tracking-[0.4em] text-sm hover:brightness-110 shadow-slate-300 ${isDark ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'}`}>{loading ? <Loader2 className="animate-spin" size={32}/> : (saveStatus || "PUBLIER MON PROFIL")}</button>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
              <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none text-left">Missions</h2>
              <div className="grid gap-6">
                  {offers.sort((a,b) => (b.lastMsgAt?.seconds || 0) - (a.lastMsgAt?.seconds || 0)).map(o => (
                      <div key={o.id} onClick={() => markAsRead(o)} className={`p-10 rounded-[3.5rem] shadow-xl border flex items-center justify-between hover:border-emerald-200 cursor-pointer active:scale-[0.99] shadow-md ${isDark ? 'bg-slate-900 border-slate-800 shadow-slate-950' : 'bg-white border-slate-100 shadow-slate-50'}`}>
                          <div className="flex items-center gap-8 text-slate-800">
                              <div className={`w-24 h-24 rounded-[2.5rem] overflow-hidden shadow-sm border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-emerald-50 border-emerald-100'}`}><img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${o.parentName}`} alt="avatar" /></div>
                              <div className="text-left"><h4 className={`font-black text-3xl italic leading-tight ${isDark ? 'text-white' : ''}`}>{o.parentName}</h4><p className={`text-[11px] font-black uppercase tracking-[0.3em] mt-1 ${isDark ? 'text-indigo-400' : 'text-emerald-500'}`}>{o.status === 'accepted' ? 'Validé ✨' : `Offre : ${o.price}€/H`}</p></div>
                          </div>
                          {o.hasUnread && o.lastSenderId !== user.uid && <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-xl"></div>}
                      </div>
                  ))}
              </div>
          </div>
        )}
      </main>
      <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-md backdrop-blur-xl p-2.5 rounded-[3.5rem] shadow-2xl flex items-center justify-between z-50 border ${isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-slate-900/95 border-white/10'}`}><button onClick={() => setActiveTab("profile")} className={`flex-1 flex flex-col items-center py-4 rounded-[2.5rem] transition-all duration-300 ${activeTab === "profile" ? (isDark ? "bg-indigo-500 text-white" : "bg-emerald-500 text-white") : "text-slate-400 hover:text-white"}`}><User size={22}/><span className="text-[9px] font-black uppercase mt-1.5 tracking-widest font-sans">Profil</span></button><button onClick={() => setActiveTab("messages")} className={`flex-1 flex flex-col items-center py-4 rounded-[2.5rem] transition-all duration-300 relative ${activeTab === "messages" ? (isDark ? "bg-indigo-500 text-white" : "bg-emerald-500 text-white") : "text-slate-400 hover:text-white"}`}><MessageSquare size={22}/><span className="text-[9px] font-black uppercase mt-1.5 font-sans tracking-widest">Offres</span>{unreadCount > 0 && <div className="absolute top-3 right-1/3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse"></div>}</button></div>
    </div>
  );
};

// ==========================================
// 8. LOGIQUE RACINE
// ==========================================

export default function App() {
  const [init, setInit] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let unsubP = null;
    const unsubA = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        unsubP = onSnapshot(doc(db, 'artifacts', appId, 'users', u.uid, 'settings', 'profile'), (snap) => {
          if (snap.exists()) setProfile(snap.data()); else setProfile(null);
        });
      } else { setProfile(null); if (unsubP) unsubP(); }
    });
    const timer = setTimeout(() => setInit(true), 2500);
    return () => { unsubA(); if (unsubP) unsubP(); clearTimeout(timer); };
  }, []);

  if (!init) return <SplashScreen />;
  if (!user) return <AuthScreen />;
  if (user && !profile) return <CompleteProfileScreen uid={user.uid} />;
  return profile.role === "parent" ? <ParentDashboard profile={profile} user={user} /> : <SitterDashboard user={user} profile={profile} />;
}
