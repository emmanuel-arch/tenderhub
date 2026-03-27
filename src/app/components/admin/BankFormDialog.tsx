import { X, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Bank } from '../../data/mockData';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingBank: Bank | null;
  formData: Partial<Bank>;
  onFormChange: (data: Partial<Bank>) => void;
  onSave: () => void;
}

export function BankFormDialog({ open, onOpenChange, editingBank, formData, onFormChange, onSave }: Props) {
  const set = (field: keyof Bank, value: unknown) => onFormChange({ ...formData, [field]: value });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingBank ? 'Edit Bank' : 'Add New Bank'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Bank Name *</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g., KCB Bank Kenya"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Logo URL</Label>
            <Input
              id="logo"
              value={formData.logo || ''}
              onChange={(e) => set('logo', e.target.value)}
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="processingTime">Processing Time *</Label>
              <Input
                id="processingTime"
                value={formData.processingTime || ''}
                onChange={(e) => set('processingTime', e.target.value)}
                placeholder="e.g., 2-3 business days"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rating">Rating (0–5)</Label>
              <Input
                id="rating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={formData.rating || 4.0}
                onChange={(e) => set('rating', parseFloat(e.target.value) || 4.0)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fees">Processing Fees *</Label>
            <Input
              id="fees"
              value={formData.fees || ''}
              onChange={(e) => set('fees', e.target.value)}
              placeholder="e.g., KES 15,000 + 1.5% of bond value"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="digitalOption">Digital Application</Label>
              <p className="text-sm text-slate-600">Allow customers to apply online without visiting a branch</p>
            </div>
            <Switch
              id="digitalOption"
              checked={formData.digitalOption || false}
              onCheckedChange={(checked) => set('digitalOption', checked)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={onSave}>
            <CheckCircle className="w-4 h-4 mr-2" />
            {editingBank ? 'Update Bank' : 'Add Bank'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
