import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../../hooks/useAuth";
import AppNavbar from "../AppNavbar";
import RotaProtegida from "../RotaProtegida";

vi.mock("../../hooks/useAuth", () => ({ useAuth: vi.fn() }));

function montarNavbar(auth) {
  useAuth.mockReturnValue(auth);
  return render(
    <MemoryRouter>
      <AppNavbar />
    </MemoryRouter>
  );
}

function montarRota(auth) {
  useAuth.mockReturnValue(auth);
  return render(
    <MemoryRouter initialEntries={["/app/moderacao"]}>
      <Routes>
        <Route path="/app" element={<p>mapa</p>} />
        <Route element={<RotaProtegida apenasAdmin />}>
          <Route path="/app/moderacao" element={<p>tela de moderação</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

const cidadao = { autenticado: true, ehAdmin: false, usuario: { nome: "Ana Lima", email: "a@b.c" }, sair: vi.fn() };
const admin = { ...cidadao, ehAdmin: true };

describe("navegação da moderação", () => {
  afterEach(cleanup);

  it("cidadão não vê o item Moderação", () => {
    montarNavbar(cidadao);
    expect(screen.queryByTitle("Moderação")).toBeNull();
  });

  it("anônimo não vê o item Moderação", () => {
    montarNavbar({ autenticado: false, ehAdmin: false, usuario: null, sair: vi.fn() });
    expect(screen.queryByTitle("Moderação")).toBeNull();
  });

  it("administrador vê o item Moderação", () => {
    montarNavbar(admin);
    expect(screen.getByTitle("Moderação").getAttribute("href")).toBe("/app/moderacao");
  });

  it("cidadão é redirecionado de /app/moderacao", () => {
    montarRota(cidadao);
    expect(screen.getByText("mapa")).toBeTruthy();
    expect(screen.queryByText("tela de moderação")).toBeNull();
  });

  it("administrador acessa /app/moderacao", () => {
    montarRota(admin);
    expect(screen.getByText("tela de moderação")).toBeTruthy();
  });
});
