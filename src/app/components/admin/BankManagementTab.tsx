import { Plus, Building2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { BankDto } from '../../services/api';
import { BankListItem } from './BankListItem';

interface Props {
  banks: BankDto[];
  onAdd: () => void;
  onEdit: (bank: BankDto) => void;
  onDelete: (id: string) => void;
}

export function BankManagementTab({ banks, onAdd, onEdit, onDelete }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Bank Management</CardTitle>
          <Button onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Bank
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {banks.map(bank => (
            <BankListItem key={bank.id} bank={bank} onEdit={onEdit} onDelete={onDelete} />
          ))}

          {banks.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <h3 className="font-semibold mb-2">No Banks Added</h3>
              <p className="text-slate-600 mb-4">Start by adding your first bank to the system.</p>
              <Button onClick={onAdd}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Bank
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
