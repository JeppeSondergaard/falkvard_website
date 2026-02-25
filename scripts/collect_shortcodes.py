#!/usr/bin/env python3
"""
Uses the already collected first page to build a full pagination scraper.
Fetches all post shortcodes via the Instagram v1 feed API.
Run this from the browser's context by calling the API pages sequentially.
"""
import os
import json
import time
import urllib.request

RAW_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "gallery", "_raw")
SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))

UID = "7123840303"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "X-IG-App-ID": "936619743392459",
    "X-Requested-With": "XMLHttpRequest",
    "Referer": "https://www.instagram.com/a_falkvard_tattoo/",
}

# Try to directly hit the API with cookies from request
# This likely won't work without session cookies, but let's try
def fetch_page(max_id=None):
    url = f"https://www.instagram.com/api/v1/feed/user/{UID}/?count=33"
    if max_id:
        url += f"&max_id={max_id}"
    
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"  Error: {e}")
        return None


def main():
    all_codes = []
    max_id = None
    page = 0
    
    while page < 50:
        print(f"Fetching page {page+1}...")
        data = fetch_page(max_id)
        if not data or "items" not in data:
            print(f"  No data returned")
            break
        
        items = data["items"]
        for item in items:
            code = item.get("code")
            is_video = bool(item.get("video_versions"))
            if code and not is_video:
                all_codes.append(code)
            
            # Handle carousels
            carousel = item.get("carousel_media", [])
            for i, cm in enumerate(carousel):
                if i > 0 and not cm.get("video_versions"):
                    all_codes.append(f"{code}_{i+1}")
        
        print(f"  Got {len(items)} items, total image codes: {len(all_codes)}")
        
        if not data.get("more_available"):
            print("  No more pages")
            break
        
        max_id = data.get("next_max_id")
        if not max_id:
            break
        
        page += 1
        time.sleep(2)
    
    # Deduplicate
    unique_codes = list(dict.fromkeys(all_codes))
    
    # Save
    sc_file = os.path.join(SCRIPTS_DIR, "shortcodes.txt")
    with open(sc_file, "w") as f:
        for code in unique_codes:
            f.write(code + "\n")
    
    print(f"\nTotal unique shortcodes: {len(unique_codes)}")
    print(f"Saved to {sc_file}")


if __name__ == "__main__":
    main()
