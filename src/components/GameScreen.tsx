import { artworkUrl, type Pokemon } from "../data/pokemon";
import type { PokedexEntry } from "../data/pokedex";
import type { Difficulty, Phase } from "../hooks/usePokemonGame";
import { getPokedexFacts } from "../utils/pokedexText";
import { difficultyLabels, getRatingText } from "../utils/result";

type GameScreenProps = {
  difficulty: Difficulty;
  best: number;
  pokemon: Pokemon;
  pokedexEntry: PokedexEntry;
  revealed: boolean;
  feedback: string;
  hit: number;
  longestStreak: number;
  phase: Phase;
  onStart: () => void;
  onRestart: () => void;
  onShareResult: () => void;
  roundLimit: number;
  roundSeconds: number;
  shareStatus: string;
  setDifficulty: (difficulty: Difficulty) => void;
  showDex: boolean;
  timeLeft: number;
  total: number;
  streak: number;
};

export function GameScreen({
  best,
  difficulty,
  pokemon,
  pokedexEntry,
  revealed,
  feedback,
  hit,
  longestStreak,
  phase,
  onStart,
  onRestart,
  onShareResult,
  roundLimit,
  roundSeconds,
  shareStatus,
  setDifficulty,
  showDex,
  timeLeft,
  total,
  streak,
}: GameScreenProps) {
  const isReady = phase === "ready";
  const isFinished = phase === "finished";
  const timeRatio = Math.max(0, Math.min(1, timeLeft / roundSeconds));
  const isTimeUrgent = phase === "playing" && timeLeft <= 3;
  const shouldRevealArtwork = revealed && phase !== "entering" && phase !== "transitioning";
  const pokedexFacts = getPokedexFacts(pokedexEntry);
  const currentRoundNumber =
    phase === "correct" || phase === "skipped" || phase === "timeout" ? total : Math.min(total + 1, roundLimit);
  const accuracy = Math.round((hit / roundLimit) * 100);
  const resultFact = pokedexFacts[0];
  const resultNote = resultFact
    ? `你知道吗？${pokemon.zh}：${resultFact}`
    : "再开一局，看看下一道剪影会是谁。";

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
          <div className="result-pixels" aria-hidden="true">
            {Array.from({ length: 8 }, (_, index) => (
              <span key={index} />
            ))}
          </div>
          <div className="result-header">
            <span className="result-title">挑战完成</span>
          </div>
          <div className="result-score-card">
            <strong>
              {hit}/{roundLimit}
            </strong>
          </div>
          <div className="result-summary">
            <span className="result-rating">{getRatingText(hit, roundLimit)}</span>
            {longestStreak >= 2 && <span className="result-streak">最长连击 x{longestStreak}</span>}
            <p className="result-note">{resultNote}</p>
          </div>
          <div className="result-meta" aria-label="本局统计">
            <span>{difficultyLabels[difficulty]}难度</span>
            <span>命中率 {accuracy}%</span>
            <span>最高 {String(best).padStart(2, "0")}</span>
          </div>
          <div className="result-actions">
            <button className="start-action" onClick={onStart} type="button">
              再来一局
            </button>
            <button className="share-action" onClick={onShareResult} type="button">
              分享结果
            </button>
          </div>
          <button className="result-secondary-action" onClick={onRestart} type="button">
            换个难度
          </button>
          {shareStatus && <span className="share-status">{shareStatus}</span>}
        </div>
      )}

      {!isReady && !isFinished && (
        <>
          <div className="silhouette-card">
            <img
              alt={shouldRevealArtwork ? pokemon.zh : "神秘宝可梦黑影"}
              className={shouldRevealArtwork ? "pokemon-art revealed" : "pokemon-art hidden"}
              draggable="false"
              key={pokemon.id}
              src={artworkUrl(pokemon.id)}
            />
          </div>

          <div className="prompt-panel">
            <p className="round-count">
              第 {currentRoundNumber} / {roundLimit} 题
            </p>
            <p className="question">{revealed ? "就是它！" : "我是谁？"}</p>
            <div className={isTimeUrgent ? "power-meter urgent" : "power-meter"} aria-label={`剩余 ${timeLeft} 秒`}>
              <span style={{ width: `${timeRatio * 100}%` }} />
            </div>
            <p className={isTimeUrgent ? "timer-text urgent" : "timer-text"}>{timeLeft.toFixed(1)}s</p>
            {streak >= 2 && (
              <p className="combo-badge" aria-label={`当前 ${streak} 连击`}>
                COMBO <b>x{streak}</b>
              </p>
            )}
            <p className="feedback">{feedback}</p>
            {showDex && (
              <div className="pokedex-panel">
                <strong>
                  #{String(pokemon.id).padStart(3, "0")} {pokemon.zh}
                </strong>
                <span>{pokedexEntry.types.join(" / ")}</span>
                {pokedexFacts[0] && <p>{pokedexFacts[0]}</p>}
                {pokedexFacts.slice(1).map((fact) => (
                  <small key={fact}>{fact}</small>
                ))}
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
