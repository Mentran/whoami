export type PokemonRoundOutcome = "hit" | "timeout" | "skip";

export type PokemonProgress = {
  pokemonId: number;
  seen: number;
  hit: number;
  miss: number;
  correctStreak: number;
  lastSeenAt: number;
};

export type PokemonProgressRecords = Record<number, PokemonProgress>;

const PROGRESS_KEY = "who-am-i-pokemon-progress-v1";
const PROGRESS_VERSION = 1;

type StoredPokemonProgress = {
  version: typeof PROGRESS_VERSION;
  records: PokemonProgressRecords;
};

function emptyRecords(): PokemonProgressRecords {
  return {};
}

function createRecord(pokemonId: number): PokemonProgress {
  return {
    pokemonId,
    seen: 0,
    hit: 0,
    miss: 0,
    correctStreak: 0,
    lastSeenAt: 0,
  };
}

function isProgressRecord(value: unknown): value is PokemonProgress {
  if (!value || typeof value !== "object") return false;

  const record = value as Partial<PokemonProgress>;
  return (
    Number.isInteger(record.pokemonId) &&
    Number.isInteger(record.seen) &&
    Number.isInteger(record.hit) &&
    Number.isInteger(record.miss) &&
    Number.isInteger(record.correctStreak) &&
    (record.seen ?? -1) >= 0 &&
    (record.hit ?? -1) >= 0 &&
    (record.miss ?? -1) >= 0 &&
    (record.correctStreak ?? -1) >= 0 &&
    typeof record.lastSeenAt === "number" &&
    Number.isFinite(record.lastSeenAt)
  );
}

function parseRecords(value: unknown): PokemonProgressRecords {
  if (!value || typeof value !== "object") return emptyRecords();

  const stored = value as Partial<StoredPokemonProgress>;
  if (stored.version !== PROGRESS_VERSION || !stored.records || typeof stored.records !== "object") {
    return emptyRecords();
  }

  return Object.values(stored.records).reduce<PokemonProgressRecords>((records, record) => {
    if (!isProgressRecord(record) || record.pokemonId <= 0) return records;

    records[record.pokemonId] = record;
    return records;
  }, {});
}

function readStorageValue() {
  try {
    const storage = globalThis.localStorage;
    if (!storage) return null;
    return storage.getItem(PROGRESS_KEY);
  } catch {
    return null;
  }
}

function writeStorageValue(value: StoredPokemonProgress) {
  try {
    const storage = globalThis.localStorage;
    if (!storage) return;
    storage.setItem(PROGRESS_KEY, JSON.stringify(value));
  } catch {
    // Browsers may block storage in restrictive privacy modes.
  }
}

export function updatePokemonProgress(
  records: PokemonProgressRecords,
  pokemonId: number,
  outcome: PokemonRoundOutcome,
  seenAt = Date.now(),
) {
  const previous = records[pokemonId] ?? createRecord(pokemonId);
  const isHit = outcome === "hit";

  return {
    ...records,
    [pokemonId]: {
      pokemonId,
      seen: previous.seen + 1,
      hit: previous.hit + (isHit ? 1 : 0),
      miss: previous.miss + (isHit ? 0 : 1),
      correctStreak: isHit ? previous.correctStreak + 1 : 0,
      lastSeenAt: seenAt,
    },
  };
}

export function loadPokemonProgress() {
  const storedValue = readStorageValue();
  if (!storedValue) return emptyRecords();

  try {
    return parseRecords(JSON.parse(storedValue));
  } catch {
    return emptyRecords();
  }
}

export function recordPokemonRound(pokemonId: number, outcome: PokemonRoundOutcome) {
  if (!Number.isInteger(pokemonId) || pokemonId <= 0) return loadPokemonProgress();

  const records = updatePokemonProgress(loadPokemonProgress(), pokemonId, outcome);
  writeStorageValue({
    version: PROGRESS_VERSION,
    records,
  });
  return records;
}
