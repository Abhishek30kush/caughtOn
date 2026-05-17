import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { collection, addDoc, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';
import { ShoppingBag, ShieldCheck, Truck, ChevronRight } from 'lucide-react';
import Footer from './Footer';

const defaultProduct = {
  id: 'default_lower',
  title: 'CaughtOn Signature Street Lower',
  description: 'Unmatched freedom of movement meets ultimate street-ready aesthetics. Experience structural premium tailoring designed for your daily street aesthetic.',
  price: 999,
  originalPrice: 1499,
  imageUrl: 'https://images.unsplash.com/photo-1542272201-b1ca555f8505?auto=format&fit=crop&q=80&w=800',
  sizes: ['S', 'M', 'L', 'XL']
};

export default function LandingPage() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([defaultProduct]);
  const [selectedProduct, setSelectedProduct] = useState(defaultProduct);
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [hasManuallySelected, setHasManuallySelected] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    size: 'M'
  });

  // Real-time catalog snapshot listener
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      if (!snapshot.empty) {
        const productsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Sort in-memory
        productsData.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });

        setProducts(productsData);
        
        // Auto-select the first product by default
        setSelectedProduct(productsData[0]);
        if (productsData[0].sizes && productsData[0].sizes.length > 0) {
          setFormData(prev => ({ ...prev, size: productsData[0].sizes[0] }));
        }
      } else {
        setProducts([defaultProduct]);
        setSelectedProduct(defaultProduct);
        setFormData(prev => ({ ...prev, size: 'M' }));
      }
    }, (error) => {
      console.error("Error loading showcase catalog:", error);
    });

    return unsubscribe;
  }, []);

  // Listen to custom hero settings
  useEffect(() => {
    const docRef = doc(db, 'settings', 'hero');
    const unsubscribeHero = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setHeroImageUrl(docSnap.data().imageUrl || '');
      }
    }, (err) => {
      console.error("Error loading hero banner:", err);
    });

    return unsubscribeHero;
  }, []);

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setHasManuallySelected(true);
    // Reset to the product's first available size so they don't submit an invalid size selection
    if (product.sizes && product.sizes.length > 0) {
      setFormData(prev => ({ ...prev, size: product.sizes[0] }));
    } else {
      setFormData(prev => ({ ...prev, size: 'M' }));
    }
    
    // Smooth scroll down to checkout
    const checkoutSection = document.getElementById('checkout');
    if (checkoutSection) {
      checkoutSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "orders"), {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        size: formData.size,
        productId: selectedProduct.id,
        productTitle: selectedProduct.title,
        status: 'Pending',
        createdAt: new Date(),
        total: selectedProduct.price
      });
      
      toast.success('Order placed successfully! We will contact you soon.');
      setFormData({ name: '', phone: '', address: '', size: selectedProduct.sizes?.[0] || 'M' });
    } catch (error) {
      toast.error('Failed to place order. Try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white grid-pattern selection:bg-cyan-500 selection:text-black">
      
      {/* Sticky Premium Header */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-neutral-950/80 border-b border-white/5 w-full">
        <div className="p-4 sm:p-6 flex justify-between items-center max-w-7xl mx-auto">
          <Link to="/" className="text-xl sm:text-2xl font-bold tracking-tighter hover:opacity-90 transition-opacity">
            <span className="text-white">caught</span>
            <span className="gradient-text font-black">On</span>
          </Link>
          <div className="flex items-center space-x-4 sm:space-x-8">
            <Link to="/track-order" className="text-xs sm:text-sm font-semibold text-neutral-400 hover:text-white transition-all hover:scale-105">
              Track Order
            </Link>
            <button 
              onClick={() => document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' })} 
              className="flex items-center space-x-2 px-4 sm:px-6 py-2 rounded-full bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all border border-cyan-500/20 text-xs sm:text-sm font-semibold hover:animate-none active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            >
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Shop Collection</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left: Product Info */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-10"
        >
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs sm:text-sm font-semibold tracking-wide shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span>EXCLUSIVELY CRAFTED DROPS AVAILABLE</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] text-white">
            Premium <br />
            <span className="gradient-text">Everyday</span> <br />
            Comfort Lowers.
          </h2>
          
          <p className="text-base sm:text-lg text-neutral-400 max-w-md leading-relaxed">
            Unmatched freedom of movement meets ultimate street-ready aesthetics. Experience structural premium tailoring designed for your daily street aesthetic.
          </p>

          <div className="flex space-x-6 pt-2">
            <div className="flex items-center space-x-2.5 text-neutral-300 text-sm font-medium">
              <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                <Truck className="w-4 h-4 text-cyan-400" />
              </div>
              <span>Free COD Delivery India</span>
            </div>
            <div className="flex items-center space-x-2.5 text-neutral-300 text-sm font-medium">
              <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
              </div>
              <span>100% Street Premium Fabric</span>
            </div>
          </div>

          <button 
            onClick={() => document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' })} 
            className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4.5 px-8 rounded-2xl transition-all duration-300 transform active:scale-95 cursor-pointer shadow-[0_8px_25px_rgba(6,182,212,0.3)] text-sm"
          >
            <span>Explore Showcase Catalog</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Right: Premium Mockup Display */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative animate-float"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/25 to-blue-500/25 blur-[100px] -z-10 rounded-full opacity-60"></div>
          <div className="w-full aspect-[4/5] rounded-3xl overflow-hidden glass-effect border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] shadow-cyan-950/20 hover:border-cyan-500/30 transition-all duration-500">
            <img 
              src={(!hasManuallySelected && heroImageUrl) ? heroImageUrl : selectedProduct.imageUrl} 
              alt={selectedProduct.title} 
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            />
            {/* Absolute label over cover */}
            <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-neutral-950/80 backdrop-blur-md border border-white/5">
              <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-widest block mb-1">
                {(!hasManuallySelected && heroImageUrl) ? "Featured Drop Showcase" : "Featured Drop Selection"}
              </span>
              <h4 className="text-white font-bold text-base truncate">
                {(!hasManuallySelected && heroImageUrl) ? "EXCLUSIVELY CRAFTED DROPS" : selectedProduct.title}
              </h4>
            </div>
          </div>
        </motion.div>
      </header>

      {/* Catalog Showroom Grid */}
      <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 py-20 relative border-t border-white/5">
        <div className="text-center mb-16 space-y-3">
          <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            Active Catalog Drops
          </span>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Select From Limited Street Drops</h3>
          <p className="text-neutral-400 max-w-md mx-auto text-sm">Pick your signature street aesthetic, choose sizes config, and checkout dynamically.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map(product => {
            const isSelected = selectedProduct.id === product.id;
            return (
              <div 
                key={product.id} 
                className={`glass-effect rounded-3xl overflow-hidden flex flex-col justify-between group shadow-xl relative transition-all duration-500 border ${
                  isSelected ? 'border-cyan-400/40 ring-1 ring-cyan-500/20' : 'border-white/5 hover:border-white/10'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-4 left-4 px-3 py-1 bg-cyan-500 text-black text-[9px] font-black tracking-widest uppercase rounded-lg shadow-[0_0_10px_rgba(6,182,212,0.4)] z-10">
                    Active Choice
                  </div>
                )}
                
                <div className="aspect-[4/5] bg-neutral-900 overflow-hidden relative">
                  <img 
                    src={product.imageUrl} 
                    alt={product.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent opacity-60"></div>
                </div>

                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-xl text-white group-hover:text-cyan-400 transition-colors leading-tight">
                      {product.title}
                    </h4>
                    <p className="text-neutral-400 text-xs font-medium leading-relaxed line-clamp-3">
                      {product.description}
                    </p>
                  </div>

                  <div className="space-y-4 pt-2">
                    {/* Sizes available badges */}
                    {product.sizes && product.sizes.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block">Available Sizes</span>
                        <div className="flex gap-1 flex-wrap">
                          {product.sizes.map(size => (
                            <span key={size} className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-black text-neutral-300">
                              {size}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-black text-white">₹{product.price}</span>
                        {product.originalPrice && (
                          <span className="text-sm text-neutral-500 line-through">₹{product.originalPrice}</span>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => handleProductSelect(product)}
                        className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-extrabold text-xs tracking-wider transition-all duration-300 transform active:scale-95 cursor-pointer uppercase border ${
                          isSelected 
                            ? 'bg-white border-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                            : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-white hover:border-cyan-500'
                        }`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Order Now</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Checkout Section */}
      <section id="checkout" className="bg-neutral-950 py-24 relative overflow-hidden border-t border-white/5">
        <div className="max-w-3xl mx-auto px-6 relative">
          <div className="absolute -top-12 -left-12 w-64 h-64 radial-glow rounded-full opacity-50 -z-10 pointer-events-none"></div>
          
          <div className="text-center mb-16 space-y-2">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Secure Your Drop Checkout</h3>
            <p className="text-neutral-400 max-w-md mx-auto text-sm">Provide your street delivery credentials. COD checkout is fully secured with zero hidden costs.</p>
          </div>

          <form onSubmit={handleSubmit} className="glass-effect p-6 sm:p-12 rounded-3xl border border-white/5 space-y-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-60"></div>
            
            {/* Size Selection */}
            {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
              <div>
                <label className="block text-xs font-bold tracking-wider text-neutral-400 uppercase mb-4">Select Drop Size Configuration</label>
                <div className="flex flex-wrap gap-3">
                  {selectedProduct.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData({...formData, size: s})}
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl font-bold transition-all duration-300 border text-sm sm:text-base cursor-pointer ${
                        formData.size === s 
                          ? 'bg-white border-white text-black shadow-[0_0_20px_rgba(255,255,255,0.25)] scale-105 sm:scale-110' 
                          : 'bg-neutral-950/60 border-white/10 text-neutral-400 hover:bg-neutral-900 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Buyer Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all duration-300 text-sm"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">WhatsApp / Phone Number</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all duration-300 text-sm"
                  placeholder="e.g. +91 98765 43210"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Complete Shipping Address</label>
              <textarea
                required
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                rows="3"
                className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all duration-300 text-sm resize-none"
                placeholder="House no, Street, City, State, Pincode"
              />
            </div>

            {/* Beautiful Checkout Receipt */}
            <div className="bg-neutral-950/60 rounded-2xl p-6 border border-white/5 space-y-4">
              <div className="flex items-center gap-4">
                <img 
                  src={selectedProduct.imageUrl} 
                  alt={selectedProduct.title} 
                  className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0 bg-neutral-900" 
                />
                <div className="overflow-hidden">
                  <h4 className="font-extrabold text-white text-sm leading-tight truncate">{selectedProduct.title}</h4>
                  <p className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-wider mt-1.5">Size Selected: {formData.size}</p>
                </div>
              </div>
              
              <div className="h-px bg-white/5"></div>
              
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-neutral-300 text-sm">Total Amount (COD)</h4>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">Free India-wide Delivery</p>
                </div>
                <div className="text-3xl font-black text-white">₹{selectedProduct.price}</div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full group bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4 rounded-xl flex justify-center items-center space-x-2.5 transition-all duration-300 transform active:scale-[0.98] disabled:opacity-70 cursor-pointer shadow-[0_8px_30px_rgba(6,182,212,0.25)] text-sm uppercase tracking-wider"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{loading ? 'Processing Order...' : 'Place Order (COD)'}</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}
