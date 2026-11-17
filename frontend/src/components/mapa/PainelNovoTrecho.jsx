import { useState } from "react";
import { LIMITES_TRECHO } from "../../config/trechoConfig";
import Button from "../ui/Button";
import Card from "../ui/Card";

function resumo(pontos, comprimento) {
  if (pontos.length === 0) return "Nenhum ponto marcado ainda.";
  const textoPontos = pontos.length === 1 ? "1 ponto" : `${pontos.length} pontos`;
  return `${textoPontos} · ${Math.round(comprimento)} m`;
}

export default function PainelNovoTrecho({
  pontos,
  comprimento,
  motivoInvalido,
  regioes,
  regiaoSugeridaId,
  regiaoTravadaId,
  salvando,
  erro,
  aoDesfazer,
  aoLimpar,
  aoCancelar,
  aoSalvar,
}) {
  const [nome, setNome] = useState("");
  const [regiaoEscolhidaId, setRegiaoEscolhidaId] = useState(null);

  // Com filtro de região ativo a região é a do filtro; senão vale a escolha da pessoa,
  // ou a sugestão (região do trecho cadastrado mais próximo do primeiro ponto).
  const regiaoId = regiaoTravadaId ?? regiaoEscolhidaId ?? regiaoSugeridaId ?? "";
  const nomeLimpo = nome.trim();
  const podeSalvar = !motivoInvalido && nomeLimpo.length > 0 && regiaoId !== "" && !salvando;

  function enviar(evento) {
    evento.preventDefault();
    if (podeSalvar) aoSalvar({ nome: nomeLimpo, regiaoId });
  }

  return (
    <Card className="absolute right-4 top-20 z-[1000] w-[calc(100%-2rem)] max-w-sm">
      <h2 className="text-lg font-semibold text-texto">Novo trecho</h2>
      <p className="mt-1 text-sm text-texto-mute">
        Toque no mapa para marcar os pontos do trecho, na ordem em que se caminha.
      </p>
      <p className="mt-3 text-sm font-medium text-texto" role="status">
        {resumo(pontos, comprimento)}
      </p>
      {motivoInvalido && <p className="mt-1 text-xs text-texto-mute">{motivoInvalido}</p>}

      <form onSubmit={enviar} className="mt-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="novo-trecho-nome" className="text-xs font-semibold uppercase tracking-wide text-texto-mute">
            Nome do trecho
          </label>
          <input
            id="novo-trecho-nome"
            type="text"
            value={nome}
            maxLength={LIMITES_TRECHO.nomeMaxCaracteres}
            disabled={salvando}
            onChange={(evento) => setNome(evento.target.value)}
            placeholder="Ex.: Rua da Aurora, entre a ponte e a praça"
            className="rounded-lg border border-base-4 bg-base-2 px-3 py-2 text-sm text-texto placeholder:text-texto-mute"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="novo-trecho-regiao" className="text-xs font-semibold uppercase tracking-wide text-texto-mute">
            Região
          </label>
          <select
            id="novo-trecho-regiao"
            value={regiaoId}
            disabled={salvando || regiaoTravadaId !== null}
            onChange={(evento) => setRegiaoEscolhidaId(evento.target.value || null)}
            className="rounded-lg border border-base-4 bg-base-2 px-3 py-2 text-sm text-texto"
          >
            <option value="">Escolha a região</option>
            {regioes.map((regiao) => (
              <option key={regiao.id} value={regiao.id}>
                {regiao.nome}
              </option>
            ))}
          </select>
          {regiaoTravadaId !== null && (
            <p className="text-xs text-texto-mute">
              Há um filtro de região ativo; para usar outra região, limpe o filtro antes de traçar.
            </p>
          )}
        </div>

        {erro && (
          <p role="alert" className="rounded-lg border border-indice-ruim/40 bg-indice-ruim/10 px-3 py-2 text-sm text-texto">
            {erro}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={!podeSalvar}>
            {salvando ? "Salvando..." : "Salvar trecho"}
          </Button>
          <Button type="button" variante="secundario" onClick={aoDesfazer} disabled={salvando || pontos.length === 0}>
            Desfazer ponto
          </Button>
          <Button type="button" variante="secundario" onClick={aoLimpar} disabled={salvando || pontos.length === 0}>
            Limpar
          </Button>
          <Button type="button" variante="fantasma" onClick={aoCancelar} disabled={salvando}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
