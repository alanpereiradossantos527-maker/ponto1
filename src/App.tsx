import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { User } from './types';
import { Auth } from './components/Auth';
import { supabase } from './lib/supabase';
import { EmployeeDashboard } from './views/EmployeeDashboard';
import { ManagerDashboard } from './views/ManagerDashboard';
import { Landing } from './views/Landing';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'landing' | 'login-employee' | 'login-manager' | 'employee' | 'manager'>('landing');

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setView('landing');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      return;
    }

    if (data) {
      setUser(data);

      setView(data.role === 'manager' ? 'manager' : 'employee');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setView('landing');
  };

  if (view === 'landing') {
    return <Landing onSelectMode={(mode) => setView(`login-${mode}` as any)} />;
  }

  if (view === 'login-employee' || view === 'login-manager') {
    const authMode = view === 'login-employee' ? 'employee' : 'manager';
    return <Auth
      mode={authMode}
      onBack={() => setView('landing')}
      onAuthSuccess={(profile) => {
        setUser(profile);
        setView(profile.role === 'manager' ? 'manager' : 'employee');
      }}
    />;
  }

  if (view === 'manager' && user) {
    return <ManagerDashboard user={user} onLogout={handleLogout} />;
  }

  if (view === 'employee' && user) {
    return <EmployeeDashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );
}
