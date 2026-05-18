import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, ShieldCheck, Heart, Zap } from 'lucide-react';
import Footer from './Footer';
import { db, DEFAULT_SETTINGS } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function AboutUs() {
  const [storefrontSettings, setStorefrontSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    const docRef = doc(db, 'settings', 'storefront');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStorefrontSettings({
          ...DEFAULT_SETTINGS,
          ...data
        });
      }
    }, (error) => {
      console.error("Error loading storefront settings in about us:", error);
    });
    return unsubscribe;
  }, []);

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

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-24 relative z-10 w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Sparkles className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            {storefrontSettings.aboutTitle || "About caughtOn"}
          </h1>
          <p className="text-neutral-400 text-lg">{storefrontSettings.aboutTagline}</p>
        </div>

        <div className="glass-effect p-6 sm:p-10 rounded-3xl border border-white/5 space-y-8 text-neutral-300 leading-relaxed text-base sm:text-lg relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-2.5 h-full bg-gradient-to-b from-cyan-500 to-blue-500"></div>

          {(storefrontSettings.aboutParagraphs || []).map((para, index) => (
            <p key={index} className="whitespace-pre-line">
              {para}
            </p>
          ))}
          
          <div className="pt-8 mt-8 border-t border-white/5">
            <h3 className="text-xl font-extrabold text-white mb-6 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              Our Core Pillars
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-cyan-500/20 transition-all duration-300">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-3">
                  <Zap className="w-4 h-4 text-cyan-400" />
                </div>
                <h4 className="text-white font-bold text-sm mb-1">Premium Fabric</h4>
                <p className="text-xs text-neutral-400 font-medium">High-density stretch blends designed for breathability and motion.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-cyan-500/20 transition-all duration-300">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-3">
                  <Heart className="w-4 h-4 text-cyan-400" />
                </div>
                <h4 className="text-white font-bold text-sm mb-1">Comfort First</h4>
                <p className="text-xs text-neutral-400 font-medium">Ergonomic fit designed carefully for all Indian body shapes.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
