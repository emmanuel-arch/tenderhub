import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { 
  ArrowLeft, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Download, 
  Bell,
  Bookmark,
  TrendingUp,
  Building2
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { mockApplications, tenders } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Toaster } from './ui/sonner';

export function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [savedTenders] = useState([tenders[0], tenders[2], tenders[4]]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Filter applications for current user
  const userApplications = mockApplications.filter(app => app.userId === user?.id);

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
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FileText className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const notifications = [
    {
      id: '1',
      title: 'Bid Bond Approved',
      message: 'Your bid bond for KNH/PROC/2026/001 has been approved',
      time: '2 hours ago',
      type: 'success'
    },
    {
      id: '2',
      title: 'Tender Deadline Approaching',
      message: 'Supply of Office Furniture deadline is in 5 days',
      time: '5 hours ago',
      type: 'warning'
    },
    {
      id: '3',
      title: 'New Tender Available',
      message: '3 new tenders matching your profile',
      time: '1 day ago',
      type: 'info'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster />
      
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" onClick={() => navigate('/')} className="mb-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tenders
              </Button>
              <h1 className="text-2xl font-bold">My Dashboard</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{userApplications.length}</div>
              <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
                <TrendingUp className="w-4 h-4" />
                <span>+2 this month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {userApplications.filter(a => a.status === 'approved').length}
              </div>
              <div className="text-sm text-slate-600 mt-1">Ready to download</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">
                {userApplications.filter(a => a.status === 'pending').length}
              </div>
              <div className="text-sm text-slate-600 mt-1">Under review</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Saved Tenders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{savedTenders.length}</div>
              <div className="text-sm text-slate-600 mt-1">For later review</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList>
            <TabsTrigger value="applications">My Applications</TabsTrigger>
            <TabsTrigger value="saved">Saved Tenders</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-4">
            {userApplications.map((application) => (
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
                          <span className="font-medium">Submitted:</span> {formatDate(application.submittedDate)}
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
                    {application.status === 'approved' && (
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Quick Download
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {userApplications.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <h3 className="font-semibold mb-2">No Applications Yet</h3>
                  <p className="text-slate-600 mb-4">
                    You haven't submitted any bid bond applications yet.
                  </p>
                  <Button onClick={() => navigate('/')}>Browse Tenders</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Saved Tenders Tab */}
          <TabsContent value="saved" className="space-y-4">
            {savedTenders.map((tender) => (
              <Card key={tender.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="mb-2 leading-snug">{tender.title}</CardTitle>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          <span>{tender.procuringEntity}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>Deadline: {formatDate(tender.deadline)}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">{tender.industry}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Button onClick={() => navigate(`/tender/${tender.id}`)}>
                      View Details
                    </Button>
                    <Button variant="outline">
                      <Bookmark className="w-4 h-4 mr-2" />
                      Remove from Saved
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            {notifications.map((notification) => (
              <Card key={notification.id}>
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      notification.type === 'success' ? 'bg-green-100' :
                      notification.type === 'warning' ? 'bg-amber-100' : 'bg-blue-100'
                    }`}>
                      <Bell className={`w-5 h-5 ${
                        notification.type === 'success' ? 'text-green-600' :
                        notification.type === 'warning' ? 'text-amber-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold mb-1">{notification.title}</div>
                      <div className="text-sm text-slate-600 mb-1">{notification.message}</div>
                      <div className="text-xs text-slate-500">{notification.time}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}