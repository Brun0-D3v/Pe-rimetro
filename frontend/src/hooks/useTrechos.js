import { useCallback, useEffect, useState } from "react";
import { buscarTrechos } from "../services/trechoService";

export function useTrechos(regiaoId) {
  const [trechos, setTrechos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    setCarregando(true);
    setErro(null);
    buscarTrechos(regiaoId)
      .then(setTrechos)
      .catch(setErro)
      .finally(() => setCarregando(false));
  }, [regiaoId]);

  // Troca um trecho da lista pela versão devolvida pelo backend (ex.: após uma avaliação).
  const atualizarTrecho = useCallback((trechoAtualizado) => {
    setTrechos((lista) => lista.map((trecho) => (trecho.id === trechoAtualizado.id ? trechoAtualizado : trecho)));
  }, []);

  return { trechos, carregando, erro, atualizarTrecho };
}
