import { useMemo, useState } from "react";
import type { Pokemon } from "../data/pokemon";

type Phase = "ready" | "playing" | "correct" | "wrong" | "skipped";

const BEST_KEY = "who-am-i-best";

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
  const [phase, setPhase] = useState<Phase>("playing");
  const [hit, setHit] = useState(0);
  const [total, setTotal] = useState(0);
  const [best, setBest] = useState(loadBest);

  const acceptedAnswers = useMemo(() => {
    return [current.zh, current.en, ...current.aliases].map(normalizeAnswer);
  }, [current]);

  const status = useMemo(() => {
    if (phase === "correct") return "CORRECT! 身份确认";
    if (phase === "wrong") return `WRONG! 答案是 ${current.zh}`;
    if (phase === "skipped") return `SKIPPED! 答案是 ${current.zh}`;
    return "READY... 输入答案";
  }, [current.zh, phase]);

  const feedback = useMemo(() => {
    if (phase === "correct") return `${current.zh} / ${current.en}`;
    if (phase === "wrong") return "差一点，再来一题";
    if (phase === "skipped") return "已跳过";
    return "我是谁？";
  }, [current, phase]);

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
    if (revealed) return;

    const normalized = normalizeAnswer(answer);
    if (!normalized) return;

    const isCorrect = acceptedAnswers.includes(normalized);
    setRevealed(true);
    setPhase(isCorrect ? "correct" : "wrong");
    recordRound(isCorrect);
  }

  function skip() {
    if (revealed) return;

    setRevealed(true);
    setPhase("skipped");
    recordRound(false);
  }

  function next() {
    setCurrent((previous) => pickNext(list, previous.id));
    setAnswer("");
    setRevealed(false);
    setPhase("playing");
  }

  return {
    answer,
    best,
    current,
    feedback,
    hit,
    next,
    phase,
    revealed,
    setAnswer,
    skip,
    status,
    submit,
    total,
  };
}

