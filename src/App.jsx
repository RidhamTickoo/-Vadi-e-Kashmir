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

// NEW SECTIONCONTENT COMPONENT
const SectionContent = ({ title, icon, children }) => (
  <div className="py-12 container mx-auto px-4 md:px-6 max-w-4xl">
    <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-stone-100">
      <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-800 mb-6 pb-4 border-b border-stone-100 flex items-center gap-3">
        {icon && React.createElement(icon, { size: 30, className: "text-amber-700 flex-shrink-0" })}
        {title}
      </h1>
      <div className="prose prose-stone max-w-none text-stone-600 leading-relaxed space-y-6">
        {children}
      </div>
    </div>
  </div>
);


const LegalPage = ({ type }) => {
  const content = {
    privacy: { 
      title: "Privacy Policy", icon: Lock, 
      text: (
        <>
          <p><strong>Effective Date: November 24, 2025</strong></p>
          <p>At Vadi-e-Kashmir, we are committed to protecting your privacy and ensuring a secure shopping experience. This policy explains what information we collect, how we use it, and how we keep it safe.</p>

          <h2 className='text-2xl font-bold pt-4 text-stone-800'>1. Information We Collect</h2>
          <ul>
            <li><strong>Personal Information (Direct):</strong> When you register, purchase, or contact us, we collect your name, email address, shipping address, and phone number.</li>
            <li><strong>Payment Information:</strong> We do NOT store your full credit card details. All payment processing is handled securely by PCI-compliant third-party providers (like Stripe or Razorpay). We only receive transaction confirmation and the last four digits of your card.</li>
            <li><strong>Cart Data:</strong> We use **Firebase Firestore** to securely store your active cart contents, which is tied to your unique user ID. This allows your cart to persist across devices and sessions.</li>
            <li><strong>Usage Data:</strong> We collect anonymous data about how you use the site (e.g., pages viewed, time spent) to improve our service.</li>
          </ul>

          <h2 className='text-2xl font-bold pt-4 text-stone-800'>2. How We Use Your Information</h2>
          <p>Your information is used strictly for:</p>
          <ul>
            <li>Processing your orders and managing deliveries.</li>
            <li>Communicating order updates, tracking information, and customer service responses.</li>
            <li>Securing and maintaining your account and providing the seamless shopping experience (via Firebase Auth and Firestore).</li>
            <li>Marketing, only if you explicitly opt-in for newsletters.</li>
          </ul>

          <h2 className='text-2xl font-bold pt-4 text-stone-800'>3. Data Security and Storage</h2>
          <p>We take security seriously. Your data is stored on Google's **Firebase platform**, which provides industry-leading security and compliance. Access to your personal information is strictly limited to authorized personnel who need the data to perform their job (e.g., fulfilling your order).</p>
          
          <h2 className='text-2xl font-bold pt-4 text-stone-800'>4. Your Choices</h2>
          <p>You can always access or update your account information. If you wish to close your account and have your data permanently deleted, please contact us at support@vadiekashmir.com.</p>
        </>
      )
    },
    terms: { 
      title: "Terms of Service", icon: FileText, 
      text: (
        <>
          <p><strong>Last Updated: November 24, 2025</strong></p>
          <p>Welcome to Vadi-e-Kashmir. By accessing and using our website, you agree to comply with and be bound by the following terms and conditions.</p>

          <h2 className='text-2xl font-bold pt-4 text-stone-800'>1. Acceptance of Terms</h2>
          <p>These Terms of Service govern your use of the Vadi-e-Kashmir platform and all services provided by us. If you disagree with any part of the terms, then you may not access the service.</p>

          <h2 className='text-2xl font-bold pt-4 text-stone-800'>2. Product Authenticity and Pricing</h2>
          <p>We guarantee the authenticity of all products sold, which are sourced directly from verified Kashmiri artisans. Prices are listed in INR (₹) and are subject to change without prior notice. The price charged will be the one displayed at the time of checkout.</p>
          
          <h2 className='text-2xl font-bold pt-4 text-stone-800'>3. User Accounts</h2>
          <p>You are responsible for maintaining the confidentiality of your account and password and for restricting access to your devices. You agree to accept responsibility for all activities that occur under your account.</p>

          <h2 className='text-2xl font-bold pt-4 text-stone-800'>4. Limitation of Liability</h2>
          <p>Vadi-e-Kashmir, its employees, or affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service.</p>
        </>
      )
    },
    shipping: {
      title: "Shipping & Delivery Policy", icon: Truck,
      text: (
        <>
          <p><strong>Commitment:</strong> We are dedicated to ensuring your authentic treasures from the valley reach you safely and efficiently. Due to the specialized nature of our products and our direct sourcing model from Kashmir, delivery times are carefully managed.</p>

          <h2 className='text-2xl font-bold pt-4 text-stone-800'>1. Processing & Delivery Timeline</h2>
          <ul>
            <li><strong>Processing Time:</strong> 1-3 business days (for verification, quality check, and packaging).</li>
            <li><strong>Standard Delivery Time:</strong> Once shipped, the delivery typically takes **7-10 business days** for most major metropolitan areas in India. Remote or rural locations may require 10-14 business days.</li>
            <li><strong>Total Expected Time:</strong> Please allow a total of **8 to 13 business days** from the date of order for delivery.</li>
          </ul>

          <h2 className='text-2xl font-bold pt-4 text-stone-800'>2. Shipping Costs</h2>
          <p>Shipping costs are calculated at checkout based on the weight and dimensions of your order and the final delivery location. Free shipping may be offered during promotional periods.</p>

          <h2 className='text-2xl font-bold pt-4 text-stone-800'>3. Tracking</h2>
          <p>A tracking number will be provided via email and SMS within 24-48 hours after your order has been shipped. You can also use our **Track Order** page for status updates.</p>

          <h2 className='text-2xl font-bold pt-4 text-stone-800'>4. Packaging</h2>
          <p>We use high-quality, eco-conscious packaging to ensure the delicate nature of items like Pashmina and Papier-Mâché is preserved during transit.</p>
        </>
      )
    },
    return: {
      title: "Returns & Exchange Policy", icon: Package,
      text: (
        <>
          <p><strong>Policy Summary:</strong> Given the artisan nature of our products and the logistics involved in shipping from the valley, we maintain a strict policy focused on damage inspection. Your trust in our quality means we minimize returns.</p>

          <h2 className='text-2xl font-bold pt-4 text-stone-800'>1. Acceptable Returns (Damage Only)</h2>
          <p>Returns will **ONLY** be accepted in the event of **transit damage** (e.g., shattered papier-mâché, spoiled food item, visible tearing/stains on a textile that occurred during shipping). Returns due to transit damage must be reported within **48 hours** of delivery.</p>

          <h2 className='text-2xl font-bold pt-4 text-stone-800'>2. The Inspection Process</h2>
          <ul>
            <li><strong>Mandatory Photo/Video Proof:</strong> You must provide clear photographic and video evidence of the damaged product **and** the condition of the original packaging.</li>
            <li><strong>Verification:</strong> Our quality control team will inspect the proof. If damage is verified, we will arrange a return pickup.</li>
            <li><strong>Refund/Credit:</strong> Upon receiving and final inspection of the damaged item, a full refund will be initiated to your original payment method.</li>
          </ul>

          <h2 className='text-2xl font-bold pt-4 text-stone-800'>3. No Exchange or Change of Mind</h2>
          <ul>
            <li><strong>NO EXCHANGE:</strong> We do not offer product exchanges.</li>
            <li><strong>NO RETURNS for Change of Mind:</strong> We cannot accept returns for reasons such as "changed my mind," "didn't like the color/texture," or "it's not what I expected." Product details, including material and dimensions, are fully described on the product pages.</li>
            <li><strong>Minor Variations:</strong> Handcrafted items, by nature, may have minor variations in color, size, or pattern. These are not considered defects and will not qualify for a return.</li>
          </ul>
        </>
      )
    }
  };
  const data = content[type] || content.privacy;
  
  return (
    <SectionContent title={data.title} icon={data.icon}>
      {data.text}
    </SectionContent>
  );
};


