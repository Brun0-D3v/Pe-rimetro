import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { editarOcorrencia, excluirOcorrencia } from "../../services/ocorrenciaService";
import { buscarMinhasOcorrencias } from "../../services/usuarioService";
import MinhasOcorrencias from "./MinhasOcorrencias";

const CAT_BURACO = "3f6c2a10-8b1e-4c57-9d2a-1a2b3c4d5e61";
const CAT_CALCADA = "7d9e4b22-5f30-4a8c-b6e1-9c8d7e6f5a42";

vi.mock("../../services/usuarioService", () => ({ buscarMinhasOcorrencias: vi.fn() }));
vi.mock("../../services/ocorrenciaService", () => ({
  editarOcorrencia: vi.fn(),
  excluirOcorrencia: vi.fn(),
  listarCategorias: vi.fn(),
}));
const mockCategorias = vi.hoisted(() => ({
  lista: [
    { id: "3f6c2a10-8b1e-4c57-9d2a-1a2b3c4d5e61", nome: "Buraco" },
    { id: "7d9e4b22-5f30-4a8c-b6e1-9c8d7e6f5a42", nome: "Calçada quebrada" },
  ],
}));
vi.mock("../../hooks/useCategorias", () => ({
  useCategorias: () => ({
    categorias: mockCategorias.lista,
    carregando: false,
    erro: null,
  }),
}));
vi.mock("../../hooks/useImagemAutenticada", () => ({
  useImagemAutenticada: (id) => ({ url: `blob:foto-${id}`, erro: null }),
}));

const visivel = {
  id: "o1",
  trechoId: "t1",
  trechoNome: "Rua da Aurora",
  categoria: { id: CAT_BURACO, nome: "Buraco" },
  descricao: "Buraco grande",
  status: "VISIVEL",
  fotos: [{ id: "f1" }],
  criadoEm: "2026-11-05T15:30:00Z",
};
const oculta = { ...visivel, id: "o2", trechoNome: "Av. Norte", status: "OCULTA", fotos: [] };

function respostaCom(itens, total = itens.length) {
  return { itens, pagina: 0, tamanho: 20, total };
}

function montar() {
  return render(
    <MemoryRouter>
      <MinhasOcorrencias />
    </MemoryRouter>
  );
}

