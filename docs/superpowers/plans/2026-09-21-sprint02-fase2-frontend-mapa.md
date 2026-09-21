# Sprint 02 — Fase 2: Mapa Interativo (Frontend) — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o placeholder de `pages/Mapa.jsx` por um mapa Leaflet funcional que busca trechos reais de `GET /api/v1/trechos`, desenha cada um como uma linha colorida, e mostra um painel flutuante de detalhes ao clicar em um trecho.

**Architecture:** Camada de dados (`trechoService.js` + `useTrechos.js`, mesmo padrão de `healthService.js`/`useStatusSaude.js`) alimenta `Mapa.jsx`, que orquestra dois componentes novos: `MapaLeaflet.jsx` (mapa + trajetos) e `PainelDetalheTrecho.jsx` (overlay de detalhes, construído com a skill `21st:21st-ui-build` sobre os tokens de design já existentes). Estado de seleção (`trechoSelecionado`) fica local em `Mapa.jsx` — nenhum Context é criado.

**Tech Stack:** React 19, `react-leaflet` + `leaflet` (dependências novas), OpenStreetMap (tiles), Tailwind CSS 4 (tokens via `@theme`, já existentes), axios (já em uso). JavaScript puro (`.jsx`), sem TypeScript. Sem suíte de testes automatizados de frontend neste projeto.

**Spec:** `docs/superpowers/specs/2026-09-21-sprint02-fase2-frontend-mapa-design.md`

## Global Constraints

- Painel de detalhes é um overlay flutuante sobre o mapa — **nunca** uma sidebar fixa. Não criar nem reintroduzir `components/Sidebar.jsx`.
- Sem mock de dados no código React — sempre chama `GET /api/v1/trechos` de verdade.
- Estado (`trechos`, `trechoSelecionado`) fica local em `Mapa.jsx`. Nenhum arquivo em `context/` é criado.
- `App.jsx`, `Layout.jsx`, `AppNavbar.jsx` não mudam.
- Centro padrão do mapa: Recife, Marco Zero (`-8.0631, -34.8711`). Recentraliza no centróide dos trechos carregados quando a lista não está vazia.
- Cor dos trechos nesta fase é neutra (paleta azul existente) — **não** usar `--color-indice-bom/medio/ruim` (isso depende do módulo de Avaliação, que não existe ainda).
- Sem suíte de testes automatizados de frontend. Verificação por tarefa: `npm run lint` + `npm run build`; verificação funcional manual via `npm run dev` onde indicado.
- Todos os comandos abaixo assumem `cwd` em `C:\PROJETO PÉ-RÍMETRO\frontend`, exceto a Tarefa 5 (que também usa `backend/` e a raiz do repo para o Docker Compose).

---

### Task 1: Camada de dados — `trechoService.js` e `useTrechos.js`

**Files:**
- Create: `frontend/src/services/trechoService.js`
- Create: `frontend/src/hooks/useTrechos.js`

**Interfaces:**
- Produces: `buscarTrechos(): Promise<TrechoResponseDto[]>` (export nomeado de `trechoService.js`). `useTrechos(): { trechos: TrechoResponseDto[], carregando: boolean, erro: Error | null }` (export nomeado de `useTrechos.js`) — usado pela Task 4 (`Mapa.jsx`).
- `TrechoResponseDto` (formato retornado pela API, definido no backend): `{ id, nome, geometria: [{ lat, lng }, ...], latitude, longitude, indiceAtual, status, regiaoId }`.

Não há suíte de testes automatizados neste projeto — a verificação desta tarefa é o build e uma checagem manual rápida no console do navegador (Step 4).

- [ ] **Step 1: Criar `trechoService.js`**

```js
import api from "./api";

export async function buscarTrechos() {
  const resposta = await api.get("/trechos");
  return resposta.data;
}
```

- [ ] **Step 2: Criar `useTrechos.js`**

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

