import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pokemonList } from "../src/data/pokemon.ts";
import { correctVoiceAnswer, scoreVoiceAnswerAgainstName } from "../src/utils/voiceAnswerCorrection.ts";
import { pinyinSequenceSimilarity, toPinyinSyllables } from "../src/utils/voice/pinyinSimilarity.ts";

function byName(name: string) {
  const pokemon = pokemonList.find((item) => item.zh === name);
  assert.ok(pokemon, `missing pokemon fixture: ${name}`);
  return pokemon;
}

describe("voice answer correction", () => {
  it("matches homophones through pinyin instead of special replacement rules", () => {
    const pikachu = byName("皮卡丘");
    const squirtle = byName("杰尼龟");
    const zubat = byName("超音蝠");
    const magikarp = byName("鲤鱼王");
    const farfetchd = byName("大葱鸭");
    const oddish = byName("走路草");

    assert.equal(correctVoiceAnswer("皮卡球", pikachu, pokemonList, "normal").correctedAnswer, "皮卡丘");
    assert.equal(correctVoiceAnswer("杰尼归", squirtle, pokemonList, "normal").correctedAnswer, "杰尼龟");
    assert.equal(correctVoiceAnswer("超音符", zubat, pokemonList, "normal").correctedAnswer, "超音蝠");
    assert.equal(correctVoiceAnswer("鲤鱼旺", magikarp, pokemonList, "normal").correctedAnswer, "鲤鱼王");
    assert.equal(correctVoiceAnswer("大葱呀", farfetchd, pokemonList, "normal").correctedAnswer, "大葱鸭");
    assert.equal(correctVoiceAnswer("答案是走路草", oddish, pokemonList, "normal").correctedAnswer, "走路草");
  });

  it("uses all recognition alternatives before giving up", () => {
    const zubat = byName("超音蝠");
    const correction = correctVoiceAnswer(["超音符", "超音蝠"], zubat, pokemonList, "normal");

    assert.equal(correction.correctedAnswer, "超音蝠");
    assert.equal(correction.shouldRetry, false);
  });

  it("keeps hard mode aliases disabled", () => {
    const charizard = byName("喷火龙");
    const correction = correctVoiceAnswer("老喷", charizard, pokemonList, "hard");

    assert.equal(correction.shouldRetry, true);
  });

  it("does not force a low-confidence noisy transcript into a wrong answer", () => {
    const bulbasaur = byName("妙蛙种子");
    const correction = correctVoiceAnswer("今天晚上吃什么", bulbasaur, pokemonList, "normal");

    assert.equal(correction.shouldRetry, true);
  });

  it("scores phonetic confusion through syllable similarity", () => {
    assert.ok(scoreVoiceAnswerAgainstName("鲤鱼旺", "鲤鱼王") >= 0.9);
    assert.ok(scoreVoiceAnswerAgainstName("大葱呀", "大葱鸭") >= 0.9);
    assert.ok(pinyinSequenceSimilarity(toPinyinSyllables("开始"), toPinyinSyllables("凯西")) >= 0.7);
    assert.ok(pinyinSequenceSimilarity(toPinyinSyllables("胖丁"), toPinyinSyllables("判定")) >= 0.7);
  });

  it("retries risky near-neighbor matches instead of forcing an answer", () => {
    const nidoranFemale = byName("尼多兰");
    const correction = correctVoiceAnswer("尼多朗", nidoranFemale, pokemonList, "normal");

    assert.equal(correction.shouldRetry, true);
  });
});
