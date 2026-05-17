import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogOut, Package, Image as ImageIcon, CheckCircle, Clock, Upload, ListFilter, ArrowLeft, RefreshCw, Plus, Edit2, Trash2, X } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'products'
  
  // Orders states
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Products states
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Modal / Form states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null if adding, product object if editing
  const [uploading, setUploading] = useState(false);
  const [productFile, setProductFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [productForm, setProductForm] = useState({
    title: '',
    description: '',
    price: '',
    originalPrice: '',
    sizes: ['S', 'M', 'L', 'XL'],
    imageUrl: ''
  });

  const navigate = useNavigate();

  // Listen to orders
  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);
      setOrdersLoading(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
      toast.error('Permission Denied: Ensure Firestore rules are updated and you are signed in.');
      setOrdersLoading(false);
    });

    return unsubscribe;
  }, []);

  // Listen to products
  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort in-memory to prevent complex composite index requirement in Firestore
      productsData.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setProducts(productsData);
      setProductsLoading(false);
    }, (error) => {
      console.error("Error fetching products:", error);
      toast.error('Failed to load products. Check console.');
      setProductsLoading(false);
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

  const openAddProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      title: '',
      description: '',
      price: '',
      originalPrice: '',
      sizes: ['S', 'M', 'L', 'XL'],
      imageUrl: ''
    });
    setProductFile(null);
    setImagePreview(null);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product) => {
    setEditingProduct(product);
    setProductForm({
      title: product.title || '',
      description: product.description || '',
      price: product.price || '',
      originalPrice: product.originalPrice || '',
      sizes: product.sizes || ['S', 'M', 'L', 'XL'],
      imageUrl: product.imageUrl || ''
    });
    setProductFile(null);
    setImagePreview(product.imageUrl || null);
    setIsProductModalOpen(true);
  };

  const handleSizeToggle = (size) => {
    const currentSizes = [...productForm.sizes];
    if (currentSizes.includes(size)) {
      setProductForm({
        ...productForm,
        sizes: currentSizes.filter(s => s !== size)
      });
    } else {
      setProductForm({
        ...productForm,
        sizes: [...currentSizes, size]
      });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!productForm.title || !productForm.price) {
      return toast.error('Please provide a title and price.');
    }

    setUploading(true);
    let finalImageUrl = productForm.imageUrl;

    try {
      // 1. Upload file if selected
      if (productFile) {
        finalImageUrl = await new Promise((resolve, reject) => {
          const storageRef = ref(storage, `products/lower_${Date.now()}`);
          const uploadTask = uploadBytesResumable(storageRef, productFile);
          
          uploadTask.on('state_changed',
            null,
            (error) => {
              toast.error('Image upload failed');
              reject(error);
            },
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            }
          );
        });
      }

      // 2. Prepare payload
      const productPayload = {
        title: productForm.title,
        description: productForm.description,
        price: Number(productForm.price),
        originalPrice: productForm.originalPrice ? Number(productForm.originalPrice) : null,
        sizes: productForm.sizes,
        imageUrl: finalImageUrl || 'https://images.unsplash.com/photo-1542272201-b1ca555f8505?auto=format&fit=crop&q=80&w=800',
        updatedAt: new Date(),
        createdAt: editingProduct ? (editingProduct.createdAt || new Date()) : new Date()
      };

      // 3. Save to database
      if (editingProduct) {
        await setDoc(doc(db, 'products', editingProduct.id), productPayload, { merge: true });
        toast.success('Product updated successfully!');
      } else {
        await addDoc(collection(db, 'products'), productPayload);
        toast.success('Product added successfully!');
      }

      setIsProductModalOpen(false);
    } catch (error) {
      console.error("Save product error:", error);
      toast.error('Failed to save product catalog record.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDoc(doc(db, 'products', productId));
        toast.success('Product removed successfully.');
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete product.');
      }
    }
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
            <button 
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-sm transition-all border ${
                activeTab === 'orders'
                  ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-400 border-cyan-500/20 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5 border-transparent'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Orders Management</span>
            </button>

            <button 
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-sm transition-all border ${
                activeTab === 'products'
                  ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-400 border-cyan-500/20 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5 border-transparent'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Products Catalog</span>
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
        
        {/* Header */}
        <header className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-1 text-white">
              {activeTab === 'orders' ? 'Orders Dashboard' : 'Product Inventory'}
            </h1>
            <p className="text-neutral-400 text-sm font-medium">
              {activeTab === 'orders' 
                ? 'Manage your customer orders, view incoming phone checkout forms, and update shipping logs.' 
                : 'Add new lowers products, set dynamic cross-out discounts, custom active sizes, and cover photos.'}
            </p>
          </div>
          <div className="flex items-center space-x-3 bg-white/5 border border-white/5 px-4 py-2 rounded-2xl">
            <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin-slow" />
            <span className="text-xs font-bold text-neutral-300">Live Connection Active</span>
          </div>
        </header>

        {/* TAB 1: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="space-y-6 w-full max-w-5xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold flex items-center space-x-2 text-white">
                <ListFilter className="w-5 h-5 text-cyan-400" />
                <span>Recent Incoming Orders</span>
              </h2>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs font-bold text-neutral-400">
                {orders.length} Total
              </span>
            </div>

            {ordersLoading ? (
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
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-extrabold text-lg text-white leading-none">{order.name}</h3>
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest bg-neutral-900 border border-white/5 px-2 py-0.5 rounded">
                          ID: {order.id.slice(-6).toUpperCase()}
                        </span>
                        {order.productTitle && (
                          <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                            {order.productTitle}
                          </span>
                        )}
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
        )}

        {/* TAB 2: PRODUCTS CRUD */}
        {activeTab === 'products' && (
          <div className="space-y-6 w-full">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold flex items-center space-x-2 text-white">
                <ImageIcon className="w-5 h-5 text-cyan-400" />
                <span>Showcase Store Catalog</span>
              </h2>
              <button 
                onClick={openAddProductModal}
                className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold px-5 py-3 rounded-2xl transition-all duration-300 transform active:scale-95 cursor-pointer shadow-[0_4px_15px_rgba(6,182,212,0.3)] text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>

            {productsLoading ? (
              <div className="glass-effect p-12 rounded-3xl border border-white/5 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="glass-effect p-12 rounded-3xl border border-white/5 text-center text-neutral-500 font-medium">
                Your products catalog is empty. Click "Add Product" to create your first dynamic lower drop!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map(product => (
                  <div key={product.id} className="glass-effect rounded-3xl border border-white/5 overflow-hidden flex flex-col justify-between group shadow-xl relative transition-all duration-300 hover:border-white/10">
                    <div className="aspect-[4/3] overflow-hidden relative bg-neutral-900 border-b border-white/5">
                      <img 
                        src={product.imageUrl} 
                        alt={product.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3 flex space-x-1.5 z-10">
                        <button 
                          onClick={() => openEditProductModal(product)}
                          className="p-2.5 rounded-xl bg-neutral-950/80 hover:bg-cyan-500 border border-white/10 hover:border-cyan-400 text-neutral-300 hover:text-white transition-all cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2.5 rounded-xl bg-neutral-950/80 hover:bg-red-500 border border-white/10 hover:border-red-400 text-neutral-300 hover:text-white transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-extrabold text-lg text-white leading-tight group-hover:text-cyan-400 transition-colors">
                            {product.title}
                          </h3>
                        </div>
                        <p className="text-neutral-400 text-xs font-medium line-clamp-2 leading-relaxed">
                          {product.description || 'No description provided.'}
                        </p>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="flex items-baseline space-x-2">
                          <span className="text-2xl font-black text-white">₹{product.price}</span>
                          {product.originalPrice && (
                            <span className="text-sm text-neutral-500 line-through">₹{product.originalPrice}</span>
                          )}
                        </div>

                        <div>
                          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Available Sizes</div>
                          <div className="flex gap-1.5 flex-wrap">
                            {product.sizes && product.sizes.map(s => (
                              <span key={s} className="px-2.5 py-1 text-[10px] font-black bg-white/5 border border-white/10 text-neutral-300 rounded-lg">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* DYNAMIC FORM MODAL (Add / Edit Product) */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-effect rounded-3xl border border-white/10 w-full max-w-lg overflow-hidden shadow-2xl relative animate-float">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
            
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-white">
                {editingProduct ? 'Edit Catalog Lower' : 'Add New Lower Drop'}
              </h3>
              <button 
                onClick={() => setIsProductModalOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="p-6 space-y-5">
              
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Lower Title *</label>
                <input 
                  type="text" 
                  required
                  value={productForm.title}
                  onChange={(e) => setProductForm({...productForm, title: e.target.value})}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all duration-300 text-sm"
                  placeholder="e.g. Classic Signature Black Lower"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Description</label>
                <textarea 
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  rows="3"
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all duration-300 text-sm resize-none"
                  placeholder="e.g. Premium loops, thick drop blend, pockets with heavy-duty hidden zip..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Price (₹) *</label>
                  <input 
                    type="number" 
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all duration-300 text-sm"
                    placeholder="999"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Original Price (₹)</label>
                  <input 
                    type="number" 
                    value={productForm.originalPrice}
                    onChange={(e) => setProductForm({...productForm, originalPrice: e.target.value})}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all duration-300 text-sm"
                    placeholder="1499"
                  />
                </div>
              </div>

              {/* Sizes Selection */}
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Sizes Configuration</label>
                <div className="flex gap-2.5">
                  {['S', 'M', 'L', 'XL', 'XXL'].map(s => {
                    const isChecked = productForm.sizes.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleSizeToggle(s)}
                        className={`w-10 h-10 rounded-xl font-bold border text-xs transition-all cursor-pointer ${
                          isChecked 
                            ? 'bg-cyan-500 border-cyan-400 text-white shadow-[0_0_10px_rgba(6,182,212,0.3)]' 
                            : 'bg-neutral-950 border-white/10 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* File showcase */}
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Showcase Cover Image</label>
                <div className="flex items-center gap-4">
                  {imagePreview && (
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-neutral-900">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="border-2 border-dashed border-white/10 hover:border-cyan-500/40 rounded-xl p-4 flex-1 text-center relative bg-neutral-950/30 transition-all duration-300">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex items-center justify-center space-x-2 text-xs font-bold text-neutral-300">
                      <Upload className="w-4 h-4 text-cyan-400" />
                      <span>{productFile ? 'Change File' : 'Click to Upload Image'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4 rounded-xl transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-[0_4px_20px_rgba(6,182,212,0.25)] flex items-center justify-center gap-2 text-sm"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      <span>Saving Artifact Record...</span>
                    </>
                  ) : (
                    <span>{editingProduct ? 'Update Product Catalog' : 'Add to Active Drops'}</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
