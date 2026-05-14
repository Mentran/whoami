import type { FormEvent } from "react";

type AnswerBoxProps = {
  disabled: boolean;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onNext: () => void;
  revealed: boolean;
};

export function AnswerBox({
  disabled,
  value,
  onChange,
  onSubmit,
  onNext,
  revealed,
}: AnswerBoxProps) {
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
        aria-label="输入宝可梦名字"
        autoComplete="off"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={revealed ? "按 Enter 进入下一题" : "输入中文名或英文名"}
        value={value}
      />
      <button type="submit">{revealed ? "NEXT" : "GUESS"}</button>
    </form>
  );
}

