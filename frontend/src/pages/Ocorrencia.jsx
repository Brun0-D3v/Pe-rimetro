import MinhasOcorrencias from "../components/perfil/MinhasOcorrencias";
import Card from "../components/ui/Card";

export default function Ocorrencia() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Card>
        <h1 className="text-xl font-semibold text-texto">Ocorrências</h1>
        <p className="mt-2 text-texto-mute">
          Para reportar um problema, abra o mapa, escolha o trecho e use <em>Reportar problema</em>.
        </p>
      </Card>
      <MinhasOcorrencias />
    </div>
  );
}
