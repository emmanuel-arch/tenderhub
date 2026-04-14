import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Lock, Eye, EyeOff, CheckCircle, XCircle, ArrowRight, FileText } from 'lucide-react';
import { authApi, ApiError } from '../services/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Toaster } from './ui/sonner';

export function ResetPassword() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const token      = params.get('token') ?? '';

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [errorMsg,  setErrorMsg]  = useState('');

  const validatePassword = (pw: string): string | null => {
    if (pw.length < 7) return 'Password must be at least 7 characters.';
    if (!/[a-z]/.test(pw)) return 'Password must contain a lowercase letter.';
    if (!/[A-Z]/.test(pw)) return 'Password must contain an uppercase letter.';
    if (!/[^a-zA-Z0-9]/.test(pw)) return 'Password must contain a special character.';
    return null;
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const pwError = validatePassword(password);
    if (pwError) {
      toast.error(pwError);
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Toaster />

      <header className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm leading-tight">TenderHub Kenya</div>
              <div className="text-xs text-slate-500 leading-tight">Your Gateway to Opportunities</div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-10 space-y-6">

          {success ? (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Password updated!</h2>
              <p className="text-sm text-slate-500">Your password has been reset. You can now sign in with your new password.</p>
              <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white" onClick={() => navigate('/login')}>
                Sign In
              </Button>
            </div>
          ) : errorMsg && !token ? (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Invalid link</h2>
              <p className="text-sm text-slate-500">This reset link is missing or invalid. Please request a new one.</p>
              <Button variant="outline" className="w-full" onClick={() => navigate('/login')}>
                Back to sign in
              </Button>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Set new password</h2>
                <p className="text-sm text-slate-500 mt-1">Choose a strong password for your account.</p>
              </div>

              {errorMsg && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="new-password">New password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      id="new-password"
                      type={showPw ? 'text' : 'password'}
                      placeholder="Min 7 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-11"
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      id="confirm-password"
                      type={showPw ? 'text' : 'password'}
                      placeholder="Repeat password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      className={`pl-10 h-11 ${confirm && password !== confirm ? 'border-red-400 focus-visible:ring-red-300' : ''}`}
                      disabled={loading}
                      required
                    />
                  </div>
                  {confirm && password !== confirm && (
                    <p className="text-xs text-red-500">Passwords do not match.</p>
                  )}
                </div>

                <Button type="submit" className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white gap-2" disabled={loading}>
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Updating…</>
                    : <>Set new password <ArrowRight className="w-4 h-4" /></>
                  }
                </Button>
              </form>

              <button
                onClick={() => navigate('/login')}
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
