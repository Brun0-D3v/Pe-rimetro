# Sprint 03 Fase 1 - Localização em Tempo Real Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mostrar no mapa a posição do usuário em tempo real (ponto + círculo de precisão), com botão "Minha localização", avisos de erro e testes do hook.

**Architecture:** Um hook `useLocalizacao` envolve `navigator.geolocation.watchPosition` e expõe estado + posição. `Mapa.jsx` liga o hook ao `MapaLeaflet`, que desenha `MarcadorUsuario` e centraliza o mapa sob demanda; o `ControlesMapa` ganha o botão. Nada é enviado ao backend. O Vitest é introduzido só para testar o hook.

**Tech Stack:** React 19, Vite 8, react-leaflet 5, Leaflet, lucide-react, Tailwind 4, oxlint, Vitest + jsdom + @testing-library/react (novo).

**Spec:** `docs/superpowers/specs/2026-11-03-sprint03-localizacao-avaliacoes-design.md` (seção "Fase 1")

## Global Constraints

- Repositório de código: `C:\PROJETO PÉ-RÍMETRO` (frontend em `frontend/`). Vault: `C:\CLAUDE\PÉ-RÍMETRO` (repositório git separado).
- A posição do usuário **nunca sai do navegador**: nada é enviado ao backend nem gravado.
- A permissão do navegador só é solicitada **após um clique do usuário**, nunca ao abrir a página.
- Geolocation API exige HTTPS ou `localhost`.
- O mapa **não segue o usuário à força**: centraliza no primeiro fix após o clique, e de novo a cada novo clique no botão.
- Um único conjunto de ícones: `lucide-react` (já dependência do projeto).
- Sem testes de frontend além de `useLocalizacao`. Verificação do restante: `npm run lint`, `npm run build` e verificação manual.
- Código e comentários do projeto em português; nomes de arquivos/funções em português, como no código existente.
- Vault: REGRA 04 (usar a data real da sessão em `data_atualizacao`; nunca alterar `data_criacao` de nota existente), REGRA 02 (wikilinks), REGRA 10 (não apagar histórico), frontmatter obrigatório.

---

### Task 1: Vitest e hook `useLocalizacao`

**Files:**
- Modify: `frontend/package.json` (script `test` e devDependencies, via npm)
- Modify: `frontend/vite.config.js`
- Create: `frontend/src/hooks/useLocalizacao.js`
- Test: `frontend/src/hooks/useLocalizacao.test.js`

**Interfaces:**
- Produces: `useLocalizacao()` retorna `{ posicao, precisao, estado, erro, ativar, desativar }` onde:
  - `posicao`: `{ lat: number, lng: number } | null`
  - `precisao`: `number | null` (metros)
  - `estado`: `"inativo" | "buscando" | "ativo" | "negado" | "indisponivel" | "sem_suporte"`
  - `erro`: `string | null` (mensagem em português; não nulo apenas em `negado`, `indisponivel`, `sem_suporte`)
  - `ativar(): void`, `desativar(): void`

- [ ] **Step 1: Instalar o Vitest**

Run (em `C:\PROJETO PÉ-RÍMETRO\frontend`):
```bash
npm install -D vitest jsdom @testing-library/react
```
Expected: instalação sem erro de peer dependency com Vite 8. Se o npm reclamar de peer dependency do Vite, rode `npm view vitest peerDependencies` e instale a versão mais recente de `vitest` cuja faixa inclua o Vite instalado; não use `--force`.

- [ ] **Step 2: Configurar o Vitest e o script de teste**

Substituir o conteúdo de `frontend/vite.config.js` por:
```js
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
  },
})
```
Em `frontend/package.json`, adicionar ao bloco `scripts`, depois de `"lint": "oxlint",`:
```json
    "test": "vitest run",
```

- [ ] **Step 3: Escrever os testes que falham**

Criar `frontend/src/hooks/useLocalizacao.test.js`:
```js
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
```

- [ ] **Step 4: Rodar os testes e ver falhar**

