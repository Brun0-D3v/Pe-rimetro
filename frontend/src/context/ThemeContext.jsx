import { createContext, useContext, useEffect, useState } from "react";
import { TEMA_CLARO, TEMA_ESCURO } from "../config/mapaConfig";

const CHAVE_LOCALSTORAGE = "perimetro-tema";

const ThemeContext = createContext(null);

function lerTemaSalvo() {
  try {
    const salvo = localStorage.getItem(CHAVE_LOCALSTORAGE);
    return salvo === TEMA_CLARO ? TEMA_CLARO : TEMA_ESCURO;
  } catch {
    return TEMA_ESCURO;
  }
}

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(lerTemaSalvo);

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_LOCALSTORAGE, tema);
    } catch {
      // localStorage indisponível (ex.: navegação privada) — preferência só dura a sessão atual
    }
  }, [tema]);

  function alternarTema() {
    setTema((atual) => (atual === TEMA_ESCURO ? TEMA_CLARO : TEMA_ESCURO));
  }

  return <ThemeContext.Provider value={{ tema, alternarTema }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const contexto = useContext(ThemeContext);
  if (!contexto) {
    throw new Error("useTheme precisa ser usado dentro de um ThemeProvider");
  }
  return contexto;
}
