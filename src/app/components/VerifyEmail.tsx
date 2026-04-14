import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { CheckCircle, XCircle, Loader2, Mail, RefreshCw, FileText } from 'lucide-react';
import { authApi, ApiError } from '../services/api';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { Toaster } from './ui/sonner';

type Status = 'verifying' | 'success' | 'error';

export function VerifyEmail() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const token      = params.get('token') ?? '';

  const [status,  setStatus]  = useState<Status>('verifying');
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the link. Please use the link sent to your email.');
      return;
    }

    authApi.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err: unknown) => {
        setStatus('error');
        setMessage(
          err instanceof ApiError
            ? err.message
            : 'Verification failed. Please try again.'
        );
      });
  }, [token]);

  const handleResend = async () => {
    if (!resendEmail) { toast.error('Please enter your email address.'); return; }
    setResendLoading(true);
    try {
      await authApi.resendVerification(resendEmail);
      toast.success('Verification email sent', { description: 'Check your inbox for the new link.' });
    } catch {
      toast.error('Failed to resend. Please try again.');
    } finally {
      setResendLoading(false);
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
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center space-y-6">

          {status === 'verifying' && (
            <>
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 text-blue-900 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Verifying your email…</h2>
              <p className="text-sm text-slate-500">Please wait a moment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Email verified!</h2>
              <p className="text-sm text-slate-500">
                Your account is now active. You can sign in and start applying for bid bonds.
              </p>
              <Button
                className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Verification failed</h2>
              <p className="text-sm text-slate-500">{message}</p>

              <div className="border-t border-slate-100 pt-5 space-y-3">
                <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />Request a new verification link
                </p>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={resendEmail}
                  onChange={e => setResendEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                />
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  disabled={resendLoading}
                  onClick={handleResend}
                >
                  {resendLoading
                    ? <><RefreshCw className="w-4 h-4 animate-spin" />Sending…</>
                    : <><RefreshCw className="w-4 h-4" />Resend verification email</>
                  }
                </Button>
              </div>

              <button
                onClick={() => navigate('/login')}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
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
