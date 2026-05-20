import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pokemonList } from "../src/data/pokemon.ts";
import { pickNextPokemon } from "../src/utils/roundSelection.ts";

describe("round selection", () => {
  it("does not pick a pokemon already used in the current round set", () => {
    const pool = pokemonList.slice(0, 10);
    const usedIds = new Set<number>();

    for (let index = 0; index < pool.length; index += 1) {
      const next = pickNextPokemon(pool, undefined, usedIds);
      assert.equal(usedIds.has(next.id), false);
      usedIds.add(next.id);
    }

    assert.equal(usedIds.size, pool.length);
  });
});
