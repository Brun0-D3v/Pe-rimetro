import { useResumoAtividade } from "../../hooks/useResumoAtividade";
import Card from "../ui/Card";

export default function ResumoAtividade() {
  const { resumo, erro } = useResumoAtividade();

  return (
    <Card>
      <h2 className="text-lg font-semibold text-texto">Minha atividade</h2>
      {erro ? (
        <p className="mt-3 text-sm text-texto-mute">Não foi possível carregar o resumo agora.</p>
      ) : (
        <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-base-2 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-texto-mute">Avaliações</dt>
            <dd className="mt-1 text-2xl font-semibold text-texto">{resumo ? resumo.totalAvaliacoes : "–"}</dd>
          </div>
        </dl>
      )}
    </Card>
  );
}
