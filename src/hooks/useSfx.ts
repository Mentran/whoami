import { useCallback, useState } from "react";

type SoundName = "start" | "next" | "correct" | "wrong" | "skip" | "timeout";

const MUTED_KEY = "who-am-i-muted";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

function loadMuted() {
  return localStorage.getItem(MUTED_KEY) === "true";
}

function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) throw new Error("Web Audio is not supported.");
  return new AudioContextClass();
}

function playTone(context: AudioContext, frequency: number, start: number, duration: number, gainValue = 0.05) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function playPattern(name: SoundName) {
  const context = getAudioContext();
  const now = context.currentTime;

  if (name === "correct") {
    playTone(context, 523.25, now, 0.08);
    playTone(context, 659.25, now + 0.08, 0.08);
    playTone(context, 783.99, now + 0.16, 0.12);
    return;
  }

  if (name === "wrong" || name === "timeout") {
    playTone(context, 180, now, 0.12, 0.045);
    playTone(context, 130, now + 0.12, 0.16, 0.04);
    return;
  }

  if (name === "skip") {
    playTone(context, 220, now, 0.08, 0.04);
    return;
  }

  if (name === "next") {
    playTone(context, 320, now, 0.045, 0.035);
    playTone(context, 420, now + 0.045, 0.045, 0.035);
    return;
  }

  playTone(context, 392, now, 0.06, 0.04);
  playTone(context, 523.25, now + 0.07, 0.08, 0.04);
}

export function useSfx() {
  const [muted, setMuted] = useState(loadMuted);

  const toggleMuted = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      localStorage.setItem(MUTED_KEY, String(next));
      return next;
    });
  }, []);

  const play = useCallback(
    (name: SoundName) => {
      if (muted) return;

      try {
        playPattern(name);
      } catch {
        setMuted(true);
        localStorage.setItem(MUTED_KEY, "true");
      }
    },
    [muted],
  );

  return { muted, play, toggleMuted };
}
