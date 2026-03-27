export interface Tender {
  id: string;
  title: string;
  tenderNumber: string;
  procuringEntity: string;
  deadline: string;
  industry: string;
  bidBondRequired: boolean;
  bidBondAmount: number;
  category: 'government' | 'private';
  subCategory: 'goods' | 'services' | 'consultancy' | 'works';
  summary: string;
  description: string;
  documentUrl: string;
  requiredDocuments?: string[];
}

export interface Bank {
  id: string;
  name: string;
  logo: string;
  processingTime: string;
  fees: string;
  digitalOption: boolean;
  rating: number;
}

export interface Application {
  id: string;
  userId: string;
  tenderId: string;
  tenderTitle: string;
  tenderNumber: string;
  status: 'pending' | 'approved' | 'rejected' | 'submitted';
  submittedDate: string;
  bankName?: string;
  bondAmount?: number;
  approvalDate?: string;
  documentUrl?: string;
  rejectionReason?: string;
  statusHistory?: StatusUpdate[];
  uploadedDocuments?: UploadedDocument[];
}

export interface UploadedDocument {
  name: string;
  type: string;
  uploadedAt: string;
  fileUrl?: string;
}

export interface StatusUpdate {
  status: string;
  date: string;
  notes: string;
}

export const tenders: Tender[] = [
  {
    id: '1',
    title: 'Supply and Delivery of Medical Equipment to Kenyatta National Hospital',
    tenderNumber: 'KNH/PROC/2026/001',
    procuringEntity: 'Kenyatta National Hospital',
    deadline: '2026-03-15',
    industry: 'Healthcare',
    bidBondRequired: true,
    bidBondAmount: 2500000,
    category: 'government',
    subCategory: 'goods',
    summary: 'Supply and delivery of modern medical equipment including MRI machines, CT scanners, and ICU ventilators.',
    description: 'The Kenyatta National Hospital invites sealed bids from eligible and qualified suppliers for the supply and delivery of medical equipment. The equipment must meet international standards and include warranty and maintenance services.',
    documentUrl: '#',
    requiredDocuments: ['Tax Compliance Certificate', 'Company CR12', 'Directors Details', 'Account Indemnity', 'Audited Financial Statements']
  },
  {
    id: '2',
    title: 'Construction of Nairobi-Nakuru Highway Bypass',
    tenderNumber: 'KENHA/ROADS/2026/045',
    procuringEntity: 'Kenya National Highways Authority (KeNHA)',
    deadline: '2026-03-20',
    industry: 'Infrastructure',
    bidBondRequired: true,
    bidBondAmount: 5000000,
    category: 'government',
    subCategory: 'works',
    summary: 'Construction of 45km highway bypass with modern drainage systems and pedestrian walkways.',
    description: 'KeNHA seeks qualified contractors to construct a modern highway bypass connecting Nairobi to Nakuru. The project includes road construction, drainage, lighting, and landscaping.',
    documentUrl: '#',
    requiredDocuments: ['Tax Compliance Certificate', 'Company CR12', 'Directors Details', 'NCA Certificate', 'Audited Financial Statements', 'Account Indemnity']
  },
  {
    id: '3',
    title: 'IT Infrastructure Upgrade for Safaricom PLC',
    tenderNumber: 'SAF/IT/2026/089',
    procuringEntity: 'Safaricom PLC',
    deadline: '2026-03-10',
    industry: 'Technology',
    bidBondRequired: true,
    bidBondAmount: 1500000,
    category: 'private',
    subCategory: 'services',
    summary: 'Upgrade of data center infrastructure including servers, networking equipment, and security systems.',
    description: 'Safaricom PLC invites proposals for upgrading its data center infrastructure to support 5G network expansion and cloud services.',
    documentUrl: '#',
    requiredDocuments: ['Tax Compliance Certificate', 'Company CR12', 'Directors Details', 'Account Indemnity']
  },
  {
    id: '4',
    title: 'Supply of Office Furniture and Equipment',
    tenderNumber: 'NCBA/ADMIN/2026/012',
    procuringEntity: 'NCBA Bank Kenya',
    deadline: '2026-03-25',
    industry: 'Financial Services',
    bidBondRequired: false,
    bidBondAmount: 0,
    category: 'private',
    subCategory: 'goods',
    summary: 'Bulk supply of office furniture and equipment for 15 new branch offices across Kenya.',
    description: 'NCBA Bank seeks suppliers for modern office furniture including desks, chairs, filing cabinets, and related equipment.',
    documentUrl: '#',
    requiredDocuments: ['Tax Compliance Certificate', 'Company CR12']
  },
  {
    id: '5',
    title: 'Procurement of Laptops and Computer Equipment for Schools',
    tenderNumber: 'MOE/ICT/2026/078',
    procuringEntity: 'Ministry of Education',
    deadline: '2026-04-05',
    industry: 'Education',
    bidBondRequired: true,
    bidBondAmount: 3000000,
    category: 'government',
    subCategory: 'goods',
    summary: 'Supply of 10,000 laptops and related computer equipment for digital learning program in public schools.',
    description: 'The Ministry of Education invites bids for supply of laptops, tablets, and computer accessories as part of the Digital Literacy Programme.',
    documentUrl: '#',
    requiredDocuments: ['Tax Compliance Certificate', 'Company CR12', 'Directors Details', 'Account Indemnity', 'Audited Financial Statements']
  },
  {
    id: '6',
    title: 'Construction of Residential Apartments in Karen',
    tenderNumber: 'SURAYA/CONST/2026/023',
    procuringEntity: 'Suraya Property Group',
    deadline: '2026-03-18',
    industry: 'Real Estate',
    bidBondRequired: true,
    bidBondAmount: 4000000,
    category: 'private',
    subCategory: 'works',
    summary: 'Construction of 120-unit luxury residential apartments with amenities including gym, pool, and parking.',
    description: 'Suraya Property Group seeks experienced contractors for construction of high-end residential apartments in Karen, Nairobi.',
    documentUrl: '#',
    requiredDocuments: ['Tax Compliance Certificate', 'Company CR12', 'Directors Details', 'NCA Certificate', 'Account Indemnity']
  },
  {
    id: '7',
    title: 'Supply of Agricultural Equipment and Machinery',
    tenderNumber: 'AFC/AGRI/2026/034',
    procuringEntity: 'Agricultural Finance Corporation',
    deadline: '2026-04-10',
    industry: 'Agriculture',
    bidBondRequired: true,
    bidBondAmount: 1800000,
    category: 'government',
    subCategory: 'goods',
    summary: 'Bulk procurement of tractors, ploughs, harvesters, and irrigation equipment for farmer support program.',
    description: 'AFC invites qualified suppliers to provide modern agricultural machinery to support smallholder farmers across Kenya.',
    documentUrl: '#',
    requiredDocuments: ['Tax Compliance Certificate', 'Company CR12', 'Directors Details', 'Account Indemnity', 'Audited Financial Statements']
  },
  {
    id: '8',
    title: 'Security Systems Installation for Retail Chain',
    tenderNumber: 'NAIVAS/SEC/2026/015',
    procuringEntity: 'Naivas Supermarket',
    deadline: '2026-03-28',
    industry: 'Retail',
    bidBondRequired: false,
    bidBondAmount: 0,
    category: 'private',
    subCategory: 'services',
    summary: 'Installation of CCTV cameras, alarm systems, and access control for 30 retail outlets.',
    description: 'Naivas Supermarket seeks security systems provider for comprehensive security infrastructure installation.',
    documentUrl: '#',
    requiredDocuments: ['Tax Compliance Certificate', 'Company CR12']
  },
  {
    id: '9',
    title: 'Consultancy Services for County Budget Review',
    tenderNumber: 'NAIROBI/FIN/2026/056',
    procuringEntity: 'Nairobi County Government',
    deadline: '2026-04-15',
    industry: 'Financial Services',
    bidBondRequired: true,
    bidBondAmount: 800000,
    category: 'government',
    subCategory: 'consultancy',
    summary: 'Professional consultancy services for comprehensive county budget review and financial planning for FY 2026/2027.',
    description: 'Nairobi County Government invites qualified consultancy firms to provide professional services for budget review, financial analysis, and strategic planning.',
    documentUrl: '#',
    requiredDocuments: ['Tax Compliance Certificate', 'Company CR12', 'Directors Details', 'Account Indemnity', 'Professional Certifications', 'Previous Experience Portfolio']
  }
];

