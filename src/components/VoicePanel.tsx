type VoicePanelProps = {
  error: string;
  interimText: string;
  lastHeard: string;
  listening: boolean;
  phaseLabel: string;
  supported: boolean;
};

export function VoicePanel({ error, interimText, lastHeard, listening, phaseLabel, supported }: VoicePanelProps) {
  const displayText = error || interimText || lastHeard || phaseLabel;

  return (
    <section className={listening ? "voice-panel listening" : "voice-panel"} aria-label="语音输入状态">
      <div className="voice-orb" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="voice-copy">
        <strong>{supported ? (listening ? "LISTENING..." : "VOICE READY") : "VOICE OFF"}</strong>
        <p className={error ? "error" : ""}>{supported ? displayText : "当前浏览器不支持语音识别"}</p>
      </div>
    </section>
  );
}

