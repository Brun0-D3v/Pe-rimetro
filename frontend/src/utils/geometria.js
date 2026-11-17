const RAIO_TERRA_METROS = 6371000;

// Distância aproximada (haversine) entre dois pontos { lat, lng }, em metros.
export function distanciaMetros(a, b) {
  const paraRadianos = (graus) => (graus * Math.PI) / 180;
  const dLat = paraRadianos(b.lat - a.lat);
  const dLng = paraRadianos(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(paraRadianos(a.lat)) * Math.cos(paraRadianos(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RAIO_TERRA_METROS * Math.asin(Math.sqrt(h));
}

export function comprimentoMetros(pontos) {
  let total = 0;
  for (let i = 1; i < pontos.length; i += 1) {
    total += distanciaMetros(pontos[i - 1], pontos[i]);
  }
  return total;
}

// Média das coordenadas: serve de ponto de referência (latitude/longitude do trecho).
export function pontoMedio(pontos) {
  const soma = pontos.reduce(
    (acumulado, ponto) => ({ lat: acumulado.lat + ponto.lat, lng: acumulado.lng + ponto.lng }),
    { lat: 0, lng: 0 }
  );
  return { lat: soma.lat / pontos.length, lng: soma.lng / pontos.length };
}

// Região do trecho cadastrado cujo vértice está mais perto do primeiro ponto marcado.
export function regiaoMaisProxima(pontos, trechos) {
  if (pontos.length === 0) return null;
  const referencia = pontos[0];
  let regiaoId = null;
  let menorDistancia = Infinity;
  for (const trecho of trechos) {
    for (const ponto of trecho.geometria) {
      const distancia = distanciaMetros(referencia, ponto);
      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        regiaoId = trecho.regiaoId;
      }
    }
  }
  return regiaoId;
}
