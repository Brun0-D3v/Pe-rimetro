import { Search } from "lucide-react";
import ThemeToggle from "../ThemeToggle";

export default function CabecalhoMapa({ busca, aoMudarBusca, sugestoes, aoSelecionarSugestao }) {
  return (
    <div className="absolute left-4 right-4 top-4 z-[1000] flex items-center gap-3 rounded-2xl border border-base-4 bg-base-3 px-4 py-2.5 shadow-sm">
      <span className="text-sm font-semibold text-texto">Pé-rímetro</span>

      <div className="relative max-w-sm flex-1">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-texto-mute" />
        <input
          type="text"
          value={busca}
          onChange={(evento) => aoMudarBusca(evento.target.value)}
          placeholder="Buscar trecho pelo nome..."
          className="w-full rounded-lg border border-base-4 bg-base-2 py-2 pl-9 pr-3 text-sm text-texto placeholder:text-texto-mute"
        />
        {busca && sugestoes.length > 0 && (
          <ul className="absolute left-0 right-0 top-full z-[1001] mt-1 max-h-48 overflow-auto rounded-lg border border-base-4 bg-base-3 shadow-lg">
            {sugestoes.map((trecho) => (
              <li key={trecho.id}>
                <button
                  type="button"
                  onClick={() => aoSelecionarSugestao(trecho)}
                  className="w-full px-3 py-2 text-left text-sm text-texto hover:bg-hover-surface"
                >
                  {trecho.nome}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ThemeToggle />
    </div>
  );
}
