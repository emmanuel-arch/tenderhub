import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { AlertCircle, Loader2, TrendingUp, Users, Building2, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { analyticsApi, type AnalyticsDashboard } from '../../services/api';

const COLORS = ['#1e3a5f', '#15803d', '#b91c1c', '#92400e', '#1d4ed8', '#6d28d9'];

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', notation: 'compact', maximumFractionDigits: 1 }).format(n);

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: typeof Users; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
          </div>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center opacity-20`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    analyticsApi.getDashboard()
      .then(setData)
      .catch(err => setError(err.message ?? 'Failed to load analytics.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-12 text-center">
        <AlertCircle className="w-10 h-10 mx-auto text-red-500 mb-3" />
        <p className="text-red-800 font-medium mb-4">{error ?? 'No data available.'}</p>
        <Button variant="outline" onClick={load}>Try Again</Button>
      </div>
    );
  }

  const { summary, byCategory, byInstitution, byMonth, topEntities } = data;

  return (
    <div className="space-y-6">

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Total Applications" value={summary.totalApplications} color="text-slate-900" />
        <StatCard icon={Users}      label="Registered Users"   value={summary.totalUsers}        sub="platform sign-ups" color="text-blue-900" />
        <StatCard icon={Building2}  label="Unique Companies"   value={summary.uniqueCompanies}   sub="distinct applicants" color="text-green-800" />
        <StatCard icon={DollarSign} label="Total Bond Value"   value={formatCurrency(summary.totalBondValue)} color="text-green-700" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-xs text-green-700 mb-1">Approved</p>
            <p className="text-3xl font-bold text-green-800">{summary.approved}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-xs text-yellow-700 mb-1">Pending</p>
            <p className="text-3xl font-bold text-yellow-800">{summary.pending}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-xs text-red-700 mb-1">Rejected</p>
            <p className="text-3xl font-bold text-red-700">{summary.rejected}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Monthly trend ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Applications Over Time (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byMonth} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" name="Applications" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── By tender category ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Applications by Tender Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={byCategory}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {byCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v} applications`]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ── By institution type ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Applications by Institution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={byInstitution}
                  dataKey="count"
                  nameKey="institution"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ institution, percent }) => `${institution} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {byInstitution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v} applications`]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>

      {/* ── Top procuring entities ── */}
      {topEntities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Procuring Entities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topEntities.map(({ entity, count }) => (
                <div key={entity} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="truncate font-medium text-slate-800">{entity}</span>
                      <span className="shrink-0 text-slate-500 ml-2">{count}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-900 rounded-full"
                        style={{ width: `${(count / topEntities[0].count) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
