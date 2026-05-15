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
  const displayText = error || interimText || lastHeard || phaseLabel;
  const statusTitle = title || (supported ? (listening ? "正在听你说..." : "等待语音") : "语音不可用");

  return (
    <section className={listening ? "voice-panel listening" : "voice-panel"} aria-label="语音输入状态">
      <div className="voice-orb" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="voice-copy">
        <strong>{statusTitle}</strong>
        <p className={error ? "error" : ""}>{supported ? displayText : "当前浏览器不支持语音识别"}</p>
      </div>
    </section>
  );
}
