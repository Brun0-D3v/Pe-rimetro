import { useEffect, useState } from "react";
import { buscarTrechos } from "../services/trechoService";

export function useTrechos() {
  const [trechos, setTrechos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    buscarTrechos()
      .then(setTrechos)
      .catch(setErro)
      .finally(() => setCarregando(false));
  }, []);

  return { trechos, carregando, erro };
}
