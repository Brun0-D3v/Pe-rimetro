# Mapa Interativo Desktop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir a experiência desktop completa da tela do Mapa (cabeçalho com busca e alternância de tema, painel lateral de filtros/camadas, legenda, controles de zoom/reset, seleção com detalhe, atribuição cartográfica) com suporte real a tema claro/escuro, mantendo o Leaflet + OpenStreetMap já implementado.

**Architecture:** Nova configuração centralizada de mapa (`config/mapaConfig.js`) alimenta `MapaLeaflet.jsx` (troca de tiles por tema) e um novo `ThemeContext` (persistido em `localStorage`) escopado à página do Mapa via atributo `data-theme`. Componentes novos (`CabecalhoMapa`, `PainelFiltros`, `LegendaMapa`, `ControlesMapa`, `CamadaCaminhabilidadeDemo`) são orquestrados por `pages/Mapa.jsx`, que mantém estado local (filtros, seleção, busca) — nenhum Context novo para dados, só para o tema (que é de fato transversal). `trechoService`/`useTrechos` ganham um filtro opcional por região; um novo `regiaoService`/`useRegioes` alimenta o seletor de região.

**Tech Stack:** React 19, `react-leaflet` + `leaflet` (já em uso, sem novas libs de mapa), tiles raster gratuitos CARTO (`dark_all`/`light_all`, sem API key), Tailwind CSS 4 (tokens via `@theme` + override por `[data-theme="light"]`), `lucide-react` (ícones, já em uso), axios (já em uso). JavaScript puro (`.jsx`), sem TypeScript. Sem suíte de testes automatizados de frontend neste projeto.

**Spec:** `docs/superpowers/specs/2026-10-23-mapa-interativo-desktop-design.md`

## Global Constraints

- **Mapa continua Leaflet + OpenStreetMap** (via CARTO para os dois temas) — não há troca para MapLibre/MapTiler, não há nova variável de ambiente de chave de API.
- **Tema claro/escuro é escopado à tela do Mapa**, via atributo `data-theme` num `<div>` que envolve a página — nunca em `<html>`/`<body>`. Landing, `AppNavbar`, Dashboard, Avaliação e Ocorrência não mudam visualmente.
- **Troca de tema nunca desmonta o `<MapContainer>`**, nunca perde filtros, nunca muda a localização atual — só a URL/atribuição do `TileLayer` muda.
- **Busca de locais é client-side**, sobre os `trechos` já carregados (filtro por `nome`) — não é geocodificação de endereços reais.
- **Camada de caminhabilidade é demonstrativa**, com pontos fixos e categorias fictícias, claramente identificada como "(demonstração)" em qualquer rótulo/popup — nenhum índice real é calculado.
- **Filtro por status (ativo/inativo) é client-side**; filtro por região usa o `?regiaoId=` que o backend já suporta.
- **Controles de zoom são customizados** (`zoomControl={false}` no `MapContainer`), não os controles padrão do Leaflet.
- **Sem suíte de testes automatizados de frontend.** Verificação por tarefa: `npm run lint` + `npm run build`; verificação funcional manual via `npm run dev` na Tarefa 16.
- Todos os comandos abaixo assumem `cwd` em `C:\PROJETO PÉ-RÍMETRO\frontend`, exceto a Tarefa 16 (que também usa a raiz do repo para o Docker Compose e `backend/`).

---

### Task 1: Configuração centralizada do mapa

**Files:**
- Create: `frontend/src/config/mapaConfig.js`

**Interfaces:**
- Produces: `TEMA_ESCURO`, `TEMA_CLARO` (strings), `TILES_POR_TEMA` (`{ [tema]: { url: string, atribuicao: string } }`), `CENTRO_PADRAO` (`[number, number]`), `ZOOM_PADRAO` (`number`). Usado pelas Tasks 2 (ThemeContext), 6 (MapaLeaflet) e 10 (Mapa.jsx).

- [ ] **Step 1: Criar `mapaConfig.js`**

```js
export const TEMA_ESCURO = "escuro";
export const TEMA_CLARO = "claro";

export const TILES_POR_TEMA = {
  [TEMA_ESCURO]: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    atribuicao:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  [TEMA_CLARO]: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    atribuicao:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};

export const CENTRO_PADRAO = [-8.0631, -34.8711]; // Recife, Marco Zero
export const ZOOM_PADRAO = 14;
```

- [ ] **Step 2: Verificar que o projeto builda**

Run: `npm run build`
Expected: build termina sem erro (arquivo ainda não é usado por nada).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/config/mapaConfig.js
git commit -m "Adiciona configuracao centralizada do mapa (tiles por tema CARTO, centro/zoom padrao)"
```

---

### Task 2: Token `--color-texto` e bloco de tema claro em `index.css`

**Files:**
- Modify: `frontend/src/styles/index.css`

**Interfaces:**
- Produces: utilitário Tailwind `text-texto` (via `--color-texto`), e o seletor `[data-theme="light"]` que todas as telas escopadas devem respeitar. Usado pelas Tasks 3, 4, 7, 8, 9, 10 e 11.

- [ ] **Step 1: Adicionar primitivas de cor claras**

No bloco `:root` existente, logo após `--raw-neutro-400: #9ca3af;`, adicionar:

```css
  --raw-neutro-0: #ffffff;
  --raw-neutro-100: #f3f4f6;
  --raw-neutro-200: #e5e7eb;
  --raw-neutro-600: #4b5563;
```

- [ ] **Step 2: Adicionar o token semântico `--color-texto`**

No bloco `@theme`, logo após `--color-texto-mute: var(--raw-neutro-400);`, adicionar:

```css
  --color-texto: var(--raw-neutro-0);
```

