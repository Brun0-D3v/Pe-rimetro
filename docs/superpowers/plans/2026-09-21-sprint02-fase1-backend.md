# Sprint 02 — Fase 1: Núcleo Geográfico (Backend) — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o núcleo geográfico do Pé-rímetro no backend: tabelas `regiao`/`trecho` via Flyway, entidades JPA, repositórios, services e controllers REST (`/api/v1/regioes`, `/api/v1/trechos`) com CRUD completo, validação de entrada e testes TDD, seguindo exatamente as convenções já estabelecidas na Sprint 01 (`HealthController`/`HealthService`/`GlobalExceptionHandler`).

**Architecture:** Camadas `controller → service → repository → entity`, com DTOs de request/response dedicados (nunca entidades expostas na API). `Trecho` representa um trajeto (não um ponto), com a lista de pontos do trajeto (`geometria`) armazenada como JSONB via o mapeamento JSON nativo do Hibernate 6, reaproveitando o mesmo tipo `PontoDto` tanto na entidade quanto nos DTOs de API (evita duplicar `Ponto`/`PontoDto`). A restrição `ON DELETE RESTRICT` da FK `trecho.regiao_id` impede remover uma região com trechos vinculados; o backend traduz essa violação (`DataIntegrityViolationException`) em `409 Conflict` no `GlobalExceptionHandler`, sem precisar consultar `TrechoRepository` a partir de `RegiaoService`.

**Tech Stack:** Spring Boot 4.1.1, Java 21, Spring Data JPA (Hibernate 6), Flyway (`flyway-database-postgresql`), Jakarta Bean Validation (`spring-boot-starter-validation`, dependência nova), PostgreSQL 17. Testes: JUnit 5 + Mockito + AssertJ (`spring-boot-starter-webmvc-test`), sem Testcontainers — segue o padrão já existente de testes unitários com repositório mockado.

**Spec:** `docs/superpowers/specs/2026-09-21-sprint02-fase1-backend-design.md`

## Global Constraints

- `Trecho` é um trajeto (linha), representado por `geometria` (lista de `{lat, lng}`), não um ponto único.
- `geometria` é armazenada como coluna `JSONB`, via `@JdbcTypeCode(SqlTypes.JSON)` do Hibernate — sem PostGIS.
- `status` do Trecho é o ciclo de vida do cadastro (`ATIVO`/`INATIVO`), não uma condição física da via.
- `indice_atual` existe na tabela desde já, `NULL`-ável, sem `CHECK` constraint (escala ainda `a definir` em `Índice de Caminhabilidade`). Nenhum endpoint desta fase escreve nesse campo.
- Todos os endpoints (`GET`/`POST`/`PUT`/`DELETE` em `/api/v1/regioes` e `/api/v1/trechos`) ficam **sem autenticação**, igual `/api/v1/health` hoje.
- Controllers nunca retornam entidades JPA diretamente — sempre DTOs.
- Nomenclatura de classes, campos e métodos de teste em português, como já é o padrão (`HealthController`, `retornaBancoDownQuandoRepositorioFalha`).
- Todos os comandos abaixo assumem `cwd` em `C:\PROJETO PÉ-RÍMETRO\backend`.
- Fora de escopo desta fase: frontend/Leaflet, autenticação, PostGIS, módulo de Avaliação, atualização do Vault.

---

### Task 1: Migration `V2` e dependência de validação

**Files:**
- Create: `backend/src/main/resources/db/migration/V2__cria_tabelas_regiao_e_trecho.sql`
- Modify: `backend/pom.xml`

**Interfaces:**
- Produces: tabelas `regiao` e `trecho` no schema Postgres (consumidas pelas entidades JPA das Tasks 2 e 4); dependência `spring-boot-starter-validation` disponível para `@Valid`/`@NotBlank`/`@NotNull` nas Tasks 2 e 4.

- [ ] **Step 1: Criar a migration `V2`**

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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

- [ ] **Step 2: Adicionar `spring-boot-starter-validation` ao `pom.xml`**

Em `backend/pom.xml`, logo depois do bloco da dependência `spring-boot-starter-webmvc` (antes de `flyway-database-postgresql`), adicionar:

```xml
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-validation</artifactId>
		</dependency>
```

- [ ] **Step 3: Verificar que o projeto compila**

Run: `./mvnw -q compile`
Expected: build termina sem erro (exit code 0).

- [ ] **Step 4: Commit**

```bash
git add backend/pom.xml backend/src/main/resources/db/migration/V2__cria_tabelas_regiao_e_trecho.sql
git commit -m "Adiciona migration V2 (regiao/trecho) e dependencia de validacao"
```

---

### Task 2: `Regiao` — entidade, repositório, exceções e `RegiaoService`

**Files:**
- Create: `backend/src/main/java/br/com/perimetro/entity/Regiao.java`
- Create: `backend/src/main/java/br/com/perimetro/repository/RegiaoRepository.java`
- Create: `backend/src/main/java/br/com/perimetro/dto/RegiaoRequestDto.java`
- Create: `backend/src/main/java/br/com/perimetro/dto/RegiaoResponseDto.java`
- Create: `backend/src/main/java/br/com/perimetro/exception/RegiaoNaoEncontradaException.java`
- Create: `backend/src/main/java/br/com/perimetro/service/RegiaoService.java`
- Modify: `backend/src/main/java/br/com/perimetro/exception/GlobalExceptionHandler.java`
- Test: `backend/src/test/java/br/com/perimetro/service/RegiaoServiceTest.java`

**Interfaces:**
- Consumes: `spring-boot-starter-validation` (Task 1); padrão de `GlobalExceptionHandler`/`ErroResponseDto` já existente.
- Produces: `RegiaoService` com `listar()`, `buscarPorId(UUID)`, `criar(RegiaoRequestDto)`, `atualizar(UUID, RegiaoRequestDto)`, `deletar(UUID)` — usado pela Task 3 (`RegiaoController`) e pela Task 4/5 (`TrechoService` usa `RegiaoRepository` diretamente para validar `regiaoId`). `RegiaoNaoEncontradaException` reaproveitada pela Task 5. `GlobalExceptionHandler` ganha tratamento de `MethodArgumentNotValidException` (400), `HttpMessageNotReadableException` (400) e `DataIntegrityViolationException` (409), reaproveitados por todas as tasks seguintes.

