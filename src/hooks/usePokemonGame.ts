import { useEffect, useMemo, useRef, useState } from "react";
import { getPokedexEntry } from "../data/pokedex";
import type { Pokemon } from "../data/pokemon";
import { getAcceptedAnswers, isCloseAnswer, normalizeAnswer } from "../utils/answerMatching";
import { recordPokemonRound, type PokemonRoundOutcome } from "../utils/pokemonProgress";
import { pickNextPokemon } from "../utils/roundSelection";
import { getAverageAnswerSeconds } from "../utils/result";
import { getNextStreak } from "../utils/streak";

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
export type GameMode = "challenge" | "infinite";

const BEST_KEY = "who-am-i-best";
const BEST_INFINITE_STREAK_KEY = "who-am-i-best-infinite-streak";
const ENTERING_MS = 620;
const TRANSITION_MS = 420;
const ROUND_LIMIT = 10;
const ROUND_SECONDS = 10;
const FIRST_GENERATION_LIMIT = 151;
const COUNTDOWN_TICK_MS = 80;

function getPool(list: Pokemon[], difficulty: Difficulty) {
  if (difficulty === "easy") return list.filter((pokemon) => pokemon.id <= FIRST_GENERATION_LIMIT);
  return list;
}

function formatTimeLeft(seconds: number) {
  if (seconds <= 0) return "0.0";
  return seconds.toFixed(1);
}

function loadBest() {
  const stored = Number(localStorage.getItem(BEST_KEY));
  return Number.isFinite(stored) ? stored : 0;
}

function loadBestInfiniteStreak() {
  const stored = Number(localStorage.getItem(BEST_INFINITE_STREAK_KEY));
  return Number.isFinite(stored) ? stored : 0;
}

