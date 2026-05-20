import type { Pokemon } from "../data/pokemon";

export function pickNextPokemon(list: Pokemon[], previousId?: number, usedIds = new Set<number>()) {
  const available = list.filter((pokemon) => !usedIds.has(pokemon.id));
  const candidates = available.length ? available : list;
  if (candidates.length === 1) return candidates[0];

  let next = candidates[Math.floor(Math.random() * candidates.length)];
  while (next.id === previousId) {
    next = candidates[Math.floor(Math.random() * candidates.length)];
  }
  return next;
}
