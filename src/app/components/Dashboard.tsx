import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Bookmark,
  TrendingUp,
  Building2,
  Loader2,
  LogOut
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { applicationsApi, ApplicationDto } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSavedTenders } from '../hooks/useSavedTenders';
import { toast } from 'sonner';
import { Toaster } from './ui/sonner';

export function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const [userApplications, setUserApplications] = useState<ApplicationDto[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const { saved, remove: removeSaved } = useSavedTenders();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  // Fetch real applications from API
  useEffect(() => {
    if (!isAuthenticated) return;
    applicationsApi.list()
      .then(res => setUserApplications(res.data))
      .catch(err => toast.error('Failed to load applications', { description: err.message }))
      .finally(() => setLoadingApps(false));
  }, [isAuthenticated]);

  // Show success message if just submitted an application
  useEffect(() => {
    if (location.state?.applicationSubmitted) {
      toast.success('Application submitted successfully!', {
        description: 'Your bid bond application is now being processed.',
      });
    }
  }, [location]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-800" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-green-700" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FileText className="w-5 h-5 text-blue-900" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-950 border-green-200';
      case 'pending':
        return 'bg-green-100 text-green-900 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-900 border-blue-200';
    }
  };


  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster />
      
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" onClick={() => navigate('/tenders')} className="mb-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tenders
              </Button>
              <h1 className="text-2xl font-bold">My Dashboard</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{userApplications.length}</div>
              <div className="flex items-center gap-1 text-sm text-green-800 mt-1">
                <TrendingUp className="w-4 h-4" />
                <span>All time</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-800">
                {userApplications.filter(a => a.status.toLowerCase() === 'approved').length}
              </div>
              <div className="text-sm text-slate-600 mt-1">Ready to download</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">
                {userApplications.filter(a => ['pending', 'submitted'].includes(a.status.toLowerCase())).length}
              </div>
              <div className="text-sm text-slate-600 mt-1">Under review</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {userApplications.filter(a => a.status.toLowerCase() === 'rejected').length}
              </div>
              <div className="text-sm text-slate-600 mt-1">Not approved</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList>
            <TabsTrigger value="applications">All Applications</TabsTrigger>
            <TabsTrigger value="approved">
              Approved
              {userApplications.filter(a => a.status.toLowerCase() === 'approved').length > 0 && (
                <span className="ml-1.5 bg-green-800 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                  {userApplications.filter(a => a.status.toLowerCase() === 'approved').length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending
              {userApplications.filter(a => ['pending','submitted'].includes(a.status.toLowerCase())).length > 0 && (
                <span className="ml-1.5 bg-green-700 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                  {userApplications.filter(a => ['pending','submitted'].includes(a.status.toLowerCase())).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected
              {userApplications.filter(a => a.status.toLowerCase() === 'rejected').length > 0 && (
                <span className="ml-1.5 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                  {userApplications.filter(a => a.status.toLowerCase() === 'rejected').length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="saved">
              Saved Tenders
              {saved.length > 0 && (
                <span className="ml-1.5 bg-blue-900 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                  {saved.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-4">
            {loadingApps && (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
              </div>
            )}

            {!loadingApps && userApplications.map((application) => (
              <Card key={application.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(application.status)}
                        <CardTitle className="leading-snug">{application.tenderTitle}</CardTitle>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                        <div>
                          <span className="font-medium">Bank:</span> {application.bankName}
                        </div>
                        <div>
                          <span className="font-medium">Submitted:</span> {formatDate(application.submittedAt)}
                        </div>
                        {application.bondAmount && (
                          <div>
                            <span className="font-medium">Bond Amount:</span> {formatCurrency(application.bondAmount)}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={getStatusColor(application.status)}>
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Separator className="mb-4" />
                  <div className="flex gap-3">
                    <Button onClick={() => navigate(`/application/${application.id}`)}>
                      View Details
                    </Button>
                    {application.status.toLowerCase() === 'approved' && application.documentUrl && (
                      <Button variant="outline" onClick={() => window.open(application.documentUrl!, '_blank')}>
                        <Download className="w-4 h-4 mr-2" />
                        Quick Download
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {!loadingApps && userApplications.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <h3 className="font-semibold mb-2">No Applications Yet</h3>
                  <p className="text-slate-600 mb-4">
                    You haven't submitted any bid bond applications yet.
                  </p>
                  <Button onClick={() => navigate('/tenders')}>Browse Tenders</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Approved Tab */}
          <TabsContent value="approved" className="space-y-4">
            {loadingApps && (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
              </div>
            )}

            {!loadingApps && userApplications.filter(a => a.status.toLowerCase() === 'approved').length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <h3 className="font-semibold mb-2">No Approved Applications</h3>
                  <p className="text-slate-600">Your approved applications will appear here.</p>
                </CardContent>
              </Card>
            )}

            {!loadingApps && userApplications
              .filter(a => a.status.toLowerCase() === 'approved')
              .map((application) => (
                <Card key={application.id} className="border-green-200">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-800 shrink-0" />
                          <CardTitle className="leading-snug">{application.tenderTitle}</CardTitle>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                          <div><span className="font-medium">Bank:</span> {application.bankName}</div>
                          <div><span className="font-medium">Submitted:</span> {formatDate(application.submittedAt)}</div>
                          {application.approvedAt && (
                            <div><span className="font-medium">Approved:</span> {formatDate(application.approvedAt)}</div>
                          )}
                          {application.bondAmount && (
                            <div><span className="font-medium">Bond Amount:</span> {formatCurrency(application.bondAmount)}</div>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-950 border-green-200 shrink-0">
                        Approved
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Separator className="mb-4" />
                    <div className="flex gap-3">
                      <Button onClick={() => navigate(`/application/${application.id}`)}>
                        View Details
                      </Button>
                      {application.documentUrl && (
                        <Button variant="outline" onClick={() => window.open(application.documentUrl!, '_blank')}>
                          <Download className="w-4 h-4 mr-2" />
                          Download Bond
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            }
          </TabsContent>

          {/* Pending Tab */}
          <TabsContent value="pending" className="space-y-4">
            {loadingApps && (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
              </div>
            )}

            {!loadingApps && userApplications.filter(a => ['pending','submitted'].includes(a.status.toLowerCase())).length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <h3 className="font-semibold mb-2">No Pending Applications</h3>
                  <p className="text-slate-600">Applications under review will appear here.</p>
                </CardContent>
              </Card>
            )}

            {!loadingApps && userApplications
              .filter(a => ['pending','submitted'].includes(a.status.toLowerCase()))
              .map((application) => (
                <Card key={application.id} className="border-green-200">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Clock className="w-5 h-5 text-green-700 shrink-0" />
                          <CardTitle className="leading-snug">{application.tenderTitle}</CardTitle>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                          <div><span className="font-medium">Bank:</span> {application.bankName}</div>
                          <div><span className="font-medium">Submitted:</span> {formatDate(application.submittedAt)}</div>
                          {application.bondAmount && (
                            <div><span className="font-medium">Bond Amount:</span> {formatCurrency(application.bondAmount)}</div>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-900 border-green-200 shrink-0">
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Separator className="mb-4" />
                    <Button onClick={() => navigate(`/application/${application.id}`)}>
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))
            }
          </TabsContent>

          {/* Rejected Tab */}
          <TabsContent value="rejected" className="space-y-4">
            {loadingApps && (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
              </div>
            )}

            {!loadingApps && userApplications.filter(a => a.status.toLowerCase() === 'rejected').length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <XCircle className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <h3 className="font-semibold mb-2">No Rejected Applications</h3>
                  <p className="text-slate-600">None of your applications have been rejected.</p>
                </CardContent>
              </Card>
            )}

            {!loadingApps && userApplications
              .filter(a => a.status.toLowerCase() === 'rejected')
              .map((application) => (
                <Card key={application.id} className="border-red-200">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                          <CardTitle className="leading-snug">{application.tenderTitle}</CardTitle>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                          <div><span className="font-medium">Bank:</span> {application.bankName}</div>
                          <div><span className="font-medium">Submitted:</span> {formatDate(application.submittedAt)}</div>
                          {application.bondAmount && (
                            <div><span className="font-medium">Bond Amount:</span> {formatCurrency(application.bondAmount)}</div>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 shrink-0">
                        Rejected
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {application.rejectionReason && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
                        <span className="font-semibold">Reason: </span>{application.rejectionReason}
                      </div>
                    )}
                    <Separator className="mb-4" />
                    <Button variant="outline" onClick={() => navigate(`/application/${application.id}`)}>
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))
            }
          </TabsContent>

          {/* Saved Tenders Tab */}
          <TabsContent value="saved" className="space-y-4">
            {saved.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bookmark className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <h3 className="font-semibold mb-2">No Saved Tenders</h3>
                  <p className="text-slate-600 mb-4">Bookmark tenders from the listing to save them here.</p>
                  <Button onClick={() => navigate('/tenders')}>Browse Tenders</Button>
                </CardContent>
              </Card>
            ) : (
              saved.map(tender => (
                <Card key={tender.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base leading-snug line-clamp-2">{tender.title}</CardTitle>
                        {tender.procuringEntity && (
                          <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                            <Building2 className="w-4 h-4 shrink-0" />
                            <span className="truncate">{tender.procuringEntity}</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeSaved(tender.id)}
                        title="Remove from saved"
                        className="text-slate-400 hover:text-red-500 transition-colors shrink-0"
                      >
                        <Bookmark className="w-5 h-5 fill-blue-900 text-blue-900" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-3">
                      {tender.tenderNumber && <span>No: {tender.tenderNumber}</span>}
                      {tender.deadline && (
                        <span>Deadline: {new Date(tender.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      )}
                      {tender.subCategory && <Badge variant="outline" className="text-xs capitalize">{tender.subCategory}</Badge>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => navigate(`/tender/s-${tender.id}`, { state: { scrapedTender: tender } })}>
                        View Details
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => removeSaved(tender.id)}>
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}
