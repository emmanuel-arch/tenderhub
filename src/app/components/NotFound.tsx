import { useNavigate } from 'react-router';
import { FileSearch, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';

export function NotFound() {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-3">
            <button onClick={() => navigate('/')} className="text-left hover:opacity-80 transition-opacity cursor-pointer">
              <h1 className="text-lg sm:text-2xl font-bold text-slate-900">TenderHub Kenya</h1>
              <p className="text-xs sm:text-sm text-slate-600 hidden sm:block">Discover government and private sector opportunities</p>
            </button>
            <div className="flex items-center gap-2 shrink-0">
              {user ? (
                <>
                  {isAdmin ? (
                    <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>Admin</Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>Dashboard</Button>
                  )}
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-slate-50">
                    <div className="w-6 h-6 rounded-full bg-blue-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <span className="text-sm text-slate-700 font-medium">{user.name}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={logout} className="gap-1.5">
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={() => navigate('/login')}>Sign In</Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
            <FileSearch className="w-8 h-8 text-slate-400" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900">404</h1>
          <p className="text-slate-500">The page you're looking for doesn't exist.</p>
          <div className="flex gap-3 justify-center pt-2">
            <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
            <Button className="bg-slate-900 hover:bg-slate-800 text-white" onClick={() => navigate('/tenders')}>Browse Tenders</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
