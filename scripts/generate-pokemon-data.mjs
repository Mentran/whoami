import { writeFile } from "node:fs/promises";

const aliases = {
  1: ["妙蛙", "种子", "蒜头王八", "奇异种子"],
  2: ["奇异草"],
  3: ["奇异花"],
  4: ["火龙", "小火"],
  5: ["火恐龍"],
  6: ["老喷", "喷火", "火龙"],
  7: ["车厘龟", "水龟"],
  8: ["卡米龟"],
  9: ["水龟"],
  10: ["毛毛虫"],
  12: ["蝴蝶"],
  16: ["比比鸟前身"],
  17: ["比比鸟"],
  18: ["大比鸟", "大比雕"],
  19: ["小拉达"],
  20: ["拉达"],
  21: ["烈雀"],
  22: ["大嘴雀"],
  23: ["阿柏蛇"],
  24: ["阿柏怪"],
  25: ["比卡丘", "皮卡", "pikachu"],
  26: ["雷丘"],
  27: ["穿山鼠"],
  28: ["穿山王"],
  29: ["尼多兰"],
  32: ["尼多朗"],
  35: ["皮皮"],
  36: ["皮可西"],
  37: ["小狐狸"],
  38: ["狐狸"],
  39: ["布丁", "胖可丁前身"],
  41: ["蝙蝠"],
  42: ["大蝙蝠"],
  43: ["走路草"],
  44: ["臭臭花"],
  45: ["霸王花"],
  46: ["蘑菇虫"],
  47: ["派拉斯特"],
  48: ["毛球"],
  49: ["末入蛾"],
  50: ["地鼠"],
  51: ["三地鼠"],
  52: ["火箭队喵喵", "喵"],
  53: ["猫老大"],
  54: ["呆鸭", "头疼鸭"],
  55: ["哥达鸭"],
  56: ["猴怪"],
  57: ["火爆猴"],
  58: ["风速狗前身"],
  59: ["风速狗"],
  60: ["蚊香蝌蚪"],
  61: ["蚊香蛙"],
  62: ["快泳蛙"],
  63: ["凯西"],
  64: ["勇吉拉"],
  65: ["胡地"],
  66: ["腕力"],
  67: ["豪力"],
  68: ["怪力"],
  69: ["喇叭芽"],
  70: ["口呆花"],
  71: ["大食花"],
  72: ["玛瑙水母"],
  73: ["毒刺水母"],
  74: ["拳石"],
  75: ["隆隆石"],
  76: ["隆隆岩"],
  77: ["小火马"],
  78: ["烈焰马"],
  79: ["呆兽", "慢呆呆"],
  80: ["呆河马"],
  81: ["磁怪"],
  82: ["三合一磁怪"],
  83: ["大葱鸭"],
  84: ["嘟嘟"],
  85: ["嘟嘟利"],
  86: ["小海狮"],
  87: ["白海狮"],
  88: ["臭泥"],
  89: ["臭臭泥"],
  90: ["大舌贝"],
  91: ["铁甲贝"],
  92: ["瓦斯", "鬼斯通前身"],
  93: ["鬼斯通"],
  94: ["耿鬼"],
  95: ["大岩石", "岩蛇"],
  96: ["素利普"],
  97: ["素利柏"],
  98: ["大钳蟹"],
  99: ["巨钳蟹"],
  100: ["雷电球"],
  101: ["顽皮弹"],
  102: ["蛋蛋"],
  103: ["椰蛋树"],
  104: ["孤独宝可梦"],
  105: ["嘎啦嘎啦"],
  106: ["沙瓦郎"],
  107: ["艾比郎"],
  108: ["大舌头"],
  109: ["瓦斯弹"],
  110: ["双弹瓦斯"],
  111: ["铁甲犀牛"],
  112: ["铁甲暴龙"],
  113: ["幸运蛋"],
  114: ["蔓藤怪"],
  115: ["袋龙"],
  116: ["墨海马"],
  117: ["海刺龙"],
  118: ["角金鱼"],
  119: ["金鱼王"],
  120: ["海星星"],
  121: ["宝石海星"],
  122: ["吸盘魔偶"],
  123: ["飞天螳螂"],
  124: ["迷唇姐"],
  125: ["电击兽"],
  126: ["鸭嘴火龙"],
  127: ["大甲"],
  128: ["肯泰罗"],
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
