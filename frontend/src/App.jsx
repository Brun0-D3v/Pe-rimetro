import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Avaliacao from "./pages/Avaliacao";
import Dashboard from "./pages/Dashboard";
import Mapa from "./pages/Mapa";
import Ocorrencia from "./pages/Ocorrencia";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Moderacao from "./pages/Moderacao";
import Perfil from "./pages/Perfil";
import RotaProtegida from "./components/RotaProtegida";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Landing />} />
        <Route path="app" element={<Layout />}>
          <Route index element={<Mapa />} />
          <Route path="avaliacao" element={<Avaliacao />} />
          <Route path="ocorrencia" element={<Ocorrencia />} />
          <Route path="dashboard" element={<Dashboard />} />
        </Route>
        <Route element={<Layout />}>
          <Route path="entrar" element={<Login />} />
          <Route path="cadastrar" element={<Cadastro />} />
          <Route element={<RotaProtegida />}>
            <Route path="app/perfil" element={<Perfil />} />
            <Route element={<RotaProtegida apenasAdmin />}>
              <Route path="app/moderacao" element={<Moderacao />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
