import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pokemonList } from "../src/data/pokemon.ts";
import { getAcceptedAnswers, isCloseAnswer, levenshteinDistance, normalizeAnswer } from "../src/utils/answerMatching.ts";

function byName(name: string) {
  const pokemon = pokemonList.find((item) => item.zh === name);
  assert.ok(pokemon, `missing pokemon fixture: ${name}`);
  return pokemon;
}

describe("answer matching", () => {
  it("normalizes spaces and case", () => {
    assert.equal(normalizeAnswer("  Mr Mime  "), "mrmime");
    assert.equal(normalizeAnswer("PI KA CHU"), "pikachu");
    assert.equal(normalizeAnswer(" 妙 蛙 种 子 "), "妙蛙种子");
  });

  it("accepts Chinese names, English names, and aliases in normal mode", () => {
    const pikachu = byName("皮卡丘");
    const accepted = getAcceptedAnswers(pikachu, "normal");

    assert.ok(accepted.includes("皮卡丘"));
    assert.ok(accepted.includes("pikachu"));
    assert.ok(accepted.includes("比卡超"));
  });

  it("does not accept aliases in hard mode", () => {
    const charizard = byName("喷火龙");
    const accepted = getAcceptedAnswers(charizard, "hard");

    assert.ok(accepted.includes("喷火龙"));
    assert.ok(accepted.includes("charizard"));
    assert.equal(accepted.includes("老喷"), false);
  });

  it("detects close answers without accepting unrelated answers", () => {
    const accepted = getAcceptedAnswers(byName("妙蛙种子"), "normal");

    assert.equal(isCloseAnswer("妙蛙", accepted), true);
    assert.equal(isCloseAnswer("妙蛙种", accepted), true);
    assert.equal(isCloseAnswer("杰尼龟", accepted), false);
  });

  it("computes edit distance for typo tolerance", () => {
    assert.equal(levenshteinDistance("pikachu", "pikach"), 1);
    assert.equal(levenshteinDistance("bulbasaur", "bulbasar"), 1);
    assert.equal(levenshteinDistance("mewtwo", "pikachu"), 7);
  });
});
