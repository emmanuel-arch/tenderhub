import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Shield, LogOut, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { banksApi, BankDto, CreateBankDto } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Toaster } from './ui/sonner';
import { BankManagementTab } from './admin/BankManagementTab';
import { BankFormDialog } from './admin/BankFormDialog';
import { ApplicationsTab } from './admin/ApplicationsTab';

const DEFAULT_FORM: Partial<CreateBankDto> = {
  name: '',
  processingTime: '',
  fees: '',
  digitalOption: false,
  rating: 4.0,
  logo: '',
};

function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub: string; color?: string }) {
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
  const { user, logout } = useAuth();

  const [banks, setBanks] = useState<BankDto[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<BankDto | null>(null);
  const [formData, setFormData] = useState<Partial<CreateBankDto>>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    banksApi.list()
      .then(setBanks)
      .catch(err => toast.error('Failed to load banks', { description: err.message }))
      .finally(() => setLoadingBanks(false));
  }, []);

  const openAddDialog = () => {
    setEditingBank(null);
    setFormData(DEFAULT_FORM);
    setIsDialogOpen(true);
  };

  const openEditDialog = (bank: BankDto) => {
    setEditingBank(bank);
    setFormData({
      name: bank.name,
      logo: bank.logo,
      processingTime: bank.processingTime,
      fees: bank.fees,
      digitalOption: bank.digitalOption,
      rating: bank.rating,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteBank = async (bankId: string) => {
    if (!window.confirm('Are you sure you want to delete this bank?')) return;
    try {
      await banksApi.remove(bankId);
      setBanks(prev => prev.filter(b => b.id !== bankId));
      toast.success('Bank deleted');
    } catch (err: any) {
      toast.error('Delete failed', { description: err.message });
    }
  };

  const handleSaveBank = async () => {
    if (!formData.name || !formData.processingTime || !formData.fees) {
      toast.error('Missing fields', { description: 'Please fill in all required fields.' });
      return;
    }

    setSaving(true);
    try {
      if (editingBank) {
        const updated = await banksApi.update(editingBank.id, formData);
        setBanks(prev => prev.map(b => b.id === editingBank.id ? updated : b));
        toast.success('Bank updated', { description: `${updated.name} updated successfully.` });
      } else {
        const created = await banksApi.create(formData as CreateBankDto);
        setBanks(prev => [...prev, created]);
        toast.success('Bank added', { description: `${created.name} added to the system.` });
      }
      setIsDialogOpen(false);
      setEditingBank(null);
      setFormData(DEFAULT_FORM);
    } catch (err: any) {
      toast.error('Save failed', { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster />

      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-800" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <StatCard
            label="Total Banks"
            value={loadingBanks ? '—' : banks.length}
            sub="Active providers"
          />
          <StatCard
            label="Active Banks"
            value={loadingBanks ? '—' : banks.filter(b => b.isActive).length}
            sub="Available to clients"
            color="text-green-600"
          />
        </div>

        <Tabs defaultValue="banks" className="space-y-6">
          <TabsList>
            <TabsTrigger value="banks">Bank Management</TabsTrigger>
            <TabsTrigger value="applications">All Applications</TabsTrigger>
          </TabsList>

          <TabsContent value="banks">
            {loadingBanks ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <BankManagementTab
                banks={banks}
                onAdd={openAddDialog}
                onEdit={openEditDialog}
                onDelete={handleDeleteBank}
              />
            )}
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
        saving={saving}
      />
    </div>
  );
}
