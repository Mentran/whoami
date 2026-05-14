import { AnswerBox } from "./components/AnswerBox";
import { ConsoleFrame } from "./components/ConsoleFrame";
import { GameScreen } from "./components/GameScreen";
import { ScoreDisplay } from "./components/ScoreDisplay";
import { pokemonList } from "./data/pokemon";
import { usePokemonGame } from "./hooks/usePokemonGame";

export default function App() {
  const game = usePokemonGame(pokemonList);

  return (
    <main className="app-shell">
      <ConsoleFrame
        controls={
          <>
            <button className="round-button" onClick={game.skip} type="button">
              B
            </button>
            <button className="round-button primary" onClick={game.next} type="button">
              A
            </button>
          </>
        }
        score={<ScoreDisplay hit={game.hit} total={game.total} best={game.best} />}
        status={game.status}
      >
        <GameScreen
          pokemon={game.current}
          revealed={game.revealed}
          feedback={game.feedback}
          phase={game.phase}
        />
        <AnswerBox
          disabled={game.revealed}
          value={game.answer}
          onChange={game.setAnswer}
          onSubmit={game.submit}
          onNext={game.next}
          revealed={game.revealed}
        />
      </ConsoleFrame>
    </main>
  );
}

