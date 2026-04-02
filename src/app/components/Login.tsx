import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import {
  Mail, Lock, User, KeyRound, ArrowRight,
  CheckCircle, Shield, FileText, BarChart3,
  Globe, Zap, TrendingUp, Eye, EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from './ui/sonner';

type Role = 'client' | 'admin';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated } = useAuth();
  const fromLocation = (location.state as any)?.from;
  const from = fromLocation ? (fromLocation.pathname + (fromLocation.search || '')) : '/';

  // ── Sign-in state ────────────────────────────────────────────────────────
  const [loginEmail, setLoginEmail]       = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading]   = useState(false);

  // ── Sign-up state ────────────────────────────────────────────────────────
  const [regName, setRegName]           = useState('');
  const [regEmail, setRegEmail]         = useState('');
  const [regPassword, setRegPassword]   = useState('');
  const [regConfirm, setRegConfirm]     = useState('');
  const [regRole, setRegRole]           = useState<Role>('client');
  const [adminCode, setAdminCode]       = useState('');
  const [regLoading, setRegLoading]     = useState(false);
  const [showLoginPw, setShowLoginPw]   = useState(false);
  const [showRegPw, setShowRegPw]       = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const stored = localStorage.getItem('auth_user');
      const role = stored ? JSON.parse(stored).role?.toLowerCase() : '';
      navigate(role === 'admin' ? '/admin' : from === '/login' ? '/dashboard' : from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  if (isAuthenticated) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error('Missing fields', { description: 'Please enter your email and password.' });
      return;
    }
    setLoginLoading(true);
    try {
      await login(loginEmail, loginPassword);
      toast.success('Login successful!');
      const stored = localStorage.getItem('auth_user');
      const role = stored ? JSON.parse(stored).role?.toLowerCase() : '';
      navigate(role === 'admin' ? '/admin' : from === '/login' ? '/dashboard' : from);
    } catch (err: any) {
      toast.error('Login failed', { description: err.message ?? 'Invalid email or password.' });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      toast.error('Missing fields', { description: 'Please fill in all required fields.' });
      return;
    }
    if (regPassword !== regConfirm) {
      toast.error('Password mismatch', { description: 'Passwords do not match.' });
      return;
    }
    if (regPassword.length < 6) {
      toast.error('Weak password', { description: 'Password must be at least 6 characters.' });
      return;
    }
    if (regRole === 'admin' && !adminCode) {
      toast.error('Admin code required', { description: 'Please enter the admin registration code.' });
      return;
    }
    setRegLoading(true);
    try {
      await register(regName, regEmail, regPassword, regRole === 'admin' ? adminCode : undefined);
      toast.success('Account created!', { description: 'Welcome to TenderHub Kenya.' });
      const stored = localStorage.getItem('auth_user');
      const role = stored ? JSON.parse(stored).role?.toLowerCase() : '';
      navigate(role === 'admin' ? '/admin' : '/dashboard');
    } catch (err: any) {
      toast.error('Registration failed', { description: err.message });
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Toaster />

      {/* ── Animated background ─────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-500 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-cyan-500 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '4s' }} />
      </div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE4YzAtOS45NC04LjA2LTE4LTE4LTE4UzAgOC4wNiAwIDE4czguMDYgMTggMTggMTggMTgtOC4wNiAxOC0xOHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="relative z-10 min-h-screen flex">

        {/* ── Left: Hero Panel ────────────────────────────────────────────── */}
        <div className="hidden lg:flex lg:w-[55%] items-center justify-center p-12">
          <div className="max-w-lg space-y-10">
            {/* Brand */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-blue-300 text-sm font-medium">
                <Globe className="w-4 h-4" />
                Kenya's Premier Tender Platform
              </div>
              <h1 className="text-5xl font-bold text-white leading-tight">
                TenderHub
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400"> Kenya</span>
              </h1>
              <p className="text-lg text-slate-300 leading-relaxed">
                Your intelligent gateway to government and private sector tender opportunities. Streamline your bid bond applications with our next-generation platform.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              {[
                { value: '2,500+', label: 'Active Tenders', icon: FileText },
                { value: '98%', label: 'Success Rate', icon: TrendingUp },
                { value: '24hr', label: 'Processing', icon: Zap },
              ].map(({ value, label, icon: Icon }) => (
                <div key={label} className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">{value}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* Features */}
            <div className="space-y-4">
              {[
                { title: 'Real-time Scraping', desc: 'Aggregated from KRA, e-GP, and more', color: 'text-emerald-400' },
                { title: 'Bank Integration', desc: 'Apply for bid bonds through multiple banks', color: 'text-blue-400' },
                { title: 'Smart Tracking', desc: 'Monitor application status in real-time', color: 'text-purple-400' },
              ].map(({ title, desc, color }) => (
                <div key={title} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/5 hover:bg-white/10 transition-colors">
                  <CheckCircle className={`w-5 h-5 ${color} flex-shrink-0`} />
                  <div>
                    <div className="text-sm font-semibold text-white">{title}</div>
                    <div className="text-xs text-slate-400">{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 text-xs text-slate-500">
              Trusted by contractors and procurement teams across Kenya
            </div>
          </div>
        </div>

        {/* ── Right: Auth Panel ───────────────────────────────────────────── */}
        <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-8">
          <div className="w-full max-w-md">

            {/* Mobile brand */}
            <div className="lg:hidden text-center mb-8">
              <h1 className="text-3xl font-bold text-white">
                TenderHub <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Kenya</span>
              </h1>
              <p className="text-sm text-slate-400 mt-2">Sign in to access tender opportunities</p>
            </div>

            {/* Auth card with glassmorphism */}
            <div className="rounded-2xl bg-white/[0.07] backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500" />

              <div className="p-8">
                <Tabs defaultValue="login">
                  <TabsList className="w-full mb-6 bg-white/5 border border-white/10">
                    <TabsTrigger value="login" className="flex-1 data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400">
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger value="register" className="flex-1 data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400">
                      Create Account
                    </TabsTrigger>
                  </TabsList>

                  {/* ── Sign In ── */}
                  <TabsContent value="login" className="space-y-5">
                    {/* Social Login */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all cursor-not-allowed opacity-60"
                        title="Coming soon"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                        Google
                      </button>
                      <button
                        type="button"
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all cursor-not-allowed opacity-60"
                        title="Coming soon"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                        GitHub
                      </button>
                    </div>

                    <div className="relative">
                      <Separator className="bg-white/10" />
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-transparent px-3 text-xs text-slate-500 backdrop-blur-sm">
                        or continue with email
                      </span>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email" className="text-sm text-slate-300">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="you@example.com"
                            value={loginEmail}
                            onChange={e => setLoginEmail(e.target.value)}
                            className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                            disabled={loginLoading}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="login-password" className="text-sm text-slate-300">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                          <Input
                            id="login-password"
                            type={showLoginPw ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={loginPassword}
                            onChange={e => setLoginPassword(e.target.value)}
                            className="pl-10 pr-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                            disabled={loginLoading}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPw(!showLoginPw)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                          >
                            {showLoginPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium shadow-lg shadow-blue-600/25 transition-all"
                        disabled={loginLoading}
                      >
                        {loginLoading ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Signing in…
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            Sign In
                            <ArrowRight className="w-4 h-4" />
                          </span>
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  {/* ── Create Account ── */}
                  <TabsContent value="register" className="space-y-5">

                    {/* Role selector */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRegRole('client')}
                        className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                          regRole === 'client'
                            ? 'border-blue-500/50 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        {regRole === 'client' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
                        <FileText className={`w-5 h-5 ${regRole === 'client' ? 'text-blue-400' : 'text-slate-500'}`} />
                        <div className="text-center">
                          <div className={`font-semibold text-sm ${regRole === 'client' ? 'text-blue-300' : 'text-slate-400'}`}>Client</div>
                          <div className="text-xs text-slate-500">Apply for bid bonds</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRegRole('admin')}
                        className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                          regRole === 'admin'
                            ? 'border-indigo-500/50 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        {regRole === 'admin' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />}
                        <Shield className={`w-5 h-5 ${regRole === 'admin' ? 'text-indigo-400' : 'text-slate-500'}`} />
                        <div className="text-center">
                          <div className={`font-semibold text-sm ${regRole === 'admin' ? 'text-indigo-300' : 'text-slate-400'}`}>Admin</div>
                          <div className="text-xs text-slate-500">Manage platform</div>
                        </div>
                      </button>
                    </div>

                    {/* Social Login */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all cursor-not-allowed opacity-60"
                        title="Coming soon"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                        Google
                      </button>
                      <button
                        type="button"
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all cursor-not-allowed opacity-60"
                        title="Coming soon"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                        GitHub
                      </button>
                    </div>

                    <div className="relative">
                      <Separator className="bg-white/10" />
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-transparent px-3 text-xs text-slate-500 backdrop-blur-sm">
                        or register with email
                      </span>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="reg-name" className="text-sm text-slate-300">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                          <Input
                            id="reg-name"
                            placeholder="John Doe"
                            value={regName}
                            onChange={e => setRegName(e.target.value)}
                            className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500"
                            disabled={regLoading}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="reg-email" className="text-sm text-slate-300">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                          <Input
                            id="reg-email"
                            type="email"
                            placeholder="you@example.com"
                            value={regEmail}
                            onChange={e => setRegEmail(e.target.value)}
                            className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500"
                            disabled={regLoading}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="reg-password" className="text-sm text-slate-300">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                            <Input
                              id="reg-password"
                              type={showRegPw ? 'text' : 'password'}
                              placeholder="Min 6 chars"
                              value={regPassword}
                              onChange={e => setRegPassword(e.target.value)}
                              className="pl-9 pr-9 h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500"
                              disabled={regLoading}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowRegPw(!showRegPw)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                            >
                              {showRegPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="reg-confirm" className="text-sm text-slate-300">Confirm</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                            <Input
                              id="reg-confirm"
                              type={showRegPw ? 'text' : 'password'}
                              placeholder="Repeat"
                              value={regConfirm}
                              onChange={e => setRegConfirm(e.target.value)}
                              className="pl-9 h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500"
                              disabled={regLoading}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {regRole === 'admin' && (
                        <div className="space-y-1.5">
                          <Label htmlFor="admin-code" className="text-sm text-indigo-300">Admin Code</Label>
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 w-4 h-4" />
                            <Input
                              id="admin-code"
                              type="password"
                              placeholder="Enter admin registration code"
                              value={adminCode}
                              onChange={e => setAdminCode(e.target.value)}
                              className="pl-10 h-11 bg-indigo-500/10 border-indigo-500/30 text-white placeholder:text-indigo-300/50 focus:border-indigo-400"
                              disabled={regLoading}
                            />
                          </div>
                          <p className="text-xs text-slate-500">Obtain this from your system administrator</p>
                        </div>
                      )}

                      <Button
                        type="submit"
                        className={`w-full h-11 font-medium shadow-lg transition-all ${
                          regRole === 'admin'
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-600/25'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/25'
                        } text-white`}
                        disabled={regLoading}
                      >
                        {regLoading ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Creating…
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            Create {regRole === 'admin' ? 'Admin' : ''} Account
                            <ArrowRight className="w-4 h-4" />
                          </span>
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Footer inside card */}
              <div className="px-8 py-4 bg-white/[0.03] border-t border-white/5">
                <p className="text-center text-xs text-slate-500">
                  By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </div>

            {/* Powered by */}
            <div className="mt-6 text-center text-xs text-slate-600">
              Powered by <span className="text-slate-400 font-medium">Birgena Technologies</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
