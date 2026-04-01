import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Download, Calendar, Building2, FileText, AlertCircle, CheckCircle, Loader2, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Tender } from '../data/mockData';
import { fetchTenderById } from '../services/tenderService';

export function TenderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const [tender, setTender] = useState<Tender | null>(null);
  const [loading, setLoading] = useState(true);
  const [manualBondAmount, setManualBondAmount] = useState('');

  useEffect(() => {
    const loadTender = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const fetchedTender = await fetchTenderById(id);
        setTender(fetchedTender);
      } catch (error) {
        console.error('Error loading tender:', error);
        setTender(null);
      } finally {
        setLoading(false);
      }
    };

    loadTender();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Tender Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">The tender you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/')}>Back to Tenders</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
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
              <Button variant="ghost" size="sm" onClick={() => { logout(); navigate('/login'); }}>
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
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <CardTitle className="leading-snug">{tender.title}</CardTitle>
                  <Badge variant={tender.category === 'government' ? 'default' : 'secondary'}>
                    {tender.category === 'government' ? 'Government' : 'Private'}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{tender.industry}</Badge>
                  <Badge variant="outline" className="capitalize">{tender.subCategory}</Badge>
                  {tender.bidBondRequired && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Bid Bond Required
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-slate-500 mb-1">Tender Number</div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">{tender.tenderNumber}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 mb-1">Deadline</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">{formatDate(tender.deadline)}</span>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-sm text-slate-500 mb-1">Procuring Entity</div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">{tender.procuringEntity}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Summary</h3>
                  <p className="text-slate-600 leading-relaxed">{tender.summary}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-slate-600 leading-relaxed">{tender.description}</p>
                </div>

              </CardContent>
            </Card>

            {/* Required Documents */}
            {tender.requiredDocuments && tender.requiredDocuments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Required Documents</CardTitle>
                  <p className="text-sm text-slate-600 mt-1">
                    The following documents must be submitted with your bid bond application
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {tender.requiredDocuments.map((doc, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-600">{doc}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Requirements & Eligibility</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600">Valid business registration certificate</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600">Tax compliance certificate (valid)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600">Audited financial statements for the last 3 years</span>
                  </li>
                  {tender.bidBondRequired && (
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-600">Bid bond/security as specified</span>
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600">Company profile and relevant experience</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Sticky */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              {tender.bidBondRequired ? (
                <Card className="border-amber-200 bg-amber-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                      Bid Bond Required
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm text-slate-600 mb-1">Bond Amount</div>
                      <div className="text-2xl font-bold text-slate-900">
                        {formatCurrency(tender.bidBondAmount)}
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <div className="text-sm text-slate-600 mb-2">What is a Bid Bond?</div>
                      <p className="text-sm text-slate-600">
                        A bid bond is a guarantee that ensures bidders will honor their commitments if awarded the contract.
                      </p>
                    </div>
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => navigate(`/tender/${tender.id}/banks`, { state: { tender } })}
                    >
                      Apply for Bid Bond
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
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
                      className="w-full"
                      size="lg"
                      disabled={!manualBondAmount || Number(manualBondAmount) <= 0}
                      onClick={() =>
                        navigate(`/tender/${tender.id}/banks`, {
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

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Save for Later
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
