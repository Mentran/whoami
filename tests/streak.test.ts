import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getNextStreak } from "../src/utils/streak.ts";

describe("streak", () => {
  it("increments only when the round is a hit", () => {
    assert.equal(getNextStreak(0, true), 1);
    assert.equal(getNextStreak(2, true), 3);
  });

  it("breaks on misses, skips, and timeouts", () => {
    assert.equal(getNextStreak(4, false), 0);
  });
});
