import { Loader2, AlertCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { ApplicationCard } from './ApplicationCard';
import type { ApplicationDto } from '../../services/api';

interface Props {
  applications: ApplicationDto[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  EmptyIcon: LucideIcon;
  emptyTitle: string;
  emptyMessage: string;
  browseAction?: () => void;
  onViewDetails: (id: string) => void;
}

export function ApplicationsList({ applications, loading, error, onRetry, EmptyIcon, emptyTitle, emptyMessage, browseAction, onViewDetails }: Props) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-10 text-center">
          <AlertCircle className="w-10 h-10 mx-auto text-red-500 mb-3" />
          <p className="text-red-800 font-medium mb-4">{error}</p>
          {onRetry && <Button variant="outline" onClick={onRetry}>Try Again</Button>}
        </CardContent>
      </Card>
    );
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <EmptyIcon className="w-12 h-12 mx-auto text-slate-400 mb-4" />
          <h3 className="font-semibold mb-2">{emptyTitle}</h3>
          <p className="text-slate-600 mb-4">{emptyMessage}</p>
          {browseAction && <Button onClick={browseAction}>Browse Tenders</Button>}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map(app => (
        <ApplicationCard key={app.id} application={app} onViewDetails={onViewDetails} />
      ))}
    </div>
  );
}
