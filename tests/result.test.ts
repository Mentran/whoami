import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatAverageAnswerTime, getAverageAnswerSeconds, getInfiniteRank } from "../src/utils/result.ts";

describe("result helpers", () => {
  it("formats average answer time from hit rounds only", () => {
    assert.equal(getAverageAnswerSeconds([]), null);
    assert.equal(getAverageAnswerSeconds([2.04, 3.16]), 2.6);
    assert.equal(formatAverageAnswerTime(null), "--");
    assert.equal(formatAverageAnswerTime(4.2), "4.2s");
  });

  it("maps infinite streaks to ranks", () => {
    assert.deepEqual(getInfiniteRank(0), { badge: "铜色徽章", title: "新人训练家" });
    assert.deepEqual(getInfiniteRank(10), { badge: "红色徽章", title: "王牌训练家" });
    assert.deepEqual(getInfiniteRank(40), { badge: "彩虹徽章", title: "剪影大师" });
  });
});
