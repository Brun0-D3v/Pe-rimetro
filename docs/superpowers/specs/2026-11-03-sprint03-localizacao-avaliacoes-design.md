# Sprint 03 - Localização em Tempo Real, Avaliações e Índice - Spec

Data: 2026-11-03
Status: aprovado em conversa (seções 1 a 4), aguardando revisão do spec escrito
Repositórios afetados: `backend/` e `frontend/` (código); Vault em `C:\CLAUDE\PÉ-RÍMETRO` (documentação)

## Contexto

A Sprint 02 entregou o núcleo geográfico (Região/Trecho), a API REST e o mapa interativo desktop. Dois fatos motivam esta sprint:

1. O mapa não mostra onde o usuário está. Esta é a **prioridade declarada** da sprint.
2. O núcleo P0 do MVP ainda não está completo: faltam Avaliações das 6 dimensões e o cálculo automático do Índice de Caminhabilidade (`Trecho.indiceAtual` é sempre `null` hoje; o mapa usa uma camada demonstrativa com dados fictícios).

Há ainda uma dívida técnica decidida em 2026-09-21: testes de integração com Testcontainers, porque dois defeitos reais no mapeamento JSONB/FK só apareceram na verificação manual.

## Decisões já tomadas (não reabrir sem nova aprovação)

- **Alcance da localização:** apenas o ponto do usuário no mapa, atualizado continuamente. Sem backend, sem histórico de posições. "Avaliar o trecho onde estou", detecção do trecho mais próximo e rastreio de caminhada ficam **fora** (viram ideias no Vault).
- **Avaliação anônima nesta sprint:** `usuario_id` nulo. O login (JWT) continua na Sprint 04, que passa a preencher o campo. O roadmap não muda.
- **Escala:** nota inteira de 0 a 10 em cada uma das 6 dimensões.
- **Pesos (já decididos em [[Índice de Caminhabilidade]]):** Calçada 25%, Acessibilidade 25%, Iluminação 15%, Arborização 15%, Travessias 10%, Mobiliário 10%.
- **Agregação:** média simples de todas as avaliações do trecho.
- **Cálculo no backend** (ADR-005, Opção 1), persistido em `trecho.indice_atual`.
- **Faixas:** Ruim `< 4,0`; Médio de `4,0` a `6,9`; Bom `>= 7,0`; sem avaliações quando `indiceAtual` é nulo. A classificação é calculada **somente no backend**.
- **Trecho `INATIVO` não aceita avaliação** (`409`).
- **Ordem de execução:** Localização, Testcontainers, backend de Avaliações, frontend de Avaliação, com a documentação do Vault fechada ao fim de cada fase.

## Fase 1 - Localização em tempo real (frontend)

### Arquitetura de arquivos

```
frontend/src/
├── hooks/
│   └── useLocalizacao.js            # NOVO - envolve navigator.geolocation.watchPosition
├── components/mapa/
│   ├── MarcadorUsuario.jsx          # NOVO - ponto azul + círculo de precisão
│   ├── AvisoLocalizacao.jsx         # NOVO - mensagem discreta de erro/estado
│   ├── ControlesMapa.jsx            # MODIFICADO - botão "Minha localização"; novo ícone no reset
│   └── MapaLeaflet.jsx              # MODIFICADO - recebe/entrega a posição e o comando de centralizar
└── pages/Mapa.jsx                   # MODIFICADO - liga o hook aos componentes
```

### Hook `useLocalizacao`

Expõe `{ posicao, precisao, estado, erro, ativar, desativar }`.

- `posicao`: `{ lat, lng }` ou `null`. `precisao`: metros ou `null`.
- `estado`: `inativo` | `buscando` | `ativo` | `negado` | `indisponivel` | `sem_suporte`.
- `ativar()` chama `watchPosition` com `enableHighAccuracy: true`, `maximumAge` curto e `timeout` finito. `desativar()` e o desmonte do componente chamam `clearWatch`.
- A permissão do navegador só é solicitada **após um clique do usuário**, nunca ao abrir a página.
- Mapeamento de erros da API: `PERMISSION_DENIED` -> `negado`; `POSITION_UNAVAILABLE` e `TIMEOUT` -> `indisponivel`; ausência de `navigator.geolocation` -> `sem_suporte`.
- A posição só é atualizada no estado quando muda de forma relevante, para não redesenhar o marcador a cada leitura.

### Comportamento no mapa

- O **primeiro fix** centraliza o mapa na pessoa com zoom 17. Depois disso o mapa **não a segue à força**. Um segundo toque no botão reativa o "seguir" e recentraliza.
- `MarcadorUsuario` usa um marcador de ponto com halo e um `Circle` com o raio de precisão, visualmente distinto das linhas dos trechos, e respeita o tema claro/escuro via tokens existentes.
- `AvisoLocalizacao` informa permissão negada (com a instrução de como reativar), sinal indisponível e navegador sem suporte.
- O botão atual `LocateFixed` do `ControlesMapa` significa "voltar à visualização inicial". Ele passa a usar outro ícone (enquadrar/início) e o ícone de mira fica para "Minha localização", para evitar dois botões com a mesma aparência e significados diferentes.