- [ ] **Step 3: Verificar que o projeto builda**

Run: `npm run build`
Expected: build termina sem erro (os dois arquivos novos não são usados por nada ainda, então isso só confirma que não há erro de sintaxe).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/services/trechoService.js frontend/src/hooks/useTrechos.js
git commit -m "Adiciona trechoService e useTrechos"
```

---

### Task 2: Instalar Leaflet e criar `MapaLeaflet.jsx`

**Files:**
- Modify: `frontend/package.json` (via `npm install`, não editar à mão)
- Create: `frontend/src/components/mapa/MapaLeaflet.jsx`

**Interfaces:**
- Consumes: nenhuma dependência de tasks anteriores diretamente (recebe `trechos` via props de quem o usa).
- Produces: `export default function MapaLeaflet({ trechos, trechoSelecionadoId, onSelecionarTrecho, className })` — `trechos` é `TrechoResponseDto[]`, `trechoSelecionadoId` é `string | undefined` (id do trecho atualmente selecionado, para destacar visualmente), `onSelecionarTrecho` é `(trecho: TrechoResponseDto) => void`. Usado pela Task 4 (`Mapa.jsx`).

- [ ] **Step 1: Instalar as dependências**

Run: `npm install leaflet react-leaflet`

Expected: `leaflet` e `react-leaflet` aparecem em `dependencies` no `package.json` e no `package-lock.json`, sem erro de peer dependency (react-leaflet atual suporta React 19).

- [ ] **Step 2: Criar `MapaLeaflet.jsx`**

O CSS do Leaflet é importado aqui (único lugar do projeto que usa o mapa). As cores das linhas usam os valores hexadecimais da paleta azul já existente (`--raw-azul-400` / `--raw-azul-tech` em `frontend/src/styles/index.css`) diretamente no `pathOptions`, porque o Leaflet desenha SVG e não lê classes Tailwind — não são cores novas, só não dá pra referenciar via className aqui.

**Detalhe importante:** a prop `center` do `MapContainer` só é aplicada na montagem inicial do mapa — mudar essa prop depois (quando os trechos chegam de forma assíncrona da API) **não** recentraliza o mapa sozinho, é uma limitação conhecida do react-leaflet. Por isso o componente usa um subcomponente interno `RecentralizarMapa`, com o hook `useMap()`, que chama `mapa.setView(...)` manualmente sempre que o centro calculado mudar.

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

`calcularCentro` é chamada de novo a cada render de `MapaLeaflet` (retorna um array novo toda vez), então o `useEffect` de `RecentralizarMapa` depende de `centro[0]`/`centro[1]` (os números) em vez do array `centro` inteiro — senão disparadaria a cada render por causa da nova referência, mesmo com o mesmo valor.

- [ ] **Step 3: Verificar que o projeto builda**

Run: `npm run build`
Expected: build termina sem erro.

Run: `npm run lint`
Expected: sem novos erros/warnings.

- [ ] **Step 4: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/components/mapa/MapaLeaflet.jsx
git commit -m "Adiciona leaflet/react-leaflet e o componente MapaLeaflet"
```

---

### Task 3: `PainelDetalheTrecho.jsx` (construído com a skill `21st:21st-ui-build`)

**Files:**
- Create: `frontend/src/components/mapa/PainelDetalheTrecho.jsx`

**Interfaces:**
- Consumes: `Card`, `Badge`, `Button` de `frontend/src/components/ui/` (primitivas já existentes — ver seus estilos abaixo).
- Produces: `export default function PainelDetalheTrecho({ trecho, aoFechar })` — `trecho` é `TrechoResponseDto | null`, `aoFechar` é `() => void`. Usado pela Task 4 (`Mapa.jsx`).

