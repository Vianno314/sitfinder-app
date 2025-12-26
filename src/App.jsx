import React, { useEffect, useState, useMemo, useRef } from "react";
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
import { 
  Baby, LogOut, Save, Search, Loader2, AlertCircle, ShieldCheck, 
  Euro, User, Mail, Lock, ChevronRight, Sparkles, Heart, Filter, Calendar,
  Clock, UserPlus, Cake, FileUp, FileText, CheckCircle2, MessageSquare, 
  Send, X, Check, ArrowLeft, MessageCircle, PartyPopper, Star, MapPin, Camera, SlidersHorizontal, Settings, KeyRound, Phone, Trash2, Palette, Image as ImageIcon, Share2, Quote, TrendingUp, Zap, Trophy, Languages, EyeOff, Moon, Sun, Bell, Flag, Eye, Wallet
} from "lucide-react";

// CONFIGURATION FIREBASE
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

// COMPOSANTS UI
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

const SplashScreen = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-white">
    <SitFinderLogo className="w-40 h-40 animate-pulse" />
  </div>
);

// REGLAGES
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
    if (window.confirm("⚠️ Supprimer définitivement votre compte ?")) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile'));
        if (profile.role === 'sitter') await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sitters', user.uid));
        await deleteUser(auth.currentUser);
        alert("Compte supprimé.");
      } catch (err) { alert("Erreur suppression. Reconnectez-vous."); }
      finally { setLoading(false); }
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
      setStatus({ type: "success", msg: "Enregistré !" });
    } catch (err) { setStatus({ type: "error", msg: "Erreur..." }); }
    finally { setLoading(false); }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setCustomPhoto(reader.result); setUseCustomPhoto(true); };
      reader.readAsDataURL(file);
    }
  };

  const currentPhoto = useCustomPhoto && customPhoto ? customPhoto : `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${newName}`;

  return (
    <div className={`min-h-screen pb-32 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-800'}`}>
      <div className="p-6 border-b flex items-center gap-4 sticky top-0 z-50 bg-inherit">
        <button onClick={onBack}><ArrowLeft size={20}/></button>
        <h2 className="font-black text-xl italic uppercase">Réglages</h2>
      </div>
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        <div className="p-8 border rounded-[3rem] flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-4">
                <Moon size={24}/>
                <div><p className="font-black text-xs uppercase">Mode Sombre</p></div>
            </div>
            <button onClick={toggleDark} className={`w-12 h-6 rounded-full relative ${isDark ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isDark ? 'right-1' : 'left-1'}`}></div>
            </button>
        </div>

        <div className="p-10 border rounded-[3rem] shadow-xl flex flex-col items-center gap-6">
            <div className="relative">
                <img src={currentPhoto} className="w-32 h-32 rounded-[2rem] object-cover border-4 border-slate-100" />
                <label className="absolute -bottom-2 -right-2 p-3 bg-slate-900 text-white rounded-xl cursor-pointer">
                    <Camera size={16}/><input type="file" className="hidden" onChange={handlePhotoUpload}/>
                </label>
            </div>
            <div className="flex gap-2 w-full">
                <button onClick={() => setUseCustomPhoto(false)} className="flex-1 py-3 rounded-xl font-bold text-xs uppercase border">Avatar</button>
                <button onClick={() => setUseCustomPhoto(true)} className="flex-1 py-3 rounded-xl font-bold text-xs uppercase border">Photo</button>
            </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-6 p-8 border rounded-[3rem] shadow-xl">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full p-4 rounded-2xl border outline-none font-bold bg-transparent" placeholder="Prénom" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-4 rounded-2xl border outline-none font-bold bg-transparent" placeholder="Téléphone" />
            <button disabled={loading} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase shadow-lg">Sauvegarder</button>
        </form>

        <div className="space-y-4">
            <a href="mailto:vianney.bordais@gmail.com" className="w-full p-5 border-2 border-blue-100 text-blue-500 rounded-2xl font-black text-xs uppercase flex justify-center gap-2">Support Technique</a>
            <button onClick={() => signOut(auth)} className="w-full p-5 border-2 border-dashed rounded-2xl font-black text-xs uppercase flex justify-center gap-2">Déconnexion</button>
            <button onClick={handleDeleteAccount} className="w-full p-5 bg-red-50 text-red-500 rounded-2xl font-black text-xs uppercase flex justify-center gap-2">Supprimer le compte</button>
        </div>
      </div>
    </div>
  );
};

