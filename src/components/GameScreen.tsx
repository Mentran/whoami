import { artworkUrl, type Pokemon } from "../data/pokemon";

type GameScreenProps = {
  pokemon: Pokemon;
  revealed: boolean;
  feedback: string;
  phase: string;
};

export function GameScreen({ pokemon, revealed, feedback, phase }: GameScreenProps) {
  return (
    <div className={`game-screen phase-${phase}`}>
      <div className="silhouette-card">
        <img
          alt={revealed ? pokemon.zh : "神秘宝可梦黑影"}
          className={revealed ? "pokemon-art revealed" : "pokemon-art hidden"}
          draggable="false"
          src={artworkUrl(pokemon.id)}
        />
      </div>

      <div className="prompt-panel">
        <p className="question">{revealed ? "就是它！" : "我是谁？"}</p>
        <div className="power-meter" aria-hidden="true">
          <span />
        </div>
        <p className="feedback">{feedback}</p>
        <p className="brand">POCKET<br />MONSTERS</p>
      </div>
    </div>
  );
}