**Por que esta tarefa é diferente das outras:** por decisão da spec, este componente é construído com a skill `21st:21st-ui-build` (não código escrito à mão nesta tarefa), reaproveitando o contexto de design do projeto. Em vez de um bloco de código pronto, esta tarefa dá a especificação completa e sem ambiguidade que a skill precisa receber — nada aqui fica em aberto para a skill "decidir sozinha" além de acabamento visual.

- [ ] **Step 1: Invocar a skill `21st:21st-ui-build`**

Peça pra skill construir exatamente este componente, passando o seguinte briefing:

- **Arquivo:** `frontend/src/components/mapa/PainelDetalheTrecho.jsx`.
- **Propósito:** painel de detalhes de um "Trecho" (um trajeto de caminhabilidade urbana), que aparece como **overlay flutuante sobre um mapa** quando o usuário clica em um trecho — nunca uma sidebar fixa, nunca ocupando espaço no fluxo normal da página (`position: absolute` ou `fixed` dentro de um contêiner posicionado relativamente).
- **Props:** `{ trecho, aoFechar }`. `trecho` é `null` ou um objeto `{ id, nome, geometria: [{lat, lng}, ...], latitude, longitude, indiceAtual, status, regiaoId }`. Quando `trecho` é `null`, o componente não renderiza nada (`return null`) — não anima entrada/saída de forma que dependa de manter o componente montado com `trecho` nulo.
- **Conteúdo a mostrar quando `trecho` não é nulo:**
  - `trecho.nome` como título.
  - `trecho.status` como um badge (usar o componente `Badge` existente, `tom="neutro"` — não usar `tom="bom"/"medio"/"ruim"` aqui, essas classificações são do Índice de Caminhabilidade e não se aplicam ao status de cadastro).
  - Uma mensagem indicando que o trecho ainda não tem avaliações (`trecho.indiceAtual` é sempre `null` nesta fase — não exibir nenhum "0" ou placeholder numérico, mostrar algo como "Ainda sem avaliações").
  - Um botão de fechar (usar `Button` existente, `variante="fantasma"` ou `"secundario"`) que chama `aoFechar()`.
- **Estilo:** reaproveitar os tokens e padrões já usados em `frontend/src/components/ui/Card.jsx` (`rounded-2xl border border-base-4 bg-base-3`) e `Button.jsx` (variantes `primario`/`secundario`/`fantasma`, ver conteúdo completo abaixo) — nenhuma cor nova, nenhum novo padrão de espaçamento/raio de borda inventado. Paleta azul-marinho escura, consistente com o resto do app.
- **Não fazer:** não buscar dados (o componente é puramente apresentacional, recebe tudo via props), não adicionar rotas, não modificar `Card.jsx`/`Badge.jsx`/`Button.jsx`.

Conteúdo atual de `frontend/src/components/ui/Card.jsx` (para referência de estilo):
```jsx
export default function Card({ children, className = "" }) {
  return (
    <div
      className={[
        "rounded-2xl border border-base-4 bg-base-3 p-8 shadow-sm transition-colors duration-base ease-reveal",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
```

Conteúdo atual de `frontend/src/components/ui/Button.jsx` (para referência de estilo):
```jsx
const variantes = {
  primario: "bg-primary text-white hover:bg-primary-hover",
  secundario: "border border-base-4 text-white hover:bg-white/5",
  fantasma: "text-texto-mute hover:bg-white/5 hover:text-white",
};

export default function Button({ variante = "primario", className = "", ...props }) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-fast ease-reveal disabled:cursor-not-allowed disabled:opacity-50",
        variantes[variante],
        className,
      ].join(" ")}
      {...props}
    />
  );
}
```

