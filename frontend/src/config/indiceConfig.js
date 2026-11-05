// Apresentação das faixas do Índice de Caminhabilidade.
// A faixa em si é decidida só no backend (campo `classificacao`); aqui há apenas
// cores, rótulos e formatação. Leaflet exige hex, por isso os valores dos tokens
// --color-indice-* estão repetidos aqui.
export const COR_SEM_AVALIACAO = "#60a5fa";

const COR_POR_CLASSIFICACAO = {
  BOM: "#34d399",
  MEDIO: "#fbbf24",
  RUIM: "#f87171",
};

const TOM_POR_CLASSIFICACAO = {
  BOM: "bom",
  MEDIO: "medio",
  RUIM: "ruim",
};

const ROTULO_POR_CLASSIFICACAO = {
  BOM: "Bom",
  MEDIO: "Médio",
  RUIM: "Ruim",
};

export function corDoTrecho(classificacao) {
  return COR_POR_CLASSIFICACAO[classificacao] ?? COR_SEM_AVALIACAO;
}

export function tomDaClassificacao(classificacao) {
  return TOM_POR_CLASSIFICACAO[classificacao] ?? "neutro";
}

export function rotuloDaClassificacao(classificacao) {
  return ROTULO_POR_CLASSIFICACAO[classificacao] ?? "Sem avaliações";
}

// O índice é exibido com uma casa decimal, igual ao critério usado pelo backend na faixa.
export function formatarIndice(indice) {
  if (indice === null || indice === undefined) return "Sem índice";
  return (Math.round(Number(indice) * 10) / 10).toFixed(1).replace(".", ",");
}
