import { ProviderCards } from '../provider/ProviderCards';
import type { BankDto } from '../../services/api';

interface Props {
  banks: BankDto[];
  selectedId: string | null;
  onSelect: (bank: BankDto) => void;
  loading: boolean;
}

export function BankSelectStep({ banks, selectedId, onSelect, loading }: Props) {
  return (
    <ProviderCards
      banks={banks}
      loading={loading}
      selectedId={selectedId}
      onSelect={onSelect}
    />
  );
}
