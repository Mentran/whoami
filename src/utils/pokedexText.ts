import type { PokedexEntry } from "../data/pokedex";

function compactText(value: string) {
  return value.trim().replace(/\s+/g, "");
}

export function getPokedexFacts(entry: PokedexEntry) {
  const seen = new Set<string>();

  return [entry.intro, entry.trivia].filter((fact) => {
    const key = compactText(fact);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function createPokedexSpeech(name: string, entry: PokedexEntry) {
  const facts = getPokedexFacts(entry).join("");
  return `${name}，${entry.category}。属性：${entry.types.join("、")}。${facts}`;
}
