"""Tender document PDF/ZIP parser – v2 (complete rewrite).

Downloads tender documents (PDFs, ZIPs, SharePoint/OneDrive/Google Drive links),
extracts text, and parses four core sections:

  1. KEY REQUIREMENTS  – bid bond, validity, submission, pre-bid, site visit
  2. FINANCIAL QUALIFICATIONS – turnover, liquid assets, contracts
  3. KEY PERSONNEL REQUIRED
  4. KEY EQUIPMENT REQUIRED

Key improvements over v1
────────────────────────
BID BOND (most critical field)
  • Normalises multi-line PDF artefacts before matching
    e.g. "KES 1\\n,000,000" → "KES 1,000,000"
  • Handles "X% of tender sum / bid price" (tenders.go.ke style)
  • Handles "5% bid bond in form of Banker's cheque ONLY" (Red Cross style)
  • Handles "KES 1,000,000.00 or equivalent" (standard PPRA style)
  • Returns "Tender Security Not Required" (not 0) when TSD is used
  • Strict year-filter: never returns a 4-digit year as an amount
  • Falls through TDS → Invitation → section-bounded search → full text

SHAREPOINT / GOOGLE DRIVE
  • SharePoint personal OneDrive viewer URLs → direct download
  • SharePoint team-site links → ?download=1
  • Google Drive view/share links → direct download

ALL FIELDS
  • _norm() collapses whitespace/newlines before every regex
  • All regexes operate on normalised text to avoid PDF column artefacts
"""

import io
import logging
import re
import warnings
import zipfile
from typing import Any
from urllib.parse import urlparse, parse_qs, quote, unquote

import pdfplumber
import requests

log = logging.getLogger(__name__)

warnings.filterwarnings("ignore", message="Unverified HTTPS request")

_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)
_TIMEOUT = 90


# ══════════════════════════════════════════════════════════════════════════════
#  URL RESOLUTION
# ══════════════════════════════════════════════════════════════════════════════

def _resolve_url(url: str) -> str:
    """Convert SharePoint / OneDrive / Google Drive viewer URLs to direct
    download URLs that return raw bytes.

    Patterns handled
    ─────────────────
    Google Drive
      https://drive.google.com/file/d/{ID}/view  →  uc?export=download&id={ID}

    SharePoint personal OneDrive viewer
      https://{tenant}-my.sharepoint.com/personal/{user}/_layouts/15/onedrive.aspx
          ?id=%2F...%2FFILE.pdf
      →  https://{tenant}-my.sharepoint.com/_layouts/15/download.aspx
             ?SourceUrl=%2F...%2FFILE.pdf

    SharePoint file URL (not viewer)
      https://{tenant}.sharepoint.com/...  →  append &download=1

    OneDrive live.com share
      https://onedrive.live.com/...view...  →  /download
    """
    if not url:
        return url

    # Google Drive
    gd = re.search(r"drive\.google\.com/file/d/([a-zA-Z0-9_-]+)", url)
    if gd:
        return (
            f"https://drive.google.com/uc"
            f"?export=download&id={gd.group(1)}&confirm=t"
        )

    # SharePoint personal OneDrive viewer
    if "sharepoint.com" in url and "onedrive.aspx" in url:
        parsed = urlparse(url)
        params = parse_qs(parsed.query)
        file_path = (params.get("id") or [None])[0]
        if file_path:
            decoded = unquote(file_path)
            encoded = quote(decoded, safe="/")
            base = f"{parsed.scheme}://{parsed.netloc}"
            return f"{base}/_layouts/15/download.aspx?SourceUrl={encoded}"

    # Generic SharePoint file URL
    if "sharepoint.com" in url and "download.aspx" not in url:
        sep = "&" if "?" in url else "?"
        return url + sep + "download=1"

    # OneDrive live.com share links
    if "onedrive.live.com" in url:
        return url.replace("/view?", "/download?").replace("/view", "/download")

    return url


# ══════════════════════════════════════════════════════════════════════════════
#  PDF / ZIP TEXT EXTRACTION
# ══════════════════════════════════════════════════════════════════════════════

def _pdf_bytes_to_text(data: bytes) -> str:
    parts: list[str] = []
    try:
        with pdfplumber.open(io.BytesIO(data)) as pdf:
            for page in pdf.pages:
                try:
                    t = page.extract_text() or ""
                    parts.append(t)
                except Exception:
                    continue
    except Exception as exc:
        log.warning("pdfplumber failed: %s", exc)
    return "\n".join(parts)


def _zip_bytes_to_text(data: bytes) -> str:
    parts: list[str] = []
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as zf:
            for name in zf.namelist():
                if name.lower().endswith(".pdf"):
                    try:
                        t = _pdf_bytes_to_text(zf.read(name))
                        if t.strip():
                            parts.append(t)
                    except Exception:
                        continue
    except zipfile.BadZipFile:
        log.warning("Not a valid ZIP file")
    except Exception as exc:
        log.warning("ZIP extraction failed: %s", exc)
    return "\n".join(parts)