- [ ] **Step 3: Adicionar o bloco de override do tema claro**

Ao final do arquivo (depois do bloco `@media (prefers-reduced-motion: reduce)`), adicionar:

```css
/*
 * Tema claro, escopado via data-theme num elemento específico (nunca em
 * :root/html) — hoje usado só pela tela do Mapa. Fora de um elemento com
 * data-theme="light", todos os tokens continuam no valor escuro padrão.
 */
[data-theme="light"] {
  --color-base-1: var(--raw-neutro-0);
  --color-base-2: var(--raw-neutro-100);
  --color-base-3: var(--raw-neutro-0);
  --color-base-4: var(--raw-neutro-200);
  --color-texto: var(--raw-neutro-950);
  --color-texto-mute: var(--raw-neutro-600);
}
```

- [ ] **Step 4: Verificar que o projeto builda**

Run: `npm run build`
Expected: build termina sem erro.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/styles/index.css
git commit -m "Adiciona token text-texto e bloco de tema claro escopado via data-theme"
```

---

### Task 3: `Button.jsx` usa o token `text-texto`

**Files:**
- Modify: `frontend/src/components/ui/Button.jsx`

**Interfaces:**
- Consumes: token `text-texto` (Task 2).
- Produces: nenhuma mudança de assinatura — `Button` continua `{ variante, className, ...props }`.

- [ ] **Step 1: Substituir `text-white` por `text-texto`**

Conteúdo atual:
```jsx
const variantes = {
  primario: "bg-primary text-white hover:bg-primary-hover",
  secundario: "border border-base-4 text-white hover:bg-white/5",
  fantasma: "text-texto-mute hover:bg-white/5 hover:text-white",
};
```

Novo conteúdo:
```jsx
const variantes = {
  primario: "bg-primary text-texto hover:bg-primary-hover",
  secundario: "border border-base-4 text-texto hover:bg-white/5",
  fantasma: "text-texto-mute hover:bg-white/5 hover:text-texto",
};
```

Como `--color-texto` vale branco fora de `[data-theme="light"]` (Task 2), nenhuma tela existente (Landing, Dashboard etc.) muda visualmente.

- [ ] **Step 2: Verificar que o projeto builda e lint passa**

Run: `npm run build && npm run lint`
Expected: ambos sem erro.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ui/Button.jsx
git commit -m "Troca text-white por text-texto em Button para reagir ao tema claro"
```

---

### Task 4: `PainelDetalheTrecho.jsx` usa o token `text-texto`

**Files:**
- Modify: `frontend/src/components/mapa/PainelDetalheTrecho.jsx`

**Interfaces:**
- Consumes: token `text-texto` (Task 2).
- Produces: nenhuma mudança de assinatura — continua `{ trecho, aoFechar }`.

- [ ] **Step 1: Substituir `text-white` por `text-texto`**

Linha atual:
```jsx
          <h2 className="text-lg font-semibold text-white">{trecho.nome}</h2>
```

Nova linha:
```jsx
          <h2 className="text-lg font-semibold text-texto">{trecho.nome}</h2>
```

- [ ] **Step 2: Verificar que o projeto builda e lint passa**

Run: `npm run build && npm run lint`
Expected: ambos sem erro.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/mapa/PainelDetalheTrecho.jsx
git commit -m "Troca text-white por text-texto em PainelDetalheTrecho para reagir ao tema claro"
```

---

### Task 5: `ThemeContext.jsx`

**Files:**
- Create: `frontend/src/context/ThemeContext.jsx`

**Interfaces:**
- Consumes: `TEMA_ESCURO`, `TEMA_CLARO` de `config/mapaConfig.js` (Task 1).
- Produces: `export function ThemeProvider({ children })`, `export function useTheme(): { tema: string, alternarTema: () => void }`. Usado pelas Tasks 6, 10.

- [ ] **Step 1: Criar `ThemeContext.jsx`**

```jsx
import { createContext, useContext, useEffect, useState } from "react";
import { TEMA_CLARO, TEMA_ESCURO } from "../config/mapaConfig";

const CHAVE_LOCALSTORAGE = "perimetro-tema";

const ThemeContext = createContext(null);

function lerTemaSalvo() {
  try {
    const salvo = localStorage.getItem(CHAVE_LOCALSTORAGE);
    return salvo === TEMA_CLARO ? TEMA_CLARO : TEMA_ESCURO;
  } catch {
    return TEMA_ESCURO;
  }
}

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(lerTemaSalvo);

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_LOCALSTORAGE, tema);
    } catch {
      // localStorage indisponível (ex.: navegação privada) — preferência só dura a sessão atual
    }
  }, [tema]);

  function alternarTema() {
    setTema((atual) => (atual === TEMA_ESCURO ? TEMA_CLARO : TEMA_ESCURO));
  }

  return <ThemeContext.Provider value={{ tema, alternarTema }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const contexto = useContext(ThemeContext);
  if (!contexto) {
    throw new Error("useTheme precisa ser usado dentro de um ThemeProvider");
  }
  return contexto;
}
```

- [ ] **Step 2: Verificar que o projeto builda**

Run: `npm run build`
Expected: build termina sem erro (arquivo ainda não é usado por nada).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/context/ThemeContext.jsx
git commit -m "Adiciona ThemeContext com persistencia simples em localStorage"
```

---

### Task 6: `ThemeToggle.jsx`

**Files:**
- Create: `frontend/src/components/ThemeToggle.jsx`

**Interfaces:**
- Consumes: `useTheme()` (Task 5), `TEMA_ESCURO` (Task 1).
- Produces: `export default function ThemeToggle({ className })`. Usado pela Task 9 (`CabecalhoMapa`).

