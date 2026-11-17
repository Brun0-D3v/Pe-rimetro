import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../hooks/useAuth";
import RotaProtegida from "./RotaProtegida";

vi.mock("../hooks/useAuth", () => ({ useAuth: vi.fn() }));

function Local() {
  const local = useLocation();
  return <p data-testid="local">{`${local.pathname}${local.search}`}</p>;
}

function montar(auth, { apenasAdmin = false, inicial = "/app/moderacao?aba=1" } = {}) {
  useAuth.mockReturnValue(auth);
  return render(
    <MemoryRouter initialEntries={[inicial]}>
      <Routes>
        <Route path="/entrar" element={<Local />} />
        <Route path="/app" element={<p>mapa</p>} />
        <Route element={<RotaProtegida apenasAdmin={apenasAdmin} />}>
          <Route path="/app/moderacao" element={<p>conteúdo protegido</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe("RotaProtegida", () => {
  afterEach(cleanup);

  it("sem login leva a /entrar guardando o caminho de volta", () => {
    montar({ autenticado: false, ehAdmin: false });
    expect(screen.getByTestId("local").textContent).toBe("/entrar?retorno=%2Fapp%2Fmoderacao%3Faba%3D1");
  });

  it("com login mostra o conteúdo", () => {
    montar({ autenticado: true, ehAdmin: false });
    expect(screen.getByText("conteúdo protegido")).toBeTruthy();
  });

  it("rota de administrador devolve o cidadão ao mapa", () => {
    montar({ autenticado: true, ehAdmin: false }, { apenasAdmin: true });
    expect(screen.getByText("mapa")).toBeTruthy();
    expect(screen.queryByText("conteúdo protegido")).toBeNull();
  });

  it("rota de administrador libera o administrador", () => {
    montar({ autenticado: true, ehAdmin: true }, { apenasAdmin: true });
    expect(screen.getByText("conteúdo protegido")).toBeTruthy();
  });
});
