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
  getAudienceNextStep,
  getStoryNeighbor,
  normalizeJourneyState,
  pickKindnessCard,
  recordJourneyMoment,
  resolveActiveChapter,
  selectCharacter,
  toggleWishlist,
  toggleFavorite,
} from "../src/state.js";
import { audiencePaths, kindnessCards, storySeason } from "../src/ip-content.js";

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

test("legacy journeys migrate to reversible V2 favorites without losing progress", () => {
  const migrated = normalizeJourneyState({
    moments: ["character:mi", "character:mi", null],
    wishlist: ["slow-mug", "slow-mug", 17],
  });

  assert.deepEqual(migrated, {
    version: 2,
    moments: ["character:mi"],
    wishlist: ["slow-mug"],
    favoriteCharacters: [],
    favoriteStories: [],
    favoriteKindnessCards: [],
  });
});

test("normalization removes invalid and repeated V2 values", () => {
  const normalized = normalizeJourneyState({
    version: 2,
    moments: "not-an-array",
    wishlist: [],
    favoriteCharacters: ["mi", "mi", false],
    favoriteStories: ["rain-reason", 3],
    favoriteKindnessCards: ["send-a-thanks", "send-a-thanks"],
  });

  assert.deepEqual(normalized.favoriteCharacters, ["mi"]);
  assert.deepEqual(normalized.favoriteStories, ["rain-reason"]);
  assert.deepEqual(normalized.favoriteKindnessCards, ["send-a-thanks"]);
  assert.deepEqual(normalized.moments, []);
});

test("character, story and kindness favorites can each be undone", () => {
  for (const [type, id, field] of [
    ["character", "mi", "favoriteCharacters"],
    ["story", "rain-reason", "favoriteStories"],
    ["kindness", "send-a-thanks", "favoriteKindnessCards"],
  ]) {
    const added = toggleFavorite(createJourneyState(), type, id);
    assert.deepEqual(added[field], [id]);
    assert.deepEqual(toggleFavorite(added, type, id)[field], []);
  }

  assert.throws(() => toggleFavorite(createJourneyState(), "unknown", "x"), /Unknown favorite type/);
});

test("story neighbors stop clearly at the boundaries", () => {
  const [first, second, third] = storySeason.stories;

  assert.equal(getStoryNeighbor(storySeason, first.id, "previous"), null);
  assert.equal(getStoryNeighbor(storySeason, third.id, "next"), null);
  assert.equal(getStoryNeighbor(storySeason, first.id, "next").id, second.id);
  assert.equal(getStoryNeighbor(storySeason, third.id, "previous").id, second.id);
  assert.throws(() => getStoryNeighbor(storySeason, "missing", "next"), /Unknown story/);
});

test("the same kindness seed stays stable and valid seeds never leave the deck", () => {
  const firstPick = pickKindnessCard(kindnessCards, 20260928);
  const repeatPick = pickKindnessCard(kindnessCards, 20260928);

  assert.deepEqual(firstPick, repeatPick);
  for (const seed of [-19, 0, 1, 7, 99, 20260929]) {
    assert.ok(kindnessCards.includes(pickKindnessCard(kindnessCards, seed)));
  }
});

test("audience next steps come from the approved audience paths", () => {
  for (const audience of audiencePaths) {
    assert.deepEqual(getAudienceNextStep(audience.id), audience.nextStep);
  }
  assert.throws(() => getAudienceNextStep("unknown"), /Unknown audience/);
});
