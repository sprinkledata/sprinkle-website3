#!/usr/bin/env python3
"""
One-off: download cdn.prod.website-files.com assets into /assets and rewrite HTML/CSS/JS.
"""
from __future__ import annotations

import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import quote, unquote, urlunparse, urlparse

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
# Match through file extension; allows spaces in filenames (e.g. "Overall -1.jpg").
URL_RE = re.compile(
    r"https://cdn\.prod\.website-files\.com/.*?\.(?:png|jpe?g|webp|gif|svg|mp4|webm|ico|woff2?|json)"
    r"(?:\?[^\s\"\'<>]*)?"
    r'(?=\s|$|"|\'|>|\)|,|<|&quot;|&#quot;|\s+\d+w)',
    re.I,
)

UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
REFERER = "https://sprinkledata.com/"


def clean_raw_url(raw: str) -> str:
    """Normalize URL for fetching: strip CSS/HTML artifacts after the real URL."""
    raw = raw.rstrip(".,;")
    if "&quot;" in raw:
        raw = raw.split("&quot;")[0]
    if "&#quot;" in raw:
        raw = raw.split("&#quot;")[0]
    raw = raw.rstrip(".,;")
    if raw.endswith(")"):
        without = raw[:-1]
        if re.search(
            r"\.(woff2?|png|jpe?g|webp|gif|svg|mp4|webm|ico|jpeg|json)(\?|$)",
            without,
            re.I,
        ):
            return without
    return raw


def normalized_url(raw: str) -> str:
    return unquote(raw.split("?")[0])


def local_filename(norm: str) -> str:
    base = urlparse(norm).path.split("/")[-1]
    if not base:
        raise ValueError(f"no filename in {norm!r}")
    return base


def collect_urls() -> dict[str, str]:
    """Map normalized URL -> local filename."""
    seen_norm: set[str] = set()
    mapping: dict[str, str] = {}
    exts = {".html", ".css", ".js", ".json"}
    for path in ROOT.rglob("*"):
        if path.suffix.lower() not in exts:
            continue
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        for m in URL_RE.finditer(text):
            exact = m.group(0).rstrip(".,;")
            norm = normalized_url(clean_raw_url(exact))
            if norm in seen_norm:
                continue
            seen_norm.add(norm)
            mapping[norm] = local_filename(norm)
    return mapping


def url_for_request(norm: str) -> str:
    """Rebuild URL with a path safe for HTTP (spaces etc. percent-encoded)."""
    p = urlparse(norm)
    safe_path = quote(p.path, safe="/")
    return urlunparse((p.scheme, p.netloc, safe_path, "", "", ""))


def download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(
        url_for_request(url),
        headers={"User-Agent": UA, "Referer": REFERER},
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = resp.read()
    dest.write_bytes(data)


def rel_assets_prefix(from_file: Path) -> str:
    rel = Path(os.path.relpath(ASSETS, from_file.parent))
    s = rel.as_posix()
    return s if s.endswith("/") else s + "/"


def rewrite_files(norm_to_file: dict[str, str]) -> None:
    # Exact substring in source file -> local filename
    exact_to_name: dict[str, str] = {}
    for path in ROOT.rglob("*"):
        if path.suffix.lower() not in {".html", ".css", ".js", ".json"}:
            continue
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        for m in URL_RE.finditer(text):
            exact = m.group(0).rstrip(".,;")
            norm = normalized_url(clean_raw_url(exact))
            exact_to_name[exact] = norm_to_file[norm]

    # Sort by length descending so longer URLs replace first (safety)
    ordered = sorted(exact_to_name.items(), key=lambda x: len(x[0]), reverse=True)

    exts = {".html", ".css", ".js", ".json"}
    for path in ROOT.rglob("*"):
        if path.suffix.lower() not in exts:
            continue
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        if "cdn.prod.website-files.com" not in text:
            continue
        prefix = rel_assets_prefix(path)
        new = text
        for exact, fname in ordered:
            if exact in new:
                new = new.replace(exact, prefix + fname)
        if new != text:
            path.write_text(new, encoding="utf-8")


def main() -> int:
    os.chdir(ROOT)
    norm_to_file = collect_urls()
    print(f"Unique assets: {len(norm_to_file)}", file=sys.stderr)

    ASSETS.mkdir(parents=True, exist_ok=True)
    for i, (norm, fname) in enumerate(sorted(norm_to_file.items()), 1):
        dest = ASSETS / fname
        if dest.exists() and dest.stat().st_size > 0:
            continue
        try:
            download(norm, dest)
            print(f"[{i}/{len(norm_to_file)}] OK {fname}", file=sys.stderr)
        except (urllib.error.URLError, OSError, ValueError) as e:
            print(f"FAIL {norm}: {e}", file=sys.stderr)
            return 1
        time.sleep(0.05)

    rewrite_files(norm_to_file)
    print("Rewrite complete.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
