import { useState } from "react";
import { Link } from "react-router-dom";
import { MAX_DESCRICAO } from "../../config/ocorrenciaConfig";
import { useCategorias } from "../../hooks/useCategorias";
import { useImagemAutenticada } from "../../hooks/useImagemAutenticada";
import { useMinhasOcorrencias } from "../../hooks/useMinhasOcorrencias";
import { editarOcorrencia, excluirOcorrencia } from "../../services/ocorrenciaService";
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

// A foto de ocorrência oculta exige o token do dono, então a miniatura é baixada com autenticação.
function Miniatura({ fotoId, categoria }) {
  const { url, erro } = useImagemAutenticada(fotoId);
  if (erro) {
    return (
      <span className="flex h-16 w-16 items-center justify-center rounded-lg border border-base-4 text-center text-[10px] text-texto-mute">
        Sem foto
      </span>
    );
  }
  if (!url) return <span className="h-16 w-16 animate-pulse rounded-lg bg-base-4" aria-hidden="true" />;
  return (
    <img
      src={url}
      alt={`Foto do problema reportado: ${categoria}`}
      className="h-16 w-16 rounded-lg border border-base-4 object-cover"
    />
  );
}

function FormularioEdicao({ ocorrencia, aoSalvar, aoCancelar }) {
  const { categorias } = useCategorias();
  const [categoriaId, setCategoriaId] = useState(ocorrencia.categoria.id);
  const [descricao, setDescricao] = useState(ocorrencia.descricao ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const idCategoria = `edicao-categoria-${ocorrencia.id}`;
  const idDescricao = `edicao-descricao-${ocorrencia.id}`;

  async function salvar(evento) {
    evento.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const salva = await editarOcorrencia(ocorrencia.id, { categoriaId, descricao });
      // O servidor normaliza a descrição (trim, vazio vira nulo): usa a resposta, não o texto digitado.
      const categoria =
        salva?.categoria ?? categorias.find((c) => c.id === categoriaId) ?? ocorrencia.categoria;
      aoSalvar({ categoria, descricao: salva ? salva.descricao : descricao });
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível salvar a alteração. Tente novamente."));
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="mt-3 flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor={idCategoria} className={classeRotulo}>
          Categoria
        </label>
        <select
          id={idCategoria}
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          className={classeCampo}
        >
          {!categorias.some((c) => c.id === ocorrencia.categoria.id) && (
            <option value={ocorrencia.categoria.id}>{ocorrencia.categoria.nome}</option>
          )}
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={idDescricao} className={classeRotulo}>
          Descrição
        </label>
        <textarea
          id={idDescricao}
          value={descricao}
          maxLength={MAX_DESCRICAO}
          rows={3}
          onChange={(e) => setDescricao(e.target.value)}
          className={classeCampo}
        />
      </div>
      {erro && (
        <p role="alert" className="text-sm text-indice-ruim">
          {erro}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar"}
        </Button>
        <Button type="button" variante="secundario" onClick={aoCancelar} disabled={salvando}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function ItemOcorrencia({ ocorrencia, aoEditar, aoExcluir }) {
  const [modo, setModo] = useState("ver"); // "ver" | "editar" | "confirmar"
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState(null);
  const visivel = ocorrencia.status === "VISIVEL";

  async function confirmarExclusao() {
    setExcluindo(true);
    setErro(null);
    try {
      await excluirOcorrencia(ocorrencia.id);
      aoExcluir(ocorrencia.id);
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível excluir a ocorrência. Tente novamente."));
      setExcluindo(false);
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
        </div>
        <Badge tom={visivel ? "bom" : "ruim"}>{visivel ? "Visível" : "Oculta pela moderação"}</Badge>
      </div>

      {modo === "editar" ? (
        <FormularioEdicao
          ocorrencia={ocorrencia}
          aoCancelar={() => setModo("ver")}
          aoSalvar={(alteracoes) => {
            aoEditar(ocorrencia.id, alteracoes);
            setModo("ver");
          }}
        />
      ) : (
        <>
          {ocorrencia.descricao && <p className="mt-2 text-sm text-texto">{ocorrencia.descricao}</p>}
          {ocorrencia.fotos.length > 0 && (
            <div className="mt-3 flex gap-2">
              {ocorrencia.fotos.map((foto) => (
                <Miniatura key={foto.id} fotoId={foto.id} categoria={ocorrencia.categoria.nome} />
              ))}
            </div>
          )}
        </>
      )}

      {modo === "confirmar" && (
        <div className="mt-3 rounded-lg bg-base-2 p-3 text-sm text-texto">
          <p>Excluir esta ocorrência? Essa ação não pode ser desfeita.</p>
          <div className="mt-2 flex gap-2">
            <Button type="button" onClick={confirmarExclusao} disabled={excluindo}>
              {excluindo ? "Excluindo..." : "Confirmar exclusão"}
            </Button>
            <Button type="button" variante="secundario" onClick={() => setModo("ver")} disabled={excluindo}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {erro && (
        <p role="alert" className="mt-2 text-sm text-indice-ruim">
          {erro}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <Link
          to={`/app?trecho=${encodeURIComponent(ocorrencia.trechoId)}`}
          className="font-medium text-primary-light hover:underline"
        >
          Ver no mapa
        </Link>
        {visivel && modo === "ver" && (
          <div className="flex gap-2">
            <Button type="button" variante="fantasma" onClick={() => setModo("editar")}>
              Editar
            </Button>
            <Button type="button" variante="fantasma" onClick={() => setModo("confirmar")}>
              Excluir
            </Button>
          </div>
        )}
      </div>
    </li>
  );
}

export default function MinhasOcorrencias() {
  const {
    itens,
    total,
    status,
    carregando,
    erro,
    temMais,
    mudarStatus,
    carregarMais,
    tentarNovamente,
    remover,
    atualizar,
  } = useMinhasOcorrencias();

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-texto">Minhas ocorrências</h2>
        <div className="flex items-center gap-2">
          <label htmlFor="filtro-visibilidade" className={classeRotulo}>
            Visibilidade
          </label>
          <select
            id="filtro-visibilidade"
            value={status ?? ""}
            onChange={(e) => mudarStatus(e.target.value)}
            className={`${classeCampo} w-auto`}
          >
            <option value="">Todas</option>
            <option value="VISIVEL">Visíveis</option>
            <option value="OCULTA">Ocultas pela moderação</option>
          </select>
        </div>
      </div>

      {carregando && itens.length === 0 && <p className="mt-4 text-sm text-texto-mute">Carregando...</p>}

      {erro && (
        <div role="alert" className="mt-4 flex flex-wrap items-center gap-3 text-sm text-indice-ruim">
          <span>Não foi possível carregar suas ocorrências.</span>
          <Button variante="secundario" onClick={tentarNovamente}>
            Tentar de novo
          </Button>
        </div>
      )}

      {!carregando && !erro && total === 0 && (
        <p className="mt-4 text-sm text-texto-mute">Você ainda não reportou nenhum problema.</p>
      )}

      {itens.length > 0 && (
        <ul className="mt-4 flex flex-col gap-3">
          {itens.map((ocorrencia) => (
            <ItemOcorrencia key={ocorrencia.id} ocorrencia={ocorrencia} aoEditar={atualizar} aoExcluir={remover} />
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
