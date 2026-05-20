import { mkdir, stat, writeFile } from "node:fs/promises";

const MAX_POKEMON = Number(process.env.POKEMON_MAX || process.argv[2] || 386);
const ARTWORK_DIR = "public/pokemon-artwork";

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
  25: ["比卡丘", "比卡超", "皮卡", "pikachu"],
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
  157: ["火爆兽"],
  196: ["太阳精灵", "光伊布"],
  197: ["月精灵", "黑伊布"],
  212: ["钢铁螳螂"],
  214: ["赫拉"],
  242: ["快乐蛋"],
  248: ["班吉拉", "班基拉"],
  249: ["路基亚", "露琪亚"],
  250: ["凤凰", "凤皇"],
  251: ["雪拉比"],
  258: ["水跳鱼"],
  282: ["沙奈多", "超能女皇"],
  287: ["懒人翁"],
  289: ["懒惰王"],
  306: ["波士多可拉"],
  350: ["美丽龙", "米纳斯"],
  373: ["血翼飞龙"],
  376: ["合金十字"],
  380: ["拉提亚斯", "拉迪亚斯"],
  381: ["拉提欧斯", "拉迪欧斯"],
  382: ["盖欧加", "海皇牙"],
  383: ["古拉顿", "古拉多"],
  384: ["裂空座", "裂空坐"],
  385: ["吉拉祈"],
  386: ["迪奥西斯", "代欧西奇斯"],
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

async function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchWithRetry(url, retries = 4) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
      return response;
    } catch (error) {
      lastError = error;
      await wait(600 * (attempt + 1));
    }
  }

  throw lastError;
}

async function fileExists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function downloadArtwork(id, retries = 4) {
  const target = `${ARTWORK_DIR}/${id}.png`;
  if (await fileExists(target)) return;

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchWithRetry(
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
      );
      const bytes = Buffer.from(await response.arrayBuffer());
      await writeFile(target, bytes);
      return;
    } catch (error) {
      lastError = error;
      await wait(900 * (attempt + 1));
    }
  }

  throw lastError;
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

const ids = Array.from({ length: MAX_POKEMON }, (_, index) => index + 1);
const pokemon = await runPool(ids, 6, fetchSpecies);

const content = `export type Pokemon = {
  id: number;
  zh: string;
  en: string;
  aliases: string[];
};

export const pokemonList: Pokemon[] = ${JSON.stringify(pokemon, null, 2)};

export function artworkUrl(id: number) {
  return \`/pokemon-artwork/\${id}.png\`;
}
`;

await mkdir(ARTWORK_DIR, { recursive: true });
await writeFile("src/data/pokemon.ts", content);
await runPool(ids, 4, downloadArtwork);
console.log(`Wrote ${pokemon.length} Pokemon.`);
