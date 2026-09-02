import React, { useEffect, useState } from 'react';
import { LogIn, LogOut, UserCircle } from 'lucide-react';

interface Session {
  authenticated: boolean;
  user: { email?: string; name?: string; picture?: string } | null;
}

export const GoogleAuthButton: React.FC = () => {
  const [session, setSession] = useState<Session>({ authenticated: false, user: null });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const response = await fetch('/api/auth/session', { credentials: 'same-origin' });
      if (response.ok) setSession(await response.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    await load();
  };

  if (loading) return null;

  if (session.authenticated) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-700" title={session.user?.email || ''}>
          {session.user?.picture ? <img src={session.user.picture} alt="" className="w-5 h-5 rounded-full" /> : <UserCircle className="w-4 h-4 text-teal-700" />}
          <span className="max-w-32 truncate">{session.user?.name || session.user?.email || 'Google-bruker'}</span>
        </div>
        <button type="button" onClick={logout} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl" title="Logg ut av Google">
          <LogOut className="w-3.5 h-3.5" /><span className="hidden sm:inline">Logg ut</span>
        </button>
      </div>
    );
  }

  return (
    <a href="/auth/google" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl" title="Logg inn med Google">
      <LogIn className="w-3.5 h-3.5" /><span>Logg inn med Google</span>
    </a>
  );
};
