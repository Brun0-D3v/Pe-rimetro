import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";
import { CENTRO_PADRAO, TILES_POR_TEMA, ZOOM_PADRAO } from "../../config/mapaConfig";
import ControlesMapa from "./ControlesMapa";

function calcularCentro(trechos) {
  const pontos = trechos.flatMap((trecho) => trecho.geometria);
  if (pontos.length === 0) return CENTRO_PADRAO;
  const soma = pontos.reduce(
    (acumulado, ponto) => [acumulado[0] + ponto.lat, acumulado[1] + ponto.lng],
    [0, 0]
  );
  return [soma[0] / pontos.length, soma[1] / pontos.length];
}

function RecentralizarMapa({ centro }) {
  const mapa = useMap();
  useEffect(() => {
    mapa.setView(centro, mapa.getZoom());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centro[0], centro[1], mapa]);
  return null;
}

export default function MapaLeaflet({
  trechos,
  trechoSelecionadoId,
  onSelecionarTrecho,
  tema,
  focoBusca,
  className = "",
  children,
}) {
  const centroTrechos = calcularCentro(trechos);
  const centro = focoBusca ? [focoBusca.lat, focoBusca.lng] : centroTrechos;
  const tiles = TILES_POR_TEMA[tema];

  return (
    <MapContainer
      center={CENTRO_PADRAO}
      zoom={ZOOM_PADRAO}
      zoomControl={false}
      className={["h-full w-full rounded-2xl", className].join(" ")}
    >
      <RecentralizarMapa centro={centro} />
      <TileLayer attribution={tiles.atribuicao} url={tiles.url} />
      {trechos.map((trecho) => (
        <Polyline
          key={trecho.id}
          positions={trecho.geometria.map((ponto) => [ponto.lat, ponto.lng])}
          pathOptions={{
            color: trecho.id === trechoSelecionadoId ? "#38bdf8" : "#60a5fa",
            weight: trecho.id === trechoSelecionadoId ? 5 : 3,
          }}
          eventHandlers={{ click: () => onSelecionarTrecho(trecho) }}
        />
      ))}
      {children}
      <ControlesMapa centroPadrao={CENTRO_PADRAO} zoomPadrao={ZOOM_PADRAO} />
    </MapContainer>
  );
}
