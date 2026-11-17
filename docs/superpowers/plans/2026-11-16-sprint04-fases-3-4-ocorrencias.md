# Sprint 04, Fases 3 e 4 — Ocorrências em evidência: Plano de Implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: usar superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans. Passos usam checkbox (`- [ ]`).

**Goal:** o cidadão logado registra uma ocorrência (categoria, descrição opcional, até 3 fotos opcionais) num trecho; ela fica pública (marcador no mapa e lista no painel do trecho) e o administrador pode ocultá-la e reexibi-la.

**Architecture:** mesmas camadas do projeto (controller → service → repository, DTOs, Flyway V7 a V9). Status da ocorrência: `VISIVEL` e `OCULTA`. Fotos em disco local, tipo validado pelos bytes, nome UUID. No frontend o painel do trecho ganha formulário e lista; o marcador fica no ponto central do trecho.

**Tech Stack:** Spring Boot 4.1.1, Spring Security, JPA, Flyway, Testcontainers; React 19, react-leaflet, axios, Vitest.

**Spec:** Vault `09 - Sprints/Sprint 04 - Autenticação e Ocorrências.md` (decisões D5, D7, D8, D9 de 2026-11-16). Plano-pai: `docs/superpowers/plans/2026-11-05-sprint04-autenticacao-e-ocorrencias.md`.

## Global Constraints

