import { Bookmark, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import type { SavedTender } from '../../hooks/useSavedTenders';

interface Props {
  saved: SavedTender[];
  onView: (id: string, tender: SavedTender) => void;
  onRemove: (id: string) => void;
  onBrowse: () => void;
}

export function SavedTendersTab({ saved, onView, onRemove, onBrowse }: Props) {
  if (saved.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Bookmark className="w-12 h-12 mx-auto text-slate-400 mb-4" />
          <h3 className="font-semibold mb-2">No Saved Tenders</h3>
          <p className="text-slate-600 mb-4">Bookmark tenders from the listing to save them here.</p>
          <Button onClick={onBrowse}>Browse Tenders</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {saved.map((tender: SavedTender) => (
        <Card key={tender.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base leading-snug line-clamp-2">{tender.title}</CardTitle>
                {tender.procuringEntity && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span className="truncate">{tender.procuringEntity}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => onRemove(tender.id)}
                title="Remove from saved"
                className="text-slate-400 hover:text-red-500 transition-colors shrink-0"
              >
                <Bookmark className="w-5 h-5 fill-blue-900 text-blue-900" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-3">
              {tender.tenderNumber && <span>No: {tender.tenderNumber}</span>}
              {tender.deadline && (
                <span>Deadline: {new Date(tender.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              )}
              {tender.subCategory && (
                <Badge variant="outline" className="text-xs capitalize">{tender.subCategory}</Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => onView(tender.id, tender)}>View Details</Button>
              <Button size="sm" variant="outline" onClick={() => onRemove(tender.id)}>Remove</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
