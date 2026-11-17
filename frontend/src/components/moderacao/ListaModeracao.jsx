import { useState } from "react";
import { useImagemAutenticada } from "../../hooks/useImagemAutenticada";
import { useModeracao } from "../../hooks/useModeracao";
import { alterarVisibilidade } from "../../services/ocorrenciaService";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";

const classeCampo = "w-full rounded-lg border border-base-4 bg-base-2 px-3 py-2 text-sm text-texto";
const classeRotulo = "text-xs font-semibold uppercase tracking-wide text-texto-mute";

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function mensagemDeErro(erro, padrao) {
  return erro?.response?.data?.mensagem ?? padrao;
}

// A foto de ocorrência oculta exige o token do administrador, então é baixada com autenticação.
function Miniatura({ fotoId, categoria }) {
  const { url, erro } = useImagemAutenticada(fotoId);
  if (erro) {
    return (
      <span className="flex h-20 w-20 items-center justify-center rounded-lg border border-base-4 text-center text-[10px] text-texto-mute">
        Sem foto
      </span>
    );
  }
  if (!url) return <span className="h-20 w-20 animate-pulse rounded-lg bg-base-4" aria-hidden="true" />;
  return (
    <img
      src={url}
      alt={`Foto do problema reportado: ${categoria}`}
      className="h-20 w-20 rounded-lg border border-base-4 object-cover"
    />
  );
}

function ItemModeracao({ ocorrencia, aoAtualizar }) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const visivel = ocorrencia.status === "VISIVEL";

  async function alternar() {
    if (enviando) return;
    const novoStatus = visivel ? "OCULTA" : "VISIVEL";
    setEnviando(true);
    setErro(null);
    try {
      const atualizada = await alterarVisibilidade(ocorrencia.id, novoStatus);
      aoAtualizar(ocorrencia.id, { status: atualizada?.status ?? novoStatus });
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível alterar a visibilidade. Tente novamente."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <li className="rounded-xl border border-base-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-texto">{ocorrencia.trechoNome}</h3>
          <p className="text-xs text-texto-mute">
            <span>{ocorrencia.categoria.nome}</span> · Reportado em {formatarData(ocorrencia.criadoEm)}
          </p>
          <p className="text-xs text-texto-mute">Autor: {ocorrencia.autorNome ?? "Autor removido"}</p>
        </div>
        <Badge tom={visivel ? "bom" : "ruim"}>{visivel ? "Visível" : "Oculta"}</Badge>
      </div>

      {ocorrencia.descricao && <p className="mt-2 text-sm text-texto">{ocorrencia.descricao}</p>}
      {ocorrencia.fotos.length > 0 && (
        <div className="mt-3 flex gap-2">
          {ocorrencia.fotos.map((foto) => (
            <Miniatura key={foto.id} fotoId={foto.id} categoria={ocorrencia.categoria.nome} />
          ))}
        </div>
      )}

      {erro && (
        <p role="alert" className="mt-2 text-sm text-indice-ruim">
          {erro}
        </p>
      )}

      <div className="mt-3 flex justify-end">
        <Button type="button" variante="secundario" onClick={alternar} disabled={enviando}>
          {visivel ? "Ocultar" : "Reexibir"}
        </Button>
      </div>
    </li>
  );
}

export default function ListaModeracao() {
  const {
    itens,
    total,
    status,
    moderadasPorMim,
    carregando,
    erro,
    temMais,
    mudarStatus,
    mudarModeradasPorMim,
    carregarMais,
    tentarNovamente,
    atualizar,
  } = useModeracao();

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-texto">Fila de moderação</h2>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="filtro-moderacao-status" className={classeRotulo}>
              Visibilidade
            </label>
            <select
              id="filtro-moderacao-status"
              value={status ?? ""}
              onChange={(e) => mudarStatus(e.target.value)}
              className={`${classeCampo} w-auto`}
            >
              <option value="">Todas</option>
              <option value="VISIVEL">Visíveis</option>
              <option value="OCULTA">Ocultas</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-texto">
            <input
              type="checkbox"
              checked={moderadasPorMim}
              onChange={(e) => mudarModeradasPorMim(e.target.checked)}
            />
            Moderadas por mim
          </label>
        </div>
      </div>

      {carregando && itens.length === 0 && !erro && <p className="mt-4 text-sm text-texto-mute">Carregando...</p>}

      {erro && (
        <div role="alert" className="mt-4 flex flex-wrap items-center gap-3 text-sm text-indice-ruim">
          <span>Não foi possível carregar as ocorrências.</span>
          <Button variante="secundario" onClick={tentarNovamente}>
            Tentar de novo
          </Button>
        </div>
      )}

      {!carregando && !erro && total === 0 && (
        <p className="mt-4 text-sm text-texto-mute">Nenhuma ocorrência encontrada.</p>
      )}

      {itens.length > 0 && (
        <ul className="mt-4 flex flex-col gap-3">
          {itens.map((ocorrencia) => (
            <ItemModeracao key={ocorrencia.id} ocorrencia={ocorrencia} aoAtualizar={atualizar} />
          ))}
        </ul>
      )}

      {temMais && !erro && (
        <div className="mt-4">
          <Button variante="secundario" onClick={carregarMais} disabled={carregando}>
            {carregando ? "Carregando..." : "Carregar mais"}
          </Button>
        </div>
      )}
    </Card>
  );
}
