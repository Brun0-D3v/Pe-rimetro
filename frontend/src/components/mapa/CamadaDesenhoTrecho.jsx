import { useEffect } from "react";
import { CircleMarker, Polyline, useMap, useMapEvents } from "react-leaflet";

const COR_RASCUNHO = "#38bdf8"; // = token --color-accent-tech (Leaflet exige hex)

// Ativa só durante o traçado: cada clique no mapa vira um vértice do rascunho.
export default function CamadaDesenhoTrecho({ pontos, aoAdicionarPonto }) {
  const mapa = useMap();

  useMapEvents({
    click: (evento) => aoAdicionarPonto({ lat: evento.latlng.lat, lng: evento.latlng.lng }),
  });

  useEffect(() => {
    const container = mapa.getContainer();
    container.style.cursor = "crosshair";
    return () => {
      container.style.cursor = "";
    };
  }, [mapa]);

  const posicoes = pontos.map((ponto) => [ponto.lat, ponto.lng]);

  return (
    <>
      {posicoes.length >= 2 && (
        <Polyline
          positions={posicoes}
          pathOptions={{ color: COR_RASCUNHO, weight: 5, dashArray: "8 8", interactive: false }}
        />
      )}
      {posicoes.map((posicao, indice) => (
        <CircleMarker
          key={indice}
          center={posicao}
          radius={indice === 0 ? 8 : 6}
          pathOptions={{ color: "#ffffff", weight: 2, fillColor: COR_RASCUNHO, fillOpacity: 1, interactive: false }}
        />
      ))}
    </>
  );
}
