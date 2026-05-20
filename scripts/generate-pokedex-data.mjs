import { writeFile } from "node:fs/promises";

const MAX_POKEMON = Number(process.env.POKEMON_MAX || process.argv[2] || 386);

const typeNames = {
  bug: "虫",
  dragon: "龙",
  electric: "电",
  fairy: "妖精",
  fighting: "格斗",
  fire: "火",
  flying: "飞行",
  ghost: "幽灵",
  grass: "草",
  ground: "地面",
  ice: "冰",
  normal: "一般",
  poison: "毒",
  psychic: "超能力",
  rock: "岩石",
  water: "水",
};

function cleanText(text) {
  return text.replace(/\s+/g, "").replace(/\u000c/g, "");
}

function findLocalizedName(entries, language) {
  return entries.find((entry) => entry.language.name === language);
}

function getFlavorTexts(species) {
  const entries = species.flavor_text_entries
    .filter((entry) => entry.language.name === "zh-hans")
    .map((entry) => cleanText(entry.flavor_text));

  return [...new Set(entries)];
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchJson(url, retries = 4) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      await wait(700 * (attempt + 1));
    }
  }

  throw lastError;
}

async function fetchPokedexEntry(id) {
  const [species, pokemon] = await Promise.all([
    fetchJson(`https://pokeapi.co/api/v2/pokemon-species/${id}`),
    fetchJson(`https://pokeapi.co/api/v2/pokemon/${id}`),
  ]);

  const zhName = findLocalizedName(species.names, "zh-hans")?.name;
  const category = findLocalizedName(species.genera, "zh-hans")?.genus || "宝可梦";
  const flavors = getFlavorTexts(species);
  const types = pokemon.types.map((slot) => typeNames[slot.type.name] || slot.type.name);

  if (!zhName) throw new Error(`Missing zh-hans name for #${id}`);

  return {
    id,
    name: zhName,
    entry: {
      category,
      intro: flavors[0] || `${zhName} 是全国图鉴编号 #${String(id).padStart(3, "0")} 的宝可梦。`,
      trivia: flavors[1] || flavors[0] || "暂无更多图鉴描述。",
      types,
    },
  };
}

async function runPool(ids, workerCount, worker) {
  const results = [];
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < ids.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await worker(ids[currentIndex]);
      console.log(`Fetched #${String(ids[currentIndex]).padStart(3, "0")}`);
    }
  }

  await Promise.all(Array.from({ length: workerCount }, runWorker));
  return results;
}

const entries = await runPool(
  Array.from({ length: MAX_POKEMON }, (_, index) => index + 1),
  6,
  fetchPokedexEntry,
);

const pokedexObject = Object.fromEntries(entries.map(({ id, entry }) => [id, entry]));

const content = `export type PokedexEntry = {
  category: string;
  intro: string;
  trivia: string;
  types: string[];
};

export const pokedex: Record<number, PokedexEntry> = ${JSON.stringify(pokedexObject, null, 2)};

export function getPokedexEntry(id: number): PokedexEntry {
  return pokedex[id];
}
`;

await writeFile("src/data/pokedex.ts", content);
console.log(`Wrote ${entries.length} Pokedex entries.`);
