import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadPokemonProgress, recordPokemonRound, updatePokemonProgress } from "../src/utils/pokemonProgress.ts";

describe("pokemon progress", () => {
  it("records a hit and grows the correct streak", () => {
    const firstHit = updatePokemonProgress({}, 25, "hit", 100);
    const secondHit = updatePokemonProgress(firstHit, 25, "hit", 200);

    assert.deepEqual(secondHit[25], {
      pokemonId: 25,
      seen: 2,
      hit: 2,
      miss: 0,
      correctStreak: 2,
      lastSeenAt: 200,
    });
  });

  it("counts skips and timeouts as misses and breaks the streak", () => {
    const hit = updatePokemonProgress({}, 7, "hit", 100);
    const skipped = updatePokemonProgress(hit, 7, "skip", 200);
    const timedOut = updatePokemonProgress(skipped, 7, "timeout", 300);

    assert.deepEqual(timedOut[7], {
      pokemonId: 7,
      seen: 3,
      hit: 1,
      miss: 2,
      correctStreak: 0,
      lastSeenAt: 300,
    });
  });

  it("persists records through local storage", () => {
    const values = new Map<string, string>();
    const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");

    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem(key: string) {
          return values.get(key) ?? null;
        },
        setItem(key: string, value: string) {
          values.set(key, value);
        },
      },
    });

    try {
      recordPokemonRound(150, "timeout");
      const records = loadPokemonProgress();

      assert.deepEqual(records[150], {
        pokemonId: 150,
        seen: 1,
        hit: 0,
        miss: 1,
        correctStreak: 0,
        lastSeenAt: records[150].lastSeenAt,
      });
    } finally {
      if (originalStorage) Object.defineProperty(globalThis, "localStorage", originalStorage);
      else Reflect.deleteProperty(globalThis, "localStorage");
    }
  });
});