def download_and_extract_text(url: str) -> str:
    """Download a document and return all extracted text.

    Resolves SharePoint / Google Drive viewer URLs automatically.
    Falls back to the original URL if the resolved one fails.
    """
    if not url or not url.startswith("http"):
        return ""

    resolved = _resolve_url(url)
    if resolved != url:
        log.debug("URL resolved: %s → %s", url[:80], resolved[:80])

    headers = {
        "User-Agent": _UA,
        "Accept": "application/pdf,application/octet-stream,*/*",
    }

    # Try resolved first, then original (deduplicated)
    urls_to_try = list(dict.fromkeys([resolved, url]))

    for attempt_url in urls_to_try:
        try:
            resp = requests.get(
                attempt_url, headers=headers,
                timeout=_TIMEOUT, verify=False,
                allow_redirects=True,
            )
            resp.raise_for_status()
        except requests.RequestException as exc:
            log.warning("Download failed (%s): %s", attempt_url[:80], exc)
            continue

        content = resp.content
        ct = resp.headers.get("content-type", "").lower()

        if content[:4] == b"%PDF" or "pdf" in ct:
            return _pdf_bytes_to_text(content)
        if content[:2] == b"PK" or "zip" in ct:
            return _zip_bytes_to_text(content)

        # Unknown type: try PDF then ZIP
        text = _pdf_bytes_to_text(content)
        if text.strip():
            return text
        text = _zip_bytes_to_text(content)
        if text.strip():
            return text

        log.warning("Unrecognised format from %s (ct=%s)", attempt_url[:80], ct)

    return ""


# ══════════════════════════════════════════════════════════════════════════════
#  SHARED LOW-LEVEL HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def _norm(text: str) -> str:
    """Collapse ALL whitespace (including newlines) to single spaces.

    This is the single most important fix for PDF artefacts such as:
      "KES 1\\n,000,000"  →  "KES 1 ,000,000"
    The amount extractor then strips those internal spaces before parsing.
    """
    return re.sub(r"\s+", " ", (text or "").strip())


def _ctx(lines: list[str], idx: int, window: int = 10) -> str:
    """Return up to `window` lines starting at `idx`, collapsed to one string."""
    chunk = lines[idx: min(len(lines), idx + window)]
    return _norm(" ".join(chunk))


def _extract_section(text: str,
                     start_kw: list[str],
                     end_kw: list[str],
                     max_chars: int = 12_000) -> str:
    """Extract a text block bounded by start/end keywords."""
    lines = text.split("\n")
    in_section = False
    out: list[str] = []
    count = 0

    for line in lines:
        low = line.lower().strip()
        # Skip TOC lines (rows of dots)
        if "....." in line or re.match(r".*\.{4,}\s*\d+\s*$", line):
            continue
        if not in_section:
            if any(k in low for k in start_kw):
                in_section = True
                out.append(line)
                count += len(line)
        else:
            if any(k in low for k in end_kw):
                break
            out.append(line)
            count += len(line)
            if count > max_chars:
                break

    return "\n".join(out).strip()


def _tds_text(text: str) -> str:
    return _extract_section(
        text,
        start_kw=["tender data sheet", "appendix to instruction", "bid data sheet"],
        end_kw=["section iii", "evaluation and qualification", "evaluation criteria"],
        max_chars=15_000,
    )


def _invitation_text(text: str) -> str:
    return _extract_section(
        text,
        start_kw=["invitation to tender", "invites sealed",
                  "notice to tenderers", "tender notice"],
        end_kw=["part 1", "tendering procedures", "section i",
                "instructions to tenderer"],
        max_chars=8_000,
    )


def _find_days(text: str) -> str | None:
    m = re.search(r"(\d+)\s*(?:calendar\s+)?days", text, re.IGNORECASE)
    return f"{m.group(1)} days" if m else None


def _find_date(text: str) -> str | None:
    # "20th April, 2026 at 1200hrs"
    m = re.search(
        r"(\d{1,2}(?:st|nd|rd|th)?\s+\w+,?\s+\d{4}"
        r"\s*(?:at\s+\d{1,4}\s*(?:[.:]?\d{0,2})?\s*(?:hrs?|hours?|am|pm|Hrs)?)?)",
        text, re.IGNORECASE,
    )
    if m:
        return m.group(1).strip()
    # "dd/mm/yyyy HH:MM"
    m = re.search(r"(\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2})", text)
    if m:
        return m.group(1).strip()
    return None


# ══════════════════════════════════════════════════════════════════════════════
#  BID BOND AMOUNT EXTRACTOR (Updated & Robust)
# ══════════════════════════════════════════════════════════════════════════════

