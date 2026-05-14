import { useEffect, useRef } from "react";
import { AnswerBox } from "./components/AnswerBox";
import { ConsoleFrame } from "./components/ConsoleFrame";
import { GameScreen } from "./components/GameScreen";
import { ScoreDisplay } from "./components/ScoreDisplay";
import { pokemonList } from "./data/pokemon";
import { useSfx } from "./hooks/useSfx";
import { usePokemonGame } from "./hooks/usePokemonGame";

export default function App() {
  const game = usePokemonGame(pokemonList);
  const sfx = useSfx();
  const previousPhase = useRef(game.phase);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";

      if (event.key === "Enter" && !isTyping) {
        game.next();
      }

      if (event.key === "Escape") {
        game.skip();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [game]);

  useEffect(() => {
    if (previousPhase.current === game.phase) return;

    if (game.phase === "entering" && previousPhase.current === "ready") sfx.play("start");
    if (game.phase === "transitioning") sfx.play("next");
    if (game.phase === "correct") sfx.play("correct");
    if (game.phase === "wrong") sfx.play("wrong");
    if (game.phase === "skipped") sfx.play("skip");

    previousPhase.current = game.phase;
  }, [game.phase, sfx]);

  return (
    <main className="app-shell">
      <ConsoleFrame
        controls={
          <>
            <button
              className="round-button"
              disabled={!game.canSkip}
              onClick={game.skip}
              title="跳过"
              type="button"
            >
              B
            </button>
            <button
              className="round-button primary"
              disabled={!game.canAdvance}
              onClick={game.next}
              title="开始 / 下一步"
              type="button"
            >
              A
            </button>
          </>
        }
        score={<ScoreDisplay hit={game.hit} total={game.total} best={game.best} />}
        soundControl={
          <button
            aria-label={sfx.muted ? "开启音效" : "关闭音效"}
            className="sound-button"
            onClick={sfx.toggleMuted}
            type="button"
          >
            {sfx.muted ? "♪×" : "♪"}
          </button>
        }
        status={game.status}
      >
        <GameScreen
          difficulty={game.difficulty}
          pokemon={game.current}
          revealed={game.revealed}
          feedback={game.feedback}
          hit={game.hit}
          phase={game.phase}
          onStart={game.start}
          roundLimit={game.roundLimit}
          setDifficulty={game.setDifficulty}
          total={game.total}
        />
        <AnswerBox
          disabled={!game.canAnswer}
          value={game.answer}
          onChange={game.setAnswer}
          onSubmit={game.submit}
          onNext={game.next}
          revealed={game.revealed}
        />
      </ConsoleFrame>
    </main>
  );
}
