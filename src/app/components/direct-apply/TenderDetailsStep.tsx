import { Input } from '../ui/input';
import { Label } from '../ui/label';
import type { TenderInfo } from './steps';

interface Props {
  info: TenderInfo;
  onChange: (field: keyof TenderInfo, value: string) => void;
  errors: Record<string, string> | null;
}

export function TenderDetailsStep({ info, onChange, errors }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2 space-y-1.5">
        <Label>Tender Title <span className="text-red-500">*</span></Label>
        <Input
          value={info.title}
          onChange={e => onChange('title', e.target.value)}
          placeholder="e.g. Supply of Office Equipment"
        />
        {errors?.title && <p className="text-xs text-red-600">{errors.title}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Tender Number</Label>
        <Input
          value={info.tenderNumber}
          onChange={e => onChange('tenderNumber', e.target.value)}
          placeholder="e.g. KRA/HQ/001/2024"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Procuring Entity</Label>
        <Input
          value={info.procuringEntity}
          onChange={e => onChange('procuringEntity', e.target.value)}
          placeholder="e.g. Kenya Revenue Authority"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Deadline</Label>
        <Input
          type="date"
          value={info.deadline}
          onChange={e => onChange('deadline', e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Bid Bond Amount (KES) <span className="text-red-500">*</span></Label>
        <Input
          type="number"
          min={0}
          value={info.bidBondAmount}
          onChange={e => onChange('bidBondAmount', e.target.value)}
          placeholder="e.g. 500000"
        />
        {errors?.bidBondAmount && <p className="text-xs text-red-600">{errors.bidBondAmount}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Category</Label>
        <select
          value={info.category}
          onChange={e => onChange('category', e.target.value)}
          className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="Government">Government</option>
          <option value="Private">Private</option>
        </select>
      </div>
    </div>
  );
}
