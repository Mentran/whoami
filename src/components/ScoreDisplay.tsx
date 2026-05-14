type ScoreDisplayProps = {
  hit: number;
  total: number;
  best: number;
};

export function ScoreDisplay({ hit, total, best }: ScoreDisplayProps) {
  return (
    <div className="score-display" aria-label={`答对 ${hit} 题，共 ${total} 题，最高 ${best} 题`}>
      <div>
        <span>HIT</span>
        <strong>{String(hit).padStart(2, "0")}</strong>
      </div>
      <div>
        <span>TOT</span>
        <strong>{String(total).padStart(2, "0")}</strong>
      </div>
      <div>
        <span>BEST</span>
        <strong>{String(best).padStart(2, "0")}</strong>
      </div>
    </div>
  );
}

