import { useCallback, useEffect, useMemo, useState } from "react";

function getPreferredVoice() {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => voice.lang.toLowerCase() === "zh-cn") ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith("zh")) ||
    null
  );
}

export function useTts() {
  const [error, setError] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel();
    };
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;

    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback(
    (text: string) => {
      if (!supported) {
        setError("当前浏览器不支持语音合成");
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = getPreferredVoice();

      utterance.lang = "zh-CN";
      utterance.rate = 0.96;
      utterance.pitch = 1.04;
      if (voice) utterance.voice = voice;

      utterance.onstart = () => {
        setError("");
        setSpeaking(true);
      };
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => {
        setError("百科朗读失败");
        setSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [supported],
  );

  return useMemo(
    () => ({
      error,
      speak,
      speaking,
      stop,
      supported,
    }),
    [error, speak, speaking, stop, supported],
  );
}

