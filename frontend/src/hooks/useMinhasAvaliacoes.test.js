import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buscarMinhasAvaliacoes } from "../services/usuarioService";
import { useMinhasAvaliacoes } from "./useMinhasAvaliacoes";

vi.mock("../services/usuarioService", () => ({ buscarMinhasAvaliacoes: vi.fn() }));

const item = (id) => ({ id, trechoNome: `Trecho ${id}` });

describe("useMinhasAvaliacoes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("carrega a primeira página", async () => {
    buscarMinhasAvaliacoes.mockResolvedValue({ itens: [item("a"), item("b")], pagina: 0, tamanho: 20, total: 2 });
    const { result } = renderHook(() => useMinhasAvaliacoes());
    expect(result.current.carregando).toBe(true);

    await waitFor(() => expect(result.current.carregando).toBe(false));

    expect(result.current.itens.map((i) => i.id)).toEqual(["a", "b"]);
    expect(result.current.temMais).toBe(false);
    expect(buscarMinhasAvaliacoes).toHaveBeenCalledWith({ pagina: 0, tamanho: 20 });
  });

  it("carregarMais acrescenta a página seguinte", async () => {
    buscarMinhasAvaliacoes
      .mockResolvedValueOnce({ itens: [item("a")], pagina: 0, tamanho: 20, total: 2 })
      .mockResolvedValueOnce({ itens: [item("b")], pagina: 1, tamanho: 20, total: 2 });
    const { result } = renderHook(() => useMinhasAvaliacoes());
    await waitFor(() => expect(result.current.temMais).toBe(true));

    await act(() => result.current.carregarMais());

    expect(buscarMinhasAvaliacoes).toHaveBeenLastCalledWith({ pagina: 1, tamanho: 20 });
    expect(result.current.itens.map((i) => i.id)).toEqual(["a", "b"]);
    expect(result.current.temMais).toBe(false);
  });

  it("falha na primeira página marca erro e permite tentar de novo", async () => {
    buscarMinhasAvaliacoes.mockRejectedValueOnce(new Error("rede"));
    const { result } = renderHook(() => useMinhasAvaliacoes());
    await waitFor(() => expect(result.current.erro).toBe(true));

    buscarMinhasAvaliacoes.mockResolvedValueOnce({ itens: [item("a")], pagina: 0, tamanho: 20, total: 1 });
    await act(() => result.current.tentarNovamente());

    expect(result.current.erro).toBe(false);
    expect(result.current.itens).toHaveLength(1);
  });
});