def _extract_kes_amount(raw: str) -> str | None:
    """Robust KES amount extractor for Kenyan tenders - handles PDF noise, words, brackets, etc."""
    if not raw:
        return None

    text = _norm(raw)

    # Skip templates
    if re.search(r"\[insert|\<insert|fill\s+in|xxx+", text, re.IGNORECASE):
        return None

    # Context filter
    if re.search(r"(shareholding|equity|authorized\s+capital)", text, re.IGNORECASE):
        return None

    # Percentage-based
    pct = re.search(
        r"(\d+(?:\.\d+)?)\s*%\s*(?:of\s+(?:the\s+)?(?:tender|bid|contract)|bid\s+bond|tender\s+security)",
        text, re.IGNORECASE
    )
    if pct:
        return f"{pct.group(1)}% of Tender Sum"

    # Bracket numeric (very common)
    m = re.search(r"\(([\d,]+\.\d{2})\)", text)
    if m:
        return f"KES {m.group(1)}"

    # Worded amounts
    if re.search(r"one\s+hundred\s+thousand", text, re.IGNORECASE):
        return "KES 100,000.00"
    if re.search(r"twenty\s+thousand", text, re.IGNORECASE):
        return "KES 20,000.00"

    # Numeric - Extremely flexible to handle PDF spacing and punctuation
    m = re.search(
        r"(?:KES|KSH|Kshs?|Kes\.?|Ksh\.?|Kenya\s+Shillings?)[^\d]{0,40}"
        r"([\d][\d,\s]{0,40}(?:\.\d{1,2})?)",
        text, re.IGNORECASE
    )
    if m:
        raw_num = m.group(1).strip()
        cleaned = re.sub(r"\s+", "", raw_num)      # Fix broken spacing like "1 0 0 , 0 0 0"
        cleaned = re.sub(r",", "", cleaned)        # Remove commas

        if cleaned.isdigit() and len(cleaned) >= 4:
            val = int(cleaned)
            if 5000 <= val <= 50_000_000:          # Reasonable range for tender security
                return f"KES {val:,.2f}"

    return None

def _extract_bond_form(text: str) -> str | None:
    """Return a clean bond form string from surrounding text."""
    low = text.lower()
    if "unconditional bank guarantee" in low:
        return "Unconditional Bank Guarantee"
    if "banker" in low and "cheque" in low:
        return "Banker's Cheque"
    if "bank guarantee" in low:
        return "Bank Guarantee"
    if "insurance" in low and ("guarantee" in low or "company" in low):
        return "Bank/Insurance Guarantee"
    if "tender bond" in low:
        return "Tender Bond"
    if "bid bond" in low:
        return "Bid Bond"
    if "tender-securing declaration" in low or "tender securing declaration" in low:
        return "Tender-Securing Declaration"
    return None


# ══════════════════════════════════════════════════════════════════════════════
#  SECTION 1 – KEY REQUIREMENTS
# ══════════════════════════════════════════════════════════════════════════════

def _parse_key_requirements(text: str) -> dict[str, Any]:
    result: dict[str, Any] = {}
    tds        = _tds_text(text)
    invitation = _invitation_text(text)

    _parse_bid_bond(result, tds, invitation, text)
    _parse_bid_validity(result, tds, invitation, text)
    _parse_bond_validity(result, tds, invitation, text)
    _parse_submission_deadline(result, tds, invitation, text)
    _parse_submission_method(result, tds, invitation, text)
    _parse_prebid_meeting(result, tds, invitation, text)
    _parse_clarification_deadline(result, text)
    _parse_site_visit(result, text)
    _parse_bid_copies(result, tds, text)

    return result


# ── Bid bond ──────────────────────────────────────────────────────────────────

def _parse_bid_bond(result: dict, tds: str, invitation: str, text: str) -> None:
    """Parse bid bond / tender security - Now much more robust."""

    def _is_not_required(window: str) -> bool:
        low = window.lower()
        not_patterns = [
            r"tender\s+security\s+shall\s+not\s+be\s+required",
            r"no\s+tender\s+security\s+(?:is\s+)?required",
            r"tender\s+security\s+is\s+not\s+required",
        ]
        if any(re.search(p, low) for p in not_patterns):
            # Safety: do NOT mark as "Not Required" if amount is mentioned
            if re.search(r"(100,?000|20,?000|one\s+hundred|twenty\s+thousand|kes\.?\s*\d)", low):
                return False
            return True
        return False

    TRIGGERS = ["tender security", "bid security", "bid bond", "tender bond", "tender-securing"]
    SKIP_LINES = ["shall furnish", "shall be forfeited", "shall be returned", "form of", "template"]

    for source in [tds, invitation, text]:
        if not source:
            continue

        lines = source.split("\n")
        for i, line in enumerate(lines):
            low = line.lower()

            if not any(k in low for k in TRIGGERS):
                continue
            if any(s in low for s in SKIP_LINES):
                continue

            window = _ctx(lines, i, 20)   # Slightly larger window

            # Critical context filter
            if re.search(r"(shareholding|total\s*=|%\s*share)", window, re.IGNORECASE):
                continue

            amt = _extract_kes_amount(window)

            if not amt and _is_not_required(window):
                result["bid_bond_amount"] = "Tender Security Not Required"
                result["bid_bond_form"] = "Tender-Securing Declaration"
                return

            if amt and not result.get("bid_bond_amount"):
                result["bid_bond_amount"] = amt

            if not result.get("bid_bond_form"):
                form = _extract_bond_form(window)
                if form:
                    result["bid_bond_form"] = form

        if result.get("bid_bond_amount"):
            return

    # Dedicated section fallback
    if not result.get("bid_bond_amount"):
        sec = _extract_section(
            text,
            start_kw=["tender security", "bid security", "bid bond"],
            end_kw=["tender validity", "bid validity", "instruction to tenderer"],
            max_chars=4000,
        )
        if sec:
            flat = _norm(sec)
            amt = _extract_kes_amount(flat)
            if amt:
                result["bid_bond_amount"] = amt
            if not result.get("bid_bond_form"):
                result["bid_bond_form"] = _extract_bond_form(flat)


# ── Bid validity ──────────────────────────────────────────────────────────────

