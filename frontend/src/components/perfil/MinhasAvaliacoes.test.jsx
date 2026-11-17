import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMinhasAvaliacoes } from "../../hooks/useMinhasAvaliacoes";
import MinhasAvaliacoes from "./MinhasAvaliacoes";

vi.mock("../../hooks/useMinhasAvaliacoes", () => ({ useMinhasAvaliacoes: vi.fn() }));

const avaliacao = {
  id: "a1",
  trechoId: "t1",
  trechoNome: "Rua da Aurora",
  notaCalcada: 8,
  notaAcessibilidade: 6,
  notaIluminacao: 4,
  notaArborizacao: 2,
  notaTravessias: 0,
  notaMobiliario: 10,
  indice: 5.4,
  classificacao: "MEDIO",
  indiceAtualDoTrecho: 7.25,
  criadoEm: "2026-11-05T15:30:00Z",
};

function montar(estado) {
  useMinhasAvaliacoes.mockReturnValue({
    itens: [],
    total: 0,
    carregando: false,
    erro: false,
    temMais: false,
    carregarMais: vi.fn(),
    tentarNovamente: vi.fn(),
    ...estado,
  });
  return render(
    <MemoryRouter>
      <MinhasAvaliacoes />
    </MemoryRouter>
  );
}

describe("MinhasAvaliacoes", () => {
  afterEach(cleanup);

  it("mostra o estado vazio", () => {
    montar({});
    expect(screen.getByText("Você ainda não avaliou nenhum trecho.")).toBeTruthy();
  });

  it("mostra o carregamento inicial", () => {
    montar({ carregando: true });
    expect(screen.getByText("Carregando...")).toBeTruthy();
    expect(screen.queryByText("Você ainda não avaliou nenhum trecho.")).toBeNull();
  });

  it("mostra o erro com botão para tentar de novo", () => {
    const tentarNovamente = vi.fn();
    montar({ erro: true, tentarNovamente });

    fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));

    expect(screen.getByRole("alert").textContent).toContain("Não foi possível carregar suas avaliações.");
    expect(tentarNovamente).toHaveBeenCalledTimes(1);
  });

  it("mostra trecho, 6 notas, índice com a faixa, índice atual e link para o mapa", () => {
    montar({ itens: [avaliacao], total: 1 });

    expect(screen.getByText("Rua da Aurora")).toBeTruthy();
    expect(screen.getByText("5,4 · Médio")).toBeTruthy();
    expect(screen.getByText("Índice atual do trecho: 7,3")).toBeTruthy();
    expect(screen.getByText("Calçada").nextSibling.textContent).toBe("8");
    expect(screen.getByText("Travessias").nextSibling.textContent).toBe("0");
    expect(screen.getByText("Mobiliário urbano").nextSibling.textContent).toBe("10");
    expect(screen.getByRole("link", { name: "Ver no mapa" }).getAttribute("href")).toBe("/app?trecho=t1");
  });

  it("mostra Carregar mais só quando há mais páginas", () => {
    const carregarMais = vi.fn();
    montar({ itens: [avaliacao], total: 5, temMais: true, carregarMais });

    fireEvent.click(screen.getByRole("button", { name: "Carregar mais" }));

    expect(carregarMais).toHaveBeenCalledTimes(1);
  });

  it("não mostra Carregar mais quando já veio tudo", () => {
    montar({ itens: [avaliacao], total: 1, temMais: false });
    expect(screen.queryByRole("button", { name: "Carregar mais" })).toBeNull();
  });
});
