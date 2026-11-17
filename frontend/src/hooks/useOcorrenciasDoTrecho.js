import { useCallback, useEffect, useRef, useState } from "react";
import { listarDoTrecho } from "../services/ocorrenciaService";

const TAMANHO_PAGINA = 10;

// Lista paginada das ocorrências de um trecho; recarrega do início quando `versao` ou `trechoId` mudam.
export function useOcorrenciasDoTrecho(trechoId, versao) {
  const [itens, setItens] = useState([]);
  const [total, setTotal] = useState(0);
  const [proximaPagina, setProximaPagina] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  // Só a requisição mais recente pode alterar o estado (recargas seguidas, ex.: aoReportado duplo).
  const requisicao = useRef(0);

  const carregar = useCallback(
    (pagina) => {
      const numero = ++requisicao.current;
      setCarregando(true);
      setErro(false);
      return listarDoTrecho(trechoId, { pagina, tamanho: TAMANHO_PAGINA })
        .then((resposta) => {
          if (numero !== requisicao.current) return;
          setItens((atuais) => (pagina === 0 ? resposta.itens : [...atuais, ...resposta.itens]));
          setTotal(resposta.total);
          setProximaPagina(pagina + 1);
        })
        .catch(() => {
          if (numero === requisicao.current) setErro(true);
        })
        .finally(() => {
          if (numero === requisicao.current) setCarregando(false);
        });
    },
    [trechoId]
  );

  // Recarga do início (trecho ou versão mudou): atualização silenciosa, sem setState síncrono no efeito.
  useEffect(() => {
    const numero = ++requisicao.current;
    listarDoTrecho(trechoId, { pagina: 0, tamanho: TAMANHO_PAGINA })
      .then((resposta) => {
        if (numero !== requisicao.current) return;
        setItens(resposta.itens);
        setTotal(resposta.total);
        setProximaPagina(1);
        setErro(false);
      })
      .catch(() => {
        if (numero === requisicao.current) setErro(true);
      })
      .finally(() => {
        if (numero === requisicao.current) setCarregando(false);
      });
  }, [trechoId, versao]);

  const carregarMais = useCallback(() => carregar(proximaPagina), [carregar, proximaPagina]);
  const tentarNovamente = useCallback(
    () => carregar(itens.length === 0 ? 0 : proximaPagina),
    [carregar, itens.length, proximaPagina]
  );

  return { itens, total, carregando, erro, temMais: itens.length < total, carregarMais, tentarNovamente };
}
