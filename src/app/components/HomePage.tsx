import { useNavigate } from 'react-router';
import {
  Search, FileText, Shield, ArrowRight, Building2,
  TrendingUp, CheckCircle, BarChart3, Bell,
  Briefcase, Cpu, Package, Users
} from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';

export function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── Nav ── */}
      <header className="border-b border-slate-100 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm leading-tight">TenderHub Kenya</div>
              <div className="text-xs text-slate-500 leading-tight">Your Gateway to Opportunities</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              className="gap-1.5 bg-green-50 hover:bg-green-100 text-green-900 font-semibold border border-green-200 shadow-sm animate-pulse hover:animate-none hover:scale-105 transition-transform active:scale-95"
              onClick={() => navigate(isAuthenticated ? '/apply' : '/login', { state: { from: { pathname: '/apply' } } })}
            >
              <Shield className="w-4 h-4" />
              Apply for Bid Bond
            </Button>
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-slate-50">
                  <div className="w-6 h-6 rounded-full bg-blue-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {user?.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <span className="text-sm text-slate-700 font-medium">{user?.name}</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}>Dashboard</Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" className="text-slate-600 border-slate-300" onClick={() => navigate('/login')}>Sign In</Button>
                <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white hover:scale-105 transition-transform active:scale-95" onClick={() => navigate('/tenders')}>Browse Tenders</Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-900 text-sm font-medium px-3 py-1.5 rounded-full border border-green-200">
                <TrendingUp className="w-3.5 h-3.5" />
                615+ Active Tenders Available
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight">
                  Kenya's Leading Tender
                </h1>
                <h1 className="text-4xl sm:text-5xl font-bold text-green-800 leading-tight">
                  Aggregation Platform
                </h1>
              </div>

              <p className="text-lg text-slate-500 leading-relaxed max-w-lg">
                Access comprehensive tender opportunities from government ministries, county governments, and private sector organizations. All in one centralized platform.
              </p>

              <div className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="gap-2 bg-slate-900 hover:bg-slate-800 text-white animate-pulse hover:animate-none hover:scale-105 transition-transform active:scale-95"
                  onClick={() => navigate('/tenders')}
                >
                  Explore Tenders
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 border-slate-300 text-slate-700"
                  onClick={() => navigate(isAuthenticated ? '/apply' : '/login', { state: { from: { pathname: '/apply' } } })}
                >
                  <Shield className="w-4 h-4" />
                  Apply for Bid Bond
                </Button>
                <Button size="lg" variant="outline" className="border-slate-300 text-slate-700" onClick={() => navigate('/login')}>
                  Get Started
                </Button>
              </div>

              {/* Stats */}
              <div className="flex gap-10 pt-4 border-t border-slate-100">
                {[
                  { value: '615+', label: 'Active Tenders' },
                  { value: '4', label: 'Categories' },
                  { value: '24/7', label: 'Access' },
                ].map(({ value, label }) => (
                  <div key={label}>
                    <div className="text-2xl font-bold text-slate-900">{value}</div>
                    <div className="text-sm text-slate-500">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — feature card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 space-y-4">
              {[
                { icon: Building2, color: 'bg-blue-50 text-blue-900', title: 'Government Opportunities', desc: 'From all ministries & counties' },
                { icon: Search, color: 'bg-green-50 text-green-800', title: 'Smart Filtering', desc: 'Find relevant tenders fast' },
                { icon: Shield, color: 'bg-green-50 text-green-700', title: 'Bid Bond Management', desc: 'Integrated with local banks' },
              ].map(({ icon: Icon, color, title, desc }) => (
                <div key={title} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{title}</div>
                      <div className="text-xs text-slate-500">{desc}</div>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-800 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Everything You Need to Win Tenders</h2>
            <p className="text-slate-500">Comprehensive tools and features designed for Kenyan businesses</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Search, color: 'bg-blue-50 text-blue-900', title: 'Smart Search', desc: 'Filter by category, ministry, amount, and deadline to find relevant opportunities' },
              { icon: Bell, color: 'bg-blue-50 text-blue-700', title: 'Live Updates', desc: 'Real-time tender updates from government portals and private organizations' },
              { icon: Shield, color: 'bg-green-50 text-green-700', title: 'Bid Bonds', desc: 'Direct integration with Kenyan banks for seamless bid bond applications' },
              { icon: BarChart3, color: 'bg-green-50 text-green-800', title: 'Track Progress', desc: 'Monitor application status and manage all submissions from one dashboard' },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Browse by Category ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Browse by Category</h2>
            <p className="text-slate-500">Find tenders across all major procurement categories</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Briefcase, color: 'bg-blue-50 text-blue-900', title: 'Works', desc: 'Construction, infrastructure, and civil engineering projects', value: 'Works' },
              { icon: Cpu, color: 'bg-blue-50 text-blue-700', title: 'Services', desc: 'Professional services, IT, consulting, and maintenance', value: 'Services' },
              { icon: Package, color: 'bg-green-50 text-green-700', title: 'Goods', desc: 'Equipment, supplies, materials, and commodities', value: 'Goods' },
              { icon: Users, color: 'bg-green-50 text-green-800', title: 'Consultancy', desc: 'Expert advisory, research, and specialized consulting', value: 'Consultancy Services' },
            ].map(({ icon: Icon, color, title, desc, value }) => (
              <button
                key={title}
                onClick={() => navigate(`/tenders?subCategory=${encodeURIComponent(value)}`)}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md hover:border-slate-300 transition-all text-left group"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-blue-900 transition-colors">{title}</h3>
                <p className="text-sm text-slate-500">{desc}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reviews ── */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">What Our Users Say</h2>
            <p className="text-slate-500">Trusted by procurement professionals across Kenya</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                initials: 'JM',
                name: 'James Mwangi',
                title: 'Procurement Manager, Nairobi',
                review: 'TenderHub has transformed how we find and apply for government tenders. We no longer miss opportunities.',
              },
              {
                initials: 'AO',
                name: 'Amina Omar',
                title: 'Director, Mombasa SME',
                review: 'The bid bond application process used to take days. With TenderHub and their partner banks, we get approvals the same day.',
              },
              {
                initials: 'KK',
                name: 'Kevin Kamau',
                title: 'CEO, Nairobi Construction Ltd',
                review: 'Having all tenders — government and private — in one place saves us hours every week. The deadline alerts are a lifesaver.',
              },
            ].map(({ initials, name, title, review }) => (
              <div key={name} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col gap-4">
                <p className="text-sm text-slate-600 italic leading-relaxed flex-1">"{review}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                    {initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{name}</div>
                    <div className="text-xs text-slate-400">{title}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-4 bg-slate-900">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold text-white">Ready to Discover Your Next Opportunity?</h2>
          <p className="text-slate-400">Join businesses across Kenya finding and winning government and private sector tenders</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              size="lg"
              className="gap-2 bg-green-500 hover:bg-green-900 text-white border-0"
              onClick={() => navigate('/tenders')}
            >
              Browse Active Tenders
              <ArrowRight className="w-4 h-4" />
            </Button>
            {!isAuthenticated && (
              <Button size="lg" variant="outline" className="bg-white text-slate-900 border-white hover:bg-white hover:text-slate-900" onClick={() => navigate('/login')}>
                Create Account
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 border-t border-white/5 px-4 py-6">
        <div className="max-w-7xl mx-auto text-center text-sm text-slate-600">
          © {new Date().getFullYear()} TenderHub Kenya. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
