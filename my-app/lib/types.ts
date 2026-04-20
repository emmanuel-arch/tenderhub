export type TenderCategory = "Government" | "Private";

export type TenderSubCategory =
  | "Goods"
  | "Works"
  | "Services"
  | "Consultancy"
  | "Other";

export interface Tender {
  id: string;
  source: string | null;
  externalId: string | null;
  title: string;
  tenderNumber: string | null;
  procuringEntity: string | null;
  deadline: string | null;
  category: TenderCategory;
  subCategory: TenderSubCategory;
  rawSubCategory: string | null;
  summary: string | null;
  description: string | null;
  documentUrl: string | null;
  tenderNoticeUrl: string | null;
  bidBondRequired: boolean;
  bidBondAmount: number;
  documentReleaseDate: string | null;
  procurementMethod: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  hasDocumentDetails: boolean;
  completenessScore: number;
}

export interface TenderDocumentDetail {
  tenderId: string;
  bidBondAmount: string | null;
  bidBondForm: string | null;
  bidBondValidity: string | null;
  bidValidityPeriod: string | null;
  submissionDeadline: string | null;
  submissionMethod: string | null;
  preBidMeetingDate: string | null;
  preBidMeetingLink: string | null;
  clarificationDeadline: string | null;
  mandatorySiteVisit: boolean;
  numberOfBidCopies: string | null;
  minAnnualTurnover: string | null;
  minLiquidAssets: string | null;
  minSingleContractValue: string | null;
  minCombinedContractValue: string | null;
  cashFlowRequirement: string | null;
  auditedFinancialsYears: string | null;
  keyPersonnel: string | null;
  keyEquipment: string | null;
  keyRequirementsRaw: string | null;
  financialQualificationsRaw: string | null;
  documentParsed: boolean;
  parsedDocumentUrl: string | null;
  parseError: string | null;
}

export interface TenderWithDetails {
  tender: Tender;
  details: TenderDocumentDetail | null;
}

export interface PagedResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type InstitutionType = "Bank" | "Microfinance" | "Insurance";

export interface BankProvider {
  id: string;
  name: string;
  shortName: string;
  logoText: string;
  /** Primary brand colour (hex). Used for accent bar + button. */
  accent: string;
  /** Secondary brand colour for gradients. */
  accentSecondary: string;
  /** Path to the bank logomark inside /public/banks/ (e.g. "/banks/kcb-logo.png"). */
  logoSrc: string;
  /** Path to a wide brand backdrop (e.g. "/banks/kcb-backdrop.jpg"). */
  backdropSrc: string;
  /** Tailwind classes for the glass surface in light + dark mode. */
  glassClass: string;
  institutionType: InstitutionType;
  processingTime: string;
  feesLabel: string;
  feesPercent: number;
  digitalOption: boolean;
  rating: number;
  description: string;
}

export interface ApplicationRecord {
  id: string;
  tenderId: string;
  tenderTitle: string;
  tenderNumber: string | null;
  bankId: string;
  bankName: string;
  bondAmount: number;
  status: "submitted" | "under-review" | "approved" | "rejected";
  companyName: string;
  registrationNumber: string;
  kraPin: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  annualRevenue: string;
  netWorth: string;
  documents: { name: string; fileName: string; sizeBytes: number }[];
  submittedAt: string;
  statusHistory: { status: string; at: string; note?: string }[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

export interface TenderListFilters {
  page?: number;
  pageSize?: number;
  category?: TenderCategory | "All";
  subCategory?: TenderSubCategory | "All";
  search?: string;
  onlyComplete?: boolean;
  requireBidBond?: boolean;
}
