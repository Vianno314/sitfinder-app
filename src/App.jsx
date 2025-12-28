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
  Send, X, Check, ArrowLeft, MessageCircle, PartyPopper, Star, MapPin, Camera, SlidersHorizontal, Settings, KeyRound, Phone, Trash2, Palette, Image as ImageIcon, Share2, Quote, TrendingUp, Zap, Trophy, Languages, EyeOff, Moon, Sun, Bell, Flag, Eye, Wallet, Car, CreditCard, LockKeyhole
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
// 2. UTILITAIRES DE DESIGN (COULEURS SATELLA)
// ==========================================

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
      const updateData = { name: newName, phone, photoURL: customPhoto, useCustomPhoto, privateMode };
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile'), updateData);
      if (profile.role === 'sitter') {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sitters', user.uid), { name: newName, photoURL: customPhoto, useCustomPhoto, phone });
      }
      setStatus({ type: "success", msg: "Enregistré !" });
    } catch (err) { setStatus({ type: "error", msg: "Erreur..." }); }
    finally { setLoading(false); }
  };

  const currentPhoto = useCustomPhoto && customPhoto ? customPhoto : `https://api.dicebear.com/7.x/avataaars/svg?seed=${newName}`;

  return (
    <div className={`min-h-screen font-sans pb-32 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-800'}`}>
      <div className={`p-6 border-b flex items-center gap-4 sticky top-0 z-50 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <button onClick={onBack}><ArrowLeft size={20}/></button>
        <h2 className="font-black text-xl italic uppercase text-[#E64545]">Réglages BABYKEEPER</h2>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-8">
        {status.msg && <div className="p-4 bg-[#E0720F]/10 text-[#E0720F] rounded-2xl font-bold text-center text-xs uppercase">{status.msg}</div>}

        <div className={`p-8 rounded-[3rem] border flex justify-between items-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-50'}`}>
           <div className="flex items-center gap-4"><Moon size={24} className="text-[#E0720F]"/><p className="font-black text-xs uppercase">Mode Sombre</p></div>
           <button onClick={toggleDark} className={`w-14 h-7 rounded-full relative ${isDark ? 'bg-[#E64545]' : 'bg-slate-200'}`}><div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow ${isDark ? 'right-1' : 'left-1'}`}></div></button>
        </div>

        <div className="flex flex-col items-center gap-6">
            <img src={currentPhoto} className="w-32 h-32 rounded-[2rem] object-cover border-4 border-[#E64545]/20 shadow-xl" />
            <div className="flex gap-2 w-full max-w-xs">
                <button onClick={() => setUseCustomPhoto(false)} className="flex-1 py-3 rounded-xl font-black text-xs uppercase border">Avatar</button>
                <label className="flex-1 py-3 rounded-xl font-black text-xs uppercase bg-[#E64545] text-white shadow-lg text-center cursor-pointer">
                    Photo <input type="file" hidden onChange={handlePhotoUpload} />
                </label>
            </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-6">
            <input value={newName} onChange={e=>setNewName(e.target.value)} className={`w-full p-4 rounded-2xl font-bold outline-none border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`} placeholder="Prénom" />
            <input value={phone} onChange={e=>setPhone(e.target.value)} className={`w-full p-4 rounded-2xl font-bold outline-none border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`} placeholder="Téléphone" />
            <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl">
                <div className="flex items-center gap-3"><EyeOff size={16} className="text-slate-400"/><p className="text-xs font-black uppercase">Mode Privé</p></div>
                <button type="button" onClick={() => setPrivateMode(!privateMode)} className={`w-12 h-6 rounded-full relative ${privateMode ? 'bg-[#E64545]' : 'bg-slate-300'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full ${privateMode ? 'right-1' : 'left-1'}`}></div></button>
            </div>
            <button disabled={loading} className="w-full bg-[#E64545] text-white py-5 rounded-2xl font-black uppercase shadow-xl hover:brightness-110">Sauvegarder</button>
        </form>

        <div className="space-y-4">
          <a href="mailto:babykeeper.bordais@gmail.com" className="w-full p-5 border-2 border-[#E0720F]/20 text-[#E0720F] rounded-2xl font-black text-xs uppercase flex justify-center gap-2 hover:bg-[#E0720F]/5">Support Technique</a>
          <button onClick={() => signOut(auth)} className="w-full p-5 border-2 border-dashed rounded-2xl font-black text-xs uppercase flex justify-center gap-2">Déconnexion</button>
          <button onClick={handleDeleteAccount} className="w-full p-5 bg-red-50 text-red-500 rounded-2xl font-black text-xs uppercase flex justify-center gap-2">Supprimer le compte</button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. MESSAGERIE & CHAT (AVEC PAIEMENT SECURISE)
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
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      setMessages(msgs);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
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
        text: newMessage, senderId: currentUser.uid, parentId: offer.parentId, sitterId: offer.sitterId, createdAt: Timestamp.now()
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
      let text = "";
      if (status === 'accepted') text = "✨ Offre acceptée ! En attente du paiement sécurisé.";
      else if (status === 'declined') text = "L'offre a été refusée.";
      
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'offers', offer.id, 'messages'), { text, senderId: 'system', parentId: offer.parentId, sitterId: offer.sitterId, createdAt: Timestamp.now() });
    } catch (e) { console.error(e); }
  };

  // --- LOGIQUE PAIEMENT APPLE PAY SIMULE ---
  const handlePayment = async () => {
      // Simule un paiement Apple Pay
      if(window.confirm("Payer avec Apple Pay  ?\n(L'argent sera bloqué jusqu'à la fin de la garde)")) {
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'offers', offer.id), { 
              status: 'paid_held', // Statut: Argent bloqué
              isPaid: true 
          });
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'offers', offer.id, 'messages'), { 
              text: "💰 Paiement Apple Pay effectué. L'argent est sécurisé et bloqué en attendant la fin de la garde.", 
              senderId: 'system', parentId: offer.parentId, sitterId: offer.sitterId, createdAt: Timestamp.now() 
          });
      }
  };

  const confirmService = async () => {
      // Le parent valide la fin
      if(window.confirm("Confirmez-vous que le Sitter a terminé ?\n(Cela débloquera l'argent sur son compte)")) {
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'offers', offer.id), { 
              status: 'completed', // Statut: Argent versé
              fundsReleased: true 
          });
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'offers', offer.id, 'messages'), { 
              text: "✅ Prestation validée ! L'argent a été libéré vers le compte du Sitter.", 
              senderId: 'system', parentId: offer.parentId, sitterId: offer.sitterId, createdAt: Timestamp.now() 
          });
          setShowReview(true); // Ouvre l'avis
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
    <div className={`flex flex-col h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'}`}>
      <div className={`p-6 border-b flex justify-between items-center sticky top-0 z-20 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack}><ArrowLeft size={20}/></button>
          <div><h3 className="font-black text-xs uppercase text-[#E64545]">CHAT</h3><p className="text-[10px] text-[#E0720F] font-bold">{offer.price}€/H • {offer.status}</p></div>
        </div>
        <div className="flex gap-2">
            <button onClick={() => alert("Signalé")} className="p-3 text-slate-300 hover:text-red-500"><Flag size={18}/></button>
            {/* Bouton avis si fini */}
            {offer.status === 'completed' && currentUser.uid === offer.parentId && <button onClick={() => setShowReview(true)} className="p-3 bg-[#E0720F]/20 text-[#E0720F] rounded-xl"><Star size={18}/></button>}
            {/* Téléphone seulement si payé/bloqué ou fini */}
            {(offer.status === 'paid_held' || offer.status === 'completed' || offer.status === 'reviewed') && otherUserPhone && <a href={`tel:${otherUserPhone}`} className="p-3 bg-[#E64545] text-white rounded-xl"><Phone size={18}/></a>}
        </div>
      </div>

      {/* --- ZONE D'ACTIONS DE PAIEMENT (Parent) --- */}

      {/* ETAPE 1 : Paiement pour bloquer les fonds */}
      {offer.status === 'accepted' && currentUser.uid === offer.parentId && (
          <div className="p-4 bg-gray-50 border-b flex flex-col gap-2 items-center text-center">
              <p className="text-xs font-bold text-slate-500">Le sitter a accepté ! Payez pour sécuriser.</p>
              <button onClick={handlePayment} className="w-full bg-black text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                    Payer avec Apple Pay
              </button>
              <div className="flex items-center gap-1 text-[10px] text-slate-400"><LockKeyhole size={10}/> Argent bloqué jusqu'à la fin</div>
          </div>
      )}

      {/* ETAPE 2 : Validation pour libérer les fonds */}
      {offer.status === 'paid_held' && currentUser.uid === offer.parentId && (
          <div className="p-4 bg-green-50 border-b flex flex-col gap-2 items-center text-center">
              <p className="text-xs font-bold text-green-700">Garde payée (fonds bloqués).</p>
              <button onClick={confirmService} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                   ✅ Valider la fin & Libérer les fonds
              </button>
              <p className="text-[10px] text-green-600/70">À faire une fois le sitter parti.</p>
          </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50">
              <div className="bg-white w-full max-w-md rounded-[2rem] p-8 space-y-6">
                  <h3 className="text-2xl font-black text-center">Notez le Sitter</h3>
                  <div className="flex justify-center"><RatingStars rating={reviewRating} size={30} interactive={true} onRate={setReviewRating} /></div>
                  <textarea placeholder="Votre avis..." className="w-full p-4 bg-slate-50 rounded-xl" value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
                  <div className="flex gap-2">
                      <button onClick={() => setShowReview(false)} className="flex-1 py-4 font-bold text-slate-400">Annuler</button>
                      <button onClick={submitReview} className="flex-[2] bg-[#E64545] text-white rounded-xl font-bold">Publier</button>
                  </div>
              </div>
          </div>
      )}

      {offer.status === 'pending' && currentUser.uid === offer.sitterId && (
        <div className="p-4 grid grid-cols-2 gap-4 border-t">
          <button onClick={() => updateOfferStatus('declined')} className="bg-slate-100 py-4 rounded-xl font-bold">Refuser</button>
          <button onClick={() => updateOfferStatus('accepted')} className="bg-[#E64545] text-white py-4 rounded-xl font-bold">Accepter</button>
        </div>
      )}

      <form onSubmit={sendMessage} className="p-4 border-t flex gap-4">
        <input type="text" placeholder="Répondre..." className="flex-1 p-4 rounded-xl bg-slate-50 outline-none" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
        <button type="submit" className="bg-[#E0720F] text-white p-4 rounded-xl"><Send size={20}/></button>
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
    const e = localStorage.getItem('sf_email');
    const p = localStorage.getItem('sf_pass');
    if (e && p) { setEmail(e); setPassword(p); setRemember(true); }
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault(); setLoading(true);
    if (remember) { localStorage.setItem('sf_email', email); localStorage.setItem('sf_pass', password); }
    else { localStorage.removeItem('sf_email'); localStorage.removeItem('sf_pass'); }

    try {
      if (isRegister) {
        if (password.length < 6) throw new Error("Mot de passe trop court.");
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'artifacts', appId, 'users', cred.user.uid, 'settings', 'profile'), {
          uid: cred.user.uid, name: name.trim() || "User", role, email, level: role === 'sitter' ? level : null, createdAt: new Date().toISOString()
        });
      } else { await signInWithEmailAndPassword(auth, email, password); }
    } catch (err) { alert("Erreur connexion."); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative font-sans text-slate-900">
      <div className="absolute inset-0 bg-gradient-to-br from-[#E64545]/10 to-[#E0720F]/10 -z-10"></div>
      <div className="w-full max-w-lg bg-white p-10 rounded-[3rem] shadow-2xl border border-white">
        <div className="flex flex-col items-center mb-10 text-center">
          <SitFinderLogo className="mb-6 h-24 w-24" />
          <h2 className="text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#E64545] to-[#E0720F]">BABYKEEPER</h2>
          <p className="text-[#E64545] text-sm font-bold uppercase tracking-widest mt-2">Confiance & Simplicité</p>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          {isRegister && <input required placeholder="Prénom" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" value={name} onChange={(e) => setName(e.target.value)} />}
          <input required type="email" placeholder="Email" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input required type="password" placeholder="Mot de passe" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" value={password} onChange={(e) => setPassword(e.target.value)} />
          
          {!isRegister && (
             <div className="flex items-center gap-2 pl-2">
                 <input type="checkbox" id="rem" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-[#E64545]"/>
                 <label htmlFor="rem" className="text-xs font-bold text-slate-400 uppercase cursor-pointer">Se souvenir de moi</label>
             </div>
          )}

          {isRegister && (
            <>
            <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-2xl mt-4">
              <button type="button" onClick={() => setRole("parent")} className={`py-3 rounded-xl font-black text-[10px] ${role === "parent" ? "bg-white shadow text-[#E64545]" : "text-slate-400"}`}>PARENT</button>
              <button type="button" onClick={() => setRole("sitter")} className={`py-3 rounded-xl font-black text-[10px] ${role === "sitter" ? "bg-white shadow text-[#E0720F]" : "text-slate-400"}`}>SITTER</button>
            </div>
            {role === "sitter" && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {['1','2','3'].map(l => (
                    <button type="button" key={l} onClick={() => setLevel(l)} className={`py-2 rounded-lg text-[10px] font-black ${level === l ? "bg-[#E64545] text-white" : "bg-slate-100 text-slate-400"}`}>NIV {l}</button>
                ))}
              </div>
            )}
            </>
          )}
          <button disabled={loading} className="w-full bg-[#E64545] text-white py-5 rounded-[2rem] font-black text-sm shadow-xl hover:brightness-110 mt-4">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : (isRegister ? "CRÉER UN COMPTE" : "SE CONNECTER")}
          </button>
        </form>
        <div className="mt-8 text-center">
          <button type="button" className="text-[#E0720F] font-bold text-xs uppercase underline" onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? "J'ai déjà un compte" : "Créer un nouveau profil"}
          </button>
        </div>
      </div>
    </div>
  );
};

const CompleteProfileScreen = ({ uid }) => {
  // Simple redirection ou complétion
  return <div className="h-screen flex items-center justify-center">Chargement...</div>;
};

// ==========================================
// 6. DASHBOARD PARENT
// ==========================================

const ParentDashboard = ({ profile, user }) => {
  const [sitters, setSitters] = useState([]);
  const [offers, setOffers] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("search");
  const [selectedSitter, setSelectedSitter] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'sitters'), s => setSitters(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const u2 = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'offers'), where("parentId", "==", user.uid)), s => setOffers(s.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => { u1(); u2(); };
  }, [user.uid]);

  const handleBooking = async (s, p, h) => {
    const offerText = `Offre : ${h}h à ${p}€/h`;
    const ref = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'offers'), {
        parentId: user.uid, parentName: profile.name, sitterId: s.id, sitterName: s.name, price: p, hours: h, status: 'pending', lastMsg: offerText, lastMsgAt: Timestamp.now(), hasUnread: true, lastSenderId: user.uid
    });
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'offers', ref.id, 'messages'), { text: `Bonjour ${s.name}, je réserve ${h}h à ${p}€/h.`, senderId: user.uid, parentId: user.uid, sitterId: s.id, createdAt: Timestamp.now() });
    setSelectedSitter(null); setActiveTab("messages");
  };

  if (activeChat) return <ChatRoom offer={activeChat} currentUser={user} onBack={() => setActiveChat(null)} isDark={isDark} />;
  if (activeTab === "settings") return <SettingsView user={user} profile={profile} onBack={() => setActiveTab("search")} isDark={isDark} toggleDark={() => setIsDark(!isDark)} />;

  return (
    <div className={`min-h-screen pb-32 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-800'}`}>
      <nav className="p-6 sticky top-0 bg-inherit z-40 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3"><SitFinderLogo className="w-10 h-10"/><span className="font-black italic text-2xl text-transparent bg-clip-text bg-gradient-to-r from-[#E64545] to-[#E0720F]">BABYKEEPER</span></div>
        <button onClick={() => setActiveTab("settings")}><Settings className="text-[#E64545]"/></button>
      </nav>

      <main className="p-6 space-y-8">
        {activeTab === "search" ? (
          <>
            <div className={`p-10 rounded-[3rem] shadow-2xl relative overflow-hidden bg-gradient-to-br from-[#E64545] to-[#E0720F]`}>
              <div className="relative z-10 text-white"><h2 className="text-3xl font-black italic">Bonjour {profile.name} 👋</h2><p className="text-xs font-bold uppercase tracking-widest mt-2">Trouvez l'aide idéale</p></div>
              <Baby size={300} className="absolute -right-10 -bottom-10 opacity-20 text-white rotate-12"/>
            </div>
            <div className="relative">
                <Search className="absolute left-6 top-4 text-slate-400"/>
                <input className="w-full p-4 pl-14 rounded-2xl shadow-sm outline-none font-bold" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
            <div className="grid gap-6">
                {sitters.filter(s => s.name?.toLowerCase().includes(search.toLowerCase())).map(s => (
                    <div key={s.id} className="p-6 bg-white rounded-[2rem] shadow-lg border border-slate-100 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                <img src={s.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.name}`} className="w-16 h-16 rounded-2xl bg-slate-100 object-cover"/>
                                <div>
                                    <h3 className="font-black text-xl">{s.name}</h3>
                                    <RatingStars rating={s.rating}/>
                                    {s.hasCar && <span className="text-[10px] bg-[#E0720F] text-white px-2 py-0.5 rounded-md font-bold mt-1 inline-block">AUTO 🚗</span>}
                                </div>
                            </div>
                            <span className="font-black text-[#E64545] text-xl">{s.price}€/h</span>
                        </div>
                        <button onClick={() => setSelectedSitter(s)} className="w-full py-4 bg-[#E64545] text-white rounded-xl font-black text-xs uppercase">Voir Profil</button>
                    </div>
                ))}
            </div>
          </>
        ) : (
          <div className="space-y-4">
              <h2 className="text-2xl font-black text-[#E64545]">MESSAGES</h2>
              {offers.map(o => (
                  <div key={o.id} onClick={() => setActiveChat(o)} className="p-6 bg-white rounded-[2rem] shadow-sm border flex justify-between items-center cursor-pointer">
                      <div>
                          <h4 className="font-bold">{o.sitterName}</h4>
                          <p className="text-xs text-slate-400">{o.lastMsg}</p>
                          {/* BADGE PAIEMENT */}
                          {o.status === 'paid_held' && <span className="text-[9px] bg-yellow-100 text-yellow-600 px-2 rounded-full mt-1 inline-block">Payé (Fonds bloqués)</span>}
                          {o.status === 'completed' && <span className="text-[9px] bg-green-100 text-green-600 px-2 rounded-full mt-1 inline-block">Terminé</span>}
                      </div>
                      <ChevronRight className="text-slate-300"/>
                  </div>
              ))}
          </div>
        )}
      </main>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white p-2 rounded-full shadow-2xl flex gap-2 border border-slate-100">
          <button onClick={() => setActiveTab("search")} className={`p-4 rounded-full transition-all ${activeTab==="search" ? "bg-[#E64545] text-white" : "text-slate-400"}`}><Search/></button>
          <button onClick={() => setActiveTab("messages")} className={`p-4 rounded-full transition-all ${activeTab==="messages" ? "bg-[#E64545] text-white" : "text-slate-400"}`}><MessageSquare/></button>
      </div>

      {selectedSitter && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[3rem] p-8 space-y-6 animate-in slide-in-from-bottom-10">
                <div className="flex justify-between">
                    <h2 className="text-2xl font-black">{selectedSitter.name}</h2>
                    <button onClick={() => setSelectedSitter(null)} className="p-2 bg-slate-100 rounded-full"><X/></button>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase">Infos</p>
                    <div className="flex gap-2">
                        {selectedSitter.hasCar && <span className="px-3 py-1 bg-[#E0720F] text-white rounded-lg text-xs font-bold">Véhiculé 🚗</span>}
                        <span className="px-3 py-1 bg-[#E64545] text-white rounded-lg text-xs font-bold">Niveau {selectedSitter.level || 1}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-2 italic">"{selectedSitter.bio || "Pas de bio..."}"</p>
                </div>
                <button onClick={() => handleBooking(selectedSitter, selectedSitter.price, 2)} className="w-full py-5 bg-[#E64545] text-white rounded-2xl font-black uppercase">Réserver</button>
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
  const [hasCar, setHasCar] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [offers, setOffers] = useState([]);
  const [chat, setChat] = useState(null);

  useEffect(() => {
    // Charge le profil
    onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'sitters', user.uid), s => {
        if(s.exists()) { const d = s.data(); setBio(d.bio); setPrice(d.price); setHasCar(d.hasCar || false); }
    });
    // Charge les demandes
    onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'offers'), where('sitterId', '==', user.uid)), s => {
        setOffers(s.docs.map(d => ({id: d.id, ...d.data()})));
    });
  }, []);

  const save = async () => {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sitters', user.uid), {
          name: profile.name, bio, price, hasCar, uid: user.uid, photoURL: profile.photoURL || "", rating: 5, level: profile.level
      });
      setSaveStatus("Sauvegardé !"); setTimeout(()=>setSaveStatus(""), 2000);
  };

  const totalEarned = offers.filter(o => o.status === 'completed').reduce((acc, o) => acc + (parseFloat(o.price) * parseFloat(o.hours)), 0);

  if(chat) return <ChatRoom offer={chat} currentUser={user} onBack={() => setChat(null)} isDark={false} />;

  return (
      <div className="min-h-screen bg-slate-50 p-6 space-y-6 pb-24">
          <div className="flex justify-between items-center">
              <SitFinderLogo className="w-10 h-10"/>
              <button onClick={() => signOut(auth)}><LogOut className="text-slate-400"/></button>
          </div>
          
          <div className="bg-[#E0720F] text-white p-6 rounded-[2rem] shadow-lg mb-6">
              <p className="text-xs uppercase font-bold opacity-80">Gains validés</p>
              <h2 className="text-4xl font-black">{totalEarned} €</h2>
          </div>

          <h2 className="text-2xl font-black text-[#E64545]">Profil & Demandes</h2>
          
          <div className="p-8 bg-white rounded-[3rem] shadow-xl space-y-6">
              <input type="number" placeholder="Prix / H" className="w-full p-4 border rounded-2xl font-bold" value={price} onChange={e=>setPrice(e.target.value)}/>
              <textarea placeholder="Ma bio..." className="w-full p-4 border rounded-2xl font-bold h-32" value={bio} onChange={e=>setBio(e.target.value)}/>
              
              <button onClick={() => setHasCar(!hasCar)} className={`w-full py-4 rounded-2xl font-black uppercase flex items-center justify-center gap-2 ${hasCar ? "bg-[#E0720F] text-white" : "bg-slate-100 text-slate-400"}`}>
                  <Car/> {hasCar ? "Je suis véhiculé" : "Non véhiculé"}
              </button>

              <button onClick={save} className="w-full py-5 bg-[#E64545] text-white rounded-2xl font-black uppercase">{saveStatus || "Publier mon profil"}</button>
          </div>

          <div className="space-y-4">
              <h3 className="font-bold text-slate-500 uppercase">Mes demandes</h3>
              {offers.map(o => (
                  <div key={o.id} onClick={() => setChat(o)} className="p-6 bg-white rounded-[2rem] border shadow-sm cursor-pointer">
                      <div className="flex justify-between">
                          <h4 className="font-bold">{o.parentName}</h4>
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${o.status === 'paid_held' ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100'}`}>{o.status}</span>
                      </div>
                      <p className="text-sm text-slate-400 mt-2">{o.lastMsg}</p>
                  </div>
              ))}
          </div>
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
    signOut(auth); // Sécurité au lancement
    setTimeout(() => setInit(true), 2000);
    return onAuthStateChanged(auth, u => {
        setUser(u);
        if(u) onSnapshot(doc(db, 'artifacts', appId, 'users', u.uid, 'settings', 'profile'), s => setProfile(s.data()));
    });
  }, []);

  if (!init) return <SplashScreen />;
  if (!user) return <AuthScreen />;
  if (user && !profile) return <div className="h-screen flex items-center justify-center">Chargement...</div>;
  return profile.role === 'parent' ? <ParentDashboard profile={profile} user={user} /> : <SitterDashboard user={user} profile={profile} />;
}