Run: `npm test` (em `frontend/`)
Expected: FAIL com erro de resolução de import de `./useLocalizacao` (arquivo não existe).

- [ ] **Step 5: Implementar o hook**

Criar `frontend/src/hooks/useLocalizacao.js`:
```js
import { useCallback, useEffect, useRef, useState } from "react";

const OPCOES_WATCH = { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 };
const LIMIAR_MOVIMENTO_METROS = 5;
const RAIO_TERRA_METROS = 6371000;

const MENSAGENS = {
  negado:
    "Permissão de localização negada. Para usar este recurso, libere o acesso à localização nas configurações do navegador e tente de novo.",
  indisponivel: "Não foi possível obter sua posição agora. Verifique o sinal de GPS ou da rede.",
  sem_suporte: "Este navegador não oferece localização.",
};

function geolocalizacaoSuportada() {
  return typeof navigator !== "undefined" && Boolean(navigator.geolocation);
}

// Distância aproximada (haversine) entre dois pontos { lat, lng }, em metros.
function distanciaMetros(a, b) {
  const paraRadianos = (graus) => (graus * Math.PI) / 180;
  const dLat = paraRadianos(b.lat - a.lat);
  const dLng = paraRadianos(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(paraRadianos(a.lat)) * Math.cos(paraRadianos(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RAIO_TERRA_METROS * Math.asin(Math.sqrt(h));
}

export function useLocalizacao() {
  const [posicao, setPosicao] = useState(null);
  const [precisao, setPrecisao] = useState(null);
  const [estado, setEstado] = useState(() => (geolocalizacaoSuportada() ? "inativo" : "sem_suporte"));
  const idWatchRef = useRef(null);
  const ultimaPosicaoRef = useRef(null);

  const encerrarWatch = useCallback(() => {
    if (idWatchRef.current !== null) {
      navigator.geolocation.clearWatch(idWatchRef.current);
      idWatchRef.current = null;
    }
  }, []);

  const aoPosicionar = useCallback((leitura) => {
    const nova = { lat: leitura.coords.latitude, lng: leitura.coords.longitude };
    const anterior = ultimaPosicaoRef.current;
    if (!anterior || distanciaMetros(anterior, nova) >= LIMIAR_MOVIMENTO_METROS) {
      ultimaPosicaoRef.current = nova;
      setPosicao(nova);
    }
    setPrecisao(leitura.coords.accuracy);
    setEstado("ativo");
  }, []);

  const aoFalhar = useCallback(
    (falha) => {
      if (falha.code === 1) {
        encerrarWatch();
        setEstado("negado");
        return;
      }
      setEstado("indisponivel");
    },
    [encerrarWatch]
  );

  const ativar = useCallback(() => {
    if (!geolocalizacaoSuportada()) {
      setEstado("sem_suporte");
      return;
    }
    if (idWatchRef.current !== null) return;
    setEstado("buscando");
    idWatchRef.current = navigator.geolocation.watchPosition(aoPosicionar, aoFalhar, OPCOES_WATCH);
  }, [aoPosicionar, aoFalhar]);

  const desativar = useCallback(() => {
    encerrarWatch();
    ultimaPosicaoRef.current = null;
    setPosicao(null);
    setPrecisao(null);
    setEstado(geolocalizacaoSuportada() ? "inativo" : "sem_suporte");
  }, [encerrarWatch]);

  // Ao desmontar, só encerra o watch (sem setState em componente desmontado).
  useEffect(() => encerrarWatch, [encerrarWatch]);

  return { posicao, precisao, estado, erro: MENSAGENS[estado] ?? null, ativar, desativar };
}
```

- [ ] **Step 6: Rodar os testes e ver passar**

Run: `npm test`
Expected: PASS, 11 testes. Rodar também `npm run lint` e esperar sem erros.

