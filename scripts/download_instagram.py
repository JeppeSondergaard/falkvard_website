#!/usr/bin/env python3
"""
Download all images from a public Instagram profile using Playwright with Xvfb.
"""

import os
import re
import sys
import json
import time
import subprocess
import urllib.request
from playwright.sync_api import sync_playwright

PROFILE = "a_falkvard_tattoo"
PROFILE_URL = f"https://www.instagram.com/{PROFILE}/"
USERNAME = "bunkmate018"
PASSWORD = "jmYpG0!tRwY0XFcBGxvV"
RAW_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "gallery", "_raw")
SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
DEBUG_DIR = os.path.join(SCRIPTS_DIR, "debug")

os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs(DEBUG_DIR, exist_ok=True)


def download_image(shortcode, filepath):
    base_sc = shortcode.split("_")[0]
    url = f"https://www.instagram.com/p/{base_sc}/media/?size=l"
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        with open(filepath, "wb") as f:
            f.write(resp.read())


def main():
    xvfb = subprocess.Popen(["Xvfb", ":99", "-screen", "0", "1920x1080x24"],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    os.environ["DISPLAY"] = ":99"
    time.sleep(1)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=False,
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-blink-features=AutomationControlled",
                    "--disable-dev-shm-usage",
                ],
            )
            context = browser.new_context(
                viewport={"width": 1920, "height": 1080},
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                locale="en-US",
            )
            context.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                window.chrome = { runtime: {} };
            """)

            page = context.new_page()

            # Login
            print("Step 1: Logging in...")
            page.goto("https://www.instagram.com/accounts/login/", timeout=30000)
            time.sleep(5)
            page.screenshot(path=os.path.join(DEBUG_DIR, "01_initial.png"))
            print(f"  Title: {page.title()}")
            print(f"  URL: {page.url}")

            # Check page state - might show cookie consent, login form, or "Continue as"
            has_cookie_btn = False
            try:
                for text in ["Allow all cookies", "Allow essential and optional cookies", "Accept All", "Only allow essential cookies"]:
                    btn = page.locator(f'button:has-text("{text}")')
                    if btn.count() > 0 and btn.first.is_visible(timeout=2000):
                        print(f"  Clicking: {text}")
                        btn.first.click()
                        has_cookie_btn = True
                        time.sleep(2)
                        break
            except:
                pass

            # Check if login form is present
            login_form = page.locator('input[name="username"]')
            continue_btn = page.locator('button:has-text("Continue")')

            if login_form.count() > 0:
                try:
                    login_form.wait_for(state="visible", timeout=5000)
                    print("  Found login form, filling credentials...")
                    page.fill('input[name="username"]', USERNAME)
                    time.sleep(0.3)
                    page.fill('input[name="password"]', PASSWORD)
                    time.sleep(0.3)
                    page.screenshot(path=os.path.join(DEBUG_DIR, "02_form.png"))
                    page.click('button[type="submit"]')
                    time.sleep(8)
                except:
                    print("  Login form not visible, trying direct navigation")
            elif continue_btn.count() > 0:
                print("  Found 'Continue' button, clicking...")
                continue_btn.first.click()
                time.sleep(5)
            else:
                print("  No login form or continue button found")
                page.screenshot(path=os.path.join(DEBUG_DIR, "02_unknown.png"))

            page.screenshot(path=os.path.join(DEBUG_DIR, "03_after_login.png"))
            print(f"  After login - URL: {page.url}, Title: {page.title()}")

            # Dismiss prompts
            for _ in range(3):
                for text in ["Not Now", "Not now", "Ikke nu", "Continue"]:
                    try:
                        btn = page.locator(f'button:has-text("{text}")')
                        if btn.count() > 0 and btn.first.is_visible(timeout=1000):
                            btn.first.click()
                            time.sleep(2)
                    except:
                        pass

            # Navigate to profile
            print(f"\nStep 2: Loading profile {PROFILE}...")
            page.goto(PROFILE_URL, timeout=30000)
            time.sleep(5)
            page.screenshot(path=os.path.join(DEBUG_DIR, "04_profile.png"))
            print(f"  Title: {page.title()}")
            print(f"  URL: {page.url}")

            # Check if we need to dismiss a login modal
            try:
                close_btn = page.locator('button:has-text("Close"), svg[aria-label="Close"]')
                if close_btn.count() > 0 and close_btn.first.is_visible(timeout=2000):
                    close_btn.first.click()
                    time.sleep(2)
            except:
                pass

            # Collect shortcodes by scrolling
            print("\nStep 3: Scrolling to collect all post links...")
            all_shortcodes = set()
            last_count = 0
            stale = 0

            while stale < 10:
                codes = page.evaluate("""() => {
                    const links = document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]');
                    const codes = new Set();
                    for (const a of links) {
                        const m = a.href.match(/\\/(p|reel)\\/([A-Za-z0-9_-]+)/);
                        if (m) codes.add(m[2]);
                    }
                    return [...codes];
                }""")

                for c in codes:
                    all_shortcodes.add(c)

                if len(all_shortcodes) == last_count:
                    stale += 1
                else:
                    stale = 0
                    last_count = len(all_shortcodes)

                if stale % 3 == 0 or len(all_shortcodes) > last_count:
                    print(f"  Found {len(all_shortcodes)} posts (stale: {stale})")

                page.evaluate("window.scrollBy(0, 1200)")
                time.sleep(1.5)

            print(f"  Final count from scrolling: {len(all_shortcodes)}")

            # Try GraphQL API for more completeness
            print("\nStep 4: Trying GraphQL API for remaining posts...")
            try:
                extra = page.evaluate("""async () => {
                    // Get user ID
                    const resp1 = await fetch('/api/v1/users/web_profile_info/?username=a_falkvard_tattoo', {
                        headers: {'X-IG-App-ID': '936619743392459'}
                    });
                    const d1 = await resp1.json();
                    const userId = d1?.data?.user?.id;
                    if (!userId) return {error: 'no user id', codes: []};

                    const allCodes = [];
                    let after = null;
                    let hasNext = true;
                    let pages = 0;

                    while (hasNext && pages < 30) {
                        const variables = {id: userId, first: 50};
                        if (after) variables.after = after;

                        try {
                            const resp = await fetch(`/graphql/query/?query_hash=472f257a40c653c64c666ce877d59d2b&variables=${encodeURIComponent(JSON.stringify(variables))}`, {
                                headers: {'X-Requested-With': 'XMLHttpRequest'}
                            });
                            const data = await resp.json();
                            const media = data?.data?.user?.edge_owner_to_timeline_media;
                            if (!media) break;

                            for (const edge of (media.edges || [])) {
                                const node = edge.node;
                                if (node.shortcode) allCodes.push(node.shortcode);
                            }

                            hasNext = media.page_info?.has_next_page || false;
                            after = media.page_info?.end_cursor || null;
                            pages++;

                            await new Promise(r => setTimeout(r, 2000));
                        } catch(e) {
                            break;
                        }
                    }
                    return {userId, pages, codes: allCodes};
                }""")

                if extra and extra.get("codes"):
                    before = len(all_shortcodes)
                    for c in extra["codes"]:
                        all_shortcodes.add(c)
                    print(f"  GraphQL added {len(all_shortcodes) - before} new codes (total: {len(all_shortcodes)})")
                    print(f"  Pages fetched: {extra.get('pages', 0)}")
                else:
                    print(f"  GraphQL result: {extra}")
            except Exception as e:
                print(f"  GraphQL error: {e}")

            browser.close()

    finally:
        xvfb.terminate()

    # Save shortcodes
    sc_file = os.path.join(SCRIPTS_DIR, "shortcodes.txt")
    with open(sc_file, "w") as f:
        for sc in sorted(all_shortcodes):
            f.write(sc + "\n")
    print(f"\nSaved {len(all_shortcodes)} shortcodes to {sc_file}")

    if len(all_shortcodes) == 0:
        print("No shortcodes found! Check debug screenshots.")
        sys.exit(1)

    # Download images
    print(f"\nStep 5: Downloading images to {RAW_DIR}...")
    downloaded = 0
    skipped = 0
    errors = 0

    for i, shortcode in enumerate(sorted(all_shortcodes)):
        filepath = os.path.join(RAW_DIR, f"{shortcode}.jpg")
        if os.path.exists(filepath):
            skipped += 1
            continue

        try:
            download_image(shortcode, filepath)
            size_kb = os.path.getsize(filepath) / 1024
            downloaded += 1
            if downloaded % 20 == 0 or downloaded <= 5:
                print(f"  [{downloaded}] {shortcode}.jpg ({size_kb:.0f}KB)")
        except Exception as e:
            errors += 1
            if errors <= 5:
                print(f"  Error {shortcode}: {e}")

        time.sleep(0.3)

    print(f"\n{'='*50}")
    print(f"Done! Downloaded: {downloaded}, Skipped: {skipped}, Errors: {errors}")
    print(f"Total images in _raw: {len(os.listdir(RAW_DIR))}")


if __name__ == "__main__":
    main()