export const banks: Bank[] = [
  {
    id: '1',
    name: 'KCB Bank Kenya',
    logo: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=200&h=200&fit=crop',
    processingTime: '2-3 business days',
    fees: 'KES 15,000 + 1.5% of bond value',
    digitalOption: true,
    rating: 4.5
  },
  {
    id: '2',
    name: 'Equity Bank',
    logo: 'https://images.unsplash.com/photo-1549421263-5ec394a5ad4c?w=200&h=200&fit=crop',
    processingTime: '3-5 business days',
    fees: 'KES 12,000 + 1.2% of bond value',
    digitalOption: true,
    rating: 4.3
  },
  {
    id: '3',
    name: 'Cooperative Bank',
    logo: 'https://images.unsplash.com/photo-1565372195458-9de0b320ef04?w=200&h=200&fit=crop',
    processingTime: '1-2 business days',
    fees: 'KES 18,000 + 1.8% of bond value',
    digitalOption: true,
    rating: 4.7
  },
  {
    id: '4',
    name: 'Standard Chartered Bank',
    logo: 'https://images.unsplash.com/photo-1565371587619-8ff7e3c46e8c?w=200&h=200&fit=crop',
    processingTime: '3-4 business days',
    fees: 'KES 20,000 + 2.0% of bond value',
    digitalOption: true,
    rating: 4.6
  },
  {
    id: '5',
    name: 'NCBA Bank',
    logo: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=200&h=200&fit=crop',
    processingTime: '2-4 business days',
    fees: 'KES 14,000 + 1.4% of bond value',
    digitalOption: false,
    rating: 4.2
  },
  {
    id: '6',
    name: 'Absa Bank Kenya',
    logo: 'https://images.unsplash.com/photo-1549421263-5ec394a5ad4c?w=200&h=200&fit=crop',
    processingTime: '4-5 business days',
    fees: 'KES 16,000 + 1.6% of bond value',
    digitalOption: true,
    rating: 4.4
  }
];

