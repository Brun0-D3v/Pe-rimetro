# Mapa Interativo Desktop — Spec

Data: 2026-10-23
Status: aprovado para implementação (decisões confirmadas com o usuário nesta sessão)
Repositório afetado: `frontend/` (React 19 + Vite + Tailwind CSS 4 + Leaflet/react-leaflet)

## Contexto

O pedido original pedia para avaliar a troca do mapa (hoje Leaflet + OpenStreetMap, [[ADR-004 - Leaflet e OpenStreetMap|ADR-004]], implementado na Sprint 02 Fase 1/2) por MapLibre GL JS + MapTiler, além de construir uma interface desktop completa (cabeçalho com busca e alternância de tema, painel lateral de filtros/camadas, legenda, controles de zoom/reset, seleção com detalhe, atribuição cartográfica) com suporte a tema claro/escuro.

Três decisões foram levadas ao usuário antes de planejar, porque alteravam o escopo de forma material:

1. **Stack do mapa:** manter **Leaflet + OpenStreetMap** (já implementado e decidido), em vez de trocar para MapLibre GL JS + MapTiler. Decisão do usuário: manter Leaflet. Não há reversão do ADR-004, não há nova dependência de API key.
2. **Credencial de serviço de mapa:** não se aplica (decisão 1 descartou MapTiler).
3. **Numeração da sprint:** este trabalho ("Sprint 1 — Mapa interativo desktop", conforme o pedido do usuário) é tratado como um pedido avulso de implementação, **sem vínculo com a numeração de Sprints do Vault** (`C:\CLAUDE\PÉ-RÍMETRO`), que já tem Sprint 01 e Sprint 02 concluídas. Nenhuma nota do Vault será criada/alterada como parte deste plano.

Consequência prática da decisão 1: para oferecer tema claro/escuro com qualidade cartográfica (o motivo real de cogitar tiles vetoriais), usamos dois conjuntos de tiles **raster gratuitos, sem chave de API**: CARTO Dark Matter (escuro) e CARTO Positron (claro) — ambos servidos sobre dados OpenStreetMap, com atribuição dupla obrigatória (OpenStreetMap + CARTO). Isso cobre o requisito de "estilo cartográfico escuro padrão + estilo claro alternativo" sem introduzir nenhuma dependência paga/com chave.

## Decisões já tomadas (não reabrir sem nova aprovação)

- **Mapa:** Leaflet + react-leaflet (já em uso). Tiles trocam por tema: CARTO `dark_all` (escuro, padrão) / CARTO `light_all` (claro). Configuração centralizada em `frontend/src/config/mapaConfig.js` (URLs, atribuição, centro/zoom padrão) — não há variável de ambiente de chave, porque nenhum dos dois serviços exige uma.
- **Tema claro/escuro é greenfield.** Hoje o projeto não tem nenhum mecanismo de tema (paleta fixa escura, `body { text-white }`). Criamos `ThemeContext`/`useTheme()` com persistência simples em `localStorage` (chave `perimetro-tema`, valores `"escuro"`/`"claro"`, default `"escuro"` — mantém o visual atual inalterado por padrão).
- **Escopo do tema é a tela do Mapa, não o app inteiro.** A alternância de tema re-estiliza o mapa e os componentes novos desta tela (cabeçalho, painel de filtros, legenda, painel de detalhe do trecho) — não a Landing, não o `AppNavbar` global, não Dashboard/Avaliação/Ocorrência. Implementado via atributo `data-theme` num `<div>` que envolve toda a página do Mapa (não em `<html>`/`<body>`), com overrides de CSS custom properties escopados a esse atributo. Isso respeita a instrução explícita do pedido original de manter o escopo restrito ao mapa, e evita reescrever componentes de páginas que não têm relação com este trabalho.
- **Troca de tema não reinicializa o mapa, não perde filtros, não muda a localização atual** — o `<MapContainer>` do Leaflet nunca desmonta ao trocar tema; só a prop de URL do `TileLayer` muda.
- **Busca de locais é client-side, sobre os Trechos já carregados** — não é um geocoder de endereços. Pesquisa por `trecho.nome` (e, se o usuário digitar o nome de uma região, por `regiao.nome` via os trechos daquela região) na lista já buscada de `GET /api/v1/trechos`. Nenhum serviço de geocodificação é introduzido (não haveria decisão/orçamento para isso, e o pedido original não exige correspondência com endereços reais do mundo).
- **Filtro por região na UI** usa o parâmetro `?regiaoId=` que o backend já suporta (documentado em [[Trechos]] desde a Sprint 02 Fase 1, mas sem UI até agora). Isso exige uma pequena extensão em `trechoService.buscarTrechos` e `useTrechos` para aceitar um `regiaoId` opcional, e um novo `regiaoService`/`useRegioes` para popular o seletor.
- **Filtro por status (ativo/inativo)** é client-side, sobre os trechos já carregados (o backend não tem esse filtro; criar um não está no pedido, e o volume de dados não justifica).
- **Camada de caminhabilidade é demonstrativa**, conforme pedido explícito: nenhum índice real existe ainda (`indiceAtual` é sempre `null`, módulo de Avaliação não existe — Sprint 03 do Vault). A camada usa pontos fixos com valores fictícios de categoria (bom/médio/ruim), claramente identificados como demonstração em qualquer tooltip/legenda, e só aparece quando o usuário ativa o toggle correspondente no painel lateral. Não há nenhum cálculo de índice.
- **Atribuição cartográfica** segue visível via o controle de atribuição padrão do Leaflet, com o texto trocando conforme o tema (inclui CARTO quando usando tiles CARTO).
- **Controles de zoom/reset são customizados** (não os controles padrão do Leaflet, desligados via `zoomControl={false}`), para manter a estética minimalista dos tokens de design já existentes, em vez de duas UIs de zoom coexistindo.
- **Sem testes automatizados de frontend** (confirmado desde a Sprint 02) — verificação por tarefa é `npm run lint` + `npm run build`; verificação funcional é manual via `npm run dev`.

