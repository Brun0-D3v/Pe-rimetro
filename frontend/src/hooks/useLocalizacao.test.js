import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useLocalizacao } from "./useLocalizacao";

function criarGeolocationFalso() {
  const geo = {
    aoPosicionar: null,
    aoFalhar: null,
    watchPosition: vi.fn((sucesso, falha) => {
      geo.aoPosicionar = sucesso;
      geo.aoFalhar = falha;
      return 7;
    }),
    clearWatch: vi.fn(),
  };
  return geo;
}

function instalarGeolocation(valor) {
  Object.defineProperty(globalThis.navigator, "geolocation", { value: valor, configurable: true });
}

function leitura(latitude, longitude, accuracy = 12) {
  return { coords: { latitude, longitude, accuracy } };
}

afterEach(() => {
  instalarGeolocation(undefined);
});

describe("useLocalizacao", () => {
  it("informa sem_suporte quando o navegador não tem geolocalização", () => {
    instalarGeolocation(undefined);
    const { result } = renderHook(() => useLocalizacao());

    expect(result.current.estado).toBe("sem_suporte");
    expect(result.current.erro).toMatch(/navegador/i);
    act(() => result.current.ativar());
    expect(result.current.estado).toBe("sem_suporte");
  });

  it("começa inativo e não pede permissão ao montar", () => {
    const geo = criarGeolocationFalso();
    instalarGeolocation(geo);
    const { result } = renderHook(() => useLocalizacao());

    expect(result.current.estado).toBe("inativo");
    expect(result.current.posicao).toBeNull();
    expect(result.current.erro).toBeNull();
    expect(geo.watchPosition).not.toHaveBeenCalled();
  });

  it("ativar muda para buscando e inicia o watchPosition com alta precisão", () => {
    const geo = criarGeolocationFalso();
    instalarGeolocation(geo);
    const { result } = renderHook(() => useLocalizacao());

    act(() => result.current.ativar());

    expect(result.current.estado).toBe("buscando");
    expect(geo.watchPosition).toHaveBeenCalledTimes(1);
    expect(geo.watchPosition.mock.calls[0][2]).toMatchObject({ enableHighAccuracy: true });
  });

  it("não abre um segundo watch se já estiver ativado", () => {
    const geo = criarGeolocationFalso();
    instalarGeolocation(geo);
    const { result } = renderHook(() => useLocalizacao());

    act(() => result.current.ativar());
    act(() => result.current.ativar());

    expect(geo.watchPosition).toHaveBeenCalledTimes(1);
  });

  it("primeiro fix define posição, precisão e estado ativo", () => {
    const geo = criarGeolocationFalso();
    instalarGeolocation(geo);
    const { result } = renderHook(() => useLocalizacao());
    act(() => result.current.ativar());

    act(() => geo.aoPosicionar(leitura(-8.0631, -34.8711, 15)));

    expect(result.current.estado).toBe("ativo");
    expect(result.current.posicao).toEqual({ lat: -8.0631, lng: -34.8711 });
    expect(result.current.precisao).toBe(15);
  });

  it("ignora movimento menor que 5 metros, mas atualiza a precisão", () => {
    const geo = criarGeolocationFalso();
    instalarGeolocation(geo);
    const { result } = renderHook(() => useLocalizacao());
    act(() => result.current.ativar());
    act(() => geo.aoPosicionar(leitura(-8.0631, -34.8711, 15)));
    const primeira = result.current.posicao;

    act(() => geo.aoPosicionar(leitura(-8.06311, -34.8711, 9)));

    expect(result.current.posicao).toBe(primeira);
    expect(result.current.precisao).toBe(9);
  });

  it("atualiza a posição quando o movimento é relevante", () => {
    const geo = criarGeolocationFalso();
    instalarGeolocation(geo);
    const { result } = renderHook(() => useLocalizacao());
    act(() => result.current.ativar());
    act(() => geo.aoPosicionar(leitura(-8.0631, -34.8711)));

    act(() => geo.aoPosicionar(leitura(-8.0641, -34.8711)));

    expect(result.current.posicao).toEqual({ lat: -8.0641, lng: -34.8711 });
  });

  it("permissão negada vira estado negado e encerra o watch", () => {
    const geo = criarGeolocationFalso();
    instalarGeolocation(geo);
    const { result } = renderHook(() => useLocalizacao());
    act(() => result.current.ativar());

    act(() => geo.aoFalhar({ code: 1 }));

    expect(result.current.estado).toBe("negado");
    expect(result.current.erro).toMatch(/permiss/i);
    expect(geo.clearWatch).toHaveBeenCalledWith(7);
  });

  it("posição indisponível mantém o watch e se recupera no próximo fix", () => {
    const geo = criarGeolocationFalso();
    instalarGeolocation(geo);
    const { result } = renderHook(() => useLocalizacao());
    act(() => result.current.ativar());

    act(() => geo.aoFalhar({ code: 2 }));
    expect(result.current.estado).toBe("indisponivel");
    expect(geo.clearWatch).not.toHaveBeenCalled();

    act(() => geo.aoPosicionar(leitura(-8.0631, -34.8711)));
    expect(result.current.estado).toBe("ativo");
    expect(result.current.erro).toBeNull();
  });

  it("desativar volta a inativo, limpa a posição e chama clearWatch", () => {
    const geo = criarGeolocationFalso();
    instalarGeolocation(geo);
    const { result } = renderHook(() => useLocalizacao());
    act(() => result.current.ativar());
    act(() => geo.aoPosicionar(leitura(-8.0631, -34.8711)));

    act(() => result.current.desativar());

    expect(result.current.estado).toBe("inativo");
    expect(result.current.posicao).toBeNull();
    expect(geo.clearWatch).toHaveBeenCalledWith(7);
  });

  it("chama clearWatch ao desmontar", () => {
    const geo = criarGeolocationFalso();
    instalarGeolocation(geo);
    const { result, unmount } = renderHook(() => useLocalizacao());
    act(() => result.current.ativar());

    unmount();

    expect(geo.clearWatch).toHaveBeenCalledWith(7);
  });
});
