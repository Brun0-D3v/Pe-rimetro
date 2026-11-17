import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../../hooks/useAuth";
import PainelDetalheTrecho from "./PainelDetalheTrecho";

vi.mock("../../hooks/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("./FormularioAvaliacao", () => ({ default: () => <p>formulário de avaliação</p> }));
vi.mock("../ocorrencia/FormularioOcorrencia", () => ({
  default: ({ aoConcluir }) => (
    <div>
      <p>formulário de ocorrência</p>
      <button onClick={() => aoConcluir({ id: "o1" }, { fotosPendentes: 0 })}>concluir</button>
      <button onClick={() => aoConcluir({ id: "o1" }, { fotosPendentes: 1 })}>concluir com pendência</button>
    </div>
  ),
}));

const trecho = {
  id: "t1",
  nome: "Rua da Aurora",
  status: "ATIVO",
  classificacao: null,
  indiceAtual: null,
  totalAvaliacoes: 0,
};

function montar(auth, trechoExibido = trecho, aoReportado = () => {}) {
  useAuth.mockReturnValue(auth);
  const criarElemento = () => (
    <MemoryRouter>
      <PainelDetalheTrecho trecho={trechoExibido} aoFechar={() => {}} aoAvaliado={() => {}} aoReportado={aoReportado} />
    </MemoryRouter>
  );
  const resultado = render(criarElemento());
  // Elemento novo a cada vez: reaproveitar o mesmo faria o React pular a renderização.
  return { ...resultado, remontar: () => resultado.rerender(criarElemento()) };
}

describe("PainelDetalheTrecho e o login", () => {
  afterEach(cleanup);

  it("sem login convida a entrar em vez de mostrar o botão de avaliar", () => {
    montar({ autenticado: false });

    expect(screen.getByText("Entre para avaliar este trecho.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Entrar" }).getAttribute("href")).toBe("/entrar?retorno=%2Fapp");
    expect(screen.getByRole("link", { name: "Criar conta" }).getAttribute("href")).toBe("/cadastrar?retorno=%2Fapp");
    expect(screen.queryByRole("button", { name: "Avaliar este trecho" })).toBeNull();
  });

  it("sem login, trecho inativo só explica que não recebe avaliações", () => {
    montar({ autenticado: false }, { ...trecho, status: "INATIVO" });

    expect(screen.getByText("Trechos inativos não recebem avaliações.")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Entrar" })).toBeNull();
  });

  it("logado mostra o botão e abre o formulário", () => {
    montar({ autenticado: true });

    fireEvent.click(screen.getByRole("button", { name: "Avaliar este trecho" }));

    expect(screen.getByText("formulário de avaliação")).toBeTruthy();
    expect(screen.queryByText("Entre para avaliar este trecho.")).toBeNull();
  });

  it("se a sessão expira com o formulário aberto, o formulário some e o convite aparece", () => {
    const { remontar } = montar({ autenticado: true });
    fireEvent.click(screen.getByRole("button", { name: "Avaliar este trecho" }));
    expect(screen.getByText("formulário de avaliação")).toBeTruthy();

    useAuth.mockReturnValue({ autenticado: false });
    remontar();

    expect(screen.queryByText("formulário de avaliação")).toBeNull();
    expect(screen.getByText("Entre para avaliar este trecho.")).toBeTruthy();
  });

  it("sem login convida a entrar para reportar problema", () => {
    montar({ autenticado: false });

    expect(screen.getByText("Entre para reportar um problema.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Reportar problema" })).toBeNull();
  });

  it("logado abre o formulário de ocorrência e ao concluir confirma e avisa o mapa", () => {
    const aoReportado = vi.fn();
    montar({ autenticado: true }, trecho, aoReportado);

    fireEvent.click(screen.getByRole("button", { name: "Reportar problema" }));
    expect(screen.getByText("formulário de ocorrência")).toBeTruthy();
    expect(screen.queryByText("formulário de avaliação")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "concluir" }));
    expect(aoReportado).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Ocorrência registrada. Obrigado!")).toBeTruthy();
    expect(screen.queryByText("formulário de ocorrência")).toBeNull();
  });

  it("com foto pendente o formulário continua aberto", () => {
    const aoReportado = vi.fn();
    montar({ autenticado: true }, trecho, aoReportado);

    fireEvent.click(screen.getByRole("button", { name: "Reportar problema" }));
    fireEvent.click(screen.getByRole("button", { name: "concluir com pendência" }));

    expect(aoReportado).toHaveBeenCalledTimes(1);
    expect(screen.getByText("formulário de ocorrência")).toBeTruthy();
    expect(screen.queryByText("Ocorrência registrada. Obrigado!")).toBeNull();
  });

  it("trecho inativo desabilita reportar problema", () => {
    montar({ autenticado: true }, { ...trecho, status: "INATIVO" });

    expect(screen.getByRole("button", { name: "Reportar problema" }).disabled).toBe(true);
  });
});
