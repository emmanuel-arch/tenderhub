import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { User, LogOut, AlertCircle, Loader2, Search, Filter } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tender } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { fetchActiveTenders } from '../services/tenderService';
import { scrapedTendersApi, type ScrapedTenderDto, type PagedResult } from '../services/api';
import { TenderCard } from './tender/TenderCard';
import { ScrapedTenderCard } from './tender/ScrapedTenderCard';
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

  // ── Scraped tenders state (PRIMARY) ──
  const [scrapedTenders, setScrapedTenders] = useState<ScrapedTenderDto[]>([]);
  const [scrapedLoading, setScrapedLoading] = useState(true);
  const [scrapedError, setScrapedError] = useState<string | null>(null);
  const [scrapedPage, setScrapedPage] = useState(1);
  const [scrapedTotalPages, setScrapedTotalPages] = useState(1);
  const [scrapedTotal, setScrapedTotal] = useState(0);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sources, setSources] = useState<string[]>([]);

  // ── API tenders state (SECONDARY) ──
  const [apiTenders, setApiTenders] = useState<Tender[]>([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiPage, setApiPage] = useState(1);
  const [apiTotalPages, setApiTotalPages] = useState(1);
  const [apiTotal, setApiTotal] = useState(0);
  const [showApiTenders, setShowApiTenders] = useState(false);

  // ── Main tab ──
  const [mainTab, setMainTab] = useState('scraped');

  // Load sources on mount
  useEffect(() => {
    scrapedTendersApi.getSources().then(setSources).catch(() => {});
  }, []);

  // Load scraped tenders
  const loadScraped = useCallback(async () => {
    setScrapedLoading(true);
    setScrapedError(null);
    try {
      const params: Record<string, any> = { page: scrapedPage, pageSize: 20 };
      if (sourceFilter !== 'all') params.source = sourceFilter;
      if (searchQuery) params.search = searchQuery;
      const result: PagedResult<ScrapedTenderDto> = await scrapedTendersApi.list(params);
      setScrapedTenders(result.data);
      setScrapedTotalPages(Math.ceil(result.totalCount / result.pageSize));
      setScrapedTotal(result.totalCount);
    } catch {
      setScrapedError('Failed to load scraped tenders. Make sure the backend is running.');
    } finally {
      setScrapedLoading(false);
    }
  }, [scrapedPage, sourceFilter, searchQuery]);

  useEffect(() => { loadScraped(); }, [loadScraped]);

  // Load API tenders (on demand)
  const loadApiTenders = useCallback(async () => {
    setApiLoading(true);
    setApiError(null);
    try {
      const result = await fetchActiveTenders(apiPage);
      setApiTenders(result.tenders);
      setApiTotalPages(result.totalPages);
      setApiTotal(result.total);
    } catch {
      setApiError('Failed to load government API tenders.');
    } finally {
      setApiLoading(false);
    }
  }, [apiPage]);

  useEffect(() => {
    if (showApiTenders) loadApiTenders();
  }, [showApiTenders, loadApiTenders]);

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setScrapedPage(1);
  };

  const handleScrapedPageChange = (dir: 'prev' | 'next') => {
    setScrapedPage(p => dir === 'next' ? p + 1 : p - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApiPageChange = (dir: 'prev' | 'next') => {
    setApiPage(p => dir === 'next' ? p + 1 : p - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
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
        {/* Main Tabs: Scraped (Primary) vs API (Secondary) */}
        <Tabs value={mainTab} onValueChange={v => { setMainTab(v); if (v === 'api') setShowApiTenders(true); }}>
          <TabsList className="mb-6">
            <TabsTrigger value="scraped" className="gap-2">
              <Filter className="w-4 h-4" />
              All Tenders ({scrapedTotal.toLocaleString()})
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              Government Portal
            </TabsTrigger>
          </TabsList>

          {/* ── SCRAPED TENDERS (PRIMARY) ── */}
          <TabsContent value="scraped">
            {/* Search & Filter Bar */}
            <Card className="mb-6">
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 flex gap-2">
                    <Input
                      placeholder="Search tenders by title, entity, or number..."
                      value={searchInput}
                      onChange={e => setSearchInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      className="flex-1"
                    />
                    <Button onClick={handleSearch} variant="default" className="gap-1.5">
                      <Search className="w-4 h-4" />
                      Search
                    </Button>
                  </div>
                  <Select
                    value={sourceFilter}
                    onValueChange={v => { setSourceFilter(v); setScrapedPage(1); }}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="All Sources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      {sources.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {searchQuery && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-slate-500">
                      Showing results for "<strong>{searchQuery}</strong>"
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setSearchInput(''); setSearchQuery(''); setScrapedPage(1); }}
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Results info */}
            {!scrapedLoading && !scrapedError && (
              <div className="mb-4 text-sm text-slate-500">
                Showing {scrapedTenders.length} of {scrapedTotal.toLocaleString()} tenders
                {sourceFilter !== 'all' && ` from ${sourceFilter}`}
                {' '}— Page {scrapedPage} of {scrapedTotalPages}
              </div>
            )}

            {/* Content */}
            {scrapedLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                <span className="ml-3 text-slate-600">Loading tenders…</span>
              </div>
            ) : scrapedError ? (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="py-8 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto text-red-600 mb-3" />
                  <p className="text-red-800 font-medium">{scrapedError}</p>
                  <Button variant="outline" className="mt-4" onClick={loadScraped}>Try Again</Button>
                </CardContent>
              </Card>
            ) : scrapedTenders.length === 0 ? (
              <EmptyState message="No tenders found matching your criteria." />
            ) : (
              <div className="space-y-4">
                {scrapedTenders.map(t => (
                  <ScrapedTenderCard key={t.id} tender={t} />
                ))}
              </div>
            )}

            {!scrapedLoading && scrapedTotalPages > 1 && (
              <PaginationControls
                currentPage={scrapedPage}
                totalPages={scrapedTotalPages}
                onPrev={() => handleScrapedPageChange('prev')}
                onNext={() => handleScrapedPageChange('next')}
              />
            )}
          </TabsContent>

          {/* ── API TENDERS (SECONDARY) ── */}
          <TabsContent value="api">
            <Card className="mb-6 bg-blue-50 border-blue-200">
              <CardContent className="py-3">
                <p className="text-sm text-blue-800">
                  These tenders are fetched live from the <strong>tenders.go.ke</strong> government portal.
                </p>
              </CardContent>
            </Card>

            {apiLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-slate-600">Loading government tenders…</span>
              </div>
            ) : apiError ? (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="py-8 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto text-red-600 mb-3" />
                  <p className="text-red-800 font-medium">{apiError}</p>
                </CardContent>
              </Card>
            ) : apiTenders.length === 0 ? (
              <EmptyState message="No government tenders available right now." />
            ) : (
              <>
                <div className="mb-4 text-sm text-slate-500">
                  Showing {apiTenders.length} of {apiTotal} — Page {apiPage} of {apiTotalPages}
                </div>
                <div className="space-y-4">
                  {apiTenders.map(t => (
                    <TenderCard key={t.id} tender={t} />
                  ))}
                </div>
              </>
            )}

            {!apiLoading && apiTotalPages > 1 && (
              <PaginationControls
                currentPage={apiPage}
                totalPages={apiTotalPages}
                onPrev={() => handleApiPageChange('prev')}
                onNext={() => handleApiPageChange('next')}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