Conteúdo atual de `frontend/src/components/ui/Badge.jsx` (para referência de estilo — já existe, não recriar):
```jsx
const tonalidades = {
  bom: "bg-indice-bom/15 text-indice-bom",
  medio: "bg-indice-medio/15 text-indice-medio",
  ruim: "bg-indice-ruim/15 text-indice-ruim",
  neutro: "bg-base-4 text-texto-mute",
};

export default function Badge({ tom = "neutro", children, className = "" }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        tonalidades[tom],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 2: Conferir o resultado da skill contra o briefing**

Releia o arquivo gerado e confirme, um por um: (a) props são exatamente `{ trecho, aoFechar }`; (b) retorna `null` quando `trecho` é `null`; (c) é posicionado como overlay (`absolute`/`fixed`), não no fluxo normal; (d) usa `Card`/`Badge`/`Button` existentes, sem cor nova; (e) não usa `tom="bom"/"medio"/"ruim"` no Badge; (f) não faz nenhuma chamada de API. Se algo não bater, ajuste manualmente antes de seguir — não precisa invocar a skill de novo para um ajuste pequeno.

- [ ] **Step 3: Verificar que o projeto builda**

Run: `npm run build`
Expected: build termina sem erro (o componente ainda não é usado por nada, então isso só confirma sintaxe).

Run: `npm run lint`
Expected: sem novos erros/warnings.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/mapa/PainelDetalheTrecho.jsx
git commit -m "Adiciona PainelDetalheTrecho via skill 21st-ui-build"
```

---

### Task 4: Reescrever `Mapa.jsx`

**Files:**
- Modify: `frontend/src/pages/Mapa.jsx`

**Interfaces:**
- Consumes: `useTrechos()` (Task 1), `MapaLeaflet` (Task 2), `PainelDetalheTrecho` (Task 3), `Card` (já existente).
- Produces: página `/app` funcional — nada consome `Mapa.jsx` além do roteador (`App.jsx`, que não muda).

Conteúdo atual de `frontend/src/pages/Mapa.jsx` (placeholder a ser substituído):
```jsx
import Card from "../components/ui/Card";

export default function Mapa() {
  return (
    <Card>
      <h1 className="text-xl font-semibold">Mapa</h1>
      <p className="mt-2 text-texto-mute">
        O mapa interativo de trechos será implementado na Sprint 02.
      </p>
    </Card>
  );
}
```

`Layout.jsx` (não muda, só para referência) já aplica `pt-24 px-4 pb-8 md:px-8` no `<main>` que envolve todas as páginas — por isso o mapa usa `h-[calc(100vh-8rem)]` (preenche a área de conteúdo disponível abaixo da navbar flutuante) em vez de `h-screen`.

- [ ] **Step 1: Substituir o conteúdo de `Mapa.jsx`**

