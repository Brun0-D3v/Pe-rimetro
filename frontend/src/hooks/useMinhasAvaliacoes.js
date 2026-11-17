import { useCallback, useEffect, useState } from "react";
import { buscarMinhasAvaliacoes } from "../services/usuarioService";

const TAMANHO_PAGINA = 20;

export function useMinhasAvaliacoes() {
  const [itens, setItens] = useState([]);
  const [total, setTotal] = useState(0);
  const [proximaPagina, setProximaPagina] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  const carregar = useCallback((pagina) => {
    setCarregando(true);
    setErro(false);
    return buscarMinhasAvaliacoes({ pagina, tamanho: TAMANHO_PAGINA })
      .then((resposta) => {
        setItens((atuais) => (pagina === 0 ? resposta.itens : [...atuais, ...resposta.itens]));
        setTotal(resposta.total);
        setProximaPagina(pagina + 1);
      })
      .catch(() => setErro(true))
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => {
    // Só dispara a primeira busca; o estado inicial já é "carregando".
    buscarMinhasAvaliacoes({ pagina: 0, tamanho: TAMANHO_PAGINA })
      .then((resposta) => {
        setItens(resposta.itens);
        setTotal(resposta.total);
        setProximaPagina(1);
      })
      .catch(() => setErro(true))
      .finally(() => setCarregando(false));
  }, []);

  const carregarMais = useCallback(() => carregar(proximaPagina), [carregar, proximaPagina]);
  const tentarNovamente = useCallback(() => carregar(itens.length === 0 ? 0 : proximaPagina), [carregar, itens.length, proximaPagina]);

  return { itens, total, carregando, erro, temMais: itens.length < total, carregarMais, tentarNovamente };
}
