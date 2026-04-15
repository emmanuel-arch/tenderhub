import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Lock, Eye, EyeOff, ArrowRight, FileText } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { authApi, ApiError } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export function ChangePassword() {
  const navigate   = useNavigate();
  const { user, refreshUser } = useAuth();

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);

  const validatePassword = (pw: string): string | null => {
    if (pw.length < 7)           return 'Password must be at least 7 characters.';
    if (!/[a-z]/.test(pw))       return 'Password must contain a lowercase letter.';
    if (!/[A-Z]/.test(pw))       return 'Password must contain an uppercase letter.';
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
      await authApi.changePassword(password);
      // Update the locally stored user so mustChangePassword is cleared
      if (user) {
        refreshUser({ ...user, mustChangePassword: false });
      }
      toast.success('Password updated!');
      const role = user?.role?.toLowerCase() ?? '';
      navigate(role === 'admin' || role === 'superadmin' ? '/admin' : '/dashboard', { replace: true });
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
              <div className="text-xs text-slate-500 leading-tight">Your Gateway to Opportunities</div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h2 className="text-xl font-bold text-slate-900">Set your password</h2>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            This is your first sign-in. Please choose a new password to continue.
          </p>

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

            <Button
              type="submit"
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white gap-2"
              disabled={loading}
            >
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                : <>Set password <ArrowRight className="w-4 h-4" /></>
              }
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
