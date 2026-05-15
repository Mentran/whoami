import { artworkUrl, type Pokemon } from "../data/pokemon";
import type { PokedexEntry } from "../data/pokedex";
import type { Difficulty, Phase } from "../hooks/usePokemonGame";
import { difficultyLabels, getRating, getRatingText } from "../utils/result";

type GameScreenProps = {
  difficulty: Difficulty;
  pokemon: Pokemon;
  pokedexEntry: PokedexEntry;
  revealed: boolean;
  feedback: string;
  hit: number;
  phase: Phase;
  onStart: () => void;
  onShareResult: () => void;
  roundLimit: number;
  roundSeconds: number;
  shareStatus: string;
  setDifficulty: (difficulty: Difficulty) => void;
  showDex: boolean;
  timeLeft: number;
  total: number;
};

export function GameScreen({
  difficulty,
  pokemon,
  pokedexEntry,
  revealed,
  feedback,
  hit,
  phase,
  onStart,
  onShareResult,
  roundLimit,
  roundSeconds,
  shareStatus,
  setDifficulty,
  showDex,
  timeLeft,
  total,
}: GameScreenProps) {
  const isReady = phase === "ready";
  const isFinished = phase === "finished";
  const timeRatio = Math.max(0, Math.min(1, timeLeft / roundSeconds));
  const isTimeUrgent = phase === "playing" && timeLeft <= 3;

  return (
    <div className={`game-screen phase-${phase}`}>
      {isReady && (
        <div className="start-screen">
          <span className="start-title">我是谁？</span>
          <p className="start-subtitle">看剪影，说出宝可梦名字</p>
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
            开始挑战
          </button>
        </div>
      )}

      {isFinished && (
        <div className="result-screen">
          <span className="result-title">挑战完成</span>
          <strong>
            {hit}/{roundLimit}
          </strong>
          <span className="result-rating">{getRating(hit, roundLimit)}</span>
          <span className="result-copy">{getRatingText(hit, roundLimit)}</span>
          <div className="result-actions">
            <button className="share-action" onClick={onShareResult} type="button">
              分享结果
            </button>
            <button className="start-action" onClick={onStart} type="button">
              再来一局
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
              第 {Math.min(total + 1, roundLimit)} / {roundLimit} 题
            </p>
            <p className="question">{revealed ? "就是它！" : "我是谁？"}</p>
            <div className={isTimeUrgent ? "power-meter urgent" : "power-meter"} aria-label={`剩余 ${timeLeft} 秒`}>
              <span style={{ width: `${timeRatio * 100}%` }} />
            </div>
            <p className={isTimeUrgent ? "timer-text urgent" : "timer-text"}>{timeLeft}s</p>
            <p className="feedback">{feedback}</p>
            {showDex && (
              <div className="pokedex-panel">
                <strong>
                  #{String(pokemon.id).padStart(3, "0")} {pokemon.zh}
                </strong>
                <span>{pokedexEntry.types.join(" / ")}</span>
                <p>{pokedexEntry.intro}</p>
                <small>{pokedexEntry.trivia}</small>
              </div>
            )}
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
