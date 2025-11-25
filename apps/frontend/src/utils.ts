
export interface GameScorePercentiles {
    // Zero points scored
    loss: 0,
    // Barely makes the cut
    low: number,
    // Not too bad
    medium: number,
    // Good, could be better
    good: number,
    // Getting this many points nets the ordinary 100% score
    full: number,
    // Gettings this many points gives you more then 100% score
    beyond_full: number,

}

export function normalizeGameScore(score: number, maxScore: number, timeBonusPercentage?: number): number {
    const calculatedTimeBonus = timeBonusPercentage ? timeBonusPercentage * 200 : 0;
    return (score / maxScore * 1000) + calculatedTimeBonus;
}