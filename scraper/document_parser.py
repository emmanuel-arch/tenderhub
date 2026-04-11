"""Tender document PDF/ZIP parser.

Downloads tender documents (PDFs or ZIPs containing PDFs), extracts text,
and parses four core sections:

1. KEY REQUIREMENTS – bid bond, validity, submission, pre-bid, site visit
2. FINANCIAL QUALIFICATION THRESHOLDS – turnover, liquid assets, contracts
3. KEY PERSONNEL REQUIRED – roles, qualifications, experience
4. KEY EQUIPMENT REQUIRED – types, quantities, ownership
"""
from __future__ import annotations

import io
import logging
import os
import re
import tempfile
import warnings
import zipfile
from datetime import datetime
from typing import Any

import fitz  # PyMuPDF
import pdfplumber
import requests

log = logging.getLogger(__name__)

warnings.filterwarnings("ignore", message="Unverified HTTPS request")

_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)
_TIMEOUT = 60


# ── PDF text extraction ───────────────────────────────────────────────────────

def _extract_text_pymupdf(data: bytes) -> str:
    """Extract text using PyMuPDF (fast primary extractor)."""
    text_parts: list[str] = []
    try:
        with fitz.open(stream=data, filetype="pdf") as doc:
            for page in doc:
                text_parts.append(page.get_text())
    except Exception as exc:
        log.debug("PyMuPDF failed: %s", exc)
    return "\n".join(text_parts)


def _extract_text_pdfplumber(data: bytes) -> str:
    """Extract text using pdfplumber (fallback, better for tables)."""
    text_parts: list[str] = []
    try:
        with pdfplumber.open(io.BytesIO(data)) as pdf:
            for page in pdf.pages:
                try:
                    page_text = page.extract_text() or ""
                    text_parts.append(page_text)
                except Exception:
                    continue
    except Exception as exc:
        log.warning("pdfplumber failed: %s", exc)
    return "\n".join(text_parts)


def _extract_text_from_pdf_bytes(data: bytes) -> str:
    """Extract all text from a PDF byte stream.

    Tries PyMuPDF first (faster). Falls back to pdfplumber if result is empty.
    """
    text = _extract_text_pymupdf(data)
    if text.strip():
        return text
    log.debug("PyMuPDF returned empty text, falling back to pdfplumber")
    return _extract_text_pdfplumber(data)


def _extract_text_from_zip_bytes(data: bytes) -> str:
    """Extract text from all PDFs inside a ZIP archive."""
    text_parts: list[str] = []
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as zf:
            for name in zf.namelist():
                if name.lower().endswith(".pdf"):
                    pdf_bytes = zf.read(name)
                    pdf_text = _extract_text_from_pdf_bytes(pdf_bytes)
                    if pdf_text.strip():
                        text_parts.append(pdf_text)
    except zipfile.BadZipFile:
        log.warning("Not a valid ZIP file")
    except Exception as exc:
        log.warning("ZIP extraction failed: %s", exc)
    return "\n".join(text_parts)


def download_and_extract_text(url: str) -> str:
    """Download a document URL and return extracted text.

    Handles:
    - Direct PDF files
    - ZIP archives containing PDFs
    """
    if not url or not url.startswith("http"):
        return ""

    try:
        resp = requests.get(url, headers={"User-Agent": _UA}, timeout=_TIMEOUT, verify=False)
        resp.raise_for_status()
    except requests.RequestException as exc:
        log.warning("Download failed for %s: %s", url, exc)
        return ""

    content = resp.content
    content_type = resp.headers.get("content-type", "").lower()

    # Detect file type by content-type header and magic bytes
    if content[:4] == b"%PDF":
        return _extract_text_from_pdf_bytes(content)
    elif content[:2] == b"PK" or "zip" in content_type:
        return _extract_text_from_zip_bytes(content)
    elif "pdf" in content_type:
        return _extract_text_from_pdf_bytes(content)
    else:
        # Try PDF first, fallback to ZIP
        text = _extract_text_from_pdf_bytes(content)
        if text.strip():
            return text
        text = _extract_text_from_zip_bytes(content)
        if text.strip():
            return text
        log.warning("Unrecognized document format from %s (content-type: %s)", url, content_type)
        return ""


# ── Section extraction helpers ────────────────────────────────────────────────

def _find_amount(text: str) -> str | None:
    """Extract a monetary amount like 'KES 3,000,000' or '3M' from text.
    Skips template placeholders like '[insert amount]'."""
    # Skip if it's a template placeholder
    if re.search(r'\[insert', text, re.IGNORECASE):
        return None
    # Pattern: KES/Kshs/Kenya Shillings followed by amount
    m = re.search(
        r'(?:KES|KSH|Kshs?|Kenya\s+Shillings?)\s*\.?\s*([\d,]+(?:\.\d+)?)',
        text, re.IGNORECASE
    )
    if m:
        return f"KES {m.group(1)}"
    # "X million" pattern
    m = re.search(r'(\d+)\s*million', text, re.IGNORECASE)
    if m:
        return f"KES {m.group(1)},000,000"
    # Bare large number
    m = re.search(r'([\d,]{4,}(?:\.\d+)?)', text)
    if m:
        return m.group(1)
    return None


