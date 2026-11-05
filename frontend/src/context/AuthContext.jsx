import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { EVENTO_SESSAO_EXPIRADA } from "../config/authConfig";
import { login as loginNaApi, registrar as registrarNaApi } from "../services/authService";
import { lerSessao, limparSessao, salvarSessao } from "../services/sessaoStorage";

const AuthContext = createContext(null);

// setTimeout aceita no máximo ~24,8 dias; uma sessão de 2 h nunca chega perto, mas protege o limite.
const ATRASO_MAXIMO_MS = 2 ** 31 - 1;
const AVISO_EXPIRADA = "Sua sessão expirou. Entre novamente.";

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(lerSessao);
  const [aviso, setAviso] = useState(null);

  const expirar = useCallback(() => {
    limparSessao();
    setSessao(null);
    setAviso(AVISO_EXPIRADA);
  }, []);

  // O backend avisa (401) quando o token deixa de valer.
  useEffect(() => {
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, expirar);
    return () => window.removeEventListener(EVENTO_SESSAO_EXPIRADA, expirar);
  }, [expirar]);

  // Também expira sozinho no horário, sem esperar uma requisição falhar.
  useEffect(() => {
    if (!sessao) return undefined;
    const restante = new Date(sessao.expiraEm).getTime() - Date.now();
    const temporizador = setTimeout(expirar, Math.min(Math.max(restante, 0), ATRASO_MAXIMO_MS));
    return () => clearTimeout(temporizador);
  }, [sessao, expirar]);

  const iniciarSessao = useCallback((dados) => {
    const nova = { token: dados.token, expiraEm: dados.expiraEm, usuario: dados.usuario };
    salvarSessao(nova);
    setSessao(nova);
    setAviso(null);
    return dados.usuario;
  }, []);

  const entrar = useCallback(async (credenciais) => iniciarSessao(await loginNaApi(credenciais)), [iniciarSessao]);

  const cadastrar = useCallback(async (dados) => iniciarSessao(await registrarNaApi(dados)), [iniciarSessao]);

  const sair = useCallback(() => {
    limparSessao();
    setSessao(null);
    setAviso(null);
  }, []);

  const limparAviso = useCallback(() => setAviso(null), []);

  const valor = useMemo(
    () => ({
      usuario: sessao?.usuario ?? null,
      autenticado: sessao !== null,
      ehAdmin: sessao?.usuario?.perfil === "ADMINISTRADOR",
      aviso,
      entrar,
      cadastrar,
      sair,
      limparAviso,
    }),
    [sessao, aviso, entrar, cadastrar, sair, limparAviso]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error("useAuth precisa ser usado dentro de um AuthProvider");
  }
  return contexto;
}
