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

export function svgToDataUrl(svg: string) {
  const bytes = new TextEncoder().encode(svg);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const base64 = btoa(bin);
  return `data:image/svg+xml;base64,${base64}`;
}