- [ ] **Step 1: Criar `ThemeToggle.jsx`**

```jsx
import { Moon, Sun } from "lucide-react";
import { TEMA_ESCURO } from "../config/mapaConfig";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { tema, alternarTema } = useTheme();
  const ehEscuro = tema === TEMA_ESCURO;

  return (
    <button
      type="button"
      onClick={alternarTema}
      aria-label={ehEscuro ? "Ativar tema claro" : "Ativar tema escuro"}
      title={ehEscuro ? "Ativar tema claro" : "Ativar tema escuro"}
      className={[
        "inline-flex items-center justify-center rounded-full border border-base-4 p-2 text-texto-mute transition-colors duration-fast ease-reveal hover:bg-white/5 hover:text-texto",
        className,
      ].join(" ")}
    >
      {ehEscuro ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
```

- [ ] **Step 2: Verificar que o projeto builda e lint passa**

Run: `npm run build && npm run lint`
Expected: ambos sem erro (componente ainda não é usado por nada).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ThemeToggle.jsx
git commit -m "Adiciona ThemeToggle"
```

---

### Task 7: `regiaoService.js` e `useRegioes.js`

**Files:**
- Create: `frontend/src/services/regiaoService.js`
- Create: `frontend/src/hooks/useRegioes.js`

**Interfaces:**
- Produces: `buscarRegioes(): Promise<RegiaoResponseDto[]>` (export nomeado de `regiaoService.js`). `useRegioes(): { regioes: RegiaoResponseDto[], carregando: boolean, erro: Error | null }` (export nomeado de `useRegioes.js`) — usado pela Task 10 (`Mapa.jsx`).
- `RegiaoResponseDto` (formato retornado pela API): `{ id, nome }`.

- [ ] **Step 1: Criar `regiaoService.js`**

```js
import api from "./api";

export async function buscarRegioes() {
  const resposta = await api.get("/regioes");
  return resposta.data;
}
```

- [ ] **Step 2: Criar `useRegioes.js`**

```js
import { useEffect, useState } from "react";
import { buscarRegioes } from "../services/regiaoService";

export function useRegioes() {
  const [regioes, setRegioes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    buscarRegioes()
      .then(setRegioes)
      .catch(setErro)
      .finally(() => setCarregando(false));
  }, []);

  return { regioes, carregando, erro };
}
```

- [ ] **Step 3: Verificar que o projeto builda**

Run: `npm run build`
Expected: build termina sem erro.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/services/regiaoService.js frontend/src/hooks/useRegioes.js
git commit -m "Adiciona regiaoService e useRegioes"
```

---

### Task 8: Filtro opcional por região em `trechoService.js` e `useTrechos.js`

**Files:**
- Modify: `frontend/src/services/trechoService.js`
- Modify: `frontend/src/hooks/useTrechos.js`

**Interfaces:**
- Produces: `buscarTrechos(regiaoId?: string): Promise<TrechoResponseDto[]>` (assinatura estendida, compatível com chamadas existentes sem argumento). `useTrechos(regiaoId?: string): { trechos, carregando, erro }` (idem) — usado pela Task 10 (`Mapa.jsx`).

- [ ] **Step 1: Estender `trechoService.buscarTrechos`**

Conteúdo atual:
```js
import api from "./api";

export async function buscarTrechos() {
  const resposta = await api.get("/trechos");
  return resposta.data;
}
```

Novo conteúdo:
```js
import api from "./api";

export async function buscarTrechos(regiaoId) {
  const resposta = await api.get("/trechos", {
    params: regiaoId ? { regiaoId } : undefined,
  });
  return resposta.data;
}
```

- [ ] **Step 2: Estender `useTrechos` para refazer a busca quando `regiaoId` mudar**

Conteúdo atual:
```js
import { useEffect, useState } from "react";
import { buscarTrechos } from "../services/trechoService";

export function useTrechos() {
  const [trechos, setTrechos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    buscarTrechos()
      .then(setTrechos)
      .catch(setErro)
      .finally(() => setCarregando(false));
  }, []);

  return { trechos, carregando, erro };
}
```

Novo conteúdo:
```js
import { useEffect, useState } from "react";
import { buscarTrechos } from "../services/trechoService";

export function useTrechos(regiaoId) {
  const [trechos, setTrechos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    setCarregando(true);
    buscarTrechos(regiaoId)
      .then(setTrechos)
      .catch(setErro)
      .finally(() => setCarregando(false));
  }, [regiaoId]);

  return { trechos, carregando, erro };
}
```

- [ ] **Step 3: Verificar que o projeto builda e lint passa**

Run: `npm run build && npm run lint`
Expected: ambos sem erro. `useTrechos()` sem argumento continua funcionando (nenhum outro consumidor existe hoje além da Task 10, que será reescrita por esta mesma plano).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/services/trechoService.js frontend/src/hooks/useTrechos.js
git commit -m "Adiciona filtro opcional por regiao em buscarTrechos/useTrechos"
```

---

### Task 9: `MapaLeaflet.jsx` — tiles por tema, controles customizados e foco de busca

**Files:**
- Create: `frontend/src/components/mapa/ControlesMapa.jsx`
- Modify: `frontend/src/components/mapa/MapaLeaflet.jsx`

**Interfaces:**
- Consumes: `TILES_POR_TEMA`, `CENTRO_PADRAO`, `ZOOM_PADRAO` (Task 1).
- Produces: `export default function ControlesMapa({ centroPadrao, zoomPadrao })` (renderizado só dentro de `<MapContainer>`, usa `useMap()`). `MapaLeaflet` ganha as props `tema` (string, obrigatória), `focoBusca` (`{lat, lng} | null`, opcional) e `children` (opcional, ex.: camada de demonstração) — usado pela Task 10 (`Mapa.jsx`) e Task 11 (`CamadaCaminhabilidadeDemo`, passada como `children`).

- [ ] **Step 1: Criar `ControlesMapa.jsx`**

Renderizado como filho de `<MapContainer>` (mesmo padrão de `RecentralizarMapa`, já existente em `MapaLeaflet.jsx`), para ter acesso a `useMap()`.

```jsx
import { LocateFixed, Minus, Plus } from "lucide-react";
import { useMap } from "react-leaflet";

