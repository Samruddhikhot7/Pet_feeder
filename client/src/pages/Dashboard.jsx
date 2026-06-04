import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Power, Settings, Clock, Activity, Wifi, XCircle, ChevronDown, Check, AlertTriangle, Bell, UserCircle, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import Button from '../components/Button';
import Table from '../components/Table';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data States
  const [schedules, setSchedules] = useState([]);
  const [quantity, setQuantity] = useState('medium');
  const [history, setHistory] = useState([]);
  const [profile, setProfile] = useState({ name: '', breed: '', age: '', weight: '', recommendation: '' });
  const [trends, setTrends] = useState([]);
  const [alerts, setAlerts] = useState({ notEatingProperly: false, lowFoodLevel: false, missedFeeding: false });
  
  // UI States
  const [feeding, setFeeding] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // Form States
  const [newHour, setNewHour] = useState('12');
  const [newMinute, setNewMinute] = useState('00');
  
  // Simulated Device Status
  const [isDeviceOnline, setIsDeviceOnline] = useState(true);

  useEffect(() => {
    Promise.all([fetchProfile(), fetchData()]).finally(() => setLoadingInitial(false));
    const interval = setInterval(fetchData, 15000); 
    
    // Simulate real-time connectivity flapping
    const statusInterval = setInterval(() => {
        if(Math.random() > 0.95) setIsDeviceOnline(prev => !prev);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(statusInterval);
    };
  }, []);

  const fetchProfile = async () => {
    try {
      const profRes = await api.get('/profile').catch(() => ({ data: { name: '', breed: '', age: '', weight: '', recommendation: '' } }));
      setProfile(profRes.data);
    } catch (err) {}
  };

  const fetchData = async () => {
    try {
      const [schedRes, quantRes, histRes, trendRes, alertRes] = await Promise.all([
        api.get('/schedule'),
        api.get('/quantity'),
        api.get('/history'),
        api.get('/analytics/trends').catch(() => ({ data: [] })),
        api.get('/analytics/alerts').catch(() => ({ data: { notEatingProperly: false, lowFoodLevel: false, missedFeeding: false } }))
      ]);
      setSchedules(schedRes.data);
      setQuantity(quantRes.data.level || 'medium');
      setHistory(histRes.data);
      setTrends(trendRes.data);
      setAlerts(alertRes.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
    }
  };

  const handleManualFeed = async () => {
    if(!isDeviceOnline) return toast.error('Device is currently offline!');
    
    setFeeding(true);
    const pumpToast = toast.loading('Initiating pump sequence...');
    
    try {
      await api.post('/feed/manual');
      toast.success('Feeding started!', { id: pumpToast });
      fetchData(); 
    } catch (err) {
      toast.error('Failed to communicate with feeder.', { id: pumpToast });
    } finally {
      setTimeout(() => setFeeding(false), 2000);
    }
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    try {
      await api.post('/schedule', { hour: parseInt(newHour), minute: parseInt(newMinute) });
      fetchData();
      setNewHour('');
      setNewMinute('');
      toast.success('Schedule created');
    } catch (err) {
      toast.error('Failed to create schedule');
    }
  };

  const handleDeleteSchedule = async (id) => {
    try {
      await api.delete(`/schedule/${id}`);
      fetchData();
      toast.success('Schedule removed');
    } catch (err) {
      toast.error('Failed to remove schedule');
    }
  };

  const handleUpdateQuantity = async (level) => {
    try {
      await api.post('/quantity', { level });
      setQuantity(level);
      toast.success(`Portion size adjusted to ${level}`);
    } catch (err) {
      toast.error('Failed to adjust portion');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    const toastId = toast.loading('Saving profile and generating AI recommendation...');
    try {
      const res = await api.post('/profile', profile);
      setProfile(res.data);
      toast.success('Pet profile saved!', { id: toastId });
    } catch (err) {
      toast.error('Failed to save profile', { id: toastId });
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Activity className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Syncing with Smart Feeder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white capitalize">{activeTab.replace('-', ' ')}</h1>
            <p className="text-sm text-slate-400">Monitor and control your pet's feeding routine.</p>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 rounded-full border border-slate-800 shadow-sm">
             <div className={`w-2.5 h-2.5 rounded-full ${isDeviceOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
             <span className="text-sm font-medium text-slate-200">
               Feeder {isDeviceOnline ? 'Online' : 'Offline'}
             </span>
          </div>
        </header>

        {/* Alerts Banner */}
        {(alerts.notEatingProperly || alerts.lowFoodLevel || alerts.missedFeeding) && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex flex-col gap-3">
            {alerts.lowFoodLevel && (
              <div className="flex items-center gap-3 text-red-400">
                <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-sm">Low Food Level Alert</div> 
                  <div className="text-xs text-red-400/80">The hopper is almost empty. Please refill soon!</div>
                </div>
              </div>
            )}
            {alerts.missedFeeding && (
              <div className="flex items-center gap-3 text-orange-400">
                <Bell className="w-6 h-6 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-sm">Missed Feeding Alert</div> 
                  <div className="text-xs text-orange-400/80">A scheduled feeding seems to have been missed.</div>
                </div>
              </div>
            )}
            {alerts.notEatingProperly && (
              <div className="flex items-center gap-3 text-yellow-400">
                <Activity className="w-6 h-6 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-sm">Not Eating Properly Alert</div> 
                  <div className="text-xs text-yellow-400/80">No feeds detected in the last 24 hours. Check on your pet.</div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Quick Feed Card */}
            <Card className="lg:col-span-2 relative overflow-hidden group border-slate-800 hover:border-blue-500">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-gradient-to-br from-blue-500/15 to-slate-950 rounded-full opacity-70 pointer-events-none transition-transform group-hover:scale-110"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 h-full">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Dispense Food</h3>
                  <p className="text-slate-300 mb-6 max-w-sm">
                    Manually trigger the feeder pump to drop food immediately.
                  </p>
                  <Button 
                    onClick={handleManualFeed} 
                    isLoading={feeding}
                    disabled={!isDeviceOnline}
                    className="w-48 py-3 rounded-full flex items-center justify-center gap-3 shadow-blue-600/20"
                  >
                    {!feeding && <Power className="w-5 h-5" />}
                    <span>{feeding ? 'Dispensing...' : 'Feed Now'}</span>
                  </Button>
                </div>
                
                <div className="hidden md:block">
                  <div className="w-32 h-32 rounded-full border-[6px] border-blue-500/20 flex items-center justify-center shadow-inner relative">
                    <div className={`absolute inset-0 rounded-full border-[6px] border-blue-400/70 border-t-transparent ${feeding ? 'animate-spin' : ''}`}></div>
                    <Activity className={`w-12 h-12 text-blue-400 ${feeding ? 'animate-pulse' : ''}`} />
                  </div>
                </div>
              </div>
            </Card>

            {/* Quantity Selector Card */}
            <Card title="Portion Size" icon={Settings}>
               <div className="space-y-3">
                {['low', 'medium', 'high'].map(level => {
                  const isSelected = quantity === level;
                  return (
                    <button
                      key={level}
                      onClick={() => handleUpdateQuantity(level)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-500/10 shadow-sm text-white'
                          : 'border-slate-700 hover:border-blue-500/50 hover:bg-slate-900/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                         <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-blue-400' : 'bg-slate-700'}`}></div>
                         <span className="capitalize font-medium">{level} Portion</span>
                      </div>
                      <span className="text-xs text-slate-300 font-medium bg-slate-950/90 px-2 py-1 rounded-md border border-slate-700">
                        {level==='low' ? '20s' : level==='medium' ? '40s' : '60s'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </Card>

          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
           <Card title="Feeding Automations" icon={Clock} className="max-w-3xl">
             <form onSubmit={handleAddSchedule} className="flex gap-4 mb-8 bg-slate-900/80 p-4 rounded-3xl border border-slate-800">
               <div className="flex-1 flex items-center gap-2">
                 <input
                   type="number"
                   min="0"
                   max="23"
                   className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono outline-none text-slate-100"
                   placeholder="HH"
                   value={newHour}
                   onChange={e => setNewHour(e.target.value)}
                   required
                 />
                 <span className="text-xl font-bold text-slate-400">:</span>
                 <input
                   type="number"
                   min="0"
                   max="59"
                   className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono outline-none text-slate-100"
                   placeholder="MM"
                   value={newMinute}
                   onChange={e => setNewMinute(e.target.value)}
                   required
                 />
               </div>
               <Button type="submit">
                 Add Time
               </Button>
             </form>

             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               {schedules.length === 0 ? (
                 <div className="col-span-full py-8 text-center text-slate-400 border-2 border-dashed border-slate-800 rounded-2xl">
                   No schedules have been configured yet.
                 </div>
               ) : (
                 schedules.map(sched => (
                   <div key={sched._id} className="group relative flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg hover:border-blue-500/60 hover:shadow-2xl transition-all">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                         <Clock className="w-5 h-5" />
                       </div>
                       <span className="text-xl font-bold text-slate-100 tracking-tight">
                         {String(sched.hour).padStart(2,'0')}:{String(sched.minute).padStart(2,'0')}
                       </span>
                     </div>
                     <button 
                       onClick={() => handleDeleteSchedule(sched._id)}
                       className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                       title="Delete schedule"
                     >
                       <XCircle className="w-5 h-5" />
                     </button>
                   </div>
                 ))
               )}
             </div>
           </Card>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <Card title="Activity Log" icon={Activity}>
             <Table data={history} emptyMessage="No dispensing history found for this device." />
          </Card>
        )}

        {/* Pet Profile Tab */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Pet Details" icon={UserCircle}>
              <form onSubmit={handleSaveProfile} className="space-y-5 mt-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-1.5">Pet Name</label>
                  <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} placeholder="e.g. Max" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-1.5">Breed</label>
                  <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" value={profile.breed} onChange={e => setProfile({...profile, breed: e.target.value})} placeholder="e.g. Golden Retriever" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-1.5">Age (Years)</label>
                    <input type="number" min="0" step="0.1" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" value={profile.age} onChange={e => setProfile({...profile, age: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-1.5">Weight (kg)</label>
                    <input type="number" min="0" step="0.1" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" value={profile.weight} onChange={e => setProfile({...profile, weight: e.target.value})} />
                  </div>
                </div>
                <Button type="submit" className="w-full py-3 mt-4" isLoading={isSavingProfile}>Save Profile</Button>
              </form>
            </Card>

            <Card title="AI Recommendations" icon={Activity}>
              {profile.name ? (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 mt-2 relative overflow-hidden min-h-[150px]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                  <h3 className="text-xl font-bold text-blue-400 mb-3 tracking-tight">Feeding Advice for {profile.name}</h3>
                  {profile.recommendation ? (
                    <div className="text-slate-200 text-[15px] leading-relaxed italic border-l-2 border-blue-500 pl-4 py-1">
                      "{profile.recommendation}"
                    </div>
                  ) : (
                     <div className="flex items-center gap-2 text-slate-400 text-sm">
                       <Activity className="w-4 h-4 animate-spin text-blue-400" />
                       Generating intelligent advice...
                     </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                  <UserCircle className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm italic">Please fill out and save the pet profile to see recommendations.</p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 gap-6">
            <Card title="Eating Trends (Last 7 Days)" icon={BarChart2} className="min-h-[450px] flex flex-col">
              <div className="flex-1 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#475569" fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} dx={-10} />
                    <Tooltip 
                      cursor={{ fill: '#1e293b' }}
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="feeds" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        )}

      </main>
    </div>
  );
};

export default Dashboard;
