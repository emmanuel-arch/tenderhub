import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Building2, Mail, Lock, User, KeyRound,
  CheckCircle, Shield, FileText, BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from './ui/sonner';

type Role = 'client' | 'admin';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated } = useAuth();
  const from = (location.state as any)?.from?.pathname || '/';

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

  if (isAuthenticated) {
    const stored = localStorage.getItem('auth_user');
    const role = stored ? JSON.parse(stored).role?.toLowerCase() : '';
    navigate(role === 'admin' ? '/admin' : from === '/login' ? '/dashboard' : from, { replace: true });
    return null;
  }

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-4">
      <Toaster />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

        {/* ── Auth Card ───────────────────────────────────────────────────── */}
        <Card className="w-full">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">TenderHub Kenya</CardTitle>
              <CardDescription className="mt-2">
                Sign in or create an account to get started
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="w-full mb-6">
                <TabsTrigger value="login"  className="flex-1">Sign In</TabsTrigger>
                <TabsTrigger value="register" className="flex-1">Create Account</TabsTrigger>
              </TabsList>

              {/* ── Sign In ── */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        className="pl-10"
                        disabled={loginLoading}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        className="pl-10"
                        disabled={loginLoading}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={loginLoading}>
                    {loginLoading ? 'Signing in…' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              {/* ── Create Account ── */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">

                  {/* Role selector */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRegRole('client')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                        regRole === 'client'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <FileText className={`w-6 h-6 ${regRole === 'client' ? 'text-blue-600' : 'text-slate-400'}`} />
                      <div className="text-center">
                        <div className={`font-semibold text-sm ${regRole === 'client' ? 'text-blue-700' : 'text-slate-700'}`}>
                          Client
                        </div>
                        <div className="text-xs text-slate-500">Browse &amp; apply for bid bonds</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegRole('admin')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                        regRole === 'admin'
                          ? 'border-blue-800 bg-blue-100'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Shield className={`w-6 h-6 ${regRole === 'admin' ? 'text-blue-800' : 'text-slate-400'}`} />
                      <div className="text-center">
                        <div className={`font-semibold text-sm ${regRole === 'admin' ? 'text-blue-900' : 'text-slate-700'}`}>
                          Admin
                        </div>
                        <div className="text-xs text-slate-500">Manage banks &amp; applications</div>
                      </div>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <Input
                        id="reg-name"
                        placeholder="John Doe"
                        value={regName}
                        onChange={e => setRegName(e.target.value)}
                        className="pl-10"
                        disabled={regLoading}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="you@example.com"
                        value={regEmail}
                        onChange={e => setRegEmail(e.target.value)}
                        className="pl-10"
                        disabled={regLoading}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                          id="reg-password"
                          type="password"
                          placeholder="Min 6 chars"
                          value={regPassword}
                          onChange={e => setRegPassword(e.target.value)}
                          className="pl-9"
                          disabled={regLoading}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-confirm">Confirm</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                          id="reg-confirm"
                          type="password"
                          placeholder="Repeat"
                          value={regConfirm}
                          onChange={e => setRegConfirm(e.target.value)}
                          className="pl-9"
                          disabled={regLoading}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Admin code — only shown when Admin role is selected */}
                  {regRole === 'admin' && (
                    <div className="space-y-2">
                      <Label htmlFor="admin-code">Admin Registration Code</Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-700 w-5 h-5" />
                        <Input
                          id="admin-code"
                          type="password"
                          placeholder="Enter the admin code"
                          value={adminCode}
                          onChange={e => setAdminCode(e.target.value)}
                          className="pl-10 border-blue-400 focus:border-blue-700"
                          disabled={regLoading}
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        Obtain this code from your system administrator.
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className={`w-full ${regRole === 'admin' ? 'bg-blue-800 hover:bg-blue-900' : ''}`}
                    size="lg"
                    disabled={regLoading}
                  >
                    {regLoading
                      ? 'Creating account…'
                      : `Create ${regRole === 'admin' ? 'Admin' : 'Client'} Account`}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* ── Feature panels ──────────────────────────────────────────────── */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">What to Expect</h2>
            <p className="text-slate-600">Two account types with different capabilities</p>
          </div>

          {/* Client */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-blue-900">Client Account</CardTitle>
                  <CardDescription className="text-blue-700">For tender applicants &amp; contractors</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                ['Browse Tenders', 'Government and private sector tenders with filtering'],
                ['Apply for Bid Bonds', 'Submit applications through multiple Kenyan banks'],
                ['Track Applications', 'Monitor status in real-time'],
                ['Download Documents', 'Access approved bid bonds'],
              ].map(([title, desc]) => (
                <div key={title} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <strong>{title}:</strong> {desc}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Admin */}
          <Card className="border-blue-300 bg-blue-100">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-800 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-blue-900">Admin Account</CardTitle>
                  <CardDescription className="text-blue-800">Requires admin registration code</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                ['Bank Management', 'Add, edit, and manage banks offering bid bond services'],
                ['Application Oversight', 'View and monitor all client applications'],
                ['User Analytics', 'Track platform usage and statistics'],
              ].map(([title, desc]) => (
                <div key={title} className="flex items-start gap-3">
                  <BarChart3 className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <strong>{title}:</strong> {desc}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
