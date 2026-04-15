import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Lock, Mail, User, Eye, EyeOff, ArrowRight, FileText } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ApiError } from '../services/api';

const BASE_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

async function checkSetupDone(): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/api/auth/setup`);
  const data = await res.json();
  return data.setupDone;
}

async function submitSetup(name: string, email: string, password: string) {
  const res = await fetch(`${BASE_URL}/api/auth/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.message ?? `Setup failed: ${res.status}`);
  }
}

export function Setup() {
  const navigate = useNavigate();

  const [checking, setChecking]   = useState(true);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [name,     setName]        = useState('');
  const [email,    setEmail]       = useState('');
  const [password, setPassword]    = useState('');
  const [confirm,  setConfirm]     = useState('');
  const [showPw,   setShowPw]      = useState(false);
  const [loading,  setLoading]     = useState(false);

  useEffect(() => {
    checkSetupDone()
      .then(done => { if (done) setAlreadyDone(true); })
      .finally(() => setChecking(false));
  }, []);

  const validatePassword = (pw: string): string | null => {
    if (pw.length < 7)            return 'Password must be at least 7 characters.';
    if (!/[a-z]/.test(pw))        return 'Password must contain a lowercase letter.';
    if (!/[A-Z]/.test(pw))        return 'Password must contain an uppercase letter.';
    if (!/[^a-zA-Z0-9]/.test(pw)) return 'Password must contain a special character.';
    return null;
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const pwError = validatePassword(password);
    if (pwError) { toast.error(pwError); return; }
    if (password !== confirm) { toast.error('Passwords do not match.'); return; }

    setLoading(true);
    try {
      await submitSetup(name, email, password);
      toast.success('Super admin created! Redirecting to sign in…');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Something went wrong.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Toaster />

      <header className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm leading-tight">TenderHub Kenya</div>
              <div className="text-xs text-slate-500 leading-tight">Initial Setup</div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          {checking ? (
            <div className="flex justify-center py-8">
              <span className="w-6 h-6 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
            </div>
          ) : alreadyDone ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <ArrowRight className="w-6 h-6 text-green-700" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Setup already complete</h2>
              <p className="text-sm text-slate-500">An admin account already exists.</p>
              <Button className="bg-slate-900 hover:bg-slate-800 text-white w-full" onClick={() => navigate('/login')}>
                Go to Sign In
              </Button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-slate-900">Create Super Admin</h2>
              <p className="text-sm text-slate-500 mt-1 mb-6">
                Set up the first administrator account. This page is only available once.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="setup-name">Full name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input id="setup-name" placeholder="Jane Doe" value={name} onChange={e => setName(e.target.value)} className="pl-10 h-11" disabled={loading} required />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="setup-email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input id="setup-email" type="email" placeholder="admin@example.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-10 h-11" disabled={loading} required />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="setup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input id="setup-password" type={showPw ? 'text' : 'password'} placeholder="Min 7 characters" value={password} onChange={e => setPassword(e.target.value)} className="pl-10 pr-10 h-11" disabled={loading} required />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="setup-confirm">Confirm password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input id="setup-confirm" type={showPw ? 'text' : 'password'} placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} className={`pl-10 h-11 ${confirm && password !== confirm ? 'border-red-400 focus-visible:ring-red-300' : ''}`} disabled={loading} required />
                  </div>
                  {confirm && password !== confirm && (
                    <p className="text-xs text-red-500">Passwords do not match.</p>
                  )}
                </div>

                <Button type="submit" className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white gap-2 mt-2" disabled={loading}>
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating…</>
                    : <>Create Super Admin <ArrowRight className="w-4 h-4" /></>
                  }
                </Button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