- Repositório de código: `c:\PROJETO PÉ-RÍMETRO`, branch `sprint-04`. Backend em `backend/`, frontend em `frontend/`. Pacote Java `br.com.perimetro`.
- Português brasileiro em tudo que não é código. Rotas sob `/api/v1`.
- Backend é a fonte da verdade; o frontend só espelha os limites.
- TDD: teste que falha, implementação, teste que passa, um commit por tarefa.
- Docker precisa estar rodando (Testcontainers). Teste no backend: `./mvnw test -Dtest=NomeDoTeste` (dentro de `backend/`); suíte inteira: `./mvnw test`.
- Frontend: `npm run lint` sem avisos novos (3 antigos conhecidos), `npx vitest run`, `npm run build` (dentro de `frontend/`).
- O autor da ocorrência vem sempre do token, nunca do corpo, e **nunca** aparece em resposta pública.
- DTOs de resposta novos usam `record`.
- Commits terminam com `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Segredos fora do Git; `uploads/` no `.gitignore`.

## Ponto de atenção de segurança

Hoje `SegurancaConfig` libera **todo** `GET /api/v1/**` para anônimos. A lista de moderação (`GET /api/v1/ocorrencias`) precisa de regra de administrador **antes** da regra do `GET` público, com teste de 401 para anônimo.

---

### Task 1: Categorias

**Files:**
- Create: `backend/src/main/resources/db/migration/V7__cria_tabela_categoria_ocorrencia.sql`, `entity/CategoriaOcorrencia.java`, `repository/CategoriaOcorrenciaRepository.java`, `dto/CategoriaResponseDto.java`, `controller/CategoriaController.java` (todos sob `backend/src/main/java/br/com/perimetro/`)
- Test: `backend/src/test/java/br/com/perimetro/integracao/CategoriaIntegracaoTest.java`

**Interfaces:**
- Produces: `GET /api/v1/categorias` (público) → `[{ "id": UUID, "nome": String }]` ordenado por nome; `CategoriaOcorrenciaRepository.findAllByOrderByNomeAsc(): List<CategoriaOcorrencia>`; `CategoriaOcorrencia.getId(): UUID`, `getNome(): String`.

- [ ] **Step 1: teste que falha**

```java
package br.com.perimetro.integracao;

import br.com.perimetro.IntegracaoBase;
import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CategoriaIntegracaoTest extends IntegracaoBase {

    @Test
    void listaAsCategoriasIniciaisSemLoginOrdenadasPorNome() throws Exception {
        mockMvc.perform(get("/api/v1/categorias"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(5))
                .andExpect(jsonPath("$[0].nome").value("Buraco na calçada"))
                .andExpect(jsonPath("$[1].nome").value("Calçada quebrada"))
                .andExpect(jsonPath("$[2].nome").value("Falta de acessibilidade"))
                .andExpect(jsonPath("$[3].nome").value("Falta de iluminação"))
                .andExpect(jsonPath("$[4].nome").value("Outro"))
                .andExpect(jsonPath("$[0].id").isNotEmpty());
    }
}
```

- [ ] **Step 2: rodar e ver falhar** — `./mvnw test -Dtest=CategoriaIntegracaoTest` → FAIL (404).
- [ ] **Step 3: implementar**

```sql
-- V7__cria_tabela_categoria_ocorrencia.sql
CREATE TABLE categoria_ocorrencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(80) NOT NULL UNIQUE
);

INSERT INTO categoria_ocorrencia (nome) VALUES
    ('Buraco na calçada'),
    ('Calçada quebrada'),
    ('Falta de iluminação'),
    ('Falta de acessibilidade'),
    ('Outro');
```

```java
// entity/CategoriaOcorrencia.java
@Entity
@Table(name = "categoria_ocorrencia")
public class CategoriaOcorrencia {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(nullable = false, length = 80)
    private String nome;
    protected CategoriaOcorrencia() {}
    public UUID getId() { return id; }
    public String getNome() { return nome; }
}
```

```java
// repository/CategoriaOcorrenciaRepository.java
public interface CategoriaOcorrenciaRepository extends JpaRepository<CategoriaOcorrencia, UUID> {
    List<CategoriaOcorrencia> findAllByOrderByNomeAsc();
}
```

```java
// dto/CategoriaResponseDto.java
public record CategoriaResponseDto(UUID id, String nome) {
    public static CategoriaResponseDto de(CategoriaOcorrencia c) {
        return new CategoriaResponseDto(c.getId(), c.getNome());
    }
}
```

```java
// controller/CategoriaController.java
@RestController
@RequestMapping("/api/v1/categorias")
public class CategoriaController {
    private final CategoriaOcorrenciaRepository repository;
    public CategoriaController(CategoriaOcorrenciaRepository repository) { this.repository = repository; }

    @GetMapping
    public List<CategoriaResponseDto> listar() {
        return repository.findAllByOrderByNomeAsc().stream().map(CategoriaResponseDto::de).toList();
    }
}
```

- [ ] **Step 4: rodar e ver passar** — `./mvnw test -Dtest=CategoriaIntegracaoTest` → PASS; depois `./mvnw test` (suíte inteira) → sem regressões.
- [ ] **Step 5: commit**

```bash
git add backend && git commit -m "feat: categorias de ocorrencia" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Ocorrência (registrar, ler, moderar, minhas)

**Files:**
- Create (sob `backend/src/main/java/br/com/perimetro/`): `entity/StatusOcorrencia.java`, `entity/Ocorrencia.java`, `entity/Foto.java`, `repository/OcorrenciaRepository.java`, `repository/FotoRepository.java`, `dto/OcorrenciaRequestDto.java`, `dto/OcorrenciaResponseDto.java`, `dto/FotoResumoDto.java`, `dto/AlterarStatusRequestDto.java`, `dto/ContagemOcorrenciaDto.java`, `service/OcorrenciaService.java`, `controller/OcorrenciaController.java`, `exception/CategoriaNaoEncontradaException.java` (404), `exception/OcorrenciaNaoEncontradaException.java` (404), `exception/AcessoNegadoException.java` (403), `exception/OcorrenciaNaoEditavelException.java` (409)
- Create (migrations): `V8__cria_tabela_ocorrencia.sql`, `V9__cria_tabela_foto.sql`
- Modify: `config/SegurancaConfig.java`, `exception/GlobalExceptionHandler.java`, `controller/UsuarioController.java`, `service/UsuarioService.java`, `dto/ResumoAtividadeDto.java`, e `backend/src/test/java/br/com/perimetro/IntegracaoBase.java`
- Test: `backend/src/test/java/br/com/perimetro/integracao/OcorrenciaIntegracaoTest.java`

**Interfaces:**
- Consumes: `CategoriaOcorrenciaRepository` (Task 1); `TrechoRepository`, `UsuarioRepository`, `PaginaDto.de(Page, Function)`, `TrechoNaoEncontradoException`, `TrechoInativoException`, `SessaoInvalidaException`, `IntegracaoBase.autorizacao(Perfil)`; helper de trecho igual ao de `AvaliacaoIntegracaoTest`.
- Produces:
  - `POST /api/v1/trechos/{trechoId}/ocorrencias` (login) → 201 `OcorrenciaResponseDto`
  - `GET /api/v1/trechos/{trechoId}/ocorrencias?pagina=&tamanho=` (público; só `VISIVEL`; máx. 50) → `PaginaDto<OcorrenciaResponseDto>`
  - `GET /api/v1/ocorrencias/contagem-por-trecho` (público; só `VISIVEL`) → `[{ "trechoId": UUID, "total": long }]`
  - `GET /api/v1/ocorrencias?status=&moderadasPorMim=&pagina=&tamanho=` (**admin**) → `PaginaDto<OcorrenciaResponseDto>` com `autorNome`
  - `PATCH /api/v1/ocorrencias/{id}` (**admin**), corpo `{ "status": "OCULTA" | "VISIVEL" }` → 200
  - `PUT /api/v1/ocorrencias/{id}` (dono; só `VISIVEL`), corpo igual ao de criação → 200
  - `DELETE /api/v1/ocorrencias/{id}` (dono; só `VISIVEL`) → 204
  - `GET /api/v1/usuarios/me/ocorrencias?status=&pagina=&tamanho=` (login) → `PaginaDto<OcorrenciaResponseDto>`
  - `GET /api/v1/usuarios/me/resumo` ganha `totalOcorrencias`
  - `OcorrenciaResponseDto`: `id, trechoId, trechoNome, categoria{id,nome}, descricao, status, fotos[{id}], criadoEm, autorNome` (`autorNome` só preenchido na moderação; `@JsonInclude(NON_NULL)`)
  - `FotoRepository.findByOcorrenciaIdIn(Collection<UUID>)`, `FotoRepository.countByOcorrenciaId(UUID)`, `Foto` (campos: id, ocorrencia, arquivo, tipoConteudo, tamanhoBytes, criadoEm; construtor `Foto(Ocorrencia, String arquivo, String tipoConteudo, long tamanhoBytes)`)
  - `OcorrenciaService.excluir` chama `fotoService.removerTodasDaOcorrencia(UUID)`; **nesta tarefa** esse `FotoService` pode ser um esqueleto com esse método removendo os registros `Foto` e (quando existir armazenamento, Task 3) os arquivos. Se `FotoService` ainda não existir, crie-o apenas com `removerTodasDaOcorrencia` apagando as linhas de `foto`; a Task 3 completa a remoção dos arquivos.

- [ ] **Step 1: ajustar `IntegracaoBase`** para limpar as tabelas novas antes das antigas (a FK de `trecho` é `RESTRICT`). Categorias NÃO são apagadas.

```java
@Autowired protected OcorrenciaRepository ocorrenciaRepository;
@Autowired protected FotoRepository fotoRepository;

@BeforeEach
void limparBanco() {
    fotoRepository.deleteAll();
    ocorrenciaRepository.deleteAll();
    avaliacaoRepository.deleteAll();
    trechoRepository.deleteAll();
    regiaoRepository.deleteAll();
    usuarioRepository.deleteAll();
}
```

- [ ] **Step 2: migrations**

```sql
-- V8__cria_tabela_ocorrencia.sql
CREATE TABLE ocorrencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trecho_id UUID NOT NULL REFERENCES trecho(id) ON DELETE RESTRICT,
    usuario_id UUID REFERENCES usuario(id) ON DELETE SET NULL,
    categoria_id UUID NOT NULL REFERENCES categoria_ocorrencia(id),
    descricao VARCHAR(500),
    status VARCHAR(10) NOT NULL DEFAULT 'VISIVEL' CHECK (status IN ('VISIVEL', 'OCULTA')),
    moderada_por_id UUID REFERENCES usuario(id) ON DELETE SET NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ocorrencia_trecho_id ON ocorrencia(trecho_id);
CREATE INDEX idx_ocorrencia_status_criado_em ON ocorrencia(status, criado_em DESC);
CREATE INDEX idx_ocorrencia_usuario_id ON ocorrencia(usuario_id);
```

```sql
-- V9__cria_tabela_foto.sql
CREATE TABLE foto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ocorrencia_id UUID NOT NULL REFERENCES ocorrencia(id) ON DELETE CASCADE,
    arquivo VARCHAR(80) NOT NULL UNIQUE,
    tipo_conteudo VARCHAR(30) NOT NULL,
    tamanho_bytes BIGINT NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_foto_ocorrencia_id ON foto(ocorrencia_id);
```

- [ ] **Step 3: testes que falham** (`OcorrenciaIntegracaoTest extends IntegracaoBase`). Base de código:

```java
@Autowired private CategoriaOcorrenciaRepository categoriaRepository;

private Trecho novoTrecho(AtivoInativo status) {
    Regiao regiao = regiaoRepository.save(new Regiao("Recife Antigo"));
    return trechoRepository.save(new Trecho(
            "Rua da Aurora", List.of(new PontoDto(-8.06, -34.87)), -8.06, -34.87, status, regiao));
}

private UUID categoriaId() {
    return categoriaRepository.findAllByOrderByNomeAsc().get(0).getId();
}

private String corpo(UUID categoria, String descricao) {
    String desc = descricao == null ? "null" : "\"" + descricao + "\"";
    return "{\"categoriaId\":\"" + categoria + "\",\"descricao\":" + desc + "}";
}

@Test
void cidadaoRegistraOcorrenciaQueNasceVisivelSemExporAutor() throws Exception {
    Trecho trecho = novoTrecho(AtivoInativo.ATIVO);

    mockMvc.perform(post("/api/v1/trechos/{id}/ocorrencias", trecho.getId())
                    .header("Authorization", autorizacao(Perfil.CIDADAO))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(corpo(categoriaId(), "Buraco grande na esquina")))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value("VISIVEL"))
            .andExpect(jsonPath("$.descricao").value("Buraco grande na esquina"))
            .andExpect(jsonPath("$.trechoId").value(trecho.getId().toString()))
            .andExpect(jsonPath("$.categoria.nome").value("Buraco na calçada"))
            .andExpect(jsonPath("$.autorNome").doesNotExist())
            .andExpect(jsonPath("$.usuarioId").doesNotExist());
}
```

Cada linha abaixo é um `@Test` separado:

| Teste | Requisição | Esperado |
|---|---|---|
| anônimo não registra | `POST` sem `Authorization` | 401 |
| sem categoria | corpo sem `categoriaId` | 400, mensagem com `categoriaId` |
| categoria inexistente | `categoriaId` aleatório | 404 |
| descrição > 500 | 501 caracteres | 400 |
| descrição só com espaços | `"   "` | 201 e `descricao` nula |
| trecho inexistente | UUID aleatório | 404 |
| trecho inativo | `AtivoInativo.INATIVO` | 409 |
| autor vem do token | corpo com `"usuarioId"` forjado | 201, `usuario_id` gravado = o do token |
| lista pública do trecho | `GET` sem login | 200, só `VISIVEL`, mais recentes primeiro, sem autor |
| lista pública esconde ocultas | admin oculta, `GET` público | a ocorrência some |
| paginação limitada | `tamanho=500` | `tamanho` na resposta = 50 |
| contagem por trecho | 2 visíveis + 1 oculta no trecho A | `[{trechoId: A, total: 2}]` |
| admin lista tudo | `GET /ocorrencias` como admin | 200, vê ocultas, tem `autorNome` |
| filtro por status | `?status=OCULTA` | só ocultas |
| `moderadasPorMim` | admin A oculta uma; admin B pede | B não vê; A vê |
| cidadão na lista admin | `GET /ocorrencias` como cidadão | 403 |
| **anônimo na lista admin** | `GET /ocorrencias` sem login | **401** |
| admin oculta | `PATCH` `OCULTA` | 200 e `moderada_por_id` = admin |
| admin reexibe | `PATCH` `VISIVEL` | 200, volta à lista pública |
| cidadão no PATCH | como cidadão | 403 |
| status inválido | `{"status":"RESOLVIDA"}` | 400 |
| dono edita | `PUT` com categoria e descrição novas | 200 |
| outro usuário edita | `PUT` por outro cidadão | 403 |
| dono edita oculta | depois do admin ocultar | 409 |
| dono exclui | `DELETE` | 204 e some do banco |
| outro exclui | `DELETE` por outro cidadão | 403 |
| minhas ocorrências | `GET /usuarios/me/ocorrencias` | só as dele, inclusive ocultas, com `status` |
| resumo | `GET /usuarios/me/resumo` | `totalOcorrencias` correto |
| não altera o índice | registrar ocorrência | `indiceAtual` e `totalAvaliacoes` do trecho idênticos |

- [ ] **Step 4: rodar e ver falhar** — `./mvnw test -Dtest=OcorrenciaIntegracaoTest` → FAIL.
- [ ] **Step 5: implementar**

```java
// entity/StatusOcorrencia.java
public enum StatusOcorrencia { VISIVEL, OCULTA }
```

```java
// entity/Ocorrencia.java
@Entity
@Table(name = "ocorrencia")
public class Ocorrencia {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "trecho_id", nullable = false) private Trecho trecho;
    @Column(name = "usuario_id") private UUID usuarioId;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "categoria_id", nullable = false) private CategoriaOcorrencia categoria;
    @Column(length = 500) private String descricao;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 10) private StatusOcorrencia status;
    @Column(name = "moderada_por_id") private UUID moderadaPorId;
    @Column(name = "criado_em", nullable = false, updatable = false) private Instant criadoEm;
    @Column(name = "atualizado_em", nullable = false) private Instant atualizadoEm;

    protected Ocorrencia() {}

    public Ocorrencia(Trecho trecho, CategoriaOcorrencia categoria, String descricao, UUID usuarioId) {
        this.trecho = trecho; this.categoria = categoria; this.descricao = descricao; this.usuarioId = usuarioId;
        this.status = StatusOcorrencia.VISIVEL;
        this.criadoEm = Instant.now(); this.atualizadoEm = this.criadoEm;
    }

    public void editar(CategoriaOcorrencia categoria, String descricao) {
        this.categoria = categoria; this.descricao = descricao; this.atualizadoEm = Instant.now();
    }

    public void definirStatus(StatusOcorrencia novo, UUID administradorId) {
        this.status = novo; this.moderadaPorId = administradorId; this.atualizadoEm = Instant.now();
    }
    // getters de todos os campos
}
```

```java
// repository/OcorrenciaRepository.java
public interface OcorrenciaRepository extends JpaRepository<Ocorrencia, UUID> {

    @EntityGraph(attributePaths = {"trecho", "categoria"})
    Page<Ocorrencia> findByTrechoIdAndStatus(UUID trechoId, StatusOcorrencia status, Pageable pageable);

    @EntityGraph(attributePaths = {"trecho", "categoria"})
    Page<Ocorrencia> findByUsuarioId(UUID usuarioId, Pageable pageable);

    @EntityGraph(attributePaths = {"trecho", "categoria"})
    Page<Ocorrencia> findByUsuarioIdAndStatus(UUID usuarioId, StatusOcorrencia status, Pageable pageable);

    @EntityGraph(attributePaths = {"trecho", "categoria"})
    @Query("""
            select o from Ocorrencia o
            where (:status is null or o.status = :status)
              and (:moderador is null or o.moderadaPorId = :moderador)
            """)
    Page<Ocorrencia> buscarParaModeracao(@Param("status") StatusOcorrencia status,
                                         @Param("moderador") UUID moderador, Pageable pageable);

    @Query("select o.trecho.id as trechoId, count(o) as total from Ocorrencia o "
            + "where o.status = br.com.perimetro.entity.StatusOcorrencia.VISIVEL group by o.trecho.id")
    List<ContagemPorTrecho> contarVisiveisPorTrecho();

    long countByUsuarioId(UUID usuarioId);

    interface ContagemPorTrecho { UUID getTrechoId(); long getTotal(); }
}
```

`OcorrenciaRequestDto`: `@NotNull(message = "é obrigatória") UUID categoriaId; @Size(max = 500, message = "deve ter no máximo 500 caracteres") String descricao` (siga o estilo de `AvaliacaoRequestDto`: campos finais, construtor com parâmetros). `AlterarStatusRequestDto`: `@NotNull(message = "é obrigatório") StatusOcorrencia status`. Valor fora do enum cai em `HttpMessageNotReadableException` → 400 (handler já existe).

```java
// service/OcorrenciaService.java — criar
@Transactional
public OcorrenciaResponseDto criar(UUID trechoId, OcorrenciaRequestDto dto, UUID usuarioId) {
    if (!usuarioRepository.existsById(usuarioId)) {
        throw new SessaoInvalidaException("Sessão inválida: usuário não existe mais");
    }
    Trecho trecho = trechoRepository.findById(trechoId)
            .orElseThrow(() -> new TrechoNaoEncontradoException("Trecho não encontrado: " + trechoId));
    if (trecho.getStatus() == AtivoInativo.INATIVO) {
        throw new TrechoInativoException("Trecho inativo não recebe ocorrências: " + trechoId);
    }
    CategoriaOcorrencia categoria = categoriaRepository.findById(dto.getCategoriaId())
            .orElseThrow(() -> new CategoriaNaoEncontradaException("Categoria não encontrada: " + dto.getCategoriaId()));
    Ocorrencia salva = ocorrenciaRepository.save(
            new Ocorrencia(trecho, categoria, normalizar(dto.getDescricao()), usuarioId));
    return OcorrenciaResponseDto.de(salva, List.of(), null);
}

private static String normalizar(String descricao) {   // "   " vira null
    if (descricao == null) return null;
    String limpa = descricao.trim();
    return limpa.isEmpty() ? null : limpa;
}
```

Demais métodos do serviço (mesmo estilo): `listarPublicasDoTrecho(trechoId, pagina, tamanho)` (tamanho limitado a 50, ordenação `criadoEm` desc e `id` desc, anexa fotos via `fotoRepository.findByOcorrenciaIdIn`), `contagemPorTrecho()`, `listarParaModeracao(status, moderadasPorMim, adminId, pagina, tamanho)` (preenche `autorNome` buscando usuários por `findAllById`), `alterarStatus(id, novo, adminId)`, `editar(id, dto, usuarioId)` e `excluir(id, usuarioId)` — os dois últimos usam `carregarDoDono`: 404 se não existe; 403 `AcessoNegadoException` se não é o dono; 409 `OcorrenciaNaoEditavelException` se `OCULTA`. `UsuarioService`: injetar `OcorrenciaRepository`; `resumo` devolve `new ResumoAtividadeDto(totalAvaliacoes, totalOcorrencias)`; novo `minhasOcorrencias(UUID, StatusOcorrencia, int, int)` com o mesmo limite de 50 de `minhasAvaliacoes`. `UsuarioController` ganha `GET /me/ocorrencias`. `GlobalExceptionHandler`: handlers de `CategoriaNaoEncontradaException` e `OcorrenciaNaoEncontradaException` → 404, `AcessoNegadoException` → 403, `OcorrenciaNaoEditavelException` → 409 (molde dos existentes).

`SegurancaConfig` — regras NESTA ordem (as marcadas são as novas):

```java
.requestMatchers(HttpMethod.OPTIONS, ROTAS_API).permitAll()
.requestMatchers(HttpMethod.POST, "/api/v1/auth/**").permitAll()
.requestMatchers("/api/v1/usuarios/**").authenticated()
.requestMatchers(HttpMethod.GET, "/api/v1/ocorrencias").hasRole("ADMINISTRADOR")        // NOVA (antes do GET público)
.requestMatchers(HttpMethod.PATCH, "/api/v1/ocorrencias/*").hasRole("ADMINISTRADOR")    // NOVA
.requestMatchers(HttpMethod.GET, ROTAS_API).permitAll()
.requestMatchers(HttpMethod.POST, "/api/v1/trechos", "/api/v1/trechos/*/avaliacoes",
        "/api/v1/trechos/*/ocorrencias").authenticated()                                 // acrescenta a rota nova
