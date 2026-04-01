const BASE_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

export function getToken(): string | null {
  return localStorage.getItem('auth_token');
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
    const body = await res.json().catch(() => ({}));
    const message = body.message
      ?? body.title
      ?? (body.errors ? Object.values(body.errors).flat().join('; ') : null)
      ?? `Request failed: ${res.status}`;
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
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
  list: () => request<BankDto[]>('/api/banks'),
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
  create: (data: CreateApplicationDto) =>
    request<ApplicationDto>('/api/applications', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: string, data: UpdateStatusDto) =>
    request<ApplicationDto>(`/api/applications/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
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
}

export interface CreateBankDto {
  name: string;
  logo: string;
  processingTime: string;
  fees: string;
  digitalOption: boolean;
  rating: number;
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
