import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pokedex } from "../src/data/pokedex.ts";
import { createPokedexSpeech, getPokedexFacts } from "../src/utils/pokedexText.ts";

const duplicateEntry = {
  category: "蛹宝可梦",
  intro: "虽然几乎动也动不了，但是如果遇到了危险，有时似乎会竖起毒刺来反抗。",
  trivia: "虽然几乎动也动不了，但是如果遇到了危险，有时似乎会竖起毒刺来反抗。",
  types: ["虫", "毒"],
};

describe("pokedex text", () => {
  it("deduplicates repeated facts", () => {
    assert.deepEqual(getPokedexFacts(duplicateEntry), [duplicateEntry.intro]);
  });

  it("deduplicates narration content", () => {
    const speech = createPokedexSpeech("铁壳蛹", duplicateEntry);

    assert.equal(speech, "铁壳蛹，蛹宝可梦。属性：虫、毒。虽然几乎动也动不了，但是如果遇到了危险，有时似乎会竖起毒刺来反抗。");
  });

  it("keeps generation two and three entries out of fallback copy", () => {
    const fallbackEntries = Object.entries(pokedex)
      .filter(([id]) => Number(id) >= 152 && Number(id) <= 386)
      .filter(([, entry]) => /全国图鉴编号|暂无更多图鉴描述/.test(`${entry.intro}${entry.trivia}`))
      .map(([id]) => id);

    assert.deepEqual(fallbackEntries, []);
  });
});
