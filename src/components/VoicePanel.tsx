type VoicePanelProps = {
  error: string;
  interimText: string;
  lastHeard: string;
  listening: boolean;
  phaseLabel: string;
  supported: boolean;
  title?: string;
};

export function VoicePanel({ error, interimText, lastHeard, listening, phaseLabel, supported, title }: VoicePanelProps) {
  const displayText = error
    ? error === "麦克风权限被拒绝"
      ? "麦克风权限被拒绝。请点地址栏麦克风图标，改为允许后刷新页面。"
      : `${error}，请检查浏览器权限后再点开始。`
    : interimText || lastHeard || phaseLabel;
  const statusTitle = title || (error ? "麦克风不可用" : supported ? (listening ? "正在听你说..." : "等待语音") : "语音不可用");

  return (
    <section className={listening ? "voice-panel listening" : "voice-panel"} aria-label="语音输入状态">
      <div className="voice-orb" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="voice-copy">
        <strong>{statusTitle}</strong>
        <p className={error ? "error" : ""}>{supported ? displayText : "当前浏览器不支持语音识别，请使用最新版 Chrome 或 Edge。"}</p>
      </div>
    </section>
  );
}
