export function normalizeGameScore(score: number, maxScore: number, timeBonusPercentage?: number): number {
    const calculatedTimeBonus = timeBonusPercentage ? timeBonusPercentage * 200 : 0;
    const totalScore = (score / maxScore * 1000) + calculatedTimeBonus;
    return Math.round(totalScore);
}