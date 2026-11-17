import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useOcorrenciasDoTrecho } from "../../hooks/useOcorrenciasDoTrecho";
import ListaOcorrenciasTrecho from "./ListaOcorrenciasTrecho";

vi.mock("../../hooks/useOcorrenciasDoTrecho", () => ({ useOcorrenciasDoTrecho: vi.fn() }));
vi.mock("../../services/ocorrenciaService", () => ({ urlDaFoto: (id) => `http://api/fotos/${id}` }));

const ocorrencia = {
  id: "o1",
  trechoId: "t1",
  trechoNome: "Rua da Aurora",
  categoria: { id: "c1", nome: "Calçada quebrada" },
  descricao: "Buraco grande perto do poste",
  status: "ABERTA",
  fotos: [{ id: "f1" }, { id: "f2" }],
  criadoEm: "2026-11-10T15:00:00Z",
};

function estado(sobrescrever = {}) {
  return {
    itens: [ocorrencia],
    total: 1,
    carregando: false,
    erro: false,
    temMais: false,
    carregarMais: vi.fn(),
    tentarNovamente: vi.fn(),
    ...sobrescrever,
  };
}

function montar(sobrescrever) {
  const valor = estado(sobrescrever);
  useOcorrenciasDoTrecho.mockReturnValue(valor);
  render(<ListaOcorrenciasTrecho trechoId="t1" versao={0} />);
  return valor;
}

describe("ListaOcorrenciasTrecho", () => {
  afterEach(cleanup);

  it("carrega e mostra categoria, descrição, data e fotos", () => {
    montar();

    expect(screen.getByText("Problemas reportados (1)")).toBeTruthy();
    expect(screen.getByText("Calçada quebrada")).toBeTruthy();
    expect(screen.getByText("Buraco grande perto do poste")).toBeTruthy();
    expect(screen.getByText(new Date("2026-11-10T15:00:00Z").toLocaleDateString("pt-BR"))).toBeTruthy();
    const fotos = screen.getAllByAltText("Foto do problema reportado: Calçada quebrada");
    expect(fotos).toHaveLength(2);
    expect(fotos[0].getAttribute("src")).toBe("http://api/fotos/f1");
    expect(fotos[0].getAttribute("loading")).toBe("lazy");
  });

  it("sem ocorrências mostra a mensagem de vazio", () => {
    montar({ itens: [], total: 0 });

    expect(screen.getByText("Nenhum problema reportado neste trecho.")).toBeTruthy();
  });

  it("no erro mostra a mensagem e o botão Tentar de novo", () => {
    const valor = montar({ itens: [], total: 0, erro: true });

    expect(screen.getByText("Não foi possível carregar os problemas reportados.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(valor.tentarNovamente).toHaveBeenCalled();
  });

  it("com mais de uma página oferece Carregar mais", () => {
    const valor = montar({ total: 25, temMais: true });

    fireEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
    expect(valor.carregarMais).toHaveBeenCalled();
  });

  it("sem mais páginas não mostra Carregar mais", () => {
    montar();

    expect(screen.queryByRole("button", { name: "Carregar mais" })).toBeNull();
  });

  it("nunca mostra nome de autor", () => {
    montar({ itens: [{ ...ocorrencia, autor: { nome: "Maria Autora" }, autorNome: "Maria Autora" }] });

    expect(screen.queryByText(/Maria Autora/)).toBeNull();
  });
});
