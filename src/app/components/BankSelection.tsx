import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { ArrowLeft, Clock, DollarSign, Star, Loader2, LogOut, LayoutDashboard, Shield, Zap, BarChart3, HelpCircle, Building2, Landmark } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { banksApi, BankDto, scrapedTendersApi } from '../services/api';
import { Tender } from '../data/mockData';
import { fetchTenderById } from '../services/tenderService';
import { ImageWithFallback } from './ImageWithFallback';
import { toast } from 'sonner';
import { Toaster } from './ui/sonner';


export function BankSelection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();

  const [banks, setBanks] = useState<BankDto[]>([]);
  const [providerType, setProviderType] = useState<'microfinance' | 'banks'>('microfinance');
  const [tender, setTender] = useState<Tender | null>(
    (location.state as any)?.tender ?? null
  );
  const [loading, setLoading] = useState(true);

  // Read bond amount from URL query params (survives login redirect)
  const searchParams = new URLSearchParams(location.search);
  const urlBondAmount = searchParams.get('bondAmount');

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
              bidBondRequired: s.bidBondRequired,
              bidBondAmount: s.bidBondAmount,
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

        const [banksData, tenderData] = await Promise.all([
          banksApi.list(),
          loadTender(),
        ]);
        setBanks(banksData.filter(b => b.isActive));
        // providerType defaults to 'microfinance'; if none exist, switch to banks
        if (!banksData.some(b => b.isActive && b.institutionType === 'Microfinance')) {
          setProviderType('banks');
        }
        if (tenderData) {
          // Apply bond amount from URL if present (survives login redirect)
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

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Toaster />

      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(`/tender/${id}`)} className="gap-2 hover:bg-slate-100">
            <ArrowLeft className="w-4 h-4" />
            Back to Tender Details
          </Button>
          {user && (
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Admin Panel
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  My Dashboard
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tender Summary Card */}
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
                  <div className="font-medium text-sm">{tender.procuringEntity}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">Bond Amount Required</div>
                  <div className="text-xl font-bold text-slate-900">{tender.bidBondAmount ? formatCurrency(tender.bidBondAmount) : '—'}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Provider Type Toggle */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setProviderType('microfinance')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all border ${
                providerType === 'microfinance'
                  ? 'bg-blue-900 text-white border-blue-900 shadow-md'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Microfinance Institutions
            </button>
            <button
              onClick={() => setProviderType('banks')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all border ${
                providerType === 'banks'
                  ? 'bg-blue-900 text-white border-blue-900 shadow-md'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-900'
              }`}
            >
              <Landmark className="w-4 h-4" />
              Banks
            </button>
          </div>
          <p className="text-slate-500 text-sm">
            {providerType === 'microfinance'
              ? 'Microfinance institutions offer faster processing and flexible terms for bid bonds.'
              : 'Commercial banks provide bid bonds with established processes and digital options.'}
          </p>
        </div>

        {/* Microfinance Cards */}
        {providerType === 'microfinance' && (() => {
          const mfis = banks.filter(b => b.institutionType === 'Microfinance');
          return mfis.length === 0 ? (
            <Card className="shadow-md border-0">
              <CardContent className="py-16 text-center">
                <Building2 className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                <p className="text-slate-500 font-medium">No microfinance institutions available.</p>
                <p className="text-slate-400 text-sm mt-1">Please contact admin to add microfinance providers.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mfis.map(mfi => (
                <Card key={mfi.id} className="shadow-md border-0 hover:shadow-xl transition-all duration-300 group overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center border border-green-100">
                        <ImageWithFallback src={mfi.logo} alt={`${mfi.name} logo`} className="w-full h-full object-cover" width={48} height={48} />
                      </div>
                      <Badge className="bg-green-100 text-green-950 border-green-200">
                        <Zap className="w-3 h-3 mr-1" />
                        Digital
                      </Badge>
                    </div>
                    <CardTitle className="text-base leading-snug">{mfi.name}</CardTitle>
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < Math.floor(mfi.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                      ))}
                      <span className="text-sm text-slate-500 ml-1.5">({mfi.rating})</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-slate-50 rounded-lg p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Clock className="w-4 h-4" />
                          Processing Time
                        </div>
                        <div className="font-semibold text-sm text-slate-900">{mfi.processingTime}</div>
                      </div>
                      <Separator />
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <DollarSign className="w-4 h-4" />
                          Fees
                        </div>
                        <div className="font-semibold text-sm text-slate-900 text-right max-w-[140px]">{mfi.fees}</div>
                      </div>
                    </div>
                    <Button
                      className="w-full bg-green-900 hover:bg-green-950 shadow-md"
                      size="lg"
                      onClick={() => navigate(`/tender/${id}/bid-bond/${mfi.id}`, { state: { tender, bank: mfi } })}
                    >
                      Select {mfi.name.split(' ').slice(0, 2).join(' ')}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          );
        })()}

        {/* Bank Cards */}
        {providerType === 'banks' && (() => {
          const commercialBanks = banks.filter(b => b.institutionType === 'Bank');
          return (
          <>
            {commercialBanks.length === 0 && (
              <Card className="shadow-md border-0">
                <CardContent className="py-16 text-center">
                  <Shield className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                  <p className="text-slate-500 font-medium">No banks are currently available.</p>
                  <p className="text-slate-400 text-sm mt-1">Please contact admin to add banks.</p>
                </CardContent>
              </Card>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {commercialBanks.map(bank => (
                <Card key={bank.id} className="shadow-md border-0 hover:shadow-xl transition-all duration-300 group overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center border">
                        <ImageWithFallback
                          src={bank.logo}
                          alt={`${bank.name} logo`}
                          className="w-full h-full object-cover"
                          width={64}
                          height={64}
                        />
                      </div>
                      <Badge className="bg-green-100 text-green-950 border-green-200">
                        <Zap className="w-3 h-3 mr-1" />
                        Digital
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{bank.name}</CardTitle>
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < Math.floor(bank.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                      ))}
                      <span className="text-sm text-slate-500 ml-1.5 font-medium">({bank.rating})</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-slate-50 rounded-lg p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Clock className="w-4 h-4" />
                          Processing Time
                        </div>
                        <div className="font-semibold text-sm text-slate-900">{bank.processingTime}</div>
                      </div>
                      <Separator />
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <DollarSign className="w-4 h-4" />
                          Processing Fees
                        </div>
                        <div className="font-semibold text-sm text-slate-900 text-right max-w-[140px]">{bank.fees}</div>
                      </div>
                    </div>
                    <Button
                      className="w-full bg-blue-900 hover:bg-blue-800 shadow-md"
                      size="lg"
                      onClick={() =>
                        navigate(`/tender/${id}/bid-bond/${bank.id}`, { state: { tender, bank } })
                      }
                    >
                      Select {bank.name}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
          );
        })()}

        {/* Help Card */}
        <Card className="mt-8 shadow-md border-0 overflow-hidden">
          <CardHeader className="bg-blue-50/50">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <HelpCircle className="w-5 h-5 text-blue-900" />
              Need Help Choosing?
            </CardTitle>
            <p className="text-sm text-blue-900">Consider these factors when selecting a bank:</p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/50">
                <Clock className="w-5 h-5 text-blue-900 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm text-slate-900">Processing Time</div>
                  <div className="text-sm text-slate-600">Choose a faster option if your deadline is near</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50/50">
                <DollarSign className="w-5 h-5 text-green-800 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm text-slate-900">Fees</div>
                  <div className="text-sm text-slate-600">Compare total costs including percentage fees</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50/50">
                <Zap className="w-5 h-5 text-green-800 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm text-slate-900">Fully Digital</div>
                  <div className="text-sm text-slate-600">All providers support online application</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50/50">
                <BarChart3 className="w-5 h-5 text-green-700 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm text-slate-900">Rating</div>
                  <div className="text-sm text-slate-600">Check customer satisfaction ratings</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
