// Preferências de acessibilidade guardadas só no navegador (nada vai ao servidor).
export const CHAVE_PREFERENCIAS = "perimetro-preferencias";

// Percentual do font-size da raiz: as medidas do Tailwind são em rem, então tudo acompanha.
export const TAMANHOS_FONTE = [
  { valor: "normal", rotulo: "Normal", percentual: 100 },
  { valor: "grande", rotulo: "Grande", percentual: 112.5 },
  { valor: "maior", rotulo: "Muito grande", percentual: 125 },
];

export const TAMANHO_FONTE_PADRAO = "normal";

export function percentualDoTamanho(valor) {
  const encontrado = TAMANHOS_FONTE.find((tamanho) => tamanho.valor === valor);
  return (encontrado ?? TAMANHOS_FONTE[0]).percentual;
}

export function tamanhoValido(valor) {
  return TAMANHOS_FONTE.some((tamanho) => tamanho.valor === valor);
}
