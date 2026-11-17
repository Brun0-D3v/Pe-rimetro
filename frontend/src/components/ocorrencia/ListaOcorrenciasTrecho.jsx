import { useOcorrenciasDoTrecho } from "../../hooks/useOcorrenciasDoTrecho";
import Button from "../ui/Button";
import FotoOcorrencia from "./FotoOcorrencia";

// Nunca exibe o autor: a API pública não o envia e a lista não o lê.
export default function ListaOcorrenciasTrecho({ trechoId, versao }) {
  const { itens, total, carregando, erro, temMais, carregarMais, tentarNovamente } = useOcorrenciasDoTrecho(
    trechoId,
    versao
  );

  return (
    <section className="mt-4" aria-label="Problemas reportados">
      <h3 className="text-sm font-semibold text-texto">Problemas reportados ({total})</h3>

      {erro && (
        <div className="mt-2 flex flex-col items-start gap-2">
          <p className="text-sm text-texto-mute">Não foi possível carregar os problemas reportados.</p>
          <Button variante="secundario" onClick={tentarNovamente}>
            Tentar de novo
          </Button>
        </div>
      )}

      {!erro && !carregando && itens.length === 0 && (
        <p className="mt-2 text-sm text-texto-mute">Nenhum problema reportado neste trecho.</p>
      )}

      {itens.length > 0 && (
        <ul className="mt-2 flex max-h-64 flex-col gap-3 overflow-y-auto">
          {itens.map((item) => (
            <li key={item.id} className="rounded-lg border border-base-4 p-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-texto">{item.categoria.nome}</span>
                <span className="text-xs text-texto-mute">{new Date(item.criadoEm).toLocaleDateString("pt-BR")}</span>
              </div>
              {item.descricao && <p className="mt-1 text-sm text-texto">{item.descricao}</p>}
              {item.fotos?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.fotos.map((foto) => (
                    <FotoOcorrencia key={foto.id} fotoId={foto.id} categoria={item.categoria.nome} />
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {carregando && <p className="mt-2 text-sm text-texto-mute">Carregando...</p>}

      {temMais && !carregando && (
        <Button variante="secundario" className="mt-2" onClick={carregarMais}>
          Carregar mais
        </Button>
      )}
    </section>
  );
}