## Arquitetura de arquivos

```
frontend/src/
├── config/
│   └── mapaConfig.js                      # NOVO — tiles por tema, atribuição, centro/zoom padrão
├── context/
│   └── ThemeContext.jsx                   # NOVO — ThemeProvider + useTheme(), persistência em localStorage
├── services/
│   ├── trechoService.js                   # MODIFICADO — buscarTrechos(regiaoId?) aceita filtro opcional
│   └── regiaoService.js                   # NOVO — buscarRegioes(), padrão de trechoService.js
├── hooks/
│   ├── useTrechos.js                      # MODIFICADO — aceita regiaoId opcional, refaz busca quando muda
│   └── useRegioes.js                      # NOVO — padrão de useTrechos.js
├── components/
│   ├── ThemeToggle.jsx                    # NOVO — botão sol/lua, usa useTheme()
│   ├── ui/
│   │   ├── Button.jsx                     # MODIFICADO — text-white → text-texto (token novo)
│   └── mapa/
│       ├── MapaLeaflet.jsx                # MODIFICADO — tiles por tema, zoomControl desligado, foco de busca
│       ├── PainelDetalheTrecho.jsx        # MODIFICADO — text-white → text-texto
│       ├── CabecalhoMapa.jsx              # NOVO — identificação do sistema, busca, ThemeToggle
│       ├── PainelFiltros.jsx              # NOVO — sidebar recolhível: região, status, camada demo
│       ├── LegendaMapa.jsx                # NOVO — legenda das categorias de caminhabilidade (demo)
│       ├── ControlesMapa.jsx              # NOVO — zoom in/out + reset de visualização
│       └── CamadaCaminhabilidadeDemo.jsx  # NOVO — pontos fictícios, claramente marcados como demo
└── styles/
    └── index.css                          # MODIFICADO — token `--color-texto`, bloco `[data-theme="light"]`
```

`Card.jsx` e `Badge.jsx` já usam tokens semânticos (`bg-base-*`, `text-texto-mute`) e não precisam de mudança — eles herdam o novo tema automaticamente por estarem dentro do `data-theme` escopado quando usados por `PainelDetalheTrecho`. Fora da tela do Mapa (Landing, Dashboard etc.) nada muda visualmente, porque o valor padrão de cada token (fora de `[data-theme="light"]`) permanece idêntico ao atual.

## Contrato de dados consumido (sem mudança no backend)

- `GET /api/v1/trechos?regiaoId=` — já existe (Sprint 02 Fase 1).
- `GET /api/v1/regioes` — já existe (Sprint 02 Fase 1), usado pelo novo `regiaoService`.

## Fora de escopo

- Qualquer troca de biblioteca de mapas ou de provedor de tiles pago.
- Geocodificação de endereços reais.
- Cálculo real de índice de caminhabilidade.
- Tema claro/escuro fora da tela do Mapa (Landing, Dashboard, Avaliação, Ocorrência, `AppNavbar` global).
- Paginação ou clustering de trechos.
- Testes automatizados de frontend.
