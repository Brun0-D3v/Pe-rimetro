import { useEffect, useState } from "react";
import { buscarRegioes } from "../services/regiaoService";

export function useRegioes() {
  const [regioes, setRegioes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    buscarRegioes()
      .then(setRegioes)
      .catch(setErro)
      .finally(() => setCarregando(false));
  }, []);

  return { regioes, carregando, erro };
}
