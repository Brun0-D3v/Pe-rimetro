import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import { corDoTrecho } from "../../config/indiceConfig";
import { CENTRO_PADRAO, TILES_POR_TEMA, ZOOM_PADRAO } from "../../config/mapaConfig";
import ControlesMapa from "./ControlesMapa";
import { pontoCentral } from "../../utils/pontoCentral";
import MarcadorUsuario from "./MarcadorUsuario";

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

function iconeOcorrencias(total) {
  // Estilo inline: o HTML do divIcon fica fora do alcance das classes do Tailwind.
  return L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;border-radius:9999px;background:#dc2626;color:#fff;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;font:600 13px/1 sans-serif;">${total}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

const ZOOM_LOCALIZACAO = 17;

// Centraliza no usuário apenas quando `pedido` muda (clique no botão ou primeiro fix).
function CentralizarNaPosicao({ posicao, pedido }) {
  const mapa = useMap();
  useEffect(() => {
    if (pedido > 0 && posicao) {
      mapa.flyTo([posicao.lat, posicao.lng], ZOOM_LOCALIZACAO);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedido]);
  return null;
}

export default function MapaLeaflet({
  trechos,
  trechoSelecionadoId,
  onSelecionarTrecho,
  tema,
  contagemOcorrencias,
  focoBusca,
  posicaoUsuario,
  precisaoUsuario,
  pedidoCentralizar = 0,
  estadoLocalizacao,
  aoLocalizar,
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
      <CentralizarNaPosicao posicao={posicaoUsuario} pedido={pedidoCentralizar} />
      <TileLayer attribution={tiles.atribuicao} url={tiles.url} />
      {trechos.map((trecho) => (
        <Polyline
          key={trecho.id}
          positions={trecho.geometria.map((ponto) => [ponto.lat, ponto.lng])}
          pathOptions={{
            color: corDoTrecho(trecho.classificacao),
            weight: trecho.id === trechoSelecionadoId ? 7 : 4,
          }}
          eventHandlers={{ click: () => onSelecionarTrecho(trecho) }}
        />
      ))}
      {trechos.map((trecho) => {
        const total = contagemOcorrencias?.get(trecho.id) ?? 0;
        if (total <= 0) return null;
        const texto = total === 1 ? "1 ocorrência neste trecho" : `${total} ocorrências neste trecho`;
        return (
          <Marker
            key={`ocorrencias-${trecho.id}`}
            position={pontoCentral(trecho.geometria)}
            icon={iconeOcorrencias(total)}
            title={texto}
            alt={texto}
            eventHandlers={{ click: () => onSelecionarTrecho(trecho) }}
          />
        );
      })}
      <MarcadorUsuario posicao={posicaoUsuario} precisao={precisaoUsuario} />
      {children}
      <ControlesMapa
        centroPadrao={CENTRO_PADRAO}
        zoomPadrao={ZOOM_PADRAO}
        aoLocalizar={aoLocalizar}
        estadoLocalizacao={estadoLocalizacao}
      />
    </MapContainer>
  );
}