- [ ] **Step 1: Criar a entidade `Regiao`**

```java
package br.com.perimetro.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "regiao")
public class Regiao {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 150)
    private String nome;

    protected Regiao() {
    }

    public Regiao(String nome) {
        this.nome = nome;
    }

    public UUID getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }
}
```

- [ ] **Step 2: Criar `RegiaoRepository`**

```java
package br.com.perimetro.repository;

import br.com.perimetro.entity.Regiao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface RegiaoRepository extends JpaRepository<Regiao, UUID> {
}
```

- [ ] **Step 3: Criar `RegiaoRequestDto` e `RegiaoResponseDto`**

```java
package br.com.perimetro.dto;

import jakarta.validation.constraints.NotBlank;

public class RegiaoRequestDto {

    @NotBlank(message = "nome é obrigatório")
    private final String nome;

    public RegiaoRequestDto(String nome) {
        this.nome = nome;
    }

    public String getNome() {
        return nome;
    }
}
```

```java
package br.com.perimetro.dto;

import java.util.UUID;

public class RegiaoResponseDto {

    private final UUID id;
    private final String nome;

    public RegiaoResponseDto(UUID id, String nome) {
        this.id = id;
        this.nome = nome;
    }

    public UUID getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }
}
```

- [ ] **Step 4: Criar `RegiaoNaoEncontradaException`**

```java
package br.com.perimetro.exception;

public class RegiaoNaoEncontradaException extends RuntimeException {

    public RegiaoNaoEncontradaException(String mensagem) {
        super(mensagem);
    }
}
```

- [ ] **Step 5: Escrever os testes de `RegiaoService` (RED)**

```java
package br.com.perimetro.service;

import br.com.perimetro.dto.RegiaoRequestDto;
import br.com.perimetro.dto.RegiaoResponseDto;
import br.com.perimetro.entity.Regiao;
import br.com.perimetro.exception.RegiaoNaoEncontradaException;
import br.com.perimetro.repository.RegiaoRepository;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RegiaoServiceTest {

    @Test
    void criaRegiaoComNomeInformado() {
        RegiaoRepository repository = mock(RegiaoRepository.class);
        when(repository.save(any(Regiao.class))).thenAnswer(chamada -> chamada.getArgument(0));
        RegiaoService service = new RegiaoService(repository);

        RegiaoResponseDto resultado = service.criar(new RegiaoRequestDto("Centro"));

        assertThat(resultado.getNome()).isEqualTo("Centro");
    }

    @Test
    void listaTodasAsRegioesCadastradas() {
        RegiaoRepository repository = mock(RegiaoRepository.class);
        when(repository.findAll()).thenReturn(List.of(new Regiao("Centro"), new Regiao("Zona Norte")));
        RegiaoService service = new RegiaoService(repository);

        List<RegiaoResponseDto> resultado = service.listar();

        assertThat(resultado).hasSize(2);
    }

    @Test
    void buscaRegiaoPorIdExistente() {
        UUID id = UUID.randomUUID();
        RegiaoRepository repository = mock(RegiaoRepository.class);
        when(repository.findById(id)).thenReturn(Optional.of(new Regiao("Centro")));
        RegiaoService service = new RegiaoService(repository);

        RegiaoResponseDto resultado = service.buscarPorId(id);

        assertThat(resultado.getNome()).isEqualTo("Centro");
    }

    @Test
    void lancaExcecaoAoBuscarRegiaoInexistente() {
        UUID id = UUID.randomUUID();
        RegiaoRepository repository = mock(RegiaoRepository.class);
        when(repository.findById(id)).thenReturn(Optional.empty());
        RegiaoService service = new RegiaoService(repository);

        assertThatThrownBy(() -> service.buscarPorId(id))
                .isInstanceOf(RegiaoNaoEncontradaException.class);
    }

    @Test
    void atualizaNomeDeRegiaoExistente() {
        UUID id = UUID.randomUUID();
        RegiaoRepository repository = mock(RegiaoRepository.class);
        when(repository.findById(id)).thenReturn(Optional.of(new Regiao("Centro")));
        when(repository.save(any(Regiao.class))).thenAnswer(chamada -> chamada.getArgument(0));
        RegiaoService service = new RegiaoService(repository);

        RegiaoResponseDto resultado = service.atualizar(id, new RegiaoRequestDto("Centro Histórico"));

        assertThat(resultado.getNome()).isEqualTo("Centro Histórico");
    }

    @Test
    void removeRegiaoExistente() {
        UUID id = UUID.randomUUID();
        RegiaoRepository repository = mock(RegiaoRepository.class);
        when(repository.existsById(id)).thenReturn(true);
        RegiaoService service = new RegiaoService(repository);

        service.deletar(id);

        verify(repository).deleteById(id);
    }

    @Test
    void lancaExcecaoAoRemoverRegiaoInexistente() {
        UUID id = UUID.randomUUID();
        RegiaoRepository repository = mock(RegiaoRepository.class);
        when(repository.existsById(id)).thenReturn(false);
        RegiaoService service = new RegiaoService(repository);

        assertThatThrownBy(() -> service.deletar(id))
                .isInstanceOf(RegiaoNaoEncontradaException.class);
    }

    @Test
    void propagaConflitoAoRemoverRegiaoComTrechosVinculados() {
        UUID id = UUID.randomUUID();
        RegiaoRepository repository = mock(RegiaoRepository.class);
        when(repository.existsById(id)).thenReturn(true);
        doThrow(new DataIntegrityViolationException("violacao de FK")).when(repository).deleteById(id);
        RegiaoService service = new RegiaoService(repository);

        assertThatThrownBy(() -> service.deletar(id))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
```

- [ ] **Step 6: Rodar os testes e confirmar que falham (RED)**

Run: `./mvnw -q test -Dtest=RegiaoServiceTest`
Expected: FAIL — `RegiaoService` ainda não existe (erro de compilação).

- [ ] **Step 7: Implementar `RegiaoService`**