- [ ] **Step 7: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vite.config.js frontend/src/hooks/useLocalizacao.js frontend/src/hooks/useLocalizacao.test.js
git commit -m "Adiciona hook useLocalizacao e Vitest para testa-lo"
```
(Terminar a mensagem com a linha de coautoria definida na sessão.)

---

### Task 2: Marcador, aviso, botão e integração no mapa

**Files:**
- Create: `frontend/src/components/mapa/MarcadorUsuario.jsx`
- Create: `frontend/src/components/mapa/AvisoLocalizacao.jsx`
- Modify: `frontend/src/components/mapa/ControlesMapa.jsx`
- Modify: `frontend/src/components/mapa/MapaLeaflet.jsx`
- Modify: `frontend/src/pages/Mapa.jsx`

**Interfaces:**
- Consumes: `useLocalizacao()` da Task 1 (`posicao`, `precisao`, `estado`, `erro`, `ativar`).
- Produces: `ControlesMapa` aceita as novas props `aoLocalizar: () => void` e `estadoLocalizacao: string`. `MapaLeaflet` aceita as novas props `posicaoUsuario`, `precisaoUsuario`, `pedidoCentralizar: number`, `estadoLocalizacao`, `aoLocalizar`.

- [ ] **Step 1: Criar `MarcadorUsuario`**

`frontend/src/components/mapa/MarcadorUsuario.jsx`:
```jsx
import { Circle, CircleMarker } from "react-leaflet";

const COR_USUARIO = "#3b82f6";

