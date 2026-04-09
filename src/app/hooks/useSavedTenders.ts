import { useState, useCallback } from 'react';
import type { ScrapedTenderDto } from '../services/api';

const STORAGE_KEY = 'saved_tenders';

export type SavedTender = Pick<
  ScrapedTenderDto,
  'id' | 'title' | 'procuringEntity' | 'deadline' | 'category' | 'subCategory' | 'tenderNumber' | 'bidBondRequired' | 'bidBondAmount' | 'procurementMethod' | 'tenderNoticeUrl' | 'documentUrl' | 'summary' | 'source'
> & { savedAt: string };

function load(): SavedTender[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function save(tenders: SavedTender[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tenders));
}

export function useSavedTenders() {
  const [saved, setSaved] = useState<SavedTender[]>(load);

  const isSaved = useCallback((id: string) => saved.some(t => t.id === id), [saved]);

  const toggle = useCallback((tender: ScrapedTenderDto) => {
    setSaved(prev => {
      const exists = prev.some(t => t.id === tender.id);
      const next = exists
        ? prev.filter(t => t.id !== tender.id)
        : [...prev, { ...tender, savedAt: new Date().toISOString() }];
      save(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setSaved(prev => {
      const next = prev.filter(t => t.id !== id);
      save(next);
      return next;
    });
  }, []);

  return { saved, isSaved, toggle, remove };
}
