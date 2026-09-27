import test from "node:test";
import assert from "node:assert/strict";

import {
  createComicState,
  createGuideState,
  createJourneyState,
  advanceGuide,
  dismissGuide,
  moveComic,
  filterProducts,
  getJourneyStage,
  getMoodRoute,
  getNextJourneyStep,
  recordJourneyMoment,
  resolveActiveChapter,
  selectCharacter,
  toggleWishlist,
} from "../src/state.js";

test("official-site navigation includes the DOMICO brand chapter", async () => {
  const state = await import("../src/state.js");

  assert.deepEqual(state.chapterIds, ["top", "friends", "comic", "shop", "brand-world"]);
});

test("comic navigation wraps from the last chapter to the first", () => {
  const state = createComicState(3, 2);

  assert.deepEqual(moveComic(state, 1), { length: 3, index: 0 });
});

test("comic navigation wraps backward from the first chapter", () => {
  const state = createComicState(3, 0);

  assert.deepEqual(moveComic(state, -1), { length: 3, index: 2 });
});

test("product filtering keeps every item when all is selected", () => {
  const products = [
    { id: "mug", category: "daily" },
    { id: "pin", category: "collectible" },
  ];

  assert.deepEqual(filterProducts(products, "all"), products);
});

test("product filtering returns only the selected category", () => {
  const products = [
    { id: "mug", category: "daily" },
    { id: "pin", category: "collectible" },
    { id: "bag", category: "daily" },
  ];

  assert.deepEqual(filterProducts(products, "daily").map((item) => item.id), ["mug", "bag"]);
});

test("character selection returns the matching character", () => {
  const characters = [
    { id: "dou", name: "小豆" },
    { id: "mi", name: "小米" },
  ];

  assert.deepEqual(selectCharacter(characters, "mi"), { id: "mi", name: "小米" });
});

test("character selection rejects an unknown character", () => {
  assert.throws(() => selectCharacter([{ id: "dou" }], "unknown"), /Unknown character/);
});

test("journey moments are recorded once so repeated clicks do not inflate progress", () => {
  let journey = createJourneyState();

  journey = recordJourneyMoment(journey, "character:mi");
  journey = recordJourneyMoment(journey, "character:mi");

  assert.deepEqual(journey.moments, ["character:mi"]);
  assert.equal(getJourneyStage(journey), "connect");
});

test("reading a comic moves the journey from connection to exploration", () => {
  let journey = recordJourneyMoment(createJourneyState(), "character:dou");

  journey = recordJourneyMoment(journey, "comic:1");

  assert.equal(getJourneyStage(journey), "explore");
});

test("liking one product signals desire while keeping the choice reversible", () => {
  const liked = toggleWishlist(createJourneyState(), "slow-mug");

  assert.deepEqual(liked.wishlist, ["slow-mug"]);
  assert.equal(getJourneyStage(liked), "desire");
  assert.deepEqual(toggleWishlist(liked, "slow-mug").wishlist, []);
});

test("the gentle launch invitation appears only after two distinct product likes", () => {
  let journey = toggleWishlist(createJourneyState(), "slow-mug");
  journey = toggleWishlist(journey, "story-postcards");

  assert.equal(getJourneyStage(journey), "invite");
});

test("first-time guidance advances one step at a time and completes after the final step", () => {
  let guide = createGuideState();

  guide = advanceGuide(guide, 3);
  assert.deepEqual(guide, { step: 1, completed: false, dismissed: false });

  guide = advanceGuide(guide, 3);
  guide = advanceGuide(guide, 3);
  assert.deepEqual(guide, { step: 2, completed: true, dismissed: false });
});

test("dismissed guidance stays completed so returning visitors are not interrupted", () => {
  const guide = dismissGuide(createGuideState());

  assert.deepEqual(guide, { step: 0, completed: true, dismissed: true });
});

test("active chapter follows the last section that passed the reading marker", () => {
  const chapters = [
    { id: "top", top: 0 },
    { id: "friends", top: 900 },
    { id: "comic", top: 1800 },
    { id: "shop", top: 2700 },
  ];

  assert.equal(resolveActiveChapter(2050, chapters), "comic");
  assert.equal(resolveActiveChapter(200, chapters), "top");
});

test("a chosen mood returns one coherent character, story and product route", () => {
  assert.deepEqual(getMoodRoute("pause"), {
    characterId: "mi",
    comicIndex: 1,
    productId: "slow-mug",
  });
  assert.throws(() => getMoodRoute("unknown"), /Unknown mood/);
});

test("the next action changes with the visitor's actual journey progress", () => {
  const justMet = createJourneyState();
  const connected = recordJourneyMoment(justMet, "character:mi");
  const explored = recordJourneyMoment(connected, "comic:2");
  const interested = toggleWishlist(explored, "slow-mug");

  assert.equal(getNextJourneyStep(justMet).target, "#friends");
  assert.equal(getNextJourneyStep(connected).target, "#comic");
  assert.equal(getNextJourneyStep(explored).target, "#shop");
  assert.equal(getNextJourneyStep(interested).target, "#shop");
});

test("two product likes hand off to the launch invitation instead of more shopping", () => {
  let journey = toggleWishlist(createJourneyState(), "slow-mug");
  journey = toggleWishlist(journey, "story-postcards");

  assert.equal(getNextJourneyStep(journey).target, "#launch-invite");
});

test("accepting the launch invitation continues into the official brand story", () => {
  let journey = toggleWishlist(createJourneyState(), "slow-mug");
  journey = toggleWishlist(journey, "story-postcards");
  journey = recordJourneyMoment(journey, "notify:launch");

  assert.equal(getJourneyStage(journey), "belong");
  assert.equal(getNextJourneyStep(journey).target, "#brand-world");
});

test("every new stationery and apparel item opens a complete object story", async () => {
  const state = await import("../src/state.js");

  assert.equal(typeof state.getProductStory, "function", "product story lookup must exist");

  for (const productId of [
    "story-notebook",
    "daily-binder",
    "companion-cup-sleeve",
    "action-tee",
    "slow-sweatshirt",
    "hug-socks",
  ]) {
    const story = state.getProductStory(productId);
    assert.equal(typeof story.title, "string");
    assert.ok(story.story.length > 20);
    assert.ok(story.quote.startsWith("「"));
  }

  assert.throws(() => state.getProductStory("missing-product"), /Unknown product/);
});
