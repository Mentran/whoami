import { useEffect, useRef, useState } from "react";
import { artworkUrl, pokemonList, type Pokemon } from "../data/pokemon";

const IDLE_SWITCH_MS = 5000;

function pickIdlePokemon(previousId?: number) {
  if (pokemonList.length === 1) return pokemonList[0];

  let next = pokemonList[Math.floor(Math.random() * pokemonList.length)];
  while (next.id === previousId) {
    next = pokemonList[Math.floor(Math.random() * pokemonList.length)];
  }
  return next;
}

export function IdleSilhouette() {
  const [pokemon, setPokemon] = useState<Pokemon>(() => pickIdlePokemon());
  const previousId = useRef(pokemon.id);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = pickIdlePokemon(previousId.current);
      previousId.current = next.id;
      setPokemon(next);
    }, IDLE_SWITCH_MS);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="idle-silhouette" aria-hidden="true">
      <div className="idle-silhouette-stage">
        <img alt="" className="idle-silhouette-art" draggable="false" key={pokemon.id} src={artworkUrl(pokemon.id)} />
      </div>
    </div>
  );
}
