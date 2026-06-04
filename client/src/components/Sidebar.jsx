import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Clock, Activity, LogOut, LayoutDashboard, UserCircle, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'schedule', label: 'Schedule', icon: Clock },
    { id: 'history', label: 'History', icon: Activity },
    { id: 'profile', label: 'Pet Profile', icon: UserCircle },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  ];

  return (
    <div className="w-full md:w-72 bg-slate-950 text-slate-100 border-r border-slate-800 flex flex-col justify-between h-auto md:h-screen sticky top-0 shadow-lg">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-300 shadow-inner">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Smart Feeder</h1>
            <p className="text-sm text-slate-400">Live feed control</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 rounded-3xl px-4 py-3 text-left text-sm font-semibold transition duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-6 border-t border-slate-800 bg-slate-950/90">
        <div className="flex flex-col gap-1 mb-4 px-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Account</span>
          <span className="text-sm font-medium text-slate-200 truncate">{user?.email}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-3xl bg-slate-900 text-blue-200 hover:text-white hover:bg-slate-800 transition-colors font-medium text-sm"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