def _find_days(text: str) -> str | None:
    """Extract a 'N days' duration."""
    m = re.search(r'(\d+)\s*(?:calendar\s+)?days', text, re.IGNORECASE)
    if m:
        return f"{m.group(1)} days"
    return None


def _find_date(text: str) -> str | None:
    """Extract a date pattern from text."""
    # "20th April, 2026 at 1200hrs" or "20th April 2026 at 12:00" or "at 1400hrs"
    m = re.search(
        r'(\d{1,2}(?:st|nd|rd|th)?\s+\w+,?\s+\d{4}\s*(?:at\s+\d{1,4}\s*(?:[.:]\d{2})?\s*(?:hrs?|hours?|AM|PM|am|pm|Hrs)?)?)' ,
        text, re.IGNORECASE
    )
    if m:
        return m.group(1).strip()
    # "dd/mm/yyyy HH:MM"
    m = re.search(r'(\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2})', text)
    if m:
        return m.group(1).strip()
    return None


def _get_context(lines: list[str], idx: int, window: int = 5) -> str:
    """Get surrounding lines as context for a match."""
    start = max(0, idx)
    end = min(len(lines), idx + window)
    return "\n".join(lines[start:end])


def _extract_section_text(text: str, start_keywords: list[str],
                          end_keywords: list[str], max_chars: int = 10000) -> str:
    """Extract a bounded section of text between keyword markers."""
    lines = text.split("\n")
    in_section = False
    section_lines: list[str] = []
    char_count = 0

    for line in lines:
        low = line.lower().strip()
        if "....." in line or re.match(r'.*\.{4,}\s*\d+\s*$', line):
            continue
        if not in_section:
            if any(k in low for k in start_keywords):
                in_section = True
                section_lines.append(line)
                char_count += len(line)
        else:
            if any(k in low for k in end_keywords):
                break
            section_lines.append(line)
            char_count += len(line)
            if char_count > max_chars:
                break
    return "\n".join(section_lines).strip()


def _get_tds_text(text: str) -> str:
    """Extract the Tender Data Sheet (TDS) section – has authoritative values."""
    return _extract_section_text(
        text,
        start_keywords=["tender data sheet", "appendix to instruction"],
        end_keywords=["section iii", "evaluation and qualification", "evaluation criteria"],
        max_chars=15000,
    )


def _get_invitation_text(text: str) -> str:
    """Extract the Invitation to Tender section – front-page summary."""
    return _extract_section_text(
        text,
        start_keywords=["invitation to tender", "invites sealed"],
        end_keywords=["part 1", "tendering procedures", "section i", "instructions to tenderer"],
        max_chars=8000,
    )


# ── Section 1: KEY REQUIREMENTS ──────────────────────────────────────────────

def _parse_key_requirements(text: str) -> dict[str, Any]:
    """Extract key requirements from tender document text.

    Strategy: Parse TDS first (authoritative), then Invitation, then full text.
    """
    result: dict[str, Any] = {}

    tds = _get_tds_text(text)
    invitation = _get_invitation_text(text)

    # -- Bid bond / tender security amount and form --
    _parse_bid_bond(result, tds, invitation, text)

    # -- Bid validity period (from TDS: "ITT 17.1 ... N days") --
    _parse_bid_validity(result, tds, invitation, text)

    # -- Bid bond validity --
    _parse_bond_validity(result, tds, invitation, text)

    # -- Submission deadline --
    _parse_submission_deadline(result, tds, invitation, text)

    # -- Submission method --
    _parse_submission_method(result, tds, invitation, text)

    # -- Pre-bid / pre-tender meeting --
    _parse_prebid_meeting(result, tds, invitation, text)

    # -- Clarification deadline --
    _parse_clarification_deadline(result, text)

    # -- Mandatory site visit --
    _parse_site_visit(result, text)

    # -- Number of bid copies --
    _parse_bid_copies(result, tds, text)

    return result


def _parse_bid_bond(result: dict, tds: str, invitation: str, text: str):
    """Parse bid bond amount and form from TDS → invitation → full text."""
    for source in [tds, invitation, text]:
        if not source:
            continue
        lines = source.split("\n")
        for i, line in enumerate(lines):
            low = line.lower()
            if not any(k in low for k in ["tender security", "bid security", "bid bond"]):
                continue
            # Skip generic instructions like "18.1 The Tenderer shall furnish..."
            if "shall furnish" in low or "shall be forfeited" in low or "shall be returned" in low:
                continue
            if "form of tender security" in low:
                continue

            ctx = _get_context(lines, i, 8)

            if not result.get("bid_bond_amount"):
                amt = _find_amount(ctx)
                if amt:
                    result["bid_bond_amount"] = amt

            if not result.get("bid_bond_form"):
                for form_type in ["bank guarantee", "insurance guarantee",
                                  "unconditional bank guarantee", "tender bond",
                                  "bid bond", "tender-securing declaration"]:
                    if form_type in ctx.lower():
                        result["bid_bond_form"] = form_type.title()
                        break

        if result.get("bid_bond_amount"):
            break