.requestMatchers("/api/v1/trechos/**", "/api/v1/regioes/**").hasRole("ADMINISTRADOR")
.anyRequest().authenticated()
```

`PUT`/`DELETE /ocorrencias/{id}` e `POST /ocorrencias/{id}/fotos` caem em `anyRequest().authenticated()`; a checagem de dono fica no serviço.

- [ ] **Step 6: rodar** `./mvnw test -Dtest=OcorrenciaIntegracaoTest` → PASS; depois `./mvnw test` (suíte inteira) → PASS, sem queda na contagem de testes antigos.
- [ ] **Step 7: commit** — `feat: ocorrencias visiveis ou ocultas com moderacao` (com a linha Co-Authored-By).

---

### Task 3: Fotos de ocorrência

**Files:**
- Create (sob `backend/src/main/java/br/com/perimetro/`): `service/TipoImagem.java`, `service/ArmazenamentoFoto.java`, `service/ArmazenamentoLocal.java`, `service/FotoService.java` (completa o esqueleto da Task 2, se existir), `controller/FotoController.java`, `config/UploadProperties.java`, `exception/ArquivoInvalidoException.java` (400), `exception/LimiteFotosException.java` (409), `exception/FotoNaoEncontradaException.java` (404)
- Modify: `backend/src/main/resources/application.yml`, `exception/GlobalExceptionHandler.java` (acrescenta `MaxUploadSizeExceededException` → 413 com mensagem "A foto deve ter no máximo 5 MB"), `backend/src/test/java/br/com/perimetro/IntegracaoBase.java` (pasta de upload temporária), `.gitignore` (`uploads/`)
- Test: `backend/src/test/java/br/com/perimetro/service/TipoImagemTest.java`, `backend/src/test/java/br/com/perimetro/integracao/FotoIntegracaoTest.java`

**Interfaces:**
- Consumes: `Ocorrencia`, `OcorrenciaRepository`, `Foto`, `FotoRepository` (`countByOcorrenciaId`), `StatusOcorrencia`, `AcessoNegadoException`, `OcorrenciaNaoEncontradaException`, `OcorrenciaNaoEditavelException` (Task 2).
- Produces:
  - `POST /api/v1/ocorrencias/{id}/fotos` — `multipart/form-data`, campo `arquivo` → 201 `{ "id": UUID }`
  - `GET /api/v1/fotos/{id}` → bytes da imagem
  - `TipoImagem.detectar(byte[]): Optional<TipoImagem>`; `contentType(): String`; `extensao(): String`
  - `ArmazenamentoFoto`: `salvar(String nome, byte[] conteudo)`, `carregar(String nome): Resource`, `remover(String nome)`
  - `FotoService.enviar(UUID ocorrenciaId, MultipartFile arquivo, UUID usuarioId, boolean admin): FotoResumoDto`; `FotoService.carregar(UUID fotoId, UUID usuarioIdOuNulo, boolean admin)` (devolve conteúdo + tipo + se a ocorrência é visível); `FotoService.removerTodasDaOcorrencia(UUID)` (apaga arquivos do disco e linhas)

- [ ] **Step 1: teste da detecção por bytes (falha)**

```java
package br.com.perimetro.service;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class TipoImagemTest {

    private static byte[] bytes(int... valores) {
        byte[] b = new byte[valores.length];
        for (int i = 0; i < valores.length; i++) b[i] = (byte) valores[i];
        return b;
    }

    @Test
    void detectaJpeg() {
        assertThat(TipoImagem.detectar(bytes(0xFF, 0xD8, 0xFF, 0xE0, 0, 0))).contains(TipoImagem.JPEG);
    }

    @Test
    void detectaPng() {
        assertThat(TipoImagem.detectar(bytes(0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A))).contains(TipoImagem.PNG);
    }

    @Test
    void detectaWebp() {
        byte[] webp = bytes('R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'E', 'B', 'P');
        assertThat(TipoImagem.detectar(webp)).contains(TipoImagem.WEBP);
    }

    @Test
    void textoDisfarcadoDeImagemNaoEDetectado() {
        assertThat(TipoImagem.detectar("<script>alert(1)</script>".getBytes())).isEmpty();
    }

    @Test
    void arquivoMuitoCurtoNaoEDetectado() {
        assertThat(TipoImagem.detectar(bytes(0xFF))).isEmpty();
    }
}
```

- [ ] **Step 2: rodar** `./mvnw test -Dtest=TipoImagemTest` → FAIL.
- [ ] **Step 3: implementar `TipoImagem`**

```java
public enum TipoImagem {
    JPEG("image/jpeg", "jpg"), PNG("image/png", "png"), WEBP("image/webp", "webp");

    private final String contentType;
    private final String extensao;

    TipoImagem(String contentType, String extensao) { this.contentType = contentType; this.extensao = extensao; }
    public String contentType() { return contentType; }
    public String extensao() { return extensao; }

    public static Optional<TipoImagem> detectar(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return Optional.of(JPEG);
        }
        byte[] assinaturaPng = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
        if (b.length >= 8 && Arrays.equals(Arrays.copyOfRange(b, 0, 8), assinaturaPng)) {
            return Optional.of(PNG);
        }
        if (b.length >= 12
                && new String(b, 0, 4, StandardCharsets.US_ASCII).equals("RIFF")
                && new String(b, 8, 4, StandardCharsets.US_ASCII).equals("WEBP")) {
            return Optional.of(WEBP);
        }
        return Optional.empty();
    }
}
```

- [ ] **Step 4: rodar** `TipoImagemTest` → PASS.
- [ ] **Step 5: armazenamento seguro**

```java
@ConfigurationProperties(prefix = "perimetro.upload")
public record UploadProperties(String diretorio) {}
```

Registrar com `@EnableConfigurationProperties(UploadProperties.class)` (em `SegurancaConfig` junto de `JwtProperties`, ou numa `UploadConfig` própria).

```yaml
# application.yml — some as chaves novas às seções spring: e perimetro: que já existem
spring:
  servlet:
    multipart:
      max-file-size: 5MB
      max-request-size: 6MB
