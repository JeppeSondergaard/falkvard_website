#!/usr/bin/env python3
"""Download all images from shortcodes.txt using Instagram's public media endpoint."""
import os
import time
import urllib.request

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
RAW_DIR = os.path.join(SCRIPTS_DIR, "..", "public", "gallery", "_raw")
SC_FILE = os.path.join(SCRIPTS_DIR, "shortcodes.txt")

os.makedirs(RAW_DIR, exist_ok=True)

with open(SC_FILE) as f:
    shortcodes = [line.strip() for line in f if line.strip()]

print(f"Downloading {len(shortcodes)} images to {RAW_DIR}")

downloaded = 0
skipped = 0
errors = 0

for i, sc in enumerate(shortcodes):
    filepath = os.path.join(RAW_DIR, f"{sc}.jpg")
    if os.path.exists(filepath):
        skipped += 1
        continue

    url = f"https://www.instagram.com/p/{sc}/media/?size=l"
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        })
        with urllib.request.urlopen(req, timeout=30) as resp:
            with open(filepath, "wb") as f:
                f.write(resp.read())
        size_kb = os.path.getsize(filepath) / 1024
        downloaded += 1
        if downloaded % 10 == 0 or downloaded <= 3:
            print(f"  [{i+1}/{len(shortcodes)}] {sc}.jpg ({size_kb:.0f}KB)")
    except Exception as e:
        errors += 1
        if errors <= 10:
            print(f"  [{i+1}/{len(shortcodes)}] Error {sc}: {e}")
    time.sleep(0.3)

print(f"\nDone! Downloaded: {downloaded}, Skipped: {skipped}, Errors: {errors}")
print(f"Total images in _raw: {len([f for f in os.listdir(RAW_DIR) if f.endswith('.jpg')])}")