def _parse_bid_validity(result: dict, tds: str, invitation: str, text: str):
    """Parse bid validity period. TDS has 'ITT 17.1 ... N days'."""
    # TDS: look for "ITT 17" or "validity period shall be N days"
    for source in [tds, invitation]:
        if not source:
            continue
        lines = source.split("\n")
        for i, line in enumerate(lines):
            low = line.lower()
            if ("validity period" in low and "shall be" in low) or "itt 17.1" in low:
                ctx = _get_context(lines, i, 3)
                days = _find_days(ctx)
                if days:
                    result["bid_validity_period"] = days
                    return

    # Invitation: "valid for One Hundred and Twenty (120) days"
    for source in [invitation, text]:
        if not source:
            continue
        m = re.search(
            r'(?:remain\s+)?valid\s+for\s+(?:[\w\s]+\()?\s*(\d+)\s*\)?\s*days',
            source, re.IGNORECASE
        )
        if m:
            result["bid_validity_period"] = f"{m.group(1)} days"
            return

    # Fallback: first mention of "bid/tender validity" near a number
    lines = text.split("\n")
    for i, line in enumerate(lines):
        low = line.lower()
        if ("bid validity" in low or "tender validity" in low or
                ("validity" in low and "period" in low)):
            if "shall furnish" in low or "shall be extended" in low:
                continue
            ctx = _get_context(lines, i, 4)
            days = _find_days(ctx)
            if days:
                result["bid_validity_period"] = days
                return


def _parse_bond_validity(result: dict, tds: str, invitation: str, text: str):
    """Parse bid bond/security validity (separate from bid validity)."""
    for source in [tds, invitation, text]:
        if not source:
            continue
        lines = source.split("\n")
        for i, line in enumerate(lines):
            low = line.lower()
            if ("security" in low or "bond" in low) and "valid" in low and "day" in low:
                ctx = _get_context(lines, i, 3)
                days = _find_days(ctx)
                if days and days != result.get("bid_validity_period"):
                    result["bid_bond_validity"] = days
                    return


def _parse_submission_deadline(result: dict, tds: str, invitation: str, text: str):
    """Parse submission deadline. TDS has 'ITT 21.1 ... date'."""
    # TDS: "The deadline for Tender submission is: 20th April, 2026 at 1200hrs"
    if tds:
        lines = tds.split("\n")
        for i, line in enumerate(lines):
            low = line.lower()
            if "deadline" in low and ("submission" in low or "tender" in low) and "itt 21" in low.replace(" ", ""):
                ctx = _get_context(lines, i, 4)
                d = _find_date(ctx)
                if d:
                    result["submission_deadline"] = d
                    return
            if "deadline for tender submission" in low:
                ctx = _get_context(lines, i, 3)
                d = _find_date(ctx)
                if d:
                    result["submission_deadline"] = d
                    return

    # Invitation: "on or before 20th April, 2026 at 1200hrs"
    for source in [invitation, text]:
        if not source:
            continue
        m = re.search(
            r'on\s+or\s+before\s+(\d{1,2}(?:st|nd|rd|th)?\s+\w+,?\s+\d{4}\s*(?:at\s+\d{1,4}\s*(?:[.:]?\d{0,2})?\s*(?:hrs?|hours?|am|pm|Hrs)?)?)',
            source, re.IGNORECASE
        )
        if m:
            result["submission_deadline"] = m.group(1).strip()
            return

    # Fallback: "closing date" or "submission deadline" lines
    lines = text.split("\n")
    for i, line in enumerate(lines):
        low = line.lower()
        if "closing date" in low or "submission deadline" in low:
            ctx = _get_context(lines, i, 4)
            d = _find_date(ctx)
            if d:
                result["submission_deadline"] = d
                return


def _parse_submission_method(result: dict, tds: str, invitation: str, text: str):
    """Parse submission method. Detect tender box (physical) vs electronic."""
    # Check invitation and TDS for "tender box" = Physical
    for source in [invitation, tds]:
        if not source:
            continue
        low_src = source.lower()
        if "tender box" in low_src or "deposited in" in low_src:
            result["submission_method"] = "Physical (Tender Box)"
            return
        if "submitted electronically" in low_src or "e-procurement" in low_src:
            if "n/a" not in low_src[low_src.find("e-procurement"):low_src.find("e-procurement")+50].lower() if "e-procurement" in low_src else True:
                result["submission_method"] = "Electronic"
                return

    # TDS: look for electronic submission procedure
    if tds:
        lines = tds.split("\n")
        for i, line in enumerate(lines):
            low = line.lower()
            if "electronic" in low and ("submission" in low or "tendering" in low):
                ctx = _get_context(lines, i, 3).lower()
                if "n/a" in ctx or "not applicable" in ctx:
                    result["submission_method"] = "Physical"
                    return
                result["submission_method"] = "Electronic"
                return

    # Fallback
    lines = text.split("\n")
    for i, line in enumerate(lines):
        low = line.lower()
        if "tender box" in low:
            result["submission_method"] = "Physical (Tender Box)"
            return
    for i, line in enumerate(lines):
        low = line.lower()
        if "submission" in low and ("electronic" in low or "physical" in low or "manual" in low):
            if "electronic" in low and ("not" in low or "n/a" in low):
                result["submission_method"] = "Physical"
            elif "electronic" in low:
                result["submission_method"] = "Electronic"
            elif "physical" in low:
                result["submission_method"] = "Physical"
            return


