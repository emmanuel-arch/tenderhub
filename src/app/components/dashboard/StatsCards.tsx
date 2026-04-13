import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { ApplicationDto } from '../../services/api';

interface Props {
  applications: ApplicationDto[];
}

export function StatsCards({ applications }: Props) {
  const approved = applications.filter(a => a.status.toLowerCase() === 'approved').length;
  const pending  = applications.filter(a => ['pending', 'submitted'].includes(a.status.toLowerCase())).length;
  const rejected = applications.filter(a => a.status.toLowerCase() === 'rejected').length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600">Total Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{applications.length}</div>
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
          <div className="text-3xl font-bold text-green-800">{approved}</div>
          <div className="text-sm text-slate-600 mt-1">Ready to download</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600">Pending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-700">{pending}</div>
          <div className="text-sm text-slate-600 mt-1">Under review</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600">Rejected</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-600">{rejected}</div>
          <div className="text-sm text-slate-600 mt-1">Not approved</div>
        </CardContent>
      </Card>
    </div>
  );
}
