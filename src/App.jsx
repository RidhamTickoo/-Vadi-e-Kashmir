// src/App.jsx
import React, { useState, useEffect } from 'react';
import {
  ShoppingBag, Menu, X, Search, Star, ChevronRight, MapPin, Instagram, Facebook, Twitter,
  CreditCard, CheckCircle, ShieldCheck, Truck, Package, FileText, Lock, AlertCircle, Phone, Mail
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

/* --------------------------
   .env helpers (REACT_APP_*)
   -------------------------- */
const getFirebaseConfig = () => {
  try {
    const raw = process.env.REACT_APP_FIREBASE_CONFIG;
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse REACT_APP_FIREBASE_CONFIG', e);
    return {};
  }
};
const getAuthToken = () => process.env.REACT_APP_INITIAL_AUTH_TOKEN || null;
const getAppId = () => process.env.REACT_APP_APP_ID || 'default-vadiekashmir-app';

/* --------------------------
   Firebase globals
   -------------------------- */
let app, db, auth;
const firebaseConfig = getFirebaseConfig();
const initialAuthToken = getAuthToken();
const currentAppId = getAppId();

/* --------------------------
   PRODUCTS (mock)
   -------------------------- */
const PRODUCTS = [
  { id: 1, name: "Royal Pashmina Shawl", category: "Textiles", price: 12500, rating: 5.0, reviews: 128, image: "https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&q=80&w=1200", description: "Hand-spun authentic Changthangi wool, woven by master artisans in Srinagar." },
  { id: 2, name: "Pampore Mogra Saffron (5g)", category: "Spices", price: 1850, rating: 4.9, reviews: 342, image: "https://images.unsplash.com/photo-1615485500704-3e995f827d51?auto=format&fit=crop&q=80&w=1200", description: "Deep crimson threads with potent aroma, harvested in Pampore." },
  { id: 3, name: "Authentic Kalari Cheese", category: "Food", price: 850, rating: 4.8, reviews: 89, image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&q=80&w=1200", description: "Traditional ripened cheese from the hills." },
  { id: 4, name: "Kagzi Walnuts (1kg)", category: "Dry Fruits", price: 1200, rating: 4.7, reviews: 210, image: "https://images.unsplash.com/photo-1596309480526-f8c2459066c1?auto=format&fit=crop&q=80&w=1200", description: "Premium soft-shell walnuts rich in Omega-3." },
  { id: 5, name: "Papier-Mâché Box", category: "Art", price: 3500, rating: 4.6, reviews: 56, image: "https://images.unsplash.com/photo-1685598426340-c21770271692?auto=format&fit=crop&q=80&w=1200", description: "Intricate floral hand-painting (Naqashi) on paper pulp." },
  { id: 6, name: "Kashmiri Kahwa Tea Mix", category: "Beverages", price: 650, rating: 4.8, reviews: 450, image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=1200", description: "Aromatic green tea blended with saffron, cardamom, and cinnamon." },
  { id: 7, name: "Mamra Almonds (500g)", category: "Dry Fruits", price: 1600, rating: 4.9, reviews: 112, image: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&q=80&w=1200", description: "Concave shaped premium almonds direct from Pulwama." },
  { id: 8, name: "Copper Samovar", category: "Art", price: 8500, rating: 5.0, reviews: 45, image: "https://images.unsplash.com/photo-1590490571989-5b199033915d?auto=format&fit=crop&q=80&w=1200", description: "Traditional engraved copper kettle used for brewing Kahwa." },
  { id: 9, name: "Kashmiri Red Chillies", category: "Spices", price: 450, rating: 4.7, reviews: 320, image: "https://images.unsplash.com/photo-1596386967235-3d870259f003?auto=format&fit=crop&q=80&w=1200", description: "Brilliant red color and mild heat." },
  { id: 10, name: "Namda Felt Rug (3x5)", category: "Textiles", price: 4200, rating: 4.5, reviews: 28, image: "https://images.unsplash.com/photo-1596139676037-5489c7826df2?auto=format&fit=crop&q=80&w=1200", description: "Woolen felt rug with Aari work." },
  { id: 11, name: "Organic Saffron Honey", category: "Food", price: 950, rating: 4.8, reviews: 150, image: "https://images.unsplash.com/photo-1587049359509-b785db362934?auto=format&fit=crop&q=80&w=1200", description: "Pure Himalayan honey infused with authentic saffron strands." },
  { id: 12, name: "Willow Wicker Basket", category: "Art", price: 1200, rating: 4.6, reviews: 67, image: "https://images.unsplash.com/photo-1622277070962-1855169cb10d?auto=format&fit=crop&q=80&w=1200", description: "Hand-woven willow basket perfect for home decor." }
];

/* --------------------------
   Small UI bits
   -------------------------- */
const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, type = 'button' }) => {
  const base = "px-6 py-3 rounded-lg transition-all duration-300 font-medium tracking-wide flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-amber-700 text-white hover:bg-amber-800 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed",
    outline: "border-2 border-amber-700 text-amber-700 hover:bg-amber-50",
    ghost: "text-stone-600 hover:text-amber-700 hover:bg-amber-50/50"
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant] || variants.primary} ${className}`}>
      {children}
    </button>
  );
};

const SectionTitle = ({ title, subtitle }) => (
  <div className="text-center mb-12">
    <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-800 mb-3">{title}</h2>
    <div className="w-24 h-1 bg-amber-600 mx-auto mb-4"></div>
    <p className="text-stone-600 max-w-2xl mx-auto">{subtitle}</p>
  </div>
);

/* --------------------------
   Auth pages: Login / Signup / Reset
   -------------------------- */
const AuthPage = ({ mode = 'login', onSuccess = () => {} }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const providerGoogle = new GoogleAuthProvider();

  const ensureAuth = () => {
    try {
      if (!auth && app) auth = getAuth(app);
      return auth;
    } catch (e) {
      console.error('Auth ensure error', e);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e && e.preventDefault();
    setError(null);
    if (!email) return setError('Please enter an email');
    if (mode !== 'reset' && !password) return setError('Please enter a password');
    setBusy(true);
    try {
      const a = ensureAuth();
      if (!a) throw new Error('Auth not initialized');
      if (mode === 'login') {
        await signInWithEmailAndPassword(a, email, password);
      } else if (mode === 'signup') {
        await createUserWithEmailAndPassword(a, email, password);
      } else if (mode === 'reset') {
        await sendPasswordResetEmail(a, email);
      }
      onSuccess();
    } catch (err) {
      setError(err.message || 'Authentication error');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError(null); setBusy(true);
    try {
      const a = ensureAuth();
      if (!a) throw new Error('Auth not initialized');
      await signInWithPopup(a, providerGoogle);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg overflow-hidden grid md:grid-cols-2">
        <div className="p-8">
          <h2 className="text-3xl font-serif font-bold text-stone-800 mb-2">
            {mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Reset password' : 'Sign in'}
          </h2>
          <p className="text-sm text-stone-500 mb-6">Access your saved cart, track orders and more.</p>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-amber-200 outline-none" required />
            {mode !== 'reset' && <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (min 6 chars)" type="password" className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-amber-200 outline-none" minLength={6} required={mode !== 'reset'} />}
            <div className="flex gap-3 items-center">
              <Button type="submit" disabled={busy}>{busy ? 'Please wait...' : (mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset email' : 'Sign in')}</Button>
              <button type="button" onClick={handleGoogle} className="px-4 py-2 border rounded w-full text-sm">Continue with Google</button>
            </div>
          </form>

          <div className="text-sm text-stone-500 mt-4">
            {mode === 'signup' ? (
              <p>Already have an account? <a href="#login" className="text-amber-600" onClick={(e)=>{e.preventDefault(); window.location.hash='login'; window.location.reload();}}>Sign in</a></p>
            ) : mode === 'reset' ? (
              <p>Remembered? <a href="#login" className="text-amber-600" onClick={(e)=>{e.preventDefault(); window.location.hash='login'; window.location.reload();}}>Sign in</a></p>
            ) : (
              <p>New? <a href="#signup" className="text-amber-600" onClick={(e)=>{e.preventDefault(); window.location.hash='signup'; window.location.reload();}}>Create an account</a></p>
            )}
          </div>
        </div>

        <div className="hidden md:flex items-center justify-center bg-amber-700 text-white p-8">
          <div className="max-w-xs text-center">
            <h3 className="text-2xl font-bold mb-2">Welcome to Vadi-e-Kashmir</h3>
            <p className="text-sm mb-4">Discover authentic Pashmina, saffron, and handcrafted treasures from the valley.</p>
            <div className="mt-6 text-xs space-y-3">
              <div className="flex items-start gap-3"><CheckCircle size={18} className="inline-block mr-2" />Secure payments</div>
              <div className="flex items-start gap-3"><Truck size={18} className="inline-block mr-2" />Fast shipping</div>
              <div className="flex items-start gap-3"><ShieldCheck size={18} className="inline-block mr-2" />Verified artisans</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* --------------------------
   Product card & cart drawer
   -------------------------- */
const ProductCard = ({ product, onAdd }) => (
  <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-stone-100 flex flex-col h-full">
    <div className="relative h-56 overflow-hidden">
      <img src={product.image} alt={product.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold text-amber-700 shadow-sm">{product.category}</div>
    </div>
    <div className="p-5 flex flex-col flex-grow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-serif font-bold text-stone-800 group-hover:text-amber-700 transition-colors">{product.name}</h3>
        <div className="flex items-center gap-1 text-amber-500 text-sm font-medium"><Star size={14} /> <span>{product.rating}</span></div>
      </div>
      <p className="text-stone-500 text-sm mb-4 line-clamp-2 flex-grow">{product.description}</p>
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-stone-100">
        <span className="text-xl font-bold text-stone-900">₹{product.price.toLocaleString()}</span>
        <button onClick={() => onAdd(product)} className="p-2 rounded-full bg-stone-100 hover:bg-amber-700 hover:text-white transition-colors"><ShoppingBag size={20} /></button>
      </div>
    </div>
  </div>
);

const CartDrawer = ({ isOpen, onClose, cart, onRemove, onUpdateQty, onCheckout }) => {
  const total = cart.reduce((s,i) => s + i.price * i.quantity, 0);
  return (
    <>
      <div className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div className={`fixed top-0 right-0 h-full w-full md:w-96 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-stone-50">
            <h2 className="text-xl font-serif font-bold text-stone-800">Your Treasure Chest</h2>
            <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full transition-colors"><X size={20} /></button>
          </div>
          <div className="flex-grow overflow-y-auto p-5 space-y-6">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-stone-400 space-y-4">
                <ShoppingBag size={64} opacity={0.2} />
                <p>Your cart is empty.</p>
                <button onClick={() => { onClose(); }} className="text-amber-700 font-medium hover:underline">Start Exploring</button>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex gap-4">
                  <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg border border-stone-100" />
                  <div className="flex-grow">
                    <h4 className="font-medium text-stone-800 line-clamp-1">{item.name}</h4>
                    <p className="text-amber-700 font-bold text-sm">₹{item.price.toLocaleString()}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-stone-200 rounded-md">
                        <button onClick={() => onUpdateQty(item.id, Math.max(1, item.quantity - 1))} className="px-2 py-1 hover:bg-stone-100 text-stone-600">-</button>
                        <span className="px-2 text-sm font-medium">{item.quantity}</span>
                        <button onClick={() => onUpdateQty(item.id, item.quantity + 1)} className="px-2 py-1 hover:bg-stone-100 text-stone-600">+</button>
                      </div>
                      <button onClick={() => onRemove(item.id)} className="text-red-400 hover:text-red-600 text-xs underline">Remove</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {cart.length > 0 && (
            <div className="p-5 border-t border-stone-100 bg-stone-50">
              <div className="flex justify-between mb-4 text-lg font-bold text-stone-800"><span>Subtotal</span><span>₹{total.toLocaleString()}</span></div>
              <p className="text-xs text-stone-500 mb-4 text-center">Shipping & taxes calculated at checkout</p>
              <Button onClick={onCheckout} className="w-full">Proceed to Checkout</Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

/* --------------------------
   TrackOrder & Legal pages
   -------------------------- */
const TrackOrder = () => {
  const [orderId, setOrderId] = useState(''); const [status, setStatus] = useState(null); const [loading, setLoading] = useState(false); const [error, setError] = useState(null);
  const handleTrack = (e) => { e.preventDefault(); setError(null); if (!orderId) { setError('Please enter order ID'); return; } setLoading(true); setTimeout(()=>{ setLoading(false); const n = parseInt(orderId.replace(/\D/g,''),10) || 0; setStatus(n%3===0?'delivered': n%3===1?'shipped':'processing'); },1200); };
  const steps = [
    { id:'placed', title:'Order Placed', time:'Oct 18, 2025 • 10:42 AM', icon: CheckCircle },
    { id:'processing', title:'Processing', time:'Items being packed in Srinagar.', icon: Package },
    { id:'shipped', title:'Shipped', time:'Handover to courier service (Tracking #: AB123456789IN).', icon: Truck },
    { id:'delivered', title:'Delivered', time:'Expected by Oct 24, 2025', icon: MapPin }
  ];
  const getTimeline = (s) => {
    const idx = steps.findIndex(x=>x.id===s);
    return steps.map((step,i)=> {
      const done = i<=idx; const active = i===idx;
      return (
        <div key={step.id} className="flex gap-4 items-start">
          <div className="w-8 h-8 rounded-full flex items-center justify-center z-10">
            <step.icon size={16} className={`w-8 h-8 p-1.5 rounded-full text-white ${done ? 'bg-amber-600' : 'bg-stone-200'}`} />
          </div>
          <div>
            <h4 className={`font-bold ${done ? 'text-stone-800':'text-stone-400'}`}>{step.title}</h4>
            <p className="text-xs text-stone-500">{step.time}</p>
          </div>
        </div>
      );
    });
  };
  return (
    <div className="py-12 container mx-auto px-4 max-w-2xl">
      <SectionTitle title="Track Your Order" subtitle="Enter your Order ID to check the status of your shipment." />
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-stone-100">
        <form onSubmit={handleTrack} className="flex flex-col md:flex-row gap-4 mb-4">
          <input value={orderId} onChange={e=>setOrderId(e.target.value)} className="flex-grow px-4 py-3 rounded-lg border border-stone-300" placeholder="e.g., ORD-7829-XJ" required />
          <Button type="submit" disabled={loading}>{loading ? 'Locating...' : 'Track'}</Button>
        </form>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center gap-2"><AlertCircle size={18} /><span>{error}</span></div>}
        {status && <div className="border-t border-stone-100 pt-8"><div className="flex justify-between items-center mb-8"><div><p className="text-sm text-stone-500">Order ID</p><p className="font-bold text-stone-800">{orderId}</p></div><div><p className="text-sm text-stone-500">Expected Status</p><p className={`font-bold ${status==='delivered'?'text-green-600':'text-amber-700'}`}>{status.toUpperCase()}</p></div></div><div className="relative"><div className="absolute left-4 top-0 bottom-0 w-0.5 bg-stone-200 ml-4"></div><div className="space-y-8 relative">{getTimeline(status)}</div></div></div>}
      </div>
    </div>
  );
};

const LegalPage = ({ type }) => {
  const content = {
    privacy: { title: "Privacy Policy", icon: Lock, text: (<div className="space-y-6 text-stone-600"><p><strong>Effective Date: November 21, 2025</strong><br/>We use Firestore to persist cart data. We do not store payment card details.</p></div>) },
    terms: { title: "Terms of Service", icon: FileText, text: (<div className="space-y-6 text-stone-600"><p><strong>Last Updated: November 21, 2025</strong></p></div>) }
  };
  const data = content[type] || content.privacy;
  return (
    <div className="py-12 container mx-auto px-4 md:px-6 max-w-4xl">
      <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-stone-100">
        <h1 className="text-3xl font-serif font-bold text-stone-800 mb-6 pb-4 border-b border-stone-100 flex items-center gap-3"><data.icon size={28} className="text-amber-700" />{data.title}</h1>
        <div className="prose prose-stone max-w-none">{data.text}</div>
      </div>
    </div>
  );
};

/* --------------------------
   Main App
   -------------------------- */
export default function App() {
  const [view, setView] = useState('home'); // home, shop, track, about, auth:login/signup/reset, privacy, terms
  const [activeCategory, setActiveCategory] = useState('All');

  // cart
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // auth
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userObj, setUserObj] = useState(null);
  const [cartLoading, setCartLoading] = useState(true);

  // payment
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // initialize Firebase once
  useEffect(() => {
    if (!firebaseConfig || Object.keys(firebaseConfig).length === 0) {
      console.warn('Firebase config missing. Running in anonymous/local mode.');
      setIsAuthReady(true);
      setCartLoading(false);
      return;
    }
    try {
      if (!app) app = initializeApp(firebaseConfig);
      if (!db) db = getFirestore(app);
      if (!auth) auth = getAuth(app);

      const unsubscribe = onAuthStateChanged(auth, async (u) => {
        if (u) {
          setUserObj(u);
        } else {
          try {
            if (initialAuthToken) {
              await signInWithCustomToken(auth, initialAuthToken);
            } else {
              await signInAnonymously(auth);
            }
            setUserObj(auth.currentUser || null);
          } catch (err) {
            console.error('Auth fallback error', err);
            setUserObj(null);
          }
        }
        setIsAuthReady(true);
      });

      return () => unsubscribe();
    } catch (e) {
      console.error('Firebase init failed', e);
      setIsAuthReady(true);
      setCartLoading(false);
    }
  }, []);

  // Firestore cart listener when we have a valid user
  useEffect(() => {
    if (!isAuthReady || !userObj || !db) { if (isAuthReady) setCartLoading(false); return; }
    const cartDocPath = `artifacts/${currentAppId}/users/${userObj.uid}/carts/currentCart`;
    const cartRef = doc(db, cartDocPath);
    const unsubscribe = onSnapshot(cartRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.items) {
          try {
            setCart(data.items.map(i => ({ ...i, price: Number(i.price), quantity: Number(i.quantity) })));
          } catch (err) { console.error('Parse cart error', err); }
        }
      }
      setCartLoading(false);
    }, (err) => { console.error('Cart listener error', err); setCartLoading(false); });
    return () => unsubscribe();
  }, [isAuthReady, userObj]);

  const saveCartToFirestore = async (currentCart) => {
    if (!userObj || !db) return;
    const cartDocPath = `artifacts/${currentAppId}/users/${userObj.uid}/carts/currentCart`;
    const cartRef = doc(db, cartDocPath);
    const payload = { items: currentCart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, image: i.image })), updatedAt: new Date().toISOString() };
    try { await setDoc(cartRef, payload); } catch (err) { console.error('Save cart error', err); }
  };

  useEffect(() => {
    if (isAuthReady && !cartLoading) saveCartToFirestore(cart);
  }, [cart, isAuthReady, cartLoading, currentAppId]);

  // cart actions
  const addToCart = (product) => setCart(prev => {
    const existing = prev.find(i => i.id === product.id);
    if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
    return [...prev, { ...product, quantity: 1 }];
  });

  const updateQty = (id, qty) => setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((s,i) => s + i.quantity, 0);

  // checkout simulation
  const handleCheckout = () => {
    if (cart.length === 0) return;
    setIsCartOpen(false); setIsProcessing(true);
    setTimeout(() => { setOrderSuccess(true); setIsProcessing(false); clearCart(); }, 2000);
  };

  // auth actions
  const handleLogout = async () => {
    try {
      if (!auth && app) auth = getAuth(app);
      if (!auth) throw new Error('Auth not initialized');
      await signOut(auth);
      setUserObj(null);
      try { await signInAnonymously(getAuth(app)); } catch {}
    } catch (err) { console.error('Logout error', err); }
  };

  // route hash handling for auth pages
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'login' || hash === 'signup' || hash === 'reset') {
      setView('auth:' + hash);
    }
  }, []);

  // page lists
  const categories = ['All', ...new Set(PRODUCTS.map(p => p.category))];
  const filteredProducts = activeCategory === 'All' ? PRODUCTS : PRODUCTS.filter(p => p.category === activeCategory);

  // When nav/footer links are clicked they call setView('...')

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 selection:bg-amber-200 flex flex-col">
      {/* NAV */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="container mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
            <div className="w-10 h-10 bg-amber-700 rounded-tr-xl rounded-bl-xl flex items-center justify-center text-white"><span className="font-serif text-xl font-bold">V</span></div>
            <div>
              <h1 className="font-serif text-xl font-bold text-stone-900 leading-none">Vadi-e-Kashmir</h1>
              <p className="text-[10px] tracking-widest text-amber-700 uppercase">Art of Himalayas</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 font-medium text-stone-600">
            <button onClick={() => setView('home')} className={`hover:text-amber-700 ${view==='home'?'text-amber-700':''}`}>Home</button>
            <button onClick={() => setView('shop')} className={`hover:text-amber-700 ${view==='shop'?'text-amber-700':''}`}>Shop</button>
            <button onClick={() => setView('track')} className={`hover:text-amber-700 ${view==='track'?'text-amber-700':''}`}>Track Order</button>
            <button onClick={() => setView('about')} className={`hover:text-amber-700 ${view==='about'?'text-amber-700':''}`}>Our Story</button>
          </div>

          <div className="flex items-center gap-4">
            <button className="hidden md:block p-2 hover:bg-stone-100 rounded-full text-stone-600 transition-colors" onClick={() => setView('shop')}><Search size={20} /></button>

            <button onClick={() => setIsCartOpen(true)} className="relative p-2 hover:bg-stone-100 rounded-full text-stone-600 transition-colors">
              <ShoppingBag size={20} />
              {cartCount > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full">{cartCount}</span>}
            </button>

            {!userObj ? (
              <div className="hidden md:flex items-center gap-2">
                <button onClick={() => { setView('auth:login'); window.location.hash='login'; }} className="px-4 py-2 rounded-full border border-amber-700 text-amber-700 hover:bg-amber-50">Login</button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-700 text-white flex items-center justify-center font-bold">{(userObj.displayName || userObj.email || userObj.uid || 'U')[0].toUpperCase()}</div>
                <div className="text-sm text-stone-700">
                  <div className="font-medium">{userObj.displayName || (userObj.email ? userObj.email.split('@')[0] : 'User')}</div>
                  <div className="text-xs text-stone-500">{userObj.email || userObj.uid}</div>
                </div>
                <button onClick={handleLogout} className="px-3 py-2 rounded bg-stone-100 hover:bg-stone-200">Logout</button>
              </div>
            )}

            <button className="md:hidden p-2 hover:bg-stone-100 rounded-full text-stone-600" onClick={() => setView(v => v)}><Menu size={20} /></button>
          </div>
        </div>
      </nav>

      {/* MAIN */}
      <main className="flex-grow">
        {cartLoading && isAuthReady && <div className="fixed inset-0 z-[60] bg-stone-50/80 flex items-center justify-center backdrop-blur-sm"><div className="w-10 h-10 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div><p className="ml-4 text-stone-600 font-medium">Loading your saved cart...</p></div>}
        {isProcessing && <div className="fixed inset-0 z-[70] bg-black/70 flex flex-col items-center justify-center text-white backdrop-blur-sm"><div className="w-16 h-16 border-4 border-white/30 border-t-amber-500 rounded-full animate-spin mb-4"></div><p className="text-lg font-bold animate-pulse">Processing Payment Securely...</p></div>}
        {orderSuccess && <div className="fixed inset-0 z-[70] bg-white flex flex-col items-center justify-center text-center p-4 animate-in fade-in duration-500"><div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6 shadow-lg animate-bounce"><CheckCircle size={48} /></div><h2 className="text-4xl font-serif font-bold text-stone-800 mb-2">Payment Successful!</h2><p className="text-stone-500 max-w-md mb-8">Your order has been placed successfully.</p><div className="flex gap-4"><Button onClick={() => { setOrderSuccess(false); setView('track'); }}>Track Order</Button><Button variant="outline" onClick={() => { setOrderSuccess(false); setView('home'); }}>Back to Home</Button></div></div>}

        {view === 'home' && (
          <>
            <section className="relative h-[70vh] flex items-center overflow-hidden">
              <div className="absolute inset-0 z-0">
                <img src="https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=2000" alt="Kashmir mountains" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30"></div>
              </div>
              <div className="container mx-auto px-4 md:px-6 relative z-10 text-white text-center md:text-left">
                <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4">The Soul of <span className="text-amber-400">Kashmir</span></h1>
                <p className="text-lg md:text-xl text-stone-200 mb-8 max-w-lg">Shop authentic Pashmina, the finest saffron, and handmade crafts directly from the artisans of the Himalayas.</p>
                <div className="flex gap-4 justify-center md:justify-start">
                  <Button onClick={() => setView('shop')}>Explore Collections</Button>
                  <Button variant="outline" className="border-white text-white hover:bg-white hover:text-stone-900" onClick={() => setView('about')}>Our Heritage</Button>
                </div>
              </div>
            </section>

            <section className="py-16 container mx-auto px-4 md:px-6">
              <SectionTitle title="Featured Collections" subtitle="Handpicked artisan products and regional specialties." />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div onClick={() => setView('shop')} className="cursor-pointer group relative rounded-xl overflow-hidden h-64 shadow-lg">
                  <img src="https://images.unsplash.com/photo-1606293926249-ed2297699f40?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Pashmina" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 flex items-end p-6 text-white">
                    <div><h3 className="text-2xl font-serif font-bold">Pashmina</h3><p className="text-sm opacity-90">Soft gold from Changthangi goats.</p></div>
                  </div>
                </div>

                <div onClick={() => setView('shop')} className="cursor-pointer group relative rounded-xl overflow-hidden h-64 shadow-lg">
                  <img src="https://images.unsplash.com/photo-1615485290386-254d519dc75b?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Saffron" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 flex items-end p-6 text-white">
                    <div><h3 className="text-2xl font-serif font-bold">Pampore Saffron</h3><p className="text-sm opacity-90">Red threads with powerful aroma.</p></div>
                  </div>
                </div>

                <div onClick={() => setView('shop')} className="cursor-pointer group relative rounded-xl overflow-hidden h-64 shadow-lg">
                  <img src="https://images.unsplash.com/photo-1605218427368-35b06144b5d5?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Handicrafts" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 flex items-end p-6 text-white">
                    <div><h3 className="text-2xl font-serif font-bold">Handicrafts</h3><p className="text-sm opacity-90">Paper-mâché, wood carving & more.</p></div>
                  </div>
                </div>
              </div>
            </section>

            <section className="py-12 container mx-auto px-4 md:px-6">
              <SectionTitle title="Why Shop With Us?" subtitle="Quality, authenticity, and traceability, directly from local artisans." />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm text-center">
                  <div className="w-14 h-14 rounded-full bg-amber-100 inline-flex items-center justify-center mb-4"><CheckCircle className="text-amber-700" size={22} /></div>
                  <h4 className="font-bold mb-2">Verified Artisans</h4>
                  <p className="text-sm text-stone-500">We verify each artisan and maintain fair pricing and provenance.</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm text-center">
                  <div className="w-14 h-14 rounded-full bg-amber-100 inline-flex items-center justify-center mb-4"><ShieldCheck className="text-amber-700" size={22} /></div>
                  <h4 className="font-bold mb-2">Secure Checkout</h4>
                  <p className="text-sm text-stone-500">Payments are secure and PCI-compliant via trusted providers.</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm text-center">
                  <div className="w-14 h-14 rounded-full bg-amber-100 inline-flex items-center justify-center mb-4"><Truck className="text-amber-700" size={22} /></div>
                  <h4 className="font-bold mb-2">Reliable Delivery</h4>
                  <p className="text-sm text-stone-500">We partner with reliable couriers to deliver nationwide.</p>
                </div>
              </div>
            </section>
          </>
        )}

        {view === 'shop' && (
          <section className="py-12 container mx-auto px-4 md:px-6 min-h-screen">
            <div className="mb-10">
              <h2 className="text-4xl font-serif font-bold text-stone-800 mb-6">Shop Collections</h2>
              <div className="flex flex-wrap gap-2 mb-6">
                {categories.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-full text-sm font-medium ${activeCategory === cat ? 'bg-amber-700 text-white' : 'bg-white text-stone-600 border'}`}>{cat}</button>
                ))}
                <div className="ml-auto text-sm text-stone-500 flex items-center gap-2"><ChevronRight size={16} /> Filter and sort coming soon</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} onAdd={(p) => { addToCart(p); setIsCartOpen(true); }} />
              ))}
            </div>
          </section>
        )}

        {view === 'track' && <TrackOrder />}

        {view === 'about' && (
          <section className="py-20 bg-white">
            <div className="container mx-auto px-4 md:px-6 max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-800 mb-6">Our Story</h1>
              <p className="text-lg text-stone-600 mb-6">Vadi-e-Kashmir started as a simple idea: give the artisans of the valley a fair way to reach collectors and customers worldwide. We value authenticity, traceability, and sustainable craft — every product we sell is either GI-tagged, certified, or hand-verified by our local partners in Srinagar.</p>
              <h3 className="text-xl font-bold mb-2">Community & Fair Trade</h3>
              <p className="text-stone-600 mb-4">We work with cooperative groups and small family workshops; fair prices and long-term partnerships are at the heart of what we do.</p>
              <h3 className="text-xl font-bold mb-2">Sustainability</h3>
              <p className="text-stone-600 mb-4">From packaging to courier choices, we prioritize low-impact options where possible and educate artisans about sustainable practices.</p>
              <blockquote className="border-l-4 border-amber-600 pl-4 italic text-stone-700 mt-6">"Each product carries a story — we’re only the bridge connecting that story to you."</blockquote>
            </div>
          </section>
        )}

        {view === 'privacy' && <LegalPage type="privacy" />}
        {view === 'terms' && <LegalPage type="terms" />}
      </main>

      {/* FOOTER */}
      <footer className="bg-stone-900 text-stone-400 py-16 border-t border-stone-800">
        <div className="container mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <h2 className="font-serif text-2xl text-white mb-6">Vadi-e-Kashmir</h2>
            <p className="text-sm mb-6">Bringing the rarest treasures of the Himalayas to the world. Authentic, ethical, premium.</p>
            <div className="flex gap-4">
              <button className="w-8 h-8 bg-stone-800 rounded-full flex items-center justify-center hover:bg-amber-700 transition-colors" onClick={() => window.open('https://instagram.com','_blank')}><Instagram size={16} /></button>
              <button className="w-8 h-8 bg-stone-800 rounded-full flex items-center justify-center hover:bg-amber-700 transition-colors" onClick={() => window.open('https://facebook.com','_blank')}><Facebook size={16} /></button>
              <button className="w-8 h-8 bg-stone-800 rounded-full flex items-center justify-center hover:bg-amber-700 transition-colors" onClick={() => window.open('https://twitter.com','_blank')}><Twitter size={16} /></button>
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold mb-6">Quick Links</h3>
            <ul className="space-y-3 text-sm">
              <li className="hover:text-amber-500 cursor-pointer" onClick={() => setView('home')}>Home</li>
              <li className="hover:text-amber-500 cursor-pointer" onClick={() => setView('shop')}>Shop All</li>
              <li className="hover:text-amber-500 cursor-pointer" onClick={() => setView('about')}>Our Story</li>
              <li className="hover:text-amber-500 cursor-pointer" onClick={() => setView('track')}>Track Order</li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-6">Legal</h3>
            <ul className="space-y-3 text-sm">
              <li className="hover:text-amber-500 cursor-pointer" onClick={() => setView('privacy')}>Privacy Policy</li>
              <li className="hover:text-amber-500 cursor-pointer" onClick={() => setView('terms')}>Terms of Service</li>
              <li className="hover:text-amber-500 cursor-pointer">Shipping Policy</li>
              <li className="hover:text-amber-500 cursor-pointer">Return Policy</li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-6">Contact</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3"><MapPin size={18} className="text-amber-600 mt-1 flex-shrink-0" /><span>Main Bazaar, Residency Road,<br/>Srinagar, Jammu & Kashmir<br/>Pin: 190001</span></li>
              <li className="flex items-start gap-3"><Phone size={18} className="text-amber-600 mt-1 flex-shrink-0" /><span>+91 194 245 1234</span></li>
              <li className="flex items-start gap-3"><Mail size={18} className="text-amber-600 mt-1 flex-shrink-0" /><span>hello@vadiekashmir.com</span></li>
            </ul>

            {userObj && (
              <div className='mt-6 text-xs bg-stone-800 p-2 rounded'>
                <p className='text-amber-400'>User ID (Persistence)</p>
                <p className='truncate'>{userObj.uid}</p>
              </div>
            )}
          </div>
        </div>

        <div className="container mx-auto px-4 md:px-6 mt-12 pt-8 border-t border-stone-800 text-center text-xs flex flex-col md:flex-row justify-between items-center gap-4">
          <p>&copy; {new Date().getFullYear()} Vadi-e-Kashmir. All Rights Reserved.</p>
          <div className="flex gap-4 text-xs">
            <span>FSSAI License No: 11021456000123</span>
            <span>•</span>
            <span>Craft Council Certified</span>
          </div>
        </div>
      </footer>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cart={cart} onRemove={removeFromCart} onUpdateQty={updateQty} onCheckout={handleCheckout} />
    </div>
  );
}