def _parse_bid_validity(result: dict, tds: str, invitation: str, text: str) -> None:
    for source in [tds, invitation]:
        if not source:
            continue
        lines = source.split("\n")
        for i, line in enumerate(lines):
            low = line.lower()
            if ("validity period" in low and "shall be" in low) or "itt 17.1" in low:
                days = _find_days(_ctx(lines, i, 3))
                if days:
                    result["bid_validity_period"] = days
                    return

    for source in [invitation, text]:
        if not source:
            continue
        m = re.search(
            r"(?:remain\s+)?valid\s+for\s+(?:[\w\s]+\()?\s*(\d+)\s*\)?\s*days",
            _norm(source), re.IGNORECASE,
        )
        if m:
            result["bid_validity_period"] = f"{m.group(1)} days"
            return

    lines = text.split("\n")
    for i, line in enumerate(lines):
        low = line.lower()
        if ("bid validity" in low or "tender validity" in low or
                ("validity" in low and "period" in low)):
            if "shall furnish" in low or "shall be extended" in low:
                continue
            days = _find_days(_ctx(lines, i, 4))
            if days:
                result["bid_validity_period"] = days
                return


# ── Bond validity ─────────────────────────────────────────────────────────────

def _parse_bond_validity(result: dict, tds: str, invitation: str, text: str) -> None:
    for source in [tds, invitation, text]:
        if not source:
            continue
        lines = source.split("\n")
        for i, line in enumerate(lines):
            low = line.lower()
            if ("security" in low or "bond" in low) and "valid" in low and "day" in low:
                days = _find_days(_ctx(lines, i, 3))
                if days and days != result.get("bid_validity_period"):
                    result["bid_bond_validity"] = days
                    return


# ── Submission deadline ───────────────────────────────────────────────────────

def _parse_submission_deadline(result: dict, tds: str, invitation: str, text: str) -> None:
    if tds:
        lines = tds.split("\n")
        for i, line in enumerate(lines):
            low = line.lower()
            if "deadline" in low and ("submission" in low or "tender" in low):
                d = _find_date(_ctx(lines, i, 4))
                if d:
                    result["submission_deadline"] = d
                    return

    for source in [invitation, text]:
        if not source:
            continue
        m = re.search(
            r"on\s+or\s+before\s+(\d{1,2}(?:st|nd|rd|th)?\s+\w+,?\s+\d{4}"
            r"\s*(?:at\s+\d{1,4}\s*(?:[.:]?\d{0,2})?\s*(?:hrs?|hours?|am|pm|Hrs)?)?)",
            _norm(source), re.IGNORECASE,
        )
        if m:
            result["submission_deadline"] = m.group(1).strip()
            return

    lines = text.split("\n")
    for i, line in enumerate(lines):
        low = line.lower()
        if "closing date" in low or "submission deadline" in low or "closing time" in low:
            d = _find_date(_ctx(lines, i, 4))
            if d:
                result["submission_deadline"] = d
                return


# ── Submission method ─────────────────────────────────────────────────────────

def _parse_submission_method(result: dict, tds: str, invitation: str, text: str) -> None:
    for source in [invitation, tds]:
        if not source:
            continue
        low_src = source.lower()
        if "tender box" in low_src or "deposited in" in low_src:
            result["submission_method"] = "Physical (Tender Box)"
            return
        if "submitted electronically" in low_src or "e-procurement" in low_src:
            result["submission_method"] = "Electronic"
            return

    if tds:
        lines = tds.split("\n")
        for i, line in enumerate(lines):
            low = line.lower()
            if "electronic" in low and ("submission" in low or "tendering" in low):
                ctx = _ctx(lines, i, 3).lower()
                if "n/a" in ctx or "not applicable" in ctx:
                    result["submission_method"] = "Physical"
                    return
                result["submission_method"] = "Electronic"
                return

    lines = text.split("\n")
    for i, line in enumerate(lines):
        low = line.lower()
        if "tender box" in low:
            result["submission_method"] = "Physical (Tender Box)"
            return
    for i, line in enumerate(lines):
        low = line.lower()
        if "submission" in low and any(k in low for k in ["electronic", "physical", "manual"]):
            if "electronic" in low and ("not" in low or "n/a" in low):
                result["submission_method"] = "Physical"
            elif "electronic" in low:
                result["submission_method"] = "Electronic"
            elif "physical" in low:
                result["submission_method"] = "Physical"
            return


# ── Pre-bid meeting ───────────────────────────────────────────────────────────

def _parse_prebid_meeting(result: dict, tds: str, invitation: str, text: str) -> None:
    for source in [tds, invitation, text]:
        if not source:
            continue
        lines = source.split("\n")
        for i, line in enumerate(lines):
            low = line.lower()
            if not any(k in low for k in [
                "pre-bid", "prebid", "pre bid",
                "pre-tender", "pretender", "site visit meeting",
            ]):
                continue
            window = _ctx(lines, i, 8)

            if not result.get("pre_bid_meeting_date"):
                d = _find_date(window)
                if d:
                    result["pre_bid_meeting_date"] = d

            if not result.get("pre_bid_meeting_link"):
                link_m = re.search(r"(https?://\S+)", window)
                if link_m:
                    result["pre_bid_meeting_link"] = link_m.group(1).rstrip(".,;)")

        if result.get("pre_bid_meeting_date"):
            return


