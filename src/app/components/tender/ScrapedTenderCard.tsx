import { useNavigate } from 'react-router';
import { Calendar, Building2, Clock, Download, FileText, Tag, Eye, Bookmark, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import type { ScrapedTenderDto } from '../../services/api';
import { useSavedTenders } from '../../hooks/useSavedTenders';

function toAbsoluteUrl(url: string) {
  return url.startsWith('http') ? url : `https://tenders.go.ke${url}`;
}

function getDaysRemaining(deadline?: string) {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface Props {
  tender: ScrapedTenderDto;
}

export function ScrapedTenderCard({ tender }: Props) {
  const navigate = useNavigate();
  const { isSaved, toggle } = useSavedTenders();
  const saved = isSaved(tender.id);
  const daysRemaining = getDaysRemaining(tender.deadline);
  const isExpired = daysRemaining !== null && daysRemaining < 0;
  const isUrgent = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 7;

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base leading-snug line-clamp-2">
              {tender.title}
            </CardTitle>
            {tender.procuringEntity && (
              <div className="flex items-center gap-2 text-sm text-slate-600 mt-2">
                <Building2 className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{tender.procuringEntity}</span>
              </div>
            )}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => toggle(tender)}
                className="shrink-0 text-slate-400 hover:text-blue-900 transition-colors"
              >
                <Bookmark className={`w-5 h-5 ${saved ? 'fill-blue-900 text-blue-900' : ''}`} />
              </button>
            </TooltipTrigger>
            <TooltipContent>{saved ? 'Remove from saved' : 'Save for later'}</TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Info row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
          {tender.tenderNumber && (
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              {tender.tenderNumber}
            </span>
          )}
          {tender.deadline && (
            <span className={`flex items-center gap-1 ${isExpired ? 'text-red-600' : isUrgent ? 'text-green-700 font-medium' : ''}`}>
              <Calendar className="w-3.5 h-3.5" />
              {isExpired ? 'Expired' : `Deadline: ${formatDate(tender.deadline)}`}
              {isUrgent && !isExpired && (
                <Badge variant="destructive" className="ml-1 text-xs py-0 px-1.5">
                  <Clock className="w-3 h-3 mr-0.5" />
                  {daysRemaining}d
                </Badge>
              )}
            </span>
          )}
          {tender.procurementMethod && (
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" />
              {tender.procurementMethod}
            </span>
          )}
        </div>

        {/* Badges + Bid Bond */}
        <div className="flex flex-wrap items-center gap-1.5">
          {tender.subCategory && (
            <Badge variant="outline" className="capitalize text-xs">
              {tender.subCategory}
            </Badge>
          )}
          {(tender.documentDetails?.bidBondAmount || tender.bidBondAmount > 0) && (
            <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
              <ShieldCheck className="w-3.5 h-3.5" />
              Bid Bond: {tender.documentDetails?.bidBondAmount ?? `KES ${tender.bidBondAmount.toLocaleString()}`}
            </span>
          )}
        </div>

        {/* Summary */}
        {tender.summary && (
          <p className="text-sm text-slate-600 line-clamp-2">{tender.summary}</p>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="default"
            className="gap-1.5 w-full sm:w-auto"
            onClick={() => navigate(`/tender/s-${tender.id}`, { state: { scrapedTender: tender } })}
          >
            <Eye className="w-3.5 h-3.5" />
            View Details
          </Button>
          {tender.documentUrl && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => window.open(toAbsoluteUrl(tender.documentUrl!), '_blank', 'noopener,noreferrer')}
            >
              <Download className="w-3.5 h-3.5" />
              Download Document
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
