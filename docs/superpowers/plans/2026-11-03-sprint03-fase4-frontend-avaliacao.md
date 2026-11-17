# Sprint 03 Fase 4 - Frontend de Avaliação e Índice no Mapa Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir avaliar um trecho pelo mapa (6 sliders de 0 a 10), mostrar o índice real, a faixa e o total de avaliações, e colorir os trechos pelo índice, removendo a camada demonstrativa.

**Architecture:** Uma configuração única (`indiceConfig.js`) concentra cores, rótulos e formatação das faixas que o backend já devolve em `classificacao`; o frontend não calcula faixa nenhuma. `FormularioAvaliacao` envia `POST /trechos/{id}/avaliacoes` e devolve o trecho atualizado, que `Mapa.jsx` injeta na lista (`useTrechos.atualizarTrecho`) e no painel, sem recarregar a página.

**Tech Stack:** React 19, Vite 8, react-leaflet 5, Tailwind 4, axios, lucide-react, oxlint, Vitest (introduzido no plano da Fase 1).

**Spec:** `docs/superpowers/specs/2026-11-03-sprint03-localizacao-avaliacoes-design.md` (seção "Fase 4")

## Global Constraints

- **Pré-requisitos:** o plano `2026-11-03-sprint03-fase1-localizacao.md` Task 1 (Vitest instalado) e o plano `2026-11-03-sprint03-fase2-3-backend-avaliacoes.md` (endpoint `POST /api/v1/trechos/{trechoId}/avaliacoes` e campos `totalAvaliacoes` e `classificacao` nas respostas de trecho) já concluídos.
- Repositório de código: `C:\PROJETO PÉ-RÍMETRO` (frontend em `frontend/`). Vault: `C:\CLAUDE\PÉ-RÍMETRO` (git separado).
- Contrato do backend (já implementado): `classificacao` é `"BOM" | "MEDIO" | "RUIM" | null`; `indiceAtual` é número com até 2 casas ou `null`; `totalAvaliacoes` é inteiro. Notas: inteiros de 0 a 10; erros vêm como `{ mensagem, ocorridoEm }`.
- Faixas (só informativas para a legenda): Bom `>= 7,0`, Médio de `4,0` a `6,9`, Ruim `< 4,0`. **O frontend nunca recalcula a faixa**; usa `classificacao`.
- Cores das faixas = tokens existentes: bom `#34d399`, médio `#fbbf24`, ruim `#f87171`; trecho sem avaliações mantém o azul neutro `#60a5fa` (`--color-primary-light`). Leaflet exige hex, então os hex ficam em `indiceConfig.js`.
- Ícones: somente `lucide-react`. Tema claro/escuro da tela do mapa continua valendo: usar os tokens semânticos (`bg-base-*`, `text-texto`, `text-texto-mute`, `border-base-4`).
- Os textos de apoio das dimensões são **proposta**: conteúdo de produto ainda não validado; no Vault ficam com `status: proposta`.
- Uma pessoa sem login pode avaliar várias vezes (ADR-011); o frontend não limita isso.
- Sem testes de frontend além do hook de localização e de `indiceConfig`. Verificação do restante: `npm run lint`, `npm run build`, verificação manual.
- Vault: REGRA 04 (data real da sessão; nunca alterar `data_criacao`), REGRA 02, REGRA 06, REGRA 10.

---

### Task 1: Configuração das faixas e das dimensões, serviço e atualização da lista

**Files:**
- Create: `frontend/src/config/indiceConfig.js`
- Test: `frontend/src/config/indiceConfig.test.js`
- Create: `frontend/src/config/dimensoes.js`
- Create: `frontend/src/services/avaliacaoService.js`
- Modify: `frontend/src/hooks/useTrechos.js`