# ── Clarification deadline ────────────────────────────────────────────────────

def _parse_clarification_deadline(result: dict, text: str) -> None:
    lines = text.split("\n")
    for i, line in enumerate(lines):
        low = line.lower()
        if "clarification" in low and any(k in low for k in [
            "deadline", "latest", "last date", "not later than"
        ]):
            window = _ctx(lines, i, 4)
            d = _find_date(window)
            if d:
                result["clarification_deadline"] = d
                return
            m = re.search(
                r"(\d+)\s*(?:\(\d+\))?\s*days?\s*(?:prior|before)",
                window, re.IGNORECASE,
            )
            if m:
                result["clarification_deadline"] = f"{m.group(1)} days before closing"
                return


# ── Site visit ────────────────────────────────────────────────────────────────

def _parse_site_visit(result: dict, text: str) -> None:
    result["mandatory_site_visit"] = False
    lines = text.split("\n")
    for i, line in enumerate(lines):
        low = line.lower()
        if "site visit" in low or "site inspection" in low:
            ctx = _ctx(lines, i, 4).lower()
            if "mandatory" in ctx or "compulsory" in ctx or "required" in ctx:
                result["mandatory_site_visit"] = True
            return


# ── Bid copies ────────────────────────────────────────────────────────────────

def _parse_bid_copies(result: dict, tds: str, text: str) -> None:
    for source in [tds, text]:
        if not source:
            continue
        lines = source.split("\n")
        for i, line in enumerate(lines):
            low = line.lower()
            if ("number of copies" in low or "itt 19" in low) and (
                "copies" in low or "copy" in low
            ):
                window = _ctx(lines, i, 3)
                m = re.search(r"copies\s+is\s*:\s*(.+?)(?:\s{2,}|$)", window, re.IGNORECASE)
                if m:
                    result["number_of_bid_copies"] = m.group(1).strip()[:100]
                    return
                m = re.search(r"(\d+)\s*(?:copies|copy)", window, re.IGNORECASE)
                if m:
                    result["number_of_bid_copies"] = m.group(1)
                    return
                if "not applicable" in window.lower():
                    result["number_of_bid_copies"] = "Not applicable"
                    return


# ══════════════════════════════════════════════════════════════════════════════
#  SECTION 2 – FINANCIAL QUALIFICATIONS
# ══════════════════════════════════════════════════════════════════════════════

def _financial_section(text: str) -> str:
    return _extract_section(
        text,
        start_kw=["evaluation and qualification", "qualification criteria",
                  "financial requirements", "financial qualification",
                  "financial evaluation"],
        end_kw=["section iv", "tendering forms", "tender forms",
                "section v", "bills of quantities"],
        max_chars=15_000,
    )


def _parse_financial_qualifications(text: str) -> dict[str, Any]:
    result: dict[str, Any] = {}
    fin = _financial_section(text)
    _parse_turnover(result, fin, text)
    _parse_liquid_assets(result, fin, text)
    _parse_single_contract(result, fin, text)
    _parse_combined_contract(result, fin, text)
    _parse_cash_flow(result, fin, text)
    _parse_audited_years(result, fin, text)
    return result


def _parse_turnover(result: dict, fin: str, text: str) -> None:
    for source in [fin, text]:
        if not source:
            continue
        lines = source.split("\n")
        for i, line in enumerate(lines):
            low = line.lower()
            if not ("annual turnover" in low or "average turnover" in low or
                    ("turnover" in low and ("minimum" in low or "average" in low))):
                continue
            window = _ctx(lines, i, 5)
            if "[insert" in window.lower():
                continue
            amt = _extract_kes_amount(window)
            if amt:
                result["min_annual_turnover"] = amt
                return
            m = re.search(r"turnover\s+of\s+(\d+)\s*million", window, re.IGNORECASE)
            if m:
                result["min_annual_turnover"] = f"KES {m.group(1)},000,000"
                return


def _parse_liquid_assets(result: dict, fin: str, text: str) -> None:
    for source in [fin, text]:
        if not source:
            continue
        lines = source.split("\n")
        for i, line in enumerate(lines):
            low = line.lower()
            if not ("liquid asset" in low or "line of credit" in low or
                    "available liquid" in low or
                    ("working capital" in low and "minimum" in low)):
                continue
            window = _ctx(lines, i, 5)
            if re.search(r"\[insert|\[kenya", window, re.IGNORECASE):
                continue
            amt = _extract_kes_amount(window)
            if amt:
                result["min_liquid_assets"] = amt
                return


def _parse_single_contract(result: dict, fin: str, text: str) -> None:
    for source in [fin, text]:
        if not source:
            continue
        lines = source.split("\n")
        for i, line in enumerate(lines):
            low = line.lower()
            if "single contract" in low and (
                "value" in low or "minimum" in low or "similar" in low
            ):
                window = _ctx(lines, i, 5)
                if "[insert" in window.lower():
                    continue
                amt = _extract_kes_amount(window)
                if amt:
                    result["min_single_contract_value"] = amt
                    return


def _parse_combined_contract(result: dict, fin: str, text: str) -> None:
    for source in [fin, text]:
        if not source:
            continue
        lines = source.split("\n")
        for i, line in enumerate(lines):
            low = line.lower()
            if not (("two" in low or "2" in low or "combined" in low) and
                    "contract" in low and ("minimum" in low or "similar" in low)):
                continue
            window = _ctx(lines, i, 5)
            if "[insert" in window.lower():
                continue
            amt = _extract_kes_amount(window)
            if amt:
                result["min_combined_contract_value"] = amt
                return


