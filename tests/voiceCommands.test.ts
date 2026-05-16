import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractVoiceAnswer, parseVoiceCommand } from "../src/utils/voiceCommands.ts";

describe("voice commands", () => {
  it("parses navigation and intro commands", () => {
    assert.equal(parseVoiceCommand("下一题"), "next");
    assert.equal(parseVoiceCommand("next"), "next");
    assert.equal(parseVoiceCommand("跳过这一题"), "skip");
    assert.equal(parseVoiceCommand("介绍一下"), "intro");
    assert.equal(parseVoiceCommand("详细资料"), "intro");
  });

  it("parses session and sound commands", () => {
    assert.equal(parseVoiceCommand("重新开始"), "restart");
    assert.equal(parseVoiceCommand("再来一局"), "restart");
    assert.equal(parseVoiceCommand("静音"), "mute");
    assert.equal(parseVoiceCommand("打开声音"), "unmute");
  });

  it("extracts answers from natural speech", () => {
    assert.equal(extractVoiceAnswer("我猜是 皮卡丘！"), "皮卡丘");
    assert.equal(extractVoiceAnswer("答案是，喷火龙。"), "喷火龙");
    assert.equal(extractVoiceAnswer("是不是 杰尼龟?"), "杰尼龟");
  });

  it("does not mistake normal answers for commands", () => {
    assert.equal(parseVoiceCommand("皮卡丘"), null);
    assert.equal(parseVoiceCommand("妙蛙种子"), null);
  });
});
