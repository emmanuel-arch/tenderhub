import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { User, LogOut, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tender } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { fetchActiveTenders, fetchAllActiveTenders } from '../services/tenderService';
import { TenderCard } from './tender/TenderCard';
import { PaginationControls } from './tender/PaginationControls';

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-slate-400 mb-3" />
        <p className="text-slate-600">{message}</p>
      </CardContent>
    </Card>
  );
}

export function TenderList() {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [subCategoryFilter, setSubCategoryFilter] = useState('all');
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingAll, setLoadingAll] = useState(false);
  const [showAllTenders, setShowAllTenders] = useState(false);

  useEffect(() => {
    if (showAllTenders) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchActiveTenders(currentPage);
        setTenders(result.tenders);
        setTotalPages(result.totalPages);
        setTotal(result.total);
      } catch {
        setError('Failed to load tenders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentPage, showAllTenders]);

  const handleLoadAll = async () => {
    setLoadingAll(true);
    setError(null);
    try {
      const all = await fetchAllActiveTenders();
      setTenders(all);
      setTotal(all.length);
      setShowAllTenders(true);
    } catch {
      setError('Failed to load all tenders. Please try again later.');
    } finally {
      setLoadingAll(false);
    }
  };

  const handlePageChange = (dir: 'prev' | 'next') => {
    setCurrentPage(p => dir === 'next' ? p + 1 : p - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filtered = tenders.filter(t => {
    if (activeTab !== 'all' && t.category !== activeTab) return false;
    if (subCategoryFilter !== 'all' && t.subCategory !== subCategoryFilter) return false;
    return true;
  });

  const count = (cat: string) => tenders.filter(t => t.category === cat).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">TenderHub Kenya</h1>
              <p className="text-sm text-slate-600">Discover government and private sector opportunities</p>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <div className="text-sm text-slate-600">
                    <User className="w-4 h-4 inline mr-1" />
                    {user.name}
                  </div>
                  {isAdmin ? (
                    <Button variant="outline" onClick={() => navigate('/admin')}>Admin Panel</Button>
                  ) : (
                    <Button variant="outline" onClick={() => navigate('/dashboard')}>My Dashboard</Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={logout}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <Button onClick={() => navigate('/login')}>Sign In</Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showAllTenders && !loading && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-900">
                    <strong>Showing {tenders.length} of {total} total tenders</strong> (Page {currentPage} of {totalPages})
                  </p>
                  <p className="text-xs text-blue-700 mt-1">Use pagination to browse or load all tenders at once</p>
                </div>
                <Button onClick={handleLoadAll} disabled={loadingAll} variant="outline" className="bg-white">
                  {loadingAll ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading All...</> : `Load All ${total} Tenders`}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {showAllTenders && !loading && (
          <Card className="mb-6 bg-green-50 border-green-200">
            <CardContent className="py-4">
              <p className="text-sm text-green-900">
                <CheckCircle className="w-4 h-4 inline mr-2" />
                <strong>All {total} tenders loaded!</strong> You can now filter and browse all available tenders.
              </p>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <span className="ml-3 text-slate-600">
              {loadingAll ? 'Loading all tenders… This may take a moment.' : 'Loading tenders…'}
            </span>
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-red-600 mb-3" />
              <p className="text-red-800 font-medium">{error}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <TabsList>
                  <TabsTrigger value="all">All ({tenders.length})</TabsTrigger>
                  <TabsTrigger value="government">Government ({count('government')})</TabsTrigger>
                  <TabsTrigger value="private">Private ({count('private')})</TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Category:</span>
                  <Select value={subCategoryFilter} onValueChange={setSubCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="goods">Goods</SelectItem>
                      <SelectItem value="services">Services</SelectItem>
                      <SelectItem value="works">Works</SelectItem>
                      <SelectItem value="consultancy">Consultancy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(['all', 'government', 'private'] as const).map(tab => (
                <TabsContent key={tab} value={tab} className="space-y-4">
                  {filtered.length > 0
                    ? filtered.map(t => <TenderCard key={t.id} tender={t} />)
                    : <EmptyState message={`No ${tab === 'all' ? '' : tab + ' '}tenders found matching your criteria.`} />
                  }
                </TabsContent>
              ))}
            </Tabs>

            {!showAllTenders && totalPages > 1 && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPrev={() => handlePageChange('prev')}
                onNext={() => handlePageChange('next')}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
