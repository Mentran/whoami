import { useEffect, useMemo, useRef, useState } from "react";
import type { Pokemon } from "../data/pokemon";

export type Phase = "ready" | "entering" | "playing" | "correct" | "wrong" | "skipped" | "transitioning";

const BEST_KEY = "who-am-i-best";
const ENTERING_MS = 620;
const TRANSITION_MS = 420;

function normalizeAnswer(value: string) {
  return value.trim().replace(/\s+/g, "").toLowerCase();
}

function pickNext(list: Pokemon[], previousId?: number) {
  if (list.length === 1) return list[0];

  let next = list[Math.floor(Math.random() * list.length)];
  while (next.id === previousId) {
    next = list[Math.floor(Math.random() * list.length)];
  }
  return next;
}

function loadBest() {
  const stored = Number(localStorage.getItem(BEST_KEY));
  return Number.isFinite(stored) ? stored : 0;
}

export function usePokemonGame(list: Pokemon[]) {
  const [current, setCurrent] = useState(() => pickNext(list));
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [phase, setPhase] = useState<Phase>("ready");
  const [hit, setHit] = useState(0);
  const [total, setTotal] = useState(0);
  const [best, setBest] = useState(loadBest);
  const phaseTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (phaseTimer.current) window.clearTimeout(phaseTimer.current);
    };
  }, []);

  const acceptedAnswers = useMemo(() => {
    return [current.zh, current.en, ...current.aliases].map(normalizeAnswer);
  }, [current]);

  const status = useMemo(() => {
    if (phase === "ready") return "INSERT COIN... PRESS START";
    if (phase === "entering") return "SCANNING... 黑影载入";
    if (phase === "transitioning") return "TUNING... 下一题";
    if (phase === "correct") return "CORRECT! 身份确认";
    if (phase === "wrong") return `WRONG! 答案是 ${current.zh}`;
    if (phase === "skipped") return `SKIPPED! 答案是 ${current.zh}`;
    return "READY... 输入答案";
  }, [current.zh, phase]);

  const feedback = useMemo(() => {
    if (phase === "ready") return "PRESS START";
    if (phase === "entering") return "信号接入中";
    if (phase === "transitioning") return "频道切换中";
    if (phase === "correct") return `${current.zh} / ${current.en}`;
    if (phase === "wrong") return "差一点，再来一题";
    if (phase === "skipped") return "已跳过";
    return "我是谁？";
  }, [current, phase]);

  function clearPhaseTimer() {
    if (phaseTimer.current) {
      window.clearTimeout(phaseTimer.current);
      phaseTimer.current = null;
    }
  }

  function enterRound() {
    clearPhaseTimer();
    setPhase("entering");
    phaseTimer.current = window.setTimeout(() => {
      setPhase("playing");
      phaseTimer.current = null;
    }, ENTERING_MS);
  }

  function recordRound(isHit: boolean) {
    const nextTotal = total + 1;
    const nextHit = hit + (isHit ? 1 : 0);
    setTotal(nextTotal);
    setHit(nextHit);

    if (nextHit > best) {
      setBest(nextHit);
      localStorage.setItem(BEST_KEY, String(nextHit));
    }
  }

  function submit() {
    if (phase !== "playing") return;

    const normalized = normalizeAnswer(answer);
    if (!normalized) return;

    const isCorrect = acceptedAnswers.includes(normalized);
    setRevealed(true);
    setPhase(isCorrect ? "correct" : "wrong");
    recordRound(isCorrect);
  }

  function skip() {
    if (phase !== "playing") return;

    setRevealed(true);
    setPhase("skipped");
    recordRound(false);
  }

  function start() {
    setAnswer("");
    setRevealed(false);
    enterRound();
  }

  function next() {
    if (phase === "entering" || phase === "transitioning") return;

    if (phase === "ready") {
      start();
      return;
    }

    if (!revealed) {
      submit();
      return;
    }

    clearPhaseTimer();
    setPhase("transitioning");
    phaseTimer.current = window.setTimeout(() => {
      setCurrent((previous) => pickNext(list, previous.id));
      setAnswer("");
      setRevealed(false);
      enterRound();
    }, TRANSITION_MS);
  }

  return {
    answer,
    best,
    canAnswer: phase === "playing",
    canAdvance: phase === "ready" || phase === "playing" || phase === "correct" || phase === "wrong" || phase === "skipped",
    canSkip: phase === "playing",
    current,
    feedback,
    hit,
    next,
    phase,
    revealed,
    setAnswer,
    skip,
    start,
    status,
    submit,
    total,
  };
}
