import { Circle, CircleMarker } from "react-leaflet";

const COR_USUARIO = "#3b82f6";

// Ponto do usuário com halo e círculo de precisão. Não é interativo:
// não deve capturar cliques destinados aos trechos por baixo.
export default function MarcadorUsuario({ posicao, precisao }) {
  if (!posicao) return null;
  const centro = [posicao.lat, posicao.lng];

  return (
    <>
      {precisao != null && (
        <Circle
          center={centro}
          radius={precisao}
          pathOptions={{
            color: COR_USUARIO,
            weight: 1,
            fillColor: COR_USUARIO,
            fillOpacity: 0.12,
            interactive: false,
          }}
        />
      )}
      <CircleMarker
        center={centro}
        radius={8}
        pathOptions={{
          color: "#ffffff",
          weight: 3,
          fillColor: COR_USUARIO,
          fillOpacity: 1,
          interactive: false,
        }}
      />
    </>
  );
}
