import { BrowserRouter, Routes, Route } from 'react-router';
import { AuthProvider } from './contexts/AuthContext';
import { TenderList } from './components/TenderList';
import { TenderDetails } from './components/TenderDetails';
import { BankSelection } from './components/BankSelection';
import { BidBondForm } from './components/BidBondForm';
import { Dashboard } from './components/Dashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { Login } from './components/Login';
import { ApplicationDetails } from './components/ApplicationDetails';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<TenderList />} />
          <Route path="/login" element={<Login />} />
          <Route path="/tender/:id" element={<TenderDetails />} />
          <Route path="/tender/:id/banks" element={<BankSelection />} />
          <Route path="/tender/:id/bid-bond/:bankId" element={<BidBondForm />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/application/:id" element={<ApplicationDetails />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
