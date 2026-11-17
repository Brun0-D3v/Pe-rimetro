// Ponto central de um trecho (para posicionar o marcador de ocorrências): o ponto do meio
// da geometria, ou a média dos dois do meio quando a quantidade é par.
export function pontoCentral(geometria) {
  const n = geometria.length;
  if (n % 2 === 1) {
    const p = geometria[(n - 1) / 2];
    return [p.lat, p.lng];
  }
  const a = geometria[n / 2 - 1];
  const b = geometria[n / 2];
  return [(a.lat + b.lat) / 2, (a.lng + b.lng) / 2];
}
