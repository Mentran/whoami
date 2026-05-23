import type { Difficulty } from "../hooks/usePokemonGame";

export const difficultyLabels: Record<Difficulty, string> = {
  easy: "简单",
  normal: "普通",
  hard: "困难",
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

export function getAverageAnswerSeconds(answerTimes: number[]) {
  if (!answerTimes.length) return null;

  const total = answerTimes.reduce((sum, seconds) => sum + seconds, 0);
  return Math.round((total / answerTimes.length) * 10) / 10;
}

export function formatAverageAnswerTime(seconds: number | null) {
  if (seconds === null) return "--";
  return `${seconds.toFixed(1)}s`;
}

export function getInfiniteRank(streak: number) {
  if (streak >= 40) return { badge: "彩虹徽章", title: "剪影大师" };
  if (streak >= 25) return { badge: "紫色徽章", title: "联盟冠军" };
  if (streak >= 15) return { badge: "蓝色徽章", title: "图鉴达人" };
  if (streak >= 10) return { badge: "红色徽章", title: "王牌训练家" };
  if (streak >= 6) return { badge: "金色徽章", title: "道馆挑战者" };
  if (streak >= 3) return { badge: "银色徽章", title: "熟练训练家" };
  return { badge: "铜色徽章", title: "新人训练家" };
}

export function createResultText(hit: number, roundLimit: number, difficulty: Difficulty) {
  const rating = getRating(hit, roundLimit);
  const difficultyName = difficultyNames[difficulty];
  return `我在「我是谁？」宝可梦剪影挑战中拿到 ${hit}/${roundLimit}，难度：${difficultyName}，评级：${getRatingText(hit, roundLimit)}。`;
}
