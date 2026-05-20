import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const BGM_ENABLED_KEY = "who-am-i-bgm-enabled";
const BGM_VOLUME_KEY = "who-am-i-bgm-volume";
const BGM_TRACK_KEY = "who-am-i-bgm-track";

type BgmNote = {
  beat: number;
  duration: number;
  frequency: number;
  gain?: number;
};

export type BgmTrack = {
  bass: BgmNote[];
  lead: BgmNote[];
  name: string;
  tempo: number;
};

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export const bgmTracks: BgmTrack[] = [
  {
    name: "宝可梦中心",
    tempo: 108,
    lead: [
      { beat: 0, frequency: 523.25, duration: 0.45 },
      { beat: 0.5, frequency: 659.25, duration: 0.45 },
      { beat: 1, frequency: 783.99, duration: 0.45 },
      { beat: 1.5, frequency: 659.25, duration: 0.45 },
      { beat: 2, frequency: 587.33, duration: 0.45 },
      { beat: 2.5, frequency: 698.46, duration: 0.45 },
      { beat: 3, frequency: 880, duration: 0.7 },
      { beat: 4, frequency: 783.99, duration: 0.45 },
      { beat: 4.5, frequency: 698.46, duration: 0.45 },
      { beat: 5, frequency: 659.25, duration: 0.45 },
      { beat: 5.5, frequency: 587.33, duration: 0.45 },
      { beat: 6, frequency: 523.25, duration: 0.9 },
    ],
    bass: [
      { beat: 0, frequency: 130.81, duration: 1.8, gain: 0.6 },
      { beat: 2, frequency: 146.83, duration: 1.8, gain: 0.6 },
      { beat: 4, frequency: 164.81, duration: 1.8, gain: 0.6 },
      { beat: 6, frequency: 196, duration: 1.8, gain: 0.6 },
    ],
  },
  {
    name: "草丛冒险",
    tempo: 132,
    lead: [
      { beat: 0, frequency: 392, duration: 0.3 },
      { beat: 0.5, frequency: 493.88, duration: 0.3 },
      { beat: 1, frequency: 587.33, duration: 0.3 },
      { beat: 1.5, frequency: 659.25, duration: 0.3 },
      { beat: 2, frequency: 587.33, duration: 0.3 },
      { beat: 2.5, frequency: 493.88, duration: 0.3 },
      { beat: 3, frequency: 440, duration: 0.55 },
      { beat: 4, frequency: 523.25, duration: 0.3 },
      { beat: 4.5, frequency: 659.25, duration: 0.3 },
      { beat: 5, frequency: 783.99, duration: 0.3 },
      { beat: 5.5, frequency: 659.25, duration: 0.3 },
      { beat: 6, frequency: 587.33, duration: 0.75 },
    ],
    bass: [
      { beat: 0, frequency: 98, duration: 0.45, gain: 0.65 },
      { beat: 1, frequency: 98, duration: 0.45, gain: 0.65 },
      { beat: 2, frequency: 146.83, duration: 0.45, gain: 0.65 },
      { beat: 3, frequency: 146.83, duration: 0.45, gain: 0.65 },
      { beat: 4, frequency: 130.81, duration: 0.45, gain: 0.65 },
      { beat: 5, frequency: 130.81, duration: 0.45, gain: 0.65 },
      { beat: 6, frequency: 164.81, duration: 0.75, gain: 0.65 },
    ],
  },
  {
    name: "对战紧张",
    tempo: 154,
    lead: [
      { beat: 0, frequency: 659.25, duration: 0.2 },
      { beat: 0.5, frequency: 659.25, duration: 0.2 },
      { beat: 1, frequency: 698.46, duration: 0.2 },
      { beat: 1.5, frequency: 783.99, duration: 0.2 },
      { beat: 2, frequency: 880, duration: 0.2 },
      { beat: 2.5, frequency: 783.99, duration: 0.2 },
      { beat: 3, frequency: 698.46, duration: 0.2 },
      { beat: 3.5, frequency: 659.25, duration: 0.2 },
      { beat: 4, frequency: 587.33, duration: 0.2 },
      { beat: 4.5, frequency: 659.25, duration: 0.2 },
      { beat: 5, frequency: 698.46, duration: 0.2 },
      { beat: 5.5, frequency: 783.99, duration: 0.2 },
      { beat: 6, frequency: 987.77, duration: 0.45 },
    ],
    bass: [
      { beat: 0, frequency: 110, duration: 0.2, gain: 0.7 },
      { beat: 0.5, frequency: 110, duration: 0.2, gain: 0.7 },
      { beat: 1, frequency: 110, duration: 0.2, gain: 0.7 },
      { beat: 1.5, frequency: 110, duration: 0.2, gain: 0.7 },
      { beat: 2, frequency: 123.47, duration: 0.2, gain: 0.7 },
      { beat: 2.5, frequency: 123.47, duration: 0.2, gain: 0.7 },
      { beat: 3, frequency: 123.47, duration: 0.2, gain: 0.7 },
      { beat: 3.5, frequency: 123.47, duration: 0.2, gain: 0.7 },
      { beat: 4, frequency: 98, duration: 0.2, gain: 0.7 },
      { beat: 4.5, frequency: 98, duration: 0.2, gain: 0.7 },
      { beat: 5, frequency: 98, duration: 0.2, gain: 0.7 },
      { beat: 5.5, frequency: 98, duration: 0.2, gain: 0.7 },
    ],
  },
  {
    name: "图鉴研究所",
    tempo: 96,
    lead: [
      { beat: 0, frequency: 440, duration: 0.38 },
      { beat: 0.5, frequency: 523.25, duration: 0.38 },
      { beat: 1.5, frequency: 659.25, duration: 0.38 },
      { beat: 2.5, frequency: 587.33, duration: 0.38 },
      { beat: 3, frequency: 493.88, duration: 0.7 },
      { beat: 4, frequency: 392, duration: 0.38 },
      { beat: 4.5, frequency: 493.88, duration: 0.38 },
      { beat: 5.5, frequency: 587.33, duration: 0.38 },
      { beat: 6, frequency: 659.25, duration: 0.8 },
    ],
    bass: [
      { beat: 0, frequency: 110, duration: 1.8, gain: 0.5 },
      { beat: 2, frequency: 130.81, duration: 1.8, gain: 0.5 },
      { beat: 4, frequency: 98, duration: 1.8, gain: 0.5 },
      { beat: 6, frequency: 146.83, duration: 1.8, gain: 0.5 },
    ],
  },
  {
    name: "胜利结算",
    tempo: 124,
    lead: [
      { beat: 0, frequency: 523.25, duration: 0.28 },
      { beat: 0.5, frequency: 659.25, duration: 0.28 },
      { beat: 1, frequency: 783.99, duration: 0.28 },
      { beat: 1.5, frequency: 1046.5, duration: 0.48 },
      { beat: 2.5, frequency: 987.77, duration: 0.28 },
      { beat: 3, frequency: 880, duration: 0.28 },
      { beat: 3.5, frequency: 783.99, duration: 0.48 },
      { beat: 4.5, frequency: 659.25, duration: 0.28 },
      { beat: 5, frequency: 783.99, duration: 0.28 },
      { beat: 5.5, frequency: 880, duration: 0.28 },
      { beat: 6, frequency: 1046.5, duration: 0.8 },
    ],
    bass: [
      { beat: 0, frequency: 130.81, duration: 0.75, gain: 0.55 },
      { beat: 1, frequency: 164.81, duration: 0.75, gain: 0.55 },
      { beat: 2, frequency: 196, duration: 0.75, gain: 0.55 },
      { beat: 3, frequency: 164.81, duration: 0.75, gain: 0.55 },
      { beat: 4, frequency: 146.83, duration: 0.75, gain: 0.55 },
      { beat: 5, frequency: 196, duration: 0.75, gain: 0.55 },
      { beat: 6, frequency: 261.63, duration: 0.9, gain: 0.55 },
    ],
  },
];

