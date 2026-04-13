import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router';
import { ReactNode, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TenderList } from './components/TenderList';
import { TenderDetails } from './components/TenderDetails';
import { BankSelection } from './components/BankSelection';
import { BidBondForm } from './components/BidBondForm';
import { Dashboard } from './components/Dashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { Login } from './components/Login';
import { ApplicationDetails } from './components/ApplicationDetails';
import { HomePage } from './components/HomePage';
import { DirectApply } from './components/DirectApply';

function GoogleAnalytics() {
  const location = useLocation();
  useEffect(() => {
    (window as any).gtag?.('event', 'page_view', {
      page_path: location.pathname + location.search,
    });
  }, [location]);
  return null;
}

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
    </div>
  );
}

function PrivateRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  return isAuthenticated
    ? <>{children}</>
    : <Navigate to="/login" state={{ from: location }} replace />;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children     }</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <GoogleAnalytics />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tenders" element={<TenderList />} />
          <Route path="/login" element={<Login />} />
          <Route path="/tender/:id" element={<TenderDetails />}     />
          <Route path="/tender/:id/banks" element={<PrivateRoute><BankSelection /></PrivateRoute>} />
          <Route path="/tender/:id/bid-bond/:bankId" element={<PrivateRoute><BidBondForm /></PrivateRoute>} />
          <Route path="/apply" element={<PrivateRoute><DirectApply /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/application/:id" element={<PrivateRoute><ApplicationDetails /></PrivateRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
