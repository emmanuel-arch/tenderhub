import { CheckCircle, Clock, XCircle, FileText, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import type { ApplicationDto } from '../../services/api';

interface Props {
  application: ApplicationDto;
  onViewDetails: (id: string) => void;
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);

function statusMeta(status: string) {
  const s = status.toLowerCase();
  if (s === 'approved') return {
    icon: <CheckCircle className="w-5 h-5 text-green-800 shrink-0" />,
    badge: 'bg-green-100 text-green-950 border-green-200',
    border: 'border-green-200',
    label: 'Approved',
  };
  if (s === 'rejected') return {
    icon: <XCircle className="w-5 h-5 text-red-600 shrink-0" />,
    badge: 'bg-red-100 text-red-800 border-red-200',
    border: 'border-red-200',
    label: 'Rejected',
  };
  if (['pending', 'submitted'].includes(s)) return {
    icon: <Clock className="w-5 h-5 text-green-700 shrink-0" />,
    badge: 'bg-green-100 text-green-900 border-green-200',
    border: 'border-green-200',
    label: status.charAt(0).toUpperCase() + status.slice(1),
  };
  return {
    icon: <FileText className="w-5 h-5 text-blue-900 shrink-0" />,
    badge: 'bg-blue-100 text-blue-900 border-blue-200',
    border: '',
    label: status.charAt(0).toUpperCase() + status.slice(1),
  };
}

export function ApplicationCard({ application, onViewDetails }: Props) {
  const meta = statusMeta(application.status);
  const isApproved = application.status.toLowerCase() === 'approved';
  const isRejected = application.status.toLowerCase() === 'rejected';

  return (
    <Card className={meta.border ? `border ${meta.border}` : ''}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {meta.icon}
              <CardTitle className="leading-snug">{application.tenderTitle}</CardTitle>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              <div><span className="font-medium">Bank:</span> {application.bankName}</div>
              <div><span className="font-medium">Submitted:</span> {formatDate(application.submittedAt)}</div>
              {isApproved && application.approvedAt && (
                <div><span className="font-medium">Approved:</span> {formatDate(application.approvedAt)}</div>
              )}
              {application.bondAmount && (
                <div><span className="font-medium">Bond Amount:</span> {formatCurrency(application.bondAmount)}</div>
              )}
            </div>
          </div>
          <Badge variant="outline" className={`${meta.badge} shrink-0`}>{meta.label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isRejected && application.rejectionReason && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
            <span className="font-semibold">Reason: </span>{application.rejectionReason}
          </div>
        )}
        <Separator className="mb-4" />
        <div className="flex gap-3">
          <Button
            variant={isRejected ? 'outline' : 'default'}
            onClick={() => onViewDetails(application.id)}
          >
            View Details
          </Button>
          {isApproved && application.documentUrl && (
            <Button variant="outline" onClick={() => window.open(application.documentUrl!, '_blank')}>
              <Download className="w-4 h-4 mr-2" />
              Download Bond
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
