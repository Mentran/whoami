import type { Pokemon } from "../../data/pokemon";

const riskyNameGroups = [
  ["尼多兰", "尼多朗"],
  ["小火龙", "火恐龙", "喷火龙"],
  ["呆呆兽", "呆壳兽"],
  ["多边兽", "百变怪"],
];

function findRiskGroup(name: string) {
  return riskyNameGroups.find((group) => group.includes(name)) || null;
}

export function isRiskyNeighbor(left: Pokemon, right: Pokemon) {
  if (left.id === right.id) return false;

  const leftGroup = findRiskGroup(left.zh);
  return Boolean(leftGroup?.includes(right.zh));
}

export function shouldRetryAmbiguousMatch(options: {
  currentPokemon: Pokemon;
  currentScore: number;
  topPokemon: Pokemon;
  topScore: number;
  secondPokemon?: Pokemon;
  secondScore?: number;
}) {
  const { currentPokemon, currentScore, topPokemon, topScore, secondPokemon, secondScore = 0 } = options;

  if (topPokemon.id !== currentPokemon.id && currentScore >= 0.78 && topScore - currentScore < 0.12) {
    return true;
  }

  if (secondPokemon && isRiskyNeighbor(topPokemon, secondPokemon) && topScore - secondScore < 0.12) {
    return true;
  }

  return false;
}
