import { useEffect, useState } from "react";
import { buscarContagemPorTrecho } from "../services/ocorrenciaService";

// Mapa trechoId -> total de ocorrências. Refaz a busca quando `versao` muda.
// Falha silenciosa: o mapa continua útil sem os marcadores.
export function useContagemOcorrencias(versao) {
  const [contagem, setContagem] = useState(() => new Map());

  useEffect(() => {
    let cancelado = false;
    buscarContagemPorTrecho()
      .then((lista) => {
        if (!cancelado) setContagem(new Map(lista.map((item) => [item.trechoId, item.total])));
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, [versao]);

  return contagem;
}
