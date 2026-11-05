// As 6 dimensões do Índice de Caminhabilidade, na ordem do formulário.
// `chave` é o nome do campo no corpo do POST /trechos/{id}/avaliacoes.
// Os textos de apoio são uma PROPOSTA de produto, ainda não validada.
export const DIMENSOES = [
  { chave: "notaCalcada", rotulo: "Calçada", apoio: "Estado do piso, largura e continuidade da calçada." },
  {
    chave: "notaAcessibilidade",
    rotulo: "Acessibilidade",
    apoio: "Rampas, piso tátil e passagem para cadeira de rodas e carrinhos.",
  },
  { chave: "notaIluminacao", rotulo: "Iluminação", apoio: "Iluminação do trecho à noite." },
  { chave: "notaArborizacao", rotulo: "Arborização", apoio: "Sombra e presença de árvores ao longo do trecho." },
  {
    chave: "notaTravessias",
    rotulo: "Travessias",
    apoio: "Faixas de pedestres, semáforos e segurança para atravessar.",
  },
  {
    chave: "notaMobiliario",
    rotulo: "Mobiliário urbano",
    apoio: "Bancos, lixeiras, pontos de ônibus e outros equipamentos.",
  },
];

export const NOTA_MINIMA = 0;
export const NOTA_MAXIMA = 10;
export const NOTA_INICIAL = 5;
