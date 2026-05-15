import { useEffect, useRef, useState } from "react";
import { ConsoleFrame } from "./components/ConsoleFrame";
import { GameScreen } from "./components/GameScreen";
import { ScoreDisplay } from "./components/ScoreDisplay";
import { VoicePanel } from "./components/VoicePanel";
import { pokemonList } from "./data/pokemon";
import { useSfx } from "./hooks/useSfx";
import { usePokemonGame } from "./hooks/usePokemonGame";
import { useSpeechInput } from "./hooks/useSpeechInput";
import { useTts } from "./hooks/useTts";
import { createResultText } from "./utils/result";
import { extractVoiceAnswer, parseVoiceCommand } from "./utils/voiceCommands";

function isRoundRevealed(phase: string) {
  return phase === "correct" || phase === "timeout" || phase === "skipped";
}

export default function App() {
  const game = usePokemonGame(pokemonList);
  const sfx = useSfx();
  const [speechPaused, setSpeechPaused] = useState(false);
  const tts = useTts(() => setSpeechPaused(false));
  const previousPhase = useRef(game.phase);
  const spokenDexId = useRef<number | null>(null);
  const spokenFailureKey = useRef("");
  const [lastHeard, setLastHeard] = useState("");
  const [shareStatus, setShareStatus] = useState("");

  function handleVoiceResult(text: string) {
    setLastHeard(text);

    const command = parseVoiceCommand(text);

    if (command === "mute") {
      sfx.setMuted(true);
      return;
    }

    if (command === "unmute") {
      sfx.setMuted(false);
      return;
    }

    if (command === "restart") {
      tts.stop();
      game.start();
      return;
    }

    if (game.phase === "playing") {
      if (command === "next" || command === "skip") {
        game.skip();
        return;
      }

      if (command === "intro") {
        return;
      }

      const result = game.tryAnswer(extractVoiceAnswer(text));
      if (result === "wrong" || result === "close") {
        sfx.play("wrong");
      }
      return;
    }

    if (isRoundRevealed(game.phase)) {
      if (command === "next" || command === "skip") {
        tts.stop();
        game.next();
        return;
      }

      if (command === "intro") {
        sfx.play("pokedex");
        game.showDex();
        return;
      }

      return;
    }

    if (game.phase === "ready" || game.phase === "finished") {
      if (command === "next") {
        game.start();
      }
      return;
    }

    if (command === "next" || command === "skip") {
      tts.stop();
      game.next();
      return;
    }
  }

  const speech = useSpeechInput(handleVoiceResult);

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
    if (game.phase === "skipped") sfx.play("skip");
    if (game.phase === "timeout") sfx.play("timeout");

    previousPhase.current = game.phase;
  }, [game.phase, sfx]);

  useEffect(() => {
    if (game.phase !== "timeout" && game.phase !== "skipped") {
      spokenFailureKey.current = "";
      return;
    }

    const failureKey = `${game.phase}-${game.current.id}-${game.total}`;
    if (spokenFailureKey.current === failureKey) return;

    spokenFailureKey.current = failureKey;
    setSpeechPaused(true);
    speech.stop();
    tts.speak(`正确答案是，${game.current.zh}。你可以说，下一题，或者，介绍一下。`);
  }, [game.current, game.phase, game.total, speech, tts]);

  useEffect(() => {
    const shouldListen =
      !speechPaused &&
      !tts.speaking &&
      (game.phase === "playing" ||
        game.phase === "correct" ||
        game.phase === "timeout" ||
        game.phase === "skipped");

    if (shouldListen && speech.canAutoRestart && !speech.listening) {
      speech.start();
      return;
    }

    if (!shouldListen && speech.listening) {
      speech.stop();
    }
  }, [game.phase, speech, speechPaused, tts.speaking]);

  useEffect(() => {
    if (!game.dexVisible) {
      spokenDexId.current = null;
      return;
    }

    if (spokenDexId.current === game.current.id) return;

    spokenDexId.current = game.current.id;
    setSpeechPaused(true);
    speech.stop();
    tts.speak(
      `${game.current.zh}，${game.pokedexEntry.category}。属性：${game.pokedexEntry.types.join("、")}。${game.pokedexEntry.intro}${game.pokedexEntry.trivia}`,
    );
  }, [game.current, game.dexVisible, game.pokedexEntry, speech, tts]);

  useEffect(() => {
    if (game.phase !== "finished" && shareStatus) {
      setShareStatus("");
    }
  }, [game.phase, shareStatus]);

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
          error={speech.error}
          interimText={speech.interimText}
          lastHeard={tts.error || lastHeard}
          listening={speech.listening || tts.speaking}
          phaseLabel={game.status}
          supported={speech.supported}
          title={tts.speaking ? "正在朗读百科..." : undefined}
        />
      </ConsoleFrame>
    </main>
  );
}
