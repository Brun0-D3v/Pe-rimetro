import { useEffect, useState } from "react";
import { listarCategorias } from "../services/ocorrenciaService";

export function useCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    listarCategorias()
      .then(setCategorias)
      .catch(setErro)
      .finally(() => setCarregando(false));
  }, []);

  return { categorias, carregando, erro };
}
