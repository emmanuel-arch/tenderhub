import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { authApi, ApiError } from '../services/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Mail, Lock, User, KeyRound, ArrowRight, ChevronLeft,
  FileText, Shield, Eye, EyeOff, MailCheck, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from './ui/sonner';
import { LoginLeftPanel } from './auth/LoginLeftPanel';

type Role = 'client' | 'admin';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated } = useAuth();
  const fromLocation = (location.state as any)?.from;
  const rawFrom = fromLocation ? (fromLocation.pathname + (fromLocation.search || '')) : '/dashboard';
  const from = !rawFrom || rawFrom === '/login' ? '/dashboard' : rawFrom;

  const [loginEmail, setLoginEmail]             = useState('');
  const [loginPassword, setLoginPassword]       = useState('');
  const [loginLoading, setLoginLoading]         = useState(false);
  const [unverifiedEmail, setUnverifiedEmail]   = useState<string | null>(null);
  const [resendLoading, setResendLoading]       = useState(false);

  // "check your email" state shown after successful registration
  const [checkEmailFor, setCheckEmailFor]       = useState<string | null>(null);

  // Forgot-password panel
  const [showForgot, setShowForgot]             = useState(false);
  const [forgotEmail, setForgotEmail]           = useState('');
  const [forgotLoading, setForgotLoading]       = useState(false);
  const [forgotSent, setForgotSent]             = useState(false);

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
      navigate(role === 'admin' ? '/admin' : from, { replace: true });
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
    setUnverifiedEmail(null);
    try {
      await login(loginEmail, loginPassword);
      toast.success('Login successful!');
      const stored = localStorage.getItem('auth_user');
      const role = stored ? JSON.parse(stored).role?.toLowerCase() : '';
      navigate(role === 'admin' ? '/admin' : from);
    } catch (err: any) {
      if (err instanceof ApiError && err.errorCode === 'EMAIL_NOT_CONFIRMED') {
        setUnverifiedEmail(err.errorEmail ?? loginEmail);
      } else {
        toast.error('Login failed', { description: err.message ?? 'Invalid email or password.' });
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const validatePassword = (pw: string): string | null => {
    if (pw.length < 7) return 'Password must be at least 7 characters.';
    if (!/[a-z]/.test(pw)) return 'Password must contain a lowercase letter.';
    if (!/[A-Z]/.test(pw)) return 'Password must contain an uppercase letter.';
    if (!/[^a-zA-Z0-9]/.test(pw)) return 'Password must contain a special character.';
    return null;
  };

  const handleRegister = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      toast.error('Missing fields', { description: 'Please fill in all required fields.' });
      return;
    }
    const pwError = validatePassword(regPassword);
    if (pwError) {
      toast.error('Weak password', { description: pwError });
      return;
    }
    if (regPassword !== regConfirm) {
      toast.error('Password mismatch', { description: 'Passwords do not match.' });
      return;
    }
    if (regRole === 'admin' && !adminCode) {
      toast.error('Admin code required', { description: 'Please enter the admin registration code.' });
      return;
    }
    setRegLoading(true);
    try {
      const res = await register(regName, regEmail, regPassword, regRole === 'admin' ? adminCode : undefined);
      setCheckEmailFor(res.email);
    } catch (err: any) {
      toast.error('Registration failed', { description: err.message });
    } finally {
      setRegLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!forgotEmail) { toast.error('Please enter your email address.'); return; }
    setForgotLoading(true);
    try {
      await authApi.forgotPassword(forgotEmail);
      setForgotSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResend = async (email: string) => {
    setResendLoading(true);
    try {
      await authApi.resendVerification(email);
      toast.success('Verification email sent', { description: 'Check your inbox for the new link.' });
    } catch {
      toast.error('Failed to resend. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  // ── Check-email screen (shown after registration) ─────────────────────────
  if (checkEmailFor) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Toaster />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
              <MailCheck className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Check your email</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              We sent a verification link to <span className="font-semibold text-slate-700">{checkEmailFor}</span>.<br />
              Click the link to activate your account.
            </p>
            <p className="text-xs text-slate-400">Didn't receive it? Check your spam folder or resend below.</p>
            <Button
              variant="outline"
              className="gap-2"
              disabled={resendLoading}
              onClick={() => handleResend(checkEmailFor)}
            >
              {resendLoading
                ? <><RefreshCw className="w-4 h-4 animate-spin" />Sending…</>
                : <><RefreshCw className="w-4 h-4" />Resend verification email</>
              }
            </Button>
            <div>
              <button
                onClick={() => setCheckEmailFor(null)}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Back to sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Forgot-password screen ────────────────────────────────────────────────
  if (showForgot) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Toaster />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-10 space-y-6">
            {forgotSent ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                  <MailCheck className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Check your email</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  If <span className="font-semibold text-slate-700">{forgotEmail}</span> is registered, a password reset link has been sent. The link expires in 1 hour.
                </p>
                <button
                  onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(''); }}
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Forgot your password?</h2>
                  <p className="text-sm text-slate-500 mt-1">Enter your email and we'll send you a reset link.</p>
                </div>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="forgot-email">Email address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="you@example.com"
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        className="pl-10 h-11"
                        disabled={forgotLoading}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white gap-2" disabled={forgotLoading}>
                    {forgotLoading
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending…</>
                      : <>Send reset link <ArrowRight className="w-4 h-4" /></>
                    }
                  </Button>
                </form>
                <button
                  onClick={() => setShowForgot(false)}
                  className="block w-full text-center text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Back to sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

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

        <LoginLeftPanel />

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

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => { setShowForgot(true); setForgotEmail(loginEmail); }}
                          className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
                        >
                          Forgot password?
                        </button>
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

                      {unverifiedEmail && (
                        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm space-y-2">
                          <p className="text-amber-800 font-medium">Email not verified</p>
                          <p className="text-amber-700 text-xs">
                            Please check your inbox for the verification link sent to <span className="font-semibold">{unverifiedEmail}</span>.
                          </p>
                          <button
                            type="button"
                            disabled={resendLoading}
                            onClick={() => handleResend(unverifiedEmail)}
                            className="flex items-center gap-1.5 text-xs text-amber-800 font-medium hover:underline disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3 h-3 ${resendLoading ? 'animate-spin' : ''}`} />
                            {resendLoading ? 'Sending…' : 'Resend verification email'}
                          </button>
                        </div>
                      )}
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
                            <Input id="reg-password" type={showRegPw ? 'text' : 'password'} placeholder="Min 7 chars" value={regPassword} onChange={e => setRegPassword(e.target.value)} className="pl-9 pr-9 h-11" disabled={regLoading} required />
                            <button type="button" onClick={() => setShowRegPw(!showRegPw)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                              {showRegPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="reg-confirm">Confirm</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <Input id="reg-confirm" type={showRegPw ? 'text' : 'password'} placeholder="Repeat" value={regConfirm} onChange={e => setRegConfirm(e.target.value)} className={`pl-9 h-11 ${regConfirm && regPassword !== regConfirm ? 'border-red-400 focus-visible:ring-red-300' : ''}`} disabled={regLoading} required />
                          </div>
                          {regConfirm && regPassword !== regConfirm && (
                            <p className="text-xs text-red-500">Passwords do not match.</p>
                          )}
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