perimetro:
  upload:
    diretorio: ${UPLOAD_DIR:./uploads}
```

```java
@Service
public class ArmazenamentoLocal implements ArmazenamentoFoto {
    private final Path raiz;

    public ArmazenamentoLocal(UploadProperties props) throws IOException {
        this.raiz = Path.of(props.diretorio()).toAbsolutePath().normalize();
        Files.createDirectories(raiz);
    }

    private Path resolver(String nome) {
        Path alvo = raiz.resolve(nome).normalize();
        if (!alvo.startsWith(raiz)) {                       // anti path traversal
            throw new ArquivoInvalidoException("Nome de arquivo inválido");
        }
        return alvo;
    }

    @Override public void salvar(String nome, byte[] conteudo) {
        try { Files.write(resolver(nome), conteudo, StandardOpenOption.CREATE_NEW); }
        catch (IOException e) { throw new UncheckedIOException(e); }
    }
    @Override public Resource carregar(String nome) { return new FileSystemResource(resolver(nome)); }
    @Override public void remover(String nome) {
        try { Files.deleteIfExists(resolver(nome)); } catch (IOException e) { throw new UncheckedIOException(e); }
    }
}
```

- [ ] **Step 6: testes de integração das fotos (falham).** Em `IntegracaoBase`, pasta temporária:

```java
private static final Path PASTA_UPLOAD = criarPastaTemporaria();
private static Path criarPastaTemporaria() {
    try { return Files.createTempDirectory("perimetro-upload"); }
    catch (IOException e) { throw new UncheckedIOException(e); }
}
@DynamicPropertySource
static void propriedadesDeUpload(DynamicPropertyRegistry registro) {
    registro.add("perimetro.upload.diretorio", () -> PASTA_UPLOAD.toString());
}
```

`FotoIntegracaoTest extends IntegracaoBase` (helper `criarOcorrencia(String autorizacao)` faz `POST /trechos/{id}/ocorrencias` e devolve o id):

```java
private static final byte[] PNG = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0};

