import { artworkUrl, type Pokemon } from "../data/pokemon";
import type { Difficulty, Phase } from "../hooks/usePokemonGame";
import { difficultyLabels, getRating, getRatingText } from "../utils/result";

type GameScreenProps = {
  difficulty: Difficulty;
  pokemon: Pokemon;
  revealed: boolean;
  feedback: string;
  hit: number;
  phase: Phase;
  onStart: () => void;
  onShareResult: () => void;
  roundLimit: number;
  shareStatus: string;
  setDifficulty: (difficulty: Difficulty) => void;
  total: number;
};

export function GameScreen({
  difficulty,
  pokemon,
  revealed,
  feedback,
  hit,
  phase,
  onStart,
  onShareResult,
  roundLimit,
  shareStatus,
  setDifficulty,
  total,
}: GameScreenProps) {
  const isReady = phase === "ready";
  const isFinished = phase === "finished";

  return (
    <div className={`game-screen phase-${phase}`}>
      {isReady && (
        <div className="start-screen">
          <span className="start-title">WHO'S THAT?</span>
          <div className="difficulty-picker" aria-label="选择难度">
            {(["easy", "normal", "hard"] as Difficulty[]).map((mode) => (
              <button
                className={mode === difficulty ? "active" : ""}
                key={mode}
                onClick={() => setDifficulty(mode)}
                type="button"
              >
                {difficultyLabels[mode]}
              </button>
            ))}
          </div>
          <button className="start-action" onClick={onStart} type="button">
            PRESS START
          </button>
        </div>
      )}

      {isFinished && (
        <div className="result-screen">
          <span className="result-title">GAME SET</span>
          <strong>
            {hit}/{roundLimit}
          </strong>
          <span className="result-rating">{getRating(hit, roundLimit)}</span>
          <span className="result-copy">{getRatingText(hit, roundLimit)}</span>
          <div className="result-actions">
            <button className="share-action" onClick={onShareResult} type="button">
              SHARE
            </button>
            <button className="start-action" onClick={onStart} type="button">
              PLAY AGAIN
            </button>
          </div>
          {shareStatus && <span className="share-status">{shareStatus}</span>}
        </div>
      )}

      {!isReady && !isFinished && (
        <>
          <div className="silhouette-card">
            <img
              alt={revealed ? pokemon.zh : "神秘宝可梦黑影"}
              className={revealed ? "pokemon-art revealed" : "pokemon-art hidden"}
              draggable="false"
              src={artworkUrl(pokemon.id)}
            />
          </div>

          <div className="prompt-panel">
            <p className="round-count">
              ROUND {Math.min(total + 1, roundLimit)}/{roundLimit}
            </p>
            <p className="question">{revealed ? "就是它！" : "我是谁？"}</p>
            <div className="power-meter" aria-hidden="true">
              <span />
            </div>
            <p className="feedback">{feedback}</p>
            <p className="brand">
              POCKET
              <br />
              MONSTERS
            </p>
          </div>
        </>
      )}
    </div>
  );
}
