import { useEffect, useRef, useState } from "react";
import type { usePokemonGame } from "./usePokemonGame";
import type { useSfx } from "./useSfx";
import { pokemonList } from "../data/pokemon";
import { useSpeechInput } from "./useSpeechInput";
import { useTts } from "./useTts";
import { createPokedexSpeech } from "../utils/pokedexText";
import { parseVoiceCommand } from "../utils/voiceCommands";
import { correctVoiceAnswer } from "../utils/voiceAnswerCorrection";

type PokemonGame = ReturnType<typeof usePokemonGame>;
type SfxController = ReturnType<typeof useSfx>;

function isRoundRevealed(phase: string) {
  return phase === "correct" || phase === "timeout" || phase === "skipped";
}

export function useVoiceGameController(game: PokemonGame, sfx: SfxController) {
  const [speechPaused, setSpeechPaused] = useState(false);
  const [lastHeard, setLastHeard] = useState("");
  const [narrationTitle, setNarrationTitle] = useState("");
  const spokenDexId = useRef<number | null>(null);
  const spokenFailureKey = useRef("");
  const spokenCorrectKey = useRef("");
  const tts = useTts(() => {
    setSpeechPaused(false);
    setNarrationTitle("");
  });

  function cancelNarrationForNavigation() {
    tts.stop({ notify: false });
    speech.stop();
    setNarrationTitle("");
    setSpeechPaused(false);
  }

  function showDexFromGesture() {
    if (!isRoundRevealed(game.phase)) return;

    tts.stop({ notify: false });
    speech.stop();
    setNarrationTitle("");
    setSpeechPaused(true);
    sfx.play("pokedex");
    game.showDex();
  }

  function resetToReadyFromGesture() {
    cancelNarrationForNavigation();
    setSpeechPaused(false);
    game.resetToReady();
  }

  function handleVoiceResult(texts: string | string[]) {
    const heardTexts = Array.isArray(texts) ? texts : [texts];
    const primaryText = heardTexts[0] || "";
    setLastHeard(primaryText);

    const command = heardTexts.map((text) => parseVoiceCommand(text)).find(Boolean) || null;

    if (command === "mute") {
      sfx.setMuted(true);
      return;
    }

    if (command === "unmute") {
      sfx.setMuted(false);
      return;
    }

    if (command === "restart") {
      resetToReadyFromGesture();
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

      const correction = correctVoiceAnswer(heardTexts, game.current, pokemonList, game.difficulty);
      if (correction.shouldRetry) {
        setLastHeard(correction.heardText ? `听成了：${correction.heardText}，请再说一次` : "没听清，请再说一次");
        return;
      }

      if (correction.confidence === "high" && correction.heardText && correction.heardText !== correction.correctedAnswer) {
        setLastHeard(`听成了：${correction.heardText}，按 ${correction.correctedAnswer} 判断`);
      }

      const result = game.tryAnswer(correction.correctedAnswer);
      if (result === "wrong" || result === "close") {
        sfx.play("wrong");
      }
      return;
    }

    if (isRoundRevealed(game.phase)) {
      if (command === "next" || command === "skip") {
        cancelNarrationForNavigation();
        game.next();
        return;
      }

      if (command === "intro") {
        showDexFromGesture();
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
      cancelNarrationForNavigation();
      game.next();
    }
  }

  const speech = useSpeechInput(handleVoiceResult);

  function startListeningFromGesture() {
    if (!speech.supported) return;
    setSpeechPaused(false);
    speech.start();
  }

  function startGameFromGesture() {
    tts.stop({ notify: false });
    startListeningFromGesture();
    game.start();
  }

  function advanceFromGesture() {
    cancelNarrationForNavigation();

    if (game.phase === "finished") {
      game.resetToReady();
      return;
    }

    if (game.phase === "ready") {
      startGameFromGesture();
      return;
    }

    game.next();
  }

  function submitDebugAnswer(answer: string) {
    handleVoiceResult(answer);
  }

  function submitTextInput(text: string) {
    handleVoiceResult(text);
  }

  useEffect(() => {
    if (game.phase !== "correct") {
      spokenCorrectKey.current = "";
      return;
    }

    const correctKey = `${game.current.id}-${game.total}`;
    if (spokenCorrectKey.current === correctKey) return;

    spokenCorrectKey.current = correctKey;
    setSpeechPaused(true);
    speech.stop();
    setNarrationTitle("正在播报答案...");
    tts.speak(`答对了，就是，${game.current.zh}。你可以说，下一题，或者，介绍一下。`);
  }, [game.current, game.phase, game.total, speech, tts]);

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
    setNarrationTitle("正在播报答案...");
    tts.speak(`正确答案是，${game.current.zh}。你可以说，下一题，或者，介绍一下。`);
  }, [game.current, game.phase, game.total, speech, tts]);

  useEffect(() => {
    if (game.phase === "playing") {
      tts.clearError();
    }

    const shouldListen =
      !speechPaused &&
      !tts.speaking &&
      (game.phase === "entering" ||
        game.phase === "playing" ||
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
  }, [game.phase, speech, speechPaused, tts]);

  useEffect(() => {
    if (!game.dexVisible) {
      spokenDexId.current = null;
      return;
    }

    if (spokenDexId.current === game.current.id) return;

    spokenDexId.current = game.current.id;
    setSpeechPaused(true);
    speech.stop();
    setNarrationTitle("正在朗读百科...");
    tts.speak(createPokedexSpeech(game.current.zh, game.pokedexEntry));
  }, [game.current, game.dexVisible, game.pokedexEntry, speech, tts]);

  return {
    advanceFromGesture,
    lastHeard,
    resetToReadyFromGesture,
    speech,
    showDexFromGesture,
    startGameFromGesture,
    submitDebugAnswer,
    submitTextInput,
    tts,
    ttsMessage: tts.error && !speech.listening ? tts.error : "",
    voicePanelTitle: tts.speaking ? narrationTitle || "正在播报..." : undefined,
  };
}
