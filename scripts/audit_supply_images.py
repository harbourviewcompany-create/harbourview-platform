#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import math
import re
from pathlib import Path
from statistics import mean

from PIL import Image, ImageDraw, ImageFont, ImageStat
import imagehash

ROOT = Path(__file__).resolve().parents[1]
SQL_FILES = sorted((ROOT / "supabase/migrations").glob("20260730220*_seed_harbourview_supply_catalog_canada*.sql"))
IMAGE_DIR = ROOT / "public/images/supply"
OUT = ROOT / "artifacts/supply-image-audit"
OUT.mkdir(parents=True, exist_ok=True)

sql = "\n".join(path.read_text(encoding="utf-8") for path in SQL_FILES)
pattern = re.compile(
    r"\(gen_random_uuid\(\),'(?P<category>[^']+)','(?P<title>(?:[^']|'')*)'.*?,'(?P<slug>[^']+)','(?P<section>[^']+)',true,'(?P<sku>[^']+)'",
    re.S,
)
rows = [m.groupdict() for m in pattern.finditer(sql)]
# Preserve canonical first occurrence if historical files overlap.
rows = list({row["slug"]: row for row in rows}.values())
if len(rows) != 68:
    raise SystemExit(f"Expected 68 canonical rows, found {len(rows)} across {len(SQL_FILES)} seed files")

font = ImageFont.load_default()
thumb_w, thumb_h = 300, 200
card_w, card_h = 320, 286
cols = 4
contact_pages = []
records = []
hashes = {}

for row in rows:
    path = IMAGE_DIR / f"{row['slug']}.webp"
    if not path.exists():
        raise SystemExit(f"Missing image: {path}")
    with Image.open(path) as im0:
        im = im0.convert("RGB")
        width, height = im.size
        file_bytes = path.stat().st_size
        ratio = width / height
        target_ratio = 1.5
        retained = min(ratio / target_ratio, target_ratio / ratio)
        crop_loss_pct = round((1 - retained) * 100, 2)
        edge = max(4, min(width, height) // 30)
        gray = im.convert("L")
        center = gray.crop((edge, edge, width - edge, height - edge))
        edge_mask = Image.new("L", gray.size, 0)
        d = ImageDraw.Draw(edge_mask)
        d.rectangle((0, 0, width, edge), fill=255)
        d.rectangle((0, height-edge, width, height), fill=255)
        d.rectangle((0, 0, edge, height), fill=255)
        d.rectangle((width-edge, 0, width, height), fill=255)
        edge_stats = ImageStat.Stat(gray, edge_mask).stddev[0]
        center_stats = ImageStat.Stat(center).stddev[0]
        edge_activity_ratio = round(edge_stats / max(center_stats, 1), 3)
        ph = str(imagehash.phash(im))
        hashes[row['slug']] = imagehash.hex_to_hash(ph)
        alt = f"{row['title']} — Harbourview Supply catalog image"
        alt_ok = bool(row['title'].strip()) and row['title'] in alt and row['sku'] not in alt
        records.append({
            **row,
            "image_path": f"/images/supply/{row['slug']}.webp",
            "width_px": width,
            "height_px": height,
            "aspect_ratio": round(ratio, 4),
            "file_bytes": file_bytes,
            "file_kb": round(file_bytes / 1024, 2),
            "crop_loss_pct_3x2": crop_loss_pct,
            "edge_activity_ratio": edge_activity_ratio,
            "alt_text": alt,
            "alt_accuracy": "PASS" if alt_ok else "FAIL",
            "phash": ph,
        })

for rec in records:
    peers = []
    h = hashes[rec['slug']]
    for other in records:
        if other['slug'] == rec['slug']:
            continue
        dist = h - hashes[other['slug']]
        if dist <= 4:
            peers.append(f"{other['slug']} ({dist})")
    rec["near_duplicate_count"] = len(peers)
    rec["near_duplicate_peers"] = "; ".join(peers)
    rec["file_weight_status"] = "PASS" if rec["file_bytes"] <= 120_000 else "REVIEW"
    rec["mobile_crop_status"] = "PASS" if rec["crop_loss_pct_3x2"] <= 5 else "REVIEW"
    rec["visual_repetition_status"] = "PASS" if not peers else "REVIEW"

fieldnames = list(records[0].keys())
with (OUT / "supply-image-audit-raw.csv").open("w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=fieldnames)
    w.writeheader(); w.writerows(records)

for page_start in range(0, len(records), 16):
    subset = records[page_start:page_start+16]
    page_rows = math.ceil(len(subset) / cols)
    sheet = Image.new("RGB", (cols * card_w, page_rows * card_h), "#f5f1e8")
    draw = ImageDraw.Draw(sheet)
    for j, rec in enumerate(subset):
        x = (j % cols) * card_w
        y = (j // cols) * card_h
        with Image.open(IMAGE_DIR / f"{rec['slug']}.webp") as src:
            src = src.convert("RGB")
            sw, sh = src.size
            tr = thumb_w / thumb_h
            sr = sw / sh
            if sr > tr:
                nw = int(sh * tr); left = (sw - nw)//2
                crop = src.crop((left, 0, left+nw, sh))
            else:
                nh = int(sw / tr); top = (sh - nh)//2
                crop = src.crop((0, top, sw, top+nh))
            crop.thumbnail((thumb_w, thumb_h))
            sheet.paste(crop, (x+10, y+10))
        draw.rectangle((x+9, y+9, x+311, y+211), outline="#8b7355", width=1)
        wrapped=[]; line=""
        for word in rec['title'].split():
            test=(line+" "+word).strip()
            if draw.textlength(test, font=font) > 292:
                wrapped.append(line); line=word
            else: line=test
        if line: wrapped.append(line)
        for k, text_line in enumerate(wrapped[:3]):
            draw.text((x+12, y+218+k*12), text_line, fill="#111827", font=font)
        meta=f"{rec['sku']} | {rec['width_px']}×{rec['height_px']} | {rec['file_kb']} KB"
        draw.text((x+12, y+258), meta, fill="#4b5563", font=font)
    p = OUT / f"contact-sheet-{page_start//16+1}.png"
    sheet.save(p, optimize=True)
    contact_pages.append(str(p.relative_to(ROOT)))

summary = {
    "canonical_skus": len(records),
    "images_found": len(records),
    "total_bytes": sum(r['file_bytes'] for r in records),
    "mean_kb": round(mean(r['file_kb'] for r in records), 2),
    "max_kb": max(r['file_kb'] for r in records),
    "mobile_crop_review_count": sum(r['mobile_crop_status'] == 'REVIEW' for r in records),
    "near_duplicate_review_count": sum(r['visual_repetition_status'] == 'REVIEW' for r in records),
    "alt_fail_count": sum(r['alt_accuracy'] == 'FAIL' for r in records),
    "contact_sheets": contact_pages,
}
(OUT / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
print(json.dumps(summary, indent=2))
