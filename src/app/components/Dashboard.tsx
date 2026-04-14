import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { ArrowLeft, FileText, Clock, CheckCircle, XCircle, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { applicationsApi, type ApplicationDto } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSavedTenders } from '../hooks/useSavedTenders';
import { toast } from 'sonner';
import { Toaster } from './ui/sonner';
import { StatsCards } from './dashboard/StatsCards';
import { ApplicationsList } from './dashboard/ApplicationsList';
import { SavedTendersTab } from './dashboard/SavedTendersTab';
import type { SavedTender } from '../hooks/useSavedTenders';

export function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const [applications, setApplications] = useState<ApplicationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { saved, remove: removeSaved } = useSavedTenders();

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  const loadApplications = () => {
    setLoading(true);
    setError(null);
    applicationsApi.list()
      .then(res => setApplications(res.data))
      .catch(err => setError(err.message ?? 'Failed to load applications.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadApplications();
  }, [isAuthenticated]);

  useEffect(() => {
    if (location.state?.applicationSubmitted) {
      toast.success('Application submitted successfully!', {
        description: 'Your bid bond application is now being processed.',
      });
    }
  }, [location]);

  const approved = applications.filter(a => a.status.toLowerCase() === 'approved');
  const pending  = applications.filter(a => ['pending', 'submitted'].includes(a.status.toLowerCase()));
  const rejected = applications.filter(a => a.status.toLowerCase() === 'rejected');

  const badge = (count: number, cls: string) =>
    count > 0 ? <span className={`ml-1.5 text-white text-xs rounded-full px-1.5 py-0.5 leading-none ${cls}`}>{count}</span> : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster />

      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => navigate('/tenders')} className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />Back to Tenders
            </Button>
            <h1 className="text-2xl font-bold">My Dashboard</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Direct Apply CTA */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-blue-900 bg-blue-900 px-4 py-3">
          <div>
            <p className="font-semibold text-white">Have a tender not in our listings?</p>
            <p className="text-sm text-blue-200">Apply for a bid bond directly — enter your tender details and get started.</p>
          </div>
          <Button onClick={() => navigate('/apply')} className="shrink-0 bg-slate-900 hover:bg-slate-800 text-white">
            Apply Directly
          </Button>
        </div>

        <StatsCards applications={applications} />

        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList>
            <TabsTrigger value="applications">All Applications</TabsTrigger>
            <TabsTrigger value="approved">Approved{badge(approved.length, 'bg-green-800')}</TabsTrigger>
            <TabsTrigger value="pending">Pending{badge(pending.length, 'bg-green-700')}</TabsTrigger>
            <TabsTrigger value="rejected">Rejected{badge(rejected.length, 'bg-red-600')}</TabsTrigger>
            <TabsTrigger value="saved">
              Saved Tenders{badge(saved.length, 'bg-blue-900')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="space-y-4">
            <ApplicationsList
              applications={applications}
              loading={loading}
              error={error}
              onRetry={loadApplications}
              EmptyIcon={FileText}
              emptyTitle="No Applications Yet"
              emptyMessage="You haven't submitted any bid bond applications yet."
              browseAction={() => navigate('/tenders')}
              onViewDetails={id => navigate(`/application/${id}`)}
            />
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            <ApplicationsList
              applications={approved}
              loading={loading}
              error={error}
              onRetry={loadApplications}
              EmptyIcon={CheckCircle}
              emptyTitle="No Approved Applications"
              emptyMessage="Your approved applications will appear here."
              onViewDetails={id => navigate(`/application/${id}`)}
            />
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <ApplicationsList
              applications={pending}
              loading={loading}
              error={error}
              onRetry={loadApplications}
              EmptyIcon={Clock}
              emptyTitle="No Pending Applications"
              emptyMessage="Applications under review will appear here."
              onViewDetails={id => navigate(`/application/${id}`)}
            />
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            <ApplicationsList
              applications={rejected}
              loading={loading}
              error={error}
              onRetry={loadApplications}
              EmptyIcon={XCircle}
              emptyTitle="No Rejected Applications"
              emptyMessage="None of your applications have been rejected."
              onViewDetails={id => navigate(`/application/${id}`)}
            />
          </TabsContent>

          <TabsContent value="saved" className="space-y-4">
            <SavedTendersTab
              saved={saved}
              onView={(id, tender: SavedTender) => navigate(`/tender/s-${id}`, { state: { scrapedTender: tender } })}
              onRemove={removeSaved}
              onBrowse={() => navigate('/tenders')}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
