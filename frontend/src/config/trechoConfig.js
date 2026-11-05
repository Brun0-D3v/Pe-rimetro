// Espelha os limites validados pelo backend (GeometriaTrecho). O backend é a fonte da
// verdade: aqui os valores só servem para responder mais rápido, antes de enviar.
export const LIMITES_TRECHO = {
  minPontos: 2,
  maxPontos: 200,
  comprimentoMinMetros: 5,
  comprimentoMaxMetros: 5000,
  nomeMaxCaracteres: 150,
  // Um clique duplo no mapa gera dois cliques quase no mesmo lugar; o segundo é ignorado.
  distanciaMinimaEntrePontosMetros: 2,
};
