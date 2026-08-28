// Render the ad asset HTML templates to PNGs at exact platform dimensions.
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const ASSETS = [
  { file: "profile.html", out: "profile-1080.png", w: 1080, h: 1080 },
  { file: "cover-fb.html", out: "cover-facebook-1640x624.png", w: 1640, h: 624 },
  { file: "ad-a-feed.html", out: "ad-a-worked-example-1080.png", w: 1080, h: 1080 },
  { file: "ad-b-feed.html", out: "ad-b-one-sentence-1080.png", w: 1080, h: 1080 },
  { file: "ad-c-feed.html", out: "ad-c-anti-noise-1080.png", w: 1080, h: 1080 },
  { file: "ad-a-story.html", out: "ad-a-story-1080x1920.png", w: 1080, h: 1920 },
];

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
try {
  for (const a of ASSETS) {
    const page = await browser.newPage({ viewport: { width: a.w, height: a.h } });
    await page.goto("file://" + join(here, "src", a.file), { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(here, "out", a.out) });
    await page.close();
    console.log("rendered", a.out);
  }
} finally {
  await browser.close();
}
