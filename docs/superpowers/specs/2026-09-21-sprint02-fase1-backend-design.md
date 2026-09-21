# Sprint 02 — Fase 1: Núcleo Geográfico (Banco de Dados e Backend)

Data: 2026-09-21
Status: aprovado para implementação
Repositório afetado: `backend/` (Spring Boot 4.1.1, Java 21)
Documentação relacionada no Vault: [[Sprint 02 - Mapa e Trechos]], [[Modelo de Dados]], [[Regiao]], [[Trecho]], [[Scripts SQL]], [[Estrutura Backend]], [[ADR-002 - PostgreSQL]], [[ADR-004]], [[ADR-007 - Flyway para Versionamento de Schema]]

## Contexto

A Sprint 01 entregou só o esqueleto do backend: um único endpoint de health-check (`GET /api/v1/health`), uma tabela (`system_health`) e as convenções de camadas (`controller/service/repository/entity/dto/config/exception`), Flyway e testes (JUnit 5 + Mockito + AssertJ). Nenhuma entidade de domínio existe ainda — `Modelo de Dados`, `Regiao` e `Trecho` seguem todos com status `proposta` no Vault.

A Sprint 02 é o núcleo geográfico do Pé-rímetro: o usuário precisa conseguir ver trechos no mapa e abrir os detalhes de um trecho. Esta Fase 1 cobre só a metade backend — banco de dados, entidades, repositórios, services e controllers para `Regiao` e `Trecho`. A Fase 2 (mapa React/Leaflet, card de detalhes) e a Fase 3 (atualização do Vault) são tratadas em brainstorming/execução separados, como pedido pelo usuário.

Este spec resolve dois pontos que a documentação do Vault deixava explicitamente em aberto antes desta sprint: o formato de geometria do Trecho (`Trecho.md`, `Mapa e Geolocalização.md`) e a ratificação do tile provider do Leaflet (`ADR-004`, parcial) — este segundo ponto é só documental aqui; a integração real do mapa é Fase 2.

## Decisões já tomadas (não reabrir sem nova aprovação)

- **Trecho é um trajeto (linha), não um ponto.** Representa uma rua/calçada percorrida a pé, coerente com o Índice de Caminhabilidade sendo calculado por trecho.
- **Geometria armazenada como JSONB**, não PostGIS. `ADR-002` já tratava PostGIS como opção futura, não desta sprint. A coluna `geometria` guarda um array de pontos `[{lat, lng}, ...]`, mapeado via suporte nativo a JSON do Hibernate 6 (`@JdbcTypeCode(SqlTypes.JSON)`), sem dependência nova de biblioteca espacial.
- **`latitude`/`longitude` continuam como colunas próprias** (ponto de referência/centróide do trecho), além da `geometria` completa — usadas para listagem e centralização do mapa sem precisar parsear o JSON inteiro.
- **`status` é o ciclo de vida do cadastro** (`ATIVO`/`INATIVO`), não uma condição física da via. Permite despublicar um trecho sem apagar histórico (consistente com a REGRA 10 do Vault).
- **`indice_atual` entra já nesta migration, nullable.** O módulo de Avaliação (que o populariam) é de sprint futura; a escala exata do índice segue `a definir` em `Índice de Caminhabilidade`, então a coluna não recebe `CHECK` constraint agora.
- **Relação `Regiao` (1) → `Trecho` (N)** via FK `trecho.regiao_id`, `ON DELETE RESTRICT` — não é possível apagar uma região que ainda tem trechos vinculados.
- **CRUD completo, sem autenticação.** `GET`/`POST`/`PUT`/`DELETE` em `/api/v1/regioes` e `/api/v1/trechos`, todos abertos, igual `/health` hoje. Autenticação/autorização é escopo da Sprint 04 (já documentado em `Estrutura Backend`).
- **`spring-boot-starter-validation` é adicionado ao `pom.xml`.** Não existe hoje; necessário para `@NotBlank`/`@NotNull`/`@Valid` nos DTOs de entrada.
- **Tile provider do Leaflet ratificado como OpenStreetMap** (`tile.openstreetmap.org`, sem API key) — decisão documental para fechar o `ADR-004`; a implementação em si é Fase 2.

## Modelo de dados