```java
package br.com.perimetro.service;

import br.com.perimetro.dto.RegiaoRequestDto;
import br.com.perimetro.dto.RegiaoResponseDto;
import br.com.perimetro.entity.Regiao;
import br.com.perimetro.exception.RegiaoNaoEncontradaException;
import br.com.perimetro.repository.RegiaoRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class RegiaoService {

    private final RegiaoRepository regiaoRepository;

    public RegiaoService(RegiaoRepository regiaoRepository) {
        this.regiaoRepository = regiaoRepository;
    }

    public List<RegiaoResponseDto> listar() {
        return regiaoRepository.findAll().stream().map(this::paraDto).toList();
    }

    public RegiaoResponseDto buscarPorId(UUID id) {
        return paraDto(buscarEntidadePorId(id));
    }

    public RegiaoResponseDto criar(RegiaoRequestDto dto) {
        Regiao regiao = new Regiao(dto.getNome());
        return paraDto(regiaoRepository.save(regiao));
    }

    public RegiaoResponseDto atualizar(UUID id, RegiaoRequestDto dto) {
        Regiao regiao = buscarEntidadePorId(id);
        regiao.setNome(dto.getNome());
        return paraDto(regiaoRepository.save(regiao));
    }

    public void deletar(UUID id) {
        if (!regiaoRepository.existsById(id)) {
            throw new RegiaoNaoEncontradaException("Região não encontrada: " + id);
        }
        regiaoRepository.deleteById(id);
    }

    private Regiao buscarEntidadePorId(UUID id) {
        return regiaoRepository.findById(id)
                .orElseThrow(() -> new RegiaoNaoEncontradaException("Região não encontrada: " + id));
    }

    private RegiaoResponseDto paraDto(Regiao regiao) {
        return new RegiaoResponseDto(regiao.getId(), regiao.getNome());
    }
}
```

- [ ] **Step 8: Rodar os testes e confirmar que passam (GREEN)**

Run: `./mvnw -q test -Dtest=RegiaoServiceTest`
Expected: PASS — 8 testes.

- [ ] **Step 9: Adicionar os handlers novos em `GlobalExceptionHandler`**

Substituir o conteúdo de `backend/src/main/java/br/com/perimetro/exception/GlobalExceptionHandler.java` por:

```java
package br.com.perimetro.exception;

import br.com.perimetro.dto.ErroResponseDto;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RegiaoNaoEncontradaException.class)
    public ResponseEntity<ErroResponseDto> tratarRegiaoNaoEncontrada(RegiaoNaoEncontradaException excecao) {
        ErroResponseDto corpo = new ErroResponseDto(excecao.getMessage(), LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(corpo);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErroResponseDto> tratarValidacaoInvalida(MethodArgumentNotValidException excecao) {
        String mensagem = excecao.getBindingResult().getFieldErrors().stream()
                .map(erro -> erro.getField() + ": " + erro.getDefaultMessage())
                .collect(Collectors.joining("; "));
        ErroResponseDto corpo = new ErroResponseDto(mensagem, LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(corpo);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErroResponseDto> tratarCorpoInvalido(HttpMessageNotReadableException excecao) {
        ErroResponseDto corpo = new ErroResponseDto("Corpo da requisição inválido", LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(corpo);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErroResponseDto> tratarConflitoDeIntegridade(DataIntegrityViolationException excecao) {
        ErroResponseDto corpo = new ErroResponseDto("Não é possível concluir: existem dados vinculados", LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(corpo);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErroResponseDto> tratarErroGenerico(Exception excecao) {
        ErroResponseDto corpo = new ErroResponseDto("Erro interno no servidor", LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(corpo);
    }
}
```

(`RegiaoNaoEncontradaException` já existe desde o Step 4; `TrechoNaoEncontradoException`, criada na Task 5, é tratada em um handler adicional naquela task.)

- [ ] **Step 10: Rodar toda a suíte de testes existente e confirmar que nada quebrou**

Run: `./mvnw -q test`
Expected: PASS — todos os testes de `HealthController`/`HealthService`/`GlobalExceptionHandler` (Sprint 01) continuam passando, além dos novos de `RegiaoService`.

- [ ] **Step 11: Commit**

```bash
git add backend/src/main/java/br/com/perimetro/entity/Regiao.java \
        backend/src/main/java/br/com/perimetro/repository/RegiaoRepository.java \
        backend/src/main/java/br/com/perimetro/dto/RegiaoRequestDto.java \
        backend/src/main/java/br/com/perimetro/dto/RegiaoResponseDto.java \
        backend/src/main/java/br/com/perimetro/exception/RegiaoNaoEncontradaException.java \
        backend/src/main/java/br/com/perimetro/service/RegiaoService.java \
        backend/src/main/java/br/com/perimetro/exception/GlobalExceptionHandler.java \
        backend/src/test/java/br/com/perimetro/service/RegiaoServiceTest.java
git commit -m "Adiciona RegiaoService com CRUD completo e tratamento de erros"
```

---

### Task 3: `RegiaoController`

**Files:**
- Create: `backend/src/main/java/br/com/perimetro/controller/RegiaoController.java`
- Test: `backend/src/test/java/br/com/perimetro/controller/RegiaoControllerTest.java`

**Interfaces:**
- Consumes: `RegiaoService` (Task 2) — `listar()`, `buscarPorId(UUID)`, `criar(RegiaoRequestDto)`, `atualizar(UUID, RegiaoRequestDto)`, `deletar(UUID)`.
- Produces: endpoints `GET/POST/PUT/DELETE /api/v1/regioes[/{id}]`, consumidos pelo frontend na Fase 2.

- [ ] **Step 1: Escrever `RegiaoControllerTest` (RED)**

