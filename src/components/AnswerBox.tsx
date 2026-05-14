import { useEffect, useRef, type FormEvent } from "react";

type AnswerBoxProps = {
  disabled: boolean;
  speechError: string;
  speechInterimText: string;
  speechListening: boolean;
  speechSupported: boolean;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onNext: () => void;
  onVoiceStart: () => void;
  onVoiceStop: () => void;
  revealed: boolean;
};

export function AnswerBox({
  disabled,
  speechError,
  speechInterimText,
  speechListening,
  speechSupported,
  value,
  onChange,
  onSubmit,
  onNext,
  onVoiceStart,
  onVoiceStop,
  revealed,
}: AnswerBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonLabel = revealed ? "NEXT" : disabled ? "WAIT" : "GUESS";

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (revealed) {
      onNext();
      return;
    }
    onSubmit();
  }

  return (
    <form className="answer-box" onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        aria-label="输入宝可梦名字"
        autoComplete="off"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={disabled && !revealed ? "等待信号..." : revealed ? "按 Enter 进入下一题" : "输入中文名或英文名"}
        value={value}
      />
      <button disabled={disabled && !revealed} type="submit">
        {buttonLabel}
      </button>
      {speechSupported && (
        <button
          aria-label={speechListening ? "停止语音输入" : "开始语音输入"}
          className={speechListening ? "voice-button listening" : "voice-button"}
          disabled={disabled && !speechListening}
          onClick={speechListening ? onVoiceStop : onVoiceStart}
          type="button"
        >
          {speechListening ? "LISTEN" : "MIC"}
        </button>
      )}
      {(speechInterimText || speechError) && (
        <div className={speechError ? "speech-hint error" : "speech-hint"}>
          {speechError || speechInterimText}
        </div>
      )}
    </form>
  );
}