private MockMultipartFile arquivo(byte[] conteudo, String nome, String tipo) {
    return new MockMultipartFile("arquivo", nome, tipo, conteudo);
}

@Test
void donoEnviaPngEleApareceEPodeSerBaixadoPorAnonimo() throws Exception {
    String dono = autorizacao(Perfil.CIDADAO);
    UUID ocorrenciaId = criarOcorrencia(dono);

    String resposta = mockMvc.perform(multipart("/api/v1/ocorrencias/{id}/fotos", ocorrenciaId)
                    .file(arquivo(PNG, "foto.png", "image/png")).header("Authorization", dono))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isNotEmpty())
            .andReturn().getResponse().getContentAsString();
    String fotoId = objectMapper.readTree(resposta).get("id").asText();

    mockMvc.perform(get("/api/v1/fotos/{id}", fotoId))
            .andExpect(status().isOk())
            .andExpect(header().string("Content-Type", "image/png"))
            .andExpect(header().string("X-Content-Type-Options", "nosniff"));
}
```

| Teste | Requisição | Esperado |
|---|---|---|
| texto disfarçado de PNG | `foto.png`, `image/png`, conteúdo `"não sou imagem"` | 400 e nenhum arquivo no disco |
| nome malicioso | nome original `../../etc/passwd.png`, conteúdo PNG válido | 201; arquivo no disco tem nome UUID dentro da pasta de upload |
| tipo informado mente | conteúdo JPEG com `Content-Type: image/png` | 201; `GET` devolve `image/jpeg` |
| arquivo vazio | 0 bytes | 400 |
| acima de 5 MB | 5 MB + 1 byte | 413 |
| 4ª foto | já tem 3 | 409 |
| outro cidadão envia | cidadão B na ocorrência de A | 403 |
| admin envia | admin na ocorrência de A | 201 |
| dono envia em ocorrência oculta | depois do `PATCH` `OCULTA` | 409 |
| anônimo envia | sem login | 401 |
| foto de ocorrência visível | `GET` anônimo | 200 |
| foto de ocorrência oculta, anônimo | `GET` | **404** |
| foto de ocorrência oculta, dono e admin | `GET` com token | 200 |
| foto de ocorrência oculta, outro cidadão | `GET` | 404 |
| excluir ocorrência | `DELETE` da ocorrência com foto | arquivos somem do disco |
| id inexistente | `GET /fotos/{uuid aleatório}` | 404 |

- [ ] **Step 7: rodar** `./mvnw test -Dtest=FotoIntegracaoTest` → FAIL.
- [ ] **Step 8: implementar `FotoService.enviar`**, nesta ordem (falha rápido, sem sujar o disco): (1) carrega a ocorrência (404); (2) permissão: dono ou administrador (403), e o dono só enquanto `VISIVEL` (409); (3) arquivo vazio → 400; (4) `countByOcorrenciaId < 3`, senão 409 `LimiteFotosException`; (5) `arquivo.getBytes()`; (6) `TipoImagem.detectar(bytes)`, vazio → 400 `"Envie uma imagem JPEG, PNG ou WebP"`; (7) nome `UUID.randomUUID() + "." + tipo.extensao()` e `armazenamento.salvar(nome, bytes)`; (8) grava `Foto(ocorrencia, nome, tipo.contentType(), bytes.length)`; se o `save` falhar, remove o arquivo (`try/catch`).

`FotoController.baixar(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt)`: `jwt` é `null` para anônimo. `usuarioId = jwt == null ? null : UUID.fromString(jwt.getSubject())`; `admin = jwt != null && "ADMINISTRADOR".equals(jwt.getClaimAsString("perfil"))`. Ocorrência `OCULTA` e quem pede não é dono nem admin → `FotoNaoEncontradaException` (404). Resposta: `Content-Type` da foto, `X-Content-Type-Options: nosniff`, `Cache-Control: public, max-age=3600` se a ocorrência é visível, `no-store` se não.

- [ ] **Step 9: rodar** `FotoIntegracaoTest` e `./mvnw test` → PASS.
- [ ] **Step 10:** acrescentar `uploads/` ao `.gitignore`. Commit — `feat: fotos de ocorrencia com validacao pelo conteudo`.

---

### Task 4: Formulário "Reportar problema"

**Files** (sob `frontend/src/`):
- Create: `config/ocorrenciaConfig.js`, `services/ocorrenciaService.js`, `hooks/useCategorias.js`, `components/ocorrencia/FormularioOcorrencia.jsx`
- Modify: `components/mapa/PainelDetalheTrecho.jsx`, `pages/Mapa.jsx`
- Test: `config/ocorrenciaConfig.test.js`, `components/ocorrencia/FormularioOcorrencia.test.jsx`

**Interfaces:**
- Consumes: endpoints da Task 1 e Task 3 (`GET /categorias`, `POST /trechos/{id}/ocorrencias`, `POST /ocorrencias/{id}/fotos`); `services/api.js` (axios com Bearer); `components/ui/{Button,Card,CampoTexto}`; `components/mapa/ConviteLogin`; `hooks/useAuth`.
- Produces: `ocorrenciaConfig` (`MAX_FOTOS = 3`, `MAX_BYTES = 5 * 1024 * 1024`, `MAX_DESCRICAO = 500`, `TIPOS_ACEITOS`, `validarFoto(arquivo): string | null`); `ocorrenciaService` (`listarCategorias()`, `criarOcorrencia(trechoId, { categoriaId, descricao })`, `enviarFoto(ocorrenciaId, arquivo)`, `urlDaFoto(fotoId)`); `FormularioOcorrencia` com props `trechoId`, `aoConcluir(ocorrencia)`, `aoCancelar`; `PainelDetalheTrecho` ganha a prop `aoReportado`; `Mapa` ganha o estado `versaoOcorrencias` (inteiro incrementado por `aoReportado`).

- [ ] **Step 1: teste do `validarFoto` (falha)**

```js
import { describe, expect, it } from "vitest";
import { MAX_BYTES, validarFoto } from "./ocorrenciaConfig";

