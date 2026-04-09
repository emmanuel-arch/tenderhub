import { Edit, Trash2, Clock, DollarSign, Star, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { BankDto } from '../../services/api';
import { ImageWithFallback } from '../ImageWithFallback';

interface Props {
  bank: BankDto;
  onEdit: (bank: BankDto) => void;
  onDelete: (id: string) => void;
  onToggleActive: (bank: BankDto) => void;
}

export function BankListItem({ bank, onEdit, onDelete, onToggleActive }: Props) {
  return (
    <div className={`border rounded-lg p-4 transition-colors ${bank.isActive ? 'hover:bg-slate-50' : 'bg-slate-50 opacity-70'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
            <ImageWithFallback
              src={bank.logo}
              alt={`${bank.name} logo`}
              className="w-full h-full object-cover"
              width={64}
              height={64}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-lg">{bank.name}</h3>
              <Badge variant="secondary" className="bg-green-100 text-green-950 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Digital
              </Badge>
              <Badge variant="outline" className={bank.isActive ? 'text-green-800 border-green-300 bg-green-50' : 'text-slate-500'}>
                {bank.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-medium">{bank.rating}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span><strong>Processing:</strong> {bank.processingTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span><strong>Fees:</strong> {bank.fees}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{bank.isActive ? 'Active' : 'Inactive'}</span>
            <Switch
              checked={bank.isActive}
              onCheckedChange={() => onToggleActive(bank)}
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => onEdit(bank)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDelete(bank.id)}>
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      </div>
    </div>
  );
}
