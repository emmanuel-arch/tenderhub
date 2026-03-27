import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Building2, Mail, CheckCircle, Shield, FileText, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from './ui/sonner';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Email required', {
        description: 'Please enter your email address.',
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Invalid email', {
        description: 'Please enter a valid email address.',
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate a brief loading state
    setTimeout(() => {
      login(email);
      
      const isAdmin = email.toLowerCase() === 'admin@example.com';
      
      toast.success('Login successful!', {
        description: isAdmin 
          ? 'Redirecting to admin dashboard...' 
          : 'Welcome back! Redirecting to your dashboard...',
      });

      // Redirect based on email
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate(from === '/login' ? '/dashboard' : from);
      }
      
      setIsLoading(false);
    }, 500);
  };

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate(from === '/login' ? '/dashboard' : from);
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-4">
      <Toaster />
      
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Login Form */}
        <Card className="w-full">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">Welcome to TenderHub Kenya</CardTitle>
              <CardDescription className="mt-2">
                Sign in to access your personalized tender management dashboard
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>

              <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-900 font-medium mb-2">Demo Accounts:</p>
                <div className="space-y-2">
                  <div className="text-sm text-slate-700">
                    <strong>Client:</strong> client@example.com
                  </div>
                  <div className="text-sm text-slate-700">
                    <strong>Admin:</strong> admin@example.com
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    Or use any email address to create a new client account
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* What to Expect Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">What to Expect After Login</h2>
            <p className="text-slate-600">Choose your account type to see what features you'll access</p>
          </div>

          {/* Client Features */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-blue-900">Client Dashboard</CardTitle>
                  <CardDescription className="text-blue-700">For tender applicants & contractors</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <strong>Browse Tenders:</strong> Access government and private sector tenders with advanced filtering
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <strong>Apply for Bid Bonds:</strong> Submit bid bond applications through multiple Kenyan banks
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <strong>Track Applications:</strong> Monitor your bid bond application status in real-time
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <strong>Download Documents:</strong> Access approved bid bonds and required documentation
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <strong>Save & Organize:</strong> Save tenders for later and manage your tender portfolio
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Features */}
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-purple-900">Admin Dashboard</CardTitle>
                  <CardDescription className="text-purple-700">For platform administrators only</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <BarChart3 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-purple-900">
                  <strong>Bank Management:</strong> Add, edit, and manage banks offering bid bond services
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BarChart3 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-purple-900">
                  <strong>Application Oversight:</strong> View and monitor all user applications across the platform
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BarChart3 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-purple-900">
                  <strong>User Analytics:</strong> Track platform usage and application statistics
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BarChart3 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-purple-900">
                  <strong>System Control:</strong> Manage platform settings and configurations
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}