Migration `V2__cria_tabelas_regiao_e_trecho.sql`, em `backend/src/main/resources/db/migration/`:

```sql
CREATE TABLE regiao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL
);

CREATE TABLE trecho (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL,
    geometria JSONB NOT NULL,
    latitude NUMERIC(9,6) NOT NULL,
    longitude NUMERIC(9,6) NOT NULL,
    indice_atual NUMERIC(4,2),
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
    regiao_id UUID NOT NULL REFERENCES regiao(id) ON DELETE RESTRICT
);

CREATE INDEX idx_trecho_regiao_id ON trecho(regiao_id);
```

`gen_random_uuid()` requer a extensão `pgcrypto` — se não estiver habilitada no banco local (Docker Compose), a migration precisa de `CREATE EXTENSION IF NOT EXISTS pgcrypto;` antes da criação das tabelas. Isso é verificado na implementação.

## Arquitetura backend

Pacote `br.com.perimetro`, seguindo a estrutura já ratificada em `Estrutura Backend` (ADR-003):

```
entity/
├── Regiao.java
└── Trecho.java                 # @ManyToOne Regiao; enum AtivoInativo para status
repository/
├── RegiaoRepository.java       # JpaRepository<Regiao, UUID>
└── TrechoRepository.java       # JpaRepository<Trecho, UUID>; findByRegiaoId(UUID)
service/
├── RegiaoService.java          # CRUD; valida nome não vazio
└── TrechoService.java          # CRUD; valida regiao_id existente antes de criar/atualizar
controller/
├── RegiaoController.java       # /api/v1/regioes
└── TrechoController.java       # /api/v1/trechos (?regiaoId= como filtro opcional)
dto/
├── RegiaoRequestDto.java / RegiaoResponseDto.java
├── TrechoRequestDto.java / TrechoResponseDto.java
└── PontoDto.java                # {lat, lng} — elemento da lista de geometria
exception/
├── RegiaoNaoEncontradaException.java
└── TrechoNaoEncontradoException.java
```

`GlobalExceptionHandler` (já existente) ganha dois `@ExceptionHandler` novos para as exceptions acima, retornando 404 com `ErroResponseDto`, mesmo padrão do handler genérico atual.

Controllers retornam sempre DTOs, nunca entidades — convenção já em uso em `HealthController`.

## Contrato da API

```
GET    /api/v1/regioes              → 200, RegiaoResponseDto[]
GET    /api/v1/regioes/{id}         → 200 | 404
POST   /api/v1/regioes              → 201, body: { "nome": string }
PUT    /api/v1/regioes/{id}         → 200 | 404
DELETE /api/v1/regioes/{id}         → 204 | 404 | 409 (se tiver trechos vinculados)

GET    /api/v1/trechos              → 200, TrechoResponseDto[]
GET    /api/v1/trechos?regiaoId=    → 200, filtrado
GET    /api/v1/trechos/{id}         → 200 | 404
POST   /api/v1/trechos              → 201, body: {
                                          "nome": string,
                                          "geometria": [{ "lat": number, "lng": number }, ...],
                                          "latitude": number,
                                          "longitude": number,
                                          "regiaoId": uuid,
                                          "status": "ATIVO" | "INATIVO"  // opcional, default ATIVO
                                        }
PUT    /api/v1/trechos/{id}         → 200 | 404
DELETE /api/v1/trechos/{id}         → 204 | 404
```

`TrechoResponseDto` inclui `indiceAtual` (pode vir `null`).

## Testes (TDD RED → GREEN)

Seguindo o padrão de `HealthControllerTest`/`HealthServiceTest` (nomes de método em português descrevendo comportamento):

- `RegiaoServiceTest`, `RegiaoControllerTest` (`@WebMvcTest` + `@MockitoBean`)
- `TrechoServiceTest`, `TrechoControllerTest`
- Casos obrigatórios: criação válida, erro ao criar trecho com `regiaoId` inexistente, erro ao apagar região com trechos vinculados, filtro por `regiaoId`, validação de campos obrigatórios.

## Fora de escopo desta fase

- Frontend/Leaflet (Fase 2, brainstorming separado).
- Atualização das notas do Vault (Fase 3).
- Autenticação/autorização nos novos endpoints (Sprint 04).
- PostGIS, cálculo real do índice de caminhabilidade, módulo de Avaliação.
