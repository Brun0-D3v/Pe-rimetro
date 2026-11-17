import { useCallback, useEffect, useState } from "react";
import { buscarMinhasOcorrencias } from "../services/usuarioService";

const TAMANHO_PAGINA = 20;

// `status`: undefined (todas), "VISIVEL" ou "OCULTA".
export function useMinhasOcorrencias() {
  const [status, setStatus] = useState(undefined);
  const [itens, setItens] = useState([]);
  const [total, setTotal] = useState(0);
  const [proximaPagina, setProximaPagina] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  // Primeira página (e ao trocar o filtro ou tentar de novo); ignora respostas de filtros antigos.
  useEffect(() => {
    let cancelado = false;
    buscarMinhasOcorrencias({ status, pagina: 0, tamanho: TAMANHO_PAGINA })
      .then((resposta) => {
        if (cancelado) return;
        setItens(resposta.itens);
        setTotal(resposta.total);
        setProximaPagina(1);
      })
      .catch(() => !cancelado && setErro(true))
      .finally(() => !cancelado && setCarregando(false));
    return () => {
      cancelado = true;
    };
  }, [status, tentativa]);

  const mudarStatus = useCallback((novo) => {
    setItens([]);
    setTotal(0);
    setErro(false);
    setCarregando(true);
    setStatus(novo || undefined);
  }, []);

  const carregarMais = useCallback(() => {
    setCarregando(true);
    setErro(false);
    return buscarMinhasOcorrencias({ status, pagina: proximaPagina, tamanho: TAMANHO_PAGINA })
      .then((resposta) => {
        setItens((atuais) => [...atuais, ...resposta.itens]);
        setTotal(resposta.total);
        setProximaPagina(proximaPagina + 1);
      })
      .catch(() => setErro(true))
      .finally(() => setCarregando(false));
  }, [status, proximaPagina]);

  const tentarNovamente = useCallback(() => {
    if (itens.length > 0) return carregarMais();
    setErro(false);
    setCarregando(true);
    setTentativa((n) => n + 1);
    return undefined;
  }, [itens.length, carregarMais]);

  const remover = useCallback((id) => {
    setItens((atuais) => atuais.filter((o) => o.id !== id));
    setTotal((t) => Math.max(0, t - 1));
  }, []);

  const atualizar = useCallback((id, alteracoes) => {
    setItens((atuais) => atuais.map((o) => (o.id === id ? { ...o, ...alteracoes } : o)));
  }, []);

  return {
    itens,
    total,
    status,
    carregando,
    erro,
    temMais: itens.length < total,
    mudarStatus,
    carregarMais,
    tentarNovamente,
    remover,
    atualizar,
  };
}
