import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type StopOptions = {
  notify?: boolean;
};

function getPreferredVoice() {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => voice.lang.toLowerCase() === "zh-cn") ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith("zh")) ||
    null
  );
}

export function useTts(onDone?: () => void) {
  const [error, setError] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const doneTimer = useRef<number | null>(null);
  const finished = useRef(true);
  const speechRunId = useRef(0);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    return () => {
      if (doneTimer.current) window.clearTimeout(doneTimer.current);
      if (supported) window.speechSynthesis.cancel();
    };
  }, [supported]);

  const clearDoneTimer = useCallback(() => {
    if (!doneTimer.current) return;
    window.clearTimeout(doneTimer.current);
    doneTimer.current = null;
  }, []);

  const finish = useCallback((runId: number, notify = true) => {
    if (runId !== speechRunId.current) return;
    if (finished.current) return;
    finished.current = true;
    clearDoneTimer();
    setSpeaking(false);
    if (notify) onDone?.();
  }, [clearDoneTimer, onDone]);

  const stop = useCallback((options: StopOptions = {}) => {
    const notify = options.notify ?? true;
    const wasActive = !finished.current;

    speechRunId.current += 1;
    finished.current = true;
    clearDoneTimer();
    setError("");
    setSpeaking(false);

    if (!supported) {
      if (notify && wasActive) onDone?.();
      return;
    }

    window.speechSynthesis.cancel();
    if (notify && wasActive) onDone?.();
  }, [clearDoneTimer, onDone, supported]);

  const clearError = useCallback(() => {
    setError("");
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!supported) {
        setError("当前浏览器不支持语音合成");
        onDone?.();
        return;
      }

      clearDoneTimer();
      const runId = speechRunId.current + 1;
      speechRunId.current = runId;
      window.speechSynthesis.cancel();
      finished.current = false;
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = getPreferredVoice();

      utterance.lang = "zh-CN";
      utterance.rate = 0.96;
      utterance.pitch = 1.04;
      if (voice) utterance.voice = voice;
      setError("");
      setSpeaking(true);

      utterance.onstart = () => {
        setError("");
      };
      utterance.onend = () => {
        finish(runId);
      };
      utterance.onerror = () => {
        if (runId !== speechRunId.current || finished.current) return;
        setError("百科朗读失败");
        finish(runId);
      };

      window.speechSynthesis.speak(utterance);
      doneTimer.current = window.setTimeout(
        () => finish(runId),
        Math.min(16000, Math.max(3000, text.length * 220)),
      );
    },
    [clearDoneTimer, finish, onDone, supported],
  );

  return useMemo(
    () => ({
      error,
      clearError,
      speak,
      speaking,
      stop,
      supported,
    }),
    [clearError, error, speak, speaking, stop, supported],
  );
}
