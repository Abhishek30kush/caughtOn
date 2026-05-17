import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Shield, FileText, RotateCcw, Truck } from 'lucide-react';
import Footer from './Footer';

const policies = {
  privacy: {
    title: "Privacy Policy",
    icon: Shield,
    content: `At caughtOn, we prioritize your privacy. We collect basic information like your name, phone number, and address strictly for fulfilling your orders. We do not sell or share your personal data with third-party marketing agencies. Your information is securely stored and only accessible by authorized personnel for delivery purposes.`
  },
  terms: {
    title: "Terms & Conditions",
    icon: FileText,
    content: `By using the caughtOn website, you agree to our terms. All products and prices are subject to change without prior notice. We reserve the right to refuse service or cancel orders if fraudulent activity is suspected. The content, logo, and images on this site are the property of caughtOn and may not be used without permission.`
  },
  return: {
    title: "Return & Exchange Policy",
    icon: RotateCcw,
    content: `We offer a 7-day return and exchange policy from the date of delivery. Items must be unused, unwashed, and in their original packaging with tags intact. If you received a defective item or the wrong size, please contact us immediately at coughton@gmail.com with photos of the product. Refunds (if applicable) will be processed once the returned item is inspected.`
  },
  shipping: {
    title: "Shipping Policy",
    icon: Truck,
    content: `We ship all orders from our base in Prayagraj. Orders are typically processed within 24-48 hours. Delivery takes 3-7 business days depending on your location. We offer Cash on Delivery (COD) as our primary payment method for your convenience. Free delivery is available on all standard orders.`
  }
};

export default function PolicyPages() {
  const { type } = useParams();
  const policy = policies[type] || { 
    title: "Policy Not Found", 
    icon: FileText, 
    content: "The policy you are looking for does not exist." 
  };

  const IconComponent = policy.icon;

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
          <Link to="/" className="text-xs sm:text-sm font-semibold text-neutral-400 hover:text-white transition-all hover:scale-105 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Store
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-24 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column Sidebar */}
          <div className="lg:col-span-4 w-full">
            <div className="glass-effect p-6 rounded-3xl border border-white/5 shadow-xl">
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Legal Directory</h3>
              <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 pb-2 lg:pb-0 scrollbar-none">
                {Object.entries(policies).map(([key, item]) => {
                  const ItemIcon = item.icon;
                  const isActive = key === type;
                  return (
                    <Link
                      key={key}
                      to={`/policies/${key}`}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-400 border border-cyan-500/30'
                          : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <ItemIcon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column Content */}
          <div className="lg:col-span-8 w-full">
            <div className="glass-effect p-6 sm:p-12 rounded-3xl border border-white/5 relative overflow-hidden shadow-2xl min-h-[300px] sm:min-h-[400px]">
              <div className="absolute top-0 left-0 w-2.5 h-full bg-gradient-to-b from-cyan-500 to-blue-500"></div>

              <div className="flex items-center space-x-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <IconComponent className="w-6 h-6 text-cyan-400" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">{policy.title}</h1>
              </div>

              <div className="prose prose-invert max-w-none text-neutral-300 leading-relaxed text-base sm:text-lg">
                {policy.content.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-6 font-medium text-neutral-400 leading-relaxed">{paragraph}</p>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
