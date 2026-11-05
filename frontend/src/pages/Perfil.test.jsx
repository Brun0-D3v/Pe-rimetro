import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../hooks/useAuth";
import Perfil from "./Perfil";

vi.mock("../hooks/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("../components/perfil/ResumoAtividade", () => ({ default: () => <p>seção resumo</p> }));
vi.mock("../components/perfil/DadosConta", () => ({ default: () => <p>seção dados</p> }));
vi.mock("../components/perfil/MinhasAvaliacoes", () => ({ default: () => <p>seção avaliações</p> }));
vi.mock("../components/perfil/AlterarSenha", () => ({ default: () => <p>seção senha</p> }));
vi.mock("../components/perfil/AtalhosAdmin", () => ({ default: () => <p>seção admin</p> }));
vi.mock("../components/perfil/PreferenciasAcessibilidade", () => ({ default: () => <p>seção acessibilidade</p> }));

function montar(auth) {
  useAuth.mockReturnValue(auth);
  return render(
    <MemoryRouter initialEntries={["/app/perfil"]}>
      <Routes>
        <Route path="/app/perfil" element={<Perfil />} />
        <Route path="/" element={<p>página inicial</p>} />
      </Routes>
    </MemoryRouter>
  );
}

const ana = { id: "u1", nome: "Ana", email: "ana@exemplo.com", perfil: "CIDADAO" };

describe("Perfil", () => {
  afterEach(cleanup);

  it("junta as seções do cidadão, sem os atalhos de administração", () => {
    montar({ usuario: ana, ehAdmin: false, sair: vi.fn() });

    for (const texto of ["seção resumo", "seção dados", "seção avaliações", "seção senha", "seção acessibilidade"]) {
      expect(screen.getByText(texto)).toBeTruthy();
    }
    expect(screen.queryByText("seção admin")).toBeNull();
  });

  it("administrador vê os atalhos de administração", () => {
    montar({ usuario: { ...ana, perfil: "ADMINISTRADOR" }, ehAdmin: true, sair: vi.fn() });
    expect(screen.getByText("seção admin")).toBeTruthy();
  });

  it("Sair da conta encerra a sessão e volta à página inicial", () => {
    const sair = vi.fn();
    montar({ usuario: ana, ehAdmin: false, sair });

    fireEvent.click(screen.getByRole("button", { name: "Sair da conta" }));

    expect(sair).toHaveBeenCalledTimes(1);
    expect(screen.getByText("página inicial")).toBeTruthy();
  });
});
