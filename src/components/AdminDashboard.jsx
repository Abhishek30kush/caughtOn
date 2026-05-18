import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogOut, Package, Image as ImageIcon, CheckCircle, Clock, Upload, ListFilter, ArrowLeft, RefreshCw, Plus, Edit2, Trash2, X, ChevronUp, ChevronDown } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'products' | 'hero'
  
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
    imageUrl: '',
    features: []
  });

  // Hero showcase settings states
  const [heroSlides, setHeroSlides] = useState([]);
  const [heroUrlInput, setHeroUrlInput] = useState('');
  const [heroLoading, setHeroLoading] = useState(true);
  const [heroSaving, setHeroSaving] = useState(false);
  const [layoutMode, setLayoutMode] = useState('showcase');

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

  // Listen to hero settings config
  useEffect(() => {
    const docRef = doc(db, 'settings', 'hero');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const urls = data.images || (data.imageUrl ? [data.imageUrl] : []);
        setHeroSlides(urls.map((url, index) => ({
          id: `saved_${index}_${Date.now()}`,
          url,
          file: null
        })));
      }
      setHeroLoading(false);
    }, (error) => {
      console.error("Error loading hero settings:", error);
      setHeroLoading(false);
    });
    return unsubscribe;
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

  const handleUpdateLayoutMode = async (mode) => {
    try {
      await setDoc(doc(db, 'settings', 'layout'), { viewMode: mode }, { merge: true });
      toast.success(`Display mode updated to ${mode === 'showcase' ? 'Specs Showcase' : 'Standard Grid'}!`);
    } catch (err) {
      console.error("Error updating layout:", err);
      toast.error("Failed to update layout mode.");
    }
  };

  const handleMultipleHeroFilesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newSlides = files.map((file, index) => {
      const uniqueId = `file_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;
      return {
        id: uniqueId,
        url: URL.createObjectURL(file), // create temporary preview URL
        file
      };
    });

    setHeroSlides(prev => [...prev, ...newSlides]);
    toast.success(`Added ${files.length} images to queue. Click "Save" to upload.`);
  };

  const handleAddHeroUrl = (e) => {
    e.preventDefault();
    if (!heroUrlInput.trim()) return;
    if (!heroUrlInput.startsWith('http://') && !heroUrlInput.startsWith('https://')) {
      return toast.error('Please enter a valid image URL starting with http:// or https://');
    }
    
    const uniqueId = `url_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setHeroSlides(prev => [...prev, {
      id: uniqueId,
      url: heroUrlInput.trim(),
      file: null
    }]);
    setHeroUrlInput('');
    toast.success('Added image URL.');
  };

  const handleRemoveHeroSlide = (id, url, file) => {
    setHeroSlides(prev => prev.filter(slide => slide.id !== id));
    if (file && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
    toast.success('Removed image from list.');
  };

  const handleMoveHeroSlide = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === heroSlides.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedSlides = [...heroSlides];
    
    const temp = updatedSlides[index];
    updatedSlides[index] = updatedSlides[targetIndex];
    updatedSlides[targetIndex] = temp;

    setHeroSlides(updatedSlides);
  };

  const handleHeroSubmit = async (e) => {
    e.preventDefault();
    if (heroSlides.length === 0) {
      return toast.error('Please add at least one hero image or URL.');
    }
    setHeroSaving(true);

    try {
      const finalUrls = [];

      for (let i = 0; i < heroSlides.length; i++) {
        const slide = heroSlides[i];
        if (slide.file) {
          toast.loading(`Uploading image ${i + 1} of ${heroSlides.length}...`, { id: 'hero-upload' });
          const uploadUrl = await new Promise((resolve, reject) => {
            const storageRef = ref(storage, `settings/hero_slide_${Date.now()}_${i}`);
            const uploadTask = uploadBytesResumable(storageRef, slide.file);
            
            uploadTask.on('state_changed',
              null,
              (error) => {
                reject(error);
              },
              async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadURL);
              }
            );
          });
          finalUrls.push(uploadUrl);
          URL.revokeObjectURL(slide.url);
        } else {
          finalUrls.push(slide.url);
        }
      }

      toast.dismiss('hero-upload');
      toast.loading('Saving settings to Firestore...', { id: 'hero-saving' });

      await setDoc(doc(db, 'settings', 'hero'), {
        imageUrl: finalUrls[0] || '', // For backward-compatibility
        images: finalUrls,
        updatedAt: new Date()
      }, { merge: true });

      toast.dismiss('hero-saving');
      toast.success('All Hero Showcase images saved successfully!');
    } catch (error) {
      console.error("Error saving hero images:", error);
      toast.dismiss('hero-upload');
      toast.dismiss('hero-saving');
      toast.error('Failed to upload and save Hero images.');
    } finally {
      setHeroSaving(false);
    }
  };

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
      imageUrl: '',
      features: []
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
      imageUrl: product.imageUrl || '',
      features: product.features ? product.features.map(f => ({
        file: null,
        previewUrl: f.imageUrl || '',
        text: f.text || '',
        imageUrl: f.imageUrl || ''
      })) : []
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

  const handleAddFeature = () => {
    setProductForm(prev => ({
      ...prev,
      features: [...prev.features, { file: null, previewUrl: '', text: '', imageUrl: '' }]
    }));
  };

  const handleRemoveFeature = (index) => {
    const updatedFeatures = [...productForm.features];
    const removed = updatedFeatures.splice(index, 1)[0];
    if (removed.previewUrl && removed.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(removed.previewUrl);
    }
    setProductForm(prev => ({
      ...prev,
      features: updatedFeatures
    }));
  };

  const handleFeatureFileChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const updatedFeatures = [...productForm.features];
      if (updatedFeatures[index].previewUrl && updatedFeatures[index].previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(updatedFeatures[index].previewUrl);
      }
      updatedFeatures[index] = {
        ...updatedFeatures[index],
        file,
        previewUrl: URL.createObjectURL(file)
      };
      setProductForm(prev => ({
        ...prev,
        features: updatedFeatures
      }));
    }
  };

  const handleFeatureTextChange = (index, value) => {
    const updatedFeatures = [...productForm.features];
    updatedFeatures[index] = {
      ...updatedFeatures[index],
      text: value
    };
    setProductForm(prev => ({
      ...prev,
      features: updatedFeatures
    }));
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
          const storageRef = ref(storage, `products/trackpant_${Date.now()}`);
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

      // 2. Upload all feature files if selected
      const uploadedFeatures = [];
      for (let i = 0; i < productForm.features.length; i++) {
        const feature = productForm.features[i];
        if (feature.file) {
          toast.loading(`Uploading detail image ${i + 1} of ${productForm.features.length}...`, { id: 'feature-upload' });
          const uploadUrl = await new Promise((resolve, reject) => {
            const storageRef = ref(storage, `features/detail_${Date.now()}_${i}`);
            const uploadTask = uploadBytesResumable(storageRef, feature.file);
            
            uploadTask.on('state_changed',
              null,
              (error) => {
                toast.error(`Detail image ${i + 1} upload failed`);
                reject(error);
              },
              async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadURL);
              }
            );
          });
          uploadedFeatures.push({
            imageUrl: uploadUrl,
            text: feature.text || ''
          });
          if (feature.previewUrl && feature.previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(feature.previewUrl);
          }
        } else {
          uploadedFeatures.push({
            imageUrl: feature.imageUrl || '',
            text: feature.text || ''
          });
        }
      }
      toast.dismiss('feature-upload');

      // 3. Prepare payload
      const productPayload = {
        title: productForm.title,
        description: productForm.description,
        price: Number(productForm.price),
        originalPrice: productForm.originalPrice ? Number(productForm.originalPrice) : null,
        sizes: productForm.sizes,
        imageUrl: finalImageUrl || 'https://images.unsplash.com/photo-1542272201-b1ca555f8505?auto=format&fit=crop&q=80&w=800',
        features: uploadedFeatures,
        updatedAt: new Date(),
        createdAt: editingProduct ? (editingProduct.createdAt || new Date()) : new Date()
      };

      // 4. Save to database
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
      toast.dismiss('feature-upload');
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

            <button 
              onClick={() => setActiveTab('hero')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-sm transition-all border ${
                activeTab === 'hero'
                  ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-400 border-cyan-500/20 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5 border-transparent'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Hero Customizer</span>
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
                : 'Add new trackpants products, set dynamic cross-out discounts, custom active sizes, and cover photos.'}
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold flex items-center space-x-2 text-white">
                  <Package className="w-5 h-5 text-cyan-400" />
                  <span>Flagship Drop Manager</span>
                </h2>
                <p className="text-neutral-400 text-xs mt-1 leading-relaxed">
                  Manage the details, price, sizes, and multiple specification lookbook images of your flagship drop.
                </p>
              </div>
              
              {products.length === 0 ? (
                <button 
                  onClick={openAddProductModal}
                  className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold px-5 py-3 rounded-2xl transition-all duration-300 transform active:scale-95 cursor-pointer shadow-[0_4px_15px_rgba(6,182,212,0.3)] text-sm self-start sm:self-center"
                >
                  <Plus className="w-4 h-4" />
                  <span>Setup Flagship Drop</span>
                </button>
              ) : (
                <div className="inline-flex items-center space-x-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest self-start sm:self-center">
                  <CheckCircle className="w-4 h-4 text-cyan-400" />
                  <span>Flagship Active</span>
                </div>
              )}
            </div>

            {/* Single Product Store Management Info Alert */}
            <div className="glass-effect p-5 rounded-2xl border border-cyan-500/10 bg-cyan-950/5/5 space-y-2">
              <h3 className="text-xs font-extrabold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                Single-Product Store Mode Active
              </h3>
              <p className="text-neutral-400 text-xs leading-relaxed font-medium">
                The storefront is optimized for your single flagship design drop. Visitors will directly see its details, cover photo, sizes config, and the **entire vertical lookbook specs list** (images and descriptions) stacked neatly on the main page. To launch a different drop, click **"Edit Product & Specs Details"** below, or delete this record to start fresh.
              </p>
            </div>

            {productsLoading ? (
              <div className="glass-effect p-12 rounded-3xl border border-white/5 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="glass-effect p-12 rounded-3xl border border-white/5 text-center text-neutral-500 font-medium space-y-4 max-w-md mx-auto">
                <Package className="w-10 h-10 text-neutral-600 mx-auto animate-pulse" />
                <p className="text-xs leading-relaxed">No flagship product drop configured yet. Click "Setup Flagship Drop" above to launch your primary drop!</p>
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

                        {/* Showcase dynamic features preview inside Admin catalog card */}
                        {product.features && product.features.length > 0 && (
                          <div className="pt-2 border-t border-white/5">
                            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Lookbook Specs ({product.features.length})</div>
                            <div className="flex flex-col gap-1.5 max-h-[100px] overflow-y-auto pr-1">
                              {product.features.map((feat, fIdx) => (
                                <div key={fIdx} className="flex items-center gap-2 text-[10px] text-neutral-300 bg-white/5 rounded-lg p-1.5 border border-white/5">
                                  {feat.imageUrl && (
                                    <img src={feat.imageUrl} className="w-5 h-5 rounded object-cover shrink-0" alt="" />
                                  )}
                                  <span className="truncate flex-1">{feat.text || 'No description'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Explicit High-Visibility Edit Buttons */}
                      <div className="pt-4 border-t border-white/5 flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditProductModal(product)}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 text-xs font-bold border border-cyan-500/20 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit Product & Specs Details</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: HERO BANNER CUSTOMIZER */}
        {activeTab === 'hero' && (
          <div className="space-y-6 w-full max-w-3xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold flex items-center space-x-2 text-white">
                <Upload className="w-5 h-5 text-cyan-400" />
                <span>Landing Page Hero Slideshow Customizer</span>
              </h2>
            </div>

            {heroLoading ? (
              <div className="glass-effect p-12 rounded-3xl border border-white/5 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Image List & Order Configuration (Left 3 columns) */}
                <div className="lg:col-span-3 space-y-6">
                  <form onSubmit={handleHeroSubmit} className="glass-effect p-8 rounded-3xl border border-white/5 space-y-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
                    
                    <div className="space-y-2">
                      <h3 className="font-extrabold text-lg text-white">Active Slideshow Items</h3>
                      <p className="text-neutral-400 text-xs font-medium leading-relaxed">
                        Arrange the order of images to be displayed in the automatic hero section slideshow. Upload local files or link external URLs.
                      </p>
                    </div>

                    {/* Slides list */}
                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                      {heroSlides.length === 0 ? (
                        <div className="border border-dashed border-white/5 rounded-2xl p-8 text-center text-neutral-500 text-xs font-bold uppercase tracking-wider">
                          No images in slideshow. Add some below!
                        </div>
                      ) : (
                        heroSlides.map((slide, index) => (
                          <div 
                            key={slide.id} 
                            className="bg-neutral-900/60 hover:bg-neutral-900 border border-white/5 rounded-2xl p-3 flex items-center justify-between gap-4 transition-all"
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <span className="text-xs font-black text-neutral-600 bg-neutral-950 border border-white/5 w-6 h-6 flex items-center justify-center rounded-lg shrink-0">
                                {index + 1}
                              </span>
                              <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-950 border border-white/10 shrink-0">
                                <img src={slide.url} alt={`Slide ${index + 1}`} className="w-full h-full object-cover" />
                              </div>
                              <div className="overflow-hidden">
                                <div className="text-xs font-extrabold text-neutral-300 truncate max-w-[150px] sm:max-w-[200px]">
                                  {slide.file ? `File: ${slide.file.name}` : slide.url}
                                </div>
                                <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded mt-1 ${
                                  slide.file 
                                    ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' 
                                    : slide.id.startsWith('url_')
                                      ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                                      : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                }`}>
                                  {slide.file ? 'Upload Pending' : slide.id.startsWith('url_') ? 'Link Pending' : 'Live Sync'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => handleMoveHeroSlide(index, 'up')}
                                className="p-2 rounded-xl bg-neutral-950 border border-white/5 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-all"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={index === heroSlides.length - 1}
                                onClick={() => handleMoveHeroSlide(index, 'down')}
                                className="p-2 rounded-xl bg-neutral-950 border border-white/5 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-all"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveHeroSlide(slide.id, slide.url, slide.file)}
                                className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all ml-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={heroSaving || heroSlides.length === 0}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4 rounded-xl transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-[0_4px_20px_rgba(6,182,212,0.25)] flex items-center justify-center gap-2 text-sm"
                      >
                        {heroSaving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                            <span>Saving & Uploading Slideshow...</span>
                          </>
                        ) : (
                          <span>Save Hero Showcase Images ({heroSlides.length})</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Add Slide controls (Right 2 columns) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Option 1: URL input */}
                  <div className="glass-effect p-6 rounded-3xl border border-white/5 space-y-4 shadow-xl">
                    <h3 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                      Add Link Image
                    </h3>
                    
                    <form onSubmit={handleAddHeroUrl} className="space-y-3">
                      <input 
                        type="url"
                        value={heroUrlInput}
                        onChange={(e) => setHeroUrlInput(e.target.value)}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all duration-300 text-xs"
                        placeholder="Paste image URL (https://unsplash.com/...)"
                      />
                      <button
                        type="submit"
                        className="w-full bg-white/5 hover:bg-cyan-500 border border-white/10 hover:border-cyan-400 text-neutral-300 hover:text-white transition-all text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add URL Image</span>
                      </button>
                    </form>
                  </div>

                  {/* Option 2: File Upload */}
                  <div className="glass-effect p-6 rounded-3xl border border-white/5 space-y-4 shadow-xl">
                    <h3 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                      Upload Image Files
                    </h3>

                    <div className="border-2 border-dashed border-white/10 hover:border-cyan-500/40 rounded-2xl p-6 text-center relative bg-neutral-950/30 transition-all duration-300">
                      <input 
                        type="file" 
                        accept="image/*"
                        multiple
                        onChange={handleMultipleHeroFilesChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex flex-col items-center justify-center space-y-2 text-xs font-bold text-neutral-300">
                        <Upload className="w-6 h-6 text-cyan-400 mb-1" />
                        <span className="text-xs">Drag or Click to Choose Images</span>
                        <span className="text-[9px] text-neutral-500 font-medium">Select one or more files</span>
                      </div>
                    </div>
                  </div>
                </div>
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
                {editingProduct ? 'Edit Catalog Trackpant' : 'Add New Trackpant Drop'}
              </h3>
              <button 
                onClick={() => setIsProductModalOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Trackpant Title *</label>
                <input 
                  type="text" 
                  required
                  value={productForm.title}
                  onChange={(e) => setProductForm({...productForm, title: e.target.value})}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all duration-300 text-sm"
                  placeholder="e.g. Classic Signature Black Trackpant"
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

              {/* Product Details Showcase List */}
              <div className="space-y-4 border-t border-white/5 pt-4">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest">Product Feature Details</label>
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="flex items-center space-x-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Image Detail</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {productForm.features && productForm.features.map((feature, index) => (
                    <div key={index} className="bg-neutral-950/60 p-4 rounded-2xl border border-white/5 space-y-3 relative">
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(index)}
                        className="absolute top-2.5 right-2.5 text-neutral-500 hover:text-red-400 p-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-2">
                          <span className="text-[10px] text-neutral-500 font-black uppercase tracking-wider block">Detail Image {index + 1}</span>
                          <div className="flex items-center gap-3">
                            {feature.previewUrl && (
                              <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-neutral-900">
                                <img src={feature.previewUrl} alt="Feature" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="border border-dashed border-white/10 hover:border-cyan-500/40 rounded-xl p-3 flex-1 text-center relative bg-neutral-950/30 transition-all cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFeatureFileChange(index, e)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              />
                              <span className="text-xs font-bold text-neutral-300">
                                {feature.file || feature.imageUrl ? 'Change Image' : 'Choose Image'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[10px] text-neutral-500 font-black uppercase tracking-wider block">Feature Property Description</span>
                          <input
                            type="text"
                            value={feature.text}
                            onChange={(e) => handleFeatureTextChange(index, e.target.value)}
                            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-neutral-700 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs"
                            placeholder="e.g. Premium Loops / 100% Street Premium Fabric"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
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
