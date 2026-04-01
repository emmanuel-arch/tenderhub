import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router';
import { ReactNode } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TenderList } from './components/TenderList';
import { TenderDetails } from './components/TenderDetails';
import { BankSelection } from './components/BankSelection';
import { BidBondForm } from './components/BidBondForm';
import { Dashboard } from './components/Dashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { Login } from './components/Login';
import { ApplicationDetails } from './components/ApplicationDetails';

function PrivateRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  return isAuthenticated
    ? <>{children}</>
    : <Navigate to="/login" state={{ from: location }} replace />;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<TenderList />} />
          <Route path="/login" element={<Login />} />
          <Route path="/tender/:id" element={<TenderDetails />} />
          <Route path="/tender/:id/banks" element={<PrivateRoute><BankSelection /></PrivateRoute>} />
          <Route path="/tender/:id/bid-bond/:bankId" element={<PrivateRoute><BidBondForm /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/application/:id" element={<PrivateRoute><ApplicationDetails /></PrivateRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
