export type Pokemon = {
  id: number;
  zh: string;
  en: string;
  aliases: string[];
};

export const pokemonList: Pokemon[] = [
  { id: 1, zh: "妙蛙种子", en: "bulbasaur", aliases: ["妙蛙", "种子", "蒜头王八"] },
  { id: 4, zh: "小火龙", en: "charmander", aliases: ["火龙", "小火"] },
  { id: 7, zh: "杰尼龟", en: "squirtle", aliases: ["车厘龟", "水龟"] },
  { id: 10, zh: "绿毛虫", en: "caterpie", aliases: ["毛毛虫"] },
  { id: 16, zh: "波波", en: "pidgey", aliases: ["比比鸟前身"] },
  { id: 25, zh: "皮卡丘", en: "pikachu", aliases: ["比卡丘", "皮卡", "pikachu"] },
  { id: 39, zh: "胖丁", en: "jigglypuff", aliases: ["布丁", "胖可丁前身"] },
  { id: 52, zh: "喵喵", en: "meowth", aliases: ["火箭队喵喵", "喵"] },
  { id: 54, zh: "可达鸭", en: "psyduck", aliases: ["呆鸭", "头疼鸭"] },
  { id: 58, zh: "卡蒂狗", en: "growlithe", aliases: ["风速狗前身"] },
  { id: 74, zh: "小拳石", en: "geodude", aliases: ["拳石"] },
  { id: 79, zh: "呆呆兽", en: "slowpoke", aliases: ["呆兽", "慢呆呆"] },
  { id: 81, zh: "小磁怪", en: "magnemite", aliases: ["磁怪"] },
  { id: 92, zh: "鬼斯", en: "gastly", aliases: ["瓦斯", "鬼斯通前身"] },
  { id: 95, zh: "大岩蛇", en: "onix", aliases: ["大岩石", "岩蛇"] },
  { id: 104, zh: "卡拉卡拉", en: "cubone", aliases: ["孤独宝可梦"] },
  { id: 113, zh: "吉利蛋", en: "chansey", aliases: ["幸运蛋"] },
  { id: 129, zh: "鲤鱼王", en: "magikarp", aliases: ["鱼王", "鲤鱼"] },
  { id: 133, zh: "伊布", en: "eevee", aliases: ["伊布布"] },
  { id: 143, zh: "卡比兽", en: "snorlax", aliases: ["睡觉王", "卡比"] },
  { id: 150, zh: "超梦", en: "mewtwo", aliases: ["梦二"] },
  { id: 151, zh: "梦幻", en: "mew", aliases: ["梦梦"] },
];

export function artworkUrl(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

