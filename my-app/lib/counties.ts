/**
 * Kenyan counties + region groupings used to filter tenders by location.
 * The user supplies background imagery at /public/counties/{slug}.jpg.
 */

export type RegionSlug =
  | "nairobi-metro"
  | "central"
  | "rift-valley"
  | "western"
  | "nyanza"
  | "coast"
  | "eastern"
  | "northern"
  | "national";

export interface County {
  slug: string;
  name: string;
  region: RegionSlug;
  /** Lower-cased aliases to detect in titles / entity names. */
  aliases: string[];
}

export const REGIONS: { slug: RegionSlug; label: string; tagline: string }[] = [
  {
    slug: "nairobi-metro",
    label: "Nairobi ",
    tagline: "Capital city + surrounding metro counties",
  },
  {
    slug: "central",
    label: "Central Kenya",
    tagline: "Kiambu, Nyeri, Murang'a, Kirinyaga and the Mt Kenya region",
  },
  {
    slug: "rift-valley",
    label: "Rift Valley",
    tagline: "Nakuru, Uasin Gishu, Nandi, Baringo, Narok and the Rift",
  },
  {
    slug: "western",
    label: "Western Kenya",
    tagline: "Kakamega, Bungoma, Vihiga and Busia",
  },
  {
    slug: "nyanza",
    label: "Nyanza",
    tagline: "Kisumu, Kisii, Siaya, Homa Bay, Migori, Nyamira",
  },
  {
    slug: "coast",
    label: "Coast",
    tagline: "Mombasa, Kwale, Kilifi, Lamu, Tana River, Taita-Taveta",
  },
  {
    slug: "eastern",
    label: "Eastern Kenya",
    tagline: "Machakos, Makueni, Kitui, Embu, Meru, Tharaka-Nithi",
  },
  {
    slug: "northern",
    label: "Northern Kenya",
    tagline: "Turkana, Marsabit, Mandera, Wajir, Garissa, Samburu, Isiolo",
  },
  {
    slug: "national",
    label: "National & Multi-County",
    tagline: "Tenders issued at national or multi-county level",
  },
];

