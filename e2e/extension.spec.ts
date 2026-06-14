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

  // The built contentScript.js is an ES module that imports from
  // "./assets/messages-*.js". On a plain file:// page the relative import
  // resolves correctly if we intercept the request with page.route.
  // We serve the fixture as an http-scheme page via page.route to avoid
  // file:// cross-origin restrictions on module imports.
  //
  // Strategy: route a synthetic origin so relative imports resolve cleanly.
  const fixtureHtml = fs.readFileSync(
    path.resolve(__dirname, "fixtures/coss-mock.html"),
    "utf-8"
  );
  const contentScriptJs = fs.readFileSync(
    path.resolve(extPath, "dist/contentScript.js"),
    "utf-8"
  );
  const messagesJs = fs.readFileSync(
    path.resolve(extPath, "dist/assets/messages-B5_IvhnY.js"),
    "utf-8"
  );

  // Serve everything under a synthetic http origin so ES module imports work.
  const ORIGIN = "http://coss-e2e-test.local";
  await page.route(`${ORIGIN}/index.html`, (route) =>
    route.fulfill({ contentType: "text/html", body: fixtureHtml })
  );
  await page.route(`${ORIGIN}/contentScript.js`, (route) =>
    route.fulfill({ contentType: "application/javascript", body: contentScriptJs })
  );
  // The content script imports from "./assets/messages-*.js" — intercept that path.
  await page.route(`${ORIGIN}/assets/messages-*.js`, (route) =>
    route.fulfill({ contentType: "application/javascript", body: messagesJs })
  );

  await page.goto(`${ORIGIN}/index.html`);
  await page.addScriptTag({ url: `${ORIGIN}/contentScript.js`, type: "module" });

  // Wait for the module to execute and expose __cossInject
  await page.waitForFunction(() => typeof (window as unknown as { __cossInject?: unknown }).__cossInject === "function");

  // Call the injector with test overrides
  await page.evaluate(() => {
    const w = window as unknown as {
      __cossInject?: (o: { light: Record<string, string>; dark: Record<string, string> }) => void;
    };
    w.__cossInject?.({
      light: { primary: "oklch(0.6 0.2 250)" },
      dark: { primary: "oklch(0.7 0.1 250)" },
    });
  });

  // Verify the style element was created with the correct CSS
  const styleText = await page.locator("#coss-tweak").textContent();
  expect(styleText).toContain(":root {");
  expect(styleText).toContain("--primary: oklch(0.6 0.2 250);");
  expect(styleText).toContain(".dark {");

  // Verify the CSS variable is actually applied in light mode
  const primary = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--primary").trim()
  );
  expect(primary).toBe("oklch(0.6 0.2 250)");
});
