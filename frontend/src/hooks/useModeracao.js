import { useCallback, useEffect, useRef, useState } from "react";
import { listarParaModeracao } from "../services/ocorrenciaService";

const TAMANHO_PAGINA = 20;

// `status`: undefined (todas), "VISIVEL" ou "OCULTA".
export function useModeracao() {
  const [status, setStatus] = useState(undefined);
  const [moderadasPorMim, setModeradasPorMim] = useState(false);
  const [itens, setItens] = useState([]);
  const [total, setTotal] = useState(0);
  const [proximaPagina, setProximaPagina] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  // Senha da requisição mais recente: respostas de filtros antigos (ou de "carregar mais" antigo) são descartadas.
  const senha = useRef(0);
  const invalidar = useCallback(() => {
    senha.current += 1;
  }, []);

  useEffect(() => {
    const minha = ++senha.current;
    listarParaModeracao({ status, moderadasPorMim, pagina: 0, tamanho: TAMANHO_PAGINA })
      .then((resposta) => {
        if (minha !== senha.current) return;
        setItens(resposta.itens);
        setTotal(resposta.total);
        setProximaPagina(1);
      })
      .catch(() => minha === senha.current && setErro(true))
      .finally(() => minha === senha.current && setCarregando(false));
    return invalidar;
  }, [status, moderadasPorMim, tentativa, invalidar]);

  const reiniciar = useCallback(() => {
    setItens([]);
    setTotal(0);
    setErro(false);
    setCarregando(true);
  }, []);

  const mudarStatus = useCallback(
    (novo) => {
      reiniciar();
      setStatus(novo || undefined);
    },
    [reiniciar]
  );

  const mudarModeradasPorMim = useCallback(
    (valor) => {
      reiniciar();
      setModeradasPorMim(Boolean(valor));
    },
    [reiniciar]
  );

  const carregarMais = useCallback(() => {
    const minha = ++senha.current;
    setCarregando(true);
    setErro(false);
    return listarParaModeracao({ status, moderadasPorMim, pagina: proximaPagina, tamanho: TAMANHO_PAGINA })
      .then((resposta) => {
        if (minha !== senha.current) return;
        setItens((atuais) => [...atuais, ...resposta.itens]);
        setTotal(resposta.total);
        setProximaPagina(proximaPagina + 1);
      })
      .catch(() => minha === senha.current && setErro(true))
      .finally(() => minha === senha.current && setCarregando(false));
  }, [status, moderadasPorMim, proximaPagina]);

  const tentarNovamente = useCallback(() => {
    if (itens.length > 0) return carregarMais();
    setErro(false);
    setCarregando(true);
    setTentativa((n) => n + 1);
    return undefined;
  }, [itens.length, carregarMais]);

  // Atualiza o item no lugar (sem recarregar a lista).
  const atualizar = useCallback((id, alteracoes) => {
    setItens((atuais) => atuais.map((o) => (o.id === id ? { ...o, ...alteracoes } : o)));
  }, []);

  return {
    itens,
    total,
    status,
    moderadasPorMim,
    carregando,
    erro,
    temMais: itens.length < total,
    mudarStatus,
    mudarModeradasPorMim,
    carregarMais,
    tentarNovamente,
    atualizar,
  };
}
