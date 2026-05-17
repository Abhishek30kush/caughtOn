import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, ArrowLeft, KeyRound } from 'lucide-react';

export default function Login() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }
    
    setLoading(true);
    const adminEmail = 'admin@caughton.com';
    
    try {
      // 1. Try to sign in with the hardcoded admin email and entered password
      await signInWithEmailAndPassword(auth, adminEmail, password);
      toast.success('Logged in successfully!');
      navigate('/admin');
    } catch (error) {
      // 2. If it fails due to user not found (first-time setup)
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
          // Attempt to register 'admin@caughton.com' with the entered password as the initial setup
          await createUserWithEmailAndPassword(auth, adminEmail, password);
          toast.success('Admin account initialized and logged in successfully!');
          navigate('/admin');
        } catch (signUpError) {
          // If the email is already in use, the sign-in error was actually an incorrect password!
          if (signUpError.code === 'auth/email-already-in-use') {
            toast.error('Incorrect admin password. Please try again.');
          } else {
            toast.error('Failed to initialize: ' + signUpError.message);
          }
        }
      } else {
        toast.error('Failed to log in: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white grid-pattern flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Radial glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 radial-glow rounded-full -z-10 pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 radial-glow rounded-full -z-10 pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Back Button */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-400 hover:text-white transition-all hover:scale-105 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Store
        </Link>

        {/* Card */}
        <div className="glass-effect p-8 sm:p-10 rounded-3xl border border-white/5 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>

          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <Lock className="w-8 h-8 text-cyan-400 animate-pulse" />
            </div>
          </div>
          
          <h2 className="text-3xl font-extrabold text-center mb-2">Admin Portal</h2>
          <p className="text-xs text-neutral-500 uppercase tracking-widest text-center mb-8 font-bold">Secret Password Verification</p>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Secret Admin Password</label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-950/50 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all duration-300 font-medium"
                  placeholder="••••••••"
                />
              </div>
              <p className="text-[11px] text-neutral-500 mt-3 leading-relaxed">
                💡 **पहला सेटअप**: यदि आप पहली बार लॉगिन कर रहे हैं, तो जो भी पासवर्ड आप यहाँ डालेंगे वही आपका स्थायी Admin Password बन जाएगा।
              </p>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4 px-4 rounded-2xl shadow-[0_4px_20px_rgba(6,182,212,0.25)] transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? 'Verifying Identity...' : 'Access Dashboard'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
