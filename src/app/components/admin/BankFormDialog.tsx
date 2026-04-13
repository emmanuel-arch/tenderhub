import { X, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { BankDto, CreateBankDto } from '../../services/api';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingBank: BankDto | null;
  formData: Partial<CreateBankDto>;
  onFormChange: (data: Partial<CreateBankDto>) => void;
  onSave: () => void;
  saving?: boolean;
}

export function BankFormDialog({ open, onOpenChange, editingBank, formData, onFormChange, onSave, saving }: Props) {
  const set = (field: keyof CreateBankDto, value: unknown) =>
    onFormChange({ ...formData, [field]: value });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingBank ? 'Edit Institution' : 'Add Institution'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Institution Name *</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g., KCB Bank Kenya"
            />
          </div>

          <div className="space-y-2">
            <Label>Institution Type *</Label>
            <Select
              value={formData.institutionType ?? 'Bank'}
              onValueChange={v => set('institutionType', v as 'Bank' | 'Microfinance' | 'Insurance')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bank">Bank</SelectItem>
                <SelectItem value="Microfinance">Microfinance</SelectItem>
                <SelectItem value="Insurance">Insurance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="processingTime">Processing Time *</Label>
            <Input
              id="processingTime"
              value={formData.processingTime || ''}
              onChange={(e) => set('processingTime', e.target.value)}
              placeholder="e.g., 2-3 business days"
              list="processing-time-suggestions"
            />
            <datalist id="processing-time-suggestions">
              <option value="1 business day" />
              <option value="2 business days" />
              <option value="3 business days" />
              <option value="1-2 business days" />
              <option value="2-3 business days" />
              <option value="3-5 business days" />
              <option value="5-7 business days" />
              <option value="Same day" />
            </datalist>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fees">Processing Fees *</Label>
            <Input
              id="fees"
              value={formData.fees || ''}
              onChange={(e) => set('fees', e.target.value)}
              placeholder="e.g., KES 15,000 + 1.5% of bond value"
              list="fees-suggestions"
            />
            <datalist id="fees-suggestions">
              <option value="1% of bond value" />
              <option value="1.5% of bond value" />
              <option value="2% of bond value" />
              <option value="KES 5,000 + 1% of bond value" />
              <option value="KES 10,000 + 1.5% of bond value" />
              <option value="KES 15,000 + 1.5% of bond value" />
              <option value="KES 20,000 + 2% of bond value" />
            </datalist>
          </div>

          <Separator />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving}>
            <CheckCircle className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : editingBank ? 'Update' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
