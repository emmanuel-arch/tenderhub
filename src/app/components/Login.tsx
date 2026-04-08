import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Mail, Lock, User, KeyRound, ArrowRight, ChevronLeft,
  FileText, Shield, Eye, EyeOff, CheckCircle, Building2, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from './ui/sonner';

type Role = 'client' | 'admin';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated } = useAuth();
  const fromLocation = (location.state as any)?.from;
  const from = fromLocation ? (fromLocation.pathname + (fromLocation.search || '')) : '/dashboard';

  const [loginEmail, setLoginEmail]       = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading]   = useState(false);

  const [regName, setRegName]         = useState('');
  const [regEmail, setRegEmail]       = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm]   = useState('');
  const [regRole, setRegRole]         = useState<Role>('client');
  const [adminCode, setAdminCode]     = useState('');
  const [regLoading, setRegLoading]   = useState(false);
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [showRegPw, setShowRegPw]     = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const stored = localStorage.getItem('auth_user');
      const role = stored ? JSON.parse(stored).role?.toLowerCase() : '';
      navigate(role === 'admin' ? '/admin' : from === '/login' ? '/tenders' : from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  if (isAuthenticated) return null;

  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
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
      navigate(role === 'admin' ? '/admin' : from);
    } catch (err: any) {
      toast.error('Login failed', { description: err.message ?? 'Invalid email or password.' });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.SyntheticEvent<HTMLFormElement>) => {
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
      navigate(role === 'admin' ? '/admin' : '/tenders');
    } catch (err: any) {
      toast.error('Registration failed', { description: err.message });
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Toaster />

      {/* Nav */}
      <header className="bg-white border-b border-slate-100 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/tenders')}>
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm leading-tight">TenderHub Kenya</div>
              <div className="text-xs text-slate-500 leading-tight">Your Gateway to Opportunities</div>
            </div>
          </div>
          <button
            onClick={() => navigate('/tenders')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Tenders
          </button>
        </div>
      </header>

      {/* Split layout */}
      <div className="flex-1 flex">

        {/* ── Left Panel ── */}
        <div className="hidden lg:flex lg:w-[48%] bg-slate-50 flex-col justify-between p-12 border-r border-slate-100">
          <div className="space-y-10">

            {/* Headline */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-900 text-sm px-3 py-1.5 rounded-full border border-green-200">
                <TrendingUp className="w-3.5 h-3.5" />
                615+ Active Tenders Available
              </div>
              <h2 className="text-4xl font-bold text-slate-900 leading-tight">
                Win More Tenders,<br />
                <span className="text-green-800">Faster Than Ever</span>
              </h2>
              <p className="text-slate-500 text-base leading-relaxed">
                TenderHub aggregates government and private sector tenders in one place — so you spend less time searching and more time winning.
              </p>
            </div>

            {/* Feature cards */}
            <div className="space-y-3">
              {[
                {
                  icon: Building2,
                  color: 'bg-blue-50 text-blue-900',
                  title: 'All Sources in One Place',
                  desc: 'Tenders from tenders.go.ke, KRA, county governments, and private organisations — aggregated and kept up to date.',
                },
                {
                  icon: Shield,
                  color: 'bg-green-50 text-green-700',
                  title: 'Bid Bond Applications',
                  desc: 'Apply for bid bonds through our partner banks directly from the platform. Track status in real time.',
                },
                {
                  icon: CheckCircle,
                  color: 'bg-green-50 text-green-800',
                  title: 'Never Miss a Deadline',
                  desc: 'Active tenders are refreshed every 6 hours. Expired tenders are automatically removed from your feed.',
                },
              ].map(({ icon: Icon, color, title, desc }) => (
                <div key={title} className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{title}</div>
                    <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: '615+', label: 'Active Tenders' },
                { value: '4', label: 'Categories' },
                { value: '24/7', label: 'Access' },
              ].map(({ value, label }) => (
                <div key={label} className="text-center p-4 rounded-xl bg-white border border-slate-200">
                  <div className="text-2xl font-bold text-slate-900">{value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div className="mt-8 p-4 rounded-xl bg-white border border-slate-200">
            <p className="text-sm text-slate-600 italic leading-relaxed">
              "TenderHub has transformed how we find and apply for government tenders. We no longer miss opportunities."
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">JM</div>
              <div>
                <div className="text-xs font-semibold text-slate-900">James Mwangi</div>
                <div className="text-xs text-slate-400">Procurement Manager, Nairobi</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Panel: Form ── */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-lg">

            {/* Mobile heading */}
            <div className="lg:hidden text-center mb-8">
              <h1 className="text-2xl font-bold text-slate-900">Welcome to TenderHub</h1>
              <p className="text-sm text-slate-500 mt-1">Sign in to access tender opportunities</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-900">Sign in to your account</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Welcome back — pick up where you left off</p>
                </div>

                <Tabs defaultValue="login">
                  <TabsList className="w-full mb-6">
                    <TabsTrigger value="login" className="flex-1">Sign In</TabsTrigger>
                    <TabsTrigger value="register" className="flex-1">Create Account</TabsTrigger>
                  </TabsList>

                  {/* ── Sign In ── */}
                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="login-email">Email address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="you@example.com"
                            value={loginEmail}
                            onChange={e => setLoginEmail(e.target.value)}
                            className="pl-10 h-11"
                            disabled={loginLoading}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="login-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <Input
                            id="login-password"
                            type={showLoginPw ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={loginPassword}
                            onChange={e => setLoginPassword(e.target.value)}
                            className="pl-10 pr-10 h-11"
                            disabled={loginLoading}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPw(!showLoginPw)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showLoginPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white gap-2 mt-2"
                        disabled={loginLoading}
                      >
                        {loginLoading
                          ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in…</>
                          : <>Sign In <ArrowRight className="w-4 h-4" /></>
                        }
                      </Button>
                    </form>
                  </TabsContent>

                  {/* ── Create Account ── */}
                  <TabsContent value="register">
                    {/* Role selector */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {(['client', 'admin'] as Role[]).map(role => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setRegRole(role)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                            regRole === role
                              ? 'border-slate-900 bg-slate-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {role === 'client'
                            ? <FileText className={`w-5 h-5 ${regRole === role ? 'text-slate-900' : 'text-slate-400'}`} />
                            : <Shield className={`w-5 h-5 ${regRole === role ? 'text-slate-900' : 'text-slate-400'}`} />
                          }
                          <div className="text-center">
                            <div className={`font-semibold text-sm capitalize ${regRole === role ? 'text-slate-900' : 'text-slate-400'}`}>{role}</div>
                            <div className="text-xs text-slate-400">{role === 'client' ? 'Apply for bid bonds' : 'Manage platform'}</div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <form onSubmit={handleRegister} className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="reg-name">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <Input id="reg-name" placeholder="John Doe" value={regName} onChange={e => setRegName(e.target.value)} className="pl-10 h-11" disabled={regLoading} required />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="reg-email">Email address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <Input id="reg-email" type="email" placeholder="you@example.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} className="pl-10 h-11" disabled={regLoading} required />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="reg-password">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <Input id="reg-password" type={showRegPw ? 'text' : 'password'} placeholder="Min 6 chars" value={regPassword} onChange={e => setRegPassword(e.target.value)} className="pl-9 pr-9 h-11" disabled={regLoading} required />
                            <button type="button" onClick={() => setShowRegPw(!showRegPw)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                              {showRegPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="reg-confirm">Confirm</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <Input id="reg-confirm" type={showRegPw ? 'text' : 'password'} placeholder="Repeat" value={regConfirm} onChange={e => setRegConfirm(e.target.value)} className="pl-9 h-11" disabled={regLoading} required />
                          </div>
                        </div>
                      </div>

                      {regRole === 'admin' && (
                        <div className="space-y-1.5">
                          <Label htmlFor="admin-code">Admin Code</Label>
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <Input id="admin-code" type="password" placeholder="Enter admin registration code" value={adminCode} onChange={e => setAdminCode(e.target.value)} className="pl-10 h-11" disabled={regLoading} />
                          </div>
                          <p className="text-xs text-slate-400">Obtain this from your system administrator</p>
                        </div>
                      )}

                      <Button type="submit" className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white gap-2 mt-1" disabled={regLoading}>
                        {regLoading
                          ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating…</>
                          : <>Create Account <ArrowRight className="w-4 h-4" /></>
                        }
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="px-8 py-4 bg-slate-50 border-t border-slate-100">
                <p className="text-center text-xs text-slate-400">
                  By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
