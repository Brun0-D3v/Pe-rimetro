# Sprint 02 — Fase 2: Mapa Interativo (Frontend)

Data: 2026-09-21
Status: aprovado para implementação
Repositório afetado: `frontend/` (React 19 + Vite + Tailwind CSS 4)
Documentação relacionada no Vault: [[Sprint 02 - Mapa e Trechos]], [[Mapa - UX]], [[Mapa e Geolocalização]], [[ADR-004]], [[ADR-009 - Landing Page e Navegação Flutuante]]

## Contexto

A Fase 1 (backend) entregou o núcleo geográfico completo: `/api/v1/regioes` e `/api/v1/trechos` em produção, com CRUD, geometria em JSONB (lista de pontos), filtro por região, e testes automatizados — já revisada, mergeada em `main` e aprovada pelo Tech Lead. O banco de dados está vazio (nenhum dado cadastrado ainda).

No frontend, `pages/Mapa.jsx` é hoje um placeholder ("O mapa interativo de trechos será implementado na Sprint 02"). O app não tem sidebar — foi removida no reskin anterior (ADR-009), substituída por uma navbar flutuante (`AppNavbar.jsx`), com o conteúdo de cada página ocupando a área abaixo dela.

Esta Fase 2 implementa o mapa interativo: usuário entra na página do mapa, vê os trechos cadastrados desenhados sobre um mapa OpenStreetMap, clica em um trecho, e vê um painel com os detalhes daquele trecho. Não inclui: cadastro de trechos pela UI (fica pra uma fase futura), filtro por região na UI, paginação, ou qualquer lógica de Avaliação/Índice (esses campos existem no contrato da API mas ficam `null`/inertes até o módulo de Avaliação existir).

## Decisões já tomadas (não reabrir sem nova aprovação)

- **Painel de detalhes é um overlay flutuante sobre o mapa, não uma sidebar fixa.** Confirmado explicitamente com o usuário: a menção a "sidebar" no pedido original se referia ao painel de detalhes em si, não a uma coluna lateral dedicada. Mantém a decisão já registrada em [[Mapa - UX]] (mapa domina a tela, sem painel lateral fixo) e a arquitetura de navegação atual (`AppNavbar` flutuante, sem `Sidebar.jsx`).
- **Conecta ao endpoint real (`GET /api/v1/trechos`), sem mock no código React.** O banco está vazio; dados de teste são cadastrados manualmente via curl direto no Postgres local depois que o código estiver pronto — não faz parte do código do frontend.
- **Estado (lista de trechos, trecho selecionado) fica local em `Mapa.jsx`**, via hooks. Nenhuma outra página do app depende desse estado hoje; um Context seria prematuro (YAGNI).
- **Cada trecho é desenhado como um `<Polyline>` do `react-leaflet`** (um por trecho), não uma camada única otimizada com clustering. Volume de dados desta fase é pequeno (dados de demo cadastrados manualmente); a própria nota [[Mapa e Geolocalização]] já registra estratégia de performance para muitos trechos como decisão em aberto para o futuro, não para agora.
- **Tile provider: OpenStreetMap** (`tile.openstreetmap.org`, sem API key), já ratificado na Fase 1 (fecha o `ADR-004`, que estava "decidida (parcial)").
- **Centro inicial do mapa: Recife (Marco Zero, -8.0631, -34.8711).** Recentraliza automaticamente no centróide dos trechos carregados quando houver dados; a coordenada de Recife é só o fallback para quando a lista de trechos está vazia.
- **Cor dos trechos nesta fase é neutra** (não usa ainda os tokens `--color-indice-bom/medio/ruim`), porque `indiceAtual` é sempre `null` — nenhuma Avaliação existe ainda. Esses tokens entram em uso real quando o módulo de Avaliação (sprint futura) popular o índice.
- **`PainelDetalheTrecho` é construído com a skill `21st:21st-ui-build`**, usando os tokens de design já existentes (paleta azul-marinho, `Card`/`Button` como referência de estilo) — não um MCP externo (não há `.mcp.json` configurado neste projeto; a skill `21st-ui-build` é o equivalente disponível nesta sessão).
- **Sem suíte de testes automatizados de frontend** (confirmado desde a Fase de reskin) — verificação por tarefa é `npm run lint` + `npm run build`; verificação funcional é manual, via `npm run dev` no navegador.

