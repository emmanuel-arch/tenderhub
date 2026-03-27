import { useNavigate } from 'react-router';
import { Calendar, Building2, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tender } from '../../data/mockData';
import { formatDate } from '../../utils/formatters';

function getDaysRemaining(deadline: string) {
  const diff = new Date(deadline).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

interface Props {
  tender: Tender;
}

export function TenderCard({ tender }: Props) {
  const navigate = useNavigate();
  const daysRemaining = getDaysRemaining(tender.deadline);
  const isUrgent = daysRemaining <= 7;

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="mb-2 leading-snug">{tender.title}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
              <Building2 className="w-4 h-4" />
              <span>{tender.procuringEntity}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4" />
              <span>Deadline: {formatDate(tender.deadline)}</span>
              {isUrgent && (
                <Badge variant="destructive" className="ml-2">
                  <Clock className="w-3 h-3 mr-1" />
                  {daysRemaining} days left
                </Badge>
              )}
            </div>
          </div>
          <Badge variant={tender.category === 'government' ? 'default' : 'secondary'}>
            {tender.category === 'government' ? 'Government' : 'Private'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{tender.industry}</Badge>
            <Badge variant="outline" className="capitalize bg-blue-50 text-blue-700 border-blue-200">
              {tender.subCategory}
            </Badge>
            {tender.bidBondRequired && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <AlertCircle className="w-3 h-3 mr-1" />
                Bid Bond Required
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-600 line-clamp-2">{tender.summary}</p>
          <div className="flex justify-between items-center pt-2">
            <span className="text-sm text-slate-500">Tender No: {tender.tenderNumber}</span>
            <Button onClick={() => navigate(`/tender/${tender.id}`)}>View Details</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
