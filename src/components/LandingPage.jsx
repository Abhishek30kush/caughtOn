import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';
import { ShoppingBag, ShieldCheck, Truck, ChevronRight } from 'lucide-react';
import Footer from './Footer';

export default function LandingPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    size: 'M'
  });
  
  const [sizes, setSizes] = useState(['S', 'M', 'L', 'XL']);
  const [productImage, setProductImage] = useState('https://images.unsplash.com/photo-1542272201-b1ca555f8505?auto=format&fit=crop&q=80&w=800'); // Placeholder

  useEffect(() => {
    // Fetch product details from Firestore if available
    const fetchProductDetails = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        if (!querySnapshot.empty) {
          const product = querySnapshot.docs[0].data();
          if (product.sizes) setSizes(product.sizes);
          if (product.imageUrl) setProductImage(product.imageUrl);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProductDetails();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "orders"), {
        ...formData,
        status: 'Pending',
        createdAt: new Date(),
        total: 999 // Example price
      });
      toast.success('Order placed successfully! We will contact you soon.');
      setFormData({ name: '', phone: '', address: '', size: 'M' });
    } catch (error) {
      toast.error('Failed to place order. Try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
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
              onClick={() => document.getElementById('checkout').scrollIntoView({ behavior: 'smooth' })} 
              className="flex items-center space-x-2 px-4 sm:px-6 py-2 rounded-full bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all border border-cyan-500/20 text-xs sm:text-sm font-semibold animate-pulse hover:animate-none active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            >
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Cart</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-28 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
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
            <span>EXCLUSIVELY CRAFTED DROP</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] text-white">
            Premium <br />
            <span className="gradient-text">Everyday</span> <br />
            Comfort Lowers.
          </h2>
          
          <p className="text-base sm:text-lg text-neutral-400 max-w-md leading-relaxed">
            Unmatched freedom of movement meets ultimate street-ready aesthetics. Experience structural premium tailoring designed for your daily grind.
          </p>

          {/* Pricing Card */}
          <div className="glass-effect p-6 rounded-2xl border border-white/5 flex items-center justify-between max-w-md shadow-xl">
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold mb-1.5">Special Launch Offer</p>
              <div className="flex items-baseline space-x-3">
                <span className="text-4xl font-extrabold text-white">₹999</span>
                <span className="text-lg text-neutral-500 line-through">₹1,499</span>
              </div>
            </div>
            <div className="px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 uppercase tracking-wider shadow-sm">
              Save 33% Off
            </div>
          </div>

          <div className="flex space-x-6 pt-2">
            <div className="flex items-center space-x-2.5 text-neutral-300 text-sm font-medium">
              <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                <Truck className="w-4 h-4 text-cyan-400" />
              </div>
              <span>Free Delivery Pan India</span>
            </div>
            <div className="flex items-center space-x-2.5 text-neutral-300 text-sm font-medium">
              <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
              </div>
              <span>Premium Quality Fabric</span>
            </div>
          </div>
        </motion.div>

        {/* Right: Product View */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative animate-float"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/30 to-blue-500/30 blur-[100px] -z-10 rounded-full opacity-60"></div>
          <div className="w-full aspect-[4/5] rounded-3xl overflow-hidden glass-effect border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] shadow-cyan-950/20 hover:border-cyan-500/30 transition-all duration-500">
            <img 
              src={productImage} 
              alt="CaughtOn Lower" 
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            />
          </div>
        </motion.div>
      </main>

      {/* Checkout Section */}
      <section id="checkout" className="bg-neutral-950 py-24 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent"></div>
        
        <div className="max-w-3xl mx-auto px-6 relative">
          <div className="absolute -top-12 -left-12 w-64 h-64 radial-glow rounded-full opacity-50 -z-10 pointer-events-none"></div>
          
          <div className="text-center mb-16">
            <h3 className="text-3xl sm:text-4xl font-extrabold mb-4 text-white tracking-tight">Secure Your Order</h3>
            <p className="text-neutral-400 max-w-md mx-auto">Complete your order details below. Cash on Delivery (COD) is supported for a risk-free purchase.</p>
          </div>

          <form onSubmit={handleSubmit} className="glass-effect p-6 sm:p-12 rounded-3xl border border-white/5 space-y-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-60"></div>
            
            {/* Size Selection */}
            <div>
              <label className="block text-sm font-semibold tracking-wider text-neutral-300 uppercase mb-4">Select Your Size</label>
              <div className="flex flex-wrap gap-3">
                {sizes.map((s) => (
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all duration-300"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all duration-300"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Complete Address</label>
              <textarea
                required
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                rows="3"
                className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all duration-300 resize-none"
                placeholder="House no, Street, City, State, Pincode"
              />
            </div>

            <div className="bg-neutral-950/60 rounded-2xl p-6 border border-white/5 flex justify-between items-center">
              <div>
                <h4 className="font-semibold text-white mb-0.5">Total Amount</h4>
                <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Cash on Delivery (No Extra Charges)</p>
              </div>
              <div className="text-3xl font-black text-white">₹999</div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full group bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4 rounded-xl flex justify-center items-center space-x-2.5 transition-all duration-300 transform active:scale-[0.98] disabled:opacity-70 cursor-pointer shadow-[0_8px_30px_rgba(6,182,212,0.25)]"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>{loading ? 'Processing Order...' : 'Place Order (COD)'}</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}
