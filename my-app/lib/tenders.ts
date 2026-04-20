import "server-only";
import { getPool, sql } from "./db";
import {
  PagedResult,
  Tender,
  TenderCategory,
  TenderDocumentDetail,
  TenderListFilters,
  TenderSubCategory,
  TenderWithDetails,
} from "./types";
import {
  classifyTender,
  SECTORS,
  Sector,
  SectorSlug,
} from "./sectors";
import {
  COUNTIES,
  County,
  detectCounty,
  REGIONS,
  RegionSlug,
} from "./counties";
import {
  BOND_BUCKETS,
  BondBucket,
  BondBucketSlug,
  bucketFor,
  parseBondAmount,
} from "./bond-buckets";

function normalizeSubCategory(raw: string | null): TenderSubCategory {
  if (!raw) return "Other";
  const v = raw.trim().toLowerCase();
  if (v.includes("good")) return "Goods";
  if (v.includes("work")) return "Works";
  if (v.includes("non consult") || v.includes("non-consult")) return "Services";
  if (v.includes("consult")) return "Consultancy";
  if (v.includes("service") || v.includes("supply") || v.includes("provision"))
    return "Services";
  return "Other";
}

function normalizeCategory(raw: string | null): TenderCategory {
  if (!raw) return "Government";
  return raw.trim().toLowerCase().startsWith("private") ? "Private" : "Government";
}

function toIso(value: Date | string | null): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

interface RawTenderRow {
  Id: string;
  Source: string | null;
  ExternalId: string | null;
  Title: string;
  TenderNumber: string | null;
  ProcuringEntity: string | null;
  Deadline: Date | null;
  Category: string | null;
  SubCategory: string | null;
  Summary: string | null;
  Description: string | null;
  DocumentUrl: string | null;
  TenderNoticeUrl: string | null;
  BidBondRequired: boolean | null;
  BidBondAmount: number | null;
  DocumentReleaseDate: Date | null;
  ProcurementMethod: string | null;
  StartDate: Date | null;
  EndDate: Date | null;
  CreatedAt: Date | null;
  UpdatedAt: Date | null;
  HasDetails: number;
  CompletenessScore: number;
}

function mapTender(row: RawTenderRow): Tender {
  return {
    id: row.Id,
    source: row.Source,
    externalId: row.ExternalId,
    title: row.Title,
    tenderNumber: row.TenderNumber,
    procuringEntity: row.ProcuringEntity,
    deadline: toIso(row.Deadline),
    category: normalizeCategory(row.Category),
    subCategory: normalizeSubCategory(row.SubCategory),
    rawSubCategory: row.SubCategory,
    summary: row.Summary,
    description: row.Description,
    documentUrl: row.DocumentUrl,
    tenderNoticeUrl: row.TenderNoticeUrl,
    bidBondRequired: !!row.BidBondRequired,
    bidBondAmount: Number(row.BidBondAmount ?? 0),
    documentReleaseDate: toIso(row.DocumentReleaseDate),
    procurementMethod: row.ProcurementMethod,
    startDate: toIso(row.StartDate),
    endDate: toIso(row.EndDate),
    createdAt: toIso(row.CreatedAt),
    updatedAt: toIso(row.UpdatedAt),
    hasDocumentDetails: row.HasDetails > 0,
    completenessScore: row.CompletenessScore,
  };
}

const COMPLETENESS_EXPR = `
  (CASE WHEN t.Title IS NOT NULL AND LEN(LTRIM(RTRIM(t.Title))) > 0 THEN 1 ELSE 0 END
 + CASE WHEN t.ProcuringEntity IS NOT NULL AND LEN(LTRIM(RTRIM(t.ProcuringEntity))) > 0 THEN 1 ELSE 0 END
 + CASE WHEN t.Deadline IS NOT NULL THEN 1 ELSE 0 END
 + CASE WHEN t.Deadline IS NOT NULL AND t.Deadline > GETUTCDATE() THEN 1 ELSE 0 END
 + CASE WHEN t.TenderNumber IS NOT NULL AND LEN(LTRIM(RTRIM(t.TenderNumber))) > 0 THEN 1 ELSE 0 END
 + CASE WHEN t.SubCategory IS NOT NULL AND LEN(LTRIM(RTRIM(t.SubCategory))) > 0 THEN 1 ELSE 0 END
 + CASE WHEN t.Summary IS NOT NULL AND LEN(LTRIM(RTRIM(t.Summary))) > 0 THEN 1 ELSE 0 END
 + CASE WHEN t.DocumentUrl IS NOT NULL AND LEN(LTRIM(RTRIM(t.DocumentUrl))) > 0 THEN 1 ELSE 0 END
 + CASE WHEN t.BidBondAmount IS NOT NULL AND t.BidBondAmount > 0 THEN 1 ELSE 0 END
 + CASE WHEN d.Id IS NOT NULL THEN 2 ELSE 0 END)
`;