/* --------------------------
   Main App
   -------------------------- */
export default function App() {
  const [view, setView] = useState('home'); // home, shop, track, about, auth:login/signup/reset, privacy, terms, shipping, return
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
                <div onClick={() => { setView('shop'); setActiveCategory('Textiles'); }} className="cursor-pointer group relative rounded-xl overflow-hidden h-64 shadow-lg">
                  <img src="https://imgs.search.brave.com/8CwUqXbu_gS9cKw7U5HHRQBNAKEE9yKzQqiNiwigB4c/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zaGFo/a2Fhci5jb20vY2Ru/L3Nob3AvZmlsZXMv/WVAyMjdfNi5qcGc_/dj0xNzYxMTUzMTc5/JndpZHRoPTQxMjk" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Pashmina" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 flex items-end p-6 text-white">
                    <div><h3 className="text-2xl font-serif font-bold">Pashmina</h3><p className="text-sm opacity-90">Soft gold from Changthangi goats.</p></div>
                  </div>
                </div>

                <div onClick={() => { setView('shop'); setActiveCategory('Spices'); }} className="cursor-pointer group relative rounded-xl overflow-hidden h-64 shadow-lg">
                  <img src="https://imgs.search.brave.com/5uwgh-AxYPqvrDLYfuQgsnduVQ-94_Rr7Hv-VN-T99I/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvNjE5/OTQxNjkyL3Bob3Rv/L2Eta2FzaG1pcmkt/ZmFybWVyLXNob3dz/LXNhZmZyb24tcGV0/YWxzLWFmdGVyLWJl/aW5nLXBpY2tlZC1m/cm9tLWZsb3dlcnMt/YXQtcGFtcG9yZS1z/b3V0aC1vZi5qcGc_/cz02MTJ4NjEyJnc9/MCZrPTIwJmM9QTZx/bWkwVUhrRWx4enNY/eXFmaFJnamc1ckhy/SUxqMks4TWR6SHpN/SUI1Zz0" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Saffron" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 flex items-end p-6 text-white">
                    <div><h3 className="text-2xl font-serif font-bold">Pampore Saffron</h3><p className="text-sm opacity-90">Red threads with powerful aroma.</p></div>
                  </div>
                </div>

                <div onClick={() => { setView('shop'); setActiveCategory('Art'); }} className="cursor-pointer group relative rounded-xl overflow-hidden h-64 shadow-lg">
                  <img src="https://imgs.search.brave.com/ZQmC7Yi-feaQT4xNoCygNv6Z17NLTUoA9x8Ge2hmg14/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9kaXJl/Y3RjcmVhdGVlY29t/ZGV2LnMzLmFwLXNv/dXRoLTEuYW1hem9u/YXdzLmNvbS9jb2xs/YWIvY3JhZnQxNTgy/ODAxNzY1V2FsbnV0/LUJhbm5lci5qcGc" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Handicrafts" />
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

        {/* REVISED 'Our Story' PAGE (view === 'about') */}
        {view === 'about' && (
          <section className="py-20 bg-stone-50">
            <div className="container mx-auto px-4 md:px-6 max-w-5xl">
              <SectionTitle title="The Valley's Voice" subtitle="Our journey to bridge the authentic craftsmanship of Kashmir with the world." />
              
              {/* Pillar 1: The Soul of Craft */}
              <div className="flex flex-col md:flex-row gap-10 mb-16 items-center">
                <div className="md:w-1/2">
                  <h3 className="text-3xl font-serif font-bold text-stone-800 mb-4">The Promise of Purity ✨</h3>
                  <p className="text-lg text-stone-600 mb-4">
                    Vadi-e-Kashmir started with a deep reverence for the land and its people. For centuries, the valley has been a crucible of unparalleled craft—from the ethereal softness of Pashmina to the potent aroma of Pampore Saffron. Our mission is simple: to preserve this heritage by ensuring every artisan receives a fair, dignified share.
                  </p>
                  <p className="text-stone-600">
                    We are not just a marketplace; we are the gatekeepers of authenticity. Every product is rigorously vetted—it is either GI-tagged, certified, or personally verified through our established network of local, trusted partners in Srinagar and the surrounding regions.
                  </p>
                </div>
                <div className="md:w-1/2 rounded-xl overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-transform duration-700">
                  <img src="https://imgs.search.brave.com/2JDsVfLwQAAPJSTLWnlrjvwQ9F8BwomNtEJhc5SgXRk/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvMTIz/NDczMTQ3Ni9waG90/by9rYXNobWlyaS1j/cmFmdHNtYW4tcG9s/aXNoZXMtYS1oYW5k/LWNhcnZlZC13YWxu/dXQtZHJhd2VyLWlu/LWEtc21hbGwtZmxv/YXRpbmctd29ya3No/b3Atb24tZGFsLmpw/Zz9zPTYxMng2MTIm/dz0wJms9MjAmYz0x/eTgwQ2NOajhPM04w/dmc2YU50RmQ4dEVR/TGkwZUExM3NyMno1/VjM3dnNZPQ" alt="Artisan working on a craft" className="w-full h-80 object-cover" />
                </div>
              </div>

              {/* Pillar 2: Community & Fair Trade */}
              <div className="flex flex-col md:flex-row-reverse gap-10 mb-16 items-center">
                <div className="md:w-1/2">
                  <h3 className="text-3xl font-serif font-bold text-stone-800 mb-4">Empowering the Hand That Creates 🤲</h3>
                  <p className="text-lg text-stone-600 mb-4">
                    We actively work with cooperative groups and small family workshops, shifting the power dynamic back to the creators. Our fair pricing model ensures that the true value of their meticulous work is recognized and rewarded, helping to secure their generational craft against mass-market dilution.
                  </p>
                  <p className="text-stone-600">
                    This is about long-term partnership, not transactions. When you buy a product from us, you are not just acquiring an item; you are investing in a family’s livelihood, supporting a sustainable ecosystem of traditional artistry, and helping to keep ancient techniques alive.
                  </p>
                </div>
                <div className="md:w-1/2 rounded-xl overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-transform duration-700">
                  <img src="https://imgs.search.brave.com/TgdSLNIbB7UqLV6bMXi3Lw3A3Za2vvLv3QXmkgf8eOw/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWcu/ZnJlZXBpay5jb20v/ZnJlZS1waG90by9i/cmVhdGh0YWtpbmct/c2NlbmVyeS1hbWF6/aW5nLWxhbmRzY2Fw/ZS12aWV3XzE4MTYy/NC0xOTE1Mi5qcGc_/c2VtdD1haXNfaHli/cmlkJnc9NzQwJnE9/ODA" alt="Kashmiri landscape or architecture" className="w-full h-80 object-cover" />
                </div>
              </div>

              {/* Pillar 3: Sustainability & Responsibility */}
              <div className="flex flex-col md:flex-row gap-10 mb-16 items-center">
                <div className="md:w-1/2">
                  <h3 className="text-3xl font-serif font-bold text-stone-800 mb-4">A Footprint of Care 🌲</h3>
                  <p className="text-lg text-stone-600 mb-4">
                    Our responsibility extends beyond fair prices to the planet itself. We prioritize low-impact, sustainable practices wherever possible—from using eco-friendly packaging to carefully selecting courier partners who share our values.
                  </p>
                  <p className="text-stone-600">
                    Every choice is made with the future in mind. We believe that true luxury should never come at the cost of the environment or the community. Our commitment is to offer you products that are as beautiful in origin as they are in appearance.
                  </p>
                </div>
                <div className="md:w-1/2 rounded-xl overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-transform duration-700">
                  <img src="https://imgs.search.brave.com/XHwaDBMH6ZegoO6GbDCsB0w2PScVzIiQADVs1ufRlpo/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/a2FzaG1pcm9ubGlu/ZXN0b3JlLmNvbS9j/ZG4vc2hvcC9maWxl/cy9hLWJvd2wtb2Yt/ZHJ5LWZydWl0cy1p/bmNsdWRpbmctYWxt/b25kcy1jX2NaTi1t/bWdNVGJlZkE0SFRu/WGdaTXdfbHVURVdM/dDJSZFM3dXZWV0cw/U3EwZy5qcGc_dj0x/NzQ0NDQ3Njc2Jndp/ZHRoPTE5MjA" alt="Dry fruits or spices display" className="w-full h-80 object-cover" />
                </div>
              </div>
              
              {/* Emotional Climax & Developer Story */}
              <div className="bg-amber-700 text-white p-10 md:p-16 rounded-2xl shadow-2xl mt-16 text-center animate-in fade-in duration-1000">
                <blockquote className="text-2xl italic font-light mb-6">
                  "Each product carries a story, a heartbeat, and the dedication of a master’s lifetime. We’re only the bridge connecting that soul to yours."
                </blockquote>
                <div className="w-24 h-1 bg-white/50 mx-auto mb-8"></div>
                <h3 className="text-xl font-bold mb-4">A Note From the Owners</h3>
                <p className="text-sm md:text-base max-w-3xl mx-auto opacity-90">
                  This platform, Vadi-e-Kashmir, is a labor of love built by two college students currently navigating their second year. We created this because we passionately believe in the artisans craft. As we grow, we aim to build your trust first: for the next few months, we will operate on a Non-COD (Cash on Delivery) model to establish a solid foundation and streamline logistics. We promise to quickly integrate COD and many more products as soon as our ecosystem matures. We are committed to transparency, and your support today helps us move forward, allowing us to dedicate more resources to making Vadi-e-Kashmir the definitive digital home for Kashmiri artistry.
                </p>
              </div>

            </div>
          </section>
        )}

        {view === 'privacy' && <LegalPage type="privacy" />}
        {view === 'terms' && <LegalPage type="terms" />}
        {view === 'shipping' && <LegalPage type="shipping" />}
        {view === 'return' && <LegalPage type="return" />}
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
              <li className="hover:text-amber-500 cursor-pointer" onClick={() => setView('shipping')}>Shipping Policy</li>
              <li className="hover:text-amber-500 cursor-pointer" onClick={() => setView('return')}>Return Policy</li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-6">Contact</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3"><MapPin size={18} className="text-amber-600 mt-1 flex-shrink-0" /><span>Main Bazaar, Residency Road,<br/>Srinagar, Jammu & Kashmir<br/>Pin: 190001</span></li>
              <li className="flex items-start gap-3"><Phone size={18} className="text-amber-600 mt-1 flex-shrink-0" /><span>+91 79797472200</span></li>
              <li className="flex items-start gap-3"><Phone size={18} className="text-amber-600 mt-1 flex-shrink-0" /><span>+91 7006425508</span></li>
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