## Arquitetura de arquivos

```
frontend/src/
├── pages/
│   └── Mapa.jsx                      # REESCRITO — orquestra useTrechos, MapaLeaflet, PainelDetalheTrecho
├── services/
│   └── trechoService.js              # NOVO — buscarTrechos(), padrão de services/healthService.js
├── hooks/
│   └── useTrechos.js                 # NOVO — padrão de hooks/useStatusSaude.js
└── components/
    └── mapa/
        ├── MapaLeaflet.jsx           # NOVO — MapContainer + TileLayer OSM + Polyline por trecho
        └── PainelDetalheTrecho.jsx   # NOVO — overlay flutuante com os detalhes do trecho selecionado
```

`components/ui/Card.jsx` e `Button.jsx` (já existentes) são reaproveitados como base visual do painel. Nenhum arquivo de `context/` é criado. `App.jsx`/`Layout.jsx`/`AppNavbar.jsx` não mudam — `Layout.jsx` já aplica `pt-24 px-4 pb-8 md:px-8` a todas as páginas (espaço pra a navbar flutuante não cobrir o conteúdo). `MapaLeaflet` preenche toda a área disponível dentro desse espaço com padding (ex.: `h-[calc(100vh-8rem)]`), não a viewport inteira por baixo da navbar — "mapa domina a tela" nesta fase significa dominar a área de conteúdo da página, sem criar um caso especial de layout só para a rota do mapa.

## Dependências novas

`leaflet` e `react-leaflet` (`npm install leaflet react-leaflet`). Leaflet exige seu próprio CSS (`leaflet/dist/leaflet.css`) — importado uma vez em `Mapa.jsx` (único lugar que usa o mapa) ou em `main.jsx`, e precisa do fix conhecido de ícone de marcador quebrado ao empacotar com Vite (os ícones padrão do Leaflet não são usados diretamente aqui, já que os trechos são linhas, não marcadores — mas o import do CSS continua necessário para os controles de zoom/atribuição renderizarem corretamente).

## Contrato de dados consumido

`GET /api/v1/trechos` retorna `TrechoResponseDto[]`:
```json
[
  {
    "id": "uuid",
    "nome": "string",
    "geometria": [{ "lat": number, "lng": number }, ...],
    "latitude": number,
    "longitude": number,
    "indiceAtual": null,
    "status": "ATIVO" | "INATIVO",
    "regiaoId": "uuid"
  }
]
```
`trechoService.buscarTrechos()` chama esse endpoint via a instância `api` (axios) já existente e retorna a lista completa — sem filtro por região nesta fase (o backend já suporta `?regiaoId=`, mas a UI de filtro fica para depois).

## Fluxo de interação

1. `Mapa.jsx` monta, `useTrechos()` dispara `buscarTrechos()`. Enquanto carrega, `MapaLeaflet` renderiza normalmente (o mapa base não depende dos dados); a lista de trechos chega e os `<Polyline>` aparecem.
2. `MapaLeaflet` recebe `trechos` e `onSelecionarTrecho(trecho)` como props. Cada `<Polyline>` usa `trecho.geometria.map(p => [p.lat, p.lng])` como posições, tem um `eventHandlers={{ click: () => onSelecionarTrecho(trecho) }}`.
3. Ao clicar, `Mapa.jsx` guarda `trechoSelecionado` em state e renderiza `<PainelDetalheTrecho trecho={trechoSelecionado} aoFechar={...} />` como overlay (posicionado sobre o mapa, não no fluxo do documento).
4. Fechar o painel (botão de fechar ou clicar fora) limpa `trechoSelecionado` — o painel some.
5. Erro de rede ao buscar trechos: `useTrechos()` expõe `erro` (mesmo padrão de `useStatusSaude`); `Mapa.jsx` mostra uma mensagem simples no lugar do mapa nesse caso (sem retry automático nesta fase).

## Fora de escopo desta fase

- Cadastro/edição de Regiao/Trecho pela UI.
- Filtro por região na interface (o backend já suporta; UI fica para depois).
- Uso real dos tokens de cor por índice (depende do módulo de Avaliação).
- Paginação ou bounding box (decisão explícita do Tech Lead: resolver quando o volume de dados justificar).
- Testes automatizados de frontend (não existem neste projeto).
- Autenticação (Sprint 04, já documentado).