```java
package br.com.perimetro.controller;

import br.com.perimetro.dto.RegiaoRequestDto;
import br.com.perimetro.dto.RegiaoResponseDto;
import br.com.perimetro.exception.RegiaoNaoEncontradaException;
import br.com.perimetro.service.RegiaoService;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RegiaoController.class)
class RegiaoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private RegiaoService regiaoService;

    @Test
    void listaRegioesCadastradas() throws Exception {
        UUID id = UUID.randomUUID();
        when(regiaoService.listar()).thenReturn(List.of(new RegiaoResponseDto(id, "Centro")));

        mockMvc.perform(get("/api/v1/regioes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nome").value("Centro"));
    }

    @Test
    void criaRegiaoComNomeValido() throws Exception {
        UUID id = UUID.randomUUID();
        when(regiaoService.criar(any())).thenReturn(new RegiaoResponseDto(id, "Centro"));

        mockMvc.perform(post("/api/v1/regioes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RegiaoRequestDto("Centro"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nome").value("Centro"));
    }

    @Test
    void rejeitaRegiaoComNomeEmBranco() throws Exception {
        mockMvc.perform(post("/api/v1/regioes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RegiaoRequestDto(""))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void retorna404QuandoRegiaoNaoExiste() throws Exception {
        UUID id = UUID.randomUUID();
        when(regiaoService.buscarPorId(id)).thenThrow(new RegiaoNaoEncontradaException("Região não encontrada: " + id));

        mockMvc.perform(get("/api/v1/regioes/{id}", id))
                .andExpect(status().isNotFound());
    }

    @Test
    void removeRegiaoExistente() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(delete("/api/v1/regioes/{id}", id))
                .andExpect(status().isNoContent());
    }
}
```

- [ ] **Step 2: Rodar os testes e confirmar que falham (RED)**

Run: `./mvnw -q test -Dtest=RegiaoControllerTest`
Expected: FAIL — `RegiaoController` ainda não existe.

- [ ] **Step 3: Implementar `RegiaoController`**

```java
package br.com.perimetro.controller;

import br.com.perimetro.dto.RegiaoRequestDto;
import br.com.perimetro.dto.RegiaoResponseDto;
import br.com.perimetro.service.RegiaoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/regioes")
public class RegiaoController {

    private final RegiaoService regiaoService;

    public RegiaoController(RegiaoService regiaoService) {
        this.regiaoService = regiaoService;
    }

    @GetMapping
    public List<RegiaoResponseDto> listar() {
        return regiaoService.listar();
    }

    @GetMapping("/{id}")
    public RegiaoResponseDto buscarPorId(@PathVariable UUID id) {
        return regiaoService.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RegiaoResponseDto criar(@Valid @RequestBody RegiaoRequestDto dto) {
        return regiaoService.criar(dto);
    }

    @PutMapping("/{id}")
    public RegiaoResponseDto atualizar(@PathVariable UUID id, @Valid @RequestBody RegiaoRequestDto dto) {
        return regiaoService.atualizar(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletar(@PathVariable UUID id) {
        regiaoService.deletar(id);
    }
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam (GREEN)**

Run: `./mvnw -q test -Dtest=RegiaoControllerTest`
Expected: PASS — 5 testes.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/br/com/perimetro/controller/RegiaoController.java \
        backend/src/test/java/br/com/perimetro/controller/RegiaoControllerTest.java
git commit -m "Adiciona RegiaoController com endpoints REST completos"
```

---

### Task 4: `Trecho` — tipos de apoio, entidade e repositório

**Files:**
- Create: `backend/src/main/java/br/com/perimetro/dto/PontoDto.java`
- Create: `backend/src/main/java/br/com/perimetro/entity/AtivoInativo.java`
- Create: `backend/src/main/java/br/com/perimetro/entity/Trecho.java`
- Create: `backend/src/main/java/br/com/perimetro/repository/TrechoRepository.java`

**Interfaces:**
- Consumes: `Regiao` (Task 2, para o `@ManyToOne`).
- Produces: `PontoDto(double lat, double lng)` — elemento de `geometria`, usado pela entidade `Trecho` e por todos os DTOs de trecho (Task 5). `AtivoInativo` (`ATIVO`, `INATIVO`) — usado pela entidade e pelos DTOs de trecho. `Trecho` entidade com getters/setters, usada pela Task 5 (`TrechoService`). `TrechoRepository` com `findByRegiaoId(UUID)`, usado pela Task 5.

Este task não tem ciclo RED/GREEN próprio — nenhum destes arquivos tem comportamento testável isoladamente (mesmo padrão de `SystemHealth`/`Regiao`, cujas entidades não têm teste dedicado). O comportamento é coberto pelos testes de `TrechoService` na Task 5.

- [ ] **Step 1: Criar `PontoDto`**

```java
package br.com.perimetro.dto;

public class PontoDto {

    private final double lat;
    private final double lng;

    public PontoDto(double lat, double lng) {
        this.lat = lat;
        this.lng = lng;
    }

    public double getLat() {
        return lat;
    }

    public double getLng() {
        return lng;
    }
}
```

- [ ] **Step 2: Criar o enum `AtivoInativo`**

```java
package br.com.perimetro.entity;

public enum AtivoInativo {
    ATIVO,
    INATIVO
}
```

- [ ] **Step 3: Criar a entidade `Trecho`**

```java
package br.com.perimetro.entity;

import br.com.perimetro.dto.PontoDto;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "trecho")
public class Trecho {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 150)
    private String nome;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private List<PontoDto> geometria;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    @Column(name = "indice_atual", precision = 4, scale = 2)
    private BigDecimal indiceAtual;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AtivoInativo status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "regiao_id", nullable = false)
    private Regiao regiao;

    protected Trecho() {
    }

    public Trecho(String nome, List<PontoDto> geometria, double latitude, double longitude,
                  AtivoInativo status, Regiao regiao) {
        this.nome = nome;
        this.geometria = geometria;
        this.latitude = latitude;
        this.longitude = longitude;
        this.status = status;
        this.regiao = regiao;
    }

    public UUID getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public List<PontoDto> getGeometria() {
        return geometria;
    }

    public void setGeometria(List<PontoDto> geometria) {
        this.geometria = geometria;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    public BigDecimal getIndiceAtual() {
        return indiceAtual;
    }

    public AtivoInativo getStatus() {
        return status;
    }

    public void setStatus(AtivoInativo status) {
        this.status = status;
    }

    public Regiao getRegiao() {
        return regiao;
    }

    public void setRegiao(Regiao regiao) {
        this.regiao = regiao;
    }
}
```

- [ ] **Step 4: Criar `TrechoRepository`**

```java
package br.com.perimetro.repository;

import br.com.perimetro.entity.Trecho;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TrechoRepository extends JpaRepository<Trecho, UUID> {

    List<Trecho> findByRegiaoId(UUID regiaoId);
}
```

- [ ] **Step 5: Verificar que o projeto compila**

