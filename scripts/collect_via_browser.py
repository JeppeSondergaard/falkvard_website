#!/usr/bin/env python3
"""
Collects all shortcodes by driving the IDE browser's JavaScript context.
Reads shortcodes page by page from Instagram's v1 feed API using the browser's session.

Usage: Run this while the IDE browser is on instagram.com/a_falkvard_tattoo/ and logged in.
This script reads the page title set by JavaScript injected via bookmark.
"""

import os
import sys
import time
import json
import subprocess
import urllib.request

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
RAW_DIR = os.path.join(SCRIPTS_DIR, "..", "public", "gallery", "_raw")
os.makedirs(RAW_DIR, exist_ok=True)

UID = "7123840303"

def js_fetch_page(max_id=None):
    """Generate a javascript: URL to fetch one page of posts."""
    url_part = f"/api/v1/feed/user/{UID}/?count=33"
    if max_id:
        url_part += f"&max_id={max_id}"
    
    # JavaScript that fetches one page and puts result in document.title
    js = f"""void(fetch('{url_part}',{{headers:{{'X-IG-App-ID':'936619743392459'}}}}).then(r=>r.json()).then(d=>{{let codes=[];(d.items||[]).forEach(i=>{{if(i.code&&!i.video_versions)codes.push(i.code)}});document.title='DATA:'+codes.join(',')+':NEXT:'+(d.next_max_id||'')+'|MORE:'+(d.more_available||false)}}).catch(e=>document.title='ERR:'+e.message))"""
    return f"javascript:{js}"

def main():
    all_codes = []
    max_id = None
    page = 0
    
    # We need the shortcodes file path
    sc_file = os.path.join(SCRIPTS_DIR, "shortcodes.txt")
    
    print(f"Starting pagination from user {UID}...")
    print("NOTE: This script generates JavaScript URLs for the browser.")
    print("Copy-paste each URL into the browser console or use browser_navigate.")
    print()
    
    # For automated use, output URLs
    urls = []
    
    # First page
    url = js_fetch_page()
    print(f"Page 1: {url[:100]}...")
    urls.append(url)
    
    # We'll output the URLs and a shell script to drive the process
    # But actually, let's just output all the shortcodes from the first page that we already got
    # And provide instructions
    
    # Actually, let's just save the initial codes we already have from the direct API
    # Then provide a shell script approach
    
    # Try fetching pages with the session cookies from the direct Python API
    # This won't work for pagination, but let's get page 1
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "X-IG-App-ID": "936619743392459",
        "Referer": "https://www.instagram.com/a_falkvard_tattoo/",
    }
    
    url = f"https://www.instagram.com/api/v1/feed/user/{UID}/?count=33"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            for item in data.get("items", []):
                code = item.get("code")
                if code and not item.get("video_versions"):
                    all_codes.append(code)
            print(f"Page 1 (direct): {len(all_codes)} codes")
            max_id = data.get("next_max_id")
    except Exception as e:
        print(f"Direct API page 1 error: {e}")
    
    # Save what we have
    with open(sc_file, "w") as f:
        for code in all_codes:
            f.write(code + "\n")
    
    print(f"\nSaved {len(all_codes)} shortcodes to {sc_file}")
    print(f"Next max_id: {max_id}")
    print(f"\nTo continue pagination, run in the browser console:")
    print(f"  Use the IDE browser navigate tool with the javascript: URLs")

if __name__ == "__main__":
    main()
