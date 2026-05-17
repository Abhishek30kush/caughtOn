import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogOut, Package, Image as ImageIcon, CheckCircle, Clock, Upload, ListFilter, ArrowLeft, RefreshCw } from 'lucide-react';

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus
      });
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleImageUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select an image first');

    setUploading(true);
    const storageRef = ref(storage, `products/lower_${Date.now()}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {},
      (error) => {
        toast.error('Upload failed: ' + error.message);
        setUploading(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        
        try {
          await setDoc(doc(db, 'products', 'main_product'), {
            imageUrl: downloadURL,
            sizes: ['S', 'M', 'L', 'XL'],
            updatedAt: new Date()
          }, { merge: true });
          
          toast.success('Product image updated successfully!');
          setFile(null);
        } catch (error) {
          toast.error('Failed to update product database');
        } finally {
          setUploading(false);
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white grid-pattern flex flex-col lg:flex-row relative overflow-hidden">
      {/* Radial glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 radial-glow rounded-full -z-10 pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 radial-glow rounded-full -z-10 pointer-events-none"></div>

      {/* Sidebar / Left Column */}
      <aside className="w-full lg:w-72 bg-neutral-950/80 backdrop-blur-md border-b lg:border-r border-white/5 p-6 flex flex-col justify-between relative z-20">
        <div>
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="text-2xl font-bold tracking-tighter hover:opacity-90 transition-opacity">
              <span className="text-white">caught</span>
              <span className="gradient-text font-black">On</span>
            </Link>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-extrabold uppercase tracking-widest text-cyan-400">
              Admin
            </span>
          </div>

          <nav className="space-y-2.5">
            <button className="w-full flex items-center space-x-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-400 border border-cyan-500/20 px-4 py-3 rounded-xl font-bold text-sm transition-all shadow-sm">
              <Package className="w-4 h-4" />
              <span>Orders Management</span>
            </button>
            <Link to="/" className="w-full flex items-center space-x-3 text-neutral-400 hover:text-white px-4 py-3 rounded-xl font-bold text-sm transition-all hover:bg-white/5 border border-transparent">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Store</span>
            </Link>
          </nav>
        </div>

        <div className="mt-8 lg:mt-0 pt-6 border-t border-white/5 lg:border-t-0">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-3.5 rounded-2xl font-extrabold text-sm transition-all duration-300 transform active:scale-95 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-8 lg:p-12 overflow-y-auto relative z-10 w-full">
        <header className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-1 text-white">Dashboard Overview</h1>
            <p className="text-neutral-400 text-sm font-medium">Manage your product image uploads and tracking for incoming buyer checkout requests.</p>
          </div>
          <div className="flex items-center space-x-3 bg-white/5 border border-white/5 px-4 py-2 rounded-2xl">
            <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin-slow" />
            <span className="text-xs font-bold text-neutral-300">Live Database Connection</span>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Orders Listings Container */}
          <div className="xl:col-span-2 space-y-6 w-full">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold flex items-center space-x-2 text-white">
                <ListFilter className="w-5 h-5 text-cyan-400" />
                <span>Recent Incoming Orders</span>
              </h2>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs font-bold text-neutral-400">
                {orders.length} Total
              </span>
            </div>

            {loading ? (
              <div className="glass-effect p-12 rounded-3xl border border-white/5 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="glass-effect p-12 rounded-3xl border border-white/5 text-center text-neutral-500 font-medium">
                No checkout orders are logged in Firestore yet.
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="glass-effect p-6 rounded-3xl border border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-6 relative overflow-hidden transition-all duration-300 hover:border-white/10 shadow-lg">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-cyan-500 to-blue-500"></div>
                    
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-extrabold text-lg text-white leading-none">{order.name}</h3>
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest bg-neutral-900 border border-white/5 px-2 py-0.5 rounded">
                          ID: {order.id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="text-neutral-400 text-sm space-y-1.5">
                        <p className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                          <strong className="text-neutral-300">Phone:</strong> {order.phone}
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                          <strong className="text-neutral-300">Address:</strong> {order.address}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-xl text-xs font-bold text-neutral-300">
                          Size: {order.size}
                        </span>
                        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                          Cash On Delivery
                        </span>
                        <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-xs font-extrabold text-cyan-400">
                          ₹{order.total || 999}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 self-end sm:self-center">
                      <select 
                        value={order.status || 'Pending'}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className={`bg-neutral-950 border rounded-2xl px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 cursor-pointer ${
                          order.status === 'Delivered' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' : 
                          order.status === 'Shipped' ? 'text-blue-400 border-blue-500/30 bg-blue-500/5' : 
                          'text-amber-400 border-amber-500/30 bg-amber-500/5'
                        }`}
                      >
                        <option value="Pending" className="bg-neutral-950 text-white">Pending</option>
                        <option value="Shipped" className="bg-neutral-950 text-white">Shipped</option>
                        <option value="Delivered" className="bg-neutral-950 text-white">Delivered</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product and Inventory Management Widgets */}
          <div className="space-y-6 w-full">
            <h2 className="text-xl font-extrabold flex items-center space-x-2 text-white">
              <ImageIcon className="w-5 h-5 text-cyan-400" />
              <span>Catalog Management</span>
            </h2>

            {/* Image Upload card */}
            <form onSubmit={handleImageUpload} className="glass-effect p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Update Showcase Image</label>
                
                <div className="border-2 border-dashed border-white/10 hover:border-cyan-500/50 rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer relative bg-neutral-950/30 group">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  />
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                      <Upload className="w-5 h-5 text-cyan-400" />
                    </div>
                    {file ? (
                      <div className="text-xs font-bold text-cyan-400 max-w-[200px] truncate">{file.name}</div>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-neutral-300">Click to upload catalog file</p>
                        <p className="text-[10px] text-neutral-500 font-medium mt-1">PNG, JPG, or WEBP are supported</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading || !file}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4 rounded-2xl transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-[0_4px_20px_rgba(6,182,212,0.25)] flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    <span>Uploading Artifact...</span>
                  </>
                ) : (
                  <span>Update Lower Image</span>
                )}
              </button>
            </form>

            {/* Size checklist info */}
            <div className="glass-effect p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>

              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">Current Active Sizes</h3>
              <div className="grid grid-cols-4 gap-3">
                {['S', 'M', 'L', 'XL'].map(s => (
                  <div key={s} className="flex flex-col items-center justify-center p-3 bg-neutral-950 border border-white/10 rounded-2xl shadow-sm">
                    <span className="font-black text-white text-base">{s}</span>
                    <span className="text-[9px] font-extrabold text-emerald-400 uppercase tracking-wider mt-1">Active</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
