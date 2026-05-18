import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, ShieldCheck, Heart, Zap } from 'lucide-react';
import Footer from './Footer';

export default function AboutUs() {
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
            About <span className="text-white">caught</span><span className="gradient-text font-black">On</span>
          </h1>
          <p className="text-neutral-400 text-lg">Engineering the perfect everyday wear for ultimate comfort and motion.</p>
        </div>

        <div className="glass-effect p-6 sm:p-10 rounded-3xl border border-white/5 space-y-8 text-neutral-300 leading-relaxed text-base sm:text-lg relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-2.5 h-full bg-gradient-to-b from-cyan-500 to-blue-500"></div>

          <p>
            Welcome to <strong className="text-white font-bold">caughtOn</strong>. We are a premium apparel brand based in <span className="text-white font-semibold">Prayagraj, Uttar Pradesh</span>, born from a singular, obsessive mission: to create the perfect everyday trackpant.
          </p>
          <p>
            Our journey started with a simple observation: finding a trackpant that perfectly balances comfort, durability, and a modern aesthetic is incredibly difficult. Most options out there either compromise on the fabric quality or fail to provide a tailored, stylish fit.
          </p>
          <p>
            That's why we engineered our signature trackpants. We use premium, high-density, breathable fabrics designed for endless motion—whether you're hitting the gym, lounging at home, or navigating active city streets. Every stitch is carefully crafted to ensure longevity and ultimate comfort.
          </p>
          <p>
            At caughtOn, we believe in keeping things simple. We focus on one core product and we make sure it's the absolute best one you'll ever wear. No distractions, just pure quality.
          </p>
          
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
