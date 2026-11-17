import { useState } from "react";
import { DIMENSOES, NOTA_INICIAL, NOTA_MAXIMA, NOTA_MINIMA } from "../../config/dimensoes";
import { enviarAvaliacao } from "../../services/avaliacaoService";
import Button from "../ui/Button";

function notasIniciais() {
  return Object.fromEntries(DIMENSOES.map(({ chave }) => [chave, NOTA_INICIAL]));
}

function mensagemDeErro(erro) {
  return (
    erro.response?.data?.mensagem ?? "Não foi possível enviar a avaliação. Verifique a conexão e tente novamente."
  );
}

export default function FormularioAvaliacao({ trechoId, aoConcluir, aoCancelar }) {
  const [notas, setNotas] = useState(notasIniciais);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  function alterarNota(chave, valor) {
    setNotas((atuais) => ({ ...atuais, [chave]: Number(valor) }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const resposta = await enviarAvaliacao(trechoId, notas);
      aoConcluir(resposta.trecho);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="mt-4 flex max-h-[50dvh] flex-col gap-4 overflow-y-auto pr-1">
      {DIMENSOES.map(({ chave, rotulo, apoio }) => {
        const idCampo = `avaliacao-${chave}`;
        return (
          <div key={chave} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <label htmlFor={idCampo} className="text-sm font-medium text-texto">
                {rotulo}
              </label>
              <output htmlFor={idCampo} className="text-sm font-semibold text-texto">
                {notas[chave]}
              </output>
            </div>
            <input
              id={idCampo}
              type="range"
              min={NOTA_MINIMA}
              max={NOTA_MAXIMA}
              step={1}
              value={notas[chave]}
              disabled={enviando}
              onChange={(evento) => alterarNota(chave, evento.target.value)}
              aria-describedby={`${idCampo}-apoio`}
              className="w-full accent-primary-light"
            />
            <div className="flex justify-between text-xs text-texto-mute">
              <span>{NOTA_MINIMA} (muito ruim)</span>
              <span>{NOTA_MAXIMA} (excelente)</span>
            </div>
            <p id={`${idCampo}-apoio`} className="text-xs text-texto-mute">
              {apoio}
            </p>
          </div>
        );
      })}

      {erro && (
        <p role="alert" className="rounded-lg border border-indice-ruim/40 bg-indice-ruim/10 px-3 py-2 text-sm text-texto">
          {erro}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={enviando}>
          {enviando ? "Enviando..." : "Enviar avaliação"}
        </Button>
        <Button type="button" variante="secundario" onClick={aoCancelar} disabled={enviando}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
