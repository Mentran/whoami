export type PokedexEntry = {
  category: string;
  intro: string;
  trivia: string;
  types: string[];
};

const fallbackTypes = ["未知"];

export const pokedex: Record<number, PokedexEntry> = {
  1: {
    category: "种子宝可梦",
    intro: "背上的种子会和身体一起成长，储存能量后能释放草属性招式。",
    trivia: "经典初代御三家之一，剪影很容易被背上的种子认出来。",
    types: ["草", "毒"],
  },
  4: {
    category: "蜥蜴宝可梦",
    intro: "尾巴上的火焰代表生命力，情绪高涨时火焰会燃得更旺。",
    trivia: "进化后的喷火龙是最具代表性的初代宝可梦之一。",
    types: ["火"],
  },
  7: {
    category: "小龟宝可梦",
    intro: "遇到危险时会缩进壳里，再用水枪反击。",
    trivia: "杰尼龟小队让它在动画观众心里很有存在感。",
    types: ["水"],
  },
  25: {
    category: "鼠宝可梦",
    intro: "脸颊两侧有储电囊，紧张或兴奋时会放出电流。",
    trivia: "动画中最经典的伙伴型宝可梦，也是这类猜影子游戏的灵魂角色。",
    types: ["电"],
  },
  39: {
    category: "气球宝可梦",
    intro: "会用大大的眼睛吸引对手，然后唱出让人睡着的歌。",
    trivia: "动画里常因为听众睡着而生气涂鸦。",
    types: ["一般", "妖精"],
  },
  52: {
    category: "妖怪猫宝可梦",
    intro: "喜欢圆形闪亮物，额头上的金币是它的标志。",
    trivia: "火箭队的喵喵因为会说人话，记忆点非常强。",
    types: ["一般"],
  },
  54: {
    category: "鸭宝可梦",
    intro: "经常头痛，头痛加剧时会突然释放神秘力量。",
    trivia: "可达鸭的呆萌表情是动画名场面常客。",
    types: ["水"],
  },
  94: {
    category: "影子宝可梦",
    intro: "喜欢躲在影子里，会用诡异的笑容吓唬对手。",
    trivia: "耿鬼的剪影轮廓非常适合这个游戏。",
    types: ["幽灵", "毒"],
  },
  129: {
    category: "鱼宝可梦",
    intro: "战斗力很弱，但生命力顽强，进化后会变成强大的暴鲤龙。",
    trivia: "弱小到强大的反差，是鲤鱼王最经典的魅力。",
    types: ["水"],
  },
  130: {
    category: "凶恶宝可梦",
    intro: "由鲤鱼王进化而来，性情暴躁，拥有强大的破坏力。",
    trivia: "从鲤鱼王到暴鲤龙，是初代最有戏剧性的进化之一。",
    types: ["水", "飞行"],
  },
  131: {
    category: "乘载宝可梦",
    intro: "性格温和，喜欢载着人渡海，能理解人类语言。",
    trivia: "中文玩家常用旧译“乘龙”称呼它。",
    types: ["水", "冰"],
  },
  132: {
    category: "变身宝可梦",
    intro: "能重组身体细胞，变成看到的对手。",
    trivia: "百变怪的剪影通常很有迷惑性。",
    types: ["一般"],
  },
  133: {
    category: "进化宝可梦",
    intro: "基因非常不稳定，能根据环境进化成不同形态。",
    trivia: "伊布家族是宝可梦系列中最受欢迎的分支之一。",
    types: ["一般"],
  },
  143: {
    category: "瞌睡宝可梦",
    intro: "每天大部分时间都在睡觉，醒来后会大量进食。",
    trivia: "卡比兽的轮廓极其鲜明，是剪影题里的经典送分题。",
    types: ["一般"],
  },
  144: {
    category: "冰冻宝可梦",
    intro: "传说中的鸟宝可梦，翅膀拍动时会制造寒气。",
    trivia: "初代三圣鸟之一。",
    types: ["冰", "飞行"],
  },
  145: {
    category: "电击宝可梦",
    intro: "传说中的鸟宝可梦，飞行时会伴随雷鸣。",
    trivia: "初代三圣鸟之一，尖锐羽毛让剪影很有辨识度。",
    types: ["电", "飞行"],
  },
  146: {
    category: "火焰宝可梦",
    intro: "传说中的鸟宝可梦，翅膀燃烧着火焰般的光芒。",
    trivia: "初代三圣鸟之一。",
    types: ["火", "飞行"],
  },
  149: {
    category: "龙宝可梦",
    intro: "外表温和但力量强大，能高速飞越大海。",
    trivia: "中文玩家常用“快肥”作为亲昵称呼。",
    types: ["龙", "飞行"],
  },
  150: {
    category: "基因宝可梦",
    intro: "由梦幻的基因制造而来，拥有极强的精神力量。",
    trivia: "超梦是初代最具压迫感的传说宝可梦之一。",
    types: ["超能力"],
  },
  151: {
    category: "新种宝可梦",
    intro: "据说拥有所有宝可梦的基因，能学会各种招式。",
    trivia: "梦幻在初代传说中带着很强的神秘色彩。",
    types: ["超能力"],
  },
};

export function getPokedexEntry(id: number, name: string): PokedexEntry {
  return (
    pokedex[id] || {
      category: "第一世代宝可梦",
      intro: `${name} 是关都地区图鉴编号 #${String(id).padStart(3, "0")} 的宝可梦。`,
      trivia: "它来自最经典的第一世代题库，适合用剪影来考验记忆。",
      types: fallbackTypes,
    }
  );
}