Run: `./mvnw -q compile`
Expected: build termina sem erro.

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/br/com/perimetro/dto/PontoDto.java \
        backend/src/main/java/br/com/perimetro/entity/AtivoInativo.java \
        backend/src/main/java/br/com/perimetro/entity/Trecho.java \
        backend/src/main/java/br/com/perimetro/repository/TrechoRepository.java
git commit -m "Adiciona entidade Trecho, PontoDto, AtivoInativo e TrechoRepository"
```

---

### Task 5: `Trecho` — DTOs, exceção e `TrechoService`

**Files:**
- Create: `backend/src/main/java/br/com/perimetro/dto/TrechoRequestDto.java`
- Create: `backend/src/main/java/br/com/perimetro/dto/TrechoResponseDto.java`
- Create: `backend/src/main/java/br/com/perimetro/exception/TrechoNaoEncontradoException.java`
- Create: `backend/src/main/java/br/com/perimetro/service/TrechoService.java`
- Modify: `backend/src/main/java/br/com/perimetro/exception/GlobalExceptionHandler.java`
- Test: `backend/src/test/java/br/com/perimetro/service/TrechoServiceTest.java`

**Interfaces:**
- Consumes: `Trecho`, `PontoDto`, `AtivoInativo`, `TrechoRepository` (Task 4); `Regiao`, `RegiaoRepository`, `RegiaoNaoEncontradaException` (Task 2).
- Produces: `TrechoService` com `listar(UUID regiaoIdOuNull)`, `buscarPorId(UUID)`, `criar(TrechoRequestDto)`, `atualizar(UUID, TrechoRequestDto)`, `deletar(UUID)` — usado pela Task 6 (`TrechoController`). `TrechoNaoEncontradoException` tratada com 404.

- [ ] **Step 1: Criar `TrechoRequestDto` e `TrechoResponseDto`**

```java
package br.com.perimetro.dto;