def _parse_prebid_meeting(result: dict, tds: str, invitation: str, text: str):
    """Parse pre-bid / pre-tender meeting date and link."""
    for source in [tds, invitation, text]:
        if not source:
            continue
        lines = source.split("\n")
        for i, line in enumerate(lines):
            low = line.lower()
            if not any(k in low for k in ["pre-bid", "prebid", "pre bid", "pre-tender", "pretender"]):
                continue
            ctx = _get_context(lines, i, 8)

            if not result.get("pre_bid_meeting_date"):
                d = _find_date(ctx)
                if d:
                    result["pre_bid_meeting_date"] = d

            if not result.get("pre_bid_meeting_link"):
                link_m = re.search(r'(https?://\S+)', ctx)
                if link_m:
                    result["pre_bid_meeting_link"] = link_m.group(1).rstrip(".,;)")

        if result.get("pre_bid_meeting_date"):
            return


def _parse_clarification_deadline(result: dict, text: str):
    """Parse clarification request deadline."""
    lines = text.split("\n")
    for i, line in enumerate(lines):
        low = line.lower()
        if "clarification" in low and ("deadline" in low or "latest" in low or
                                        "last date" in low or "not later than" in low):
            ctx = _get_context(lines, i, 4)
            d = _find_date(ctx)
            if d:
                result["clarification_deadline"] = d
                return
            # "five (5) days prior to closing" pattern
            m = re.search(r'(\d+)\s*(?:\(\d+\))?\s*days?\s*(?:prior|before)', ctx, re.IGNORECASE)
            if m:
                result["clarification_deadline"] = f"{m.group(1)} days before closing"
                return


def _parse_site_visit(result: dict, text: str):
    """Parse mandatory site visit requirement."""
    result["mandatory_site_visit"] = False
    lines = text.split("\n")
    for i, line in enumerate(lines):
        low = line.lower()
        if "site visit" in low or "site inspection" in low:
            ctx = _get_context(lines, i, 4).lower()
            if "mandatory" in ctx or "compulsory" in ctx or "required" in ctx:
                result["mandatory_site_visit"] = True
            return


def _parse_bid_copies(result: dict, tds: str, text: str):
    """Parse number of bid copies required."""
    # TDS: "ITT 19.1 ... number of copies is: ONE (1)"
    for source in [tds, text]:
        if not source:
            continue
        lines = source.split("\n")
        for i, line in enumerate(lines):
            low = line.lower()
            if ("number of copies" in low or "itt 19" in low) and ("copies" in low or "copy" in low):
                ctx = _get_context(lines, i, 3)
                # Try to get the full description like "ONE (1) hardcopy and ONE (1) softcopy"
                m = re.search(r'copies\s+is\s*:\s*(.+?)(?:\n|$)', ctx, re.IGNORECASE)
                if m:
                    result["number_of_bid_copies"] = m.group(1).strip()[:100]
                    return
                m = re.search(r'(\d+)\s*(?:copies|copy)', ctx, re.IGNORECASE)
                if m:
                    result["number_of_bid_copies"] = m.group(1)
                    return
                if "not applicable" in ctx.lower():
                    result["number_of_bid_copies"] = "Not applicable"
                    return


# ── Section 2: FINANCIAL QUALIFICATION THRESHOLDS ────────────────────────────

def _get_financial_section(text: str) -> str:
    """Extract the financial qualification / evaluation criteria section."""
    return _extract_section_text(
        text,
        start_keywords=["evaluation and qualification", "qualification criteria",
                        "financial requirements", "financial qualification",
                        "financial evaluation"],
        end_keywords=["section iv", "tendering forms", "tender forms",
                      "section v", "bills of quantities"],
        max_chars=15000,
    )


def _parse_financial_qualifications(text: str) -> dict[str, Any]:
    """Extract financial qualification thresholds.

    Strategy: Search the financial/qualification section first
    (it has actual amounts), then fall back to full text.
    """
    result: dict[str, Any] = {}

    fin_section = _get_financial_section(text)

    # -- Minimum average annual turnover --
    _parse_turnover(result, fin_section, text)

    # -- Minimum liquid assets / line of credit --
    _parse_liquid_assets(result, fin_section, text)

    # -- Minimum single contract value --
    _parse_single_contract(result, fin_section, text)

    # -- Minimum combined two-contract value --
    _parse_combined_contract(result, fin_section, text)

    # -- Cash flow requirement --
    _parse_cash_flow(result, fin_section, text)

    # -- Audited financials years required --
    _parse_audited_years(result, fin_section, text)

    return result


def _parse_turnover(result: dict, fin_section: str, text: str):
    """Parse minimum annual turnover from financial section → full text."""
    for source in [fin_section, text]:
        if not source:
            continue
        lines = source.split("\n")
        for i, line in enumerate(lines):
            low = line.lower()
            if not ("annual turnover" in low or "average turnover" in low or
                    ("turnover" in low and ("minimum" in low or "average" in low))):
                continue
            ctx = _get_context(lines, i, 5)
            # Skip template placeholders
            if "[insert" in ctx.lower():
                continue
            amt = _find_amount(ctx)
            if amt:
                result["min_annual_turnover"] = amt
                return
            # "turnover of 30 million" pattern
            m = re.search(r'turnover\s+of\s+(\d+)\s*million', ctx, re.IGNORECASE)
            if m:
                result["min_annual_turnover"] = f"KES {m.group(1)},000,000"
                return


