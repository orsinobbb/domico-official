import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

async function read(relativePath) {
  return readFile(resolve(root, relativePath), "utf8");
}

test("official homepage exposes the DOMICO brand and complete sharing metadata", async () => {
  const html = await read("index.html");

  assert.match(html, /<title>豆米口 DOMICO｜把平凡過得有滋有味<\/title>/);
  assert.match(html, /rel="canonical" href="https:\/\/domicotaiwan\.com\/"/);
  assert.match(html, /property="og:title" content="豆米口 DOMICO｜把平凡過得有滋有味"/);
  assert.match(html, /property="og:image" content="https:\/\/domicotaiwan\.com\/doumikou-hero-ai-team\.png"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.match(html, /rel="manifest" href="manifest\.webmanifest"/);
  assert.match(html, /id="brand-world"/);
  assert.match(html, /豆米口製造所/);
  assert.match(html, /豆米口科技/);
});

test("all first-party homepage assets use static-host-friendly relative URLs", async () => {
  const html = await read("index.html");
  const assetUrls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((url) => !url.startsWith("#") && !url.startsWith("http") && !url.startsWith("data:"));

  assert.ok(assetUrls.length >= 4, "expected the homepage to declare its assets");
  assert.ok(assetUrls.every((url) => !url.startsWith("/")), `root-relative asset found: ${assetUrls.find((url) => url.startsWith("/"))}`);
});

test("deployment files describe the production site", async () => {
  const [manifestText, robots, sitemap, cname] = await Promise.all([
    read("manifest.webmanifest"),
    read("robots.txt"),
    read("sitemap.xml"),
    read("CNAME"),
  ]);
  const manifest = JSON.parse(manifestText);

  assert.equal(manifest.name, "豆米口 DOMICO");
  assert.equal(manifest.lang, "zh-Hant");
  assert.equal(manifest.start_url, "./");
  assert.match(robots, /Sitemap: https:\/\/domicotaiwan\.com\/sitemap\.xml/);
  assert.match(sitemap, /<loc>https:\/\/domicotaiwan\.com\/<\/loc>/);
  assert.equal(cname.trim(), "domicotaiwan.com");
});
