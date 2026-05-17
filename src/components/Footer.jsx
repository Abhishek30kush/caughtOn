import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-neutral-950 border-t border-neutral-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-12 mb-12">
        {/* Brand */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold gradient-text">caughtOn</h2>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Premium everyday lowers designed for comfort and motion. 
            Upgrade your wardrobe with our latest drops.
          </p>
          <div className="flex space-x-4 pt-2">
            <a href="#" className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-white font-bold mb-6 tracking-wide uppercase text-sm">Quick Links</h3>
          <ul className="space-y-3">
            <li>
              <Link to="/about" className="text-neutral-400 hover:text-white text-sm transition-colors">About Us</Link>
            </li>
            <li>
              <Link to="/track-order" className="text-neutral-400 hover:text-white text-sm transition-colors">Track Order</Link>
            </li>
            <li>
              <Link to="/policies/privacy" className="text-neutral-400 hover:text-white text-sm transition-colors">Privacy Policy</Link>
            </li>
            <li>
              <Link to="/policies/terms" className="text-neutral-400 hover:text-white text-sm transition-colors">Terms & Conditions</Link>
            </li>
            <li>
              <Link to="/policies/return" className="text-neutral-400 hover:text-white text-sm transition-colors">Return & Exchange</Link>
            </li>
            <li>
              <Link to="/policies/shipping" className="text-neutral-400 hover:text-white text-sm transition-colors">Shipping Policy</Link>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="lg:col-span-2">
          <h3 className="text-white font-bold mb-6 tracking-wide uppercase text-sm">Contact Us</h3>
          <ul className="space-y-4">
            <li className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <span className="text-neutral-400 text-sm leading-relaxed">
                Prayagraj, Uttar Pradesh<br/>
                Pin - 211011
              </span>
            </li>
            <li className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-cyan-400 flex-shrink-0" />
              <span className="text-neutral-400 text-sm">7275977711</span>
            </li>
            <li className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-cyan-400 flex-shrink-0" />
              <span className="text-neutral-400 text-sm">coughton@gmail.com</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-neutral-800 text-center flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-neutral-600 text-sm">
          © {new Date().getFullYear()} caughtOn. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
