import { ChevronLeft, ChevronRight } from "lucide-react";

export default function PainelFiltros({
  recolhido,
  aoAlternarRecolhido,
  regioes,
  regiaoSelecionadaId,
  aoSelecionarRegiao,
  mostrarInativos,
  aoAlternarMostrarInativos,
  camadaDemoVisivel,
  aoAlternarCamadaDemo,
}) {
  return (
    <aside
      className={[
        "absolute left-4 top-20 z-[1000] flex flex-col gap-4 rounded-2xl border border-base-4 bg-base-3 p-4 shadow-sm transition-[width] duration-base ease-reveal",
        recolhido ? "w-12 overflow-hidden" : "w-64",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={aoAlternarRecolhido}
        aria-label={recolhido ? "Expandir painel de filtros" : "Recolher painel de filtros"}
        title={recolhido ? "Expandir painel de filtros" : "Recolher painel de filtros"}
        className="flex h-8 w-8 items-center justify-center self-end rounded-lg text-texto-mute hover:bg-hover-surface hover:text-texto"
      >
        {recolhido ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {!recolhido && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="filtro-regiao" className="text-xs font-semibold uppercase tracking-wide text-texto-mute">
              Região
            </label>
            <select
              id="filtro-regiao"
              value={regiaoSelecionadaId ?? ""}
              onChange={(evento) => aoSelecionarRegiao(evento.target.value || null)}
              className="rounded-lg border border-base-4 bg-base-2 px-3 py-2 text-sm text-texto"
            >
              <option value="">Todas as regiões</option>
              {regioes.map((regiao) => (
                <option key={regiao.id} value={regiao.id}>
                  {regiao.nome}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-texto">
            <input type="checkbox" checked={mostrarInativos} onChange={aoAlternarMostrarInativos} />
            Mostrar trechos inativos
          </label>

          <label className="flex items-center gap-2 text-sm text-texto">
            <input type="checkbox" checked={camadaDemoVisivel} onChange={aoAlternarCamadaDemo} />
            Camada de caminhabilidade (demonstração)
          </label>
        </div>
      )}
    </aside>
  );
}
