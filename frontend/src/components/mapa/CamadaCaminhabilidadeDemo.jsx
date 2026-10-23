import { CircleMarker, Popup } from "react-leaflet";

const CORES_DEMO = {
  bom: "#34d399",
  medio: "#fbbf24",
  ruim: "#f87171",
};

const PONTOS_DEMO = [
  { id: "demo-1", lat: -8.0631, lng: -34.8711, categoria: "bom" },
  { id: "demo-2", lat: -8.0696, lng: -34.8755, categoria: "medio" },
  { id: "demo-3", lat: -8.058, lng: -34.882, categoria: "ruim" },
];

export default function CamadaCaminhabilidadeDemo() {
  return (
    <>
      {PONTOS_DEMO.map((ponto) => (
        <CircleMarker
          key={ponto.id}
          center={[ponto.lat, ponto.lng]}
          radius={10}
          pathOptions={{
            color: CORES_DEMO[ponto.categoria],
            fillColor: CORES_DEMO[ponto.categoria],
            fillOpacity: 0.7,
          }}
        >
          <Popup>Dado de demonstração — índice fictício, não calculado.</Popup>
        </CircleMarker>
      ))}
    </>
  );
}
