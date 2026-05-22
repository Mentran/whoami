export function getNextStreak(currentStreak: number, isHit: boolean) {
  return isHit ? currentStreak + 1 : 0;
}