describe("MinhasOcorrencias", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCategorias.lista = [
      { id: CAT_BURACO, nome: "Buraco" },
      { id: CAT_CALCADA, nome: "Calçada quebrada" },
    ];
  });
  afterEach(cleanup);

  it("lista com categoria, miniatura, data e selo de visibilidade", async () => {
    buscarMinhasOcorrencias.mockResolvedValue(respostaCom([visivel, oculta]));
    montar();

    expect(await screen.findByText("Rua da Aurora")).toBeTruthy();
    expect(screen.getAllByText("Buraco").length).toBeGreaterThan(0);
    expect(screen.getByText("Visível")).toBeTruthy();
    expect(screen.getByText("Oculta pela moderação")).toBeTruthy();
    expect(screen.getAllByText(/05\/11\/2026/).length).toBeGreaterThan(0);
    expect(screen.getByRole("img").getAttribute("src")).toBe("blob:foto-f1");
  });

  it("mostra o estado vazio", async () => {
    buscarMinhasOcorrencias.mockResolvedValue(respostaCom([]));
    montar();
    expect(await screen.findByText("Você ainda não reportou nenhum problema.")).toBeTruthy();
  });

  it("refaz a busca ao filtrar por visibilidade", async () => {
    buscarMinhasOcorrencias.mockResolvedValue(respostaCom([visivel]));
    montar();
    await screen.findByText("Rua da Aurora");
    expect(buscarMinhasOcorrencias).toHaveBeenLastCalledWith({ status: undefined, pagina: 0, tamanho: 20 });

    fireEvent.change(screen.getByLabelText("Visibilidade"), { target: { value: "OCULTA" } });

    await waitFor(() =>
      expect(buscarMinhasOcorrencias).toHaveBeenLastCalledWith({ status: "OCULTA", pagina: 0, tamanho: 20 })
    );
  });

  it("tem link Ver no mapa para o trecho", async () => {
    buscarMinhasOcorrencias.mockResolvedValue(respostaCom([visivel]));
    montar();
    const link = await screen.findByRole("link", { name: "Ver no mapa" });
    expect(link.getAttribute("href")).toBe("/app?trecho=t1");
  });

  it("editar e excluir só aparecem quando VISIVEL", async () => {
    buscarMinhasOcorrencias.mockResolvedValue(respostaCom([visivel, oculta]));
    montar();
    await screen.findByText("Av. Norte");
    expect(screen.getAllByRole("button", { name: "Editar" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Excluir" })).toHaveLength(1);
  });

  it("excluir pede confirmação; confirmado chama DELETE e o item sai da lista", async () => {
    buscarMinhasOcorrencias.mockResolvedValue(respostaCom([visivel]));
    excluirOcorrencia.mockResolvedValue();
    montar();
    await screen.findByText("Rua da Aurora");

    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    expect(excluirOcorrencia).not.toHaveBeenCalled();
    expect(screen.getByText(/Excluir esta ocorrência/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Confirmar exclusão" }));

    await waitFor(() => expect(excluirOcorrencia).toHaveBeenCalledWith("o1"));
    await waitFor(() => expect(screen.queryByText("Rua da Aurora")).toBeNull());
  });

  it("cancelar a exclusão não chama DELETE", async () => {
    buscarMinhasOcorrencias.mockResolvedValue(respostaCom([visivel]));
    montar();
    await screen.findByText("Rua da Aurora");
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(excluirOcorrencia).not.toHaveBeenCalled();
    expect(screen.getByText("Rua da Aurora")).toBeTruthy();
  });

  it("mostra a mensagem do servidor quando a exclusão falha", async () => {
    buscarMinhasOcorrencias.mockResolvedValue(respostaCom([visivel]));
    excluirOcorrencia.mockRejectedValue({ response: { data: { mensagem: "Ocorrência já foi ocultada." } } });
    montar();
    await screen.findByText("Rua da Aurora");
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar exclusão" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Ocorrência já foi ocultada.");
  });

  it("editar abre categoria e descrição preenchidas; salvar chama PUT", async () => {
    buscarMinhasOcorrencias.mockResolvedValue(respostaCom([visivel]));
    editarOcorrencia.mockResolvedValue({
      ...visivel,
      categoria: { id: CAT_CALCADA, nome: "Calçada quebrada" },
      descricao: "Calçada destruída",
    });
    montar();
    await screen.findByText("Rua da Aurora");

    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    expect(screen.getByLabelText("Categoria").value).toBe(CAT_BURACO);
    expect(screen.getByLabelText("Descrição").value).toBe("Buraco grande");

    fireEvent.change(screen.getByLabelText("Categoria"), { target: { value: CAT_CALCADA } });
    fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "Calçada destruída" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(editarOcorrencia).toHaveBeenCalledWith("o1", { categoriaId: CAT_CALCADA, descricao: "Calçada destruída" })
    );
    expect(await screen.findByText("Calçada quebrada")).toBeTruthy();
  });

  it("após salvar mostra a descrição normalizada devolvida pelo servidor", async () => {
    buscarMinhasOcorrencias.mockResolvedValue(respostaCom([visivel]));
    editarOcorrencia.mockResolvedValue({ ...visivel, descricao: "Texto normalizado" });
    montar();
    await screen.findByText("Rua da Aurora");

    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "  Texto normalizado  " } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Texto normalizado")).toBeTruthy();
  });

  it("enquanto as categorias carregam, mantém a categoria atual como opção do select", async () => {
    mockCategorias.lista = [];
    buscarMinhasOcorrencias.mockResolvedValue(respostaCom([visivel]));
    montar();
    await screen.findByText("Rua da Aurora");
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    const select = screen.getByLabelText("Categoria");
    expect(select.value).toBe(CAT_BURACO);
    expect(select.options).toHaveLength(1);
  });
});
