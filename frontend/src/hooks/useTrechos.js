import { useEffect, useState } from "react";
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

  return { trechos, carregando, erro };
}
