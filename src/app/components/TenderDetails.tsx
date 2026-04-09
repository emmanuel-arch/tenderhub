import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { ArrowLeft, Download, Calendar, Building2, FileText, AlertCircle, CheckCircle, Loader2, LogOut, LayoutDashboard, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Tender } from '../data/mockData';
import { fetchTenderById } from '../services/tenderService';
import { scrapedTendersApi, type ScrapedTenderDto } from '../services/api';

function scrapedToTender(s: ScrapedTenderDto): Tender {
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
    subCategory: (s.subCategory?.toLowerCase() as 'goods' | 'services' | 'consultancy' | 'works') || 'goods',
    summary: s.summary ?? '',
    description: s.description ?? s.summary ?? '',
    documentUrl: s.documentUrl ?? '',
    requiredDocuments: [
      'Tax Compliance Certificate',
      'Company CR12',
      'Directors Details',
      'Account Indemnity',
      'Audited Financial Statements',
    ],
  };
}

export function TenderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const [tender, setTender] = useState<Tender | null>(null);
  const [loading, setLoading] = useState(true);
  const [manualBondAmount, setManualBondAmount] = useState('');

  // Extra scraped tender fields we want to keep
  const [tenderNoticeUrl, setTenderNoticeUrl] = useState<string | null>(null);
  const [procurementMethod, setProcurementMethod] = useState<string | null>(null);

  const isScraped = id?.startsWith('s-');

  useEffect(() => {
    const loadTender = async () => {
      if (!id) return;
      setLoading(true);

      // Check if scraped tender was passed via navigation state
      const stateScraped = (location.state as any)?.scrapedTender as ScrapedTenderDto | undefined;

      if (stateScraped) {
        setTender(scrapedToTender(stateScraped));
        setTenderNoticeUrl(stateScraped.tenderNoticeUrl ?? null);
        setProcurementMethod(stateScraped.procurementMethod ?? null);
        setLoading(false);
        return;
      }

      // If scraped ID, fetch from scraped API
      if (isScraped) {
        try {
          const realId = id.slice(2);
          const scraped = await scrapedTendersApi.getById(realId);
          setTender(scrapedToTender(scraped));
          setTenderNoticeUrl(scraped.tenderNoticeUrl ?? null);
          setProcurementMethod(scraped.procurementMethod ?? null);
        } catch {
          setTender(null);
        } finally {
          setLoading(false);
        }
        return;
      }

      // Otherwise fetch from external API
      try {
        const fetchedTender = await fetchTenderById(id);
        setTender(fetchedTender);
      } catch {
        setTender(null);
      } finally {
        setLoading(false);
      }
    };

    loadTender();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-900 mx-auto" />
          <p className="text-slate-500 mt-3">Loading tender details...</p>
        </div>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="max-w-md shadow-lg">
          <CardHeader>
            <CardTitle>Tender Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">The tender you're looking for doesn't exist or may have been removed.</p>
            <Button onClick={() => navigate('/tenders')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tenders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const daysRemaining = tender.deadline
    ? Math.ceil((new Date(tender.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/tenders')} className="gap-2 hover:bg-slate-100">
            <ArrowLeft className="w-4 h-4" />
            Back to Tenders
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Tender Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title Card */}
            <Card className="shadow-md border-0 overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <CardTitle className="text-xl leading-snug">{tender.title}</CardTitle>
                  <Badge
                    variant={tender.category === 'government' ? 'default' : 'secondary'}
                    className="shrink-0"
                  >
                    {tender.category === 'government' ? 'Government' : 'Private'}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-900 border-blue-200">{tender.industry}</Badge>
                  <Badge variant="outline" className="capitalize bg-slate-50">{tender.subCategory}</Badge>
                  {procurementMethod && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-900 border-blue-200">{procurementMethod}</Badge>
                  )}
                  {tender.bidBondRequired && (
                    <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Bid Bond Required
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Key Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-blue-900" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wide">Tender Number</div>
                      <div className="font-semibold text-slate-900">{tender.tenderNumber || '—'}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      daysRemaining !== null && daysRemaining <= 7
                        ? 'bg-red-100'
                        : 'bg-green-100'
                    }`}>
                      <Calendar className={`w-5 h-5 ${
                        daysRemaining !== null && daysRemaining <= 7
                          ? 'text-red-600'
                          : 'text-green-800'
                      }`} />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wide">Deadline</div>
                      <div className="font-semibold text-slate-900">{formatDate(tender.deadline)}</div>
                      {daysRemaining !== null && daysRemaining > 0 && (
                        <span className={`text-xs ${daysRemaining <= 7 ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                          {daysRemaining} days remaining
                        </span>
                      )}
                      {daysRemaining !== null && daysRemaining <= 0 && (
                        <span className="text-xs text-red-600 font-medium">Expired</span>
                      )}
                    </div>
                  </div>
                  <div className="sm:col-span-2 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-blue-900" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wide">Procuring Entity</div>
                      <div className="font-semibold text-slate-900">{tender.procuringEntity || '—'}</div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Summary */}
                {tender.summary && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Summary</h3>
                    <p className="text-slate-600 leading-relaxed">{tender.summary}</p>
                  </div>
                )}

                {/* Description */}
                {tender.description && tender.description !== tender.summary && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-line">{tender.description}</p>
                  </div>
                )}

                {/* Download Buttons */}
                <div className="flex flex-wrap gap-3 pt-2">
                  {tender.documentUrl && (
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => window.open(tender.documentUrl, '_blank', 'noopener,noreferrer')}
                    >
                      <Download className="w-4 h-4" />
                      Download Tender Document
                    </Button>
                  )}
                  {tenderNoticeUrl && (
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => window.open(tenderNoticeUrl, '_blank', 'noopener,noreferrer')}
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Tender Notice
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Required Documents */}
            {tender.requiredDocuments && tender.requiredDocuments.length > 0 && (
              <Card className="shadow-md border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-900" />
                    Required Documents
                  </CardTitle>
                  <p className="text-sm text-slate-600 mt-1">
                    The following documents must be submitted with your bid bond application
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {tender.requiredDocuments.map((doc, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
                        <CheckCircle className="w-5 h-5 text-green-800 flex-shrink-0" />
                        <span className="text-sm font-medium text-slate-700">{doc}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Requirements & Eligibility */}
            <Card className="shadow-md border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-800" />
                  Requirements & Eligibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    'Valid business registration certificate',
                    'Tax compliance certificate (valid)',
                    'Audited financial statements for the last 3 years',
                    ...(tender.bidBondRequired ? ['Bid bond/security as specified'] : []),
                    'Company profile and relevant experience',
                  ].map((req, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="w-4 h-4 text-green-800" />
                      </div>
                      <span className="text-slate-600">{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Sticky */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Bid Bond Card */}
              {tender.bidBondRequired ? (
                <Card className="shadow-lg border-0 overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-green-800 to-green-900" />
                  <CardHeader className="bg-green-50">
                    <CardTitle className="flex items-center gap-2 text-green-950">
                      <AlertCircle className="w-5 h-5 text-green-700" />
                      Bid Bond Required
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div>
                      <div className="text-sm text-slate-500 mb-1">Bond Amount</div>
                      <div className="text-3xl font-bold text-slate-900">
                        {tender.bidBondAmount > 0
                          ? formatCurrency(tender.bidBondAmount)
                          : 'Not specified'}
                      </div>
                    </div>
                    <Separator />
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-sm font-medium text-blue-900 mb-1">What is a Bid Bond?</div>
                      <p className="text-sm text-blue-900">
                        A bid bond is a guarantee that ensures bidders will honor their commitments if awarded the contract.
                      </p>
                    </div>
                    <Button
                      className="w-full bg-blue-900 hover:bg-blue-800 shadow-md"
                      size="lg"
                      onClick={() => navigate(`/tender/${tender.id}/banks?bondAmount=${tender.bidBondAmount}`, { state: { tender } })}
                    >
                      Apply for Bid Bond
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-lg border-0 overflow-hidden">
                  <CardHeader>
                    <CardTitle>No Bid Bond Specified</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-slate-600">
                      This tender has no bid bond amount set. Enter the amount manually to apply through a bank.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="manual-bond-amount">Bid Bond Amount (KES)</Label>
                      <Input
                        id="manual-bond-amount"
                        type="number"
                        min="0"
                        placeholder="e.g. 500000"
                        value={manualBondAmount}
                        onChange={e => setManualBondAmount(e.target.value)}
                      />
                    </div>
                    <Button
                      className="w-full bg-blue-900 hover:bg-blue-800"
                      size="lg"
                      disabled={!manualBondAmount || Number(manualBondAmount) <= 0}
                      onClick={() =>
                        navigate(`/tender/${tender.id}/banks?bondAmount=${manualBondAmount}`, {
                          state: {
                            tender: { ...tender, bidBondRequired: true, bidBondAmount: Number(manualBondAmount) },
                          },
                        })
                      }
                    >
                      Apply for Bid Bond
                    </Button>
                  </CardContent>
                </Card>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
