// QA screenshots + OG image capture against the built site (vite preview).
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";

const OUT = process.env.SHOT_DIR ?? "shots";
mkdirSync(OUT, { recursive: true });

const preview = spawn("npx", ["vite", "preview", "--port", "4173", "--strictPort"], {
  stdio: "ignore",
});
await new Promise((r) => setTimeout(r, 2500));

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });

// Scroll through the page so IntersectionObserver reveals fire before shots.
async function revealAll(page) {
  await page.evaluate(async () => {
    const step = window.innerHeight / 2;
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForTimeout(500);
}
try {
  // Desktop full page
  let page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto("http://localhost:4173/", { waitUntil: "networkidle" });
  await revealAll(page);
  await page.screenshot({ path: `${OUT}/desktop-full.png`, fullPage: true });

  // OG image: hero crop at 1200x630
  const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await og.goto("http://localhost:4173/", { waitUntil: "networkidle" });
  await og.addStyleTag({ content: ".nav{display:none} .hero{padding-block:48px}" });
  await og.waitForTimeout(600);
  await og.screenshot({ path: "public/og.png" });

  // Mobile 375px full page
  const mob = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await mob.goto("http://localhost:4173/", { waitUntil: "networkidle" });
  await revealAll(mob);
  await mob.screenshot({ path: `${OUT}/mobile-full.png`, fullPage: true });

  // Horizontal overflow check at 375px, with offenders
  const overflow = await mob.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const offenders = [];
    for (const el of document.querySelectorAll("*")) {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 || r.left < -1) {
        offenders.push(
          `${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]} right=${Math.round(r.right)}`,
        );
      }
    }
    return {
      px: document.documentElement.scrollWidth - vw,
      offenders: offenders.slice(0, 12),
    };
  });
  console.log("375px horizontal overflow px:", overflow.px);
  console.log(overflow.offenders.join("\n"));

  // Tier modal open state
  await mob.click(".tier--recommended .btn");
  await mob.waitForTimeout(400);
  await mob.screenshot({ path: `${OUT}/mobile-modal.png` });

  console.log("done");
} finally {
  await browser.close();
  preview.kill();
}
