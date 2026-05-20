import type { Difficulty } from "../../hooks/usePokemonGame";
import type { Pokemon } from "../../data/pokemon";
import { levenshteinDistance, normalizeAnswer } from "../answerMatching.ts";
import { extractVoiceAnswer } from "../voiceCommands.ts";
import { pinyinSequenceSimilarity, toPinyinSyllables } from "./pinyinSimilarity.ts";
import { shouldRetryAmbiguousMatch } from "./riskRules.ts";
import { createVoiceLexicon, type VoiceLexiconEntry } from "./voiceLexicon.ts";

export type VoiceAnswerConfidence = "high" | "medium" | "low";

export type VoiceAnswerCorrection = {
  correctedAnswer: string;
  confidence: VoiceAnswerConfidence;
  heardText: string;
  matchedName: string;
  matchedPokemonId: number | null;
  score: number;
  shouldRetry: boolean;
};

type ScoredLexiconEntry = {
  entry: VoiceLexiconEntry;
  score: number;
};

const HIGH_CONFIDENCE = 0.9;
const MEDIUM_CONFIDENCE = 0.76;
const TOP_GAP_CONFIDENCE = 0.08;

function textSimilarity(left: string, right: string) {
  if (!left || !right) return 0;
  if (left === right) return 1;

  const maxLength = Math.max(left.length, right.length);
  if (maxLength <= 2) return 0;

  if (right.startsWith(left) && left.length >= 2) {
    return Math.max(0.76, 1 - (right.length - left.length) * 0.1);
  }

  if (left.startsWith(right) && right.length >= 2) {
    return Math.max(0.76, 1 - (left.length - right.length) * 0.1);
  }

  return Math.max(0, 1 - levenshteinDistance(left, right) / maxLength);
}

export function scoreVoiceAnswerAgainstName(answer: string, name: string) {
  const normalizedAnswer = normalizeAnswer(answer);
  const normalizedName = normalizeAnswer(name);
  const answerSyllables = toPinyinSyllables(answer);
  const nameSyllables = toPinyinSyllables(name);
  const textScore = textSimilarity(normalizedAnswer, normalizedName);
  const pinyinScore = pinyinSequenceSimilarity(answerSyllables, nameSyllables);

  return Math.max(textScore, pinyinScore);
}

function scoreEntry(answers: string[], entry: VoiceLexiconEntry): ScoredLexiconEntry {
  const score = Math.max(
    ...answers.map((answer) => {
      const normalizedAnswer = normalizeAnswer(answer);
      const textScore = textSimilarity(normalizedAnswer, entry.normalized);
      const pinyinScore = pinyinSequenceSimilarity(toPinyinSyllables(answer), entry.syllables);
      return Math.max(textScore, pinyinScore);
    }),
  );

  return { entry, score };
}

function bestByPokemon(matches: ScoredLexiconEntry[]) {
  const best = new Map<number, ScoredLexiconEntry>();

  for (const match of matches) {
    const previous = best.get(match.entry.pokemon.id);
    if (!previous || match.score > previous.score) {
      best.set(match.entry.pokemon.id, match);
    }
  }

  return [...best.values()].sort((left, right) => right.score - left.score);
}

function getConfidence(score: number): VoiceAnswerConfidence {
  if (score >= HIGH_CONFIDENCE) return "high";
  if (score >= MEDIUM_CONFIDENCE) return "medium";
  return "low";
}

export function correctVoiceAnswer(
  rawTexts: string | string[],
  currentPokemon: Pokemon,
  allPokemon: Pokemon[],
  difficulty: Difficulty,
): VoiceAnswerCorrection {
  const heardTexts = (Array.isArray(rawTexts) ? rawTexts : [rawTexts])
    .map((text) => extractVoiceAnswer(text))
    .filter(Boolean);
  const fallbackText = heardTexts[0] || "";
  const lexicon = createVoiceLexicon(allPokemon, difficulty);
  const ranked = bestByPokemon(lexicon.map((entry) => scoreEntry(heardTexts, entry)));
  const top = ranked[0];
  const second = ranked[1];
  const current = ranked.find((match) => match.entry.pokemon.id === currentPokemon.id) || {
    entry: {
      kind: "official" as const,
      name: currentPokemon.zh,
      normalized: normalizeAnswer(currentPokemon.zh),
      pokemon: currentPokemon,
      syllables: toPinyinSyllables(currentPokemon.zh),
    },
    score: 0,
  };

  if (!top) {
    return {
      correctedAnswer: fallbackText,
      confidence: "low",
      heardText: fallbackText,
      matchedName: "",
      matchedPokemonId: null,
      score: 0,
      shouldRetry: true,
    };
  }

  const ambiguous = shouldRetryAmbiguousMatch({
    currentPokemon,
    currentScore: current.score,
    secondPokemon: second?.entry.pokemon,
    secondScore: second?.score,
    topPokemon: top.entry.pokemon,
    topScore: top.score,
  });

  if (ambiguous) {
    return {
      correctedAnswer: fallbackText,
      confidence: getConfidence(top.score),
      heardText: fallbackText,
      matchedName: top.entry.name,
      matchedPokemonId: top.entry.pokemon.id,
      score: top.score,
      shouldRetry: true,
    };
  }

  if (current.score >= HIGH_CONFIDENCE && top.score - current.score < TOP_GAP_CONFIDENCE) {
    return {
      correctedAnswer: currentPokemon.zh,
      confidence: "high",
      heardText: fallbackText,
      matchedName: current.entry.name,
      matchedPokemonId: currentPokemon.id,
      score: current.score,
      shouldRetry: false,
    };
  }

  if (top.score >= HIGH_CONFIDENCE) {
    return {
      correctedAnswer: top.entry.pokemon.zh,
      confidence: "high",
      heardText: fallbackText,
      matchedName: top.entry.name,
      matchedPokemonId: top.entry.pokemon.id,
      score: top.score,
      shouldRetry: false,
    };
  }

  return {
    correctedAnswer: current.score >= MEDIUM_CONFIDENCE ? currentPokemon.zh : fallbackText,
    confidence: getConfidence(current.score),
    heardText: fallbackText,
    matchedName: current.entry.name,
    matchedPokemonId: current.score >= MEDIUM_CONFIDENCE ? currentPokemon.id : null,
    score: current.score,
    shouldRetry: current.score < MEDIUM_CONFIDENCE,
  };
}
