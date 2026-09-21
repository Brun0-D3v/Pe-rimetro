import { useState } from "react";
import Card from "../components/ui/Card";
import MapaLeaflet from "../components/mapa/MapaLeaflet";
import PainelDetalheTrecho from "../components/mapa/PainelDetalheTrecho";
import { useTrechos } from "../hooks/useTrechos";

export default function Mapa() {
  const { trechos, carregando, erro } = useTrechos();
  const [trechoSelecionado, setTrechoSelecionado] = useState(null);

  if (carregando) {
    return (
      <Card>
        <h1 className="text-xl font-semibold">Mapa</h1>
        <p className="mt-2 text-texto-mute">Carregando trechos...</p>
      </Card>
    );
  }

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
    <div className="relative isolate h-[calc(100dvh-8rem)] w-full">
      <MapaLeaflet
        trechos={trechos}
        trechoSelecionadoId={trechoSelecionado?.id}
        onSelecionarTrecho={setTrechoSelecionado}
      />
      {trechos.length === 0 && (
        <p className="absolute left-1/2 top-4 z-[1000] -translate-x-1/2 rounded-full bg-base-3 px-4 py-2 text-sm text-texto-mute shadow-sm">
          Nenhum trecho cadastrado ainda.
        </p>
      )}
      <PainelDetalheTrecho
        trecho={trechoSelecionado}
        aoFechar={() => setTrechoSelecionado(null)}
      />
    </div>
  );
}
