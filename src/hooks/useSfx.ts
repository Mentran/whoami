import { useCallback, useState } from "react";

type SoundName = "start" | "next" | "correct" | "wrong" | "skip" | "timeout" | "pokedex";

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

function connectOutput(context: AudioContext, gainValue: number) {
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.connect(context.destination);
  gain.gain.exponentialRampToValueAtTime(gainValue, context.currentTime + 0.012);
  return gain;
}

function playTone(
  context: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  gainValue = 0.045,
  type: OscillatorType = "square",
) {
  const oscillator = context.createOscillator();
  const gain = connectOutput(context, gainValue);

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function playSweep(context: AudioContext, from: number, to: number, start: number, duration: number, gainValue = 0.035) {
  const oscillator = context.createOscillator();
  const gain = connectOutput(context, gainValue);

  oscillator.type = "sawtooth";
  oscillator.frequency.setValueAtTime(from, start);
  oscillator.frequency.exponentialRampToValueAtTime(to, start + duration);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function playNoise(context: AudioContext, start: number, duration: number, gainValue = 0.025) {
  const bufferSize = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let index = 0; index < bufferSize; index += 1) {
    data[index] = Math.random() * 2 - 1;
  }

  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = connectOutput(context, gainValue);

  filter.type = "highpass";
  filter.frequency.setValueAtTime(900, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  source.start(start);
  source.stop(start + duration);
}

function playPattern(name: SoundName) {
  const context = getAudioContext();
  const now = context.currentTime;

  if (name === "correct") {
    playSweep(context, 392, 988, now, 0.22, 0.025);
    playTone(context, 523.25, now, 0.08);
    playTone(context, 659.25, now + 0.08, 0.08);
    playTone(context, 783.99, now + 0.16, 0.1);
    playTone(context, 1046.5, now + 0.26, 0.16, 0.04, "triangle");
    return;
  }

  if (name === "wrong") {
    playTone(context, 220, now, 0.06, 0.03);
    playTone(context, 164.81, now + 0.07, 0.09, 0.028);
    return;
  }

  if (name === "timeout") {
    playNoise(context, now, 0.12, 0.025);
    playTone(context, 196, now, 0.11, 0.04);
    playTone(context, 146.83, now + 0.12, 0.18, 0.035);
    return;
  }

  if (name === "skip") {
    playSweep(context, 320, 180, now, 0.12, 0.03);
    return;
  }

  if (name === "next") {
    playNoise(context, now, 0.06, 0.018);
    playTone(context, 329.63, now, 0.045, 0.03);
    playTone(context, 493.88, now + 0.045, 0.055, 0.03);
    return;
  }

  if (name === "pokedex") {
    playTone(context, 880, now, 0.045, 0.028, "triangle");
    playTone(context, 1174.66, now + 0.055, 0.045, 0.028, "triangle");
    playTone(context, 1567.98, now + 0.11, 0.08, 0.026, "triangle");
    return;
  }

  playNoise(context, now, 0.07, 0.018);
  playTone(context, 261.63, now, 0.06, 0.032);
  playTone(context, 392, now + 0.07, 0.06, 0.034);
  playTone(context, 523.25, now + 0.14, 0.1, 0.036);
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

  const setMutedValue = useCallback((next: boolean) => {
    setMuted(next);
    localStorage.setItem(MUTED_KEY, String(next));
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

  return { muted, play, setMuted: setMutedValue, toggleMuted };
}