const arquivo = (tipo, tamanho) => ({ type: tipo, size: tamanho, name: "f" });

describe("validarFoto", () => {
  it("aceita jpeg, png e webp dentro do limite", () => {
    for (const tipo of ["image/jpeg", "image/png", "image/webp"]) {
      expect(validarFoto(arquivo(tipo, 1000))).toBeNull();
    }
  });
  it("recusa outros tipos", () => {
    expect(validarFoto(arquivo("application/pdf", 1000))).toMatch(/JPEG, PNG ou WebP/);
  });
  it("recusa arquivo acima de 5 MB", () => {
    expect(validarFoto(arquivo("image/png", MAX_BYTES + 1))).toMatch(/5 MB/);
  });
  it("aceita exatamente 5 MB", () => {
    expect(validarFoto(arquivo("image/png", MAX_BYTES))).toBeNull();
  });
});
```

- [ ] **Step 2: rodar** `npx vitest run src/config/ocorrenciaConfig.test.js` → FAIL.
- [ ] **Step 3: implementar config e serviço**

```js
// config/ocorrenciaConfig.js
export const MAX_FOTOS = 3;
export const MAX_BYTES = 5 * 1024 * 1024;
export const MAX_DESCRICAO = 500;
export const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp"];

// Espelha o backend (fonte da verdade): evita só o envio inútil.
export function validarFoto(arquivo) {
  if (!TIPOS_ACEITOS.includes(arquivo.type)) return "Use uma imagem JPEG, PNG ou WebP.";
  if (arquivo.size > MAX_BYTES) return "A foto deve ter no máximo 5 MB.";
  return null;
}
```

```js
// services/ocorrenciaService.js
import api from "./api";