import br.com.perimetro.entity.AtivoInativo;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public class TrechoRequestDto {

    @NotBlank(message = "nome é obrigatório")
    private final String nome;

    @NotNull(message = "geometria é obrigatória")
    private final List<PontoDto> geometria;

    @NotNull(message = "latitude é obrigatória")
    private final Double latitude;

    @NotNull(message = "longitude é obrigatória")
    private final Double longitude;

    @NotNull(message = "regiaoId é obrigatório")
    private final UUID regiaoId;

    private final AtivoInativo status;

    public TrechoRequestDto(String nome, List<PontoDto> geometria, Double latitude, Double longitude,
                             UUID regiaoId, AtivoInativo status) {
        this.nome = nome;
        this.geometria = geometria;
        this.latitude = latitude;
        this.longitude = longitude;
        this.regiaoId = regiaoId;
        this.status = status;
    }

    public String getNome() {
        return nome;
    }

    public List<PontoDto> getGeometria() {
        return geometria;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public UUID getRegiaoId() {
        return regiaoId;
    }

    public AtivoInativo getStatus() {
        return status;
    }
}
```

```java
package br.com.perimetro.dto;

import br.com.perimetro.entity.AtivoInativo;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class TrechoResponseDto {

    private final UUID id;
    private final String nome;
    private final List<PontoDto> geometria;
    private final double latitude;
    private final double longitude;
    private final BigDecimal indiceAtual;
    private final AtivoInativo status;
    private final UUID regiaoId;

    public TrechoResponseDto(UUID id, String nome, List<PontoDto> geometria, double latitude, double longitude,
                              BigDecimal indiceAtual, AtivoInativo status, UUID regiaoId) {
        this.id = id;
        this.nome = nome;
        this.geometria = geometria;
        this.latitude = latitude;
        this.longitude = longitude;
        this.indiceAtual = indiceAtual;
        this.status = status;
        this.regiaoId = regiaoId;
    }

    public UUID getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public List<PontoDto> getGeometria() {
        return geometria;
    }

    public double getLatitude() {
        return latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public BigDecimal getIndiceAtual() {
        return indiceAtual;
    }

    public AtivoInativo getStatus() {
        return status;
    }

    public UUID getRegiaoId() {
        return regiaoId;
    }
}
```

- [ ] **Step 2: Criar `TrechoNaoEncontradoException`**

```java
package br.com.perimetro.exception;

public class TrechoNaoEncontradoException extends RuntimeException {

    public TrechoNaoEncontradoException(String mensagem) {
        super(mensagem);
    }
}
```

- [ ] **Step 3: Escrever os testes de `TrechoService` (RED)**

```java
package br.com.perimetro.service;

import br.com.perimetro.dto.PontoDto;
import br.com.perimetro.dto.TrechoRequestDto;
import br.com.perimetro.dto.TrechoResponseDto;
import br.com.perimetro.entity.AtivoInativo;
import br.com.perimetro.entity.Regiao;
import br.com.perimetro.entity.Trecho;
import br.com.perimetro.exception.RegiaoNaoEncontradaException;
import br.com.perimetro.exception.TrechoNaoEncontradoException;
import br.com.perimetro.repository.RegiaoRepository;
import br.com.perimetro.repository.TrechoRepository;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TrechoServiceTest {

    private static final List<PontoDto> GEOMETRIA_EXEMPLO = List.of(
            new PontoDto(-23.550520, -46.633308),
            new PontoDto(-23.551200, -46.634000)
    );

    @Test
    void criaTrechoQuandoRegiaoExiste() {
        UUID regiaoId = UUID.randomUUID();
        Regiao regiao = new Regiao("Centro");
        TrechoRepository trechoRepository = mock(TrechoRepository.class);
        RegiaoRepository regiaoRepository = mock(RegiaoRepository.class);
        when(regiaoRepository.findById(regiaoId)).thenReturn(Optional.of(regiao));
        when(trechoRepository.save(any(Trecho.class))).thenAnswer(chamada -> chamada.getArgument(0));
        TrechoService service = new TrechoService(trechoRepository, regiaoRepository);

        TrechoResponseDto resultado = service.criar(new TrechoRequestDto(
                "Rua das Flores", GEOMETRIA_EXEMPLO, -23.55, -46.63, regiaoId, null));

        assertThat(resultado.getNome()).isEqualTo("Rua das Flores");
        assertThat(resultado.getStatus()).isEqualTo(AtivoInativo.ATIVO);
        assertThat(resultado.getGeometria()).hasSize(2);
    }

    @Test
    void lancaExcecaoAoCriarTrechoComRegiaoInexistente() {
        UUID regiaoId = UUID.randomUUID();
        TrechoRepository trechoRepository = mock(TrechoRepository.class);
        RegiaoRepository regiaoRepository = mock(RegiaoRepository.class);
        when(regiaoRepository.findById(regiaoId)).thenReturn(Optional.empty());
        TrechoService service = new TrechoService(trechoRepository, regiaoRepository);

        assertThatThrownBy(() -> service.criar(new TrechoRequestDto(
                "Rua das Flores", GEOMETRIA_EXEMPLO, -23.55, -46.63, regiaoId, null)))
                .isInstanceOf(RegiaoNaoEncontradaException.class);
    }

    @Test
    void listaTrechosFiltradosPorRegiao() {
        UUID regiaoId = UUID.randomUUID();
        Regiao regiao = new Regiao("Centro");
        TrechoRepository trechoRepository = mock(TrechoRepository.class);
        RegiaoRepository regiaoRepository = mock(RegiaoRepository.class);
        when(trechoRepository.findByRegiaoId(regiaoId)).thenReturn(
                List.of(new Trecho("Rua A", GEOMETRIA_EXEMPLO, -23.55, -46.63, AtivoInativo.ATIVO, regiao)));
        TrechoService service = new TrechoService(trechoRepository, regiaoRepository);

        List<TrechoResponseDto> resultado = service.listar(regiaoId);

        assertThat(resultado).hasSize(1);
        verify(trechoRepository).findByRegiaoId(regiaoId);
        verify(trechoRepository, never()).findAll();
    }

    @Test
    void listaTodosOsTrechosQuandoRegiaoNaoInformada() {
        Regiao regiao = new Regiao("Centro");
        TrechoRepository trechoRepository = mock(TrechoRepository.class);
        RegiaoRepository regiaoRepository = mock(RegiaoRepository.class);
        when(trechoRepository.findAll()).thenReturn(
                List.of(new Trecho("Rua A", GEOMETRIA_EXEMPLO, -23.55, -46.63, AtivoInativo.ATIVO, regiao)));
        TrechoService service = new TrechoService(trechoRepository, regiaoRepository);

        List<TrechoResponseDto> resultado = service.listar(null);

        assertThat(resultado).hasSize(1);
        verify(trechoRepository).findAll();
    }

    @Test
    void lancaExcecaoAoBuscarTrechoInexistente() {
        UUID id = UUID.randomUUID();
        TrechoRepository trechoRepository = mock(TrechoRepository.class);
        RegiaoRepository regiaoRepository = mock(RegiaoRepository.class);
        when(trechoRepository.findById(id)).thenReturn(Optional.empty());
        TrechoService service = new TrechoService(trechoRepository, regiaoRepository);

        assertThatThrownBy(() -> service.buscarPorId(id))
                .isInstanceOf(TrechoNaoEncontradoException.class);
    }

    @Test
    void removeTrechoExistente() {
        UUID id = UUID.randomUUID();
        TrechoRepository trechoRepository = mock(TrechoRepository.class);
        RegiaoRepository regiaoRepository = mock(RegiaoRepository.class);
        when(trechoRepository.existsById(id)).thenReturn(true);
        TrechoService service = new TrechoService(trechoRepository, regiaoRepository);

        service.deletar(id);

        verify(trechoRepository).deleteById(id);
    }
}
```

- [ ] **Step 4: Rodar os testes e confirmar que falham (RED)**

Run: `./mvnw -q test -Dtest=TrechoServiceTest`
Expected: FAIL — `TrechoService` ainda não existe.

- [ ] **Step 5: Implementar `TrechoService`**

```java
package br.com.perimetro.service;

import br.com.perimetro.dto.TrechoRequestDto;
import br.com.perimetro.dto.TrechoResponseDto;
import br.com.perimetro.entity.AtivoInativo;
import br.com.perimetro.entity.Regiao;
import br.com.perimetro.entity.Trecho;
import br.com.perimetro.exception.RegiaoNaoEncontradaException;
import br.com.perimetro.exception.TrechoNaoEncontradoException;
import br.com.perimetro.repository.RegiaoRepository;
import br.com.perimetro.repository.TrechoRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class TrechoService {

    private final TrechoRepository trechoRepository;
    private final RegiaoRepository regiaoRepository;

    public TrechoService(TrechoRepository trechoRepository, RegiaoRepository regiaoRepository) {
        this.trechoRepository = trechoRepository;
        this.regiaoRepository = regiaoRepository;
    }

    public List<TrechoResponseDto> listar(UUID regiaoId) {
        List<Trecho> trechos = regiaoId != null
                ? trechoRepository.findByRegiaoId(regiaoId)
                : trechoRepository.findAll();
        return trechos.stream().map(this::paraDto).toList();
    }

    public TrechoResponseDto buscarPorId(UUID id) {
        return paraDto(buscarEntidadePorId(id));
    }

    public TrechoResponseDto criar(TrechoRequestDto dto) {
        Regiao regiao = buscarRegiao(dto.getRegiaoId());
        AtivoInativo status = dto.getStatus() != null ? dto.getStatus() : AtivoInativo.ATIVO;
        Trecho trecho = new Trecho(dto.getNome(), dto.getGeometria(), dto.getLatitude(), dto.getLongitude(), status, regiao);
        return paraDto(trechoRepository.save(trecho));
    }

    public TrechoResponseDto atualizar(UUID id, TrechoRequestDto dto) {
        Trecho trecho = buscarEntidadePorId(id);
        Regiao regiao = buscarRegiao(dto.getRegiaoId());
        AtivoInativo status = dto.getStatus() != null ? dto.getStatus() : AtivoInativo.ATIVO;
        trecho.setNome(dto.getNome());
        trecho.setGeometria(dto.getGeometria());
        trecho.setLatitude(dto.getLatitude());
        trecho.setLongitude(dto.getLongitude());
        trecho.setStatus(status);
        trecho.setRegiao(regiao);
        return paraDto(trechoRepository.save(trecho));
    }

    public void deletar(UUID id) {
        if (!trechoRepository.existsById(id)) {
            throw new TrechoNaoEncontradoException("Trecho não encontrado: " + id);
        }
        trechoRepository.deleteById(id);
    }

    private Trecho buscarEntidadePorId(UUID id) {
        return trechoRepository.findById(id)
                .orElseThrow(() -> new TrechoNaoEncontradoException("Trecho não encontrado: " + id));
    }

    private Regiao buscarRegiao(UUID regiaoId) {
        return regiaoRepository.findById(regiaoId)
                .orElseThrow(() -> new RegiaoNaoEncontradaException("Região não encontrada: " + regiaoId));
    }

    private TrechoResponseDto paraDto(Trecho trecho) {
        return new TrechoResponseDto(
                trecho.getId(),
                trecho.getNome(),
                trecho.getGeometria(),
                trecho.getLatitude(),
                trecho.getLongitude(),
                trecho.getIndiceAtual(),
                trecho.getStatus(),
                trecho.getRegiao().getId()
        );
    }
}
```

- [ ] **Step 6: Rodar os testes e confirmar que passam (GREEN)**

Run: `./mvnw -q test -Dtest=TrechoServiceTest`
Expected: PASS — 6 testes.

- [ ] **Step 7: Adicionar o handler de `TrechoNaoEncontradoException` em `GlobalExceptionHandler`**

Em `backend/src/main/java/br/com/perimetro/exception/GlobalExceptionHandler.java`, adicionar o import `br.com.perimetro.exception.TrechoNaoEncontradoException` já está no mesmo pacote (não precisa de import) e o método, logo depois de `tratarRegiaoNaoEncontrada`:

```java
    @ExceptionHandler(TrechoNaoEncontradoException.class)
    public ResponseEntity<ErroResponseDto> tratarTrechoNaoEncontrado(TrechoNaoEncontradoException excecao) {
        ErroResponseDto corpo = new ErroResponseDto(excecao.getMessage(), LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(corpo);
    }
```

- [ ] **Step 8: Rodar toda a suíte e confirmar que nada quebrou**

Run: `./mvnw -q test`
Expected: PASS — todos os testes até aqui.

- [ ] **Step 9: Commit**

```bash
git add backend/src/main/java/br/com/perimetro/dto/TrechoRequestDto.java \
        backend/src/main/java/br/com/perimetro/dto/TrechoResponseDto.java \
        backend/src/main/java/br/com/perimetro/exception/TrechoNaoEncontradoException.java \
        backend/src/main/java/br/com/perimetro/service/TrechoService.java \
        backend/src/main/java/br/com/perimetro/exception/GlobalExceptionHandler.java \
        backend/src/test/java/br/com/perimetro/service/TrechoServiceTest.java
git commit -m "Adiciona TrechoService com CRUD completo e filtro por regiao"
```

---

### Task 6: `TrechoController`

**Files:**
- Create: `backend/src/main/java/br/com/perimetro/controller/TrechoController.java`
- Test: `backend/src/test/java/br/com/perimetro/controller/TrechoControllerTest.java`

**Interfaces:**
- Consumes: `TrechoService` (Task 5) — `listar(UUID)`, `buscarPorId(UUID)`, `criar(TrechoRequestDto)`, `atualizar(UUID, TrechoRequestDto)`, `deletar(UUID)`.
- Produces: endpoints `GET/POST/PUT/DELETE /api/v1/trechos[/{id}]`, incluindo `GET /api/v1/trechos?regiaoId=` — consumidos pelo frontend na Fase 2.

- [ ] **Step 1: Escrever `TrechoControllerTest` (RED)**

```java
package br.com.perimetro.controller;

import br.com.perimetro.dto.PontoDto;
import br.com.perimetro.dto.TrechoRequestDto;
import br.com.perimetro.dto.TrechoResponseDto;
import br.com.perimetro.entity.AtivoInativo;
import br.com.perimetro.exception.RegiaoNaoEncontradaException;
import br.com.perimetro.exception.TrechoNaoEncontradoException;
import br.com.perimetro.service.TrechoService;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TrechoController.class)
class TrechoControllerTest {

    private static final List<PontoDto> GEOMETRIA_EXEMPLO = List.of(
            new PontoDto(-23.550520, -46.633308),
            new PontoDto(-23.551200, -46.634000)
    );

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TrechoService trechoService;

    @Test
    void listaTodosOsTrechosSemFiltro() throws Exception {
        UUID id = UUID.randomUUID();
        UUID regiaoId = UUID.randomUUID();
        when(trechoService.listar(null)).thenReturn(List.of(
                new TrechoResponseDto(id, "Rua das Flores", GEOMETRIA_EXEMPLO, -23.55, -46.63, null, AtivoInativo.ATIVO, regiaoId)));

        mockMvc.perform(get("/api/v1/trechos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nome").value("Rua das Flores"));
    }

    @Test
    void listaTrechosFiltradosPorRegiao() throws Exception {
        UUID regiaoId = UUID.randomUUID();
        when(trechoService.listar(regiaoId)).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/trechos").param("regiaoId", regiaoId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void criaTrechoComDadosValidos() throws Exception {
        UUID id = UUID.randomUUID();
        UUID regiaoId = UUID.randomUUID();
        when(trechoService.criar(any())).thenReturn(
                new TrechoResponseDto(id, "Rua das Flores", GEOMETRIA_EXEMPLO, -23.55, -46.63, null, AtivoInativo.ATIVO, regiaoId));
        TrechoRequestDto corpo = new TrechoRequestDto("Rua das Flores", GEOMETRIA_EXEMPLO, -23.55, -46.63, regiaoId, null);

        mockMvc.perform(post("/api/v1/trechos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(corpo)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nome").value("Rua das Flores"))
                .andExpect(jsonPath("$.status").value("ATIVO"));
    }

    @Test
    void rejeitaTrechoSemNome() throws Exception {
        UUID regiaoId = UUID.randomUUID();
        TrechoRequestDto corpo = new TrechoRequestDto("", GEOMETRIA_EXEMPLO, -23.55, -46.63, regiaoId, null);

        mockMvc.perform(post("/api/v1/trechos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(corpo)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void retorna404QuandoRegiaoDoTrechoNaoExiste() throws Exception {
        UUID regiaoId = UUID.randomUUID();
        when(trechoService.criar(any())).thenThrow(new RegiaoNaoEncontradaException("Região não encontrada: " + regiaoId));
        TrechoRequestDto corpo = new TrechoRequestDto("Rua das Flores", GEOMETRIA_EXEMPLO, -23.55, -46.63, regiaoId, null);

        mockMvc.perform(post("/api/v1/trechos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(corpo)))
                .andExpect(status().isNotFound());
    }

    @Test
    void retorna404QuandoTrechoNaoExiste() throws Exception {
        UUID id = UUID.randomUUID();
        when(trechoService.buscarPorId(id)).thenThrow(new TrechoNaoEncontradoException("Trecho não encontrado: " + id));

        mockMvc.perform(get("/api/v1/trechos/{id}", id))
                .andExpect(status().isNotFound());
    }

    @Test
    void removeTrechoExistente() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(delete("/api/v1/trechos/{id}", id))
                .andExpect(status().isNoContent());
    }
}
```

- [ ] **Step 2: Rodar os testes e confirmar que falham (RED)**

Run: `./mvnw -q test -Dtest=TrechoControllerTest`
Expected: FAIL — `TrechoController` ainda não existe.

- [ ] **Step 3: Implementar `TrechoController`**

```java
package br.com.perimetro.controller;

import br.com.perimetro.dto.TrechoRequestDto;
import br.com.perimetro.dto.TrechoResponseDto;
import br.com.perimetro.service.TrechoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/trechos")
public class TrechoController {

    private final TrechoService trechoService;

    public TrechoController(TrechoService trechoService) {
        this.trechoService = trechoService;
    }

    @GetMapping
    public List<TrechoResponseDto> listar(@RequestParam(required = false) UUID regiaoId) {
        return trechoService.listar(regiaoId);
    }

    @GetMapping("/{id}")
    public TrechoResponseDto buscarPorId(@PathVariable UUID id) {
        return trechoService.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TrechoResponseDto criar(@Valid @RequestBody TrechoRequestDto dto) {
        return trechoService.criar(dto);
    }

    @PutMapping("/{id}")
    public TrechoResponseDto atualizar(@PathVariable UUID id, @Valid @RequestBody TrechoRequestDto dto) {
        return trechoService.atualizar(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletar(@PathVariable UUID id) {
        trechoService.deletar(id);
    }
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam (GREEN)**

Run: `./mvnw -q test -Dtest=TrechoControllerTest`
Expected: PASS — 7 testes.

- [ ] **Step 5: Rodar toda a suíte do backend e confirmar que nada quebrou**

Run: `./mvnw -q test`
Expected: PASS — todos os testes do projeto (Sprint 01 + Regiao + Trecho).

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/br/com/perimetro/controller/TrechoController.java \
        backend/src/test/java/br/com/perimetro/controller/TrechoControllerTest.java
git commit -m "Adiciona TrechoController com endpoints REST e filtro por regiao"
```

---

### Task 7: Verificação manual end-to-end

**Files:**
- Nenhum (apenas verificação; nenhum arquivo é criado ou modificado).

**Interfaces:**
- Consumes: toda a stack das Tasks 1–6, mais `docker-compose.yml` (raiz do repo) já existente.
- Produces: confirmação de que `/api/v1/regioes` e `/api/v1/trechos` respondem de ponta a ponta contra um Postgres real, com a migration `V2` aplicada e o mapeamento JSONB funcionando — o gate pedido antes de autorizar a Fase 2 (frontend).

- [ ] **Step 1: Subir o Postgres local**

Run (a partir da raiz do repo, `C:\PROJETO PÉ-RÍMETRO`): `docker compose up -d`
Expected: container `postgres` sobe e fica saudável na porta 5432.

- [ ] **Step 2: Subir o backend**

Run (a partir de `backend/`): `./mvnw spring-boot:run`
Expected no log: `Flyway ... Successfully applied 1 migration to schema "public"` (migration `V2`) e nenhuma `SchemaManagementException` do Hibernate (confirma que as entidades batem com o schema criado). Deixar rodando em background para os próximos steps.

- [ ] **Step 3: Criar uma Região**

Run: `curl -s -X POST http://localhost:8080/api/v1/regioes -H "Content-Type: application/json" -d "{\"nome\":\"Centro\"}"`
Expected: `201`, corpo `{"id":"<uuid>","nome":"Centro"}`. Guardar o `id` retornado como `REGIAO_ID`.

- [ ] **Step 4: Criar um Trecho vinculado à Região**

Run: `curl -s -X POST http://localhost:8080/api/v1/trechos -H "Content-Type: application/json" -d "{\"nome\":\"Rua das Flores\",\"geometria\":[{\"lat\":-23.55052,\"lng\":-46.633308},{\"lat\":-23.5512,\"lng\":-46.634}],\"latitude\":-23.55052,\"longitude\":-46.633308,\"regiaoId\":\"REGIAO_ID\"}"` (substituir `REGIAO_ID` pelo valor do Step 3)
Expected: `201`, corpo com `"status":"ATIVO"` e `"indiceAtual":null`.

- [ ] **Step 5: Listar e filtrar**

Run: `curl -s http://localhost:8080/api/v1/trechos`
Expected: `200`, array com o trecho criado.

Run: `curl -s "http://localhost:8080/api/v1/trechos?regiaoId=REGIAO_ID"` (mesmo `REGIAO_ID`)
Expected: `200`, array com o mesmo trecho.

- [ ] **Step 6: Confirmar o conflito ao remover uma Região com trechos vinculados**

Run: `curl -s -o /dev/null -w "%{http_code}" -X DELETE http://localhost:8080/api/v1/regioes/REGIAO_ID`
Expected: `409`.

- [ ] **Step 7: Encerrar o backend**

Parar o processo do `./mvnw spring-boot:run` (Ctrl+C ou encerrar o processo em background).

- [ ] **Step 8: Reportar ao usuário**

Confirmar que `/api/v1/regioes` e `/api/v1/trechos` estão rodando e respondendo como esperado (CRUD completo, filtro por região, conflito de FK), e pedir autorização explícita antes de iniciar a Fase 2 (frontend/Leaflet), conforme combinado no brainstorming.
