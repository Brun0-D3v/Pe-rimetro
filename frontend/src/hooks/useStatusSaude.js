import { useEffect, useState } from "react";
import { buscarStatusSaude } from "../services/healthService";

export function useStatusSaude() {
  const [status, setStatus] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    buscarStatusSaude()
      .then(setStatus)
      .catch(setErro)
      .finally(() => setCarregando(false));
  }, []);

  return { status, carregando, erro };
}
