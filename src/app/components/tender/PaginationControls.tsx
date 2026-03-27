import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';

interface Props {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

export function PaginationControls({ currentPage, totalPages, onPrev, onNext }: Props) {
  return (
    <div className="mt-8 flex items-center justify-between">
      <div className="text-sm text-slate-600">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onPrev} disabled={currentPage === 1}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        <Button variant="outline" onClick={onNext} disabled={currentPage === totalPages}>
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
