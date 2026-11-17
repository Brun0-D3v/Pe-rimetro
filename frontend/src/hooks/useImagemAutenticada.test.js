import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import api from "../services/api";
import { useImagemAutenticada } from "./useImagemAutenticada";

vi.mock("../services/api", () => ({ default: { get: vi.fn() } }));

describe("useImagemAutenticada", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = vi.fn(() => "blob:abc");
    URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => vi.restoreAllMocks());

  it("baixa como blob, cria a URL e revoga ao desmontar", async () => {
    const blob = new Blob(["x"]);
    api.get.mockResolvedValue({ data: blob });
    const { result, unmount } = renderHook(() => useImagemAutenticada("f1"));

    await waitFor(() => expect(result.current.url).toBe("blob:abc"));
    expect(api.get).toHaveBeenCalledWith("/fotos/f1", { responseType: "blob" });
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);

    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:abc");
  });

  it("informa erro quando o download falha", async () => {
    api.get.mockRejectedValue(new Error("falhou"));
    const { result } = renderHook(() => useImagemAutenticada("f1"));
    await waitFor(() => expect(result.current.erro).toBeTruthy());
    expect(result.current.url).toBeNull();
  });
});
