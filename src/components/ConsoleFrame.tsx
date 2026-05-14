import type { ReactNode } from "react";

type ConsoleFrameProps = {
  children: ReactNode;
  controls: ReactNode;
  score: ReactNode;
  status: string;
};

export function ConsoleFrame({ children, controls, score, status }: ConsoleFrameProps) {
  return (
    <section className="console" aria-label="我是谁游戏机">
      <div className="console-top">
        <span className="camera" />
        <span className="led red" />
        <span className="led yellow" />
        <span className="led green" />
      </div>

      <div className="screen-bezel">
        <div className="speaker-dots" aria-hidden="true">
          <span />
          <span />
        </div>
        {children}
      </div>

      <div className="console-controls">
        <div className="dpad" aria-hidden="true">
          <span className="up" />
          <span className="right" />
          <span className="down" />
          <span className="left" />
          <span className="center" />
        </div>
        {score}
        <div className="button-cluster">{controls}</div>
      </div>

      <div className="status-bar">{status}</div>
    </section>
  );
}