def _parse_cash_flow(result: dict, fin: str, text: str) -> None:
    for source in [fin, text]:
        if not source:
            continue
        lines = source.split("\n")
        for i, line in enumerate(lines):
            low = line.lower()
            if "cash flow" not in low and "cashflow" not in low:
                continue
            if "minimum" not in low and "require" not in low:
                continue
            window = _ctx(lines, i, 5)
            if "[insert" in window.lower():
                continue
            amt = _extract_kes_amount(window)
            if amt:
                result["cash_flow_requirement"] = amt
                return


def _parse_audited_years(result: dict, fin: str, text: str) -> None:
    for source in [fin, text]:
        if not source:
            continue
        lines = source.split("\n")
        for i, line in enumerate(lines):
            low = line.lower()
            if "audited" not in low:
                continue
            if not any(k in low for k in ["financial", "accounts", "statement", "record"]):
                continue
            window = _ctx(lines, i, 8)
            if "[insert" in window.lower():
                continue
            m = re.search(
                r"(?:last|past|previous)?\s*(\d+)\s*(?:financial\s+)?years?",
                window, re.IGNORECASE,
            )
            if m:
                result["audited_financials_years"] = f"{m.group(1)} years"
                return
            year_matches = re.findall(r"(20\d{2})", window)
            if len(year_matches) >= 2:
                unique = sorted(set(year_matches))
                result["audited_financials_years"] = (
                    f"{len(unique)} years ({', '.join(unique)})"
                )
                return


# ══════════════════════════════════════════════════════════════════════════════
#  SECTION 3 – KEY PERSONNEL
# ══════════════════════════════════════════════════════════════════════════════

_PERSONNEL_SECTION_START = [
    "key personnel", "personnel schedule", "key staff", "staff schedule",
    "key experts", "proposed personnel", "professional staff",
    "contractor's representative and key personnel",
    "team staffing", "staffing plan", "staffing requirements",
]
_PERSONNEL_SECTION_END = [
    "key equipment", "plant and equipment", "form equ",
    "section v", "activity schedule",
]
_ROLE_KEYWORDS = [
    "project manager", "site engineer", "resident engineer", "engineer",
    "supervisor", "foreman", "quantity surveyor", "architect", "designer",
    "quality", "health", "safety", "environmental", "electrical",
    "mechanical", "civil", "structural", "social", "procurement",
    "contract manager", "team leader", "expert", "specialist", "officer",
    "coordinator", "director", "manager", "consultant", "analyst",
    "planner", "programmer", "developer", "accountant", "surveyor",
    "inspector", "administrator",
]
_PERSONNEL_SKIP = [
    "shall", "tenderer", "bidder", "must be provided", "invited",
    "obtained", "submitted", "s/no", "yes/no", "mandatory",
    "preliminary", "criteria", "evaluation", "checklist",
    "total score", "percentage",
]
_REG_BODIES = [
    "EBK", "IEK", "BORAQS", "NEMA", "NCA", "KISM", "ICPAK",
    "LSK", "IQSK", "ISK", "ERB", "KICE",
]


def _parse_key_personnel(text: str) -> list[dict[str, Any]]:
    personnel: list[dict[str, Any]] = []

    section = _extract_section(text, _PERSONNEL_SECTION_START,
                               _PERSONNEL_SECTION_END, max_chars=10_000)
    if not section or "not applicable" in section.lower()[:200]:
        return personnel

    # Strategy 1: numbered subsections (X.X.X.X. Role Name)
    subs = re.findall(
        r"(?:^|\n)\s*\d+\.\d+\.\d+(?:\.\d+)?\.?\s+(.+?)"
        r"(?=\n\s*\d+\.\d+\.\d+(?:\.\d+)?\.?\s|\Z)",
        section, re.DOTALL,
    )
    if subs:
        for block in subs:
            e = _parse_personnel_block(block)
            if e:
                personnel.append(e)
        if personnel:
            return personnel

    # Strategy 2: numbered list (1. Role ...)
    rows = re.findall(
        r"(?:^|\n)\s*\d+\.?\s*(.+?)(?=\n\s*\d+\.?\s|\n\s*$|\Z)",
        section, re.DOTALL,
    )
    for row in rows:
        if len(row.strip()) < 10:
            continue
        e = _parse_personnel_block(row)
        if e:
            personnel.append(e)
    if personnel:
        return personnel

    # Strategy 3: line-by-line scan for role keywords
    lines = section.split("\n")
    for i, line in enumerate(lines):
        stripped = line.strip()
        if not stripped or len(stripped) < 4:
            continue
        low = stripped.lower()
        if any(skip in low for skip in _PERSONNEL_SKIP):
            continue
        if not any(rk in low for rk in _ROLE_KEYWORDS):
            continue
        block = "\n".join(lines[i: min(len(lines), i + 6)])
        e = _parse_personnel_block(block)
        if e:
            personnel.append(e)

    return personnel


