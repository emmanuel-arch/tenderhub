const BASE_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

export function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

export class ApiError extends Error {
  constructor(message: string, public readonly errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
  }
}

async function parseJsonResponse<T>(res: Response): Promise<T | undefined> {
  const text = await res.text();
  if (!text.trim()) return undefined;
  return JSON.parse(text) as T;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await parseJsonResponse<Record<string, unknown>>(res).catch(() => ({})) ?? {};
    const errors = body.errors && typeof body.errors === 'object'
      ? body.errors as Record<string, string[]>
      : undefined;
    const message = body.message
      ?? body.title
      ?? (errors ? Object.values(errors).flat().join('; ') : null)
      ?? `Request failed: ${res.status}`;
    throw new ApiError(message, errors);
  }

  if (res.status === 204) return undefined as T;
  return await parseJsonResponse<T>(res) as T;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (name: string, email: string, password: string, adminCode?: string) =>
    request<LoginResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, adminCode }),
    }),
};

// ── Banks ─────────────────────────────────────────────────────────────────────

export const banksApi = {
  list: (params?: { includeInactive?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.includeInactive) qs.set('includeInactive', 'true');
    const query = qs.toString() ? `?${qs}` : '';
    return request<BankDto[]>(`/api/banks${query}`);
  },
  getById: (id: string) => request<BankDto>(`/api/banks/${id}`),
  create: (data: CreateBankDto) =>
    request<BankDto>('/api/banks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CreateBankDto> & { isActive?: boolean }) =>
    request<BankDto>(`/api/banks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/api/banks/${id}`, { method: 'DELETE' }),
};

// ── Tenders ───────────────────────────────────────────────────────────────────

export const tendersApi = {
  list: (params?: TenderListParams) => {
    const qs = new URLSearchParams();
    if (params?.externalId) qs.set('externalId', params.externalId);
    if (params?.page)       qs.set('page', params.page.toString());
    if (params?.pageSize)   qs.set('pageSize', params.pageSize.toString());
    if (params?.search)     qs.set('search', params.search);
    if (params?.category)   qs.set('category', params.category);
    const query = qs.toString() ? `?${qs}` : '';
    return request<PagedResult<TenderDto>>(`/api/tenders${query}`);
  },
  create: (data: CreateTenderDto) =>
    request<TenderDto>('/api/tenders', { method: 'POST', body: JSON.stringify(data) }),
};

// ── Applications ──────────────────────────────────────────────────────────────

export const applicationsApi = {
  list: (page = 1) =>
    request<PagedResult<ApplicationDto>>(`/api/applications?page=${page}`),
  getById: (id: string) =>
    request<ApplicationDto>(`/api/applications/${id}`),
  validateStep: (step: 1 | 2, data: Record<string, unknown>) =>
    request<void>(`/api/applications/validate/step${step}`, { method: 'POST', body: JSON.stringify(data) }),
  create: (data: CreateApplicationDto) =>
    request<ApplicationDto>('/api/applications', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: string, data: UpdateStatusDto) =>
    request<ApplicationDto>(`/api/applications/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ── Documents ─────────────────────────────────────────────────────────────────

export const documentsApi = {
  upload: async (applicationId: string, file: File, documentName: string): Promise<DocumentDto> => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentName', documentName);

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}/api/applications/${applicationId}/documents`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const body = await parseJsonResponse<Record<string, unknown>>(res).catch(() => ({})) ?? {};
      const message = body.message ?? `Document upload failed: ${res.status}`;
      throw new Error(message);
    }

    return await parseJsonResponse<DocumentDto>(res) as DocumentDto;
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresAt: string;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface BankDto {
  id: string;
  name: string;
  logo: string;
  processingTime: string;
  fees: string;
  digitalOption: boolean;
  rating: number;
  isActive: boolean;
  institutionType: 'Bank' | 'Microfinance';
}

export interface CreateBankDto {
  name: string;
  logo: string;
  processingTime: string;
  fees: string;
  digitalOption: boolean;
  rating: number;
  institutionType: 'Bank' | 'Microfinance';
}

export interface TenderDto {
  id: string;
  externalId: string;
  title: string;
  tenderNumber: string;
  procuringEntity: string;
  deadline: string;
  industry: string;
  bidBondRequired: boolean;
  bidBondAmount: number;
  category: string;
  subCategory: string;
  summary: string;
  description: string;
  documentUrl: string;
  requiredDocuments: string[];
  createdAt: string;
}

export interface CreateTenderDto {
  externalId: string;
  title: string;
  tenderNumber: string;
  procuringEntity: string;
  deadline: string;
  industry: string;
  bidBondRequired: boolean;
  bidBondAmount: number;
  category: string;
  subCategory: string;
  summary: string;
  description: string;
  documentUrl: string;
  requiredDocuments: string[];
}

export interface TenderListParams {
  externalId?: string;
  page?: number;
  pageSize?: number;
  category?: string;
  subCategory?: string;
  search?: string;
}

export interface ApplicationDto {
  id: string;
  userId: string;
  tenderId: string;
  bankId: string;
  tenderTitle: string;
  tenderNumber: string;
  bankName: string;
  bankInstitutionType?: 'Bank' | 'Microfinance';
  status: string;
  rejectionReason?: string;
  documentUrl?: string;
  bondAmount?: number;
  companyName: string;
  businessRegistrationNumber: string;
  contactPerson: string;
  phoneNumber: string;
  contactEmail: string;
  physicalAddress: string;
  annualRevenue?: number;
  companyNetWorth?: number;
  bankAccountNumber?: string;
  submittedAt: string;
  approvedAt?: string;
  documents: DocumentDto[];
  statusHistory: StatusHistoryDto[];
}

export interface CreateApplicationDto {
  tenderId: string;
  bankId: string;
  companyName: string;
  businessRegistrationNumber: string;
  contactPerson: string;
  phoneNumber: string;
  contactEmail: string;
  physicalAddress: string;
  annualRevenue?: number;
  companyNetWorth?: number;
  bankAccountNumber?: string;
}

export interface UpdateStatusDto {
  status: string;
  notes?: string;
  rejectionReason?: string;
  documentUrl?: string;
}

export interface DocumentDto {
  id: string;
  name: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  uploadedAt: string;
}

export interface StatusHistoryDto {
  id: string;
  status: string;
  notes: string;
  changedAt: string;
}

export interface PagedResult<T> {
  data: T[];
  currentPage: number;
  pageSize: number;
  totalCount: number;
}

// ── Scraped Tenders ───────────────────────────────────────────────────────────

export interface TenderDocumentDetailDto {
  id: string;
  tenderId: string;
  bidBondAmount?: string;
  bidBondForm?: string;
  bidBondValidity?: string;
  bidValidityPeriod?: string;
  submissionDeadline?: string;
  submissionMethod?: string;
  preBidMeetingDate?: string;
  preBidMeetingLink?: string;
  clarificationDeadline?: string;
  mandatorySiteVisit: boolean;
  numberOfBidCopies?: string;
  minAnnualTurnover?: string;
  minLiquidAssets?: string;
  minSingleContractValue?: string;
  minCombinedContractValue?: string;
  cashFlowRequirement?: string;
  auditedFinancialsYears?: string;
  keyPersonnel?: string;
  keyEquipment?: string;
  keyRequirementsRaw?: string;
  financialQualificationsRaw?: string;
  keyPersonnelRaw?: string;
  keyEquipmentRaw?: string;
  documentParsed: boolean;
  parseError?: string;
}

export interface ScrapedTenderDto {
  id: string;
  source: string;
  externalId?: string;
  title: string;
  tenderNumber?: string;
  procuringEntity?: string;
  deadline?: string;
  category: string;
  subCategory?: string;
  summary?: string;
  description?: string;
  documentUrl?: string;
  tenderNoticeUrl?: string;
  bidBondRequired: boolean;
  bidBondAmount: number;
  tenderFee?: number;
  documentReleaseDate?: string;
  procurementMethod?: string;
  submissionMethodName?: string;
  bidValidityDays?: number;
  venue?: string;
  peEmail?: string;
  pePhone?: string;
  peAddress?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  documentDetails?: TenderDocumentDetailDto;
}

export interface ScrapedTenderListParams {
  page?: number;
  pageSize?: number;
  source?: string;
  search?: string;
  category?: string;
  subCategory?: string;
  procurementMethod?: string;
}

export const scrapedTendersApi = {
  list: (params?: ScrapedTenderListParams) => {
    const qs = new URLSearchParams();
    if (params?.page)              qs.set('page', params.page.toString());
    if (params?.pageSize)          qs.set('pageSize', params.pageSize.toString());
    if (params?.source)            qs.set('source', params.source);
    if (params?.search)            qs.set('search', params.search);
    if (params?.category)          qs.set('category', params.category);
    if (params?.subCategory)       qs.set('subCategory', params.subCategory);
    if (params?.procurementMethod) qs.set('procurementMethod', params.procurementMethod);
    const query = qs.toString() ? `?${qs}` : '';
    return request<PagedResult<ScrapedTenderDto>>(`/api/tenderlisting${query}`);
  },
  getById: (id: string) =>
    request<ScrapedTenderDto>(`/api/tenderlisting/${id}`),
  getSources: () =>
    request<string[]>('/api/tenderlisting/sources'),
};
