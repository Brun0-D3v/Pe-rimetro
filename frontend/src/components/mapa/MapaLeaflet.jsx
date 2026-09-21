import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";

const CENTRO_PADRAO = [-8.0631, -34.8711]; // Recife, Marco Zero

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

export default function MapaLeaflet({ trechos, trechoSelecionadoId, onSelecionarTrecho, className = "" }) {
  const centro = calcularCentro(trechos);

  return (
    <MapContainer
      center={CENTRO_PADRAO}
      zoom={14}
      className={["h-full w-full rounded-2xl", className].join(" ")}
    >
      <RecentralizarMapa centro={centro} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
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
    </MapContainer>
  );
}