export const COUNTIES: County[] = [
  // Nairobi Metro
  { slug: "nairobi", name: "Nairobi", region: "nairobi-metro", aliases: ["nairobi"] },
  { slug: "kiambu", name: "Kiambu", region: "central", aliases: ["kiambu"] },
  { slug: "kajiado", name: "Kajiado", region: "rift-valley", aliases: ["kajiado"] },
  { slug: "machakos", name: "Machakos", region: "eastern", aliases: ["machakos"] },

  // Central
  { slug: "nyeri", name: "Nyeri", region: "central", aliases: ["nyeri"] },
  { slug: "muranga", name: "Murang'a", region: "central", aliases: ["murang", "muranga"] },
  { slug: "kirinyaga", name: "Kirinyaga", region: "central", aliases: ["kirinyaga"] },
  { slug: "nyandarua", name: "Nyandarua", region: "central", aliases: ["nyandarua"] },

  // Rift Valley
  { slug: "nakuru", name: "Nakuru", region: "rift-valley", aliases: ["nakuru"] },
  { slug: "uasin-gishu", name: "Uasin Gishu", region: "rift-valley", aliases: ["uasin gishu", "uasin-gishu", "eldoret"] },
  { slug: "trans-nzoia", name: "Trans-Nzoia", region: "rift-valley", aliases: ["trans nzoia", "trans-nzoia", "kitale"] },
  { slug: "elgeyo-marakwet", name: "Elgeyo-Marakwet", region: "rift-valley", aliases: ["elgeyo", "marakwet"] },
  { slug: "nandi", name: "Nandi", region: "rift-valley", aliases: ["nandi"] },
  { slug: "baringo", name: "Baringo", region: "rift-valley", aliases: ["baringo"] },
  { slug: "laikipia", name: "Laikipia", region: "rift-valley", aliases: ["laikipia"] },
  { slug: "narok", name: "Narok", region: "rift-valley", aliases: ["narok"] },
  { slug: "kericho", name: "Kericho", region: "rift-valley", aliases: ["kericho"] },
  { slug: "bomet", name: "Bomet", region: "rift-valley", aliases: ["bomet"] },
  { slug: "west-pokot", name: "West Pokot", region: "rift-valley", aliases: ["west pokot", "pokot"] },
  { slug: "samburu", name: "Samburu", region: "northern", aliases: ["samburu"] },
  { slug: "turkana", name: "Turkana", region: "northern", aliases: ["turkana"] },

  // Western
  { slug: "kakamega", name: "Kakamega", region: "western", aliases: ["kakamega"] },
  { slug: "vihiga", name: "Vihiga", region: "western", aliases: ["vihiga"] },
  { slug: "bungoma", name: "Bungoma", region: "western", aliases: ["bungoma"] },
  { slug: "busia", name: "Busia", region: "western", aliases: ["busia"] },

  // Nyanza
  { slug: "kisumu", name: "Kisumu", region: "nyanza", aliases: ["kisumu", "city of kisumu"] },
  { slug: "siaya", name: "Siaya", region: "nyanza", aliases: ["siaya"] },
  { slug: "homa-bay", name: "Homa Bay", region: "nyanza", aliases: ["homa bay", "homa-bay"] },
  { slug: "migori", name: "Migori", region: "nyanza", aliases: ["migori"] },
  { slug: "kisii", name: "Kisii", region: "nyanza", aliases: ["kisii"] },
  { slug: "nyamira", name: "Nyamira", region: "nyanza", aliases: ["nyamira"] },

  // Coast
  { slug: "mombasa", name: "Mombasa", region: "coast", aliases: ["mombasa"] },
  { slug: "kwale", name: "Kwale", region: "coast", aliases: ["kwale"] },
  { slug: "kilifi", name: "Kilifi", region: "coast", aliases: ["kilifi", "malindi"] },
  { slug: "tana-river", name: "Tana River", region: "coast", aliases: ["tana river", "tana-river"] },
  { slug: "lamu", name: "Lamu", region: "coast", aliases: ["lamu"] },
  { slug: "taita-taveta", name: "Taita-Taveta", region: "coast", aliases: ["taita", "taveta"] },

  // Eastern
  { slug: "makueni", name: "Makueni", region: "eastern", aliases: ["makueni"] },
  { slug: "kitui", name: "Kitui", region: "eastern", aliases: ["kitui"] },
  { slug: "embu", name: "Embu", region: "eastern", aliases: ["embu"] },
  { slug: "meru", name: "Meru", region: "eastern", aliases: ["meru"] },
  { slug: "tharaka-nithi", name: "Tharaka-Nithi", region: "eastern", aliases: ["tharaka", "nithi"] },

  // Northern
  { slug: "marsabit", name: "Marsabit", region: "northern", aliases: ["marsabit"] },
  { slug: "isiolo", name: "Isiolo", region: "northern", aliases: ["isiolo"] },
  { slug: "garissa", name: "Garissa", region: "northern", aliases: ["garissa"] },
  { slug: "wajir", name: "Wajir", region: "northern", aliases: ["wajir"] },
  { slug: "mandera", name: "Mandera", region: "northern", aliases: ["mandera"] },
];

const COUNTY_BY_SLUG = new Map(COUNTIES.map((c) => [c.slug, c]));

export function getCounty(slug: string): County | null {
  return COUNTY_BY_SLUG.get(slug) ?? null;
}

export function detectCounty(text: string | null | undefined): County | null {
  if (!text) return null;
  const t = text.toLowerCase();
  for (const c of COUNTIES) {
    for (const alias of c.aliases) {
      if (t.includes(alias)) return c;
    }
  }
  return null;
}

export function detectRegion(text: string | null | undefined): RegionSlug {
  return detectCounty(text)?.region ?? "national";
}

export function countiesInRegion(region: RegionSlug): County[] {
  return COUNTIES.filter((c) => c.region === region);
}

/** Path to the imagery for a county hero strip. */
export function countyImagePath(slug: string): string {
  return `/counties/${slug}.jpg`;
}

/** Path to the imagery for a region hero strip. */
export function regionImagePath(slug: RegionSlug): string {
  return `/counties/region-${slug}.jpg`;
}
