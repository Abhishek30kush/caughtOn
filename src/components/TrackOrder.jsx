import { useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import Footer from './Footer';
import { Search, Package, MapPin, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TrackOrder() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState(null);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!phone) return toast.error('Please enter a phone number');

    setLoading(true);
    setOrders(null);

    try {
      const q = query(collection(db, "orders"), where("phone", "==", phone));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        toast.error('No orders found for this phone number.');
        setOrders([]);
      } else {
        const foundOrders = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(foundOrders);
      }
    } catch (error) {
      toast.error('Error fetching order. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'Shipped': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'Delivered': return 'text-green-400 bg-green-400/10 border-green-400/20';
      default: return 'text-neutral-400 bg-neutral-800 border-neutral-700';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white grid-pattern flex flex-col relative overflow-hidden">
      {/* Radial glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 radial-glow rounded-full -z-10 pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 radial-glow rounded-full -z-10 pointer-events-none"></div>

      <nav className="sticky top-0 z-50 backdrop-blur-md bg-neutral-950/80 border-b border-white/5 w-full">
        <div className="p-4 sm:p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
          <Link to="/" className="text-xl sm:text-2xl font-bold tracking-tighter hover:opacity-90 transition-opacity">
            <span className="text-white">caught</span>
            <span className="gradient-text font-black">On</span>
          </Link>
          <Link to="/" className="text-xs sm:text-sm font-semibold text-neutral-400 hover:text-white transition-all hover:scale-105">
            Back to Store
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-24 w-full relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Package className="w-8 h-8 text-cyan-400 animate-pulse" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">Track Your Order</h1>
          <p className="text-neutral-400 max-w-md mx-auto">Enter the phone number used during checkout to check the current shipment status of your premium lowers.</p>
        </div>

        <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-4 mb-16">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number (e.g. +91 9876543210)"
              className="w-full pl-12 pr-4 py-4 bg-neutral-950 border border-white/10 rounded-2xl text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all duration-300"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-2xl transition-all duration-300 transform active:scale-95 disabled:opacity-70 whitespace-nowrap cursor-pointer shadow-[0_4px_20px_rgba(6,182,212,0.25)]"
          >
            {loading ? 'Tracking...' : 'Track Details'}
          </button>
        </form>

        {/* Results */}
        {orders && orders.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-xl font-extrabold text-white mb-6">Found {orders.length} Active Order(s)</h3>
            
            {orders.map((order, idx) => (
              <div key={order.id} className="glass-effect p-6 sm:p-8 rounded-3xl border border-white/5 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-2.5 h-full bg-gradient-to-b from-cyan-500 to-blue-500"></div>
                
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                  <div>
                    <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Order ID: {order.id.slice(-8).toUpperCase()}</div>
                    <h4 className="text-lg font-bold text-white mb-1">Premium Everyday Lower</h4>
                    <div className="flex items-center space-x-2 text-sm text-neutral-400 font-medium">
                      <span>Size: {order.size}</span>
                      <span>•</span>
                      <span className="text-white font-bold">₹{order.total || 999}</span>
                    </div>
                  </div>
                  
                  <div className={`px-4.5 py-2 rounded-full text-xs font-extrabold border uppercase tracking-wider flex items-center space-x-2 shadow-sm ${getStatusColor(order.status)}`}>
                    {order.status === 'Shipped' && <Truck className="w-3.5 h-3.5" />}
                    {order.status === 'Pending' && <Package className="w-3.5 h-3.5" />}
                    {order.status === 'Delivered' && <MapPin className="w-3.5 h-3.5" />}
                    <span>{order.status || 'Pending'}</span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5">
                  <div className="flex items-start space-x-3 text-sm text-neutral-400">
                    <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 mt-0.5">
                      <MapPin className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <span className="block text-white font-bold text-xs uppercase tracking-wider mb-1">Shipping Destination</span>
                      <span className="block leading-relaxed">{order.address}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
