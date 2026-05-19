import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { collection, addDoc, onSnapshot, doc } from 'firebase/firestore';
import { db, DEFAULT_SETTINGS } from '../firebase';
import toast from 'react-hot-toast';
import { ShoppingBag, ShieldCheck, Truck, ChevronRight } from 'lucide-react';
import Footer from './Footer';

export default function LandingPage() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [heroImages, setHeroImages] = useState([]);
  const [hasManuallySelected, setHasManuallySelected] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slides, setSlides] = useState([]);
  const [layoutMode, setLayoutMode] = useState('showcase');
  const [storefrontSettings, setStorefrontSettings] = useState(DEFAULT_SETTINGS);

  // Selection states
  const [selectedColor, setSelectedColor] = useState('Charcoal Black');
  const [quantity, setQuantity] = useState(1);

  const colors = [
    { name: 'Charcoal Black', hex: '#171717' },
    { name: 'Midnight Navy', hex: '#1e3a8a' },
    { name: 'Arctic Grey', hex: '#9ca3af' }
  ];

  // Listen to storefront customizer settings
  useEffect(() => {
    const docRef = doc(db, 'settings', 'storefront');
    const unsubscribeStorefront = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStorefrontSettings({
          ...DEFAULT_SETTINGS,
          ...data
        });
      }
    }, (error) => {
      console.error("Error loading storefront settings:", error);
    });
    return unsubscribeStorefront;
  }, []);

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
        setProducts([]);
        setSelectedProduct(null);
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
        const data = docSnap.data();
        setHeroImageUrl(data.imageUrl || '');
        setHeroImages(data.images || (data.imageUrl ? [data.imageUrl] : []));
      }
    }, (err) => {
      console.error("Error loading hero banner:", err);
    });

    return unsubscribeHero;
  }, []);

  // Listen to storefront display mode layout setting
  useEffect(() => {
    const docRef = doc(db, 'settings', 'layout');
    const unsubscribeLayout = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setLayoutMode(docSnap.data().viewMode || 'showcase');
      }
    }, (error) => {
      console.error("Error loading layout settings:", error);
    });
    return unsubscribeLayout;
  }, []);

  // Build slides list whenever products or hero banner image updates
  useEffect(() => {
    const list = [];
    
    // 1. Add custom hero images if present
    if (heroImages && heroImages.length > 0) {
      heroImages.forEach((url, index) => {
        list.push({
          url: url,
          title: storefrontSettings.heroBadge || "EXCLUSIVELY CRAFTED DROPS AVAILABLE",
          subtitle: `Featured Showcase Drop ${index + 1}`
        });
      });
    } else if (heroImageUrl) {
      list.push({
        url: heroImageUrl,
        title: storefrontSettings.heroBadge || "EXCLUSIVELY CRAFTED DROPS AVAILABLE",
        subtitle: "Featured Drop Showcase"
      });
    }
    
    // 2. Add all dynamic product images
    products.forEach((p) => {
      if (p.imageUrl && !list.some(item => item.url === p.imageUrl)) {
        list.push({
          url: p.imageUrl,
          title: p.title,
          subtitle: "Featured Catalog Drop"
        });
      }
    });

    setSlides(list);
    // Reset index if it gets out of bounds
    setCurrentSlideIndex(prev => prev >= list.length ? 0 : prev);
  }, [products, heroImageUrl, heroImages, storefrontSettings]);

  // Auto-rotation timer for slides
  useEffect(() => {
    if (hasManuallySelected) return;
    if (slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlideIndex(prev => (prev + 1) % slides.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [slides, hasManuallySelected]);

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
        color: selectedColor,
        quantity: Number(quantity),
        productId: selectedProduct.id,
        productTitle: selectedProduct.title,
        status: 'Pending',
        createdAt: new Date(),
        total: selectedProduct.price * quantity
      });
      
      toast.success('Order placed successfully! We will contact you soon.');
      setFormData({ name: '', phone: '', address: '', size: selectedProduct.sizes?.[0] || 'M' });
      setQuantity(1);
    } catch (error) {
      toast.error('Failed to place order. Try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const activeFeatures = selectedProduct?.features || [];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-neutral-950 text-white grid-pattern selection:bg-cyan-500 selection:text-black relative">
      
      {/* Sticky Premium Header */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-neutral-950/80 border-b border-white/5 w-full">
        <div className="p-3 sm:p-6 flex justify-between items-center max-w-7xl mx-auto">
          <Link to="/" className="text-lg sm:text-2xl font-bold tracking-tighter hover:opacity-90 transition-opacity">
            <span className="text-white">caught</span>
            <span className="gradient-text font-black">On</span>
          </Link>
          <div className="flex items-center space-x-3 sm:space-x-8">
            <Link to="/track-order" className="text-[11px] sm:text-sm font-semibold text-neutral-400 hover:text-white transition-all hover:scale-105">
              Track Order
            </Link>
            <button 
              onClick={() => document.getElementById('customizer').scrollIntoView({ behavior: 'smooth' })} 
              className="flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-6 py-2 rounded-full bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all border border-cyan-500/20 text-[11px] sm:text-sm font-semibold hover:animate-none active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            >
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Shop Collection</span>
              <span className="inline sm:hidden">Shop</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-4 sm:pt-8 lg:pt-24 lg:pb-20 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        {/* Left: Product Info */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6 order-2 lg:order-1"
        >
          <h2 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold tracking-tight leading-[1.05] text-white">
            {storefrontSettings.heroHeading}
          </h2>
          
          <p className="text-base sm:text-lg text-neutral-400 max-w-md leading-relaxed whitespace-pre-line">
            {storefrontSettings.heroSubheading}
          </p>

          <div className="flex space-x-6 pt-2">
            {storefrontSettings.heroTrustBadge1 && (
              <div className="flex items-center space-x-2.5 text-neutral-300 text-sm font-medium">
                <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                  <Truck className="w-4 h-4 text-cyan-400" />
                </div>
                <span>{storefrontSettings.heroTrustBadge1}</span>
              </div>
            )}
            {storefrontSettings.heroTrustBadge2 && (
              <div className="flex items-center space-x-2.5 text-neutral-300 text-sm font-medium">
                <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                </div>
                <span>{storefrontSettings.heroTrustBadge2}</span>
              </div>
            )}
          </div>

          <button 
            onClick={() => document.getElementById('customizer').scrollIntoView({ behavior: 'smooth' })} 
            className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4.5 px-8 rounded-2xl transition-all duration-300 transform active:scale-95 cursor-pointer shadow-[0_8px_25px_rgba(6,182,212,0.3)] text-sm"
          >
            <span>Order Now</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Right: Premium Mockup Display */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative animate-float order-1 lg:order-2"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/25 to-blue-500/25 blur-[100px] -z-10 rounded-full opacity-60"></div>
          <div className="w-full aspect-[4/5] rounded-3xl overflow-hidden glass-effect border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] shadow-cyan-950/20 hover:border-cyan-500/30 transition-all duration-500 relative">
            
            {/* Slideshow image container with AnimatePresence */}
            <div className="absolute inset-0 w-full h-full overflow-hidden rounded-3xl bg-neutral-950 flex items-center justify-center">
              {(hasManuallySelected && selectedProduct) || slides.length > 0 ? (
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={hasManuallySelected ? selectedProduct?.id : (slides[currentSlideIndex]?.url || 'default')}
                    src={hasManuallySelected 
                      ? selectedProduct?.imageUrl 
                      : slides[currentSlideIndex]?.url
                    } 
                    alt={hasManuallySelected ? selectedProduct?.title : slides[currentSlideIndex]?.title} 
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                </AnimatePresence>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-500 gap-3 bg-neutral-900/40">
                  <ShoppingBag className="w-10 h-10 text-cyan-500/30 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Showcase Empty / Loading</span>
                </div>
              )}
            </div>

            {/* Absolute label over cover */}
            {((hasManuallySelected && selectedProduct) || slides.length > 0) && (
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-neutral-950/80 backdrop-blur-md border border-white/5 z-10">
                <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-widest block mb-1">
                  {hasManuallySelected 
                    ? "Featured Drop Selection" 
                    : (slides[currentSlideIndex]?.subtitle || "Featured Drop Showcase")
                  }
                </span>
                <h4 className="text-white font-bold text-base truncate mb-2">
                  {hasManuallySelected 
                    ? selectedProduct?.title 
                    : (slides[currentSlideIndex]?.title || "EXCLUSIVELY CRAFTED DROPS")
                  }
                </h4>

                {/* Indicator dots for automatic slideshow */}
                {!hasManuallySelected && slides.length > 1 && (
                  <div className="flex gap-1.5 mt-2 justify-start">
                    {slides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentSlideIndex(idx);
                        }}
                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                          currentSlideIndex === idx 
                            ? 'bg-cyan-400 w-5' 
                            : 'bg-neutral-600 hover:bg-neutral-500 w-1.5'
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* If a product is manually selected, show a dynamic option to resume slideshow */}
                {hasManuallySelected && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setHasManuallySelected(false);
                      setCurrentSlideIndex(0);
                    }}
                    className="mt-2 text-[10px] text-neutral-400 hover:text-cyan-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                    <span>Resume Slideshow</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </header>

      {/* Fabric Color and Quantity Customizer Section */}
      <section id="customizer" className="scroll-mt-20 py-6 lg:py-12 relative border-t border-white/5 bg-neutral-950 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-cyan-500/10 to-blue-500/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>
        
        <div className="max-w-4xl mx-auto px-4">
          <div className="glass-effect p-8 sm:p-10 rounded-3xl border border-white/5 relative shadow-2xl space-y-5">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-60"></div>
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-3 border-b border-white/5">
              <div>
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest">
                  Personalize Your Drop
                </span>
              </div>
              {selectedProduct && (
                <div className="text-left md:text-right shrink-0">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold block">Estimated Amount</span>
                  <div className="flex items-baseline gap-1.5 mt-1 justify-start md:justify-end">
                    <span className="text-3xl font-black text-white">₹{selectedProduct.price * quantity}</span>
                    <span className="text-xs text-neutral-400 font-medium">({quantity}x)</span>
                  </div>
                </div>
              )}
            </div>

            {selectedProduct ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center !mt-4">
                {/* Left Side: Color Picker */}
                <div className="space-y-4">
                  <label className="block text-xs font-bold tracking-wider text-neutral-400 uppercase">
                    Select Fabric Color: <span className="text-cyan-400 font-extrabold">{selectedColor}</span>
                  </label>
                  <div className="flex items-center gap-4.5 pt-1">
                    {colors.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setSelectedColor(c.name)}
                        className={`relative flex items-center justify-center p-1 rounded-full transition-all duration-300 cursor-pointer ${
                          selectedColor === c.name 
                            ? 'scale-110 ring-2 ring-cyan-500 ring-offset-2 ring-offset-neutral-950' 
                            : 'hover:scale-105'
                        }`}
                        title={c.name}
                      >
                        <span 
                          className="w-10 h-10 rounded-full border border-white/10" 
                          style={{ backgroundColor: c.hex }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right Side: Quantity Control */}
                <div className="space-y-4 md:border-l md:border-white/5 md:pl-8">
                  <label className="block text-xs font-bold tracking-wider text-neutral-400 uppercase">
                    Select Drop Quantity:
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center bg-neutral-950 border border-white/10 rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className="w-11 h-11 flex items-center justify-center text-neutral-400 hover:text-white transition-colors hover:bg-white/5 font-extrabold text-xl cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-11 h-11 flex items-center justify-center font-bold text-sm text-white select-none">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(q => q + 1)}
                        className="w-11 h-11 flex items-center justify-center text-neutral-400 hover:text-white transition-colors hover:bg-white/5 font-extrabold text-xl cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-[11px] text-neutral-500 font-medium tracking-wide">
                      Free delivery India-wide
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-neutral-500 text-sm">
                Catalog product loading or empty...
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
              <button
                type="button"
                onClick={() => document.getElementById('checkout').scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl flex justify-center items-center space-x-2 transition-all duration-300 transform active:scale-98 cursor-pointer shadow-[0_8px_25px_rgba(6,182,212,0.2)] text-xs uppercase tracking-wider grow"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Go to Checkout Form</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              
              <button
                type="button"
                onClick={() => document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto px-6 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-neutral-300 font-bold rounded-xl flex justify-center items-center space-x-2 transition-all duration-300 cursor-pointer text-xs"
              >
                <span>View Details & Specs</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Showroom Grid / Single Product Feature Showcase */}
      <section id="catalog" className="scroll-mt-20 max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-6 sm:pt-28 sm:pb-10 relative border-t border-white/5">
        
        {products.length === 0 ? (
          <div className="glass-effect p-12 rounded-3xl border border-white/5 text-center text-neutral-500 font-medium max-w-md mx-auto w-full flex flex-col items-center justify-center gap-3">
            <ShoppingBag className="w-10 h-10 text-neutral-700 animate-pulse" />
            <span className="text-xs uppercase tracking-wider font-bold text-neutral-500">Catalog drops currently empty</span>
          </div>
        ) : selectedProduct ? (
          // PREMIUM SINGLE-PRODUCT VERTICAL SHOWCASE (IMAGE TOP, TEXT BELOW)
          <div className="space-y-8 sm:space-y-12">
            
            {activeFeatures.length > 0 ? (
              /* Vertical Stack Feature Rows (Image top, text below) */
              <div className="space-y-8 sm:space-y-12 max-w-4xl mx-auto">
                {activeFeatures.map((feature, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex flex-col items-center space-y-4 sm:space-y-5 pb-6 sm:pb-8 border-b border-white/5 last:border-b-0 last:pb-0"
                  >
                    {/* Feature Image Wrapper */}
                    <div className="w-full group">
                      <div className="relative aspect-[5/4] sm:aspect-[3/2] w-full rounded-3xl overflow-hidden glass-effect border border-white/5 shadow-2xl transition-all duration-500 group-hover:border-cyan-500/20">
                        <img 
                          src={feature.imageUrl} 
                          alt={feature.text || `Detail showcase ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/50 via-transparent to-transparent opacity-60"></div>
                      </div>
                    </div>

                    {/* Feature Description Card Below Image */}
                    <div className="w-full text-center space-y-4 max-w-2xl px-4">
                      {feature.text && (
                        <p className="text-neutral-200 text-sm sm:text-base leading-relaxed font-bold tracking-wide">
                          {feature.text}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="glass-effect p-8 sm:p-12 rounded-3xl border border-white/5 text-center text-neutral-400 max-w-md mx-auto space-y-4">
                <ShoppingBag className="w-8 h-8 text-cyan-500/40 mx-auto animate-bounce" />
                <h4 className="text-white font-extrabold text-xs uppercase tracking-widest">Lookbook Spec Details Under Construction</h4>
                <p className="text-neutral-500 text-xs leading-relaxed font-medium">
                  Go to your **Admin Dashboard**, click <strong className="text-cyan-400">"Edit Product & Specs Details"</strong> on this item, and add custom detail images & descriptions to showcase your product specs live!
                </p>
              </div>
            )}
          </div>
        ) : null}
      </section>

      {/* Checkout Section */}
      <section id="checkout" className="scroll-mt-20 bg-neutral-950 pt-8 pb-20 lg:pt-12 lg:pb-24 relative overflow-hidden border-t border-white/5">
        <div className="max-w-3xl mx-auto px-6 relative">
          <div className="absolute -top-12 -left-12 w-64 h-64 radial-glow rounded-full opacity-50 -z-10 pointer-events-none"></div>
          
          <div className="text-center mb-16 space-y-2">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Secure Your Drop Checkout</h3>
            <p className="text-neutral-400 max-w-md mx-auto text-sm">Provide your street delivery credentials. COD checkout is fully secured with zero hidden costs.</p>
          </div>

          {selectedProduct ? (
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
                  {selectedProduct.imageUrl && (
                    <img 
                      src={selectedProduct.imageUrl} 
                      alt={selectedProduct.title} 
                      className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0 bg-neutral-900" 
                    />
                  )}
                  <div className="overflow-hidden">
                    <h4 className="font-extrabold text-white text-sm leading-tight truncate">{selectedProduct.title}</h4>
                    <p className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-wider mt-1.5">
                      Size: {formData.size} | Color: {selectedColor} | Qty: {quantity}
                    </p>
                  </div>
                </div>
                
                <div className="h-px bg-white/5"></div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-neutral-300 text-sm">Total Amount (COD)</h4>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">Free India-wide Delivery</p>
                  </div>
                  <div className="text-3xl font-black text-white">₹{selectedProduct.price * quantity}</div>
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
          ) : (
            <div className="glass-effect p-12 rounded-3xl border border-white/5 text-center text-neutral-500 font-medium w-full flex flex-col items-center justify-center gap-3">
              <ShoppingBag className="w-10 h-10 text-neutral-700 animate-pulse" />
              <span className="text-xs uppercase tracking-wider font-bold text-neutral-500">Please select a catalog drop above to complete checkout</span>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
