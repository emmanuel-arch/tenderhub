import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Shield, LogOut, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
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
  digitalOption: true,
  rating: 4.0,
  logo: '',
  institutionType: 'Bank',
};

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
    banksApi.list({ includeInactive: true })
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
      digitalOption: true,
      rating: bank.rating,
      institutionType: bank.institutionType,
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

  const handleToggleActive = async (bank: BankDto) => {
    try {
      const updated = await banksApi.update(bank.id, { isActive: !bank.isActive });
      setBanks(prev => prev.map(b => b.id === bank.id ? updated : b));
      toast.success(
        updated.isActive ? 'Bank activated' : 'Bank deactivated',
        { description: `${updated.name} is now ${updated.isActive ? 'active' : 'inactive'}.` }
      );
    } catch (err: any) {
      toast.error('Update failed', { description: err.message });
    }
  };

  const handleSaveBank = async () => {
    if (!formData.name || !formData.processingTime || !formData.fees) {
      toast.error('Missing fields', { description: 'Please fill in all required fields.' });
      return;
    }

    setSaving(true);
    try {
      const payload = { ...formData, digitalOption: true };
      if (editingBank) {
        const updated = await banksApi.update(editingBank.id, payload);
        setBanks(prev => prev.map(b => b.id === editingBank.id ? updated : b));
        toast.success('Bank updated', { description: `${updated.name} updated successfully.` });
      } else {
        const created = await banksApi.create(payload as CreateBankDto);
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
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster />

      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-900" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-slate-500 text-sm">Institutions & platform overview</p>
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
        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList>
            <TabsTrigger value="applications">All Applications</TabsTrigger>
            <TabsTrigger value="banks">Bank Management</TabsTrigger>
          </TabsList>

          <TabsContent value="applications">
            <ApplicationsTab />
          </TabsContent>

          <TabsContent value="banks">
            {loadingBanks ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
              </div>
            ) : (
              <BankManagementTab
                banks={banks}
                onAdd={openAddDialog}
                onEdit={openEditDialog}
                onDelete={handleDeleteBank}
                onToggleActive={handleToggleActive}
              />
            )}
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
