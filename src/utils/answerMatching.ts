import type { Difficulty } from "../hooks/usePokemonGame";
import type { Pokemon } from "../data/pokemon";

export function normalizeAnswer(value: string) {
  return value.trim().replace(/\s+/g, "").toLowerCase();
}

export function getAcceptedAnswers(pokemon: Pokemon, difficulty: Difficulty) {
  const aliases = difficulty === "hard" ? [] : pokemon.aliases;
  return [pokemon.zh, pokemon.en, ...aliases].map(normalizeAnswer);
}

export function levenshteinDistance(left: string, right: string) {
  const rows = Array.from({ length: left.length + 1 }, (_, index) => [index]);

  for (let column = 1; column <= right.length; column += 1) {
    rows[0][column] = column;
  }

  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1;
      rows[row][column] = Math.min(
        rows[row - 1][column] + 1,
        rows[row][column - 1] + 1,
        rows[row - 1][column - 1] + cost,
      );
    }
  }

  return rows[left.length][right.length];
}

export function isCloseAnswer(answer: string, acceptedAnswers: string[]) {
  if (answer.length < 2) return false;

  return acceptedAnswers.some((accepted) => {
    if (accepted.length < 3) return false;
    if (accepted.startsWith(answer) || answer.startsWith(accepted)) return true;

    const maxDistance = accepted.length >= 6 ? 2 : 1;
    return levenshteinDistance(answer, accepted) <= maxDistance;
  });
}
