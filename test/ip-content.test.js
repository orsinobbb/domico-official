import test from "node:test";
import assert from "node:assert/strict";

import {
  audiencePaths,
  characters,
  kindnessCards,
  storySeason,
} from "../src/ip-content.js";

test("three characters have layered identities without fixed ages", () => {
  assert.deepEqual(characters.map(({ id }) => id), ["dou", "mi", "kou"]);
  assert.equal(new Set(characters.map(({ id }) => id)).size, 3);

  for (const character of characters) {
    for (const field of ["outerImpression", "innerConflict", "learning"]) {
      assert.equal(typeof character[field], "string");
      assert.ok(character[field].length >= 8, `${character.id}.${field} needs meaningful copy`);
      assert.doesNotMatch(character[field], /\d+\s*歲|年齡/);
    }
    assert.ok(character.strengths.length >= 2);
    assert.ok(character.blindSpots.length >= 2);
  }
});

test("the first season contains exactly three ordered, connected stories", () => {
  assert.equal(storySeason.id, "season-1-small-things");
  assert.equal(storySeason.stories.length, 3);
  assert.deepEqual(storySeason.stories.map(({ id }) => id), [
    "rain-reason",
    "little-star",
    "share-bread",
  ]);

  const [first, second, third] = storySeason.stories;
  assert.equal(first.previousId, null);
  assert.equal(first.nextId, second.id);
  assert.equal(second.previousId, first.id);
  assert.equal(second.nextId, third.id);
  assert.equal(third.previousId, second.id);
  assert.equal(third.nextId, null);
  for (const story of storySeason.stories) {
    assert.ok(story.theme.length >= 4);
    assert.ok(story.characterIds.length >= 1);
    assert.match(story.image, /^images\/comics\/.+\.png$/);
  }
});

test("kindness ritual has seven private, actionable cards", () => {
  assert.equal(kindnessCards.length, 7);
  assert.equal(new Set(kindnessCards.map(({ id }) => id)).size, 7);
  for (const card of kindnessCards) {
    assert.match(card.characterId, /^(dou|mi|kou)$/);
    assert.ok(card.action.length >= 8);
    assert.ok(card.voice.length >= 8);
  }
});

test("audience paths stay focused on fans, families and partners", () => {
  assert.deepEqual(audiencePaths.map(({ id }) => id), ["fan", "family", "partner"]);
  for (const path of audiencePaths) {
    assert.ok(path.promise.length >= 8);
    assert.ok(path.nextStep.label.length >= 4);
    assert.ok(path.nextStep.target.startsWith("#") || path.nextStep.target.startsWith("mailto:"));
  }
});
