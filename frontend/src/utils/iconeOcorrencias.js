import L from "leaflet";

const cache = new Map();

// Um ícone por total: o react-leaflet refaz o marcador (setIcon) quando a instância muda,
// e o mapa renderiza a cada atualização do GPS.
export function iconeOcorrencias(total) {
  const n = Number(total);
  if (!cache.has(n)) {
    // Estilo inline: o HTML do divIcon fica fora do alcance das classes do Tailwind.
    cache.set(
      n,
      L.divIcon({
        className: "",
        html: `<div style="width:28px;height:28px;border-radius:9999px;background:#dc2626;color:#fff;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;font:600 13px/1 sans-serif;">${n}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })
    );
  }
  return cache.get(n);
}
