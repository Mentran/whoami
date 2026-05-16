import { useEffect, useRef, useState } from "react";
import type { usePokemonGame } from "./usePokemonGame";
import type { useSfx } from "./useSfx";
import { useSpeechInput } from "./useSpeechInput";
import { useTts } from "./useTts";
import { extractVoiceAnswer, parseVoiceCommand } from "../utils/voiceCommands";

type PokemonGame = ReturnType<typeof usePokemonGame>;
type SfxController = ReturnType<typeof useSfx>;

function isRoundRevealed(phase: string) {
  return phase === "correct" || phase === "timeout" || phase === "skipped";
}

export function useVoiceGameController(game: PokemonGame, sfx: SfxController) {
  const [speechPaused, setSpeechPaused] = useState(false);
  const [lastHeard, setLastHeard] = useState("");
  const spokenDexId = useRef<number | null>(null);
  const spokenFailureKey = useRef("");
  const tts = useTts(() => setSpeechPaused(false));

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
      setSpeechPaused(false);
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
    }
  }

  const speech = useSpeechInput(handleVoiceResult);

  function startListeningFromGesture() {
    if (!speech.supported) return;
    setSpeechPaused(false);
    speech.start();
  }

  function startGameFromGesture() {
    tts.stop();
    startListeningFromGesture();
    game.start();
  }

  function advanceFromGesture() {
    tts.stop();

    if (game.phase === "ready" || game.phase === "finished") {
      startGameFromGesture();
      return;
    }

    game.next();
  }

  function submitDebugAnswer(answer: string) {
    handleVoiceResult(answer);
  }

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

  return {
    advanceFromGesture,
    lastHeard,
    speech,
    startGameFromGesture,
    submitDebugAnswer,
    tts,
    voicePanelTitle: tts.speaking ? "正在朗读百科..." : undefined,
  };
}
