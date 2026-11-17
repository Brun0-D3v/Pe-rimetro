import { useState } from "react";
import { X } from "lucide-react";
import { formatarIndice, rotuloDaClassificacao, tomDaClassificacao } from "../../config/indiceConfig";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";
import { useAuth } from "../../hooks/useAuth";
import ConviteLogin from "./ConviteLogin";
import FormularioOcorrencia from "../ocorrencia/FormularioOcorrencia";
import ListaOcorrenciasTrecho from "../ocorrencia/ListaOcorrenciasTrecho";
import FormularioAvaliacao from "./FormularioAvaliacao";

function textoTotal(total) {
  return total === 1 ? "1 avaliação" : `${total} avaliações`;
}

export default function PainelDetalheTrecho({ trecho, aoFechar, aoAvaliado, aoReportado, versaoOcorrencias = 0 }) {
  // Quem usa o painel passa `key={trecho.id}`: ao trocar de trecho o componente remonta,
  // e o formulário e a mensagem de sucesso não sobrevivem.
  const { autenticado } = useAuth();
  const [avaliando, setAvaliando] = useState(false);
  const [reportando, setReportando] = useState(false);
  const [confirmacao, setConfirmacao] = useState(false);
  const [confirmacaoOcorrencia, setConfirmacaoOcorrencia] = useState(false);

  if (!trecho) return null;

  const semAvaliacoes = trecho.totalAvaliacoes === 0;
  const inativo = trecho.status === "INATIVO";

  function concluirAvaliacao(trechoAtualizado) {
    aoAvaliado(trechoAtualizado);
    setAvaliando(false);
    setConfirmacao(true);
  }

  function concluirOcorrencia(ocorrencia, { fotosPendentes = 0 } = {}) {
    aoReportado?.(ocorrencia);
    // Com foto pendente o formulário continua aberto para "Tentar de novo".
    if (fotosPendentes === 0) {
      setReportando(false);
      setConfirmacaoOcorrencia(true);
    }
  }

  return (
    <Card className="absolute top-20 right-4 z-[1000] w-[calc(100%-2rem)] max-w-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-texto">{trecho.nome}</h2>
          <div className="flex flex-wrap gap-2">
            <Badge tom={tomDaClassificacao(trecho.classificacao)}>{rotuloDaClassificacao(trecho.classificacao)}</Badge>
            <Badge tom="neutro">{trecho.status}</Badge>
          </div>
        </div>
        <Button variante="fantasma" onClick={aoFechar} aria-label="Fechar painel de detalhes do trecho">
          <X size={16} />
          Fechar
        </Button>
      </div>

      {semAvaliacoes ? (
        <p className="mt-4 text-sm text-texto-mute">Ainda sem avaliações</p>
      ) : (
        <p className="mt-4 text-sm text-texto">
          <span className="text-2xl font-semibold">{formatarIndice(trecho.indiceAtual)}</span>
          <span className="text-texto-mute"> de 10 · {textoTotal(trecho.totalAvaliacoes)}</span>
        </p>
      )}

      {confirmacao && (
        <p role="status" className="mt-3 text-sm text-texto">
          Avaliação enviada. Obrigado!
        </p>
      )}

      {confirmacaoOcorrencia && (
        <p role="status" className="mt-3 text-sm text-texto">
          Ocorrência registrada. Obrigado!
        </p>
      )}

      {!autenticado ? (
        <div className="mt-4 flex flex-col gap-2">
          {inativo ? (
            <p className="text-xs text-texto-mute">Trechos inativos não recebem avaliações.</p>
          ) : (
            <>
              <ConviteLogin mensagem="Entre para avaliar este trecho." />
              <p className="text-sm text-texto">Entre para reportar um problema.</p>
            </>
          )}
        </div>
      ) : reportando ? (
        <FormularioOcorrencia
          trechoId={trecho.id}
          aoConcluir={concluirOcorrencia}
          aoCancelar={() => setReportando(false)}
        />
      ) : avaliando ? (
        <FormularioAvaliacao
          trechoId={trecho.id}
          aoConcluir={concluirAvaliacao}
          aoCancelar={() => setAvaliando(false)}
        />
      ) : (
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={inativo}
              onClick={() => {
                setConfirmacao(false);
                setConfirmacaoOcorrencia(false);
                setAvaliando(true);
              }}
            >
              Avaliar este trecho
            </Button>
            <Button
              variante="secundario"
              disabled={inativo}
              onClick={() => {
                setConfirmacao(false);
                setConfirmacaoOcorrencia(false);
                setAvaliando(false);
                setReportando(true);
              }}
            >
              Reportar problema
            </Button>
          </div>
          {inativo && <p className="mt-2 text-xs text-texto-mute">Trechos inativos não recebem avaliações.</p>}
        </div>
      )}

      <ListaOcorrenciasTrecho trechoId={trecho.id} versao={versaoOcorrencias} />
    </Card>
  );
}
