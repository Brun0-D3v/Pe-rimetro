import { useCallback, useMemo, useState } from "react";
import { LIMITES_TRECHO } from "../config/trechoConfig";
import { comprimentoMetros, distanciaMetros } from "../utils/geometria";

// Motivo pelo qual o traçado ainda não pode ser salvo, ou null se está dentro dos limites.
export function motivoDoTracadoInvalido(quantidadePontos, comprimento) {
  if (quantidadePontos < LIMITES_TRECHO.minPontos) return "Marque pelo menos 2 pontos no mapa.";
  if (comprimento < LIMITES_TRECHO.comprimentoMinMetros) {
    return `Trecho curto demais (mínimo ${LIMITES_TRECHO.comprimentoMinMetros} m).`;
  }
  if (comprimento > LIMITES_TRECHO.comprimentoMaxMetros) {
    return `Trecho longo demais (máximo ${LIMITES_TRECHO.comprimentoMaxMetros} m).`;
  }
  return null;
}

// Guarda os vértices do trecho que a pessoa está traçando no mapa.
export function useDesenhoTrecho() {
  const [pontos, setPontos] = useState([]);

  const adicionarPonto = useCallback((ponto) => {
    setPontos((atuais) => {
      if (atuais.length >= LIMITES_TRECHO.maxPontos) return atuais;
      const ultimo = atuais[atuais.length - 1];
      if (ultimo && distanciaMetros(ultimo, ponto) < LIMITES_TRECHO.distanciaMinimaEntrePontosMetros) {
        return atuais;
      }
      return [...atuais, { lat: ponto.lat, lng: ponto.lng }];
    });
  }, []);

  const desfazerPonto = useCallback(() => setPontos((atuais) => atuais.slice(0, -1)), []);
  const limpar = useCallback(() => setPontos([]), []);

  const comprimento = useMemo(() => comprimentoMetros(pontos), [pontos]);
  const motivoInvalido = motivoDoTracadoInvalido(pontos.length, comprimento);

  return { pontos, comprimento, motivoInvalido, adicionarPonto, desfazerPonto, limpar };
}
