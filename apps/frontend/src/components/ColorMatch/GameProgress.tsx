interface GameProgressProps {
  segments: boolean[];
  doneColor?: string;
  incompleteColor?: string;
}

export function GameProgress({
  segments,
  doneColor = "#4ade80", // soft green for completed
  incompleteColor = "#e5e7eb", // light gray for incomplete
}: GameProgressProps) {
  const sorted = [...segments].sort((a, b) => (a === b ? 0 : a ? -1 : 1));

  return (
    <div className="flex gap-2 items-center">
      {sorted.map((done, i) => (
        <div
          key={i}
          className="h-2.5 w-11 rounded-full transition-colors duration-300"
          style={{ backgroundColor: done ? doneColor : incompleteColor }}
        />
      ))}
    </div>
  );
}
