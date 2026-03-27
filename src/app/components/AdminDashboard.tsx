import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Shield, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { banks as initialBanks, Bank, mockApplications } from '../data/mockData';
import { mockUsers } from '../data/users';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Toaster } from './ui/sonner';
import { BankManagementTab } from './admin/BankManagementTab';
import { BankFormDialog } from './admin/BankFormDialog';
import { ApplicationsTab } from './admin/ApplicationsTab';

const DEFAULT_FORM: Partial<Bank> = {
  name: '',
  processingTime: '',
  fees: '',
  digitalOption: false,
  rating: 4.0,
  logo: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=200&h=200&fit=crop',
};

function StatCard({ label, value, sub, color }: { label: string; value: number; sub: string; color?: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-slate-600">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${color ?? ''}`}>{value}</div>
        <div className="text-sm text-slate-600 mt-1">{sub}</div>
      </CardContent>
    </Card>
  );
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const [banks, setBanks] = useState<Bank[]>(initialBanks);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [formData, setFormData] = useState<Partial<Bank>>(DEFAULT_FORM);

  useEffect(() => {
    if (user && !isAdmin) {
      toast.error('Access denied', { description: 'You do not have permission to access the admin panel.' });
      navigate('/dashboard');
    } else if (!user) {
      navigate('/login');
    }
  }, [user, isAdmin, navigate]);

  const openAddDialog = () => {
    setEditingBank(null);
    setFormData(DEFAULT_FORM);
    setIsDialogOpen(true);
  };

  const openEditDialog = (bank: Bank) => {
    setEditingBank(bank);
    setFormData(bank);
    setIsDialogOpen(true);
  };

  const handleDeleteBank = (bankId: string) => {
    if (!window.confirm('Are you sure you want to delete this bank? This action cannot be undone.')) return;
    setBanks(banks.filter(b => b.id !== bankId));
    toast.success('Bank deleted', { description: 'The bank has been removed from the system.' });
  };

  const handleSaveBank = () => {
    if (!formData.name || !formData.processingTime || !formData.fees) {
      toast.error('Missing fields', { description: 'Please fill in all required fields.' });
      return;
    }

    if (editingBank) {
      setBanks(banks.map(b => b.id === editingBank.id ? { ...b, ...formData } as Bank : b));
      toast.success('Bank updated', { description: `${formData.name} has been updated successfully.` });
    } else {
      const newBank: Bank = {
        id: (banks.length + 1).toString(),
        name: formData.name,
        logo: formData.logo || '',
        processingTime: formData.processingTime,
        fees: formData.fees,
        digitalOption: formData.digitalOption || false,
        rating: formData.rating || 4.0,
      };
      setBanks([...banks, newBank]);
      toast.success('Bank added', { description: `${formData.name} has been added to the system.` });
    }

    setIsDialogOpen(false);
    setEditingBank(null);
    setFormData(DEFAULT_FORM);
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const approved = mockApplications.filter(a => a.status === 'approved').length;
  const pending  = mockApplications.filter(a => a.status === 'pending').length;
  const clients  = mockUsers.filter(u => u.role === 'client').length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster />

      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Admin Control Panel</h1>
                <p className="text-slate-600">Manage banks and monitor platform activity</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium">{user?.name}</div>
                <div className="text-xs text-slate-500">{user?.email}</div>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <StatCard label="Total Applications" value={mockApplications.length} sub="All submissions" />
          <StatCard label="Active Users" value={clients} sub="Client accounts" />
          <StatCard label="Total Banks" value={banks.length} sub="Active providers" />
          <StatCard label="Approved" value={approved} sub="Applications" color="text-green-600" />
          <StatCard label="Pending" value={pending} sub="Under review" color="text-amber-600" />
        </div>

        <Tabs defaultValue="banks" className="space-y-6">
          <TabsList>
            <TabsTrigger value="banks">Bank Management</TabsTrigger>
            <TabsTrigger value="applications">All Applications</TabsTrigger>
          </TabsList>

          <TabsContent value="banks">
            <BankManagementTab
              banks={banks}
              onAdd={openAddDialog}
              onEdit={openEditDialog}
              onDelete={handleDeleteBank}
            />
          </TabsContent>

          <TabsContent value="applications">
            <ApplicationsTab />
          </TabsContent>
        </Tabs>
      </main>

      <BankFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingBank={editingBank}
        formData={formData}
        onFormChange={setFormData}
        onSave={handleSaveBank}
      />
    </div>
  );
}