def _parse_liquid_assets(result: dict, fin_section: str, text: str):
    """Parse minimum liquid assets from financial section → full text."""
    for source in [fin_section, text]:
        if not source:
            continue
        lines = source.split("\n")
        for i, line in enumerate(lines):
            low = line.lower()
            if not ("liquid assets" in low or "line of credit" in low or "available liquid" in low):
                continue
            ctx = _get_context(lines, i, 5)
            if "[insert" in ctx.lower() or "[kenya" in ctx.lower():
                continue
            amt = _find_amount(ctx)
            if amt:
                result["min_liquid_assets"] = amt
                return


def _parse_single_contract(result: dict, fin_section: str, text: str):
    """Parse minimum single contract value."""
    for source in [fin_section, text]:
        if not source:
            continue
        lines = source.split("\n")
        for i, line in enumerate(lines):
            low = line.lower()
            if "single contract" in low and ("value" in low or "minimum" in low):
                ctx = _get_context(lines, i, 5)
                if "[insert" in ctx.lower():
                    continue
                amt = _find_amount(ctx)
                if amt:
                    result["min_single_contract_value"] = amt
                    return


def _parse_combined_contract(result: dict, fin_section: str, text: str):
    """Parse minimum combined two-contract value."""
    for source in [fin_section, text]:
        if not source:
            continue
        lines = source.split("\n")
        for i, line in enumerate(lines):
            low = line.lower()
            if "two" in low and "contract" in low and ("combined" in low or "similar" in low):
                ctx = _get_context(lines, i, 5)
                if "[insert" in ctx.lower():
                    continue
                amt = _find_amount(ctx)
                if amt:
                    result["min_combined_contract_value"] = amt
                    return


def _parse_cash_flow(result: dict, fin_section: str, text: str):
    """Parse cash flow requirement."""
    for source in [fin_section, text]:
        if not source:
            continue
        lines = source.split("\n")
        for i, line in enumerate(lines):
            low = line.lower()
            if "cash flow" in low:
                ctx = _get_context(lines, i, 5)
                if "[insert" in ctx.lower():
                    continue
                amt = _find_amount(ctx)
                if amt:
                    result["cash_flow_requirement"] = amt
                    return


def _parse_audited_years(result: dict, fin_section: str, text: str):
    """Parse audited financials years required."""
    for source in [fin_section, text]:
        if not source:
            continue
        lines = source.split("\n")
        for i, line in enumerate(lines):
            low = line.lower()
            if "audited" in low and ("financial" in low or "account" in low or "record" in low):
                ctx = _get_context(lines, i, 8)
                if "[insert" in ctx.lower():
                    continue
                # "last 3 years" or "past 5 years" or "years 2022, 2023, 2024"
                m = re.search(r'(?:last|past|previous)?\s*(\d+)\s*(?:years?|financial years?)', ctx, re.IGNORECASE)
                if m:
                    result["audited_financials_years"] = f"{m.group(1)} years"
                    return
                # Enumerated years: "2022, 2023, 2024" or "2022, 2023 and 2024"
                year_matches = re.findall(r'(20\d{2})', ctx)
                if len(year_matches) >= 2:
                    result["audited_financials_years"] = f"{len(year_matches)} years ({', '.join(year_matches)})"
                    return


# ── Section 3: KEY PERSONNEL REQUIRED ────────────────────────────────────────

