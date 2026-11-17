import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../hooks/useAuth";
import Cadastro from "./Cadastro";

vi.mock("../hooks/useAuth", () => ({ useAuth: vi.fn() }));

function Destino() {
  const local = useLocation();
  return <p data-testid="destino">{local.pathname}</p>;
}

function montar(auth) {
  useAuth.mockReturnValue(auth);
  return render(
    <MemoryRouter initialEntries={["/cadastrar"]}>
      <Routes>
        <Route path="/cadastrar" element={<Cadastro />} />
        <Route path="/app" element={<Destino />} />
      </Routes>
    </MemoryRouter>
  );
}

function preencher({ nome, email, senha }) {
  fireEvent.change(screen.getByLabelText("Nome"), { target: { value: nome } });
  fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Senha"), { target: { value: senha } });
}

describe("Cadastro", () => {
  let cadastrar;

  beforeEach(() => {
    cadastrar = vi.fn();
  });
  afterEach(cleanup);

  it("mostra os erros dos limites e não chama o servidor", () => {
    montar({ autenticado: false, cadastrar });

    preencher({ nome: "A", email: "sem-arroba", senha: "curta" });
    fireEvent.click(screen.getByRole("button", { name: "Criar conta" }));

    expect(cadastrar).not.toHaveBeenCalled();
    expect(screen.getByText(/O nome deve ter entre 2 e 120/)).toBeTruthy();
    expect(screen.getByText("Informe um e-mail válido.")).toBeTruthy();
    expect(screen.getByText(/A senha deve ter entre 8 e 72/)).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByLabelText("Nome"));
  });

  it("cria a conta e leva ao mapa", async () => {
    cadastrar.mockResolvedValue({});
    montar({ autenticado: false, cadastrar });

    preencher({ nome: " Ana ", email: "ana@exemplo.com", senha: "senha-segura" });
    fireEvent.click(screen.getByRole("button", { name: "Criar conta" }));

    await waitFor(() => expect(screen.getByTestId("destino").textContent).toBe("/app"));
    expect(cadastrar).toHaveBeenCalledWith({ nome: "Ana", email: "ana@exemplo.com", senha: "senha-segura" });
  });

  it("mostra o conflito de e-mail já cadastrado vindo do backend", async () => {
    cadastrar.mockRejectedValue({ response: { status: 409, data: { mensagem: "E-mail já cadastrado" } } });
    montar({ autenticado: false, cadastrar });

    preencher({ nome: "Ana", email: "ana@exemplo.com", senha: "senha-segura" });
    fireEvent.click(screen.getByRole("button", { name: "Criar conta" }));

    expect((await screen.findByRole("alert")).textContent).toBe("E-mail já cadastrado");
  });
});
