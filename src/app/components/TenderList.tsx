import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { LogOut, AlertCircle, Loader2, Search, Filter } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tender } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { fetchActiveTenders } from '../services/tenderService';
import { scrapedTendersApi, type ScrapedTenderDto, type PagedResult } from '../services/api';
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
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

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


  // Load scraped tenders
  const loadScraped = useCallback(async () => {
    setScrapedLoading(true);
    setScrapedError(null);
    try {
      const params: Record<string, any> = { page: scrapedPage, pageSize: 20 };
      if (categoryFilter !== 'all') params.subCategory = categoryFilter;
      if (searchQuery) params.search = searchQuery;
      const result: PagedResult<ScrapedTenderDto> = await scrapedTendersApi.list(params);
      setScrapedTenders(result.data);
      setScrapedTotalPages(Math.ceil(result.totalCount / result.pageSize));
      setScrapedTotal(result.totalCount);
    } catch {
      setScrapedError('Error loading tenders. Please try again later.');
    } finally {
      setScrapedLoading(false);
    }
  }, [scrapedPage, categoryFilter, searchQuery]);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-3">
            <button onClick={() => navigate('/')} className="text-left hover:opacity-80 transition-opacity min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-slate-900 truncate">TenderHub Kenya</h1>
              <p className="text-xs sm:text-sm text-slate-600 hidden sm:block">Discover government and private sector opportunities</p>
            </button>
            <div className="flex items-center gap-2 shrink-0">
              {user ? (
                <>
                  {isAdmin ? (
                    <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>Admin</Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>Dashboard</Button>
                  )}
                  <span className="text-sm text-slate-600 hidden sm:block">{user.name}</span>
                  <Button variant="outline" size="sm" onClick={logout} className="gap-1.5">
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={() => navigate('/login')}>Sign In</Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Tabs */}
        <Tabs value={mainTab} onValueChange={v => { setMainTab(v); if (v === 'api') setShowApiTenders(true); }}>
          <TabsList className="mb-6 w-full grid grid-cols-3">
            <TabsTrigger value="scraped" className="gap-1.5 text-xs sm:text-sm">
              <Filter className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline truncate">All Tenders ({scrapedTotal.toLocaleString()})</span>
              <span className="sm:hidden">All</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Government Portal</span>
              <span className="sm:hidden">Gov't</span>
            </TabsTrigger>
            <TabsTrigger value="private" className="text-xs sm:text-sm">
              Private
            </TabsTrigger>
          </TabsList>

          {/* Search & Filter Bar — shared across all tabs */}
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Search tenders by title, entity, or number..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} variant="default" className="gap-1.5 shrink-0">
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Search</span>
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'Goods', label: 'Goods' },
                  { value: 'Works', label: 'Works' },
                  { value: 'Services', label: 'Services' },
                  { value: 'Consultancy Services', label: 'Consultancy' },
                ].map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => { setCategoryFilter(cat.value); setScrapedPage(1); }}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      categoryFilter === cat.value
                        ? 'bg-blue-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
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

          {/* ── SCRAPED TENDERS (PRIMARY) ── */}
          <TabsContent value="scraped">

            {/* Results info */}
            {!scrapedLoading && !scrapedError && (
              <div className="mb-4 text-sm text-slate-500">
                Showing {scrapedTenders.length} of {scrapedTotal.toLocaleString()} tenders
                {' '}— Page {scrapedPage} of {scrapedTotalPages}
              </div>
            )}

            {/* Content */}
            {scrapedLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
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
            {apiLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
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
                    <ScrapedTenderCard key={t.id} tender={{
                      id: t.id,
                      source: 'tenders.go.ke',
                      title: t.title,
                      tenderNumber: t.tenderNumber,
                      procuringEntity: t.procuringEntity,
                      deadline: t.deadline,
                      category: t.category,
                      subCategory: t.subCategory,
                      summary: t.summary,
                      description: t.description,
                      documentUrl: t.documentUrl,
                      bidBondRequired: t.bidBondRequired,
                      bidBondAmount: t.bidBondAmount,
                      createdAt: new Date().toISOString(),
                    } as ScrapedTenderDto} />
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

          {/* ── PRIVATE TENDERS ── */}
          <TabsContent value="private">
            <EmptyState message="No private tenders available yet." />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
