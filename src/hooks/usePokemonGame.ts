import { useEffect, useMemo, useRef, useState } from "react";
import { getPokedexEntry } from "../data/pokedex";
import type { Pokemon } from "../data/pokemon";

export type Phase =
  | "ready"
  | "entering"
  | "playing"
  | "correct"
  | "skipped"
  | "timeout"
  | "transitioning"
  | "finished";
export type Difficulty = "easy" | "normal" | "hard";

const BEST_KEY = "who-am-i-best";
const ENTERING_MS = 620;
const TRANSITION_MS = 420;
const ROUND_LIMIT = 10;
const ROUND_SECONDS = 10;
const EASY_POOL = new Set([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 16, 25, 26, 35, 36, 39, 52, 54, 58, 74, 79, 81, 92, 94, 95,
  104, 113, 129, 130, 131, 133, 134, 135, 136, 143, 150, 151,
]);
const HARD_EXCLUDED_POOL = new Set([1, 4, 7, 25, 39, 52, 54, 129, 133, 143, 150, 151]);

function normalizeAnswer(value: string) {
  return value.trim().replace(/\s+/g, "").toLowerCase();
}

function levenshteinDistance(left: string, right: string) {
  const rows = Array.from({ length: left.length + 1 }, (_, index) => [index]);

  for (let column = 1; column <= right.length; column += 1) {
    rows[0][column] = column;
  }

  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1;
      rows[row][column] = Math.min(
        rows[row - 1][column] + 1,
        rows[row][column - 1] + 1,
        rows[row - 1][column - 1] + cost,
      );
    }
  }

  return rows[left.length][right.length];
}

function isCloseAnswer(answer: string, acceptedAnswers: string[]) {
  if (answer.length < 2) return false;

  return acceptedAnswers.some((accepted) => {
    if (accepted.length < 3) return false;
    if (accepted.startsWith(answer) || answer.startsWith(accepted)) return true;

    const maxDistance = accepted.length >= 6 ? 2 : 1;
    return levenshteinDistance(answer, accepted) <= maxDistance;
  });
}

function pickNext(list: Pokemon[], previousId?: number) {
  if (list.length === 1) return list[0];

  let next = list[Math.floor(Math.random() * list.length)];
  while (next.id === previousId) {
    next = list[Math.floor(Math.random() * list.length)];
  }
  return next;
}

function getPool(list: Pokemon[], difficulty: Difficulty) {
  if (difficulty === "easy") return list.filter((pokemon) => EASY_POOL.has(pokemon.id));
  if (difficulty === "hard") return list.filter((pokemon) => !HARD_EXCLUDED_POOL.has(pokemon.id));
  return list;
}

function loadBest() {
  const stored = Number(localStorage.getItem(BEST_KEY));
  return Number.isFinite(stored) ? stored : 0;
}

