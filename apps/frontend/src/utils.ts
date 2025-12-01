export function normalizeGameScore(
  score: number,
  maxScore: number,
  timeBonusPercentage?: number
): number {
  const calculatedTimeBonus = timeBonusPercentage
    ? timeBonusPercentage * 200
    : 0;
  const totalScore = (score / maxScore) * 1000 + calculatedTimeBonus;
  return Math.round(totalScore);
}

export function shuffleArray(array: string[]): string[] {
  const newArray = [...array]; // copy so original isn't mutated
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}