### Restrições e privacidade

- A Geolocation API exige **HTTPS ou `localhost`**. Funciona em desenvolvimento; é requisito do deploy.
- A posição **nunca sai do navegador**. Nada é enviado ao backend nem gravado.
- Aplicativo mobile nativo continua Won't Have; a feature roda no navegador, inclusive em celulares.

### Testes

O projeto não tem suíte de frontend. Esta fase introduz o **Vitest** apenas para `useLocalizacao`, com `navigator.geolocation` simulado, cobrindo: sem suporte, permissão negada, indisponível, fix com sucesso, atualização de posição e `clearWatch` ao desmontar. O restante do frontend continua verificado por `npm run lint`, `npm run build` e verificação manual.

## Fase 2 - Testcontainers (backend)

Postgres real nos testes de integração (JUnit + Testcontainers, com Flyway aplicando as migrations reais). Cobertura inicial, conforme o Backlog:

- Persistência e leitura de `Trecho.geometria` (JSONB com `PontoDto`).
- Restrição de FK `trecho.regiao_id` com `ON DELETE RESTRICT` (deletar Região com Trechos retorna `409` no nível de API).

A Fase 3 reusa essa infraestrutura. Requer Docker em execução, igual ao ambiente já documentado em [[ADR-006 - Docker Compose para PostgreSQL Local]]. Os testes existentes com mocks são mantidos.

## Fase 3 - Backend de Avaliações e Índice

### Dados

Duas migrations Flyway (numeração seguinte à V2, conferir a última existente ao implementar):

- **Tabela `avaliacao`:** `id uuid` PK (`gen_random_uuid()`), `trecho_id uuid NOT NULL` FK para `trecho(id)` `ON DELETE RESTRICT`, `usuario_id uuid NULL` (sem FK nesta sprint; a FK é adicionada na Sprint 04 quando `usuario` existir), seis colunas `nota_calcada`, `nota_acessibilidade`, `nota_iluminacao`, `nota_arborizacao`, `nota_travessias`, `nota_mobiliario` do tipo `SMALLINT NOT NULL CHECK (valor BETWEEN 0 AND 10)`, `criado_em timestamptz NOT NULL DEFAULT now()`. Índice em `avaliacao(trecho_id)`.
- **Coluna em `trecho`:** `total_avaliacoes integer NOT NULL DEFAULT 0`.

`trecho.indice_atual` (`numeric(4,2)`) já comporta valores de 0,00 a 10,00. A interface exibe uma casa decimal.

### Endpoint

`POST /api/v1/trechos/{trechoId}/avaliacoes`

Corpo: as 6 notas inteiras de 0 a 10. Resposta `201` com a avaliação criada e o trecho atualizado (`indiceAtual`, `totalAvaliacoes`, `classificacao`).

| Situação | Código |
|---|---|
| Nota ausente, não inteira ou fora de 0 a 10 | `400` |
| Trecho inexistente | `404` |
| Trecho `INATIVO` | `409` |

Todos no formato `ErroResponseDto` já em uso. Não há `GET` de histórico de avaliações nesta sprint, porque nada o consome.

`GET /api/v1/trechos` e `GET /api/v1/trechos/{id}` passam a retornar também `totalAvaliacoes` e `classificacao` (`BOM`, `MEDIO`, `RUIM` ou `null` quando não há avaliações).

### Cálculo

- Índice de uma avaliação: `Σ nota_dimensão × peso_dimensão`.
- Índice do trecho: média simples dos índices de todas as suas avaliações (equivalente, por linearidade, a ponderar a média de cada dimensão).
- Ao salvar, o serviço grava a avaliação e **recalcula por consulta agregada** (`AVG`) sobre as avaliações do trecho, em vez de incrementar, mantendo o resultado idempotente. A linha do `trecho` é travada (`PESSIMISTIC_WRITE`) durante a transação para evitar perda de atualização em avaliações simultâneas. `total_avaliacoes` é atualizado na mesma transação.
- Pesos e faixas ficam em uma única classe de domínio, com teste unitário, e são a única fonte da regra (REGRA 08 do Vault).

### Testes

Unitários para a fórmula, os pesos e as faixas nos limites (3,9 / 4,0 / 6,9 / 7,0). Integração (Testcontainers) para: criar avaliação atualiza `indiceAtual` e `totalAvaliacoes`; duas avaliações resultam na média; `CHECK` do banco rejeita nota fora da faixa; avaliação de trecho inativo retorna `409`; avaliação de trecho inexistente retorna `404`.

