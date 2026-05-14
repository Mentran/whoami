import type { Difficulty } from "../hooks/usePokemonGame";

export const difficultyLabels: Record<Difficulty, string> = {
  easy: "EASY",
  normal: "NORMAL",
  hard: "HARD",
};

export const difficultyNames: Record<Difficulty, string> = {
  easy: "简单",
  normal: "普通",
  hard: "困难",
};

export function getRating(hit: number, roundLimit: number) {
  const ratio = hit / roundLimit;
  if (ratio >= 0.9) return "MASTER";
  if (ratio >= 0.7) return "ACE";
  if (ratio >= 0.4) return "TRAINER";
  return "ROOKIE";
}

export function getRatingText(hit: number, roundLimit: number) {
  const rating = getRating(hit, roundLimit);
  if (rating === "MASTER") return "剪影大师";
  if (rating === "ACE") return "王牌训练家";
  if (rating === "TRAINER") return "合格训练家";
  return "新人训练家";
}

export function createResultText(hit: number, roundLimit: number, difficulty: Difficulty) {
  const rating = getRating(hit, roundLimit);
  const difficultyName = difficultyNames[difficulty];
  return `我在「我是谁？」宝可梦剪影挑战中拿到 ${hit}/${roundLimit}，难度：${difficultyName}，评级：${rating}。`;
}

