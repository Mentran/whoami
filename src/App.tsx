import { type FormEvent, useEffect, useRef, useState } from "react";
import { ConsoleFrame } from "./components/ConsoleFrame";
import { GameScreen } from "./components/GameScreen";
import { ScoreDisplay } from "./components/ScoreDisplay";
import { VoicePanel } from "./components/VoicePanel";
import { pokemonList } from "./data/pokemon";
import { useSfx } from "./hooks/useSfx";
import { usePokemonGame } from "./hooks/usePokemonGame";
import { useVoiceGameController } from "./hooks/useVoiceGameController";
import { createResultText } from "./utils/result";

export default function App() {
  const game = usePokemonGame(pokemonList);
  const sfx = useSfx();
  const voice = useVoiceGameController(game, sfx);
  const previousPhase = useRef(game.phase);
  const [debugAnswer, setDebugAnswer] = useState("");
  const [shareStatus, setShareStatus] = useState("");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";

      if (event.key === "Enter" && !isTyping) {
        voice.advanceFromGesture();
      }

      if (event.key === "Escape") {
        game.skip();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [game, voice]);

  useEffect(() => {
    if (previousPhase.current === game.phase) return;

    if (game.phase === "entering" && previousPhase.current === "ready") sfx.play("start");
    if (game.phase === "transitioning") sfx.play("next");
    if (game.phase === "correct") sfx.play("correct");
    if (game.phase === "skipped") sfx.play("skip");
    if (game.phase === "timeout") sfx.play("timeout");

    previousPhase.current = game.phase;
  }, [game.phase, sfx]);

  useEffect(() => {
    if (game.phase !== "finished" && shareStatus) {
      setShareStatus("");
    }
  }, [game.phase, shareStatus]);

  function handleDebugSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!debugAnswer.trim()) return;
    voice.submitDebugAnswer(debugAnswer);
    setDebugAnswer("");
  }

  async function shareResult() {
    const text = createResultText(game.hit, game.roundLimit, game.difficulty);
    const shareData = {
      text,
      title: "我是谁？",
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareStatus("已打开系统分享");
        return;
      }

      await navigator.clipboard.writeText(`${text} ${window.location.href}`);
      setShareStatus("结果已复制");
    } catch {
      setShareStatus("分享失败，请稍后再试");
    }
  }

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
              onClick={voice.advanceFromGesture}
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
          onStart={voice.startGameFromGesture}
          onShareResult={shareResult}
          roundLimit={game.roundLimit}
          roundSeconds={game.roundSeconds}
          shareStatus={shareStatus}
          setDifficulty={game.setDifficulty}
          timeLeft={game.timeLeft}
          total={game.total}
          pokedexEntry={game.pokedexEntry}
          showDex={game.dexVisible}
        />
        <VoicePanel
          error={voice.speech.error}
          interimText={voice.speech.interimText}
          lastHeard={voice.tts.error || voice.lastHeard}
          listening={voice.speech.listening || voice.tts.speaking}
          phaseLabel={game.status}
          supported={voice.speech.supported}
          title={voice.voicePanelTitle}
        />
        {import.meta.env.DEV && (
          <form className="debug-answer" onSubmit={handleDebugSubmit}>
            <input
              aria-label="开发调试答案"
              onChange={(event) => setDebugAnswer(event.target.value)}
              placeholder="开发调试：输入答案或指令"
              type="text"
              value={debugAnswer}
            />
            <button type="submit">发送</button>
          </form>
        )}
      </ConsoleFrame>
    </main>
  );
}