export const mockApplications: Application[] = [
  {
    id: '1',
    userId: 'user-1',
    tenderId: '1',
    tenderNumber: 'KNH/PROC/2026/001',
    tenderTitle: 'Supply and Delivery of Medical Equipment to Kenyatta National Hospital',
    status: 'approved',
    submittedDate: '2026-02-15',
    approvalDate: '2026-02-20',
    bankName: 'KCB Bank Kenya',
    bondAmount: 2500000,
    documentUrl: '#bidbond-document-1',
    statusHistory: [
      { status: 'Submitted', date: '2026-02-15', notes: 'Application submitted successfully' },
      { status: 'Under Review', date: '2026-02-17', notes: 'Bank reviewing application' },
      { status: 'Approved', date: '2026-02-20', notes: 'Bid bond approved and ready for download' }
    ],
    uploadedDocuments: [
      { name: 'Tax Compliance Certificate', type: 'PDF', uploadedAt: '2026-02-15', fileUrl: '#tax-cert-1' },
      { name: 'Company CR12', type: 'PDF', uploadedAt: '2026-02-15', fileUrl: '#cr12-1' },
      { name: 'Directors Details', type: 'PDF', uploadedAt: '2026-02-15', fileUrl: '#directors-1' },
      { name: 'Account Indemnity', type: 'PDF', uploadedAt: '2026-02-15', fileUrl: '#indemnity-1' }
    ]
  },
  {
    id: '2',
    userId: 'user-1',
    tenderId: '2',
    tenderNumber: 'KENHA/ROADS/2026/045',
    tenderTitle: 'Construction of Nairobi-Nakuru Highway Bypass',
    status: 'pending',
    submittedDate: '2026-02-20',
    bankName: 'Equity Bank',
    bondAmount: 5000000,
    statusHistory: [
      { status: 'Submitted', date: '2026-02-20', notes: 'Application submitted successfully' },
      { status: 'Under Review', date: '2026-02-25', notes: 'Additional documentation requested' }
    ],
    uploadedDocuments: [
      { name: 'Tax Compliance Certificate', type: 'PDF', uploadedAt: '2026-02-20', fileUrl: '#tax-cert-2' },
      { name: 'Company CR12', type: 'PDF', uploadedAt: '2026-02-20', fileUrl: '#cr12-2' },
      { name: 'Directors Details', type: 'PDF', uploadedAt: '2026-02-20', fileUrl: '#directors-2' }
    ]
  },
  {
    id: '3',
    userId: 'user-2',
    tenderId: '5',
    tenderNumber: 'MOE/ICT/2026/078',
    tenderTitle: 'Procurement of Laptops and Computer Equipment for Schools',
    status: 'submitted',
    submittedDate: '2026-02-22',
    bankName: 'Cooperative Bank',
    bondAmount: 3000000,
    statusHistory: [
      { status: 'Submitted', date: '2026-02-22', notes: 'Application submitted successfully' }
    ],
    uploadedDocuments: [
      { name: 'Tax Compliance Certificate', type: 'PDF', uploadedAt: '2026-02-22', fileUrl: '#tax-cert-3' },
      { name: 'Company CR12', type: 'PDF', uploadedAt: '2026-02-22', fileUrl: '#cr12-3' }
    ]
  },
  {
    id: '4',
    userId: 'user-2',
    tenderId: '3',
    tenderNumber: 'SAF/IT/2026/089',
    tenderTitle: 'IT Infrastructure Upgrade for Safaricom PLC',
    status: 'approved',
    submittedDate: '2026-02-10',
    approvalDate: '2026-02-14',
    bankName: 'Standard Chartered Bank',
    bondAmount: 1500000,
    documentUrl: '#bidbond-document-4',
    statusHistory: [
      { status: 'Submitted', date: '2026-02-10', notes: 'Application submitted successfully' },
      { status: 'Approved', date: '2026-02-14', notes: 'Bid bond approved and ready for download' }
    ],
    uploadedDocuments: [
      { name: 'Tax Compliance Certificate', type: 'PDF', uploadedAt: '2026-02-10', fileUrl: '#tax-cert-4' },
      { name: 'Company CR12', type: 'PDF', uploadedAt: '2026-02-10', fileUrl: '#cr12-4' },
      { name: 'Directors Details', type: 'PDF', uploadedAt: '2026-02-10', fileUrl: '#directors-4' }
    ]
  },
  {
    id: '5',
    userId: 'user-1',
    tenderId: '7',
    tenderNumber: 'AFC/AGRI/2026/034',
    tenderTitle: 'Supply of Agricultural Equipment and Machinery',
    status: 'rejected',
    submittedDate: '2026-02-05',
    bankName: 'NCBA Bank',
    bondAmount: 1800000,
    rejectionReason: 'Incomplete documentation - Missing audited financial statements',
    statusHistory: [
      { status: 'Submitted', date: '2026-02-05', notes: 'Application submitted successfully' },
      { status: 'Under Review', date: '2026-02-08', notes: 'Bank reviewing application' },
      { status: 'Rejected', date: '2026-02-12', notes: 'Incomplete documentation' }
    ],
    uploadedDocuments: [
      { name: 'Tax Compliance Certificate', type: 'PDF', uploadedAt: '2026-02-05', fileUrl: '#tax-cert-5' },
      { name: 'Company CR12', type: 'PDF', uploadedAt: '2026-02-05', fileUrl: '#cr12-5' }
    ]
  }
];
