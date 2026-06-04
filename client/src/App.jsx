import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Chatbot from './components/Chatbot';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const AppRoutes = () => {
  const { user } = useContext(AuthContext);
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    </Routes>
  );
};

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-slate-950 text-slate-100 shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500 text-base font-bold text-white shadow-lg shadow-blue-500/20">
            SF
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">Smart Feeder</p>
            <p className="text-xs text-slate-400">Connected feeding made simple</p>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center gap-3 text-sm">
          {!user ? (
            <>
              <Link
                to="/login"
                className="rounded-full bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-500"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="rounded-full border border-blue-500 px-4 py-2 font-medium text-blue-100 transition hover:bg-slate-900"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <>
              <span className="text-slate-300">Hello, {user.email?.split('@')[0]}</span>
              <button
                onClick={handleLogout}
                className="rounded-full bg-slate-800 px-4 py-2 font-medium text-white transition hover:bg-slate-700"
              >
                Sign Out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
          <Navbar />
          <Toaster position="top-right" toastOptions={{ duration: 3000, className: 'text-sm font-medium rounded-xl shadow-md' }} />
          <main className="flex-1 flex flex-col">
            <AppRoutes />
          </main>
          <Chatbot />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