def _parse_key_personnel(text: str) -> list[dict[str, Any]]:
    """Extract key personnel requirements.

    Returns a list of dicts, each with:
      role, qualification, experience_years, number_required, registration_body

    Handles two formats:
      1. Numbered list: "1. Project Manager ..." (table/form style)
      2. Prose subsections: "2.4.3.1. Account Manager – Lead" with paragraphs
    """
    personnel: list[dict[str, Any]] = []
    lines = text.split("\n")

    # Find the section(s) about key personnel — skip TOC entries
    in_section = False
    section_lines: list[str] = []

    for i, line in enumerate(lines):
        low = line.lower().strip()

        # Skip table-of-contents lines (contain "...." or "page X")
        if "....." in line or re.match(r'.*\.{4,}\s*\d+\s*$', line):
            continue

        if any(k in low for k in [
            "key personnel", "personnel schedule", "staff schedule",
            "professional staff", "key staff", "key experts",
            "contractor's representative and key personnel",
            "team staffing", "liaison team staffing",
            "staffing plan", "staffing requirements",
        ]):
            # Only start a section if it looks like a real heading (not a reference)
            if ("form " in low and ("per" in low or "equ" in low)):
                continue
            in_section = True
            section_lines = []
            continue

        if in_section:
            # End of section detection
            if (low.startswith("section") or low.startswith("part ") or
                    "key equipment" in low or "plant and equipment" in low or
                    (low.startswith("form") and "equ" in low) or
                    "activity schedule" in low or
                    "qualification form summary" in low):
                break
            # Skip blank lines at the start
            if not section_lines and not low:
                continue
            section_lines.append(line)

    section_text = "\n".join(section_lines)

    # If section text indicates "Not applicable", return empty
    if "not applicable" in section_text.lower()[:200]:
        return personnel

    # --- Strategy 1: Look for subsection headings (X.X.X.X. Role Name) ---
    # This handles prose-format documents like the Judiciary tender
    subsection_pattern = re.compile(
        r'(?:^|\n)\s*\d+\.\d+\.\d+(?:\.\d+)?\.?\s+(.+?)(?=\n\s*\d+\.\d+\.\d+(?:\.\d+)?\.?\s|\Z)',
        re.DOTALL
    )
    subsection_matches = subsection_pattern.findall(section_text)

    if subsection_matches:
        for block in subsection_matches:
            entry = _parse_personnel_block(block)
            if entry and entry.get("role"):
                personnel.append(entry)
        if personnel:
            return personnel

    # --- Strategy 2: Numbered list ("1. Project Manager", "2. Surveyor") ---
    rows = re.findall(
        r'(?:^|\n)\s*\d+\.?\s*(.+?)(?=\n\s*\d+\.?\s|\n\s*$|\Z)',
        section_text, re.DOTALL
    )

    for row in rows:
        if len(row.strip()) < 10:
            continue
        entry = _parse_personnel_block(row)
        if entry and (entry.get("role") or entry.get("qualification")):
            personnel.append(entry)

    if personnel:
        return personnel

    # --- Strategy 3: Full-text scan for subsection headings with qualifications ---
    # Handles documents where personnel are buried in specs (e.g., "2.4.3.1. Account Manager")
    subsection_pat = re.compile(
        r'(?:^|\n)\s*\d+\.\d+\.\d+(?:\.\d+)?\.?\s+(.+?)'
        r'(?=\n\s*\d+\.\d+\.\d+(?:\.\d+)?\.?\s|\n\s*\d+\.\d+\.\d+[^.]|\Z)',
        re.DOTALL
    )
    # Role-related keywords that must appear in the first line of the block
    role_keywords = [
        "manager", "engineer", "lead", "officer", "supervisor", "technician",
        "architect", "analyst", "specialist", "consultant", "director",
        "coordinator", "administrator", "surveyor", "foreman", "inspector",
        "designer", "planner", "programmer", "developer", "accountant",
    ]
    for match in subsection_pat.finditer(text):
        block = match.group(1)
        first_line = block.strip().split("\n")[0].lower()
        # Only consider blocks whose heading mentions a role-like keyword
        if not any(rk in first_line for rk in role_keywords):
            continue
        # And the block should mention qualifications/experience
        block_low = block.lower()
        if not any(kw in block_low for kw in [
            "qualification", "experience", "degree", "bachelor",
            "certification", "certified", "years", "pmp", "ccna"
        ]):
            continue
        entry = _parse_personnel_block(block)
        if entry and (entry.get("role") or entry.get("qualification")):
            personnel.append(entry)

    return personnel


def _parse_personnel_block(block: str) -> dict[str, Any] | None:
    """Parse a single personnel entry from a text block."""
    entry: dict[str, Any] = {}

    # First line is typically the role name
    first_line = block.strip().split("\n")[0].strip()
    # Clean up role: remove trailing dashes, "Lead", etc. keep concise
    role_text = re.sub(r'\s*[-–]\s*$', '', first_line).strip()
    if len(role_text) > 5 and len(role_text) < 200:
        entry["role"] = role_text

    # Skip entries that look like boilerplate/instructions
    role_low = (entry.get("role") or "").lower()
    skip_words = ["shall", "tenderer", "bidder", "must be", "invited",
                  "obtained", "downloaded", "addressed", "submitted",
                  "conducted", "sealed", "eligible", "information",
                  "strictly", "deadline", "opened", "rejected",
                  "corrupt", "fraudulent", "collusive", "coercive",
                  "responsibilities", "not be involved", "disqualified",
                  "evaluation", "examination", "compliance", "checklist",
                  "stage", "mandatory", "preliminary"]
    if any(sw in role_low for sw in skip_words):
        return None

    # Qualification
    qual_m = re.search(
        r'(?:bachelor|master|diploma|degree|phd|bsc|msc|b\.?sc|m\.?sc|hnd)\s*'
        r'(?:\'?s?\s+)?(?:in\s+)?([^,.\n]{0,100})',
        block, re.IGNORECASE
    )
    if qual_m:
        entry["qualification"] = qual_m.group(0).strip()

    # Professional certifications (PMP, CCNA, Prince2, etc.)
    cert_pattern = re.compile(
        r'\b(PMP|PRINCE2|CCNA|CCNP|CCDA|CCDP|CIPP|CISM|CISSP|ITIL|'
        r'CPA|ACCA|CISA|MCSE|OCP|AWS|Azure|TOGAF)\b',
        re.IGNORECASE
    )
    certs = cert_pattern.findall(block)
    if certs:
        if entry.get("qualification"):
            entry["qualification"] += " + " + ", ".join(c.upper() for c in certs)
        else:
            entry["qualification"] = ", ".join(c.upper() for c in certs)

    # Experience years — handle "Five (5) years" and "5 years"
    exp_m = re.search(
        r'(?:(\d+)\s*(?:\+\s*)?(?:\(\d+\)\s*)?|'
        r'(?:one|two|three|four|five|six|seven|eight|nine|ten)\s*\((\d+)\)\s*)'
        r'years?\s*(?:of\s+)?'
        r'(?:experience|relevant|similar|professional|working|hands-on|or\s+more)?',
        block, re.IGNORECASE
    )
    if exp_m:
        yrs = exp_m.group(1) or exp_m.group(2)
        if yrs:
            entry["experience_years"] = int(yrs)

    # Number required
    num_m = re.search(r'(?:number|no\.?\s*required|quantity)\s*[:\-]?\s*(\d+)', block, re.IGNORECASE)
    if num_m:
        entry["number_required"] = int(num_m.group(1))

    # Professional registration body
    reg_bodies = ["EBK", "IEK", "BORAQS", "NEMA", "NCA", "KISM", "ICPAK",
                   "LSK", "IQSK", "ISK", "ERB", "KICE"]
    for body in reg_bodies:
        if body in block.upper():
            entry["registration_body"] = body
            break
    if not entry.get("registration_body"):
        reg_m = re.search(r'registered?\s+(?:with|by)\s+([A-Z]{2,10})', block)
        if reg_m:
            entry["registration_body"] = reg_m.group(1)

    # Only include entries that have at least one personnel-specific attribute
    has_personnel_attr = (
        entry.get("qualification") or entry.get("experience_years") or
        entry.get("registration_body") or entry.get("number_required")
    )
    if has_personnel_attr and (entry.get("role") or entry.get("qualification")):
        return entry
    return None


