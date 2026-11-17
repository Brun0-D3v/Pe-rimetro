import { useEffect, useState } from "react";
import { buscarResumo } from "../services/usuarioService";

export function useResumoAtividade() {
  const [resumo, setResumo] = useState(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    buscarResumo().then(setResumo).catch(() => setErro(true));
  }, []);

  return { resumo, erro };
}