export async function listarCategorias() {
  return (await api.get("/categorias")).data;
}

export async function criarOcorrencia(trechoId, { categoriaId, descricao }) {
  return (await api.post(`/trechos/${trechoId}/ocorrencias`, { categoriaId, descricao })).data;
}

export async function enviarFoto(ocorrenciaId, arquivo) {
  const form = new FormData();
  form.append("arquivo", arquivo);
  return (await api.post(`/ocorrencias/${ocorrenciaId}/fotos`, form)).data;
}

export function urlDaFoto(fotoId) {
  return `${import.meta.env.VITE_API_URL}/fotos/${fotoId}`;
}
```

- [ ] **Step 4: testes do `FormularioOcorrencia` (falham)**, com `vi.mock("../../services/ocorrenciaService")`:

| Caso | Esperado |
|---|---|
| carrega categorias num `select` | 5 opções |
| enviar sem categoria | mensagem "Escolha uma categoria" e nenhuma chamada à API |
| descrição | contador `n/500`; `maxLength` impede passar de 500 |
| foto de tipo inválido | mensagem do `validarFoto`; foto não entra na lista |
| 4ª foto | mensagem "No máximo 3 fotos" |
| envio feliz sem foto | `criarOcorrencia` 1 vez; `aoConcluir` chamado |
| envio feliz com 2 fotos | `criarOcorrencia` e depois `enviarFoto` 2 vezes, nessa ordem |
| foto falha depois de criar | mostra "Ocorrência registrada, mas a foto *nome* não foi enviada", botão "Tentar de novo" só para as que falharam; `aoConcluir` ainda é chamado |
| erro do servidor na criação | mostra a `mensagem` da resposta e mantém o formulário preenchido |

- [ ] **Step 5: implementar `FormularioOcorrencia`.** Usa `Button`, `Card` e `CampoTexto` como o `FormularioAvaliacao`; `label` em todos os campos; `aria-live="polite"` nas mensagens; foco no primeiro erro. Campo de foto `<input type="file" accept="image/*" multiple>` (no celular abre câmera ou galeria). Pré-visualização com `URL.createObjectURL`, revogado com `URL.revokeObjectURL` ao remover a foto e ao desmontar.
- [ ] **Step 6: integrar no painel.** Em `PainelDetalheTrecho`, ao lado de "Avaliar", botão **Reportar problema** (logado e trecho ativo); anônimo vê `<ConviteLogin mensagem="Entre para reportar um problema." />`. Estado `reportando`, exclusivo com `avaliando`. Ao concluir mostra "Ocorrência registrada. Obrigado!" e chama `aoReportado`. Em `Mapa.jsx`, `aoReportado` incrementa `versaoOcorrencias`.
- [ ] **Step 7:** `npm run lint`, `npx vitest run`, `npm run build` → OK. Commit — `feat: formulario para reportar problema com fotos`.

---

### Task 5: Ocorrências em evidência (marcador no mapa e lista no trecho)

**Files** (sob `frontend/src/`):
- Create: `utils/pontoCentral.js`, `hooks/useContagemOcorrencias.js`, `hooks/useOcorrenciasDoTrecho.js`, `components/ocorrencia/ListaOcorrenciasTrecho.jsx`, `components/ocorrencia/FotoOcorrencia.jsx`
- Modify: `components/mapa/MapaLeaflet.jsx`, `components/mapa/PainelDetalheTrecho.jsx`, `pages/Mapa.jsx`, `services/ocorrenciaService.js`
- Test: `utils/pontoCentral.test.js`, `components/ocorrencia/ListaOcorrenciasTrecho.test.jsx`

**Interfaces:**
- Consumes: `ocorrenciaService.urlDaFoto`, `versaoOcorrencias` e `aoReportado` (Task 4); `GET /ocorrencias/contagem-por-trecho` e `GET /trechos/{id}/ocorrencias?pagina=&tamanho=` (Task 2).
- Produces: `pontoCentral(geometria): [lat, lng]`; `ocorrenciaService.buscarContagemPorTrecho()` e `ocorrenciaService.listarDoTrecho(trechoId, { pagina, tamanho })`; `useContagemOcorrencias(versao): Map<trechoId, total>`; `MapaLeaflet` ganha a prop `contagemOcorrencias` (`Map`); `ListaOcorrenciasTrecho` com props `trechoId`, `versao`.

- [ ] **Step 1: teste do ponto central (falha)**

```js
import { describe, expect, it } from "vitest";
import { pontoCentral } from "./pontoCentral";

