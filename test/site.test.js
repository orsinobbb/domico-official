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

test("character discovery shows three human layers instead of a single label", async () => {
  const html = await read("index.html");

  assert.match(html, /id="friends"/);
  assert.match(html, /別人先看見的我/);
  assert.match(html, /其實心裡/);
  assert.match(html, /我正在學著/);
  assert.match(html, /data-character-favorite/);
});

test("the first story season exposes three connected, actionable entries", async () => {
  const html = await read("index.html");

  assert.match(html, /小小事情研究所/);
  assert.match(html, /在平凡裡練習理解、分享與被接住/);
  assert.equal((html.match(/data-story-id=/g) ?? []).length, 3);
  assert.equal((html.match(/data-story-character/g) ?? []).length, 3);
  assert.equal((html.match(/data-story-go="previous"/g) ?? []).length, 3);
  assert.equal((html.match(/data-story-go="next"/g) ?? []).length, 3);
  assert.equal((html.match(/href="#kindness"/g) ?? []).length, 3);
  assert.equal((html.match(/data-story-object/g) ?? []).length, 3);
});

test("homepage fragment links are never empty or missing their destination", async () => {
  const html = await read("index.html");
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  const fragments = [...html.matchAll(/\bhref="#([^"]*)"/g)].map((match) => match[1]);

  assert.ok(fragments.length > 0);
  assert.ok(fragments.every(Boolean), "empty fragment link found");
  assert.deepEqual(fragments.filter((fragment) => !ids.has(fragment)), []);
});

test("daily kindness works without sign-in and always exposes a share fallback", async () => {
  const html = await read("index.html");

  assert.match(html, /id="kindness-card"/);
  assert.match(html, /id="kindness-action"/);
  assert.match(html, /id="kindness-voice"/);
  assert.match(html, /data-kindness-redraw/);
  assert.match(html, /data-kindness-favorite/);
  assert.match(html, /data-kindness-share/);
  assert.match(html, /id="kindness-share-fallback"[^>]*readonly/);
  assert.match(html, /id="kindness-feedback"[^>]*aria-live="polite"/);
  assert.doesNotMatch(html, /<form[^>]*kindness|<input[^>]*kindness/);
});
