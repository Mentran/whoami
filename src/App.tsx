import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ConsoleFrame } from "./components/ConsoleFrame";
import { GameScreen } from "./components/GameScreen";
import { MusicControls } from "./components/MusicControls";
import { ScoreDisplay } from "./components/ScoreDisplay";
import { VoicePanel } from "./components/VoicePanel";
import { pokemonList } from "./data/pokemon";
import { useBgm } from "./hooks/useBgm";
import { useSfx } from "./hooks/useSfx";
import { usePokemonGame } from "./hooks/usePokemonGame";
import { useVoiceGameController } from "./hooks/useVoiceGameController";
import { createResultText } from "./utils/result";
import { createShareResultImage } from "./utils/shareResultImage";

export default function App() {
  const game = usePokemonGame(pokemonList);
  const sfx = useSfx();
  const bgm = useBgm();
  const { activateFromGesture: activateBgmFromGesture, setActive: setBgmActive, setDucking: setBgmDucking, setTrack: setBgmTrack } = bgm;
  const voice = useVoiceGameController(game, sfx);
  const previousPhase = useRef(game.phase);
  const [textAnswer, setTextAnswer] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const isRoundOver = game.phase === "correct" || game.phase === "skipped" || game.phase === "timeout";
  const canUseTextInput = game.phase === "playing" || isRoundOver;

  const enableBgmFromGesture = useCallback(() => {
    if (localStorage.getItem("who-am-i-bgm-enabled") !== "false") {
      activateBgmFromGesture();
    }
  }, [activateBgmFromGesture]);

  const startGameFromGesture = useCallback(() => {
    enableBgmFromGesture();
    voice.startGameFromGesture();
  }, [enableBgmFromGesture, voice]);

  const advanceFromGesture = useCallback(() => {
    if (game.phase === "ready") enableBgmFromGesture();
    voice.advanceFromGesture();
  }, [enableBgmFromGesture, game.phase, voice]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";

      if (event.key === "Enter" && !isTyping) {
        advanceFromGesture();
      }

      if (event.key === "Escape") {
        game.skip();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [advanceFromGesture, game]);

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

  useEffect(() => {
    setBgmDucking(voice.speech.listening || voice.tts.speaking);
  }, [setBgmDucking, voice.speech.listening, voice.tts.speaking]);

  useEffect(() => {
    setBgmActive(game.phase === "ready" || game.phase === "finished");
  }, [game.phase, setBgmActive]);

  useEffect(() => {
    if (game.phase === "finished") {
      setBgmTrack(4);
      return;
    }

    if (game.phase === "ready") setBgmTrack(0);
  }, [game.phase, setBgmTrack]);

  function handleTextSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!textAnswer.trim() || !canUseTextInput) return;
    voice.submitTextInput(textAnswer);
    setTextAnswer("");
  }

  async function shareResult() {
    const text = createResultText(game.hit, game.roundLimit, game.difficulty);
    setShareStatus("正在生成分享图...");

    try {
      const image = await createShareResultImage({
        best: game.best,
        difficulty: game.difficulty,
        hit: game.hit,
        roundLimit: game.roundLimit,
      });
      const shareData = {
        files: [image.file],
        text,
        title: "我是谁？",
      };

      if (navigator.canShare?.(shareData) && navigator.share) {
        await navigator.share(shareData);
        URL.revokeObjectURL(image.url);
        setShareStatus("已打开图片分享");
        return;
      }

      const link = document.createElement("a");
      link.download = "who-am-i-result.png";
      link.href = image.url;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(image.url), 1000);

      try {
        await navigator.clipboard.writeText(`${text} ${window.location.href}`);
        setShareStatus("已生成图片，并复制文字结果");
      } catch {
        setShareStatus("已生成图片");
      }
    } catch {
      setShareStatus("分享失败，请稍后再试");
    }
  }

  return (
    <main className="app-shell" onPointerDown={enableBgmFromGesture}>
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
              onClick={advanceFromGesture}
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
        utilityControl={
          <>
            <MusicControls
              enabled={bgm.enabled}
              onNext={bgm.nextTrack}
              onPrevious={bgm.previousTrack}
              onToggle={bgm.toggle}
              onVolumeChange={bgm.setVolume}
              track={bgm.track}
              volume={bgm.volume}
            />
            <button
              className="reset-button"
              disabled={game.phase === "ready"}
              onClick={voice.resetToReadyFromGesture}
              title="重新开始"
              type="button"
            >
              重新开始
            </button>
          </>
        }
        status={game.status}
      >
        <GameScreen
          best={game.best}
          difficulty={game.difficulty}
          pokemon={game.current}
          revealed={game.revealed}
          feedback={game.feedback}
          hit={game.hit}
          longestStreak={game.longestStreak}
          phase={game.phase}
          onStart={startGameFromGesture}
          onRestart={voice.resetToReadyFromGesture}
          onShareResult={shareResult}
          roundLimit={game.roundLimit}
          roundSeconds={game.roundSeconds}
          shareStatus={shareStatus}
          setDifficulty={game.setDifficulty}
          timeLeft={game.timeLeft}
          total={game.total}
          streak={game.streak}
          pokedexEntry={game.pokedexEntry}
          showDex={game.dexVisible}
        />
        <VoicePanel
          activated={voice.speech.activated}
          error={voice.speech.error}
          interimText={voice.speech.interimText}
          lastHeard={voice.ttsMessage || voice.lastHeard}
          listening={voice.speech.listening || voice.tts.speaking}
          phaseLabel={game.status}
          permissionState={voice.speech.permissionState}
          supported={voice.speech.supported}
          title={voice.voicePanelTitle}
        />
        <form className="answer-panel" onSubmit={handleTextSubmit}>
          <input
            aria-label="文字答题"
            disabled={!canUseTextInput}
            onChange={(event) => setTextAnswer(event.target.value)}
            placeholder={isRoundOver ? "可输入：下一题 / 介绍一下" : "麦克风不可用时，在这里输入答案"}
            type="text"
            value={textAnswer}
          />
          <button disabled={!canUseTextInput} type="submit">
            发送
          </button>
          {isRoundOver && (
            <button className="answer-panel-secondary" onClick={voice.advanceFromGesture} type="button">
              下一题
            </button>
          )}
          {isRoundOver && !game.dexVisible && (
            <button className="answer-panel-secondary" onClick={voice.showDexFromGesture} type="button">
              介绍一下
            </button>
          )}
        </form>
        {import.meta.env.DEV && (
          <p className="debug-note">开发模式：文字框也可输入语音指令进行调试。</p>
        )}
      </ConsoleFrame>
    </main>
  );
}
