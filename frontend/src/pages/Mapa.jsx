import { useState } from "react";
import Card from "../components/ui/Card";
import MapaLeaflet from "../components/mapa/MapaLeaflet";
import PainelDetalheTrecho from "../components/mapa/PainelDetalheTrecho";
import { useTrechos } from "../hooks/useTrechos";

export default function Mapa() {
  const { trechos, erro } = useTrechos();
  const [trechoSelecionado, setTrechoSelecionado] = useState(null);

  if (erro) {
    return (
      <Card>
        <h1 className="text-xl font-semibold">Mapa</h1>
        <p className="mt-2 text-texto-mute">
          Não foi possível carregar os trechos. Tente novamente mais tarde.
        </p>
      </Card>
    );
  }

  return (
    <div className="relative h-[calc(100vh-8rem)] w-full">
      <MapaLeaflet
        trechos={trechos}
        trechoSelecionadoId={trechoSelecionado?.id}
        onSelecionarTrecho={setTrechoSelecionado}
      />
      <PainelDetalheTrecho
        trecho={trechoSelecionado}
        aoFechar={() => setTrechoSelecionado(null)}
      />
    </div>
  );
}
