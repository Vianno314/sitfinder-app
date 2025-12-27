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
const appId = "sitfinder-prod-v1"; // On ne touche pas à l'ID technique pour ne rien casser

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
      <img src="/logo.png" alt="BabyKeeper Logo" className="w-full h-full object-cover" />
    </div>
  </div>
);

const RatingStars = ({ rating = 5, size = 14, interactive = false, onRate = null }) => (
  <div className="flex gap-0.5 text-amber-400">
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

const SplashScreen = ({ message = "La recherche en toute confiance" }) => (
  <div className="flex flex-col items-center justify-center h-screen bg-white font-sans overflow-hidden">
    <div className="relative mb-10 animate-in zoom-in duration-1000">
      <div className="absolute inset-0 bg-blue-500 blur-[100px] opacity-10"></div>
      <SitFinderLogo className="w-40 h-40" />
    </div>
    <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
      <h1 className="text-5xl font-black tracking-tighter text-slate-800 italic leading-none uppercase">BABY<span className="text-emerald-500 font-sans italic">KEEPER</span></h1>
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
        <h2 className="font-black text-xl italic uppercase">Réglages BABYKEEPER</h2>
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
            <button disabled={loading} className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-[10px] uppercase shadow-xl hover:bg-emerald-700 transition-all">Sauvegarder les réglages</button>
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
        const isSitter = currentUser.uid === offer.sitterId;
        const otherId = isSitter ? offer.parentId : offer.sitterId;
        
        try {
            const publicDoc = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sitters', otherId));
            if (publicDoc.exists() && publicDoc.data().phone) {
                setOtherUserPhone(publicDoc.data().phone);
                return;
            }
        } catch(e) {}
        
        try {
             const d = await getDoc(doc(db, 'artifacts', appId, 'users', otherId, 'settings', 'profile'));
             if (d.exists()) setOtherUserPhone(d.data().phone);
        } catch(e) {}
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
        parentId: offer.parentId, 
        sitterId: offer.sitterId,
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
        parentId: offer.parentId, 
        sitterId: offer.sitterId, 
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
          alert("Votre avis a été publié avec succès ! ✨");
          setShowReview(false);
      } catch (e) { 
          console.error(e); 
          alert("Erreur lors de l'envoi de l'avis. Vérifiez votre connexion.");
      }
  };

  return (
    <div className={`flex flex-col h-screen font-sans animate-in fade-in duration-300 ${isDark ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'}`}>
      <div className={`p-6 border-b flex items-center justify-between sticky top-0 z-20 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2 rounded-full ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}><ArrowLeft size={20}/></button>
          <div className="text-left"><h3 className="font-black tracking-tight uppercase italic text-xs">BABYKEEPER CHAT</h3><p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">{offer.price}€/H • {offer.status}</p></div>
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
              m.senderId === currentUser.uid ? 'bg-indigo-600 text-white rounded-br-none' : 
              (isDark ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-slate-800 border-slate-100') + ' rounded-bl-none border'
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
                  <textarea placeholder="Partage ton avis..." className="w-full p-6 bg-slate-50 rounded-3xl h-32 font-bold outline-none shadow-inner text-slate-800" value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
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
        <button type="submit" className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg active:scale-95 transition-all"><Send size={20}/></button>
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
          uid: cred.user.uid, name: name.trim() || "User", role, email, level: role === 'sitter' ? level : null, avatarStyle: "avataaars", favorites: [], createdAt: new Date().toISOString()
        });
      } else { await signInWithEmailAndPassword(auth, email, password); }
    } catch