// CHAT
const ChatRoom = ({ offer, currentUser, onBack, isDark }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [otherPhone, setOtherPhone] = useState("");
  const dummy = useRef();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'offers', offer.id, 'messages'), (snap) => {
      setMessages(snap.docs.map(d => d.data()).sort((a,b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)));
      dummy.current?.scrollIntoView({ behavior: 'smooth' });
    });
    // Récupérer le téléphone de l'autre
    const otherId = currentUser.uid === offer.sitterId ? offer.parentId : offer.sitterId;
    getDoc(doc(db, 'artifacts', appId, 'users', otherId, 'settings', 'profile')).then(s => {
        if(s.exists()) setOtherPhone(s.data().phone);
    });
    return () => unsub();
  }, [offer.id]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'offers', offer.id, 'messages'), {
            text: newMessage, senderId: currentUser.uid, createdAt: Timestamp.now(),
            parentId: offer.parentId, sitterId: offer.sitterId // SECURITE
        });
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'offers', offer.id), {
            lastMsg: newMessage, lastMsgAt: Timestamp.now(), hasUnread: true, lastSenderId: currentUser.uid
        });
        setNewMessage("");
    } catch(e) { console.error(e); }
  };

  const handleStatus = async (status) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'offers', offer.id), { status });
  };

  const handleReport = () => {
      const r = prompt("Raison du signalement ?");
      if(r) addDoc(collection(db, 'reports'), { reporter: currentUser.uid, offer: offer.id, reason: r, date: Timestamp.now() }).then(() => alert("Signalé."));
  }

  return (
    <div className={`h-screen flex flex-col ${isDark ? 'bg-slate-950 text-white' : 'bg-white text-slate-800'}`}>
      <div className="p-4 border-b flex justify-between items-center shadow-sm sticky top-0 bg-inherit z-10">
        <div className="flex items-center gap-4">
            <button onClick={onBack}><ArrowLeft/></button>
            <div><h3 className="font-black text-xs uppercase">Chat • {offer.status}</h3><p className="text-[10px] opacity-60">{offer.price}€/H</p></div>
        </div>
        <div className="flex gap-2">
            <button onClick={handleReport}><Flag size={18} className="text-slate-300 hover:text-red-500"/></button>
            {offer.status === 'accepted' && otherPhone && <a href={`tel:${otherPhone}`} className="p-2 bg-green-500 text-white rounded-full"><Phone size={16}/></a>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
            <div key={i} className={`flex ${m.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${m.senderId === currentUser.uid ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                    {m.text}
                </div>
            </div>
        ))}
        <div ref={dummy}></div>
      </div>

      {offer.status === 'pending' && currentUser.uid === offer.sitterId && (
          <div className="p-4 grid grid-cols-2 gap-4 border-t">
              <button onClick={() => handleStatus('declined')} className="p-4 bg-slate-100 rounded-xl font-bold text-xs uppercase">Refuser</button>
              <button onClick={() => handleStatus('accepted')} className="p-4 bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase">Accepter</button>
          </div>
      )}

      <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
          <input className="flex-1 p-4 rounded-xl bg-slate-50 text-slate-900 outline-none" placeholder="Message..." value={newMessage} onChange={e => setNewMessage(e.target.value)}/>
          <button className="p-4 bg-blue-600 text-white rounded-xl"><Send size={20}/></button>
      </form>
    </div>
  );
};

// AUTH
const AuthScreen = () => {
  const [isRegister, setRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPass] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("parent");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        if(isRegister) {
            const c = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, 'artifacts', appId, 'users', c.user.uid, 'settings', 'profile'), {
                uid: c.user.uid, name, role, email, avatarStyle: 'avataaars', createdAt: new Date().toISOString()
            });
        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
    } catch(e) { alert("Erreur: " + e.message); }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center p-6 bg-white text-slate-800">
        <SitFinderLogo className="mb-6 w-24 h-24"/>
        <h1 className="text-4xl font-black italic mb-8">SIT<span className="text-emerald-500">FINDER</span></h1>
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
            {isRegister && <input placeholder="Prénom" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold"/>}
            <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold"/>
            <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPass(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold"/>
            {isRegister && (
                <div className="flex gap-2">
                    <button type="button" onClick={() => setRole('parent')} className={`flex-1 p-3 rounded-xl font-bold text-xs uppercase ${role === 'parent' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100'}`}>Parent</button>
                    <button type="button" onClick={() => setRole('sitter')} className={`flex-1 p-3 rounded-xl font-bold text-xs uppercase ${role === 'sitter' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100'}`}>Sitter</button>
                </div>
            )}
            <button className="w-full p-5 bg-slate-900 text-white rounded-2xl font-black uppercase mt-4">{isRegister ? "Créer" : "Connexion"}</button>
        </form>
        <button onClick={() => setRegister(!isRegister)} className="mt-6 text-xs font-bold text-slate-400 uppercase underline">{isRegister ? "J'ai déjà un compte" : "Créer un compte"}</button>
    </div>
  );
};

