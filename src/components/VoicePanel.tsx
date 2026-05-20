type VoicePanelProps = {
  activated: boolean;
  error: string;
  interimText: string;
  lastHeard: string;
  listening: boolean;
  phaseLabel: string;
  permissionState: PermissionState;
  supported: boolean;
  title?: string;
};

export function VoicePanel({
  activated,
  error,
  interimText,
  lastHeard,
  listening,
  phaseLabel,
  permissionState,
  supported,
  title,
}: VoicePanelProps) {
  const displayText = error
    ? error === "麦克风权限被拒绝"
      ? "麦克风权限被拒绝。请在 Chrome 地址栏和系统设置里允许麦克风，然后刷新页面。"
      : `${error}，请检查浏览器权限后再点开始。`
    : !supported
      ? "当前浏览器不支持语音识别，请使用最新版 Chrome 或 Edge。"
      : !activated && permissionState !== "granted"
        ? "点击开始后会请求麦克风权限，请选择允许。"
        : interimText || lastHeard || phaseLabel;
  const statusTitle =
    title ||
    (error || permissionState === "denied"
      ? "麦克风不可用"
      : supported
        ? listening
          ? "正在听你说..."
          : activated || permissionState === "granted"
            ? "等待语音"
            : "等待授权"
        : "语音不可用");

  return (
    <section className={listening ? "voice-panel listening" : "voice-panel"} aria-label="语音输入状态">
      <div className="voice-orb" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="voice-copy">
        <strong>{statusTitle}</strong>
        <p className={error || permissionState === "denied" ? "error" : ""}>{displayText}</p>
      </div>
    </section>
  );
}