function loadEnabled() {
  return localStorage.getItem(BGM_ENABLED_KEY) !== "false";
}

function loadVolume() {
  const stored = Number(localStorage.getItem(BGM_VOLUME_KEY));
  return Number.isFinite(stored) ? Math.min(1, Math.max(0, stored)) : 0.42;
}

function loadTrackIndex() {
  const stored = Number(localStorage.getItem(BGM_TRACK_KEY));
  return Number.isFinite(stored) ? Math.min(bgmTracks.length - 1, Math.max(0, stored)) : 0;
}

function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) throw new Error("Web Audio is not supported.");
  return new AudioContextClass();
}

function scheduleNote(
  context: AudioContext,
  output: GainNode,
  note: BgmNote,
  startAt: number,
  beatLength: number,
  wave: OscillatorType,
  baseGain: number,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const start = startAt + note.beat * beatLength;
  const duration = note.duration * beatLength;
  const peak = baseGain * (note.gain ?? 1);

  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(note.frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(output);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.04);
}

export function useBgm() {
  const [enabled, setEnabled] = useState(loadEnabled);
  const [active, setActive] = useState(false);
  const [trackIndex, setTrackIndex] = useState(loadTrackIndex);
  const [volume, setVolumeState] = useState(loadVolume);
  const [ducking, setDucking] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const unlockedRef = useRef(false);

  const track = bgmTracks[trackIndex];

  const stopLoop = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const ensureAudio = useCallback(() => {
    if (!contextRef.current) {
      const context = getAudioContext();
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.connect(context.destination);
      contextRef.current = context;
      gainRef.current = gain;
    }

    if (contextRef.current.state === "suspended") {
      void contextRef.current.resume();
    }

    return { context: contextRef.current, gain: gainRef.current };
  }, []);

  const scheduleTrack = useCallback(() => {
    if (!enabled || !active || !unlockedRef.current || !gainRef.current || !contextRef.current) return;

    const context = contextRef.current;
    const output = gainRef.current;
    const currentTrack = bgmTracks[trackIndex];
    const beatLength = 60 / currentTrack.tempo;
    const loopBeats = 8;
    const loopDuration = loopBeats * beatLength;
    const startAt = Math.max(context.currentTime + 0.04, startedAtRef.current || context.currentTime + 0.04);

    for (const note of currentTrack.bass) {
      scheduleNote(context, output, note, startAt, beatLength, "triangle", 0.018);
    }

    for (const note of currentTrack.lead) {
      scheduleNote(context, output, note, startAt, beatLength, "square", 0.022);
    }

    startedAtRef.current = startAt + loopDuration;
    timerRef.current = window.setTimeout(scheduleTrack, Math.max(80, (loopDuration - 0.45) * 1000));
  }, [active, enabled, trackIndex]);

  useEffect(() => {
    if (!enabled || !active || !unlockedRef.current) {
      stopLoop();
      return;
    }

    try {
      ensureAudio();
      startedAtRef.current = 0;
      stopLoop();
      scheduleTrack();
    } catch {
      setEnabled(false);
      localStorage.setItem(BGM_ENABLED_KEY, "false");
    }

    return stopLoop;
  }, [active, enabled, ensureAudio, scheduleTrack, stopLoop, trackIndex]);

  useEffect(() => {
    const gain = gainRef.current;
    const context = contextRef.current;
    if (!gain || !context) return;

    const target = enabled && active ? volume * (ducking ? 0.16 : 1) : 0.0001;
    gain.gain.cancelScheduledValues(context.currentTime);
    gain.gain.setTargetAtTime(Math.max(0.0001, target), context.currentTime, 0.12);
  }, [active, ducking, enabled, volume]);

  useEffect(() => {
    return () => {
      stopLoop();
      void contextRef.current?.close();
    };
  }, [stopLoop]);

  const setEnabledValue = useCallback(
    (next: boolean) => {
      if (next) {
        unlockedRef.current = true;
        ensureAudio();
      }
      setEnabled(next);
      localStorage.setItem(BGM_ENABLED_KEY, String(next));
    },
    [ensureAudio],
  );

  const activateFromGesture = useCallback(() => {
    if (!enabled) return;
    unlockedRef.current = true;
    ensureAudio();
    if (active) {
      startedAtRef.current = 0;
      stopLoop();
      window.setTimeout(scheduleTrack, 0);
    }
  }, [active, enabled, ensureAudio, scheduleTrack, stopLoop]);

  const toggle = useCallback(() => {
    setEnabledValue(!enabled);
  }, [enabled, setEnabledValue]);

  const setVolume = useCallback((next: number) => {
    const normalized = Math.min(1, Math.max(0, next));
    setVolumeState(normalized);
    localStorage.setItem(BGM_VOLUME_KEY, String(normalized));
  }, []);

  const setTrack = useCallback(
    (index: number) => {
      const next = (index + bgmTracks.length) % bgmTracks.length;
      if (next === trackIndex) return;

      setTrackIndex(next);
      localStorage.setItem(BGM_TRACK_KEY, String(next));
      if (enabled) {
        startedAtRef.current = 0;
        stopLoop();
      }
    },
    [enabled, stopLoop, trackIndex],
  );

  const nextTrack = useCallback(() => setTrack(trackIndex + 1), [setTrack, trackIndex]);
  const previousTrack = useCallback(() => setTrack(trackIndex - 1), [setTrack, trackIndex]);

  return useMemo(
    () => ({
      ducking,
      enabled,
      active,
      activateFromGesture,
      nextTrack,
      previousTrack,
      setActive,
      setDucking,
      setEnabled: setEnabledValue,
      setTrack,
      setVolume,
      toggle,
      track,
      trackIndex,
      tracks: bgmTracks,
      volume,
    }),
    [
      active,
      activateFromGesture,
      ducking,
      enabled,
      nextTrack,
      previousTrack,
      setEnabledValue,
      setTrack,
      setVolume,
      toggle,
      track,
      trackIndex,
      volume,
    ],
  );
}
