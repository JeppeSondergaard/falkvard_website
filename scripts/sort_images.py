#!/usr/bin/env python3
"""Sort downloaded images from _raw into gallery category folders."""
import os
import shutil

GALLERY_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "gallery")
RAW_DIR = os.path.join(GALLERY_DIR, "_raw")

# Categories from caption analysis via Instagram API
CATEGORIES = {
    "nordisk": [
        "DOfm8N5DJm6", "DKycj_0oMJ0",
    ],
    "ornamental": [
        "DJ47EUtAQ-U",
    ],
    "dark-art": [
        "DUILS8egDTn", "DI-zWMnqzd6",
    ],
    "blomster": [
        "DTj3jmdDK-J", "DODXVK3jKzV", "DJ0phQPAa2z", "DJYlT7uKDl-",
        "DI0va71gP1V", "DGKaXF3Mcq1", "DF7Q-UrqdDq",
    ],
    "fineline": [],
    "blackwork": [],
    "quotes": [
        "DGL2hy9KAw0", "DGL1euRKQh8", "DUxiTEjDCQq", "DUsJ3FjjOgI",
        "DUm9ZzhDHZ1", "DUh-tetjM7t", "DTcr0eTjK6n", "DS4cCC3jDwp",
        "DSwyBsyDPUC", "DSut2cwDJJ7", "DSmPbr_jPan", "DSD5860DPwb",
        "DQn4fI9jAfR", "DQjnpOkjLLy", "DPGSNp6DJHP", "DNPqPdLMwcJ",
        "DM7I_HRsHAp", "DMNtDF-sCMB", "DLHUFQvqMoc", "DK4NFA_KfnT",
        "DKKpb1mKhDz", "DJtKjNxKhJC", "DJn5KtXqHV8", "DJL84YdgW6q",
        "DIDzwsDK0Vp", "DIBxQu1sU1Z", "DHx9TIPqw8T", "DHYBm5sgDQ_",
        "DGaExctKplk", "DGPj6hSqEkV", "DF4d3xIqies", "DFw4GARKtrN",
        "DFX7FzlqoFF", "DFUcdJMIJUB", "DFNB_TlK9-l", "DFE7hEoNoSv",
        "DErZdNqgsT2", "DE65tQmNQpF", "DE1jhNBNSwc", "DErM_hzqF8H",
        "DEjikwbIMmy", "DEg4HOjp4gN",
    ],
}

# Build reverse map: shortcode -> category
code_to_cat = {}
for cat, codes in CATEGORIES.items():
    for code in codes:
        code_to_cat[code] = cat

# Create category folders
for cat in list(CATEGORIES.keys()) + ["unsorted"]:
    os.makedirs(os.path.join(GALLERY_DIR, cat), exist_ok=True)

# Get all images in _raw
raw_files = [f for f in os.listdir(RAW_DIR) if f.endswith(".jpg")]
print(f"Found {len(raw_files)} images in _raw")

moved = {}
for fname in sorted(raw_files):
    shortcode = fname.replace(".jpg", "")
    cat = code_to_cat.get(shortcode, "unsorted")

    src = os.path.join(RAW_DIR, fname)
    dst_dir = os.path.join(GALLERY_DIR, cat)
    dst = os.path.join(dst_dir, fname)

    if os.path.exists(dst):
        continue

    shutil.copy2(src, dst)
    moved[cat] = moved.get(cat, 0) + 1

print("\nImages sorted:")
for cat in sorted(moved.keys()):
    count = moved[cat]
    print(f"  {cat}: {count}")

# Summary of all folders
print("\nFolder totals:")
for d in sorted(os.listdir(GALLERY_DIR)):
    path = os.path.join(GALLERY_DIR, d)
    if os.path.isdir(path):
        count = len([f for f in os.listdir(path) if f.endswith((".jpg", ".png", ".webp"))])
        print(f"  {d}: {count} images")