// Ponto do usuário com halo e círculo de precisão. Não é interativo:
// não deve capturar cliques destinados aos trechos por baixo.
export default function MarcadorUsuario({ posicao, precisao }) {
  if (!posicao) return null;
  const centro = [posicao.lat, posicao.lng];

  return (
    <>
      {precisao != null && (
        <Circle
          center={centro}
          radius={precisao}
          pathOptions={{
            color: COR_USUARIO,
            weight: 1,
            fillColor: COR_USUARIO,
            fillOpacity: 0.12,
            interactive: false,
          }}
        />
      )}
      <CircleMarker
        center={centro}
        radius={8}
        pathOptions={{
          color: "#ffffff",
          weight: 3,
          fillColor: COR_USUARIO,
          fillOpacity: 1,
          interactive: false,
        }}
      />
    </>
  );
}
```

- [ ] **Step 2: Criar `AvisoLocalizacao`**

`frontend/src/components/mapa/AvisoLocalizacao.jsx`:
```jsx
// Mostra o andamento ("buscando") ou o motivo de a localização não funcionar.
export default function AvisoLocalizacao({ estado, erro, className = "" }) {
  const texto = estado === "buscando" ? "Buscando sua localização..." : erro;
  if (!texto) return null;

  return (
    <p
      role="status"
      className={[
        "max-w-sm rounded-2xl border border-base-4 bg-base-3 px-4 py-3 text-sm text-texto shadow-sm",
        className,
      ].join(" ")}
    >
      {texto}
    </p>
  );
}
```

- [ ] **Step 3: Atualizar `ControlesMapa`**

Em `frontend/src/components/mapa/ControlesMapa.jsx`:

Trocar a linha de import dos ícones por:
```jsx
import { Crosshair, House, Minus, Plus } from "lucide-react";
```
Trocar a assinatura do componente por:
```jsx
export default function ControlesMapa({ centroPadrao, zoomPadrao, aoLocalizar, estadoLocalizacao }) {
```
Logo após a constante `classeBotao`, adicionar:
```jsx
  const classeLocalizacao = [
    classeBotao,
    estadoLocalizacao === "ativo" ? "text-accent-tech" : "",
    estadoLocalizacao === "buscando" ? "animate-pulse" : "",
  ].join(" ");
```
Dentro do `<div ref={elementoRef} ...>`, **antes** do botão de zoom in, inserir:
```jsx
      <button
        type="button"
        onClick={aoLocalizar}
        aria-label="Minha localização"
        title="Minha localização"
        className={classeLocalizacao}
      >
        <Crosshair size={16} />
      </button>
```
E no botão "Voltar à visualização inicial", trocar `<LocateFixed size={16} />` por `<House size={16} />`.

- [ ] **Step 4: Atualizar `MapaLeaflet`**

Em `frontend/src/components/mapa/MapaLeaflet.jsx`:

Adicionar ao topo, junto dos imports:
```jsx
import MarcadorUsuario from "./MarcadorUsuario";
```
Depois da função `RecentralizarMapa`, adicionar:
```jsx
const ZOOM_LOCALIZACAO = 17;

// Centraliza no usuário apenas quando `pedido` muda (clique no botão ou primeiro fix).
function CentralizarNaPosicao({ posicao, pedido }) {
  const mapa = useMap();
  useEffect(() => {
    if (pedido > 0 && posicao) {
      mapa.flyTo([posicao.lat, posicao.lng], ZOOM_LOCALIZACAO);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedido]);
  return null;
}
```
Na assinatura do componente `MapaLeaflet`, acrescentar as props (antes de `className = ""`):
```jsx
  posicaoUsuario,
  precisaoUsuario,
  pedidoCentralizar = 0,
  estadoLocalizacao,
  aoLocalizar,
```
Dentro do `<MapContainer>`, logo depois de `<RecentralizarMapa centro={centro} />`, adicionar:
```jsx
      <CentralizarNaPosicao posicao={posicaoUsuario} pedido={pedidoCentralizar} />
```
Logo depois do `{trechos.map(...)}` e **antes** de `{children}`, adicionar:
```jsx
      <MarcadorUsuario posicao={posicaoUsuario} precisao={precisaoUsuario} />
```
E trocar a linha do `ControlesMapa` por:
```jsx
      <ControlesMapa
        centroPadrao={CENTRO_PADRAO}
        zoomPadrao={ZOOM_PADRAO}
        aoLocalizar={aoLocalizar}
        estadoLocalizacao={estadoLocalizacao}
      />
```

- [ ] **Step 5: Ligar o hook em `Mapa.jsx`**

Em `frontend/src/pages/Mapa.jsx`:

Mudar o import do React para:
```jsx
import { useEffect, useMemo, useRef, useState } from "react";
```
Adicionar os imports:
```jsx
import AvisoLocalizacao from "../components/mapa/AvisoLocalizacao";
import { useLocalizacao } from "../hooks/useLocalizacao";
```
Dentro de `MapaConteudo`, **antes** de qualquer `return` condicional (os hooks precisam rodar sempre), logo depois da linha `const { regioes } = useRegioes();`, adicionar:
```jsx
  const { posicao: posicaoUsuario, precisao, estado: estadoLocalizacao, erro: erroLocalizacao, ativar } =
    useLocalizacao();
  const [pedidoCentralizar, setPedidoCentralizar] = useState(0);
  const aguardandoPrimeiroFix = useRef(false);

  function aoLocalizar() {
    if (estadoLocalizacao === "ativo" && posicaoUsuario) {
      setPedidoCentralizar((atual) => atual + 1);
      return;
    }
    aguardandoPrimeiroFix.current = true;
    ativar();
  }

  useEffect(() => {
    if (estadoLocalizacao === "ativo" && posicaoUsuario && aguardandoPrimeiroFix.current) {
      aguardandoPrimeiroFix.current = false;
      setPedidoCentralizar((atual) => atual + 1);
    }
  }, [estadoLocalizacao, posicaoUsuario]);
```
No `<MapaLeaflet ...>`, acrescentar as props:
```jsx
        posicaoUsuario={posicaoUsuario}
        precisaoUsuario={precisao}
        pedidoCentralizar={pedidoCentralizar}
        estadoLocalizacao={estadoLocalizacao}
        aoLocalizar={aoLocalizar}
```
Logo antes de `<PainelDetalheTrecho ...>`, adicionar:
```jsx
      <AvisoLocalizacao
        estado={estadoLocalizacao}
        erro={erroLocalizacao}
        className="absolute bottom-24 left-1/2 z-[1000] -translate-x-1/2"
      />
```

- [ ] **Step 6: Lint, build e testes**

Run (em `frontend/`): `npm run lint && npm test && npm run build`
Expected: os três terminam sem erro. Se `House` não existir na versão instalada de `lucide-react`, o build acusa; nesse caso usar `Home` no lugar, no import e no JSX.

- [ ] **Step 7: Verificação manual**

Run: `npm run dev` com backend e Postgres no ar (`docker compose up -d` na raiz e `./mvnw spring-boot:run` em `backend/`). Abrir `http://localhost:5173/app/mapa` (a rota exata é a do mapa em `App.jsx`) e conferir:
1. Ao abrir, **nenhum pedido de permissão** aparece.
2. Clicar em "Minha localização": o navegador pede permissão; ao permitir, aparece o aviso "Buscando..." e depois o ponto azul com o círculo de precisão, e o mapa voa para a posição com zoom 17.
3. Arrastar o mapa para longe: o mapa **não volta sozinho**. Clicar de novo no botão: recentraliza.
4. Clicar nos trechos continua funcionando mesmo com o círculo de precisão por cima (o marcador não captura cliques).
5. Negar a permissão (ou bloquear no cadeado do navegador): aparece o aviso de permissão negada com a instrução.
6. O botão de "voltar à visualização inicial" agora tem o ícone de casa e continua voltando ao centro padrão.
7. Alternar tema claro/escuro: o ponto e o aviso continuam legíveis.
Em DevTools, "Sensors" permite simular posições para ver o ponto se mover.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/components/mapa/MarcadorUsuario.jsx frontend/src/components/mapa/AvisoLocalizacao.jsx frontend/src/components/mapa/ControlesMapa.jsx frontend/src/components/mapa/MapaLeaflet.jsx frontend/src/pages/Mapa.jsx
git commit -m "Mostra a localizacao do usuario em tempo real no mapa"
```
(Terminar a mensagem com a linha de coautoria definida na sessão.)

---

### Task 3: Documentação da Fase 1 no Vault

**Files (todos em `C:\CLAUDE\PÉ-RÍMETRO`):**
- Create: `12 - Decisões/ADR-012 - Geolocalização do Usuário no Navegador.md`
- Create: `05 - Arquitetura/Localização em Tempo Real.md`
- Modify: `12 - Decisões/Índice de Decisões.md`
- Modify: `05 - Arquitetura/Mapa e Geolocalização.md`
- Modify: `03 - UX-UI/Mapa - UX.md`
- Modify: `02 - PRODUTO/Priorização MoSCoW.md`
- Modify: `16 - Ideias/Ideias de UX.md`
- Modify: `09 - Sprints/Sprint 03 - Avaliações e Índice.md`
- Modify: `00 - Sistema/Status do Projeto.md`
- Modify: `00 - Sistema/Índice do Vault.md`
- Create: `Diario/<data da sessão>.md` (ou editar o diário do dia, se já existir)

Em todas as edições, `data_atualizacao` recebe a **data real da sessão** (`YYYY-MM-DD`); `data_criacao` de notas existentes não muda. Novas notas usam a data real da sessão em `data_criacao` e `data_atualizacao`.

- [ ] **Step 1: Criar a ADR-012**

`12 - Decisões/ADR-012 - Geolocalização do Usuário no Navegador.md`:
```markdown
---
tipo: adr
titulo: "ADR-012 - Geolocalização do Usuário no Navegador"
tags:
  - perimetro
  - decisao
  - frontend
data_criacao: <data da sessão>
data_atualizacao: <data da sessão>
status: decidida
---

# ADR-012 — Geolocalização do Usuário no Navegador

## Contexto

O mapa ([[Mapa - UX]]) mostrava os trechos, mas não onde o usuário estava. A localização em tempo real foi definida como prioridade da [[Sprint 03 - Avaliações e Índice|Sprint 03]]. Não fazia parte do [[MVP]] nem da [[Priorização MoSCoW]] originais: é escopo novo, decidido em 2026-11-03.

## Problema

Como obter e exibir a posição do usuário, e onde essa informação deve viver?

## Opções consideradas

1. **Geolocation API do navegador, sem backend** — a posição existe só no cliente.
2. **Enviar a posição ao backend** — habilitaria histórico e detecção de trecho no servidor, mas cria dado pessoal sensível (localização) e exige política de privacidade e LGPD.

## Decisão

Adotada a **Opção 1**. O hook `useLocalizacao` usa `navigator.geolocation.watchPosition` e o mapa desenha um ponto com círculo de precisão ([[Localização em Tempo Real]]).

- A permissão só é pedida após um clique do usuário.
- A posição **nunca é enviada ao backend nem gravada**.
- O mapa não segue o usuário à força: centraliza no primeiro fix e a cada clique no botão.
- Introduzido o **Vitest** (com jsdom e Testing Library) para testar o hook; o restante do frontend continua verificado por lint, build e verificação manual.

## Justificativa

Atende ao que foi pedido (ver onde se está) com o menor risco: sem dado pessoal armazenado, sem mudança no backend. O Vitest foi o único modo razoável de testar o hook com `navigator.geolocation` simulado.

## Consequências

- A Geolocation API exige **HTTPS ou `localhost`**: HTTPS passa a ser pré-requisito do deploy (junto da chave do Stadia, ver [[ADR-010 - Provedor de Tiles Stadia Maps]]).
- "Avaliar o trecho onde estou", trecho mais próximo e rastreio de caminhada ficam fora de escopo; registrados em [[Ideias de UX]]. Qualquer um deles que envie posição ao servidor exigirá nova ADR e análise de privacidade.
- Aplicativo mobile nativo continua fora do escopo; a feature funciona no navegador, inclusive em celulares.

## Status

**Decidida.**

## Decisões relacionadas

- [[ADR-004 - Leaflet e OpenStreetMap]]
- [[ADR-010 - Provedor de Tiles Stadia Maps]]
```

- [ ] **Step 2: Criar a nota `Localização em Tempo Real`**

`05 - Arquitetura/Localização em Tempo Real.md`:
```markdown
---
tipo: nota
titulo: "Localização em Tempo Real"
tags:
  - perimetro
  - tecnico
  - frontend
  - arquitetura
data_criacao: <data da sessão>
data_atualizacao: <data da sessão>
status: ativo
---

# Localização em Tempo Real

## O que é

O mapa mostra a posição do usuário como um ponto azul com um círculo que indica a precisão da leitura. Decisão em [[ADR-012 - Geolocalização do Usuário no Navegador]].

## Como funciona

- O hook `useLocalizacao` (frontend) envolve `navigator.geolocation.watchPosition` e expõe `posicao`, `precisao`, `estado`, `erro`, `ativar` e `desativar`.
- Estados: `inativo`, `buscando`, `ativo`, `negado`, `indisponivel`, `sem_suporte`.
- A posição só é atualizada quando o usuário se move 5 metros ou mais, para não redesenhar o marcador a cada leitura.
- O botão "Minha localização" (controles do mapa) liga o rastreio na primeira vez e recentraliza nas seguintes.

## Regras

- A permissão do navegador é pedida **somente após um clique**.
- A posição **não sai do navegador**: não há chamada ao backend.
- Funciona apenas em HTTPS ou `localhost`.

## Estado atual

Implementado na [[Sprint 03 - Avaliações e Índice|Sprint 03]]. Hook coberto por testes de unidade (Vitest); o restante por verificação manual.

## Relações

- [[Mapa e Geolocalização]]
- [[Mapa - UX]]
- [[ADR-012 - Geolocalização do Usuário no Navegador]]
```

- [ ] **Step 3: Atualizar as notas existentes**

Aplicar cada edição com `data_atualizacao` = data da sessão:

1. `12 - Decisões/Índice de Decisões.md`: adicionar à tabela a linha `| [[ADR-012 - Geolocalização do Usuário no Navegador]] | Geolocalização do Usuário no Navegador | decidida |`. Se o ADR-011 (avaliação anônima) ainda não existir, **não** criar a linha dele aqui; ela entra no plano da Fase 3.
2. `05 - Arquitetura/Mapa e Geolocalização.md`: em "O que já está decidido", adicionar `- **Localização do usuário:** feita no navegador, sem backend — ver [[Localização em Tempo Real]] e [[ADR-012 - Geolocalização do Usuário no Navegador]].` Em "Relações", adicionar `- [[Localização em Tempo Real]]`.
3. `03 - UX-UI/Mapa - UX.md`: em "O que já está decidido", adicionar `- **Localização do usuário:** ponto azul com círculo de precisão e botão "Minha localização" nos controles; o botão de reset passou a usar o ícone de casa. Ver [[Localização em Tempo Real]].`
4. `02 - PRODUTO/Priorização MoSCoW.md`: em "Should Have (Importante - P1)", adicionar `- Localização do usuário no mapa (adicionada em 2026-11-03, prioridade da Sprint 03)`.
5. `16 - Ideias/Ideias de UX.md`: acrescentar uma seção/itens `- Avaliar o trecho onde estou, a partir da posição atual`, `- Destacar o trecho cadastrado mais próximo do usuário`, `- Rastreio de caminhada (exige análise de privacidade/LGPD e nova ADR)`, todos com `status` de ideia, ligando a [[ADR-012 - Geolocalização do Usuário no Navegador]].
6. `09 - Sprints/Sprint 03 - Avaliações e Índice.md`: `status: planejada` -> `status: em_desenvolvimento`; reescrever "Escopo planejado" para a lista da spec (marcar `- [x] Localização em tempo real` e deixar os demais itens `- [ ]`: Testcontainers, avaliações das 6 dimensões e cálculo do índice, frontend de avaliação e índice no mapa); em "Observações", remover "Nenhuma data de início/fim..." e registrar a data de início real da sprint, a decisão de ordem de fases e um link para [[ADR-012 - Geolocalização do Usuário no Navegador]]. Em "Objetivo", acrescentar a localização em tempo real como prioridade.
7. `00 - Sistema/Status do Projeto.md`: em "Estado atual", trocar o fim da frase por `... Próxima: [[Sprint 03 - Avaliações e Índice]] (em desenvolvimento: localização em tempo real concluída).` Em "O que já está decidido", adicionar `- Geolocalização do usuário no navegador, sem backend — [[ADR-012 - Geolocalização do Usuário no Navegador]]`. Adicionar um marco à tabela com a data da sessão.
8. `00 - Sistema/Índice do Vault.md`: na linha da pasta 05 - Arquitetura, adicionar `[[Localização em Tempo Real]]`; na linha das decisões, adicionar `[[ADR-012 - Geolocalização do Usuário no Navegador]]`.

- [ ] **Step 4: Diário**

Criar (ou completar) `Diario/<data da sessão>.md` a partir de [[Template - Diário]], registrando: localização em tempo real implementada, Vitest introduzido, ícone do reset trocado, decisões (posição só no navegador), e próximos passos (Fase 2: Testcontainers).

- [ ] **Step 5: Verificar links e commitar no Vault**

Conferir que todo `[[wikilink]]` das notas criadas/alteradas resolve para uma nota existente. Depois:
```bash
git -C "C:/CLAUDE/PÉ-RÍMETRO" add -A
git -C "C:/CLAUDE/PÉ-RÍMETRO" status --short
git -C "C:/CLAUDE/PÉ-RÍMETRO" commit -m "Documenta a localizacao em tempo real (Sprint 03 Fase 1)"
```
(Terminar a mensagem com a linha de coautoria definida na sessão.) Atenção: não incluir no commit arquivos alheios a esta tarefa (como mudanças em `.obsidian/`); adicionar por caminho se `git status` mostrar outros arquivos.
