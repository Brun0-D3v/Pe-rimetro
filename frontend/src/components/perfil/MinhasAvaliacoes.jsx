import { Link } from "react-router-dom";
import { DIMENSOES } from "../../config/dimensoes";
import { formatarIndice, rotuloDaClassificacao, tomDaClassificacao } from "../../config/indiceConfig";
import { useMinhasAvaliacoes } from "../../hooks/useMinhasAvaliacoes";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function ItemAvaliacao({ avaliacao }) {
  return (
    <li className="rounded-xl border border-base-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-texto">{avaliacao.trechoNome}</h3>
          <p className="text-xs text-texto-mute">Avaliado em {formatarData(avaliacao.criadoEm)}</p>
        </div>
        <Badge tom={tomDaClassificacao(avaliacao.classificacao)}>
          {formatarIndice(avaliacao.indice)} · {rotuloDaClassificacao(avaliacao.classificacao)}
        </Badge>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
        {DIMENSOES.map(({ chave, rotulo }) => (
          <div key={chave} className="flex justify-between gap-2">
            <dt className="text-texto-mute">{rotulo}</dt>
            <dd className="font-medium text-texto">{avaliacao[chave]}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-texto-mute">
        <span>Índice atual do trecho: {formatarIndice(avaliacao.indiceAtualDoTrecho)}</span>
        <Link
          to={`/app?trecho=${encodeURIComponent(avaliacao.trechoId)}`}
          className="font-medium text-primary-light hover:underline"
        >
          Ver no mapa
        </Link>
      </div>
    </li>
  );
}

export default function MinhasAvaliacoes() {
  const { itens, total, carregando, erro, temMais, carregarMais, tentarNovamente } = useMinhasAvaliacoes();

  return (
    <Card>
      <h2 className="text-lg font-semibold text-texto">Minhas avaliações</h2>
      <p className="mt-1 text-sm text-texto-mute">
        O índice de cada avaliação é calculado só com as notas que você deu.
      </p>

      {carregando && itens.length === 0 && <p className="mt-4 text-sm text-texto-mute">Carregando...</p>}

      {erro && (
        <div role="alert" className="mt-4 flex flex-wrap items-center gap-3 text-sm text-indice-ruim">
          <span>Não foi possível carregar suas avaliações.</span>
          <Button variante="secundario" onClick={tentarNovamente}>
            Tentar de novo
          </Button>
        </div>
      )}

      {!carregando && !erro && total === 0 && (
        <p className="mt-4 text-sm text-texto-mute">Você ainda não avaliou nenhum trecho.</p>
      )}

      {itens.length > 0 && (
        <ul className="mt-4 flex flex-col gap-3">
          {itens.map((avaliacao) => (
            <ItemAvaliacao key={avaliacao.id} avaliacao={avaliacao} />
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
