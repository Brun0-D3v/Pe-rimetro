import { useState } from "react";
import { X } from "lucide-react";
import { formatarIndice, rotuloDaClassificacao, tomDaClassificacao } from "../../config/indiceConfig";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";
import { useAuth } from "../../hooks/useAuth";
import ConviteLogin from "./ConviteLogin";
import FormularioAvaliacao from "./FormularioAvaliacao";

function textoTotal(total) {
  return total === 1 ? "1 avaliação" : `${total} avaliações`;
}

export default function PainelDetalheTrecho({ trecho, aoFechar, aoAvaliado }) {
  // Quem usa o painel passa `key={trecho.id}`: ao trocar de trecho o componente remonta,
  // e o formulário e a mensagem de sucesso não sobrevivem.
  const { autenticado } = useAuth();
  const [avaliando, setAvaliando] = useState(false);
  const [confirmacao, setConfirmacao] = useState(false);

  if (!trecho) return null;

  const semAvaliacoes = trecho.totalAvaliacoes === 0;
  const inativo = trecho.status === "INATIVO";

  function concluirAvaliacao(trechoAtualizado) {
    aoAvaliado(trechoAtualizado);
    setAvaliando(false);
    setConfirmacao(true);
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

      {!autenticado ? (
        <div className="mt-4">
          {inativo ? (
            <p className="text-xs text-texto-mute">Trechos inativos não recebem avaliações.</p>
          ) : (
            <ConviteLogin mensagem="Entre para avaliar este trecho." />
          )}
        </div>
      ) : avaliando ? (
        <FormularioAvaliacao
          trechoId={trecho.id}
          aoConcluir={concluirAvaliacao}
          aoCancelar={() => setAvaliando(false)}
        />
      ) : (
        <div className="mt-4">
          <Button
            disabled={inativo}
            onClick={() => {
              setConfirmacao(false);
              setAvaliando(true);
            }}
          >
            Avaliar este trecho
          </Button>
          {inativo && <p className="mt-2 text-xs text-texto-mute">Trechos inativos não recebem avaliações.</p>}
        </div>
      )}
    </Card>
  );
}
