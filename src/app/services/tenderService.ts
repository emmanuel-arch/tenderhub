import { Tender } from '../data/mockData';

interface TenderAPIResponse {
  current_page: number;
  data: TenderAPIItem[];
  last_page: number;
  per_page: number;
  total: number;
}

interface TenderAPIItem {
  id: number;
  title: string;
  tender_ref: string;
  pe: {
    name: string;
  };
  close_at: string;
  procurement_category: {
    title: string;
    code: string;
  };
  bid_security_value: number | null;
  description: string | null;
  published_at: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1000;

type TenderPageResult = {
  tenders: Tender[];
  totalPages: number;
  total: number;
  currentPage: number;
};

type CachedPage = {
  expires: number;
  value: TenderPageResult;
};

const tenderPageCache = new Map<number, CachedPage>();
let allTendersCache: { expires: number; tenders: Tender[] } | null = null;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url: string, options: RequestInit = {}): Promise<Response> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        if (attempt === MAX_RETRIES) {
          throw new Error('Rate limited while fetching tenders.');
        }

        const retryAfterHeader = response.headers.get('Retry-After');
        const retryAfterSeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : NaN;
        const waitMs = Number.isNaN(retryAfterSeconds)
          ? BASE_BACKOFF_MS * (attempt + 1)
          : retryAfterSeconds * 1000;

        await delay(waitMs);
        continue;
      }

      return response;
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        throw error;
      }

      await delay(BASE_BACKOFF_MS * (attempt + 1));
    }
  }

  throw new Error('Exceeded retry attempts while fetching tenders.');
}

/**
 * Maps API tender data to internal Tender format
 */
function mapAPITenderToTender(apiTender: TenderAPIItem): Tender {
  // Map procurement category to our subcategory
  const categoryMap: Record<string, 'goods' | 'services' | 'consultancy' | 'works'> = {
    'goods': 'goods',
    'services': 'services',
    'consultancy': 'consultancy',
    'works': 'works'
  };

  const subCategory = categoryMap[apiTender.procurement_category?.code?.toLowerCase()] || 'goods';

  // Extract industry from procuring entity or category
  const industry = apiTender.procurement_category?.title || 'General';

  return {
    id: apiTender.id.toString(),
    title: apiTender.title,
    tenderNumber: apiTender.tender_ref || `TENDER-${apiTender.id}`,
    procuringEntity: apiTender.pe?.name || 'Unknown Entity',
    deadline: apiTender.close_at || new Date().toISOString(),
    industry: industry,
    bidBondRequired: apiTender.bid_security_value !== null && apiTender.bid_security_value > 0,
    bidBondAmount: apiTender.bid_security_value || 0,
    category: 'government', // All tenders from this API are government tenders
    subCategory: subCategory,
    summary: apiTender.description || apiTender.title,
    description: apiTender.description || `Tender for ${apiTender.title}. Please refer to the tender documents for detailed information.`,
    documentUrl: `https://tenders.go.ke/tenders/${apiTender.id}`,
    requiredDocuments: ['Tax Compliance Certificate', 'Company CR12', 'Directors Details', 'Account Indemnity']
  };
}

/**
 * Fetches active tenders from the Kenyan government API
 */
export async function fetchActiveTenders(page: number = 1): Promise<TenderPageResult> {
  const cached = tenderPageCache.get(page);
  if (cached && cached.expires > Date.now()) {
    return cached.value;
  }

  const response = await fetchWithRetry(`https://tenders.go.ke/api/active-tenders?page=${page}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch tenders: ${response.statusText}`);
  }

  const data: TenderAPIResponse = await response.json();
  const tenders = data.data.map(mapAPITenderToTender);

  const result: TenderPageResult = {
    tenders,
    totalPages: data.last_page || 1,
    total: data.total,
    currentPage: data.current_page
  };

  tenderPageCache.set(page, {
    expires: Date.now() + CACHE_TTL_MS,
    value: result
  });

  return result;
}

/**
 * Fetches all active tenders (multiple pages) from the Kenyan government API
 * Warning: This fetches all pages which may take some time
 */
export async function fetchAllActiveTenders(): Promise<Tender[]> {
  if (allTendersCache && allTendersCache.expires > Date.now()) {
    return allTendersCache.tenders;
  }

  const firstPage = await fetchActiveTenders(1);
  const collectedTenders = [...firstPage.tenders];

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const pageData = await fetchActiveTenders(page);
    collectedTenders.push(...pageData.tenders);
  }

  allTendersCache = {
    tenders: collectedTenders,
    expires: Date.now() + CACHE_TTL_MS
  };

  return collectedTenders;
}

/**
 * Fetches a single tender by ID
 */
export async function fetchTenderById(id: string): Promise<Tender | null> {
  const firstPage = await fetchActiveTenders(1);
  let foundTender = firstPage.tenders.find(t => t.id === id);

  if (foundTender) {
    return foundTender;
  }

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const pageResult = await fetchActiveTenders(page);
    foundTender = pageResult.tenders.find(t => t.id === id);
    if (foundTender) {
      return foundTender;
    }
  }

  return null;
}