// DASHBOARD
const Dashboard = ({ user, profile }) => {
    const [tab, setTab] = useState("home");
    const [sitters, setSitters] = useState([]);
    const [offers, setOffers] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [isDark, setDark] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedSitter, setSelectedSitter] = useState(null);

    useEffect(() => {
        const unsubS = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'sitters'), s => {
            setSitters(s.docs.map(d => ({id: d.id, ...d.data()})));
        });
        // REQUETE SECURISEE : ON NE CHARGE QUE MES OFFRES
        const qField = profile.role === 'parent' ? 'parentId' : 'sitterId';
        const unsubO = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'offers'), where(qField, '==', user.uid)), s => {
            setOffers(s.docs.map(d => ({id: d.id, ...d.data()})));
        });
        return () => { unsubS(); unsubO(); };
    }, [user.uid, profile.role]);

    const handleBooking = async (s, p, h) => {
        try {
            const ref = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'offers'), {
                parentId: user.uid, parentName: profile.name,
                sitterId: s.id, sitterName: s.name,
                price: p, hours: h, status: 'pending', createdAt: Timestamp.now(),
                lastMsg: `Offre : ${h}h à ${p}€/h`, lastMsgAt: Timestamp.now(), hasUnread: true, lastSenderId: user.uid
            });
            // AJOUTER LE PREMIER MESSAGE AVEC LES CLES DE SECURITE
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'offers', ref.id, 'messages'), {
                text: `Bonjour, je propose ${h}h à ${p}€/h.`, senderId: user.uid, createdAt: Timestamp.now(),
                parentId: user.uid, sitterId: s.id // CLE DE SECURITE
            });
            alert("Offre envoyée avec succès ! ✅");
            setSelectedSitter(null);
            setTab("messages");
        } catch(e) { 
            console.error(e);
            alert("Erreur lors de l'envoi : " + e.message); 
        }
    };

    if(activeChat) return <ChatRoom offer={activeChat} currentUser={user} onBack={() => setActiveChat(null)} isDark={isDark} />;
    if(tab === "settings") return <SettingsView user={user} profile={profile} onBack={() => setTab("home")} isDark={isDark} toggleDark={() => setDark(!isDark)}/>;

    return (
        <div className={`min-h-screen pb-24 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-800'}`}>
            <div className="p-6 flex justify-between items-center sticky top-0 bg-inherit z-10 border-b shadow-sm">
                <div className="flex items-center gap-2"><SitFinderLogo className="w-8 h-8"/> <span className="font-black italic text-xl">SITFINDER</span></div>
                <div className="flex gap-2">
                    <button onClick={() => setTab('settings')}><Settings/></button>
                    <button onClick={() => signOut(auth)}><LogOut/></button>
                </div>
            </div>

            <main className="p-6 space-y-6">
                {tab === "home" && profile.role === 'parent' && (
                    <>
                        <div className="relative">
                            <Search className="absolute left-4 top-4 text-slate-400"/>
                            <input className="w-full p-4 pl-12 rounded-2xl shadow-sm outline-none font-bold text-slate-800" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}/>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                            {sitters.filter(s => s.name?.toLowerCase().includes(search.toLowerCase())).map(s => (
                                <div key={s.id} className="p-6 bg-white rounded-[2rem] shadow-xl border text-slate-800">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-4">
                                            <img src={s.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.name}`} className="w-16 h-16 rounded-2xl bg-slate-100 object-cover"/>
                                            <div><h3 className="font-black text-xl">{s.name}</h3><RatingStars rating={s.rating || 5}/></div>
                                        </div>
                                        <span className="font-black text-emerald-600 text-xl">{s.price}€/h</span>
                                    </div>
                                    <button onClick={() => setSelectedSitter(s)} className="w-full p-4 bg-slate-900 text-white rounded-xl font-black uppercase text-xs">Voir Profil</button>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {(tab === "messages" || profile.role === 'sitter') && (
                    <div className="space-y-4">
                        <h2 className="font-black text-2xl italic uppercase">Discussions</h2>
                        {offers.length === 0 && <div className="p-10 text-center text-slate-400 font-bold border-2 border-dashed rounded-3xl">Aucune offre...</div>}
                        {offers.sort((a,b) => (b.lastMsgAt?.seconds || 0) - (a.lastMsgAt?.seconds || 0)).map(o => (
                            <div key={o.id} onClick={() => setActiveChat(o)} className="p-6 bg-white rounded-[2rem] shadow-lg border flex justify-between items-center cursor-pointer hover:bg-slate-50 text-slate-800">
                                <div>
                                    <h4 className="font-black text-lg">{profile.role === 'parent' ? o.sitterName : o.parentName}</h4>
                                    <p className="text-xs text-slate-400 font-bold">{o.lastMsg}</p>
                                </div>
                                {o.hasUnread && o.lastSenderId !== user.uid && <div className="w-3 h-3 bg-red-500 rounded-full"></div>}
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-2 rounded-full flex gap-2 shadow-2xl">
                <button onClick={() => setTab('home')} className={`p-4 rounded-full transition-all ${tab === 'home' ? 'bg-emerald-500' : 'hover:bg-white/10'}`}><Search/></button>
                <button onClick={() => setTab('messages')} className={`p-4 rounded-full transition-all ${tab === 'messages' ? 'bg-emerald-500' : 'hover:bg-white/10'}`}>
                    <div className="relative"><MessageSquare/>{offers.some(o => o.hasUnread && o.lastSenderId !== user.uid) && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900"></div>}</div>
                </button>
                <button onClick={() => setTab('profile')} className={`p-4 rounded-full transition-all ${tab === 'profile' ? 'bg-emerald-500' : 'hover:bg-white/10'}`}><User/></button>
            </div>

            {selectedSitter && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-[3rem] p-8 space-y-6 animate-in zoom-in text-slate-800">
                        <div className="flex justify-between">
                            <h2 className="text-3xl font-black italic">{selectedSitter.name}</h2>
                            <button onClick={() => setSelectedSitter(null)} className="p-2 bg-slate-100 rounded-full"><X/></button>
                        </div>
                        <div className="space-y-4">
                            <div><label className="text-xs font-bold text-slate-400 uppercase">Prix / Heure</label><input id="p" type="number" defaultValue={selectedSitter.price} className="w-full p-4 bg-slate-50 rounded-2xl font-black text-xl"/></div>
                            <div><label className="text-xs font-bold text-slate-400 uppercase">Nombre d'heures</label><input id="h" type="number" defaultValue="2" className="w-full p-4 bg-slate-50 rounded-2xl font-black text-xl"/></div>
                            <button onClick={() => handleBooking(selectedSitter, document.getElementById('p').value, document.getElementById('h').value)} className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black uppercase shadow-xl hover:bg-emerald-600 transition-all">Envoyer la demande</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function App() {
  const [init, setInit] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        onSnapshot(doc(db, 'artifacts', appId, 'users', u.uid, 'settings', 'profile'), (s) => setProfile(s.exists() ? s.data() : null));
      } else setProfile(null);
    });
    setTimeout(() => setInit(true), 2000);
    return () => unsub();
  }, []);

  if(!init) return <SplashScreen/>;
  if(!user) return <AuthScreen/>;
  if(!profile) return <div className="h-screen flex items-center justify-center">Chargement...</div>;
  return <Dashboard user={user} profile={profile}/>;
}
