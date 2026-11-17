import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * Protege rotas aninhadas (`<Route element={<RotaProtegida />}>`) ou um filho direto.
 * Sem login leva para /entrar guardando o caminho de volta; `apenasAdmin` devolve o cidadão ao mapa.
 * Isto é só conforto de navegação: quem barra de verdade é o backend.
 */
export default function RotaProtegida({ apenasAdmin = false, children }) {
  const { autenticado, ehAdmin } = useAuth();
  const local = useLocation();

  if (!autenticado) {
    const retorno = encodeURIComponent(`${local.pathname}${local.search}`);
    return <Navigate to={`/entrar?retorno=${retorno}`} replace />;
  }
  if (apenasAdmin && !ehAdmin) {
    return <Navigate to="/app" replace />;
  }
  return children ?? <Outlet />;
}