const SELECT_TENDER = `
  SELECT
    t.Id, t.Source, t.ExternalId, t.Title, t.TenderNumber, t.ProcuringEntity,
    t.Deadline, t.Category, t.SubCategory, t.Summary, t.Description,
    t.DocumentUrl, t.TenderNoticeUrl, t.BidBondRequired, t.BidBondAmount,
    t.DocumentReleaseDate, t.ProcurementMethod, t.StartDate, t.EndDate,
    t.CreatedAt, t.UpdatedAt,
    CASE WHEN d.Id IS NULL THEN 0 ELSE 1 END AS HasDetails,
    ${COMPLETENESS_EXPR} AS CompletenessScore
  FROM ScrapedTenders t
  LEFT JOIN TenderDocumentDetails d ON d.TenderId = t.Id
`;

function buildWhere(filters: TenderListFilters): { clause: string; params: Record<string, unknown> } {
  const conds: string[] = ["t.Title IS NOT NULL", "LEN(LTRIM(RTRIM(t.Title))) > 0"];
  const params: Record<string, unknown> = {};

  if (filters.category && filters.category !== "All") {
    if (filters.category === "Government") {
      conds.push("(t.Category IS NULL OR LOWER(t.Category) LIKE 'gov%')");
    } else {
      conds.push("LOWER(t.Category) LIKE 'priv%'");
    }
  }

  if (filters.subCategory && filters.subCategory !== "All") {
    switch (filters.subCategory) {
      case "Goods":
        conds.push("LOWER(t.SubCategory) LIKE '%good%'");
        break;
      case "Works":
        conds.push("LOWER(t.SubCategory) LIKE '%work%'");
        break;
      case "Consultancy":
        conds.push(
          "LOWER(t.SubCategory) LIKE '%consult%' AND LOWER(t.SubCategory) NOT LIKE '%non%consult%' AND LOWER(t.SubCategory) NOT LIKE '%non-consult%'",
        );
        break;
      case "Services":
        conds.push(
          "(LOWER(t.SubCategory) LIKE '%service%' OR LOWER(t.SubCategory) LIKE '%non%consult%' OR LOWER(t.SubCategory) LIKE '%non-consult%' OR LOWER(t.SubCategory) LIKE '%supply%' OR LOWER(t.SubCategory) LIKE '%provision%')",
        );
        break;
      case "Other":
        conds.push(
          "(t.SubCategory IS NULL OR (LOWER(t.SubCategory) NOT LIKE '%good%' AND LOWER(t.SubCategory) NOT LIKE '%work%' AND LOWER(t.SubCategory) NOT LIKE '%service%' AND LOWER(t.SubCategory) NOT LIKE '%consult%' AND LOWER(t.SubCategory) NOT LIKE '%supply%' AND LOWER(t.SubCategory) NOT LIKE '%provision%'))",
        );
        break;
    }
  }

  if (filters.search && filters.search.trim()) {
    conds.push(
      "(t.Title LIKE @search OR t.ProcuringEntity LIKE @search OR t.TenderNumber LIKE @search OR t.Description LIKE @search)",
    );
    params.search = `%${filters.search.trim()}%`;
  }

  if (filters.requireBidBond) {
    conds.push("t.BidBondRequired = 1");
  }

  if (filters.onlyComplete) {
    conds.push("d.Id IS NOT NULL");
    conds.push("t.Deadline IS NOT NULL");
    conds.push("t.Deadline > GETUTCDATE()");
  }

  return { clause: `WHERE ${conds.join(" AND ")}`, params };
}