**Interfaces:**
- Produces:
  - `COR_SEM_AVALIACAO: string`, `corDoTrecho(classificacao): string`, `tomDaClassificacao(classificacao): "bom" | "medio" | "ruim" | "neutro"`, `rotuloDaClassificacao(classificacao): string`, `formatarIndice(indice): string`.
  - `DIMENSOES: Array<{ chave: string, rotulo: string, apoio: string }>` com as chaves exatas do corpo do `POST`: `notaCalcada`, `notaAcessibilidade`, `notaIluminacao`, `notaArborizacao`, `notaTravessias`, `notaMobiliario`.
  - `enviarAvaliacao(trechoId: string, notas: object): Promise<{ id, criadoEm, notaCalcada, ..., trecho }>` onde `trecho` tem o mesmo formato dos itens de `GET /trechos`.
  - `useTrechos(regiaoId)` passa a devolver também `atualizarTrecho(trechoAtualizado): void`.

- [ ] **Step 1: Escrever o teste que falha**

`frontend/src/config/indiceConfig.test.js`:
```js
import { describe, expect, it } from "vitest";
import {
  COR_SEM_AVALIACAO,
  corDoTrecho,
  formatarIndice,
  rotuloDaClassificacao,
  tomDaClassificacao,
} from "./indiceConfig";

describe("indiceConfig", () => {
  it("devolve a cor de cada faixa", () => {
    expect(corDoTrecho("BOM")).toBe("#34d399");
    expect(corDoTrecho("MEDIO")).toBe("#fbbf24");
    expect(corDoTrecho("RUIM")).toBe("#f87171");
  });

  it("trecho sem classificação usa a cor neutra", () => {
    expect(corDoTrecho(null)).toBe(COR_SEM_AVALIACAO);
    expect(corDoTrecho(undefined)).toBe(COR_SEM_AVALIACAO);
  });

  it("converte a classificação em tom do Badge", () => {
    expect(tomDaClassificacao("BOM")).toBe("bom");
    expect(tomDaClassificacao("MEDIO")).toBe("medio");
    expect(tomDaClassificacao("RUIM")).toBe("ruim");
    expect(tomDaClassificacao(null)).toBe("neutro");
  });

  it("traduz a classificação em rótulo", () => {
    expect(rotuloDaClassificacao("BOM")).toBe("Bom");
    expect(rotuloDaClassificacao("MEDIO")).toBe("Médio");
    expect(rotuloDaClassificacao("RUIM")).toBe("Ruim");
    expect(rotuloDaClassificacao(null)).toBe("Sem avaliações");
  });

  it("formata o índice com uma casa decimal e vírgula", () => {
    expect(formatarIndice(5.4)).toBe("5,4");
    expect(formatarIndice(7)).toBe("7,0");
    expect(formatarIndice(6.95)).toBe("7,0");
    expect(formatarIndice(10)).toBe("10,0");
  });

  it("índice nulo vira o texto 'Sem índice'", () => {
    expect(formatarIndice(null)).toBe("Sem índice");
    expect(formatarIndice(undefined)).toBe("Sem índice");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run (em `frontend/`): `npm test`
Expected: FAIL (módulo `./indiceConfig` inexistente).

- [ ] **Step 3: Implementar `indiceConfig.js`**

`frontend/src/config/indiceConfig.js`:
```js
// Apresentação das faixas do Índice de Caminhabilidade.
// A faixa em si é decidida só no backend (campo `classificacao`); aqui há apenas
// cores, rótulos e formatação. Leaflet exige hex, por isso os valores dos tokens
// --color-indice-* estão repetidos aqui.
export const COR_SEM_AVALIACAO = "#60a5fa";

const COR_POR_CLASSIFICACAO = {
  BOM: "#34d399",
  MEDIO: "#fbbf24",
  RUIM: "#f87171",
};

const TOM_POR_CLASSIFICACAO = {
  BOM: "bom",
  MEDIO: "medio",
  RUIM: "ruim",
};

const ROTULO_POR_CLASSIFICACAO = {
  BOM: "Bom",
  MEDIO: "Médio",
  RUIM: "Ruim",
};

export function corDoTrecho(classificacao) {
  return COR_POR_CLASSIFICACAO[classificacao] ?? COR_SEM_AVALIACAO;
}

export function tomDaClassificacao(classificacao) {
  return TOM_POR_CLASSIFICACAO[classificacao] ?? "neutro";
}

