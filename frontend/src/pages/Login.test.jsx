import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../hooks/useAuth";
import Login from "./Login";

vi.mock("../hooks/useAuth", () => ({ useAuth: vi.fn() }));

function Destino() {
  const local = useLocation();
  return <p data-testid="destino">{`${local.pathname}${local.search}`}</p>;
}

function montar(auth, url = "/entrar") {
  useAuth.mockReturnValue(auth);
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/entrar" element={<Login />} />
        <Route path="/app" element={<Destino />} />
        <Route path="/app/dashboard" element={<Destino />} />
        <Route path="/cadastrar" element={<Destino />} />
      </Routes>
    </MemoryRouter>
  );
}

function preencher(email, senha) {
  fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Senha"), { target: { value: senha } });
}

describe("Login", () => {
  let entrar;

  beforeEach(() => {
    entrar = vi.fn();
  });
  afterEach(cleanup);

  it("valida antes de chamar o servidor e foca o primeiro campo inválido", () => {
    montar({ autenticado: false, entrar, aviso: null });

    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(entrar).not.toHaveBeenCalled();
    expect(screen.getByText("Informe o e-mail.")).toBeTruthy();
    expect(screen.getByText("Informe a senha.")).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByLabelText("E-mail"));
  });

  it("entra e vai para o mapa por padrão", async () => {
    entrar.mockResolvedValue({});
    montar({ autenticado: false, entrar, aviso: null });

    preencher(" ana@exemplo.com ", "senha-segura");
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => expect(screen.getByTestId("destino").textContent).toBe("/app"));
    expect(entrar).toHaveBeenCalledWith({ email: "ana@exemplo.com", senha: "senha-segura" });
  });

  it("volta ao caminho do parâmetro retorno quando ele é interno", async () => {
    entrar.mockResolvedValue({});
    montar({ autenticado: false, entrar, aviso: null }, "/entrar?retorno=%2Fapp%2Fdashboard");

    preencher("ana@exemplo.com", "senha-segura");
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => expect(screen.getByTestId("destino").textContent).toBe("/app/dashboard"));
  });

  it("mostra a mensagem do backend quando a senha está errada", async () => {
    entrar.mockRejectedValue({ response: { data: { mensagem: "E-mail ou senha incorretos" } } });
    montar({ autenticado: false, entrar, aviso: null });

    preencher("ana@exemplo.com", "errada-errada");
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect((await screen.findByRole("alert")).textContent).toBe("E-mail ou senha incorretos");
    expect(screen.getByRole("button", { name: "Entrar" }).disabled).toBe(false);
  });

  it("mostra mensagem de conexão quando não há resposta do servidor", async () => {
    entrar.mockRejectedValue(new Error("Network Error"));
    montar({ autenticado: false, entrar, aviso: null });

    preencher("ana@exemplo.com", "senha-segura");
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect((await screen.findByRole("alert")).textContent).toContain("Verifique a conexão");
  });

  it("exibe o aviso de sessão expirada", () => {
    montar({ autenticado: false, entrar, aviso: "Sua sessão expirou. Entre novamente." });
    expect(screen.getByRole("status").textContent).toBe("Sua sessão expirou. Entre novamente.");
  });

  it("quem já está logado é redirecionado", () => {
    montar({ autenticado: true, entrar, aviso: null });
    expect(screen.getByTestId("destino").textContent).toBe("/app");
  });

  it("o link de cadastro preserva o retorno", () => {
    montar({ autenticado: false, entrar, aviso: null }, "/entrar?retorno=%2Fapp%2Fdashboard");
    const link = screen.getByRole("link", { name: "Cadastre-se" });
    expect(link.getAttribute("href")).toBe("/cadastrar?retorno=%2Fapp%2Fdashboard");
  });
});
