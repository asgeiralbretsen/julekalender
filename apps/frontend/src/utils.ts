export function normalizeGameScore(score: number, maxScore: number, timeBonusPercentage?: number): number {
    const calculatedTimeBonus = timeBonusPercentage ? timeBonusPercentage * 200 : 0;
    return (score / maxScore * 1000) + calculatedTimeBonus;
}