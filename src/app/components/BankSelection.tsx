import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { ArrowLeft, Loader2, LogOut, LayoutDashboard, Shield, DollarSign } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

import { banksApi, type BankDto, scrapedTendersApi } from '../services/api';
import { Tender } from '../data/mockData';
import { fetchTenderById } from '../services/tenderService';
import { ProviderCards } from './provider/ProviderCards';
import { toast } from 'sonner';
import { Toaster } from './ui/sonner';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);

export function BankSelection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();

  const [banks, setBanks]   = useState<BankDto[]>([]);
  const [tender, setTender] = useState<Tender | null>((location.state as any)?.tender ?? null);
  const [loading, setLoading] = useState(true);

  const urlBondAmount = new URLSearchParams(location.search).get('bondAmount');

  useEffect(() => {
    async function load() {
      try {
        const isScraped = id?.startsWith('s-');

        const loadTender = async (): Promise<Tender | null> => {
          if (tender) return tender;
          if (isScraped) {
            const realId = id!.slice(2);
            const s = await scrapedTendersApi.getById(realId);
            return {
              id: `s-${s.id}`,
              title: s.title,
              tenderNumber: s.tenderNumber ?? '',
              procuringEntity: s.procuringEntity ?? '',
              deadline: s.deadline ?? s.endDate ?? '',
              industry: s.category || 'General',
              bidBondRequired: s.bidBondRequired ?? false,
              bidBondAmount: s.bidBondAmount ?? 0,
              category: 'government',
              subCategory: (s.subCategory?.toLowerCase() as any) || 'goods',
              summary: s.summary ?? '',
              description: s.description ?? s.summary ?? '',
              documentUrl: s.documentUrl ?? '',
              requiredDocuments: ['Tax Compliance Certificate', 'Company CR12', 'Directors Details', 'Account Indemnity', 'Audited Financial Statements'],
            };
          }
          return fetchTenderById(id!);
        };

        const [banksData, tenderData] = await Promise.all([banksApi.list(), loadTender()]);
        setBanks(banksData.filter(b => b.isActive));

        if (tenderData) {
          if (urlBondAmount && Number(urlBondAmount) > 0) {
            tenderData.bidBondRequired = true;
            tenderData.bidBondAmount = Number(urlBondAmount);
          }
          setTender(tenderData);
        }
      } catch (err: any) {
        toast.error('Failed to load data', { description: err.message });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-900 mx-auto" />
          <p className="text-slate-500 mt-3">Loading providers...</p>
        </div>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="max-w-md shadow-lg">
          <CardHeader><CardTitle>Tender Not Found</CardTitle></CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">Could not find the tender details.</p>
            <Button onClick={() => navigate('/tenders')}>Back to Tenders</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Toaster />

      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(`/tender/${id}`)} className="gap-2 hover:bg-slate-100">
            <ArrowLeft className="w-4 h-4" />Back to Tender Details
          </Button>
          {user && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}>
                <LayoutDashboard className="w-4 h-4 mr-2" />
                {isAdmin ? 'Admin Panel' : 'My Dashboard'}
              </Button>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Tender Summary */}
        <Card className="mb-8 shadow-md border-0 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">Select a Provider for Your Bid Bond</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-blue-900" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">Tender</div>
                  <div className="font-medium text-sm line-clamp-2">{tender.title}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-blue-900" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">Procuring Entity</div>
                  <div className="font-medium text-sm">{tender.procuringEntity || '—'}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">Bond Amount Required</div>
                  <div className="text-xl font-bold text-slate-900">
                    {tender.bidBondAmount != null && tender.bidBondAmount > 0
                      ? formatCurrency(tender.bidBondAmount)
                      : '—'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Provider cards — shared component */}
        <ProviderCards
          banks={banks}
          onSelect={bank => navigate(`/tender/${id}/bid-bond/${bank.id}`, { state: { tender, bank } })}
        />

      </main>
    </div>
  );
}