```jsx
import { useState } from "react";
import Card from "../components/ui/Card";
import MapaLeaflet from "../components/mapa/MapaLeaflet";
import PainelDetalheTrecho from "../components/mapa/PainelDetalheTrecho";
import { useTrechos } from "../hooks/useTrechos";

export default function Mapa() {
  const { trechos, erro } = useTrechos();
  const [trechoSelecionado, setTrechoSelecionado] = useState(null);

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
    <div className="relative h-[calc(100vh-8rem)] w-full">
      <MapaLeaflet
        trechos={trechos}
        trechoSelecionadoId={trechoSelecionado?.id}
        onSelecionarTrecho={setTrechoSelecionado}
      />
      <PainelDetalheTrecho
        trecho={trechoSelecionado}
        aoFechar={() => setTrechoSelecionado(null)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verificar que o projeto builda e roda**

Run: `npm run build`
Expected: build termina sem erro.

Run: `npm run lint`
Expected: sem novos erros/warnings.

- [ ] **Step 3: Checagem manual rápida no navegador**

Run: `npm run dev` (deixar rodando em background)

Abrir `http://localhost:5173/app` no navegador. Esperado: o mapa OpenStreetMap aparece, centralizado em Recife (nenhum trecho carregado ainda nesta etapa, então a lista vem vazia do backend — se o backend não estiver rodando, a mensagem de erro da Task 4 Step 1 deve aparecer no lugar do mapa, o que já confirma que o tratamento de erro funciona). Parar o `npm run dev` depois de confirmar.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Mapa.jsx
git commit -m "Conecta a pagina do mapa ao MapaLeaflet, PainelDetalheTrecho e useTrechos"
```

---

### Task 5: Popular dados de exemplo (Recife) e verificação manual end-to-end

**Files:**
- Nenhum (dados de teste cadastrados via curl direto no banco local; nenhum arquivo do repositório é criado ou modificado).

**Interfaces:**
- Consumes: toda a stack das Tasks 1-4, mais o backend da Fase 1 (`/api/v1/regioes`, `/api/v1/trechos`) já mergeado em `main`.
- Produces: confirmação visual de que o mapa renderiza trechos reais e que o painel de detalhes funciona — o gate final pedido antes de reportar a Fase 2 como pronta.

- [ ] **Step 1: Subir o backend com Postgres**

A partir da raiz do repo (`C:\PROJETO PÉ-RÍMETRO`): `docker compose up -d`, esperar o Postgres ficar pronto, depois `cd backend && ./mvnw spring-boot:run` em background. Esperar o log mostrar `Started PerimetroBackendApplication`.

- [ ] **Step 2: Cadastrar uma Região de exemplo**

Run:
```
curl -s -X POST http://localhost:8080/api/v1/regioes -H "Content-Type: application/json" -d "{\"nome\":\"Boa Viagem\"}"
```
Expected: `201`, corpo com um `id` — guardar como `REGIAO_ID`.

- [ ] **Step 3: Cadastrar dois Trechos de exemplo em Boa Viagem/Recife**

Run (substituindo `REGIAO_ID` pelo valor do Step 2):
```
curl -s -X POST http://localhost:8080/api/v1/trechos -H "Content-Type: application/json" -d "{\"nome\":\"Av. Boa Viagem\",\"geometria\":[{\"lat\":-8.1207,\"lng\":-34.9008},{\"lat\":-8.1240,\"lng\":-34.9030},{\"lat\":-8.1270,\"lng\":-34.9050}],\"latitude\":-8.1207,\"longitude\":-34.9008,\"regiaoId\":\"REGIAO_ID\"}"
```
```
curl -s -X POST http://localhost:8080/api/v1/trechos -H "Content-Type: application/json" -d "{\"nome\":\"Rua Barão de Souza Leão\",\"geometria\":[{\"lat\":-8.1180,\"lng\":-34.9040},{\"lat\":-8.1210,\"lng\":-34.9065}],\"latitude\":-8.1180,\"longitude\":-34.9040,\"regiaoId\":\"REGIAO_ID\"}"
```
Expected: `201` nas duas, cada uma com `"status":"ATIVO"` e `"indiceAtual":null`.

- [ ] **Step 4: Subir o frontend e verificar visualmente**

A partir de `frontend/`: `npm run dev`. Abrir `http://localhost:5173/app`.

Confirmar visualmente:
1. O mapa carrega centralizado na região dos dois trechos cadastrados (não mais no fallback de Recife-centro, já que agora há trechos).
2. As duas linhas (Av. Boa Viagem, Rua Barão de Souza Leão) aparecem desenhadas sobre o mapa.
3. Clicar em uma das linhas abre o painel de detalhes flutuante, mostrando o nome do trecho, o badge de status "ATIVO", e a mensagem de "ainda sem avaliações".
4. Fechar o painel (botão de fechar) faz ele sumir; a linha volta à cor não-selecionada.
5. Clicar na outra linha troca a seleção corretamente.

- [ ] **Step 5: Encerrar os processos**

Parar `npm run dev` e o processo do backend (`./mvnw spring-boot:run`). Rodar `docker compose down` a partir da raiz do repo.

- [ ] **Step 6: Reportar ao usuário**

Confirmar que o mapa está renderizando na tela com trechos reais e que o painel de detalhes funciona, conforme pedido.