describe("pontoCentral", () => {
  it("devolve o ponto do meio quando a quantidade é ímpar", () => {
    const g = [{ lat: 0, lng: 0 }, { lat: 1, lng: 1 }, { lat: 2, lng: 2 }];
    expect(pontoCentral(g)).toEqual([1, 1]);
  });
  it("devolve a média dos dois do meio quando é par", () => {
    const g = [{ lat: 0, lng: 0 }, { lat: 2, lng: 4 }];
    expect(pontoCentral(g)).toEqual([1, 2]);
  });
  it("funciona com um ponto só", () => {
    expect(pontoCentral([{ lat: -8.06, lng: -34.87 }])).toEqual([-8.06, -34.87]);
  });
});
```

- [ ] **Step 2: implementar**

```js
// utils/pontoCentral.js
export function pontoCentral(geometria) {
  const n = geometria.length;
  if (n % 2 === 1) {
    const p = geometria[(n - 1) / 2];
    return [p.lat, p.lng];
  }
  const a = geometria[n / 2 - 1];
  const b = geometria[n / 2];
  return [(a.lat + b.lat) / 2, (a.lng + b.lng) / 2];
}
```

- [ ] **Step 3: marcadores.** `useContagemOcorrencias(versao)` busca a contagem e devolve um `Map(trechoId → total)`, refazendo a busca quando `versao` muda. Em `MapaLeaflet`, para cada trecho com contagem > 0, um `<Marker>` do react-leaflet em `pontoCentral(trecho.geometria)` com `L.divIcon` (círculo com o número; estilo inline, sem depender de classes do Tailwind dentro de HTML de string). Clique chama `onSelecionarTrecho(trecho)`. `title` e `alt` com "N ocorrências neste trecho". `Mapa.jsx` passa `contagemOcorrencias` ao `MapaLeaflet`.
- [ ] **Step 4: testes da lista (falham)**, com o hook mockado:

| Caso | Esperado |
|---|---|
| carrega e mostra categoria, descrição, data (`pt-BR`) e fotos | itens renderizados |
| sem ocorrências | "Nenhum problema reportado neste trecho." |
| erro | mensagem e botão "Tentar de novo" |
| mais de uma página | botão "Carregar mais" |
| nunca mostra nome de autor | texto do autor ausente |

- [ ] **Step 5: implementar** `ListaOcorrenciasTrecho` (seção "Problemas reportados (N)" no `PainelDetalheTrecho`, com `max-h` e rolagem) e `FotoOcorrencia`. Fotos públicas: `<img src={urlDaFoto(id)} loading="lazy" alt="Foto do problema reportado: {categoria}">`. Clicar numa miniatura abre a imagem maior num `<dialog>` (sem biblioteca nova). Quando `versaoOcorrencias` muda, marcador e lista recarregam sem recarregar a página.
- [ ] **Step 6:** lint, `npx vitest run`, build → OK. Commit — `feat: ocorrencias em evidencia no mapa e no trecho`.

---

### Task 6: Minhas ocorrências

**Files** (sob `frontend/src/`):
- Create: `hooks/useMinhasOcorrencias.js` (mesmo molde de `useMinhasAvaliacoes`), `hooks/useImagemAutenticada.js`, `components/perfil/MinhasOcorrencias.jsx`
- Modify: `services/usuarioService.js` (`buscarMinhasOcorrencias({ status, pagina, tamanho })`), `services/ocorrenciaService.js` (`editarOcorrencia(id, { categoriaId, descricao })`, `excluirOcorrencia(id)`), `pages/Ocorrencia.jsx`, `pages/Perfil.jsx`, `components/perfil/ResumoAtividade.jsx`
- Test: `components/perfil/MinhasOcorrencias.test.jsx`

**Interfaces:**
- Consumes: `GET /usuarios/me/ocorrencias`, `PUT` e `DELETE /ocorrencias/{id}`, `totalOcorrencias` em `/usuarios/me/resumo` (Task 2); `urlDaFoto`, `listarCategorias` (Task 4); link `/app?trecho=<id>` (já suportado pelo `Mapa`).
- Produces: `useImagemAutenticada(fotoId): { url, erro }` (baixa a imagem via axios com `responseType: "blob"`, cria `URL.createObjectURL`, revoga ao desmontar — necessário porque a `<img>` não envia o cabeçalho `Authorization` e a foto de ocorrência oculta exige o token); `MinhasOcorrencias` (sem props); card "Ocorrências" no `ResumoAtividade`.

- [ ] **Step 1: testes (falham)**:

| Caso | Esperado |
|---|---|
| lista com categoria, miniatura, data e selo "Visível" ou "Oculta pela moderação" | renderizado |
| estado vazio | "Você ainda não reportou nenhum problema." |
| filtro por visibilidade | refaz a busca com `status` |
| "Ver no mapa" | link `/app?trecho=<id>` |
| editar e excluir | só aparecem quando `VISIVEL` |
| excluir | pede confirmação; confirmado → `DELETE` e o item sai da lista |
| editar | abre categoria e descrição preenchidas; salvar → `PUT` |

- [ ] **Step 2: implementar.** A página `Ocorrencia` mostra um texto curto ("Para reportar um problema, abra o mapa, escolha o trecho e use *Reportar problema*") e a lista `MinhasOcorrencias`. O Perfil reaproveita o componente. `ResumoAtividade` mostra o card "Ocorrências" com `totalOcorrencias`. Miniaturas usam `useImagemAutenticada`.
- [ ] **Step 3:** lint, `npx vitest run`, build → OK. Commit — `feat: minhas ocorrencias no perfil`.

---

### Task 7: Moderação do administrador (UC05)

**Files** (sob `frontend/src/`):
- Create: `pages/Moderacao.jsx`, `components/moderacao/ListaModeracao.jsx`, `hooks/useModeracao.js`
- Modify: `services/ocorrenciaService.js` (`listarParaModeracao({ status, moderadasPorMim, pagina, tamanho })`, `alterarVisibilidade(id, status)`), `App.jsx`, `components/AppNavbar.jsx`, `components/perfil/AtalhosAdmin.jsx`
- Test: `components/moderacao/ListaModeracao.test.jsx`

**Interfaces:**
- Consumes: `GET /ocorrencias` (admin) e `PATCH /ocorrencias/{id}` (Task 2); `useImagemAutenticada` (Task 6); `RotaProtegida` com a prop `apenasAdmin`; `useAuth().ehAdmin`.
- Produces: rota `/app/moderacao` dentro de `<Route element={<RotaProtegida apenasAdmin />}>`; item "Moderação" na navbar **só** quando `ehAdmin`; link "Fila de moderação" em `AtalhosAdmin`.

- [ ] **Step 1: testes (falham)**:

| Caso | Esperado |
|---|---|
| cidadão acessa `/app/moderacao` | redirecionado, sem ver a tela |
| administrador vê a lista | cada item mostra foto, categoria, trecho, autor (`autorNome`), data e status |
| filtro Visíveis / Ocultas / Todas | refaz a busca com `status` |
| filtro "Moderadas por mim" | envia `moderadasPorMim=true` |
| item `VISIVEL` | só o botão **Ocultar** |
| item `OCULTA` | só o botão **Reexibir** |
| clicar em Ocultar | `PATCH` com `OCULTA`; o item atualiza sem recarregar |
| erro no `PATCH` | mensagem visível; o botão volta a ficar ativo |
| vazio, carregando e erro | tratados |

- [ ] **Step 2: implementar.** Fotos na moderação usam `useImagemAutenticada`.
- [ ] **Step 3:** lint, `npx vitest run`, `npm run build` → OK. Commit — `feat: moderacao de ocorrencias para administrador`.