export default function ControlesMapa({ centroPadrao, zoomPadrao }) {
  const mapa = useMap();

  const classeBotao =
    "flex h-9 w-9 items-center justify-center rounded-xl border border-base-4 bg-base-3 text-texto shadow-sm transition-colors duration-fast ease-reveal hover:bg-white/5";

  return (
    <div className="absolute bottom-6 right-4 z-[1000] flex flex-col gap-2">
      <button type="button" onClick={() => mapa.zoomIn()} aria-label="Aumentar zoom" title="Aumentar zoom" className={classeBotao}>
        <Plus size={16} />
      </button>
      <button type="button" onClick={() => mapa.zoomOut()} aria-label="Diminuir zoom" title="Diminuir zoom" className={classeBotao}>
        <Minus size={16} />
      </button>
      <button
        type="button"
        onClick={() => mapa.setView(centroPadrao, zoomPadrao)}
        aria-label="Voltar à visualização inicial"
        title="Voltar à visualização inicial"
        className={classeBotao}
      >
        <LocateFixed size={16} />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Reescrever `MapaLeaflet.jsx`**

Conteúdo atual (referência — será totalmente substituído):
```jsx
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";

const CENTRO_PADRAO = [-8.0631, -34.8711]; // Recife, Marco Zero

function calcularCentro(trechos) {
  const pontos = trechos.flatMap((trecho) => trecho.geometria);
  if (pontos.length === 0) return CENTRO_PADRAO;
  const soma = pontos.reduce(
    (acumulado, ponto) => [acumulado[0] + ponto.lat, acumulado[1] + ponto.lng],
    [0, 0]
  );
  return [soma[0] / pontos.length, soma[1] / pontos.length];
}

function RecentralizarMapa({ centro }) {
  const mapa = useMap();
  useEffect(() => {
    mapa.setView(centro, mapa.getZoom());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centro[0], centro[1], mapa]);
  return null;
}

export default function MapaLeaflet({ trechos, trechoSelecionadoId, onSelecionarTrecho, className = "" }) {
  const centro = calcularCentro(trechos);

  return (
    <MapContainer
      center={CENTRO_PADRAO}
      zoom={14}
      className={["h-full w-full rounded-2xl", className].join(" ")}
    >
      <RecentralizarMapa centro={centro} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {trechos.map((trecho) => (
        <Polyline
          key={trecho.id}
          positions={trecho.geometria.map((ponto) => [ponto.lat, ponto.lng])}
          pathOptions={{
            color: trecho.id === trechoSelecionadoId ? "#38bdf8" : "#60a5fa",
            weight: trecho.id === trechoSelecionadoId ? 5 : 3,
          }}
          eventHandlers={{ click: () => onSelecionarTrecho(trecho) }}
        />
      ))}
    </MapContainer>
  );
}
```

Novo conteúdo:
```jsx
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";
import { CENTRO_PADRAO, TILES_POR_TEMA, ZOOM_PADRAO } from "../../config/mapaConfig";
import ControlesMapa from "./ControlesMapa";

function calcularCentro(trechos) {
  const pontos = trechos.flatMap((trecho) => trecho.geometria);
  if (pontos.length === 0) return CENTRO_PADRAO;
  const soma = pontos.reduce(
    (acumulado, ponto) => [acumulado[0] + ponto.lat, acumulado[1] + ponto.lng],
    [0, 0]
  );
  return [soma[0] / pontos.length, soma[1] / pontos.length];
}

function RecentralizarMapa({ centro }) {
  const mapa = useMap();
  useEffect(() => {
    mapa.setView(centro, mapa.getZoom());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centro[0], centro[1], mapa]);
  return null;
}

export default function MapaLeaflet({
  trechos,
  trechoSelecionadoId,
  onSelecionarTrecho,
  tema,
  focoBusca,
  className = "",
  children,
}) {
  const centroTrechos = calcularCentro(trechos);
  const centro = focoBusca ? [focoBusca.lat, focoBusca.lng] : centroTrechos;
  const tiles = TILES_POR_TEMA[tema];

  return (
    <MapContainer
      center={CENTRO_PADRAO}
      zoom={ZOOM_PADRAO}
      zoomControl={false}
      className={["h-full w-full rounded-2xl", className].join(" ")}
    >
      <RecentralizarMapa centro={centro} />
      <TileLayer attribution={tiles.atribuicao} url={tiles.url} />
      {trechos.map((trecho) => (
        <Polyline
          key={trecho.id}
          positions={trecho.geometria.map((ponto) => [ponto.lat, ponto.lng])}
          pathOptions={{
            color: trecho.id === trechoSelecionadoId ? "#38bdf8" : "#60a5fa",
            weight: trecho.id === trechoSelecionadoId ? 5 : 3,
          }}
          eventHandlers={{ click: () => onSelecionarTrecho(trecho) }}
        />
      ))}
      {children}
      <ControlesMapa centroPadrao={CENTRO_PADRAO} zoomPadrao={ZOOM_PADRAO} />
    </MapContainer>
  );
}
```

`focoBusca` é um objeto novo a cada seleção de busca (vindo da Task 10); o efeito de `RecentralizarMapa` continua dependendo de `centro[0]`/`centro[1]` (números), não da identidade do array, então não dispara em loop.

- [ ] **Step 3: Verificar que o projeto builda e lint passa**

Run: `npm run build && npm run lint`
Expected: ambos sem erro. (`MapaLeaflet` agora exige a prop `tema`; nenhum consumidor existe ainda além da Task 10, que será reescrita por este mesmo plano.)

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/mapa/ControlesMapa.jsx frontend/src/components/mapa/MapaLeaflet.jsx
git commit -m "MapaLeaflet: tiles por tema (CARTO), controles de zoom customizados e foco de busca"
```

---

### Task 10: `CamadaCaminhabilidadeDemo.jsx`

**Files:**
- Create: `frontend/src/components/mapa/CamadaCaminhabilidadeDemo.jsx`

**Interfaces:**
- Produces: `export default function CamadaCaminhabilidadeDemo()` — sem props; renderizado como `children` de `<MapaLeaflet>` (Task 9) quando o toggle correspondente do painel de filtros estiver ativo (Task 13/14).

- [ ] **Step 1: Criar `CamadaCaminhabilidadeDemo.jsx`**

```jsx
import { CircleMarker, Popup } from "react-leaflet";

const CORES_DEMO = {
  bom: "#34d399",
  medio: "#fbbf24",
  ruim: "#f87171",
};

const PONTOS_DEMO = [
  { id: "demo-1", lat: -8.0631, lng: -34.8711, categoria: "bom" },
  { id: "demo-2", lat: -8.0696, lng: -34.8755, categoria: "medio" },
  { id: "demo-3", lat: -8.058, lng: -34.882, categoria: "ruim" },
];

export default function CamadaCaminhabilidadeDemo() {
  return (
    <>
      {PONTOS_DEMO.map((ponto) => (
        <CircleMarker
          key={ponto.id}
          center={[ponto.lat, ponto.lng]}
          radius={10}
          pathOptions={{
            color: CORES_DEMO[ponto.categoria],
            fillColor: CORES_DEMO[ponto.categoria],
            fillOpacity: 0.7,
          }}
        >
          <Popup>Dado de demonstração — índice fictício, não calculado.</Popup>
        </CircleMarker>
      ))}
    </>
  );
}
```

Pontos fixos próximos ao centro padrão do mapa (Recife) — não vêm da API, são dados fictícios fixos no código, por isso não têm `regiaoId`/`trechoId` e não aparecem em nenhum outro lugar do app.

- [ ] **Step 2: Verificar que o projeto builda e lint passa**

Run: `npm run build && npm run lint`
Expected: ambos sem erro (componente ainda não é usado por nada).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/mapa/CamadaCaminhabilidadeDemo.jsx
git commit -m "Adiciona camada de caminhabilidade demonstrativa (dados ficticios)"
```

---

### Task 11: `LegendaMapa.jsx`

**Files:**
- Create: `frontend/src/components/mapa/LegendaMapa.jsx`

**Interfaces:**
- Produces: `export default function LegendaMapa({ className })` — usado pela Task 14 (`Mapa.jsx`).

- [ ] **Step 1: Criar `LegendaMapa.jsx`**

Não reaproveita o componente `Card` (que tem `p-8` fixo, sem prop de padding) — em vez disso usa os mesmos tokens visuais diretamente, para poder usar `p-4` (painel compacto), sem o risco de duas classes Tailwind de padding conflitantes.

```jsx
const CATEGORIAS = [
  { tom: "bg-indice-bom", rotulo: "Bom" },
  { tom: "bg-indice-medio", rotulo: "Médio" },
  { tom: "bg-indice-ruim", rotulo: "Ruim" },
];

export default function LegendaMapa({ className = "" }) {
  return (
    <div
      className={[
        "w-fit rounded-2xl border border-base-4 bg-base-3 p-4 shadow-sm transition-colors duration-base ease-reveal",
        className,
      ].join(" ")}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-texto-mute">Caminhabilidade (demonstração)</p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {CATEGORIAS.map(({ tom, rotulo }) => (
          <li key={rotulo} className="flex items-center gap-2 text-sm text-texto">
            <span className={["h-3 w-3 rounded-full", tom].join(" ")} aria-hidden="true" />
            {rotulo}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Verificar que o projeto builda e lint passa**

Run: `npm run build && npm run lint`
Expected: ambos sem erro.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/mapa/LegendaMapa.jsx
git commit -m "Adiciona LegendaMapa"
```

---

### Task 12: `PainelFiltros.jsx`

**Files:**
- Create: `frontend/src/components/mapa/PainelFiltros.jsx`

**Interfaces:**
- Consumes: `RegiaoResponseDto[]` (Task 7).
- Produces: `export default function PainelFiltros({ recolhido, aoAlternarRecolhido, regioes, regiaoSelecionadaId, aoSelecionarRegiao, mostrarInativos, aoAlternarMostrarInativos, camadaDemoVisivel, aoAlternarCamadaDemo })` — usado pela Task 14 (`Mapa.jsx`).

- [ ] **Step 1: Criar `PainelFiltros.jsx`**

```jsx
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function PainelFiltros({
  recolhido,
  aoAlternarRecolhido,
  regioes,
  regiaoSelecionadaId,
  aoSelecionarRegiao,
  mostrarInativos,
  aoAlternarMostrarInativos,
  camadaDemoVisivel,
  aoAlternarCamadaDemo,
}) {
  return (
    <aside
      className={[
        "absolute left-4 top-20 z-[1000] flex flex-col gap-4 rounded-2xl border border-base-4 bg-base-3 p-4 shadow-sm transition-[width] duration-base ease-reveal",
        recolhido ? "w-12 overflow-hidden" : "w-64",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={aoAlternarRecolhido}
        aria-label={recolhido ? "Expandir painel de filtros" : "Recolher painel de filtros"}
        title={recolhido ? "Expandir painel de filtros" : "Recolher painel de filtros"}
        className="flex h-8 w-8 items-center justify-center self-end rounded-lg text-texto-mute hover:bg-white/5 hover:text-texto"
      >
        {recolhido ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {!recolhido && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="filtro-regiao" className="text-xs font-semibold uppercase tracking-wide text-texto-mute">
              Região
            </label>
            <select
              id="filtro-regiao"
              value={regiaoSelecionadaId ?? ""}
              onChange={(evento) => aoSelecionarRegiao(evento.target.value || null)}
              className="rounded-lg border border-base-4 bg-base-2 px-3 py-2 text-sm text-texto"
            >
              <option value="">Todas as regiões</option>
              {regioes.map((regiao) => (
                <option key={regiao.id} value={regiao.id}>
                  {regiao.nome}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-texto">
            <input type="checkbox" checked={mostrarInativos} onChange={aoAlternarMostrarInativos} />
            Mostrar trechos inativos
          </label>

          <label className="flex items-center gap-2 text-sm text-texto">
            <input type="checkbox" checked={camadaDemoVisivel} onChange={aoAlternarCamadaDemo} />
            Camada de caminhabilidade (demonstração)
          </label>
        </div>
      )}
    </aside>
  );
}
```

- [ ] **Step 2: Verificar que o projeto builda e lint passa**

Run: `npm run build && npm run lint`
Expected: ambos sem erro.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/mapa/PainelFiltros.jsx
git commit -m "Adiciona PainelFiltros (sidebar recolhivel: regiao, status, camada demo)"
```

---

### Task 13: `CabecalhoMapa.jsx`

**Files:**
- Create: `frontend/src/components/mapa/CabecalhoMapa.jsx`

**Interfaces:**
- Consumes: `ThemeToggle` (Task 6).
- Produces: `export default function CabecalhoMapa({ busca, aoMudarBusca, sugestoes, aoSelecionarSugestao })`, onde `sugestoes` é `TrechoResponseDto[]` — usado pela Task 14 (`Mapa.jsx`).

- [ ] **Step 1: Criar `CabecalhoMapa.jsx`**

```jsx
import { Search } from "lucide-react";
import ThemeToggle from "../ThemeToggle";

export default function CabecalhoMapa({ busca, aoMudarBusca, sugestoes, aoSelecionarSugestao }) {
  return (
    <div className="absolute left-4 right-4 top-4 z-[1000] flex items-center gap-3 rounded-2xl border border-base-4 bg-base-3 px-4 py-2.5 shadow-sm">
      <span className="text-sm font-semibold text-texto">Pé-rímetro</span>

      <div className="relative max-w-sm flex-1">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-texto-mute" />
        <input
          type="text"
          value={busca}
          onChange={(evento) => aoMudarBusca(evento.target.value)}
          placeholder="Buscar trecho pelo nome..."
          className="w-full rounded-lg border border-base-4 bg-base-2 py-2 pl-9 pr-3 text-sm text-texto placeholder:text-texto-mute"
        />
        {busca && sugestoes.length > 0 && (
          <ul className="absolute left-0 right-0 top-full z-[1001] mt-1 max-h-48 overflow-auto rounded-lg border border-base-4 bg-base-3 shadow-lg">
            {sugestoes.map((trecho) => (
              <li key={trecho.id}>
                <button
                  type="button"
                  onClick={() => aoSelecionarSugestao(trecho)}
                  className="w-full px-3 py-2 text-left text-sm text-texto hover:bg-white/5"
                >
                  {trecho.nome}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ThemeToggle />
    </div>
  );
}
```

- [ ] **Step 2: Verificar que o projeto builda e lint passa**

Run: `npm run build && npm run lint`
Expected: ambos sem erro.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/mapa/CabecalhoMapa.jsx
git commit -m "Adiciona CabecalhoMapa (identificacao, busca client-side e ThemeToggle)"
```

---

### Task 14: Reescrever `Mapa.jsx` — orquestrar tudo

**Files:**
- Modify: `frontend/src/pages/Mapa.jsx`

**Interfaces:**
- Consumes: `ThemeProvider`/`useTheme` (Task 5), `useTrechos(regiaoId?)` (Task 8), `useRegioes()` (Task 7), `MapaLeaflet` (Task 9), `CamadaCaminhabilidadeDemo` (Task 10), `LegendaMapa` (Task 11), `PainelFiltros` (Task 12), `CabecalhoMapa` (Task 13), `PainelDetalheTrecho` (já existente).
- Produces: página `/app` funcional — nada consome `Mapa.jsx` além do roteador (`App.jsx`, que não muda).

- [ ] **Step 1: Substituir o conteúdo de `Mapa.jsx`**

Conteúdo atual (referência — será totalmente substituído):
```jsx
import { useState } from "react";
import Card from "../components/ui/Card";
import MapaLeaflet from "../components/mapa/MapaLeaflet";
import PainelDetalheTrecho from "../components/mapa/PainelDetalheTrecho";
import { useTrechos } from "../hooks/useTrechos";

export default function Mapa() {
  const { trechos, carregando, erro } = useTrechos();
  const [trechoSelecionado, setTrechoSelecionado] = useState(null);

  if (carregando) {
    return (
      <Card>
        <h1 className="text-xl font-semibold">Mapa</h1>
        <p className="mt-2 text-texto-mute">Carregando trechos...</p>
      </Card>
    );
  }

  if (erro) {
    return (
      <Card>
        <h1 className="text-xl font-semibold">Mapa</h1>
        <p className="mt-2 text-texto-mute">
          Não foi possível carregar os trechos. Tente novamente mais tarde.
        </p>
      </Card>
    );
  }

  return (
    <div className="relative isolate h-[calc(100dvh-8rem)] w-full">
      <MapaLeaflet
        trechos={trechos}
        trechoSelecionadoId={trechoSelecionado?.id}
        onSelecionarTrecho={setTrechoSelecionado}
      />
      {trechos.length === 0 && (
        <p className="absolute left-1/2 top-4 z-[1000] -translate-x-1/2 rounded-full bg-base-3 px-4 py-2 text-sm text-texto-mute shadow-sm">
          Nenhum trecho cadastrado ainda.
        </p>
      )}
      <PainelDetalheTrecho
        trecho={trechoSelecionado}
        aoFechar={() => setTrechoSelecionado(null)}
      />
    </div>
  );
}
```

Novo conteúdo:
```jsx
import { useMemo, useState } from "react";
import Card from "../components/ui/Card";
import MapaLeaflet from "../components/mapa/MapaLeaflet";
import PainelDetalheTrecho from "../components/mapa/PainelDetalheTrecho";
import CabecalhoMapa from "../components/mapa/CabecalhoMapa";
import PainelFiltros from "../components/mapa/PainelFiltros";
import LegendaMapa from "../components/mapa/LegendaMapa";
import CamadaCaminhabilidadeDemo from "../components/mapa/CamadaCaminhabilidadeDemo";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { useTrechos } from "../hooks/useTrechos";
import { useRegioes } from "../hooks/useRegioes";

function MapaConteudo() {
  const { tema } = useTheme();
  const [regiaoSelecionadaId, setRegiaoSelecionadaId] = useState(null);
  const [trechoSelecionado, setTrechoSelecionado] = useState(null);
  const [recolhido, setRecolhido] = useState(false);
  const [mostrarInativos, setMostrarInativos] = useState(true);
  const [camadaDemoVisivel, setCamadaDemoVisivel] = useState(false);
  const [busca, setBusca] = useState("");
  const [focoBusca, setFocoBusca] = useState(null);

  const { trechos, carregando, erro } = useTrechos(regiaoSelecionadaId || undefined);
  const { regioes } = useRegioes();

  const trechosVisiveis = useMemo(
    () => (mostrarInativos ? trechos : trechos.filter((trecho) => trecho.status === "ATIVO")),
    [trechos, mostrarInativos]
  );

  const sugestoes = useMemo(() => {
    if (!busca) return [];
    const termo = busca.toLowerCase();
    return trechosVisiveis.filter((trecho) => trecho.nome.toLowerCase().includes(termo)).slice(0, 6);
  }, [busca, trechosVisiveis]);

  function selecionarViaBusca(trecho) {
    setTrechoSelecionado(trecho);
    setFocoBusca(trecho.geometria[0] ?? null);
    setBusca("");
  }

  if (carregando) {
    return (
      <Card>
        <h1 className="text-xl font-semibold">Mapa</h1>
        <p className="mt-2 text-texto-mute">Carregando trechos...</p>
      </Card>
    );
  }

  if (erro) {
    return (
      <Card>
        <h1 className="text-xl font-semibold">Mapa</h1>
        <p className="mt-2 text-texto-mute">
          Não foi possível carregar os trechos. Tente novamente mais tarde.
        </p>
      </Card>
    );
  }

  return (
    <div data-theme={tema} className="relative isolate h-[calc(100dvh-8rem)] w-full">
      <MapaLeaflet
        trechos={trechosVisiveis}
        trechoSelecionadoId={trechoSelecionado?.id}
        onSelecionarTrecho={setTrechoSelecionado}
        tema={tema}
        focoBusca={focoBusca}
      >
        {camadaDemoVisivel && <CamadaCaminhabilidadeDemo />}
      </MapaLeaflet>

      {trechosVisiveis.length === 0 && (
        <p className="absolute left-1/2 top-20 z-[1000] -translate-x-1/2 rounded-full bg-base-3 px-4 py-2 text-sm text-texto-mute shadow-sm">
          Nenhum trecho cadastrado ainda.
        </p>
      )}

      <CabecalhoMapa busca={busca} aoMudarBusca={setBusca} sugestoes={sugestoes} aoSelecionarSugestao={selecionarViaBusca} />

      <PainelFiltros
        recolhido={recolhido}
        aoAlternarRecolhido={() => setRecolhido((atual) => !atual)}
        regioes={regioes}
        regiaoSelecionadaId={regiaoSelecionadaId}
        aoSelecionarRegiao={setRegiaoSelecionadaId}
        mostrarInativos={mostrarInativos}
        aoAlternarMostrarInativos={() => setMostrarInativos((atual) => !atual)}
        camadaDemoVisivel={camadaDemoVisivel}
        aoAlternarCamadaDemo={() => setCamadaDemoVisivel((atual) => !atual)}
      />

      <LegendaMapa className="absolute bottom-6 left-4 z-[1000]" />

      <PainelDetalheTrecho trecho={trechoSelecionado} aoFechar={() => setTrechoSelecionado(null)} />
    </div>
  );
}

export default function Mapa() {
  return (
    <ThemeProvider>
      <MapaConteudo />
    </ThemeProvider>
  );
}
```

`useTheme()` só pode ser chamado dentro da árvore do `ThemeProvider` — por isso a lógica da página vive em `MapaConteudo`, e `Mapa` (o export default, consumido por `App.jsx`) só monta o provider por fora.

- [ ] **Step 2: Verificar que o projeto builda e lint passa**

Run: `npm run build && npm run lint`
Expected: ambos sem erro.

- [ ] **Step 3: Checagem visual rápida no navegador**

Run: `npm run dev` (deixar rodando em background)

Abrir `http://localhost:5173/app`. Esperado: cabeçalho compacto no topo (nome + busca + botão de tema), painel de filtros recolhível à esquerda, legenda no canto inferior esquerdo, controles de zoom/reset no canto inferior direito, mapa com tiles escuros (CARTO) por padrão. Se o painel de filtros ou a legenda estiverem sobrepondo outro elemento de forma incorreta, ajustar as classes `top-*`/`left-*`/`bottom-*` diretamente nos componentes (Task 11/12) antes de prosseguir — é esperado precisar desse ajuste fino, assim como aconteceu no fix de z-index da Sprint 02 Fase 2. Parar o `npm run dev` depois de confirmar.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Mapa.jsx
git commit -m "Reescreve Mapa.jsx: orquestra cabecalho, filtros, legenda, tema e camada demo"
```

---

### Task 15: Verificação manual end-to-end (todos os critérios de aceitação)

**Files:**
- Nenhum (verificação; ajustes pontuais encontrados aqui devem ser corrigidos nos arquivos das Tasks 9-14 antes de reportar a sprint como pronta).

**Interfaces:**
- Consumes: toda a stack das Tasks 1-14, mais o backend já existente (`/api/v1/regioes`, `/api/v1/trechos`).
- Produces: confirmação de que todos os critérios de aceitação do pedido original foram atendidos.

- [ ] **Step 1: Subir o backend com Postgres**

A partir da raiz do repo (`C:\PROJETO PÉ-RÍMETRO`): `docker compose up -d`, esperar o Postgres ficar pronto, depois `cd backend && ./mvnw spring-boot:run` em background. Esperar o log mostrar `Started PerimetroBackendApplication`.

- [ ] **Step 2: Garantir dados de teste (reaproveitar os da Sprint 02, ou recriar)**

Se o banco estiver vazio, repetir os `curl` de cadastro de região/trechos já documentados em `docs/superpowers/plans/2026-09-21-sprint02-fase2-frontend-mapa.md` (Task 5), e cadastrar pelo menos uma segunda região com um trecho, para poder testar o filtro por região de verdade.

- [ ] **Step 3: Subir o frontend e percorrer cada critério de aceitação**

A partir de `frontend/`: `npm run dev`. Abrir `http://localhost:5173/app` numa janela desktop (≥1280px de largura). Confirmar, um por um:

1. O mapa carrega com tiles reais (CARTO escuro por padrão).
2. Zoom pelos botões customizados funciona; "voltar à visualização inicial" recentraliza no centro padrão (Recife) com o zoom padrão.
3. Clicar no `ThemeToggle` troca os tiles (CARTO claro) **e** a cor de fundo/texto do cabeçalho, painel de filtros, legenda e painel de detalhe — sem recarregar o mapa, sem perder o trecho selecionado nem o filtro de região ativo. Clicar de novo volta ao escuro. Recarregar a página mantém o último tema escolhido (persistido em `localStorage`).
4. O painel de filtros recolhe/expande pelo botão de seta.
5. A legenda mostra as 3 categorias de caminhabilidade com a observação "(demonstração)".
6. Clicar num trecho no mapa abre o painel de detalhe com nome, status e "Ainda sem avaliações"; fechar funciona.
7. Ativar o checkbox "Camada de caminhabilidade (demonstração)" mostra os 3 pontos fictícios; clicar num deles abre um popup dizendo que é demonstrativo. Desativar o checkbox os esconde.
8. Selecionar uma região no filtro refaz a busca (`?regiaoId=`) e o mapa passa a mostrar só os trechos daquela região; voltar para "Todas as regiões" mostra todos de novo.
9. Desmarcar "Mostrar trechos inativos" (se houver algum trecho `INATIVO` nos dados de teste) esconde essas linhas do mapa; marcar de novo as traz de volta.
10. Digitar no campo de busca do cabeçalho filtra a lista de sugestões pelo nome do trecho; clicar numa sugestão seleciona aquele trecho (abre o painel de detalhe) e recentraliza o mapa nele.
11. Desligar o Wi-Fi/parar o backend e recarregar a página: a tela de erro aparece (sem tela branca). Checar também o que acontece se os tiles CARTO não carregarem (ex.: via DevTools bloqueando o domínio `cartocdn.com`) — o mapa deve continuar interativo, só sem a imagem de fundo, nunca uma página quebrada.
12. Redimensionar a janela entre 1280px e 1920px de largura: nada quebra, nada fica ilegível.
13. As páginas Landing, Avaliação, Ocorrência e Dashboard continuam com a aparência de antes (tema escuro fixo, sem o `data-theme` novo).

- [ ] **Step 4: Corrigir o que for encontrado**

Se algum item falhar, corrigir no arquivo correspondente (Tasks 1-14) e repetir o passo 3 até todos passarem. Documentar qualquer ajuste feito aqui — ele não estava previsto no código escrito nas tasks anteriores.

- [ ] **Step 5: Encerrar os processos**

Parar `npm run dev` e o processo do backend (`./mvnw spring-boot:run`). Rodar `docker compose down` a partir da raiz do repo.

- [ ] **Step 6: Reportar ao usuário**

Seguir o formato de entrega pedido originalmente: o que foi implementado, arquivos criados/modificados, dependências adicionadas (nenhuma nova nesta sprint — `leaflet`/`react-leaflet`/`lucide-react` já existiam), instruções de execução, resultado de cada critério de aceitação testado no Step 3, e limitações/pendências (busca é só sobre trechos já carregados, sem geocodificação; camada de caminhabilidade é só demonstrativa; tema não cobre o app inteiro, só a tela do Mapa).

