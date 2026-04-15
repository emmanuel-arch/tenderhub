import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Download,
  FileText,
  Building2,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  LogOut,
  Paperclip,
  Eye
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { applicationsApi, ApplicationDto } from '../services/api';
import { toast } from 'sonner';
import { Toaster } from './ui/sonner';

export function ApplicationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout, isAdmin } = useAuth();
  const [application, setApplication] = useState<ApplicationDto | null>(null);
  const [loading, setLoading] = useState(true);
  const dashboardPath = isAdmin ? '/admin' : '/dashboard';
  const dashboardLabel = isAdmin ? 'Back to Admin' : 'Back to Dashboard';

  useEffect(() => {
    if (!id) return;
    applicationsApi.getById(id)
      .then(setApplication)
      .catch(err => toast.error('Failed to load application', { description: err.message }))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Application Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(dashboardPath)}>{dashboardLabel}</Button>
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

  const getStatusIcon = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('approved')) {
      return <CheckCircle className="w-5 h-5 text-green-800" />;
    } else if (lowerStatus.includes('rejected')) {
      return <XCircle className="w-5 h-5 text-red-600" />;
    } else if (lowerStatus.includes('review') || lowerStatus.includes('pending')) {
      return <Clock className="w-5 h-5 text-green-700" />;
    } else {
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
      case 'submitted':
        return 'bg-blue-100 text-blue-900 border-blue-200';
      default:
        return '';
    }
  };

  const handleDownload = () => {
    if (application.documentUrl) {
      window.open(application.documentUrl, '_blank');
    } else {
      toast.info('Document not available yet.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster />
      
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" onClick={() => navigate(dashboardPath)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {dashboardLabel}
            </Button>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">Application Details</h1>
              <p className="text-slate-600">Track your bid bond application status</p>
            </div>
            <Badge variant="outline" className={`${getStatusColor(application.status)} text-base px-4 py-2`}>
              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-slate-500 mb-1">Application ID</div>
                    <div className="font-medium">{application.id}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 mb-1">Tender Number</div>
                    <div className="font-medium">{application.tenderNumber}</div>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="text-sm text-slate-500 mb-1">Tender Title</div>
                  <div className="font-medium">{application.tenderTitle}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-slate-500 mb-1">Selected Bank</div>
                      <div className="font-medium">{application.bankName}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-slate-500 mb-1">Bond Amount</div>
                      <div className="font-medium">{application.bondAmount ? formatCurrency(application.bondAmount) : 'N/A'}</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-slate-500 mb-1">Submitted On</div>
                      <div className="font-medium">{formatDate(application.submittedAt)}</div>
                    </div>
                  </div>
                  {application.approvedAt && (
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-800 mt-0.5" />
                      <div>
                        <div className="text-sm text-slate-500 mb-1">Approved On</div>
                        <div className="font-medium">{formatDate(application.approvedAt)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {application.status === 'approved' && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-5 w-5 text-green-800" />
                <AlertTitle className="text-green-950">Application Approved</AlertTitle>
                <AlertDescription className="text-green-950">
                  Your bid bond has been approved and is ready for download. You can now proceed with your tender submission.
                </AlertDescription>
              </Alert>
            )}

            {application.status === 'rejected' && application.rejectionReason && (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-5 w-5 text-red-600" />
                <AlertTitle className="text-red-900">Application Rejected</AlertTitle>
                <AlertDescription className="text-red-800">
                  <strong>Reason:</strong> {application.rejectionReason}
                  <div className="mt-2">
                    You can submit a new application with the correct documentation.
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {application.status === 'pending' && (
              <Alert className="border-green-200 bg-green-50">
                <Clock className="h-5 w-5 text-green-700" />
                <AlertTitle className="text-green-950">Application Under Review</AlertTitle>
                <AlertDescription className="text-green-900">
                  Your application is currently being reviewed by {application.bankName}. This typically takes 2-5 business days.
                </AlertDescription>
              </Alert>
            )}

            {application.documents?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Uploaded Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {application.documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between py-2 px-3 rounded-lg border border-slate-100 bg-slate-50">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-800 truncate">{doc.name}</div>
                          <div className="text-xs text-slate-400">{doc.fileName} · {(doc.fileSizeBytes / 1024).toFixed(0)} KB</div>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0 ml-3">
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-slate-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                          <Eye className="w-3.5 h-3.5" /> View
                        </a>
                        <a href={doc.url} download={doc.fileName} className="flex items-center gap-1 text-xs text-slate-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Application Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {application.statusHistory?.map((update, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          index === 0 ? 'bg-blue-100' : 'bg-slate-100'
                        }`}>
                          {getStatusIcon(update.status)}
                        </div>
                        {index < (application.statusHistory?.length || 0) - 1 && (
                          <div className="w-0.5 h-full bg-slate-200 my-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-semibold">{update.status}</div>
                          <div className="text-sm text-slate-500">{formatDate(update.changedAt)}</div>
                        </div>
                        <div className="text-sm text-slate-600">{update.notes}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {application.status === 'approved' && application.documentUrl && (
              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-950">Download Document</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-slate-600">
                    Your bid bond document is ready for download. This document is required for your tender submission.
                  </div>
                  <Button className="w-full" size="lg" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Bid Bond
                  </Button>
                  <div className="text-xs text-slate-500 text-center">
                    Valid PDF document • Digitally signed
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate(`/tender/${application.tenderId}`)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Tender Details
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    toast.info('Contact support', {
                      description: 'Support team will reach out within 24 hours.',
                    });
                  }}
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
                {application.status === 'rejected' && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate(`/tender/${application.tenderId}/banks`)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Submit New Application
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-blue-900">
                <p>
                  <strong>For approved applications:</strong> Download and submit the bid bond with your tender documents.
                </p>
                <p>
                  <strong>For pending applications:</strong> Please wait for bank review. You'll be notified of any updates.
                </p>
                <p>
                  <strong>For rejected applications:</strong> Review the rejection reason and submit a new application with correct documents.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