# ── Section 4: KEY EQUIPMENT REQUIRED ────────────────────────────────────────

def _parse_key_equipment(text: str) -> list[dict[str, Any]]:
    """Extract key equipment requirements.

    Returns a list of dicts, each with:
      equipment_type, specification, min_quantity, ownership_requirement
    """
    equipment: list[dict[str, Any]] = []
    lines = text.split("\n")

    in_section = False
    section_lines: list[str] = []

    for i, line in enumerate(lines):
        low = line.lower().strip()

        # Skip table-of-contents lines
        if "....." in line or re.match(r'.*\.{4,}\s*\d+\s*$', line):
            continue

        if any(k in low for k in [
            "key equipment", "plant and equipment", "equipment required",
            "major equipment", "equipment schedule",
        ]):
            # Skip TOC/form references
            if "form " in low and ("equ" in low or "per" in low):
                continue
            if "not applicable" in low:
                continue
            in_section = True
            section_lines = []
            continue

        if in_section:
            # End of section — stronger boundary detection
            if (low.startswith("section") or low.startswith("part ") or
                    "key personnel" in low or
                    (low.startswith("form") and "per" in low) or
                    "activity schedule" in low or
                    "qualification form summary" in low or
                    "qualification criteria" in low or
                    "stage" in low and "evaluation" in low or
                    "checklist" in low or
                    "s/no" in low and "mandatory" in low):
                break
            if not section_lines and not low:
                continue
            section_lines.append(line)

    section_text = "\n".join(section_lines)

    # If section text indicates "Not applicable", return empty
    if "not applicable" in section_text.lower()[:200]:
        return equipment

    # --- Strategy 1: Table with "Equipment Type" header ---
    # e.g. "Equipment Type and Characteristics | Minimum Number"
    table_header_m = re.search(
        r'equipment\s+type\s+(?:and\s+)?(?:characteristics?)?',
        section_text, re.IGNORECASE
    )
    if table_header_m:
        # Parse rows after the header: lines starting with a number or letter
        header_pos = table_header_m.start()
        after_header = section_text[header_pos:].split("\n")[1:]  # skip header line
        for row_line in after_header:
            stripped = row_line.strip()
            if not stripped or len(stripped) < 3:
                continue
            # Stop at non-equipment content
            low_row = stripped.lower()
            if any(stop in low_row for stop in [
                "qualification", "stage", "checklist", "mandatory",
                "s/no", "yes/no", "total"
            ]):
                break
            entry = _parse_equipment_line(stripped)
            if entry:
                equipment.append(entry)
        if equipment:
            return equipment

    # --- Strategy 2: Numbered list (1., 2., 3.) ---
    rows = re.findall(
        r'(?:^|\n)\s*\d+\.?\s*(.+?)(?=\n\s*\d+\.?\s|\n\s*$|\Z)',
        section_text, re.DOTALL
    )

    for row in rows:
        if len(row.strip()) < 5:
            continue
        entry = _parse_equipment_line(row)
        if entry:
            equipment.append(entry)

    return equipment


