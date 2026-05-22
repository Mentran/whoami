import type { BgmTrack } from "../hooks/useBgm";

type MusicControlsProps = {
  enabled: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onToggle: () => void;
  onVolumeChange: (volume: number) => void;
  track: BgmTrack;
  volume: number;
};

export function MusicControls({
  enabled,
  onNext,
  onPrevious,
  onToggle,
  onVolumeChange,
  track,
  volume,
}: MusicControlsProps) {
  return (
    <div className="music-controls" aria-label="背景音乐控制">
      <button aria-label="上一首背景音乐" disabled={!enabled} onClick={onPrevious} title="上一首背景音乐" type="button">
        ◀
      </button>
      <button
        aria-label={enabled ? "关闭背景音乐" : "开启背景音乐"}
        className="music-toggle"
        onClick={onToggle}
        onPointerDown={(event) => event.stopPropagation()}
        title={enabled ? "关闭背景音乐" : "开启背景音乐"}
        type="button"
      >
        {enabled ? "BGM" : "BGM×"}
      </button>
      <button aria-label="下一首背景音乐" disabled={!enabled} onClick={onNext} title="下一首背景音乐" type="button">
        ▶
      </button>
      <span title={track.name}>{track.name}</span>
      <input
        aria-label="背景音乐音量"
        disabled={!enabled}
        max="1"
        min="0"
        onChange={(event) => onVolumeChange(Number(event.target.value))}
        step="0.05"
        type="range"
        value={volume}
      />
    </div>
  );
}
