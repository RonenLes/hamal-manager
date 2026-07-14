type MatchScoreBarProps = {
  score: number;
};

// Renders the match score bar component.
export default function MatchScoreBar({ score }: MatchScoreBarProps) {
  const percentage = Math.round(score * 100);
  const colorClass =
    percentage >= 80
      ? "bg-emerald-400 text-emerald-700 dark:text-emerald-300"
      : percentage >= 50
        ? "bg-orange-400 text-orange-700 dark:text-orange-300"
        : "bg-red-400 text-red-700 dark:text-red-300";
  const [barClass, textClass] = colorClass.split(" ");

  return (
    <div className="mt-3 flex items-center gap-3">
      <span className={`text-xs font-semibold uppercase ${textClass}`}>
        Match
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-card-soft">
        <div
          className={`h-full rounded-full ${barClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`text-xs font-semibold ${textClass}`}>{percentage}%</span>
    </div>
  );
}
