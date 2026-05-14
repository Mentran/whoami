import { writeFile } from "node:fs/promises";

const aliases = {
  1: ["妙蛙", "种子", "蒜头王八"],
  4: ["火龙", "小火"],
  6: ["老喷", "喷火", "火龙"],
  7: ["车厘龟", "水龟"],
  9: ["水龟"],
  10: ["毛毛虫"],
  12: ["蝴蝶"],
  16: ["比比鸟前身"],
  25: ["比卡丘", "皮卡", "pikachu"],
  37: ["小狐狸"],
  38: ["狐狸"],
  39: ["布丁", "胖可丁前身"],
  41: ["蝙蝠"],
  42: ["大蝙蝠"],
  52: ["火箭队喵喵", "喵"],
  54: ["呆鸭", "头疼鸭"],
  58: ["风速狗前身"],
  74: ["拳石"],
  79: ["呆兽", "慢呆呆"],
  81: ["磁怪"],
  92: ["瓦斯", "鬼斯通前身"],
  95: ["大岩石", "岩蛇"],
  104: ["孤独宝可梦"],
  113: ["幸运蛋"],
  129: ["鱼王", "鲤鱼"],
  130: ["暴鲤"],
  131: ["乘龙"],
  132: ["变身怪"],
  133: ["伊布布"],
  134: ["水精灵", "水布"],
  135: ["雷精灵", "雷布"],
  136: ["火精灵", "火布"],
  143: ["睡觉王", "卡比"],
  144: ["冰冻鸟", "冰鸟"],
  145: ["雷鸟"],
  146: ["火鸟"],
  147: ["迷你"],
  149: ["快肥"],
  150: ["梦二"],
  151: ["梦梦"],
};

function getName(names, language) {
  return names.find((entry) => entry.language.name === language)?.name;
}

async function fetchSpecies(id) {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
  if (!response.ok) throw new Error(`Failed to fetch species ${id}: ${response.status}`);

  const species = await response.json();
  const zh = getName(species.names, "zh-hans") || getName(species.names, "zh-hant");
  const zhHant = getName(species.names, "zh-hant");
  const en = getName(species.names, "en")?.toLowerCase();
  const aliasList = [...(aliases[id] || [])];

  if (zhHant && zhHant !== zh) aliasList.push(zhHant);
  if (!zh || !en) throw new Error(`Missing required name for species ${id}`);

  return {
    id,
    zh,
    en,
    aliases: [...new Set(aliasList)],
  };
}

const pokemon = [];

for (let id = 1; id <= 151; id += 1) {
  pokemon.push(await fetchSpecies(id));
}

const content = `export type Pokemon = {
  id: number;
  zh: string;
  en: string;
  aliases: string[];
};

export const pokemonList: Pokemon[] = ${JSON.stringify(pokemon, null, 2)};

export function artworkUrl(id: number) {
  return \`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/\${id}.png\`;
}
`;

await writeFile("src/data/pokemon.ts", content);
console.log(`Wrote ${pokemon.length} Pokemon.`);
