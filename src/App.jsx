import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LandingPage from './components/LandingPage';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import AboutUs from './components/AboutUs';
import PolicyPages from './components/PolicyPages';
import TrackOrder from './components/TrackOrder';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-neutral-900 text-white font-sans selection:bg-cyan-500/30">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/policies/:type" element={<PolicyPages />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin/*" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
          </Routes>
          <Toaster position="bottom-right" toastOptions={{
            style: {
              background: '#333',
              color: '#fff',
            },
          }} />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