export function usePokemonGame(list: Pokemon[]) {
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [current, setCurrent] = useState(() => pickNext(list));
  const [answer, setAnswer] = useState("");
  const [dexVisible, setDexVisible] = useState(false);
  const [notice, setNotice] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [phase, setPhase] = useState<Phase>("ready");
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [hit, setHit] = useState(0);
  const [total, setTotal] = useState(0);
  const [best, setBest] = useState(loadBest);
  const phaseTimer = useRef<number | null>(null);
  const roundSettled = useRef(false);

  useEffect(() => {
    return () => {
      if (phaseTimer.current) window.clearTimeout(phaseTimer.current);
    };
  }, []);

  useEffect(() => {
    if (phase !== "playing") return undefined;

    setTimeLeft(ROUND_SECONDS);
    const countdownTimer = window.setInterval(() => {
      setTimeLeft((currentTime) => {
        if (currentTime <= 1) {
          window.clearInterval(countdownTimer);
          setNotice("");
          setRevealed(true);
          setPhase("timeout");
          recordRound(false);
          return 0;
        }

        return currentTime - 1;
      });
    }, 1000);

    return () => window.clearInterval(countdownTimer);
  }, [phase]);

  const pool = useMemo(() => getPool(list, difficulty), [difficulty, list]);

  const acceptedAnswers = useMemo(() => {
    const aliases = difficulty === "hard" ? [] : current.aliases;
    return [current.zh, current.en, ...aliases].map(normalizeAnswer);
  }, [current, difficulty]);

  const pokedexEntry = useMemo(() => getPokedexEntry(current.id, current.zh), [current]);

  const status = useMemo(() => {
    if (phase === "ready") return "选择难度后，点击开始挑战";
    if (phase === "finished") return "挑战完成，可以再来一局";
    if (phase === "entering") return "正在载入剪影";
    if (phase === "transitioning") return "正在切换下一题";
    if (phase === "correct") return "答对了！可说：下一题 / 介绍一下";
    if (phase === "skipped") return `已跳过，答案是 ${current.zh}；可说：下一题 / 介绍一下`;
    if (phase === "timeout") return `时间到，答案是 ${current.zh}；可说：下一题 / 介绍一下`;
    if (notice) return notice;
    if (dexVisible) return "图鉴资料显示中";
    return `请说出宝可梦名字，还剩 ${timeLeft} 秒`;
  }, [current.zh, dexVisible, notice, phase, timeLeft]);

  const feedback = useMemo(() => {
    if (phase === "ready") return "准备开始";
    if (phase === "finished") return `命中 ${hit}/${ROUND_LIMIT}`;
    if (phase === "entering") return "剪影出现中";
    if (phase === "transitioning") return "下一题马上来";
    if (phase === "correct") return `${current.zh} / ${current.en}`;
    if (phase === "skipped") return "已跳过";
    if (phase === "timeout") return "时间到";
    if (dexVisible) return `${pokedexEntry.category} / ${pokedexEntry.types.join("·")}`;
    if (notice) return notice;
    return "我是谁？";
  }, [current, dexVisible, hit, notice, phase, pokedexEntry]);

  function updateAnswer(value: string) {
    setAnswer(value);
    if (notice) setNotice("");
  }

  function showDex() {
    setDexVisible(true);
  }

  function clearPhaseTimer() {
    if (phaseTimer.current) {
      window.clearTimeout(phaseTimer.current);
      phaseTimer.current = null;
    }
  }

  function enterRound() {
    clearPhaseTimer();
    roundSettled.current = false;
    setTimeLeft(ROUND_SECONDS);
    setPhase("entering");
    phaseTimer.current = window.setTimeout(() => {
      setPhase("playing");
      phaseTimer.current = null;
    }, ENTERING_MS);
  }

  function recordRound(isHit: boolean) {
    if (roundSettled.current) return;

    roundSettled.current = true;
    const nextTotal = total + 1;
    const nextHit = hit + (isHit ? 1 : 0);
    setTotal(nextTotal);
    setHit(nextHit);

    if (nextHit > best) {
      setBest(nextHit);
      localStorage.setItem(BEST_KEY, String(nextHit));
    }
  }

  function tryAnswer(rawAnswer: string) {
    if (phase !== "playing") return "ignored";

    const normalized = normalizeAnswer(rawAnswer);
    if (!normalized) return "empty";

    setAnswer(rawAnswer);
    setDexVisible(false);
    setNotice("");
    const isCorrect = acceptedAnswers.includes(normalized);
    if (difficulty !== "hard" && !isCorrect && isCloseAnswer(normalized, acceptedAnswers)) {
      setNotice("很接近，再完整一点");
      return "close";
    }

    if (!isCorrect) {
      setNotice("不是它，继续猜");
      return "wrong";
    }

    setRevealed(true);
    setPhase("correct");
    recordRound(true);
    return "correct";
  }

  function submitAnswer(rawAnswer = answer) {
    tryAnswer(rawAnswer);
  }

  function submit() {
    submitAnswer();
  }

  function skip() {
    if (phase !== "playing") return;

    setRevealed(true);
    setDexVisible(false);
    setPhase("skipped");
    recordRound(false);
  }

  function start() {
    setAnswer("");
    setDexVisible(false);
    setNotice("");
    setHit(0);
    setTotal(0);
    setCurrent((previous) => pickNext(pool, previous.id));
    setRevealed(false);
    enterRound();
  }

  function next() {
    if (phase === "entering" || phase === "transitioning") return;

    if (phase === "ready" || phase === "finished") {
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
      if (total >= ROUND_LIMIT) {
        setPhase("finished");
        phaseTimer.current = null;
        return;
      }

      setCurrent((previous) => pickNext(pool, previous.id));
      setAnswer("");
      setDexVisible(false);
      setNotice("");
      setRevealed(false);
      enterRound();
    }, TRANSITION_MS);
  }

  return {
    answer,
    best,
    canAnswer: phase === "playing",
    canAdvance:
      phase === "ready" ||
      phase === "finished" ||
      phase === "playing" ||
      phase === "correct" ||
      phase === "skipped" ||
      phase === "timeout",
    canSkip: phase === "playing",
    current,
    difficulty,
    dexVisible,
    feedback,
    hit,
    next,
    phase,
    pokedexEntry,
    revealed,
    roundLimit: ROUND_LIMIT,
    setAnswer: updateAnswer,
    setDifficulty,
    showDex,
    skip,
    start,
    status,
    submit,
    submitAnswer,
    timeLeft,
    total,
    tryAnswer,
    roundSeconds: ROUND_SECONDS,
  };
}
