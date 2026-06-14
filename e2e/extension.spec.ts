import { test, expect, chromium, type BrowserContext } from "@playwright/test";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

const extPath = path.resolve(__dirname, "../chrome-extension");
let ctx: BrowserContext;
let extId: string;

test.beforeAll(async () => {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "coss-ext-"));
  ctx = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extPath}`,
      `--load-extension=${extPath}`,
      "--no-sandbox",
    ],
  });
  let [sw] = ctx.serviceWorkers();
  if (!sw) sw = await ctx.waitForEvent("serviceworker");
  extId = sw.url().split("/")[2];
});

test.afterAll(async () => {
  await ctx?.close();
});

test("panel page renders", async () => {
  const page = await ctx.newPage();
  await page.goto(`chrome-extension://${extId}/dist/side-panel/index.html`);
  await expect(page.getByText("COSS 主题调色")).toBeVisible();
});

test("content script injects :root/.dark override style on a page", async () => {
  const page = await ctx.newPage();
  await page.goto("data:text/html," + encodeURIComponent(
    `<!doctype html><html class="light"><head><style>` +
    `:root{--primary:oklch(0.205 0 0)} .dark{--primary:oklch(0.87 0 0)}` +
    `</style></head><body><div id="swatch">coss mock</div></body></html>`
  ));
  await page.addScriptTag({ path: path.resolve(extPath, "dist/contentScript.js") });
  await page.evaluate(() => {
    const w = window as unknown as {
      __cossInject?: (o: {
        base: Record<string, string>;
        light: Record<string, string>;
        dark: Record<string, string>;
      }) => void;
    };
    w.__cossInject?.({
      base: { radius: "1.25rem" },
      light: { primary: "oklch(0.6 0.2 250)" },
      dark: { primary: "oklch(0.7 0.1 250)" },
    });
  });
  const styleText = await page.locator("#coss-tweak").textContent();
  expect(styleText).toContain(":root {");
  expect(styleText).toContain("--radius: 1.25rem;");
  expect(styleText).toContain("--primary: oklch(0.6 0.2 250);");
  // base 只进 :root，不进 .dark
  const darkBlock = styleText!.slice(styleText!.indexOf(".dark {"));
  expect(darkBlock).not.toContain("--radius");
  const radius = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--radius").trim()
  );
  expect(radius).toBe("1.25rem");
});
