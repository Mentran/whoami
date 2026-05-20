import type { Pokemon } from "../../data/pokemon";
import type { Difficulty } from "../../hooks/usePokemonGame";
import { normalizeAnswer } from "../answerMatching.ts";
import { toPinyinSyllables } from "./pinyinSimilarity.ts";

export type VoiceLexiconEntryKind = "official" | "english" | "alias";

export type VoiceLexiconEntry = {
  kind: VoiceLexiconEntryKind;
  name: string;
  normalized: string;
  pokemon: Pokemon;
  syllables: string[];
};

export function getVoiceNames(pokemon: Pokemon, difficulty: Difficulty) {
  const aliases = difficulty === "hard" ? [] : pokemon.aliases;
  return [
    { kind: "official" as const, name: pokemon.zh },
    { kind: "english" as const, name: pokemon.en },
    ...aliases.map((name) => ({ kind: "alias" as const, name })),
  ];
}

export function createVoiceLexicon(list: Pokemon[], difficulty: Difficulty): VoiceLexiconEntry[] {
  return list.flatMap((pokemon) => {
    return getVoiceNames(pokemon, difficulty).map(({ kind, name }) => ({
      kind,
      name,
      normalized: normalizeAnswer(name),
      pokemon,
      syllables: toPinyinSyllables(name),
    }));
  });
}