export function rotuloDaClassificacao(classificacao) {
  return ROTULO_POR_CLASSIFICACAO[classificacao] ?? "Sem avaliações";
}

// O índice é exibido com uma casa decimal, igual ao critério usado pelo backend na faixa.
export function formatarIndice(indice) {
  if (indice === null || indice === undefined) return "Sem índice";
  return (Math.round(Number(indice) * 10) / 10).toFixed(1).replace(".", ",");
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: PASS (os testes de `indiceConfig` e os do hook de localização). Observação: `Math.round(6.95 * 10)` pode dar 69 por erro de ponto flutuante; se o teste `6.95 -> "7,0"` falhar, trocar o cálculo por `Number(Number(indice).toFixed(2))` seguido de `Math.round(x * 10) / 10`, ou usar `Number(indice).toFixed(1)` conferindo o resultado, e ajustar até o teste passar sem alterar o teste.

- [ ] **Step 5: Criar `dimensoes.js`**

`frontend/src/config/dimensoes.js`:
```js
// As 6 dimensões do Índice de Caminhabilidade, na ordem do formulário.
// `chave` é o nome do campo no corpo do POST /trechos/{id}/avaliacoes.
// Os textos de apoio são uma PROPOSTA de produto, ainda não validada.
export const DIMENSOES = [
  { chave: "notaCalcada", rotulo: "Calçada", apoio: "Estado do piso, largura e continuidade da calçada." },
  {
    chave: "notaAcessibilidade",
    rotulo: "Acessibilidade",
    apoio: "Rampas, piso tátil e passagem para cadeira de rodas e carrinhos.",
  },
  { chave: "notaIluminacao", rotulo: "Iluminação", apoio: "Iluminação do trecho à noite." },
  { chave: "notaArborizacao", rotulo: "Arborização", apoio: "Sombra e presença de árvores ao longo do trecho." },
  {
    chave: "notaTravessias",
    rotulo: "Travessias",
    apoio: "Faixas de pedestres, semáforos e segurança para atravessar.",
  },
  {
    chave: "notaMobiliario",
    rotulo: "Mobiliário urbano",
    apoio: "Bancos, lixeiras, pontos de ônibus e outros equipamentos.",
  },
];

export const NOTA_MINIMA = 0;
export const NOTA_MAXIMA = 10;
export const NOTA_INICIAL = 5;
```

- [ ] **Step 6: Criar o serviço**

`frontend/src/services/avaliacaoService.js`:
```js
import api from "./api";

export async function enviarAvaliacao(trechoId, notas) {
  const resposta = await api.post(`/trechos/${trechoId}/avaliacoes`, notas);
  return resposta.data;
}
```

- [ ] **Step 7: Permitir atualizar um trecho na lista**

Substituir `frontend/src/hooks/useTrechos.js` por:
```js
import { useCallback, useEffect, useState } from "react";
import { buscarTrechos } from "../services/trechoService";

export function useTrechos(regiaoId) {
  const [trechos, setTrechos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    setCarregando(true);
    setErro(null);
    buscarTrechos(regiaoId)
      .then(setTrechos)
      .catch(setErro)
      .finally(() => setCarregando(false));
  }, [regiaoId]);

  // Troca um trecho da lista pela versão devolvida pelo backend (ex.: após uma avaliação).
  const atualizarTrecho = useCallback((trechoAtualizado) => {
    setTrechos((lista) => lista.map((trecho) => (trecho.id === trechoAtualizado.id ? trechoAtualizado : trecho)));
  }, []);

  return { trechos, carregando, erro, atualizarTrecho };
}
```

- [ ] **Step 8: Lint, testes e build**

Run: `npm run lint && npm test && npm run build`
Expected: sem erros.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/config frontend/src/services/avaliacaoService.js frontend/src/hooks/useTrechos.js
git commit -m "Adiciona configuracao de faixas, dimensoes e servico de avaliacao"
```
(Terminar a mensagem com a linha de coautoria definida na sessão.)

---

### Task 2: Formulário de avaliação e painel de detalhes

**Files:**
- Create: `frontend/src/components/mapa/FormularioAvaliacao.jsx`
- Modify: `frontend/src/components/mapa/PainelDetalheTrecho.jsx`
- Modify: `frontend/src/components/ui/Badge.jsx`

**Interfaces:**
- Consumes: `DIMENSOES`, `NOTA_MINIMA`, `NOTA_MAXIMA`, `NOTA_INICIAL` (`dimensoes.js`); `enviarAvaliacao` (`avaliacaoService.js`); `tomDaClassificacao`, `rotuloDaClassificacao`, `formatarIndice` (`indiceConfig.js`); `Button`, `Badge`, `Card`.
- Produces:
  - `FormularioAvaliacao({ trechoId, aoConcluir, aoCancelar })`: `aoConcluir(trechoAtualizado)` é chamado com `resposta.trecho` após sucesso; `aoCancelar()` fecha o formulário.
  - `PainelDetalheTrecho({ trecho, aoFechar, aoAvaliado })` com a nova prop `aoAvaliado(trechoAtualizado)`.

- [ ] **Step 1: Criar `FormularioAvaliacao`**

`frontend/src/components/mapa/FormularioAvaliacao.jsx`:
```jsx
import { useState } from "react";
import { DIMENSOES, NOTA_INICIAL, NOTA_MAXIMA, NOTA_MINIMA } from "../../config/dimensoes";
import { enviarAvaliacao } from "../../services/avaliacaoService";
import Button from "../ui/Button";

function notasIniciais() {
  return Object.fromEntries(DIMENSOES.map(({ chave }) => [chave, NOTA_INICIAL]));
}

function mensagemDeErro(erro) {
  return (
    erro.response?.data?.mensagem ?? "Não foi possível enviar a avaliação. Verifique a conexão e tente novamente."
  );
}

export default function FormularioAvaliacao({ trechoId, aoConcluir, aoCancelar }) {
  const [notas, setNotas] = useState(notasIniciais);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  function alterarNota(chave, valor) {
    setNotas((atuais) => ({ ...atuais, [chave]: Number(valor) }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const resposta = await enviarAvaliacao(trechoId, notas);
      aoConcluir(resposta.trecho);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="mt-4 flex max-h-[50dvh] flex-col gap-4 overflow-y-auto pr-1">
      {DIMENSOES.map(({ chave, rotulo, apoio }) => {
        const idCampo = `avaliacao-${chave}`;
        return (
          <div key={chave} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <label htmlFor={idCampo} className="text-sm font-medium text-texto">
                {rotulo}
              </label>
              <output htmlFor={idCampo} className="text-sm font-semibold text-texto">
                {notas[chave]}
              </output>
            </div>
            <input
              id={idCampo}
              type="range"
              min={NOTA_MINIMA}
              max={NOTA_MAXIMA}
              step={1}
              value={notas[chave]}
              disabled={enviando}
              onChange={(evento) => alterarNota(chave, evento.target.value)}
              aria-describedby={`${idCampo}-apoio`}
              className="w-full accent-primary-light"
            />
            <div className="flex justify-between text-xs text-texto-mute">
              <span>{NOTA_MINIMA} (muito ruim)</span>
              <span>{NOTA_MAXIMA} (excelente)</span>
            </div>
            <p id={`${idCampo}-apoio`} className="text-xs text-texto-mute">
              {apoio}
            </p>
          </div>
        );
      })}

      {erro && (
        <p role="alert" className="rounded-lg border border-indice-ruim/40 bg-indice-ruim/10 px-3 py-2 text-sm text-texto">
          {erro}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={enviando}>
          {enviando ? "Enviando..." : "Enviar avaliação"}
        </Button>
        <Button type="button" variante="secundario" onClick={aoCancelar} disabled={enviando}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Reescrever `PainelDetalheTrecho`**

Substituir `frontend/src/components/mapa/PainelDetalheTrecho.jsx` por:
```jsx
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { formatarIndice, rotuloDaClassificacao, tomDaClassificacao } from "../../config/indiceConfig";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";
import FormularioAvaliacao from "./FormularioAvaliacao";

function textoTotal(total) {
  return total === 1 ? "1 avaliação" : `${total} avaliações`;
}

export default function PainelDetalheTrecho({ trecho, aoFechar, aoAvaliado }) {
  const [avaliando, setAvaliando] = useState(false);
  const [confirmacao, setConfirmacao] = useState(false);

  // Ao trocar de trecho, o formulário e a mensagem de sucesso não devem sobreviver.
  const trechoId = trecho?.id;
  useEffect(() => {
    setAvaliando(false);
    setConfirmacao(false);
  }, [trechoId]);

  if (!trecho) return null;

  const semAvaliacoes = trecho.totalAvaliacoes === 0;
  const inativo = trecho.status === "INATIVO";

  function concluirAvaliacao(trechoAtualizado) {
    aoAvaliado(trechoAtualizado);
    setAvaliando(false);
    setConfirmacao(true);
  }

  return (
    <Card className="absolute top-20 right-4 z-[1000] w-[calc(100%-2rem)] max-w-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-texto">{trecho.nome}</h2>
          <div className="flex flex-wrap gap-2">
            <Badge tom={tomDaClassificacao(trecho.classificacao)}>{rotuloDaClassificacao(trecho.classificacao)}</Badge>
            <Badge tom="neutro">{trecho.status}</Badge>
          </div>
        </div>
        <Button variante="fantasma" onClick={aoFechar} aria-label="Fechar painel de detalhes do trecho">
          <X size={16} />
          Fechar
        </Button>
      </div>

      {semAvaliacoes ? (
        <p className="mt-4 text-sm text-texto-mute">Ainda sem avaliações</p>
      ) : (
        <p className="mt-4 text-sm text-texto">
          <span className="text-2xl font-semibold">{formatarIndice(trecho.indiceAtual)}</span>
          <span className="text-texto-mute"> de 10 · {textoTotal(trecho.totalAvaliacoes)}</span>
        </p>
      )}

      {confirmacao && (
        <p role="status" className="mt-3 text-sm text-texto">
          Avaliação enviada. Obrigado!
        </p>
      )}

      {avaliando ? (
        <FormularioAvaliacao
          trechoId={trecho.id}
          aoConcluir={concluirAvaliacao}
          aoCancelar={() => setAvaliando(false)}
        />
      ) : (
        <div className="mt-4">
          <Button
            disabled={inativo}
            onClick={() => {
              setConfirmacao(false);
              setAvaliando(true);
            }}
          >
            Avaliar este trecho
          </Button>
          {inativo && <p className="mt-2 text-xs text-texto-mute">Trechos inativos não recebem avaliações.</p>}
        </div>
      )}
    </Card>
  );
}
```

- [ ] **Step 3: Atualizar o comentário do `Badge`**

Em `frontend/src/components/ui/Badge.jsx`, substituir o bloco de comentário do topo (as quatro linhas que dizem que as faixas ainda não foram decididas) por:
```js
// `tom` recebe uma classificação já decidida por quem chama o componente
// ("bom" | "medio" | "ruim" para o Índice de Caminhabilidade, "neutro" para
// status gerais). A faixa é calculada no backend (campo `classificacao`) e
// traduzida para o tom em config/indiceConfig.js.
```

- [ ] **Step 4: Lint e build**

Run (em `frontend/`): `npm run lint && npm run build`
Expected: sem erros. (O build passa mesmo antes de o `Mapa.jsx` passar `aoAvaliado`; a Task 3 liga as peças.)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/mapa/FormularioAvaliacao.jsx frontend/src/components/mapa/PainelDetalheTrecho.jsx frontend/src/components/ui/Badge.jsx
git commit -m "Adiciona formulario de avaliacao e indice real no painel do trecho"
```
(Terminar a mensagem com a linha de coautoria definida na sessão.)

---

### Task 3: Trechos coloridos pelo índice, legenda real e remoção da camada demo

**Files:**
- Modify: `frontend/src/components/mapa/MapaLeaflet.jsx`
- Modify: `frontend/src/components/mapa/LegendaMapa.jsx`
- Modify: `frontend/src/components/mapa/PainelFiltros.jsx`
- Modify: `frontend/src/pages/Mapa.jsx`
- Delete: `frontend/src/components/mapa/CamadaCaminhabilidadeDemo.jsx`

**Interfaces:**
- Consumes: `corDoTrecho` (`indiceConfig.js`); `useTrechos().atualizarTrecho`; `PainelDetalheTrecho` com `aoAvaliado`.

- [ ] **Step 1: Colorir os traços pelo índice**

Em `frontend/src/components/mapa/MapaLeaflet.jsx`:

Adicionar o import:
```jsx
import { corDoTrecho } from "../../config/indiceConfig";
```
No `<Polyline>`, trocar o `pathOptions` por:
```jsx
          pathOptions={{
            color: corDoTrecho(trecho.classificacao),
            weight: trecho.id === trechoSelecionadoId ? 7 : 4,
          }}
```
(A seleção passa a ser indicada pela espessura, porque a cor agora carrega a faixa.)

- [ ] **Step 2: Reescrever a legenda**

Substituir `frontend/src/components/mapa/LegendaMapa.jsx` por:
```jsx
const FAIXAS = [
  { tom: "bg-indice-bom", rotulo: "Bom", intervalo: "7,0 a 10" },
  { tom: "bg-indice-medio", rotulo: "Médio", intervalo: "4,0 a 6,9" },
  { tom: "bg-indice-ruim", rotulo: "Ruim", intervalo: "0 a 3,9" },
  { tom: "bg-primary-light", rotulo: "Sem avaliações", intervalo: null },
];

export default function LegendaMapa({ className = "" }) {
  return (
    <div
      className={[
        "w-fit rounded-2xl border border-base-4 bg-base-3 p-4 shadow-sm transition-colors duration-base ease-reveal",
        className,
      ].join(" ")}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-texto-mute">Caminhabilidade</p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {FAIXAS.map(({ tom, rotulo, intervalo }) => (
          <li key={rotulo} className="flex items-center gap-2 text-sm text-texto">
            <span className={["h-1.5 w-5 rounded-full", tom].join(" ")} aria-hidden="true" />
            {rotulo}
            {intervalo && <span className="text-texto-mute">({intervalo})</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Remover o toggle da camada demo do `PainelFiltros`**

Em `frontend/src/components/mapa/PainelFiltros.jsx`:
- Remover as props `camadaDemoVisivel` e `aoAlternarCamadaDemo` da desestruturação.
- Remover o último `<label className="flex items-center gap-2 text-sm text-texto">` (o que contém "Camada de caminhabilidade (demonstração)").

- [ ] **Step 4: Atualizar `Mapa.jsx`**

Em `frontend/src/pages/Mapa.jsx`:
- Remover o import de `CamadaCaminhabilidadeDemo`.
- Remover o estado `const [camadaDemoVisivel, setCamadaDemoVisivel] = useState(false);`.
- Trocar `const { trechos, carregando, erro } = useTrechos(regiaoSelecionadaId || undefined);` por:
```jsx
  const { trechos, carregando, erro, atualizarTrecho } = useTrechos(regiaoSelecionadaId || undefined);
```
- Depois da função `selecionarViaBusca`, adicionar:
```jsx
  function aoAvaliarTrecho(trechoAtualizado) {
    atualizarTrecho(trechoAtualizado);
    setTrechoSelecionado(trechoAtualizado);
  }
```
- No `<MapaLeaflet ...>`, remover o filho `{camadaDemoVisivel && <CamadaCaminhabilidadeDemo />}` e transformar a tag em autofechada (`/>`), mantendo todas as props (inclusive as de localização da Fase 1).
- No `<PainelFiltros ...>`, remover as props `camadaDemoVisivel` e `aoAlternarCamadaDemo`.
- Trocar `<PainelDetalheTrecho trecho={trechoSelecionado} aoFechar={() => setTrechoSelecionado(null)} />` por:
```jsx
      <PainelDetalheTrecho
        trecho={trechoSelecionado}
        aoFechar={() => setTrechoSelecionado(null)}
        aoAvaliado={aoAvaliarTrecho}
      />
```

- [ ] **Step 5: Remover a camada demonstrativa**

```bash
git rm frontend/src/components/mapa/CamadaCaminhabilidadeDemo.jsx
```
Conferir que nada mais a importa: `grep -rn "CamadaCaminhabilidadeDemo\|camadaDemo" frontend/src` deve retornar vazio.

- [ ] **Step 6: Lint, testes e build**

Run (em `frontend/`): `npm run lint && npm test && npm run build`
Expected: sem erros.

- [ ] **Step 7: Verificação manual ponta a ponta**

Com `docker compose up -d`, `./mvnw spring-boot:run` (em `backend/`) e `npm run dev` (em `frontend/`), com pelo menos uma região e três trechos cadastrados (um ativo sem avaliações, um ativo para avaliar, um `INATIVO`; criar via `curl` como no plano do backend, Task 4 Step 16):
1. Trechos sem avaliação aparecem em azul; a legenda mostra Bom, Médio, Ruim e Sem avaliações, sem a palavra "demonstração"; o filtro lateral não tem mais a opção de camada demo.
2. Clicar num trecho sem avaliação: o painel mostra "Sem avaliações" e "Ainda sem avaliações".
3. "Avaliar este trecho": aparecem 6 sliders de 0 a 10 com rótulos nas pontas e o texto de apoio. Enviar com todas em 9: o painel passa a mostrar "9,0 de 10 · 1 avaliação", o selo "Bom", e o traço do trecho fica verde **sem recarregar a página**; aparece "Avaliação enviada. Obrigado!".
4. Avaliar o mesmo trecho de novo com notas 1: índice vira 5,0, "2 avaliações", selo "Médio", traço âmbar.
5. Avaliar outro trecho com notas baixas (média abaixo de 4): traço vermelho e selo "Ruim".
6. Clicar no trecho `INATIVO`: o botão "Avaliar este trecho" fica desabilitado com a explicação.
7. Parar o backend e tentar enviar: aparece a mensagem de erro inline, o formulário continua preenchido e o botão volta a ficar habilitado.
8. Alternar tema claro/escuro: o formulário, os selos e a legenda continuam legíveis.
9. Trocar de trecho com o formulário aberto: o formulário fecha.
10. A localização da Fase 1 continua funcionando (botão "Minha localização").

- [ ] **Step 8: Commit**

```bash
git add frontend/src
git commit -m "Colore trechos pelo indice real, atualiza legenda e remove camada demonstrativa"
```
(Terminar a mensagem com a linha de coautoria definida na sessão.)

---

### Task 4: Documentação da Fase 4 e fechamento da Sprint 03 no Vault

**Files (todos em `C:\CLAUDE\PÉ-RÍMETRO`):**
- Modify: `03 - UX-UI/Mapa - UX.md`
- Modify: `03 - UX-UI/Avaliação - UX.md`
- Modify: `03 - UX-UI/Componentes.md`
- Modify: `04 - Regras de Negócio/Critérios de Avaliação.md`
- Modify: `16 - Ideias/Ideias de UX.md`
- Modify: `09 - Sprints/Sprint 03 - Avaliações e Índice.md`
- Modify: `09 - Sprints/Roadmap de Sprints.md`
- Modify: `10 - Tarefas/Tarefas Concluídas.md`
- Modify: `00 - Sistema/Status do Projeto.md`
- Create/Modify: diário do dia

Regras comuns: `data_atualizacao` = data real da sessão; `data_criacao` de notas existentes não muda; só documentar o que foi implementado e verificado nas Tasks 1 a 3; ler cada nota antes de editar e manter o estilo.

- [ ] **Step 1: Notas de UX**

- `Mapa - UX.md`: em "O que já está decidido", acrescentar que os trechos agora são coloridos pelo índice real (Bom/Médio/Ruim, azul para sem avaliações), que a seleção é indicada pela espessura do traço, que o painel mostra índice (uma casa decimal), faixa e total de avaliações, e que a legenda descreve as faixas reais. Marcar a camada de caminhabilidade demonstrativa como **removida** (manter o registro histórico, REGRA 10), e retirar de "O que falta definir" o item "Colorir os trechos pelo índice real quando a Avaliação existir".
- `Avaliação - UX.md`: ler a nota; atualizar `status` para `decidido (parcial)` e documentar o formulário implementado: aberto a partir do painel do trecho ("Avaliar este trecho"), 6 sliders de 0 a 10 inteiros com valor inicial 5, rótulos "0 (muito ruim)" e "10 (excelente)", texto de apoio por dimensão, envio com estado "Enviando...", erro inline e mensagem de sucesso, botão desabilitado para trecho inativo. Registrar que o valor inicial 5 pode enviesar avaliações e que isso é um ponto a reavaliar com dados reais.
- `Componentes.md`: citar `FormularioAvaliacao` e a configuração `indiceConfig`, e atualizar a menção ao mapa para a versão colorida pelo índice real.

- [ ] **Step 2: Textos de apoio como proposta**

Em `Critérios de Avaliação.md`, adicionar a seção "Textos de apoio por dimensão (proposta)" com a tabela de `frontend/src/config/dimensoes.js` (dimensão e texto), marcada explicitamente como **proposta ainda não validada**, e manter o item correspondente em "O que falta definir" (validação dos textos com a equipe/público).

- [ ] **Step 3: Ideias**

Em `Ideias de UX.md`, registrar como ideias (sem prioridade definida): reavaliação/edição de avaliação após o login, limite de avaliações por pessoa e proteção contra abuso (ligado a [[ADR-011 - Avaliação Anônima até a Sprint 04]]), valor inicial neutro dos sliders versus exigir interação em todas as dimensões, e histórico de avaliações de um trecho.

- [ ] **Step 4: Fechar a Sprint 03**

- `Sprint 03 - Avaliações e Índice.md`: `status: concluída`; marcar todos os itens do escopo como `[x]` (localização, Testcontainers, avaliações e índice, frontend de avaliação e trechos coloridos); preencher "Critérios de aceitação" com o que de fato foi usado (suíte do backend verde incluindo integração com Testcontainers, `npm run lint`, `npm test`, `npm run build`, verificação manual ponta a ponta); em "O que foi entregue", resumir por fase com link para [[ADR-005 - Cálculo do Índice no Backend]], [[ADR-011 - Avaliação Anônima até a Sprint 04]], [[ADR-012 - Geolocalização do Usuário no Navegador]] e [[Localização em Tempo Real]]; em "Observações", registrar problemas encontrados e a lista de pré-requisitos de publicação (HTTPS e chave do Stadia).
- `Roadmap de Sprints.md`: a Sprint 03 passa a "concluída" na tabela e na frase de status.
- `Tarefas Concluídas.md`: linhas datadas para "Localização em tempo real", "Frontend de avaliação e índice no mapa" e "Sprint 03 concluída".
- `Status do Projeto.md`: "Estado atual" cita Sprints 01 a 03 concluídas e a próxima ([[Sprint 04 - Autenticação e Ocorrências]]); atualizar "O que está em aberto" (remover o que foi decidido nesta sprint); adicionar marco datado.

- [ ] **Step 5: Diário**

Completar (ou criar, a partir de [[Template - Diário]]) o diário do dia com: o que foi feito na Fase 4, problemas encontrados, o que aprendi, decisões e próximos passos (planejar a Sprint 04).

- [ ] **Step 6: Verificar links e commitar no Vault**

Conferir que todo `[[wikilink]]` das notas alteradas resolve. Depois, em `C:\CLAUDE\PÉ-RÍMETRO`:
```bash
git add -- "00 - Sistema" "03 - UX-UI" "04 - Regras de Negócio" "09 - Sprints" "10 - Tarefas" "16 - Ideias" Diario
git status --short
git commit -m "Documenta frontend de avaliacao e conclusao da Sprint 03"
```
(Terminar a mensagem com a linha de coautoria definida na sessão. Não incluir arquivos alheios, como mudanças em `.obsidian/`.)
