export type VoiceCommand = "next" | "skip" | "intro" | "restart" | "mute" | "unmute";

const commandPatterns: Array<[VoiceCommand, RegExp]> = [
  ["next", /(下一题|下一个|下一個|继续|繼續|next)/i],
  ["skip", /(跳过|跳過|pass|skip)/i],
  ["intro", /(介绍|介紹|详细|詳細|百科|讲一下|說一下|说一下|资料|資料)/i],
  ["restart", /(重新开始|重新開始|再来一局|再來一局|restart)/i],
  ["mute", /(静音|靜音|关闭声音|關閉聲音|mute)/i],
  ["unmute", /(打开声音|開啟聲音|开启声音|取消静音|取消靜音|sound)/i],
];

const answerPrefixes = [
  "我猜是",
  "我觉得是",
  "我覺得是",
  "答案是",
  "应该是",
  "應該是",
  "是不是",
  "是",
  "猜",
];

export function parseVoiceCommand(text: string): VoiceCommand | null {
  const normalized = text.trim();
  return commandPatterns.find(([, pattern]) => pattern.test(normalized))?.[0] || null;
}

export function extractVoiceAnswer(text: string) {
  let answer = text.trim().replace(/[，。！？!?.,\s]/g, "");

  for (const prefix of answerPrefixes) {
    if (answer.startsWith(prefix)) {
      answer = answer.slice(prefix.length);
      break;
    }
  }

  return answer;
}