## Fase 4 - Frontend de Avaliação e índice no mapa

- `PainelDetalheTrecho` ganha o botão "Avaliar este trecho" que abre `FormularioAvaliacao`: 6 sliders de 0 a 10 com rótulos nas pontas e um texto de apoio curto por dimensão. Os textos de apoio são **conteúdo de produto ainda não definido**; serão escritos como proposta e registrados no Vault com `status: proposta` para ajuste.
- Estados completos: enviando (botão desabilitado), erro inline, sucesso, e o painel e o mapa refletindo o novo índice sem recarregar a página.
- `avaliacaoService` com `POST`, e `useTrechos` com forma de atualizar um trecho após a avaliação.
- Os traços (`Polyline`) passam a usar os tokens `--color-indice-bom/medio/ruim` conforme `classificacao`; trecho sem avaliação usa um tom neutro. O painel exibe índice (uma casa decimal), faixa e total de avaliações.
- `LegendaMapa` passa a descrever as faixas reais (e "sem avaliações"), sem o rótulo "demonstração".
- `CamadaCaminhabilidadeDemo` e o toggle correspondente em `PainelFiltros` são **removidos**.
- Verificação: `npm run lint`, `npm run build` e verificação manual contra backend e Postgres reais.

## Fase 5 - Documentação do Vault

Executada ao fim de cada fase, não acumulada no fim da sprint (lição da Sprint 02).

- **ADR-005** passa de `proposta` para `decidida` (cálculo no backend).
- **ADR-011 - Avaliação Anônima até a Sprint 04** (nova).
- **ADR-012 - Geolocalização do Usuário no Navegador** (nova; inclui a introdução do Vitest para o hook).
- Atualizar [[Índice de Decisões]], [[Regras de Avaliação]] (hoje diz "usuário autenticado"), [[Critérios de Avaliação]] (escala 0 a 10), [[Classificação do Índice]] (faixas), [[Índice de Caminhabilidade]], [[Mapa - UX]], [[Mapa e Geolocalização]], [[Avaliacao]], [[Trecho]], [[Modelo de Dados]], [[Diagrama ER]], [[Dicionário de Dados]], [[Scripts SQL]], [[Avaliacoes]] (API), [[Trechos]] (campos novos), [[Códigos HTTP]], [[Backlog]] (item Testcontainers concluído) e [[Tarefas Concluídas]].
- Nota nova para a localização em tempo real e ideias futuras ("avaliar onde estou", trecho mais próximo, rastreio) em [[Ideias de UX]].
- [[Sprint 03 - Avaliações e Índice]] ganha o escopo real e vira `em_desenvolvimento`; [[Status do Projeto]], [[Roadmap de Sprints]] e o diário do dia acompanham.

## Critérios de aceitação

- Backend: `mvn test` verde, incluindo os testes de integração com Testcontainers.
- Frontend: `npm run lint`, `npm run build` e os testes do Vitest sem erros.
- Verificação manual ponta a ponta contra Postgres real e navegador: ativar a localização e ver o marcador com o círculo de precisão; negar a permissão e ver o aviso; avaliar um trecho e ver o índice, a cor e o total de avaliações mudarem; avaliar uma segunda vez e ver a média; tentar avaliar um trecho inativo e receber o erro.
- Vault sincronizado com o que foi implementado ao fim de cada fase, sem notas em "proposta" para o que já existe em código.

## Fora de escopo

- Login, usuários e vínculo do autor da avaliação (Sprint 04).
- Reavaliação, edição e exclusão de avaliação; limite de avaliações por pessoa; proteção contra abuso de avaliações anônimas.
- Histórico de avaliações por `GET` e qualquer tela de listagem delas.
- "Avaliar o trecho onde estou", trecho mais próximo e rastreio de caminhada.
- Persistir ou enviar ao servidor a posição do usuário.
- Agregação por recência ou por janela das N mais recentes.
- Clusterização de trechos no mapa; paginação.
- Testes automatizados de frontend além do hook de localização.

## Riscos e pontos de atenção

- **Avaliação anônima sem controle de abuso:** qualquer pessoa pode avaliar várias vezes e distorcer o índice até a Sprint 04. Aceito conscientemente; registrado na ADR-011.
- **HTTPS no deploy:** sem HTTPS, a localização não funciona fora de `localhost`.
- **Chave do Stadia no deploy** (já registrada em ADR-010), junto com HTTPS, entra na lista de pré-requisitos de publicação.
- **Precisão do GPS em ambiente urbano:** o círculo de precisão torna a incerteza visível; não há tentativa de "corrigir" a posição.
- **Textos de apoio das dimensões** são conteúdo de produto não definido; ficam como proposta até validação.
