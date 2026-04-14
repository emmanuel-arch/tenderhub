import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { LogOut, AlertCircle, Loader2, Search, Filter } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuth } from '../contexts/AuthContext';
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

  // ── Government tenders state ──
  const [govTenders, setGovTenders] = useState<ScrapedTenderDto[]>([]);
  const [govLoading, setGovLoading] = useState(false);
  const [govError, setGovError] = useState<string | null>(null);
  const [govPage, setGovPage] = useState(1);
  const [govTotalPages, setGovTotalPages] = useState(1);
  const [govTotal, setGovTotal] = useState(0);
  const [showGov, setShowGov] = useState(false);

  // ── Private tenders state ──
  const [privateTenders, setPrivateTenders] = useState<ScrapedTenderDto[]>([]);
  const [privateLoading, setPrivateLoading] = useState(false);
  const [privateError, setPrivateError] = useState<string | null>(null);
  const [privatePage, setPrivatePage] = useState(1);
  const [privateTotalPages, setPrivateTotalPages] = useState(1);
  const [privateTotal, setPrivateTotal] = useState(0);
  const [showPrivate, setShowPrivate] = useState(false);

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

  // Load government tenders (on demand)
  const loadGov = useCallback(async () => {
    setGovLoading(true);
    setGovError(null);
    try {
      const params: Record<string, any> = { page: govPage, pageSize: 20, category: 'Government' };
      if (categoryFilter !== 'all') params.subCategory = categoryFilter;
      if (searchQuery) params.search = searchQuery;
      const result: PagedResult<ScrapedTenderDto> = await scrapedTendersApi.list(params);
      setGovTenders(result.data);
      setGovTotalPages(Math.ceil(result.totalCount / result.pageSize));
      setGovTotal(result.totalCount);
    } catch {
      setGovError('Failed to load government tenders.');
    } finally {
      setGovLoading(false);
    }
  }, [govPage, categoryFilter, searchQuery]);

  useEffect(() => {
    if (showGov) loadGov();
  }, [showGov, loadGov]);

  // Load private tenders (on demand)
  const loadPrivate = useCallback(async () => {
    setPrivateLoading(true);
    setPrivateError(null);
    try {
      const params: Record<string, any> = { page: privatePage, pageSize: 20, notGovernment: true };
      if (categoryFilter !== 'all') params.subCategory = categoryFilter;
      if (searchQuery) params.search = searchQuery;
      const result: PagedResult<ScrapedTenderDto> = await scrapedTendersApi.list(params);
      setPrivateTenders(result.data);
      setPrivateTotalPages(Math.ceil(result.totalCount / result.pageSize));
      setPrivateTotal(result.totalCount);
    } catch {
      setPrivateError('Failed to load private tenders.');
    } finally {
      setPrivateLoading(false);
    }
  }, [privatePage, categoryFilter, searchQuery]);

  useEffect(() => {
    if (showPrivate) loadPrivate();
  }, [showPrivate, loadPrivate]);

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setScrapedPage(1);
    setGovPage(1);
    setPrivatePage(1);
  };

  const handleScrapedPageChange = (dir: 'prev' | 'next') => {
    setScrapedPage(p => dir === 'next' ? p + 1 : p - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGovPageChange = (dir: 'prev' | 'next') => {
    setGovPage(p => dir === 'next' ? p + 1 : p - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrivatePageChange = (dir: 'prev' | 'next') => {
    setPrivatePage(p => dir === 'next' ? p + 1 : p - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-3">
            <button onClick={() => navigate('/')} className="text-left hover:opacity-80 transition-opacity min-w-0 cursor-pointer">
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
                  <span className="text-sm text-slate-700 font-medium hidden sm:flex items-center px-3 py-1 rounded-full border border-slate-200 bg-slate-50">{user.name}</span>
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
        <Tabs value={mainTab} onValueChange={v => {
          setMainTab(v);
          if (v === 'api') setShowGov(true);
          if (v === 'private') setShowPrivate(true);
        }}>
          <TabsList className="mb-6 w-full grid grid-cols-3">
            <TabsTrigger value="scraped" className="gap-1.5 text-xs sm:text-sm">
              <Filter className="w-3.5 h-3.5 shrink-0" />
              All Tenders
            </TabsTrigger>
            <TabsTrigger value="api" className="text-xs sm:text-sm">
              Government
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

          {/* ── Not listed banner ── */}
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-blue-900 bg-blue-900 px-4 py-3">
            <p className="text-sm text-white">
              <span className="font-semibold">Can't find your tender?</span>{' '}
              If the tender you're looking for is not listed, you can apply for a bid bond directly.
            </p>
            <Button
              size="sm"
              className="shrink-0 bg-slate-900 text-white hover:bg-slate-800"
              onClick={() => navigate('/apply')}
            >
              Apply for Bid Bond
            </Button>
          </div>

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

          {/* ── GOVERNMENT TENDERS ── */}
          <TabsContent value="api">
            {govLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
                <span className="ml-3 text-slate-600">Loading government tenders…</span>
              </div>
            ) : govError ? (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="py-8 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto text-red-600 mb-3" />
                  <p className="text-red-800 font-medium">{govError}</p>
                  <Button variant="outline" className="mt-4" onClick={loadGov}>Try Again</Button>
                </CardContent>
              </Card>
            ) : govTenders.length === 0 ? (
              <EmptyState message="No government tenders found." />
            ) : (
              <>
                <div className="mb-4 text-sm text-slate-500">
                  Showing {govTenders.length} of {govTotal.toLocaleString()} — Page {govPage} of {govTotalPages}
                </div>
                <div className="space-y-4">
                  {govTenders.map(t => <ScrapedTenderCard key={t.id} tender={t} />)}
                </div>
              </>
            )}
            {!govLoading && govTotalPages > 1 && (
              <PaginationControls
                currentPage={govPage}
                totalPages={govTotalPages}
                onPrev={() => handleGovPageChange('prev')}
                onNext={() => handleGovPageChange('next')}
              />
            )}
          </TabsContent>

          {/* ── PRIVATE TENDERS ── */}
          <TabsContent value="private">
            {privateLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
                <span className="ml-3 text-slate-600">Loading private tenders…</span>
              </div>
            ) : privateError ? (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="py-8 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto text-red-600 mb-3" />
                  <p className="text-red-800 font-medium">{privateError}</p>
                  <Button variant="outline" className="mt-4" onClick={loadPrivate}>Try Again</Button>
                </CardContent>
              </Card>
            ) : privateTenders.length === 0 ? (
              <EmptyState message="No private tenders found." />
            ) : (
              <>
                <div className="mb-4 text-sm text-slate-500">
                  Showing {privateTenders.length} of {privateTotal.toLocaleString()} — Page {privatePage} of {privateTotalPages}
                </div>
                <div className="space-y-4">
                  {privateTenders.map(t => <ScrapedTenderCard key={t.id} tender={t} />)}
                </div>
              </>
            )}
            {!privateLoading && privateTotalPages > 1 && (
              <PaginationControls
                currentPage={privatePage}
                totalPages={privateTotalPages}
                onPrev={() => handlePrivatePageChange('prev')}
                onNext={() => handlePrivatePageChange('next')}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