def _parse_personnel_block(block: str) -> dict[str, Any] | None:
    entry: dict[str, Any] = {}

    first_line = block.strip().split("\n")[0].strip()
    role_text = re.sub(r"\s*[-–]\s*$", "", first_line).strip()
    if 5 <= len(role_text) < 200:
        entry["role"] = role_text

    role_low = (entry.get("role") or "").lower()
    if any(sw in role_low for sw in _PERSONNEL_SKIP):
        return None

    # Qualification
    qual_m = re.search(
        r"(?:bachelor|master|diploma|degree|phd|bsc|msc|b\.?sc|m\.?sc|hnd)"
        r"\s*'?s?\s*(?:in\s+)?([^,.\n]{0,100})",
        block, re.IGNORECASE,
    )
    if qual_m:
        entry["qualification"] = qual_m.group(0).strip()

    # Professional certifications
    certs = re.findall(
        r"\b(PMP|PRINCE2|CCNA|CCNP|CCDA|CCDP|CIPP|CISM|CISSP|ITIL|"
        r"CPA|ACCA|CISA|MCSE|OCP|AWS|Azure|TOGAF)\b",
        block, re.IGNORECASE,
    )
    if certs:
        cert_str = ", ".join(c.upper() for c in certs)
        if entry.get("qualification"):
            entry["qualification"] += f" + {cert_str}"
        else:
            entry["qualification"] = cert_str

    # Experience years
    exp_m = re.search(
        r"(?:(\d+)\s*(?:\+\s*)?(?:\(\d+\)\s*)?|"
        r"(?:one|two|three|four|five|six|seven|eight|nine|ten)\s*\((\d+)\)\s*)"
        r"years?\s*(?:of\s+)?(?:experience|relevant|similar|professional|working)?",
        block, re.IGNORECASE,
    )
    if exp_m:
        yrs = exp_m.group(1) or exp_m.group(2)
        if yrs:
            entry["experience_years"] = int(yrs)

    # Number required
    num_m = re.search(
        r"(?:number|no\.?\s*required|quantity)\s*[:\-]?\s*(\d+)",
        block, re.IGNORECASE,
    )
    if num_m:
        entry["number_required"] = int(num_m.group(1))

    # Registration body
    for body in _REG_BODIES:
        if body in block.upper():
            entry["registration_body"] = body
            break
    if not entry.get("registration_body"):
        reg_m = re.search(r"registered?\s+(?:with|by)\s+([A-Z]{2,10})", block)
        if reg_m:
            entry["registration_body"] = reg_m.group(1)

    has_attr = (
        entry.get("qualification") or entry.get("experience_years")
        or entry.get("registration_body") or entry.get("number_required")
    )
    if has_attr and (entry.get("role") or entry.get("qualification")):
        return entry
    return None


# ══════════════════════════════════════════════════════════════════════════════
#  SECTION 4 – KEY EQUIPMENT
# ══════════════════════════════════════════════════════════════════════════════

_EQUIPMENT_SECTION_START = [
    "key equipment", "plant and equipment", "equipment required",
    "major equipment", "equipment schedule", "construction equipment",
    "plant/equipment",
]
_EQUIPMENT_SECTION_END = [
    "section v", "activity schedule", "specifications",
    "section vi", "bill of quantities", "key personnel",
]
_EQUIPMENT_SKIP = [
    "shall", "tenderer", "bidder", "must be", "invited", "obtained",
    "downloaded", "addressed", "submitted", "conducted", "sealed",
    "eligible", "information", "strictly", "deadline", "opened",
    "rejected", "completed", "standardized", "documents marked",
    "kenya revenue", "commissioner", "viewed at", "/202", "kra/",
    "evaluation", "examination", "compliance", "certificate",
    "s/no", "yes/no", "copy of", "mandatory", "preliminary",
    "registration", "incorporation", "document", "criteria",
    "litigation", "declaration", "responsiveness", "checklist",
    "qualification", "stage", "total score", "percentage", "points",
    "any goods", "works and", "processes", "commodities",
    "raw material", "industrial",
]


def _parse_key_equipment(text: str) -> list[dict[str, Any]]:
    equipment: list[dict[str, Any]] = []

    section = _extract_section(text, _EQUIPMENT_SECTION_START,
                               _EQUIPMENT_SECTION_END, max_chars=8_000)
    if not section or "not applicable" in section.lower()[:200]:
        return equipment

    # Strategy 1: table with "Equipment Type" header
    th = re.search(r"equipment\s+type\s+(?:and\s+)?(?:characteristics?)?",
                   section, re.IGNORECASE)
    if th:
        for row_line in section[th.start():].split("\n")[1:]:
            stripped = row_line.strip()
            if not stripped or len(stripped) < 3:
                continue
            if any(stop in stripped.lower() for stop in [
                "qualification", "stage", "checklist", "mandatory",
                "s/no", "yes/no", "total"
            ]):
                break
            e = _parse_equipment_line(stripped)
            if e:
                equipment.append(e)
        if equipment:
            return equipment

    # Strategy 2: numbered list
    rows = re.findall(
        r"(?:^|\n)\s*\d+\.?\s*(.+?)(?=\n\s*\d+\.?\s|\n\s*$|\Z)",
        section, re.DOTALL,
    )
    for row in rows:
        if len(row.strip()) < 5:
            continue
        e = _parse_equipment_line(row)
        if e:
            equipment.append(e)

    return equipment


