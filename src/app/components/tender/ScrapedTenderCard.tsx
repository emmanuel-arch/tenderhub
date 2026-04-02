import { Calendar, Building2, Clock, ExternalLink, Download, FileText, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import type { ScrapedTenderDto } from '../../services/api';

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

const sourceColors: Record<string, string> = {
  AFA: 'bg-green-100 text-green-800 border-green-300',
  KRA: 'bg-blue-100 text-blue-800 border-blue-300',
  eGP: 'bg-purple-100 text-purple-800 border-purple-300',
};

interface Props {
  tender: ScrapedTenderDto;
}

export function ScrapedTenderCard({ tender }: Props) {
  const daysRemaining = getDaysRemaining(tender.deadline);
  const isExpired = daysRemaining !== null && daysRemaining < 0;
  const isUrgent = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 7;

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500">
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
          <Badge className={sourceColors[tender.source] ?? 'bg-gray-100 text-gray-800'} variant="outline">
            {tender.source}
          </Badge>
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
            <span className={`flex items-center gap-1 ${isExpired ? 'text-red-600' : isUrgent ? 'text-amber-600 font-medium' : ''}`}>
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

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          {tender.subCategory && (
            <Badge variant="outline" className="capitalize text-xs">
              {tender.subCategory}
            </Badge>
          )}
          {tender.bidBondRequired && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
              Bid Bond Required
            </Badge>
          )}
          {tender.bidBondAmount > 0 && (
            <Badge variant="outline" className="bg-slate-50 text-slate-700 text-xs">
              KES {tender.bidBondAmount.toLocaleString()}
            </Badge>
          )}
        </div>

        {/* Summary */}
        {tender.summary && (
          <p className="text-sm text-slate-600 line-clamp-2">{tender.summary}</p>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {tender.tenderNoticeUrl && (
            <Button
              size="sm"
              variant="default"
              className="gap-1.5"
              onClick={() => window.open(tender.tenderNoticeUrl!, '_blank', 'noopener,noreferrer')}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Tender Notice
            </Button>
          )}
          {tender.documentUrl && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => window.open(tender.documentUrl!, '_blank', 'noopener,noreferrer')}
            >
              <Download className="w-3.5 h-3.5" />
              Download Document
            </Button>
          )}
          {!tender.tenderNoticeUrl && !tender.documentUrl && (
            <span className="text-xs text-slate-400 italic">No documents available</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
