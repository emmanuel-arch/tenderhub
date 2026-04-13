import { useState } from 'react';
import { Building2, Landmark, ShieldCheck, Clock, DollarSign, Zap, Star, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { ImageWithFallback } from '../ImageWithFallback';
import type { BankDto } from '../../services/api';

type ProviderType = 'microfinance' | 'banks' | 'insurance';

interface Props {
  banks: BankDto[];
  loading?: boolean;
  selectedId?: string | null;   // pass to highlight selected card (DirectApply)
  onSelect: (bank: BankDto) => void;
}

const TOGGLE_ITEMS: { value: ProviderType; label: string; icon: typeof Building2 }[] = [
  { value: 'insurance',    label: 'Insurance',                 icon: ShieldCheck },
  { value: 'microfinance', label: 'Microfinance Institutions', icon: Building2 },
  { value: 'banks',        label: 'Banks',                     icon: Landmark },
];

const DESCRIPTIONS: Record<ProviderType, string> = {
  microfinance: 'Microfinance institutions offer faster processing and flexible terms for bid bonds.',
  banks:        'Commercial banks provide bid bonds with established processes and digital options.',
  insurance:    'Insurance companies provide bid bond guarantees as surety bonds.',
};

function EmptyProviders({ type }: { type: ProviderType }) {
  const Icon = TOGGLE_ITEMS.find(t => t.value === type)!.icon;
  const labels: Record<ProviderType, string> = {
    microfinance: 'No microfinance institutions available.',
    banks:        'No banks are currently available.',
    insurance:    'No insurance providers available.',
  };
  return (
    <Card className="shadow-md border-0">
      <CardContent className="py-16 text-center">
        <Icon className="w-12 h-12 mx-auto text-slate-400 mb-3" />
        <p className="text-slate-500 font-medium">{labels[type]}</p>
        <p className="text-slate-400 text-sm mt-1">Please contact admin to add providers.</p>
      </CardContent>
    </Card>
  );
}

interface CardItemProps {
  bank: BankDto;
  selected: boolean;
  onSelect: (bank: BankDto) => void;
  isMfi?: boolean;
  isInsurance?: boolean;
}

function ProviderCard({ bank, selected, onSelect, isMfi, isInsurance }: CardItemProps) {
  const logoSize = isMfi || isInsurance ? 48 : 64;
  const logoBg   = isMfi ? 'bg-green-50 border-green-100' : isInsurance ? 'bg-blue-50 border-blue-100' : 'bg-slate-50';
  const badgeCls  = isInsurance ? 'bg-blue-100 text-blue-950 border-blue-200' : 'bg-green-100 text-green-950 border-green-200';
  const btnCls    = selected
    ? (isMfi ? 'bg-blue-900 hover:bg-blue-800' : 'bg-green-900 hover:bg-green-950')
    : (isMfi ? 'bg-green-900 hover:bg-green-950' : 'bg-blue-900 hover:bg-blue-800');
  const feesLabel = isInsurance ? 'Premium' : isMfi ? 'Fees' : 'Processing Fees';
  const selectLabel = selected
    ? 'Selected ✓'
    : isMfi
      ? `Select ${bank.name.split(' ').slice(0, 2).join(' ')}`
      : `Select ${bank.name}`;

  return (
    <Card className={`shadow-md border-0 hover:shadow-xl transition-all duration-300 overflow-hidden ${selected ? 'ring-2 ring-blue-900' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className={`${isMfi || isInsurance ? 'w-12 h-12' : 'w-16 h-16'} rounded-xl flex items-center justify-center border overflow-hidden ${logoBg}`}>
            <ImageWithFallback
              src={bank.logo}
              alt={`${bank.name} logo`}
              className="w-full h-full object-cover"
              width={logoSize}
              height={logoSize}
            />
          </div>
          <Badge className={badgeCls}>
            <Zap className="w-3 h-3 mr-1" />Digital
          </Badge>
        </div>
        <CardTitle className={isMfi || isInsurance ? 'text-base leading-snug' : 'text-lg'}>{bank.name}</CardTitle>
        <div className="flex items-center gap-1 mt-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`w-4 h-4 ${i < Math.floor(bank.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
          ))}
          <span className="text-sm text-slate-500 ml-1.5">({bank.rating})</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-slate-50 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock className="w-4 h-4" />Processing Time
            </div>
            <div className="font-semibold text-sm text-slate-900">{bank.processingTime}</div>
          </div>
          <Separator />
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <DollarSign className="w-4 h-4" />{feesLabel}
            </div>
            <div className="font-semibold text-sm text-slate-900 text-right max-w-[140px]">{bank.fees}</div>
          </div>
        </div>
        <Button className={`w-full shadow-md ${btnCls}`} size="lg" onClick={() => onSelect(bank)}>
          {selectLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

export function ProviderCards({ banks, loading, selectedId, onSelect }: Props) {
  const [providerType, setProviderType] = useState<ProviderType>('insurance');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-900 mr-3" />
        <span className="text-slate-600">Loading providers…</span>
      </div>
    );
  }

  const mfis     = banks.filter(b => b.institutionType === 'Microfinance');
  const comBanks = banks.filter(b => b.institutionType === 'Bank');
  const insurers = banks.filter(b => b.institutionType === 'Insurance');

  const currentList = providerType === 'microfinance' ? mfis : providerType === 'banks' ? comBanks : insurers;

  return (
    <div>
      {/* Toggle */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {TOGGLE_ITEMS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setProviderType(value)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all border ${
              providerType === value
                ? 'bg-blue-900 text-white border-blue-900 shadow-md'
                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-900'
            }`}
          >
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      <p className="text-slate-500 text-sm mb-6">{DESCRIPTIONS[providerType]}</p>

      {currentList.length === 0 ? (
        <EmptyProviders type={providerType} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentList.map(bank => (
            <ProviderCard
              key={bank.id}
              bank={bank}
              selected={selectedId === bank.id}
              onSelect={onSelect}
              isMfi={providerType === 'microfinance'}
              isInsurance={providerType === 'insurance'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
