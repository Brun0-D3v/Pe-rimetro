import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CHAVE_PREFERENCIAS,
  percentualDoTamanho,
  TAMANHO_FONTE_PADRAO,
  tamanhoValido,
} from "../config/preferenciasConfig";
import { PreferenciasContext } from "./preferenciasContexto";

function lerTamanhoSalvo() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_PREFERENCIAS) ?? "null");
    return tamanhoValido(salvo?.tamanhoFonte) ? salvo.tamanhoFonte : TAMANHO_FONTE_PADRAO;
  } catch {
    return TAMANHO_FONTE_PADRAO;
  }
}

export function PreferenciasProvider({ children }) {
  const [tamanhoFonte, setTamanhoFonteEstado] = useState(lerTamanhoSalvo);

  // Sincroniza com o documento (sistema externo): o tamanho vale em todas as páginas.
  useEffect(() => {
    document.documentElement.style.fontSize = `${percentualDoTamanho(tamanhoFonte)}%`;
  }, [tamanhoFonte]);

  const definirTamanhoFonte = useCallback((valor) => {
    if (!tamanhoValido(valor)) return;
    setTamanhoFonteEstado(valor);
    try {
      localStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify({ tamanhoFonte: valor }));
    } catch {
      // localStorage indisponível: a preferência só dura até recarregar a página
    }
  }, []);

  const valor = useMemo(() => ({ tamanhoFonte, definirTamanhoFonte }), [tamanhoFonte, definirTamanhoFonte]);

  return <PreferenciasContext.Provider value={valor}>{children}</PreferenciasContext.Provider>;
}