export function usePokemonGame(list: Pokemon[]) {
  const [mode, setMode] = useState<GameMode>("challenge");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [current, setCurrent] = useState(() => pickNextPokemon(list));
  const [answer, setAnswer] = useState("");
  const [dexVisible, setDexVisible] = useState(false);
  const [notice, setNotice] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [phase, setPhase] = useState<Phase>("ready");
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [hit, setHit] = useState(0);
  const [total, setTotal] = useState(0);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [answerTimes, setAnswerTimes] = useState<number[]>([]);
  const [best, setBest] = useState(loadBest);
  const [bestInfiniteStreak, setBestInfiniteStreak] = useState(loadBestInfiniteStreak);
  const phaseTimer = useRef<number | null>(null);
  const roundStartedAt = useRef<number | null>(null);
  const roundSettled = useRef(false);
  const usedIds = useRef(new Set<number>());

  useEffect(() => {
    return () => {
      if (phaseTimer.current) window.clearTimeout(phaseTimer.current);
    };
  }, []);

  useEffect(() => {
    if (phase !== "playing") return undefined;

    const startedAt = performance.now();
    roundStartedAt.current = startedAt;
    setTimeLeft(ROUND_SECONDS);
    const countdownTimer = window.setInterval(() => {
      const elapsed = (performance.now() - startedAt) / 1000;
      const nextTimeLeft = Math.max(0, ROUND_SECONDS - elapsed);
      setTimeLeft(nextTimeLeft);

      if (nextTimeLeft <= 0) {
        window.clearInterval(countdownTimer);
        setNotice("");
        setRevealed(true);
        setPhase("timeout");
        recordRound("timeout");
      }
    }, COUNTDOWN_TICK_MS);

    return () => window.clearInterval(countdownTimer);
  }, [phase]);

  const pool = useMemo(() => getPool(list, difficulty), [difficulty, list]);

  const acceptedAnswers = useMemo(() => {
    return getAcceptedAnswers(current, difficulty);
  }, [current, difficulty]);

  const pokedexEntry = useMemo(() => getPokedexEntry(current.id), [current.id]);
  const averageAnswerSeconds = useMemo(() => getAverageAnswerSeconds(answerTimes), [answerTimes]);

  const status = useMemo(() => {
    if (phase === "ready") return "选择模式和难度后，点击开始挑战";
    if (phase === "finished") {
      if (mode === "infinite") return "无限挑战结束，可以再来一局或换个模式";
      return "挑战完成，可以再来一局或换个难度";
    }
    if (phase === "entering") return "正在载入剪影";
    if (phase === "transitioning") return "正在切换下一题";
    if (phase === "correct") {
      const streakText = streak >= 2 ? `，${streak} 连击` : "";
      if (mode === "challenge" && total >= ROUND_LIMIT) return `答对了${streakText}，挑战完成！可说：查看结果 / 介绍一下`;
      if (mode === "infinite") return `答对了${streakText}，继续冲！可说：下一题 / 介绍一下`;
      return `答对了${streakText}！可说：下一题 / 介绍一下`;
    }
    if (phase === "skipped") {
      if (mode === "infinite") return `无限挑战结束，答案是 ${current.zh}；按 A 查看结果`;
      if (total >= ROUND_LIMIT) return `挑战完成，答案是 ${current.zh}；可说：查看结果 / 介绍一下`;
      return `已跳过，答案是 ${current.zh}；可说：下一题 / 介绍一下`;
    }
    if (phase === "timeout") {
      if (mode === "infinite") return `无限挑战结束，答案是 ${current.zh}；按 A 查看结果`;
      if (total >= ROUND_LIMIT) return `挑战完成，答案是 ${current.zh}；可说：查看结果 / 介绍一下`;
      return `时间到，答案是 ${current.zh}；可说：下一题 / 介绍一下`;
    }
    if (notice) return notice;
    if (dexVisible) return "图鉴资料显示中";
    return `请说出宝可梦名字，还剩 ${formatTimeLeft(timeLeft)} 秒`;
  }, [current.zh, dexVisible, mode, notice, phase, streak, timeLeft, total]);

  const feedback = useMemo(() => {
    if (phase === "ready") return "准备开始";
    if (phase === "finished") {
      if (mode === "infinite") return `连续答对 ${hit}，最高连胜 ${bestInfiniteStreak}`;
      return `命中 ${hit}/${ROUND_LIMIT}，最长连击 ${longestStreak}`;
    }
    if (phase === "entering") return "剪影出现中";
    if (phase === "transitioning") return "下一题马上来";
    if (phase === "correct") return `${current.zh} / ${current.en}`;
    if (phase === "skipped") return "已跳过";
    if (phase === "timeout") return "时间到";
    if (dexVisible) return `${pokedexEntry.category} / ${pokedexEntry.types.join("·")}`;
    if (notice) return notice;
    return "我是谁？";
  }, [bestInfiniteStreak, current, dexVisible, hit, longestStreak, mode, notice, phase, pokedexEntry]);

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
    roundStartedAt.current = null;
    setTimeLeft(ROUND_SECONDS);
    setPhase("entering");
    phaseTimer.current = window.setTimeout(() => {
      setPhase("playing");
      phaseTimer.current = null;
    }, ENTERING_MS);
  }

  function recordRound(outcome: PokemonRoundOutcome) {
    if (roundSettled.current) return;

    roundSettled.current = true;
    const isHit = outcome === "hit";
    const nextTotal = total + 1;
    const nextHit = hit + (isHit ? 1 : 0);
    const nextStreak = getNextStreak(streak, isHit);
    const answerSeconds =
      isHit && roundStartedAt.current !== null
        ? Math.min(ROUND_SECONDS, Math.max(0, (performance.now() - roundStartedAt.current) / 1000))
        : null;
    setTotal(nextTotal);
    setHit(nextHit);
    setStreak(nextStreak);
    setLongestStreak((currentLongestStreak) => Math.max(currentLongestStreak, nextStreak));
    if (answerSeconds !== null) {
      setAnswerTimes((currentAnswerTimes) => [...currentAnswerTimes, answerSeconds]);
    }
    recordPokemonRound(current.id, outcome);

    if (mode === "challenge" && nextHit > best) {
      setBest(nextHit);
      localStorage.setItem(BEST_KEY, String(nextHit));
    }

    if (mode === "infinite" && nextStreak > bestInfiniteStreak) {
      setBestInfiniteStreak(nextStreak);
      localStorage.setItem(BEST_INFINITE_STREAK_KEY, String(nextStreak));
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
    recordRound("hit");
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
    recordRound("skip");
  }

  function selectNextRoundPokemon(previousId?: number) {
    const nextPokemon = pickNextPokemon(pool, previousId, usedIds.current);
    usedIds.current.add(nextPokemon.id);
    return nextPokemon;
  }

  function start() {
    clearPhaseTimer();
    usedIds.current = new Set();
    setAnswer("");
    setDexVisible(false);
    setNotice("");
    setHit(0);
    setTotal(0);
    setStreak(0);
    setLongestStreak(0);
    setAnswerTimes([]);
    setCurrent(selectNextRoundPokemon(current.id));
    setRevealed(false);
    enterRound();
  }

  function resetToReady() {
    clearPhaseTimer();
    usedIds.current = new Set();
    roundSettled.current = false;
    setAnswer("");
    setDexVisible(false);
    setNotice("");
    setHit(0);
    setTotal(0);
    setStreak(0);
    setLongestStreak(0);
    setAnswerTimes([]);
    setRevealed(false);
    setTimeLeft(ROUND_SECONDS);
    setPhase("ready");
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

    if (mode === "infinite" && phase !== "correct") {
      setPhase("finished");
      return;
    }

    if (mode === "challenge" && total >= ROUND_LIMIT) {
      setPhase("finished");
      return;
    }

    setAnswer("");
    setDexVisible(false);
    setNotice("");
    setRevealed(false);
    setTimeLeft(ROUND_SECONDS);
    setPhase("transitioning");
    setCurrent(selectNextRoundPokemon(current.id));
    phaseTimer.current = window.setTimeout(() => {
      enterRound();
    }, TRANSITION_MS);
  }

  return {
    answer,
    averageAnswerSeconds,
    best,
    bestInfiniteStreak,
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
    longestStreak,
    mode,
    next,
    phase,
    pokedexEntry,
    revealed,
    roundLimit: ROUND_LIMIT,
    resetToReady,
    setAnswer: updateAnswer,
    setDifficulty,
    setMode,
    showDex,
    skip,
    start,
    status,
    streak,
    submit,
    submitAnswer,
    timeLeft,
    total,
    tryAnswer,
    roundSeconds: ROUND_SECONDS,
  };
}
