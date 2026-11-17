import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { alterarVisibilidade, listarParaModeracao } from "../../services/ocorrenciaService";
import ListaModeracao from "./ListaModeracao";

vi.mock("../../services/ocorrenciaService", () => ({
  listarParaModeracao: vi.fn(),
  alterarVisibilidade: vi.fn(),
}));
vi.mock("../../hooks/useImagemAutenticada", () => ({
  useImagemAutenticada: (id) => ({ url: `blob:foto-${id}`, erro: null }),
}));

const visivel = {
  id: "o1",
  trechoId: "t1",
  trechoNome: "Rua da Aurora",
  categoria: { id: 1, nome: "Buraco" },
  descricao: "Buraco grande",
  status: "VISIVEL",
  fotos: [{ id: "f1" }],
  criadoEm: "2026-11-05T15:30:00Z",
  autorNome: "Maria Souza",
};
const oculta = { ...visivel, id: "o2", trechoNome: "Av. Norte", status: "OCULTA", fotos: [], autorNome: null };

function resposta(itens, total = itens.length) {
  return { itens, pagina: 0, tamanho: 20, total };
}

describe("ListaModeracao", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it("mostra foto, categoria, trecho, autor, data e status", async () => {
    listarParaModeracao.mockResolvedValue(resposta([visivel, oculta]));
    render(<ListaModeracao />);

    expect(await screen.findByText("Rua da Aurora")).toBeTruthy();
    expect(screen.getAllByText("Buraco", { exact: false }).length).toBeGreaterThan(0);
    expect(screen.getByText("Maria Souza", { exact: false })).toBeTruthy();
    expect(screen.getByText("Autor removido", { exact: false })).toBeTruthy();
    expect(screen.getAllByText("05/11/2026", { exact: false }).length).toBeGreaterThan(0);
    expect(screen.getByText("Visível")).toBeTruthy();
    expect(screen.getByText("Oculta")).toBeTruthy();
    expect(screen.getByRole("img").getAttribute("src")).toBe("blob:foto-f1");
  });

  it("filtro de status refaz a busca", async () => {
    listarParaModeracao.mockResolvedValue(resposta([visivel]));
    render(<ListaModeracao />);
    await screen.findByText("Rua da Aurora");

    fireEvent.change(screen.getByLabelText("Visibilidade"), { target: { value: "OCULTA" } });
    await waitFor(() =>
      expect(listarParaModeracao).toHaveBeenLastCalledWith(expect.objectContaining({ status: "OCULTA", pagina: 0 }))
    );
    fireEvent.change(screen.getByLabelText("Visibilidade"), { target: { value: "VISIVEL" } });
    await waitFor(() =>
      expect(listarParaModeracao).toHaveBeenLastCalledWith(expect.objectContaining({ status: "VISIVEL" }))
    );
    fireEvent.change(screen.getByLabelText("Visibilidade"), { target: { value: "" } });
    await waitFor(() =>
      expect(listarParaModeracao).toHaveBeenLastCalledWith(expect.objectContaining({ status: undefined }))
    );
  });

  it("'Moderadas por mim' envia moderadasPorMim=true", async () => {
    listarParaModeracao.mockResolvedValue(resposta([visivel]));
    render(<ListaModeracao />);
    await screen.findByText("Rua da Aurora");

    fireEvent.click(screen.getByLabelText("Moderadas por mim"));
    await waitFor(() =>
      expect(listarParaModeracao).toHaveBeenLastCalledWith(expect.objectContaining({ moderadasPorMim: true }))
    );
  });

  it("item visível só tem Ocultar; item oculta só tem Reexibir", async () => {
    listarParaModeracao.mockResolvedValue(resposta([visivel, oculta]));
    render(<ListaModeracao />);
    await screen.findByText("Rua da Aurora");

    expect(screen.getAllByRole("button", { name: "Ocultar" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Reexibir" })).toHaveLength(1);
  });

  it("Ocultar chama PATCH com OCULTA e atualiza o item sem recarregar", async () => {
    listarParaModeracao.mockResolvedValue(resposta([visivel]));
    alterarVisibilidade.mockResolvedValue({ ...visivel, status: "OCULTA" });
    render(<ListaModeracao />);
    await screen.findByText("Rua da Aurora");

    fireEvent.click(screen.getByRole("button", { name: "Ocultar" }));
    expect(await screen.findByRole("button", { name: "Reexibir" })).toBeTruthy();
    expect(alterarVisibilidade).toHaveBeenCalledWith("o1", "OCULTA");
    expect(screen.queryByRole("button", { name: "Ocultar" })).toBeNull();
    expect(listarParaModeracao).toHaveBeenCalledTimes(1);
  });

  it("desabilita o botão durante a requisição (sem duplo clique)", async () => {
    listarParaModeracao.mockResolvedValue(resposta([visivel]));
    let resolver;
    alterarVisibilidade.mockReturnValue(new Promise((r) => (resolver = r)));
    render(<ListaModeracao />);
    await screen.findByText("Rua da Aurora");

    const botao = screen.getByRole("button", { name: "Ocultar" });
    fireEvent.click(botao);
    expect(botao.disabled).toBe(true);
    fireEvent.click(botao);
    expect(alterarVisibilidade).toHaveBeenCalledTimes(1);
    resolver({ ...visivel, status: "OCULTA" });
    await screen.findByRole("button", { name: "Reexibir" });
  });

  it("erro no PATCH mostra a mensagem e reativa o botão", async () => {
    listarParaModeracao.mockResolvedValue(resposta([visivel]));
    alterarVisibilidade.mockRejectedValue({ response: { data: { mensagem: "Sem permissão" } } });
    render(<ListaModeracao />);
    await screen.findByText("Rua da Aurora");

    fireEvent.click(screen.getByRole("button", { name: "Ocultar" }));
    expect(await screen.findByText("Sem permissão")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ocultar" }).disabled).toBe(false);
  });

  it("trata vazio, carregando e erro de listagem", async () => {
    listarParaModeracao.mockReturnValueOnce(new Promise(() => {}));
    const primeiro = render(<ListaModeracao />);
    expect(screen.getByText("Carregando...")).toBeTruthy();
    primeiro.unmount();

    listarParaModeracao.mockResolvedValueOnce(resposta([]));
    const segundo = render(<ListaModeracao />);
    expect(await screen.findByText("Nenhuma ocorrência encontrada.")).toBeTruthy();
    segundo.unmount();

    listarParaModeracao.mockRejectedValueOnce(new Error("falha"));
    render(<ListaModeracao />);
    expect(await screen.findByText("Não foi possível carregar as ocorrências.")).toBeTruthy();
  });

  it("Carregar mais busca a próxima página", async () => {
    listarParaModeracao.mockResolvedValueOnce(resposta([visivel], 2));
    listarParaModeracao.mockResolvedValueOnce(resposta([oculta], 2));
    render(<ListaModeracao />);
    await screen.findByText("Rua da Aurora");

    fireEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
    expect(await screen.findByText("Av. Norte")).toBeTruthy();
    expect(listarParaModeracao).toHaveBeenLastCalledWith(expect.objectContaining({ pagina: 1 }));
    expect(screen.queryByRole("button", { name: "Carregar mais" })).toBeNull();
  });
});