export async function listTenders(
  filters: TenderListFilters = {},
): Promise<PagedResult<Tender>> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(60, Math.max(5, filters.pageSize ?? 20));
  const offset = (page - 1) * pageSize;

  const { clause, params } = buildWhere(filters);

  const pool = await getPool();

  const dataReq = pool.request();
  dataReq.input("offset", sql.Int, offset);
  dataReq.input("pageSize", sql.Int, pageSize);

  const countReq = pool.request();

  for (const [key, value] of Object.entries(params)) {
    dataReq.input(key, sql.NVarChar, String(value));
    countReq.input(key, sql.NVarChar, String(value));
  }

  const dataQuery = `
    ${SELECT_TENDER}
    ${clause}
    ORDER BY ${COMPLETENESS_EXPR} DESC,
             CASE WHEN t.Deadline IS NULL THEN 1 ELSE 0 END,
             t.Deadline ASC,
             t.CreatedAt DESC
    OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;
  `;

  const countQuery = `
    SELECT COUNT(*) AS Total
    FROM ScrapedTenders t
    LEFT JOIN TenderDocumentDetails d ON d.TenderId = t.Id
    ${clause};
  `;

  const [dataResult, countResult] = await Promise.all([
    dataReq.query<RawTenderRow>(dataQuery),
    countReq.query<{ Total: number }>(countQuery),
  ]);

  const total = countResult.recordset[0]?.Total ?? 0;
  return {
    data: dataResult.recordset.map(mapTender),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

interface RawDetailRow {
  TenderId: string;
  BidBondAmount: string | null;
  BidBondForm: string | null;
  BidBondValidity: string | null;
  BidValidityPeriod: string | null;
  SubmissionDeadline: string | null;
  SubmissionMethod: string | null;
  PreBidMeetingDate: string | null;
  PreBidMeetingLink: string | null;
  ClarificationDeadline: string | null;
  MandatorySiteVisit: boolean | null;
  NumberOfBidCopies: string | null;
  MinAnnualTurnover: string | null;
  MinLiquidAssets: string | null;
  MinSingleContractValue: string | null;
  MinCombinedContractValue: string | null;
  CashFlowRequirement: string | null;
  AuditedFinancialsYears: string | null;
  KeyPersonnel: string | null;
  KeyEquipment: string | null;
  KeyRequirementsRaw: string | null;
  FinancialQualificationsRaw: string | null;
  DocumentParsed: boolean | null;
  ParsedDocumentUrl: string | null;
  ParseError: string | null;
}

function mapDetail(row: RawDetailRow): TenderDocumentDetail {
  return {
    tenderId: row.TenderId,
    bidBondAmount: row.BidBondAmount,
    bidBondForm: row.BidBondForm,
    bidBondValidity: row.BidBondValidity,
    bidValidityPeriod: row.BidValidityPeriod,
    submissionDeadline: row.SubmissionDeadline,
    submissionMethod: row.SubmissionMethod,
    preBidMeetingDate: row.PreBidMeetingDate,
    preBidMeetingLink: row.PreBidMeetingLink,
    clarificationDeadline: row.ClarificationDeadline,
    mandatorySiteVisit: !!row.MandatorySiteVisit,
    numberOfBidCopies: row.NumberOfBidCopies,
    minAnnualTurnover: row.MinAnnualTurnover,
    minLiquidAssets: row.MinLiquidAssets,
    minSingleContractValue: row.MinSingleContractValue,
    minCombinedContractValue: row.MinCombinedContractValue,
    cashFlowRequirement: row.CashFlowRequirement,
    auditedFinancialsYears: row.AuditedFinancialsYears,
    keyPersonnel: row.KeyPersonnel,
    keyEquipment: row.KeyEquipment,
    keyRequirementsRaw: row.KeyRequirementsRaw,
    financialQualificationsRaw: row.FinancialQualificationsRaw,
    documentParsed: !!row.DocumentParsed,
    parsedDocumentUrl: row.ParsedDocumentUrl,
    parseError: row.ParseError,
  };
}

export async function getTenderById(id: string): Promise<TenderWithDetails | null> {
  const pool = await getPool();

  const tenderResult = await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .query<RawTenderRow>(`${SELECT_TENDER} WHERE t.Id = @id`);

  const row = tenderResult.recordset[0];
  if (!row) return null;

  const detailResult = await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .query<RawDetailRow>(
      `SELECT TenderId, BidBondAmount, BidBondForm, BidBondValidity, BidValidityPeriod,
              SubmissionDeadline, SubmissionMethod, PreBidMeetingDate, PreBidMeetingLink,
              ClarificationDeadline, MandatorySiteVisit, NumberOfBidCopies,
              MinAnnualTurnover, MinLiquidAssets, MinSingleContractValue,
              MinCombinedContractValue, CashFlowRequirement, AuditedFinancialsYears,
              KeyPersonnel, KeyEquipment, KeyRequirementsRaw, FinancialQualificationsRaw,
              DocumentParsed, ParsedDocumentUrl, ParseError
       FROM TenderDocumentDetails WHERE TenderId = @id`,
    );

  return {
    tender: mapTender(row),
    details: detailResult.recordset[0] ? mapDetail(detailResult.recordset[0]) : null,
  };
}

export interface CategoryStats {
  category: TenderCategory | "Total";
  subCategory: TenderSubCategory | "All";
  count: number;
}

export async function getCategoryStats(): Promise<CategoryStats[]> {
  const pool = await getPool();
  const result = await pool.request().query<{
    Cat: string | null;
    Sub: string | null;
    Cnt: number;
  }>(`
    SELECT t.Category AS Cat, t.SubCategory AS Sub, COUNT(*) AS Cnt
    FROM ScrapedTenders t
    WHERE t.Title IS NOT NULL AND LEN(LTRIM(RTRIM(t.Title))) > 0
    GROUP BY t.Category, t.SubCategory
  `);

  const stats: CategoryStats[] = [];
  let total = 0;
  const subTotals = new Map<TenderSubCategory, number>();

  for (const r of result.recordset) {
    const cat = normalizeCategory(r.Cat);
    const sub = normalizeSubCategory(r.Sub);
    stats.push({ category: cat, subCategory: sub, count: r.Cnt });
    total += r.Cnt;
    subTotals.set(sub, (subTotals.get(sub) ?? 0) + r.Cnt);
  }

  for (const [sub, count] of subTotals) {
    stats.push({ category: "Total", subCategory: sub, count });
  }
  stats.push({ category: "Total", subCategory: "All", count: total });
  return stats;
}

export interface PlatformOverview {
  totalActive: number;
  governmentCount: number;
  privateCount: number;
  bondRequiredCount: number;
  uniqueEntities: number;
  bySub: Record<TenderSubCategory, number>;
  totalEverScraped: number;
}

export async function getPlatformOverview(): Promise<PlatformOverview> {
  const pool = await getPool();
  const r = await pool.request().query<{
    TotalActive: number;
    GovCount: number;
    PrivCount: number;
    BondCount: number;
    UniqueEntities: number;
    Goods: number;
    Works: number;
    Services: number;
    Consultancy: number;
    Other: number;
    Total: number;
  }>(`
    SELECT
      COUNT(CASE WHEN t.Deadline IS NULL OR t.Deadline > GETUTCDATE() THEN 1 END) AS TotalActive,
      COUNT(CASE WHEN (t.Category IS NULL OR LOWER(t.Category) LIKE 'gov%') AND (t.Deadline IS NULL OR t.Deadline > GETUTCDATE()) THEN 1 END) AS GovCount,
      COUNT(CASE WHEN LOWER(t.Category) LIKE 'priv%' AND (t.Deadline IS NULL OR t.Deadline > GETUTCDATE()) THEN 1 END) AS PrivCount,
      COUNT(CASE WHEN t.BidBondRequired = 1 AND (t.Deadline IS NULL OR t.Deadline > GETUTCDATE()) THEN 1 END) AS BondCount,
      COUNT(DISTINCT t.ProcuringEntity) AS UniqueEntities,
      COUNT(CASE WHEN LOWER(t.SubCategory) LIKE 'goods%' THEN 1 END) AS Goods,
      COUNT(CASE WHEN LOWER(t.SubCategory) LIKE 'works%' THEN 1 END) AS Works,
      COUNT(CASE WHEN LOWER(t.SubCategory) LIKE 'service%' THEN 1 END) AS Services,
      COUNT(CASE WHEN LOWER(t.SubCategory) LIKE 'consult%' THEN 1 END) AS Consultancy,
      COUNT(CASE
        WHEN t.SubCategory IS NULL
          OR (LOWER(t.SubCategory) NOT LIKE 'goods%'
            AND LOWER(t.SubCategory) NOT LIKE 'works%'
            AND LOWER(t.SubCategory) NOT LIKE 'service%'
            AND LOWER(t.SubCategory) NOT LIKE 'consult%')
        THEN 1 END) AS Other,
      COUNT(*) AS Total
    FROM ScrapedTenders t
    WHERE t.Title IS NOT NULL AND LEN(LTRIM(RTRIM(t.Title))) > 0
  `);

  const row = r.recordset[0];
  return {
    totalActive: row?.TotalActive ?? 0,
    governmentCount: row?.GovCount ?? 0,
    privateCount: row?.PrivCount ?? 0,
    bondRequiredCount: row?.BondCount ?? 0,
    uniqueEntities: row?.UniqueEntities ?? 0,
    bySub: {
      Goods: row?.Goods ?? 0,
      Works: row?.Works ?? 0,
      Services: row?.Services ?? 0,
      Consultancy: row?.Consultancy ?? 0,
      Other: row?.Other ?? 0,
    },
    totalEverScraped: row?.Total ?? 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Categorisation lenses
// ─────────────────────────────────────────────────────────────────────────────

export interface LensCount<T extends string> {
  slug: T;
  count: number;
}

export interface LensAggregations {
  totalActive: number;
  bySector: LensCount<SectorSlug>[];
  byRegion: LensCount<RegionSlug>[];
  byCounty: LensCount<string>[];
  byMethod: LensCount<string>[];
  bySource: LensCount<string>[];
  bySubCategory: LensCount<TenderSubCategory>[];
  byBondBucket: LensCount<BondBucketSlug>[];
  bySubmissionMethod: LensCount<string>[];
  generatedAt: number;
}

interface AggregationRow {
  Id: string;
  Source: string | null;
  Title: string | null;
  Description: string | null;
  ProcuringEntity: string | null;
  SubCategory: string | null;
  ProcurementMethod: string | null;
  BidBondAmount: number | null;
  Deadline: Date | null;
  TextBidBond: string | null;
  SubmissionMethod: string | null;
}

let aggregationCache: { data: LensAggregations; expires: number } | null = null;
const AGGREGATION_TTL_MS = 5 * 60_000;

export async function getLensAggregations(): Promise<LensAggregations> {
  if (aggregationCache && aggregationCache.expires > Date.now()) {
    return aggregationCache.data;
  }

  const pool = await getPool();
  const result = await pool.request().query<AggregationRow>(`
    SELECT
      t.Id, t.Source, t.Title, t.Description, t.ProcuringEntity,
      t.SubCategory, t.ProcurementMethod, t.BidBondAmount, t.Deadline,
      d.BidBondAmount AS TextBidBond,
      d.SubmissionMethod
    FROM ScrapedTenders t
    LEFT JOIN TenderDocumentDetails d ON d.TenderId = t.Id
    WHERE t.Title IS NOT NULL AND LEN(LTRIM(RTRIM(t.Title))) > 0
      AND (t.Deadline IS NULL OR t.Deadline > GETUTCDATE())
  `);

  const rows = result.recordset;

  const sector = new Map<SectorSlug, number>();
  const region = new Map<RegionSlug, number>();
  const county = new Map<string, number>();
  const method = new Map<string, number>();
  const source = new Map<string, number>();
  const sub = new Map<TenderSubCategory, number>();
  const bond = new Map<BondBucketSlug, number>();
  const submission = new Map<string, number>();

  function inc<T>(m: Map<T, number>, k: T) {
    m.set(k, (m.get(k) ?? 0) + 1);
  }

  for (const r of rows) {
    inc(sector, classifyTender({ title: r.Title, description: r.Description, procuringEntity: r.ProcuringEntity }));
    const c = detectCounty((r.ProcuringEntity ?? "") + " " + (r.Title ?? ""));
    if (c) {
      inc(county, c.slug);
      inc(region, c.region);
    } else {
      inc(region, "national");
    }
    inc(sub, normalizeSubCategory(r.SubCategory));
    if (r.ProcurementMethod) inc(method, r.ProcurementMethod.trim());
    else inc(method, "Other");
    inc(source, r.Source ?? "Unknown");

    const numericBond = Number(r.BidBondAmount ?? 0);
    const fromText = parseBondAmount(r.TextBidBond);
    inc(bond, bucketFor(numericBond > 0 ? numericBond : fromText));

    const sm = (r.SubmissionMethod ?? "").trim();
    if (!sm) inc(submission, "Unknown");
    else if (/electronic/i.test(sm)) inc(submission, "Electronic");
    else if (/physical|tender\s*box|manual/i.test(sm)) inc(submission, "Physical");
    else inc(submission, "Other");
  }

  const data: LensAggregations = {
    totalActive: rows.length,
    bySector: SECTORS.map((s) => ({ slug: s.slug, count: sector.get(s.slug) ?? 0 })).sort(
      (a, b) => b.count - a.count,
    ),
    byRegion: REGIONS.map((r) => ({ slug: r.slug, count: region.get(r.slug) ?? 0 })).sort(
      (a, b) => b.count - a.count,
    ),
    byCounty: COUNTIES.map((c) => ({ slug: c.slug, count: county.get(c.slug) ?? 0 }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count),
    byMethod: [...method.entries()].map(([slug, count]) => ({ slug, count })).sort(
      (a, b) => b.count - a.count,
    ),
    bySource: [...source.entries()].map(([slug, count]) => ({ slug, count })).sort(
      (a, b) => b.count - a.count,
    ),
    bySubCategory: (
      ["Goods", "Works", "Services", "Consultancy", "Other"] as TenderSubCategory[]
    ).map((slug) => ({ slug, count: sub.get(slug) ?? 0 })),
    byBondBucket: BOND_BUCKETS.map((b) => ({ slug: b.slug, count: bond.get(b.slug) ?? 0 })),
    bySubmissionMethod: [...submission.entries()]
      .map(([slug, count]) => ({ slug, count }))
      .sort((a, b) => b.count - a.count),
    generatedAt: Date.now(),
  };

  aggregationCache = { data, expires: Date.now() + AGGREGATION_TTL_MS };
  return data;
}

export interface SectorAggregateMeta {
  sector: Sector;
  count: number;
}

export async function getSectorTenders(
  slug: SectorSlug,
  limit = 30,
): Promise<{ sector: Sector; tenders: Tender[]; total: number }> {
  const sectorMeta = SECTORS.find((s) => s.slug === slug);
  if (!sectorMeta) throw new Error(`Unknown sector: ${slug}`);

  const pool = await getPool();
  const all = await pool.request().query<RawTenderRow>(`
    ${SELECT_TENDER}
    WHERE t.Title IS NOT NULL AND LEN(LTRIM(RTRIM(t.Title))) > 0
      AND (t.Deadline IS NULL OR t.Deadline > GETUTCDATE())
    ORDER BY ${COMPLETENESS_EXPR} DESC,
             CASE WHEN t.Deadline IS NULL THEN 1 ELSE 0 END,
             t.Deadline ASC
  `);

  const filtered: Tender[] = [];
  for (const row of all.recordset) {
    const t = mapTender(row);
    const cls = classifyTender({
      title: t.title,
      description: t.description,
      procuringEntity: t.procuringEntity,
    });
    if (cls === slug) filtered.push(t);
    if (filtered.length >= limit * 4) break; // upper safety bound
  }

  return { sector: sectorMeta, tenders: filtered.slice(0, limit), total: filtered.length };
}

export async function getCountyTenders(
  countySlug: string,
  limit = 30,
): Promise<{ county: County; tenders: Tender[]; total: number }> {
  const c = COUNTIES.find((x) => x.slug === countySlug);
  if (!c) throw new Error(`Unknown county: ${countySlug}`);

  const pool = await getPool();
  const aliasClauses = c.aliases
    .map((_, i) => `LOWER(t.ProcuringEntity) LIKE @a${i} OR LOWER(t.Title) LIKE @a${i}`)
    .join(" OR ");

  const req = pool.request();
  c.aliases.forEach((alias, i) =>
    req.input(`a${i}`, sql.NVarChar, `%${alias.toLowerCase()}%`),
  );

  const result = await req.query<RawTenderRow>(`
    ${SELECT_TENDER}
    WHERE t.Title IS NOT NULL AND LEN(LTRIM(RTRIM(t.Title))) > 0
      AND (t.Deadline IS NULL OR t.Deadline > GETUTCDATE())
      AND (${aliasClauses || "1=1"})
    ORDER BY ${COMPLETENESS_EXPR} DESC,
             CASE WHEN t.Deadline IS NULL THEN 1 ELSE 0 END,
             t.Deadline ASC
  `);

  const tenders = result.recordset.slice(0, limit).map(mapTender);
  return { county: c, tenders, total: result.recordset.length };
}

export async function getBondBucketTenders(
  bucketSlug: BondBucketSlug,
  limit = 30,
): Promise<{ bucket: BondBucket; tenders: Tender[]; total: number }> {
  const bucket = BOND_BUCKETS.find((b) => b.slug === bucketSlug);
  if (!bucket) throw new Error(`Unknown bond bucket: ${bucketSlug}`);

  const pool = await getPool();
  const result = await pool.request().query<
    RawTenderRow & { TextBidBond: string | null }
  >(`
    SELECT
      t.Id, t.Source, t.ExternalId, t.Title, t.TenderNumber, t.ProcuringEntity,
      t.Deadline, t.Category, t.SubCategory, t.Summary, t.Description,
      t.DocumentUrl, t.TenderNoticeUrl, t.BidBondRequired, t.BidBondAmount,
      t.DocumentReleaseDate, t.ProcurementMethod, t.StartDate, t.EndDate,
      t.CreatedAt, t.UpdatedAt,
      CASE WHEN d.Id IS NULL THEN 0 ELSE 1 END AS HasDetails,
      ${COMPLETENESS_EXPR} AS CompletenessScore,
      d.BidBondAmount AS TextBidBond
    FROM ScrapedTenders t
    LEFT JOIN TenderDocumentDetails d ON d.TenderId = t.Id
    WHERE t.Title IS NOT NULL AND LEN(LTRIM(RTRIM(t.Title))) > 0
      AND (t.Deadline IS NULL OR t.Deadline > GETUTCDATE())
    ORDER BY ${COMPLETENESS_EXPR} DESC, t.Deadline ASC
  `);

  const filtered: Tender[] = [];
  for (const row of result.recordset) {
    const numeric = Number(row.BidBondAmount ?? 0);
    const fromText = parseBondAmount(row.TextBidBond);
    const amt = numeric > 0 ? numeric : fromText;
    if (bucketFor(amt) === bucketSlug) {
      filtered.push(mapTender(row));
    }
    if (filtered.length >= limit * 4) break;
  }

  return { bucket, tenders: filtered.slice(0, limit), total: filtered.length };
}

// ─────────────────────────────────────────────────────────────────────────────

export async function getFeaturedTenders(limit: number = 6): Promise<Tender[]> {
  const pool = await getPool();
  const result = await pool.request().input("limit", sql.Int, limit).query<RawTenderRow>(`
    SELECT TOP (@limit)
      t.Id, t.Source, t.ExternalId, t.Title, t.TenderNumber, t.ProcuringEntity,
      t.Deadline, t.Category, t.SubCategory, t.Summary, t.Description,
      t.DocumentUrl, t.TenderNoticeUrl, t.BidBondRequired, t.BidBondAmount,
      t.DocumentReleaseDate, t.ProcurementMethod, t.StartDate, t.EndDate,
      t.CreatedAt, t.UpdatedAt,
      CASE WHEN d.Id IS NULL THEN 0 ELSE 1 END AS HasDetails,
      ${COMPLETENESS_EXPR} AS CompletenessScore
    FROM ScrapedTenders t
    LEFT JOIN TenderDocumentDetails d ON d.TenderId = t.Id
    WHERE t.Title IS NOT NULL AND LEN(LTRIM(RTRIM(t.Title))) > 0
      AND t.Deadline IS NOT NULL AND t.Deadline > GETUTCDATE()
      AND d.Id IS NOT NULL
    ORDER BY ${COMPLETENESS_EXPR} DESC, t.Deadline ASC
  `);

  return result.recordset.map(mapTender);
}