def _parse_equipment_line(row: str) -> dict[str, Any] | None:
    """Parse a single equipment entry from a text line/block."""
    entry: dict[str, Any] = {}

    first_line = row.strip().split("\n")[0].strip()
    if len(first_line) < 3 or len(first_line) > 150:
        return None

    # Skip entries that look like boilerplate/instructions/admin forms
    skip_words = ["shall", "tenderer", "bidder", "must be", "invited",
                  "obtained", "downloaded", "addressed", "submitted",
                  "conducted", "sealed", "eligible", "information",
                  "strictly", "deadline", "opened", "rejected",
                  "completed", "standardized", "documents marked",
                  "kenya revenue", "commissioner", "viewed at",
                  "tower building", "/202", "kra/",
                  "evaluation", "examination", "compliance",
                  "certificate", "s/no", "yes/no", "copy of",
                  "mandatory", "preliminary", "registration",
                  "incorporation", "document", "criteria",
                  "litigation", "declaration", "responsiveness",
                  "checklist", "qualification", "stage",
                  "total score", "percentage", "points",
                  "any goods", "works and", "processes",
                  "commodities", "raw material", "industrial"]
    if any(sw in first_line.lower() for sw in skip_words):
        return None

    entry["equipment_type"] = first_line

    # Quantity
    qty_m = re.search(r'(?:quantity|no\.?|number|minimum)\s*[:\-]?\s*(\d+)', row, re.IGNORECASE)
    if qty_m:
        entry["min_quantity"] = int(qty_m.group(1))
    else:
        qty_m = re.search(r'(\d+)\s*(?:nos?\.?|units?|pieces?|sets?)', row, re.IGNORECASE)
        if qty_m:
            entry["min_quantity"] = int(qty_m.group(1))

    # Ownership
    low_row = row.lower()
    if "own" in low_row:
        entry["ownership_requirement"] = "Owned"
    elif "lease" in low_row:
        entry["ownership_requirement"] = "Owned or Leased"
    elif "hire" in low_row:
        entry["ownership_requirement"] = "Owned or Hired"

    return entry


# ── Raw section extraction ───────────────────────────────────────────────────

def _extract_raw_section(text: str, start_keywords: list[str], end_keywords: list[str],
                         max_chars: int = 5000) -> str:
    """Extract raw text for a section bounded by start/end keywords."""
    lines = text.split("\n")
    in_section = False
    section_lines: list[str] = []
    char_count = 0

    for line in lines:
        low = line.lower().strip()

        # Skip table-of-contents lines
        if "....." in line or re.match(r'.*\.{4,}\s*\d+\s*$', line):
            continue

        if not in_section:
            if any(k in low for k in start_keywords):
                in_section = True
                section_lines.append(line)
                char_count += len(line)
                continue
        else:
            if any(k in low for k in end_keywords):
                break
            section_lines.append(line)
            char_count += len(line)
            if char_count > max_chars:
                break

    return "\n".join(section_lines).strip()


# ── Main parse function ──────────────────────────────────────────────────────

def parse_tender_document(url: str) -> dict[str, Any]:
    """Download and parse a tender document, returning structured data.

    Returns a dict with keys:
      - All parsed fields from sections 1-4
      - key_personnel: list[dict]
      - key_equipment: list[dict]
      - key_requirements_raw: str
      - financial_qualifications_raw: str
      - key_personnel_raw: str
      - key_equipment_raw: str
      - document_parsed: bool
      - parse_error: str | None
    """
    result: dict[str, Any] = {
        "document_parsed": False,
        "parsed_document_url": url,
        "parse_error": None,
    }

    try:
        log.info("Downloading document: %s", url)
        full_text = download_and_extract_text(url)

        if not full_text or len(full_text.strip()) < 100:
            result["parse_error"] = "No text extracted from document"
            return result

        log.info("Extracted %d characters from document", len(full_text))

        # Parse all 4 sections
        key_req = _parse_key_requirements(full_text)
        fin_qual = _parse_financial_qualifications(full_text)
        personnel = _parse_key_personnel(full_text)
        equipment = _parse_key_equipment(full_text)

        # Merge parsed fields
        result.update(key_req)
        result.update(fin_qual)
        result["key_personnel"] = personnel
        result["key_equipment"] = equipment

        # Extract raw sections for reference
        result["key_requirements_raw"] = _extract_raw_section(
            full_text,
            start_keywords=["instruction to tenderer", "section i", "tender data sheet",
                            "bid data sheet", "particular conditions"],
            end_keywords=["section ii", "evaluation criteria", "qualification criteria",
                          "section iii"],
        )

        result["financial_qualifications_raw"] = _extract_raw_section(
            full_text,
            start_keywords=["financial", "evaluation and qualification",
                            "qualification criteria", "section iii"],
            end_keywords=["section iv", "tendering forms", "tender forms",
                          "key personnel"],
        )

        result["key_personnel_raw"] = _extract_raw_section(
            full_text,
            start_keywords=["key personnel", "personnel schedule", "key staff",
                            "staff schedule", "key experts"],
            end_keywords=["key equipment", "plant and equipment", "form equ",
                          "section v", "activity schedule"],
        )

        result["key_equipment_raw"] = _extract_raw_section(
            full_text,
            start_keywords=["key equipment", "plant and equipment",
                            "equipment schedule", "form equ"],
            end_keywords=["section v", "activity schedule", "specifications",
                          "section vi", "bill of quantities"],
        )

        result["document_parsed"] = True
        log.info("Successfully parsed document: %s", url)

    except Exception as exc:
        log.exception("Error parsing document %s", url)
        result["parse_error"] = str(exc)[:2000]

    return result