def _parse_equipment_line(row: str) -> dict[str, Any] | None:
    entry: dict[str, Any] = {}
    first_line = row.strip().split("\n")[0].strip()
    if len(first_line) < 3 or len(first_line) > 150:
        return None
    if any(sw in first_line.lower() for sw in _EQUIPMENT_SKIP):
        return None

    entry["equipment_type"] = first_line

    qty_m = re.search(
        r"(?:quantity|no\.?|number|minimum)\s*[:\-]?\s*(\d+)",
        row, re.IGNORECASE,
    )
    if qty_m:
        entry["min_quantity"] = int(qty_m.group(1))
    else:
        qty_m = re.search(r"(\d+)\s*(?:nos?\.?|units?|pieces?|sets?)", row, re.IGNORECASE)
        if qty_m:
            entry["min_quantity"] = int(qty_m.group(1))

    low = row.lower()
    if "own" in low:
        entry["ownership_requirement"] = "Owned"
    elif "lease" in low:
        entry["ownership_requirement"] = "Owned or Leased"
    elif "hire" in low:
        entry["ownership_requirement"] = "Owned or Hired"

    return entry


# ══════════════════════════════════════════════════════════════════════════════
#  RAW SECTION EXTRACTION  (for storage / debugging)
# ══════════════════════════════════════════════════════════════════════════════

def _raw_section(text: str, start_kw: list[str], end_kw: list[str],
                 max_chars: int = 5_000) -> str:
    lines = text.split("\n")
    in_sec = False
    out: list[str] = []
    count = 0
    for line in lines:
        low = line.lower().strip()
        if "....." in line or re.match(r".*\.{4,}\s*\d+\s*$", line):
            continue
        if not in_sec:
            if any(k in low for k in start_kw):
                in_sec = True
                out.append(line)
                count += len(line)
        else:
            if any(k in low for k in end_kw):
                break
            out.append(line)
            count += len(line)
            if count > max_chars:
                break
    return "\n".join(out).strip()


# ══════════════════════════════════════════════════════════════════════════════
#  PUBLIC API
# ══════════════════════════════════════════════════════════════════════════════

def parse_tender_document(url: str) -> dict[str, Any]:
    """Download and parse a tender document URL.

    Returns a dict with keys
    ─────────────────────────
    Key requirements
        bid_bond_amount         str | None   e.g. "KES 1,000,000.00" /
                                             "2% of Tender Sum" /
                                             "Tender Security Not Required"
        bid_bond_form           str | None
        bid_bond_validity       str | None   e.g. "30 days"
        bid_validity_period     str | None   e.g. "120 days"
        submission_deadline     str | None
        submission_method       str | None
        pre_bid_meeting_date    str | None
        pre_bid_meeting_link    str | None
        clarification_deadline  str | None
        mandatory_site_visit    bool
        number_of_bid_copies    str | None

    Financial qualifications
        min_annual_turnover           str | None
        min_liquid_assets             str | None
        min_single_contract_value     str | None
        min_combined_contract_value   str | None
        cash_flow_requirement         str | None
        audited_financials_years      str | None

    Structured lists
        key_personnel    list[dict]
        key_equipment    list[dict]

    Raw text sections
        key_requirements_raw          str
        financial_qualifications_raw  str
        key_personnel_raw             str
        key_equipment_raw             str

    Metadata
        document_parsed     bool
        parsed_document_url str
        parse_error         str | None
    """
    result: dict[str, Any] = {
        "document_parsed": False,
        "parsed_document_url": url,
        "parse_error": None,
    }

    try:
        log.info("Downloading: %s", url)
        full_text = download_and_extract_text(url)

        if not full_text or len(full_text.strip()) < 100:
            result["parse_error"] = "No text extracted from document"
            return result

        log.info("Extracted %d characters", len(full_text))

        result.update(_parse_key_requirements(full_text))
        result.update(_parse_financial_qualifications(full_text))
        result["key_personnel"] = _parse_key_personnel(full_text)
        result["key_equipment"] = _parse_key_equipment(full_text)

        result["key_requirements_raw"] = _raw_section(
            full_text,
            start_kw=["instruction to tenderer", "section i", "tender data sheet",
                      "bid data sheet", "particular conditions"],
            end_kw=["section ii", "evaluation criteria",
                    "qualification criteria", "section iii"],
        )
        result["financial_qualifications_raw"] = _raw_section(
            full_text,
            start_kw=["financial", "evaluation and qualification",
                      "qualification criteria", "section iii"],
            end_kw=["section iv", "tendering forms", "tender forms", "key personnel"],
        )
        result["key_personnel_raw"] = _raw_section(
            full_text,
            start_kw=["key personnel", "personnel schedule", "key staff",
                      "staff schedule", "key experts"],
            end_kw=["key equipment", "plant and equipment", "form equ",
                    "section v", "activity schedule"],
        )
        result["key_equipment_raw"] = _raw_section(
            full_text,
            start_kw=["key equipment", "plant and equipment",
                      "equipment schedule", "form equ"],
            end_kw=["section v", "activity schedule", "specifications",
                    "section vi", "bill of quantities"],
        )

        result["document_parsed"] = True
        log.info("Parsed successfully: %s", url)

    except Exception as exc:
        log.exception("Error parsing %s", url)
        result["parse_error"] = str(exc)[:2_000]

    return result
