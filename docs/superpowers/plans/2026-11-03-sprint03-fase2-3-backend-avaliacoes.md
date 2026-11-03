# Sprint 03 Fases 2 e 3 - Testcontainers, Avaliações e Índice (Backend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduzir testes de integração com Postgres real (Testcontainers) e entregar `POST /api/v1/trechos/{trechoId}/avaliacoes`, que grava a avaliação anônima e recalcula `indice_atual`, `total_avaliacoes` e `classificacao` do trecho.

**Architecture:** Camadas já existentes (controller, service, repository, entity, dto). Novos: entidade `Avaliacao`, `CalculadoraIndice` (pesos e fórmula) e enum `Classificacao` (faixas), únicos donos da regra. O serviço trava a linha do trecho (`PESSIMISTIC_WRITE`), grava a avaliação e recalcula o índice por consulta agregada (`AVG`). Testes de integração herdam de uma base que sobe um Postgres via `@ServiceConnection`.

**Tech Stack:** Java 21, Spring Boot 4.1.1 (Jackson 3, pacote `tools.jackson`), Spring Data JPA, Flyway, PostgreSQL 17, JUnit 5, Mockito, Testcontainers 2.x.

**Spec:** `docs/superpowers/specs/2026-11-03-sprint03-localizacao-avaliacoes-design.md` (seções "Fase 2" e "Fase 3")

## Global Constraints

- Repositório de código: `C:\PROJETO PÉ-RÍMETRO` (backend em `backend/`). Vault: `C:\CLAUDE\PÉ-RÍMETRO` (git separado). Rodar Maven com `./mvnw` dentro de `backend/`.
- Os testes de integração exigem o **Docker em execução**. Os testes unitários existentes (mocks) são mantidos.
- Escala: nota inteira de 0 a 10 nas 6 dimensões. Pesos: Calçada 0,25; Acessibilidade 0,25; Iluminação 0,15; Arborização 0,15; Travessias 0,10; Mobiliário 0,10.
- Índice do trecho = média simples de todas as avaliações, recalculada por `AVG` a cada nova avaliação, gravada com 2 casas decimais (`numeric(4,2)`, `HALF_UP`).
- Faixas, aplicadas ao índice **arredondado a 1 casa (`HALF_UP`)**, que é o valor exibido ao usuário: Ruim `< 4,0`; Médio de `4,0` a `6,9`; Bom `>= 7,0`; `null` quando não há avaliações. (Decisão de plano: classificar pelo valor exibido evita um 6,95 aparecer como "7,0" e ser classificado Médio.)
- `usuario_id` da avaliação é nulo e **sem FK** nesta sprint (a FK entra na Sprint 04).
- Trecho `INATIVO` não aceita avaliação (`409`). Trecho inexistente `404`. Nota ausente, fora de 0 a 10 ou não inteira `400`. Erros no formato `ErroResponseDto` existente.
- Sem `GET` de avaliações.
- Mensagens e nomes em português, seguindo o código existente. Jackson 3: importar `tools.jackson.databind.ObjectMapper`; anotações continuam em `com.fasterxml.jackson.annotation`.
- Vault: REGRA 04 (data real da sessão em `data_atualizacao`, nunca alterar `data_criacao`), REGRA 02 (wikilinks), REGRA 10 (não apagar histórico), REGRA 06 (não inventar).

---

### Task 1: Infraestrutura Testcontainers e testes de integração de base (Fase 2)

**Files:**
- Modify: `backend/pom.xml`
- Create: `backend/src/test/java/br/com/perimetro/TestcontainersConfiguration.java`
- Create: `backend/src/test/java/br/com/perimetro/IntegracaoBase.java`
- Modify: `backend/src/test/java/br/com/perimetro/PerimetroBackendApplicationTests.java`
- Create: `backend/src/test/java/br/com/perimetro/integracao/TrechoIntegracaoTest.java`

**Interfaces:**
- Produces: `IntegracaoBase` (classe abstrata, `@SpringBootTest` + `@AutoConfigureMockMvc` + Postgres em container) com campos `protected` `MockMvc mockMvc`, `ObjectMapper objectMapper`, `RegiaoRepository regiaoRepository`, `TrechoRepository trechoRepository`, e `@BeforeEach void limparBanco()`. Tasks seguintes estendem essa base e acrescentam a limpeza de `avaliacao`.

- [ ] **Step 1: Adicionar as dependências de teste**

Em `backend/pom.xml`, dentro de `<dependencies>`, depois da dependência `spring-boot-starter-webmvc-test`, adicionar:
```xml
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-testcontainers</artifactId>
			<scope>test</scope>
		</dependency>
		<dependency>
			<groupId>org.testcontainers</groupId>
			<artifactId>testcontainers-junit-jupiter</artifactId>
			<scope>test</scope>
		</dependency>
		<dependency>
			<groupId>org.testcontainers</groupId>
			<artifactId>testcontainers-postgresql</artifactId>
			<scope>test</scope>
		</dependency>
```

- [ ] **Step 2: Verificar que as dependências resolvem**

Run (em `backend/`): `./mvnw -q dependency:resolve`
Expected: sem erro. Se acusar artefato não encontrado, rodar `./mvnw dependency:tree | grep -i testcontainers` e `./mvnw help:effective-pom | grep -i testcontainers` para ver quais artefatos o BOM do Spring Boot 4.1.1 gerencia, e ajustar os `artifactId` (no Testcontainers 2.x os módulos são `testcontainers-postgresql` e `testcontainers-junit-jupiter`).

- [ ] **Step 3: Criar a configuração do container**

`backend/src/test/java/br/com/perimetro/TestcontainersConfiguration.java`:
```java
package br.com.perimetro;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.postgresql.PostgreSQLContainer;

@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

    // Mesma versão do docker-compose.yml (postgres:17).
    @Bean
    @ServiceConnection
    PostgreSQLContainer postgres() {
        return new PostgreSQLContainer("postgres:17");
    }
}
```

- [ ] **Step 4: Criar a base dos testes de integração**

`backend/src/test/java/br/com/perimetro/IntegracaoBase.java`:
```java
package br.com.perimetro;

import br.com.perimetro.repository.RegiaoRepository;
import br.com.perimetro.repository.TrechoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
public abstract class IntegracaoBase {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected RegiaoRepository regiaoRepository;

    @Autowired
    protected TrechoRepository trechoRepository;

    @BeforeEach
    void limparBanco() {
        trechoRepository.deleteAll();
        regiaoRepository.deleteAll();
    }
}
```
Se `AutoConfigureMockMvc` não for encontrado nesse pacote, procurar a classe no jar `spring-boot-webmvc-test` (`jar tf` ou a IDE) e ajustar o import; o `@WebMvcTest` dos testes existentes vem de `org.springframework.boot.webmvc.test.autoconfigure`.

- [ ] **Step 5: Fazer o teste de contexto usar o container**

Substituir `backend/src/test/java/br/com/perimetro/PerimetroBackendApplicationTests.java` por:
```java
package br.com.perimetro;

import org.junit.jupiter.api.Test;

class PerimetroBackendApplicationTests extends IntegracaoBase {

	@Test
	void contextLoads() {
	}

}
```

- [ ] **Step 6: Escrever os testes de integração de Trecho**

`backend/src/test/java/br/com/perimetro/integracao/TrechoIntegracaoTest.java`:
```java
package br.com.perimetro.integracao;

import br.com.perimetro.IntegracaoBase;
import br.com.perimetro.dto.PontoDto;
import br.com.perimetro.dto.TrechoRequestDto;
import br.com.perimetro.entity.Regiao;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class TrechoIntegracaoTest extends IntegracaoBase {

    private static final List<PontoDto> GEOMETRIA = List.of(
            new PontoDto(-8.0631, -34.8711),
            new PontoDto(-8.0640, -34.8720)
    );

    private String criarTrechoViaApi(Regiao regiao) throws Exception {
        TrechoRequestDto corpo = new TrechoRequestDto(
                "Rua da Aurora", GEOMETRIA, -8.0631, -34.8711, regiao.getId(), null);
        String resposta = mockMvc.perform(post("/api/v1/trechos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(corpo)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(resposta).get("id").asString();
    }

    @Test
    void persisteEDevolveAGeometriaJsonbDoTrecho() throws Exception {
        Regiao regiao = regiaoRepository.save(new Regiao("Recife Antigo"));
        String id = criarTrechoViaApi(regiao);

        mockMvc.perform(get("/api/v1/trechos/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.geometria.length()").value(2))
                .andExpect(jsonPath("$.geometria[1].lat").value(-8.0640))
                .andExpect(jsonPath("$.geometria[1].lng").value(-34.8720))
                .andExpect(jsonPath("$.status").value("ATIVO"));
    }

    @Test
    void naoPermiteRemoverRegiaoComTrechosVinculados() throws Exception {
        Regiao regiao = regiaoRepository.save(new Regiao("Recife Antigo"));
        criarTrechoViaApi(regiao);

        mockMvc.perform(delete("/api/v1/regioes/{id}", regiao.getId()))
                .andExpect(status().isConflict());
    }
}
```

- [ ] **Step 7: Rodar os testes de integração**

Run (com o Docker ativo): `./mvnw test -Dtest='TrechoIntegracaoTest,PerimetroBackendApplicationTests'`
Expected: PASS (3 testes). A primeira execução baixa a imagem `postgres:17`. Se o contêiner não subir, conferir `docker info`. Se `asString()` não existir em `JsonNode` do Jackson 3, usar `.stringValue()` (a API do Jackson 3 renomeou métodos `asText`); o compilador indica qual.

- [ ] **Step 8: Rodar toda a suíte**

Run: `./mvnw test`
Expected: PASS em todos (os 35 anteriores + os novos).

- [ ] **Step 9: Commit**

```bash
git add backend/pom.xml backend/src/test
git commit -m "Adiciona Testcontainers e testes de integracao de Trecho/Regiao"
```
(Terminar a mensagem com a linha de coautoria definida na sessão.)

---

### Task 2: Regra do índice - `Classificacao` e `CalculadoraIndice`

**Files:**
- Create: `backend/src/main/java/br/com/perimetro/entity/Classificacao.java`
- Create: `backend/src/main/java/br/com/perimetro/service/CalculadoraIndice.java`
- Test: `backend/src/test/java/br/com/perimetro/entity/ClassificacaoTest.java`
- Test: `backend/src/test/java/br/com/perimetro/service/CalculadoraIndiceTest.java`

**Interfaces:**
- Produces:
  - `enum Classificacao { RUIM, MEDIO, BOM }` com `static Classificacao de(BigDecimal indice)` (retorna `null` se `indice == null`).
  - `CalculadoraIndice.indice(double calcada, double acessibilidade, double iluminacao, double arborizacao, double travessias, double mobiliario): BigDecimal` (escala 2, `HALF_UP`).

- [ ] **Step 1: Escrever os testes que falham**

`backend/src/test/java/br/com/perimetro/entity/ClassificacaoTest.java`:
```java
package br.com.perimetro.entity;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class ClassificacaoTest {

    @Test
    void indiceNuloNaoTemClassificacao() {
        assertThat(Classificacao.de(null)).isNull();
    }

    @Test
    void zeroERuim() {
        assertThat(Classificacao.de(new BigDecimal("0.00"))).isEqualTo(Classificacao.RUIM);
    }

    @Test
    void abaixoDeQuatroERuim() {
        assertThat(Classificacao.de(new BigDecimal("3.94"))).isEqualTo(Classificacao.RUIM);
    }

    @Test
    void quatroEMedio() {
        assertThat(Classificacao.de(new BigDecimal("4.00"))).isEqualTo(Classificacao.MEDIO);
    }

    @Test
    void valorQueArredondaParaQuatroEMedio() {
        assertThat(Classificacao.de(new BigDecimal("3.95"))).isEqualTo(Classificacao.MEDIO);
    }

    @Test
    void seisVirgulaNoveEMedio() {
        assertThat(Classificacao.de(new BigDecimal("6.94"))).isEqualTo(Classificacao.MEDIO);
    }

    @Test
    void valorQueArredondaParaSeteEBom() {
        assertThat(Classificacao.de(new BigDecimal("6.95"))).isEqualTo(Classificacao.BOM);
    }

    @Test
    void seteEBom() {
        assertThat(Classificacao.de(new BigDecimal("7.00"))).isEqualTo(Classificacao.BOM);
    }

    @Test
    void dezEBom() {
        assertThat(Classificacao.de(new BigDecimal("10.00"))).isEqualTo(Classificacao.BOM);
    }
}
```
`backend/src/test/java/br/com/perimetro/service/CalculadoraIndiceTest.java`:
```java
package br.com.perimetro.service;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class CalculadoraIndiceTest {

    @Test
    void todasAsNotasDezDaoDez() {
        assertThat(CalculadoraIndice.indice(10, 10, 10, 10, 10, 10)).isEqualByComparingTo("10.00");
    }

    @Test
    void todasAsNotasZeroDaoZero() {
        assertThat(CalculadoraIndice.indice(0, 0, 0, 0, 0, 0)).isEqualByComparingTo("0.00");
    }

    @Test
    void aplicaOsPesosDecididos() {
        // 8*0.25 + 6*0.25 + 4*0.15 + 2*0.15 + 0*0.10 + 10*0.10 = 5.40
        assertThat(CalculadoraIndice.indice(8, 6, 4, 2, 0, 10)).isEqualByComparingTo("5.40");
    }

    @Test
    void aceitaMediasFracionarias() {
        // 7.5*0.25 + 7.5*0.25 + 5*0.15 + 5*0.15 + 2.5*0.10 + 2.5*0.10 = 6.00
        assertThat(CalculadoraIndice.indice(7.5, 7.5, 5, 5, 2.5, 2.5)).isEqualByComparingTo("6.00");
    }

    @Test
    void resultadoTemDuasCasasDecimais() {
        BigDecimal resultado = CalculadoraIndice.indice(7, 7, 7, 7, 7, 7);
        assertThat(resultado.scale()).isEqualTo(2);
    }

    @Test
    void osPesosSomamUm() {
        BigDecimal soma = CalculadoraIndice.PESO_CALCADA
                .add(CalculadoraIndice.PESO_ACESSIBILIDADE)
                .add(CalculadoraIndice.PESO_ILUMINACAO)
                .add(CalculadoraIndice.PESO_ARBORIZACAO)
                .add(CalculadoraIndice.PESO_TRAVESSIAS)
                .add(CalculadoraIndice.PESO_MOBILIARIO);
        assertThat(soma).isEqualByComparingTo("1.00");
    }
}
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `./mvnw test -Dtest='ClassificacaoTest,CalculadoraIndiceTest'`
Expected: falha de compilação (classes não existem).

- [ ] **Step 3: Implementar `Classificacao`**

`backend/src/main/java/br/com/perimetro/entity/Classificacao.java`:
```java
package br.com.perimetro.entity;

import java.math.BigDecimal;
import java.math.RoundingMode;

public enum Classificacao {
    RUIM,
    MEDIO,
    BOM;

    private static final BigDecimal LIMITE_MEDIO = new BigDecimal("4.0");
    private static final BigDecimal LIMITE_BOM = new BigDecimal("7.0");

    // A faixa é decidida pelo valor exibido ao usuário (1 casa decimal, HALF_UP).
    public static Classificacao de(BigDecimal indice) {
        if (indice == null) {
            return null;
        }
        BigDecimal exibido = indice.setScale(1, RoundingMode.HALF_UP);
        if (exibido.compareTo(LIMITE_MEDIO) < 0) {
            return RUIM;
        }
        if (exibido.compareTo(LIMITE_BOM) < 0) {
            return MEDIO;
        }
        return BOM;
    }
}
```

- [ ] **Step 4: Implementar `CalculadoraIndice`**

`backend/src/main/java/br/com/perimetro/service/CalculadoraIndice.java`:
```java
package br.com.perimetro.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

// Única fonte dos pesos das 6 dimensões do Índice de Caminhabilidade.
public final class CalculadoraIndice {

    public static final BigDecimal PESO_CALCADA = new BigDecimal("0.25");
    public static final BigDecimal PESO_ACESSIBILIDADE = new BigDecimal("0.25");
    public static final BigDecimal PESO_ILUMINACAO = new BigDecimal("0.15");
    public static final BigDecimal PESO_ARBORIZACAO = new BigDecimal("0.15");
    public static final BigDecimal PESO_TRAVESSIAS = new BigDecimal("0.10");
    public static final BigDecimal PESO_MOBILIARIO = new BigDecimal("0.10");

    private CalculadoraIndice() {
    }

    // Recebe notas (ou médias de notas) de 0 a 10 e devolve o índice com 2 casas decimais.
    public static BigDecimal indice(double calcada, double acessibilidade, double iluminacao,
                                    double arborizacao, double travessias, double mobiliario) {
        return parcela(calcada, PESO_CALCADA)
                .add(parcela(acessibilidade, PESO_ACESSIBILIDADE))
                .add(parcela(iluminacao, PESO_ILUMINACAO))
                .add(parcela(arborizacao, PESO_ARBORIZACAO))
                .add(parcela(travessias, PESO_TRAVESSIAS))
                .add(parcela(mobiliario, PESO_MOBILIARIO))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal parcela(double nota, BigDecimal peso) {
        return BigDecimal.valueOf(nota).multiply(peso);
    }
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `./mvnw test -Dtest='ClassificacaoTest,CalculadoraIndiceTest'`
Expected: PASS (15 testes).

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/br/com/perimetro/entity/Classificacao.java backend/src/main/java/br/com/perimetro/service/CalculadoraIndice.java backend/src/test/java/br/com/perimetro/entity/ClassificacaoTest.java backend/src/test/java/br/com/perimetro/service/CalculadoraIndiceTest.java
git commit -m "Adiciona pesos do indice e faixas de classificacao"
```
(Terminar a mensagem com a linha de coautoria definida na sessão.)

---

### Task 3: Migrations, entidade `Avaliacao` e repositórios

**Files:**
- Create: `backend/src/main/resources/db/migration/V3__cria_tabela_avaliacao.sql`
- Create: `backend/src/main/resources/db/migration/V4__adiciona_total_avaliacoes_ao_trecho.sql`
- Create: `backend/src/main/java/br/com/perimetro/entity/Avaliacao.java`
- Modify: `backend/src/main/java/br/com/perimetro/entity/Trecho.java`
- Create: `backend/src/main/java/br/com/perimetro/repository/AvaliacaoRepository.java`
- Modify: `backend/src/main/java/br/com/perimetro/repository/TrechoRepository.java`
- Modify: `backend/src/test/java/br/com/perimetro/IntegracaoBase.java`
- Test: `backend/src/test/java/br/com/perimetro/integracao/AvaliacaoRepositoryIntegracaoTest.java`

**Interfaces:**
- Consumes: `IntegracaoBase` (Task 1).
- Produces:
  - `Avaliacao(Trecho trecho, int notaCalcada, int notaAcessibilidade, int notaIluminacao, int notaArborizacao, int notaTravessias, int notaMobiliario)`; getters `getId(): UUID`, `getTrecho(): Trecho`, `getNotaCalcada()` ... `getNotaMobiliario(): int`, `getCriadoEm(): Instant`.
  - `Trecho.getTotalAvaliacoes(): int` e `Trecho.registrarIndice(BigDecimal indiceAtual, int totalAvaliacoes): void`.
  - `AvaliacaoRepository extends JpaRepository<Avaliacao, UUID>` com `long countByTrechoId(UUID)` e `MediasPorDimensao mediasPorDimensao(UUID trechoId)`; a interface aninhada `MediasPorDimensao` tem `Double getCalcada()`, `getAcessibilidade()`, `getIluminacao()`, `getArborizacao()`, `getTravessias()`, `getMobiliario()`.
  - `TrechoRepository.buscarParaAtualizacao(UUID id): Optional<Trecho>` (trava `PESSIMISTIC_WRITE`).

- [ ] **Step 1: Criar as migrations**

`V3__cria_tabela_avaliacao.sql`:
```sql
CREATE TABLE avaliacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trecho_id UUID NOT NULL REFERENCES trecho(id) ON DELETE RESTRICT,
    usuario_id UUID,
    nota_calcada SMALLINT NOT NULL CHECK (nota_calcada BETWEEN 0 AND 10),
    nota_acessibilidade SMALLINT NOT NULL CHECK (nota_acessibilidade BETWEEN 0 AND 10),
    nota_iluminacao SMALLINT NOT NULL CHECK (nota_iluminacao BETWEEN 0 AND 10),
    nota_arborizacao SMALLINT NOT NULL CHECK (nota_arborizacao BETWEEN 0 AND 10),
    nota_travessias SMALLINT NOT NULL CHECK (nota_travessias BETWEEN 0 AND 10),
    nota_mobiliario SMALLINT NOT NULL CHECK (nota_mobiliario BETWEEN 0 AND 10),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_avaliacao_trecho_id ON avaliacao(trecho_id);
```
`V4__adiciona_total_avaliacoes_ao_trecho.sql`:
```sql
ALTER TABLE trecho ADD COLUMN total_avaliacoes INTEGER NOT NULL DEFAULT 0;
```
Antes de criar, conferir com `ls backend/src/main/resources/db/migration` que V2 é a última; se existir outra, renumerar mantendo a ordem.

- [ ] **Step 2: Criar a entidade `Avaliacao`**

`backend/src/main/java/br/com/perimetro/entity/Avaliacao.java`:
```java
package br.com.perimetro.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "avaliacao")
public class Avaliacao {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trecho_id", nullable = false)
    private Trecho trecho;

    // Nulo até a Sprint 04 (autenticação); a FK para usuario é criada lá.
    @Column(name = "usuario_id")
    private UUID usuarioId;

    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(name = "nota_calcada", nullable = false)
    private int notaCalcada;

    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(name = "nota_acessibilidade", nullable = false)
    private int notaAcessibilidade;

    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(name = "nota_iluminacao", nullable = false)
    private int notaIluminacao;

    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(name = "nota_arborizacao", nullable = false)
    private int notaArborizacao;

    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(name = "nota_travessias", nullable = false)
    private int notaTravessias;

    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(name = "nota_mobiliario", nullable = false)
    private int notaMobiliario;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant criadoEm;

    protected Avaliacao() {
    }

    public Avaliacao(Trecho trecho, int notaCalcada, int notaAcessibilidade, int notaIluminacao,
                     int notaArborizacao, int notaTravessias, int notaMobiliario) {
        this.trecho = trecho;
        this.notaCalcada = notaCalcada;
        this.notaAcessibilidade = notaAcessibilidade;
        this.notaIluminacao = notaIluminacao;
        this.notaArborizacao = notaArborizacao;
        this.notaTravessias = notaTravessias;
        this.notaMobiliario = notaMobiliario;
        this.criadoEm = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public Trecho getTrecho() {
        return trecho;
    }

    public int getNotaCalcada() {
        return notaCalcada;
    }

    public int getNotaAcessibilidade() {
        return notaAcessibilidade;
    }

    public int getNotaIluminacao() {
        return notaIluminacao;
    }

    public int getNotaArborizacao() {
        return notaArborizacao;
    }

    public int getNotaTravessias() {
        return notaTravessias;
    }

    public int getNotaMobiliario() {
        return notaMobiliario;
    }

    public Instant getCriadoEm() {
        return criadoEm;
    }
}
```

- [ ] **Step 3: Estender a entidade `Trecho`**

Em `backend/src/main/java/br/com/perimetro/entity/Trecho.java`, depois do campo `indiceAtual`, adicionar:
```java
    @Column(name = "total_avaliacoes", nullable = false)
    private int totalAvaliacoes;
```
Depois do método `getIndiceAtual()`, adicionar:
```java
    public int getTotalAvaliacoes() {
        return totalAvaliacoes;
    }

    // Único ponto de escrita do índice: chamado pelo AvaliacaoService após recalcular.
    public void registrarIndice(BigDecimal indiceAtual, int totalAvaliacoes) {
        this.indiceAtual = indiceAtual;
        this.totalAvaliacoes = totalAvaliacoes;
    }
```

- [ ] **Step 4: Criar os repositórios**

`backend/src/main/java/br/com/perimetro/repository/AvaliacaoRepository.java`:
```java
package br.com.perimetro.repository;

import br.com.perimetro.entity.Avaliacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface AvaliacaoRepository extends JpaRepository<Avaliacao, UUID> {

    long countByTrechoId(UUID trechoId);

    @Query("""
            select avg(a.notaCalcada) as calcada,
                   avg(a.notaAcessibilidade) as acessibilidade,
                   avg(a.notaIluminacao) as iluminacao,
                   avg(a.notaArborizacao) as arborizacao,
                   avg(a.notaTravessias) as travessias,
                   avg(a.notaMobiliario) as mobiliario
            from Avaliacao a
            where a.trecho.id = :trechoId
            """)
    MediasPorDimensao mediasPorDimensao(@Param("trechoId") UUID trechoId);

    interface MediasPorDimensao {
        Double getCalcada();

        Double getAcessibilidade();

        Double getIluminacao();

        Double getArborizacao();

        Double getTravessias();

        Double getMobiliario();
    }
}
```
Substituir `backend/src/main/java/br/com/perimetro/repository/TrechoRepository.java` por:
```java
package br.com.perimetro.repository;

import br.com.perimetro.entity.Trecho;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TrechoRepository extends JpaRepository<Trecho, UUID> {

    List<Trecho> findByRegiaoId(UUID regiaoId);

    // Trava a linha do trecho até o fim da transação, para que duas avaliações
    // simultâneas não se atropelem ao recalcular o índice.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Trecho t where t.id = :id")
    Optional<Trecho> buscarParaAtualizacao(@Param("id") UUID id);
}
```

- [ ] **Step 5: Atualizar a limpeza da base de integração**

Em `backend/src/test/java/br/com/perimetro/IntegracaoBase.java`, importar `br.com.perimetro.repository.AvaliacaoRepository`, adicionar o campo:
```java
    @Autowired
    protected AvaliacaoRepository avaliacaoRepository;
```
e trocar o corpo de `limparBanco()` por:
```java
        avaliacaoRepository.deleteAll();
        trechoRepository.deleteAll();
        regiaoRepository.deleteAll();
```

- [ ] **Step 6: Escrever o teste de integração do repositório (falha primeiro)**

`backend/src/test/java/br/com/perimetro/integracao/AvaliacaoRepositoryIntegracaoTest.java`:
```java
package br.com.perimetro.integracao;

import br.com.perimetro.IntegracaoBase;
import br.com.perimetro.dto.PontoDto;
import br.com.perimetro.entity.AtivoInativo;
import br.com.perimetro.entity.Avaliacao;
import br.com.perimetro.entity.Regiao;
import br.com.perimetro.entity.Trecho;
import br.com.perimetro.repository.AvaliacaoRepository.MediasPorDimensao;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AvaliacaoRepositoryIntegracaoTest extends IntegracaoBase {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private Trecho novoTrecho() {
        Regiao regiao = regiaoRepository.save(new Regiao("Recife Antigo"));
        return trechoRepository.save(new Trecho(
                "Rua da Aurora", List.of(new PontoDto(-8.06, -34.87)), -8.06, -34.87, AtivoInativo.ATIVO, regiao));
    }

    @Test
    void calculaAsMediasPorDimensaoNoBanco() {
        Trecho trecho = novoTrecho();
        avaliacaoRepository.save(new Avaliacao(trecho, 10, 8, 6, 4, 2, 0));
        avaliacaoRepository.save(new Avaliacao(trecho, 6, 4, 2, 0, 10, 8));

        MediasPorDimensao medias = avaliacaoRepository.mediasPorDimensao(trecho.getId());

        assertThat(medias.getCalcada()).isEqualTo(8.0);
        assertThat(medias.getAcessibilidade()).isEqualTo(6.0);
        assertThat(medias.getIluminacao()).isEqualTo(4.0);
        assertThat(medias.getArborizacao()).isEqualTo(2.0);
        assertThat(medias.getTravessias()).isEqualTo(6.0);
        assertThat(medias.getMobiliario()).isEqualTo(4.0);
        assertThat(avaliacaoRepository.countByTrechoId(trecho.getId())).isEqualTo(2);
    }

    @Test
    void persisteAvaliacaoAnonima() {
        Trecho trecho = novoTrecho();
        Avaliacao salva = avaliacaoRepository.save(new Avaliacao(trecho, 5, 5, 5, 5, 5, 5));

        Integer semUsuario = jdbcTemplate.queryForObject(
                "select count(*) from avaliacao where id = ? and usuario_id is null", Integer.class, salva.getId());
        assertThat(semUsuario).isEqualTo(1);
    }

    @Test
    void bancoRejeitaNotaForaDeZeroADez() {
        Trecho trecho = novoTrecho();

        assertThatThrownBy(() -> avaliacaoRepository.saveAndFlush(new Avaliacao(trecho, 11, 5, 5, 5, 5, 5)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void trechoComAvaliacoesNaoPodeSerRemovido() {
        Trecho trecho = novoTrecho();
        avaliacaoRepository.save(new Avaliacao(trecho, 5, 5, 5, 5, 5, 5));

        assertThatThrownBy(() -> trechoRepository.deleteById(trecho.getId()))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
```

- [ ] **Step 7: Rodar os testes**

Run: `./mvnw test -Dtest='AvaliacaoRepositoryIntegracaoTest,TrechoIntegracaoTest,PerimetroBackendApplicationTests'`
Expected: PASS. Pontos de atenção se falhar:
- `Schema-validation: wrong column type ... nota_calcada` -> trocar nos campos `int` da entidade por `short` com `@Column` (mantendo construtor com `int` e convertendo com `(short)`), e os getters passam a devolver `short`/`int` conforme necessário.
- `Schema-validation` em `criado_em` -> garantir `Instant` (não `LocalDateTime`).
- Se `deleteById` não lançar por causa de flush adiado, trocar a asserção por `trechoRepository.deleteById(...)` seguido de `trechoRepository.flush()` dentro do lambda.

- [ ] **Step 8: Suíte completa**

Run: `./mvnw test`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add backend/src
git commit -m "Adiciona tabela e entidade de avaliacao, total_avaliacoes e repositorios"
```
(Terminar a mensagem com a linha de coautoria definida na sessão.)

---

### Task 4: DTOs, serviço, controller e erros de Avaliação

**Files:**
- Modify: `backend/src/main/java/br/com/perimetro/dto/TrechoResponseDto.java`
- Modify: `backend/src/main/java/br/com/perimetro/service/TrechoService.java`
- Create: `backend/src/main/java/br/com/perimetro/dto/AvaliacaoRequestDto.java`
- Create: `backend/src/main/java/br/com/perimetro/dto/AvaliacaoResponseDto.java`
- Create: `backend/src/main/java/br/com/perimetro/exception/TrechoInativoException.java`
- Modify: `backend/src/main/java/br/com/perimetro/exception/GlobalExceptionHandler.java`
- Create: `backend/src/main/java/br/com/perimetro/service/AvaliacaoService.java`
- Create: `backend/src/main/java/br/com/perimetro/controller/AvaliacaoController.java`
- Modify: `backend/src/main/resources/application.yml`
- Modify: `backend/src/test/java/br/com/perimetro/controller/TrechoControllerTest.java`
- Test: `backend/src/test/java/br/com/perimetro/service/AvaliacaoServiceTest.java`
- Test: `backend/src/test/java/br/com/perimetro/controller/AvaliacaoControllerTest.java`
- Test: `backend/src/test/java/br/com/perimetro/integracao/AvaliacaoIntegracaoTest.java`

**Interfaces:**
- Consumes: `Avaliacao`, `Trecho.registrarIndice`, `Trecho.getTotalAvaliacoes`, `AvaliacaoRepository`, `TrechoRepository.buscarParaAtualizacao`, `CalculadoraIndice.indice(...)`, `Classificacao.de(...)`, `IntegracaoBase`.
- Produces:
  - `TrechoResponseDto` com construtor de 10 argumentos `(UUID id, String nome, List<PontoDto> geometria, double latitude, double longitude, BigDecimal indiceAtual, AtivoInativo status, UUID regiaoId, int totalAvaliacoes, Classificacao classificacao)`, getters `getTotalAvaliacoes(): int` e `getClassificacao(): Classificacao`, e `static TrechoResponseDto de(Trecho trecho)`.
  - `AvaliacaoRequestDto(Integer notaCalcada, Integer notaAcessibilidade, Integer notaIluminacao, Integer notaArborizacao, Integer notaTravessias, Integer notaMobiliario)` com getters de mesmo nome (`getNotaCalcada()` ...).
  - `AvaliacaoResponseDto` com `getId(): UUID`, `getCriadoEm(): Instant`, `getNotaCalcada()` ... `getNotaMobiliario(): int`, `getTrecho(): TrechoResponseDto`.
  - `AvaliacaoService.criar(UUID trechoId, AvaliacaoRequestDto dto): AvaliacaoResponseDto`.
  - `TrechoInativoException(String mensagem)`, tratada como `409`.
  - Endpoint `POST /api/v1/trechos/{trechoId}/avaliacoes` -> `201`.

- [ ] **Step 1: Estender `TrechoResponseDto`**

Em `backend/src/main/java/br/com/perimetro/dto/TrechoResponseDto.java`:
- Adicionar imports `br.com.perimetro.entity.Classificacao` e `br.com.perimetro.entity.Trecho`.
- Adicionar os campos:
```java
    private final int totalAvaliacoes;
    private final Classificacao classificacao;
```
- Trocar o construtor por:
```java
    public TrechoResponseDto(UUID id, String nome, List<PontoDto> geometria, double latitude, double longitude,
                              BigDecimal indiceAtual, AtivoInativo status, UUID regiaoId,
                              int totalAvaliacoes, Classificacao classificacao) {
        this.id = id;
        this.nome = nome;
        this.geometria = geometria;
        this.latitude = latitude;
        this.longitude = longitude;
        this.indiceAtual = indiceAtual;
        this.status = status;
        this.regiaoId = regiaoId;
        this.totalAvaliacoes = totalAvaliacoes;
        this.classificacao = classificacao;
    }

    public static TrechoResponseDto de(Trecho trecho) {
        return new TrechoResponseDto(
                trecho.getId(),
                trecho.getNome(),
                trecho.getGeometria(),
                trecho.getLatitude(),
                trecho.getLongitude(),
                trecho.getIndiceAtual(),
                trecho.getStatus(),
                trecho.getRegiao().getId(),
                trecho.getTotalAvaliacoes(),
                Classificacao.de(trecho.getIndiceAtual())
        );
    }
```
- Adicionar os getters:
```java
    public int getTotalAvaliacoes() {
        return totalAvaliacoes;
    }

    public Classificacao getClassificacao() {
        return classificacao;
    }
```

- [ ] **Step 2: Fazer o `TrechoService` usar a fábrica**

Em `TrechoService.java`, substituir o corpo do método privado `paraDto` por `return TrechoResponseDto.de(trecho);`.

- [ ] **Step 3: Corrigir os testes existentes que usam o construtor antigo**

Run: `grep -rn "new TrechoResponseDto" backend/src/test`
Em cada ocorrência (em `TrechoControllerTest`), acrescentar `, 0, null` antes do `)` final. Exemplo: `new TrechoResponseDto(id, "Rua das Flores", GEOMETRIA_EXEMPLO, -23.55, -46.63, null, AtivoInativo.ATIVO, regiaoId, 0, null)`.
Run: `./mvnw test -Dtest='TrechoControllerTest,TrechoServiceTest'`
Expected: PASS.

- [ ] **Step 4: Criar os DTOs de Avaliação**

`backend/src/main/java/br/com/perimetro/dto/AvaliacaoRequestDto.java`:
```java
package br.com.perimetro.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class AvaliacaoRequestDto {

    @NotNull(message = "é obrigatória")
    @Min(value = 0, message = "deve estar entre 0 e 10")
    @Max(value = 10, message = "deve estar entre 0 e 10")
    private final Integer notaCalcada;

    @NotNull(message = "é obrigatória")
    @Min(value = 0, message = "deve estar entre 0 e 10")
    @Max(value = 10, message = "deve estar entre 0 e 10")
    private final Integer notaAcessibilidade;

    @NotNull(message = "é obrigatória")
    @Min(value = 0, message = "deve estar entre 0 e 10")
    @Max(value = 10, message = "deve estar entre 0 e 10")
    private final Integer notaIluminacao;

    @NotNull(message = "é obrigatória")
    @Min(value = 0, message = "deve estar entre 0 e 10")
    @Max(value = 10, message = "deve estar entre 0 e 10")
    private final Integer notaArborizacao;

    @NotNull(message = "é obrigatória")
    @Min(value = 0, message = "deve estar entre 0 e 10")
    @Max(value = 10, message = "deve estar entre 0 e 10")
    private final Integer notaTravessias;

    @NotNull(message = "é obrigatória")
    @Min(value = 0, message = "deve estar entre 0 e 10")
    @Max(value = 10, message = "deve estar entre 0 e 10")
    private final Integer notaMobiliario;

    public AvaliacaoRequestDto(Integer notaCalcada, Integer notaAcessibilidade, Integer notaIluminacao,
                                Integer notaArborizacao, Integer notaTravessias, Integer notaMobiliario) {
        this.notaCalcada = notaCalcada;
        this.notaAcessibilidade = notaAcessibilidade;
        this.notaIluminacao = notaIluminacao;
        this.notaArborizacao = notaArborizacao;
        this.notaTravessias = notaTravessias;
        this.notaMobiliario = notaMobiliario;
    }

    public Integer getNotaCalcada() {
        return notaCalcada;
    }

    public Integer getNotaAcessibilidade() {
        return notaAcessibilidade;
    }

    public Integer getNotaIluminacao() {
        return notaIluminacao;
    }

    public Integer getNotaArborizacao() {
        return notaArborizacao;
    }

    public Integer getNotaTravessias() {
        return notaTravessias;
    }

    public Integer getNotaMobiliario() {
        return notaMobiliario;
    }
}
```
`backend/src/main/java/br/com/perimetro/dto/AvaliacaoResponseDto.java`:
```java
package br.com.perimetro.dto;

import br.com.perimetro.entity.Avaliacao;

import java.time.Instant;
import java.util.UUID;

public class AvaliacaoResponseDto {

    private final UUID id;
    private final Instant criadoEm;
    private final int notaCalcada;
    private final int notaAcessibilidade;
    private final int notaIluminacao;
    private final int notaArborizacao;
    private final int notaTravessias;
    private final int notaMobiliario;
    private final TrechoResponseDto trecho;

    public AvaliacaoResponseDto(Avaliacao avaliacao, TrechoResponseDto trecho) {
        this.id = avaliacao.getId();
        this.criadoEm = avaliacao.getCriadoEm();
        this.notaCalcada = avaliacao.getNotaCalcada();
        this.notaAcessibilidade = avaliacao.getNotaAcessibilidade();
        this.notaIluminacao = avaliacao.getNotaIluminacao();
        this.notaArborizacao = avaliacao.getNotaArborizacao();
        this.notaTravessias = avaliacao.getNotaTravessias();
        this.notaMobiliario = avaliacao.getNotaMobiliario();
        this.trecho = trecho;
    }

    public UUID getId() {
        return id;
    }

    public Instant getCriadoEm() {
        return criadoEm;
    }

    public int getNotaCalcada() {
        return notaCalcada;
    }

    public int getNotaAcessibilidade() {
        return notaAcessibilidade;
    }

    public int getNotaIluminacao() {
        return notaIluminacao;
    }

    public int getNotaArborizacao() {
        return notaArborizacao;
    }

    public int getNotaTravessias() {
        return notaTravessias;
    }

    public int getNotaMobiliario() {
        return notaMobiliario;
    }

    public TrechoResponseDto getTrecho() {
        return trecho;
    }
}
```

- [ ] **Step 5: Criar a exceção e o handler `409`**

`backend/src/main/java/br/com/perimetro/exception/TrechoInativoException.java`:
```java
package br.com.perimetro.exception;

public class TrechoInativoException extends RuntimeException {

    public TrechoInativoException(String mensagem) {
        super(mensagem);
    }
}
```
Em `GlobalExceptionHandler.java`, logo depois do handler de `TrechoNaoEncontradoException`, adicionar:
```java
    @ExceptionHandler(TrechoInativoException.class)
    public ResponseEntity<ErroResponseDto> tratarTrechoInativo(TrechoInativoException excecao) {
        ErroResponseDto corpo = new ErroResponseDto(excecao.getMessage(), LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(corpo);
    }
```

- [ ] **Step 6: Escrever o teste unitário do serviço (falha primeiro)**

`backend/src/test/java/br/com/perimetro/service/AvaliacaoServiceTest.java`:
```java
package br.com.perimetro.service;

import br.com.perimetro.dto.AvaliacaoRequestDto;
import br.com.perimetro.dto.AvaliacaoResponseDto;
import br.com.perimetro.dto.PontoDto;
import br.com.perimetro.entity.AtivoInativo;
import br.com.perimetro.entity.Avaliacao;
import br.com.perimetro.entity.Classificacao;
import br.com.perimetro.entity.Regiao;
import br.com.perimetro.entity.Trecho;
import br.com.perimetro.exception.TrechoInativoException;
import br.com.perimetro.exception.TrechoNaoEncontradoException;
import br.com.perimetro.repository.AvaliacaoRepository;
import br.com.perimetro.repository.AvaliacaoRepository.MediasPorDimensao;
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

class AvaliacaoServiceTest {

    private static final List<PontoDto> GEOMETRIA = List.of(new PontoDto(-8.06, -34.87));

    private static Trecho trecho(AtivoInativo status) {
        return new Trecho("Rua da Aurora", GEOMETRIA, -8.06, -34.87, status, new Regiao("Centro"));
    }

    private static AvaliacaoRequestDto notas(int valor) {
        return new AvaliacaoRequestDto(valor, valor, valor, valor, valor, valor);
    }

    @Test
    void lancaExcecaoQuandoOTrechoNaoExiste() {
        UUID trechoId = UUID.randomUUID();
        TrechoRepository trechoRepository = mock(TrechoRepository.class);
        AvaliacaoRepository avaliacaoRepository = mock(AvaliacaoRepository.class);
        when(trechoRepository.buscarParaAtualizacao(trechoId)).thenReturn(Optional.empty());
        AvaliacaoService service = new AvaliacaoService(avaliacaoRepository, trechoRepository);

        assertThatThrownBy(() -> service.criar(trechoId, notas(5)))
                .isInstanceOf(TrechoNaoEncontradoException.class);
    }

    @Test
    void recusaAvaliarTrechoInativo() {
        UUID trechoId = UUID.randomUUID();
        TrechoRepository trechoRepository = mock(TrechoRepository.class);
        AvaliacaoRepository avaliacaoRepository = mock(AvaliacaoRepository.class);
        when(trechoRepository.buscarParaAtualizacao(trechoId)).thenReturn(Optional.of(trecho(AtivoInativo.INATIVO)));
        AvaliacaoService service = new AvaliacaoService(avaliacaoRepository, trechoRepository);

        assertThatThrownBy(() -> service.criar(trechoId, notas(5)))
                .isInstanceOf(TrechoInativoException.class);
        verify(avaliacaoRepository, never()).save(any());
    }

    @Test
    void gravaAAvaliacaoERecalculaOIndiceDoTrecho() {
        UUID trechoId = UUID.randomUUID();
        Trecho trecho = trecho(AtivoInativo.ATIVO);
        TrechoRepository trechoRepository = mock(TrechoRepository.class);
        AvaliacaoRepository avaliacaoRepository = mock(AvaliacaoRepository.class);
        MediasPorDimensao medias = mock(MediasPorDimensao.class);
        when(medias.getCalcada()).thenReturn(8.0);
        when(medias.getAcessibilidade()).thenReturn(6.0);
        when(medias.getIluminacao()).thenReturn(4.0);
        when(medias.getArborizacao()).thenReturn(2.0);
        when(medias.getTravessias()).thenReturn(0.0);
        when(medias.getMobiliario()).thenReturn(10.0);
        when(trechoRepository.buscarParaAtualizacao(trechoId)).thenReturn(Optional.of(trecho));
        when(avaliacaoRepository.save(any(Avaliacao.class))).thenAnswer(chamada -> chamada.getArgument(0));
        when(avaliacaoRepository.mediasPorDimensao(trechoId)).thenReturn(medias);
        when(avaliacaoRepository.countByTrechoId(trechoId)).thenReturn(3L);
        AvaliacaoService service = new AvaliacaoService(avaliacaoRepository, trechoRepository);

        AvaliacaoResponseDto resposta = service.criar(trechoId, notas(5));

        assertThat(resposta.getTrecho().getIndiceAtual()).isEqualByComparingTo("5.40");
        assertThat(resposta.getTrecho().getTotalAvaliacoes()).isEqualTo(3);
        assertThat(resposta.getTrecho().getClassificacao()).isEqualTo(Classificacao.MEDIO);
        assertThat(resposta.getNotaCalcada()).isEqualTo(5);
        verify(trechoRepository).save(trecho);
    }
}
```

- [ ] **Step 7: Rodar e ver falhar**

Run: `./mvnw test -Dtest=AvaliacaoServiceTest`
Expected: falha de compilação (`AvaliacaoService` não existe).

- [ ] **Step 8: Implementar `AvaliacaoService`**

`backend/src/main/java/br/com/perimetro/service/AvaliacaoService.java`:
```java
package br.com.perimetro.service;

import br.com.perimetro.dto.AvaliacaoRequestDto;
import br.com.perimetro.dto.AvaliacaoResponseDto;
import br.com.perimetro.dto.TrechoResponseDto;
import br.com.perimetro.entity.AtivoInativo;
import br.com.perimetro.entity.Avaliacao;
import br.com.perimetro.entity.Trecho;
import br.com.perimetro.exception.TrechoInativoException;
import br.com.perimetro.exception.TrechoNaoEncontradoException;
import br.com.perimetro.repository.AvaliacaoRepository;
import br.com.perimetro.repository.AvaliacaoRepository.MediasPorDimensao;
import br.com.perimetro.repository.TrechoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class AvaliacaoService {

    private final AvaliacaoRepository avaliacaoRepository;
    private final TrechoRepository trechoRepository;

    public AvaliacaoService(AvaliacaoRepository avaliacaoRepository, TrechoRepository trechoRepository) {
        this.avaliacaoRepository = avaliacaoRepository;
        this.trechoRepository = trechoRepository;
    }

    @Transactional
    public AvaliacaoResponseDto criar(UUID trechoId, AvaliacaoRequestDto dto) {
        Trecho trecho = trechoRepository.buscarParaAtualizacao(trechoId)
                .orElseThrow(() -> new TrechoNaoEncontradoException("Trecho não encontrado: " + trechoId));
        if (trecho.getStatus() == AtivoInativo.INATIVO) {
            throw new TrechoInativoException("Trecho inativo não pode ser avaliado: " + trechoId);
        }

        Avaliacao avaliacao = avaliacaoRepository.save(new Avaliacao(
                trecho,
                dto.getNotaCalcada(),
                dto.getNotaAcessibilidade(),
                dto.getNotaIluminacao(),
                dto.getNotaArborizacao(),
                dto.getNotaTravessias(),
                dto.getNotaMobiliario()));

        // Recalcula a partir de todas as avaliações (idempotente), com o trecho travado.
        MediasPorDimensao medias = avaliacaoRepository.mediasPorDimensao(trechoId);
        BigDecimal indice = CalculadoraIndice.indice(
                medias.getCalcada(),
                medias.getAcessibilidade(),
                medias.getIluminacao(),
                medias.getArborizacao(),
                medias.getTravessias(),
                medias.getMobiliario());
        int total = (int) avaliacaoRepository.countByTrechoId(trechoId);
        trecho.registrarIndice(indice, total);
        trechoRepository.save(trecho);

        return new AvaliacaoResponseDto(avaliacao, TrechoResponseDto.de(trecho));
    }
}
```

- [ ] **Step 9: Rodar e ver passar**

Run: `./mvnw test -Dtest=AvaliacaoServiceTest`
Expected: PASS (3 testes).

- [ ] **Step 10: Escrever o teste do controller (falha primeiro)**

`backend/src/test/java/br/com/perimetro/controller/AvaliacaoControllerTest.java`:
```java
package br.com.perimetro.controller;

import br.com.perimetro.dto.AvaliacaoRequestDto;
import br.com.perimetro.dto.AvaliacaoResponseDto;
import br.com.perimetro.dto.PontoDto;
import br.com.perimetro.dto.TrechoResponseDto;
import br.com.perimetro.entity.AtivoInativo;
import br.com.perimetro.entity.Avaliacao;
import br.com.perimetro.entity.Classificacao;
import br.com.perimetro.entity.Regiao;
import br.com.perimetro.entity.Trecho;
import br.com.perimetro.exception.TrechoInativoException;
import br.com.perimetro.exception.TrechoNaoEncontradoException;
import br.com.perimetro.service.AvaliacaoService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AvaliacaoController.class)
class AvaliacaoControllerTest {

    private static final String URL = "/api/v1/trechos/{trechoId}/avaliacoes";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AvaliacaoService avaliacaoService;

    private static String json(Object calcada) {
        return "{\"notaCalcada\":" + calcada
                + ",\"notaAcessibilidade\":5,\"notaIluminacao\":5,\"notaArborizacao\":5"
                + ",\"notaTravessias\":5,\"notaMobiliario\":5}";
    }

    @Test
    void criaAvaliacaoValida() throws Exception {
        UUID trechoId = UUID.randomUUID();
        Trecho trecho = new Trecho("Rua da Aurora", List.of(new PontoDto(-8.06, -34.87)), -8.06, -34.87,
                AtivoInativo.ATIVO, new Regiao("Centro"));
        Avaliacao avaliacao = new Avaliacao(trecho, 5, 5, 5, 5, 5, 5);
        TrechoResponseDto trechoDto = new TrechoResponseDto(trechoId, "Rua da Aurora",
                List.of(new PontoDto(-8.06, -34.87)), -8.06, -34.87, new BigDecimal("5.00"),
                AtivoInativo.ATIVO, UUID.randomUUID(), 1, Classificacao.MEDIO);
        when(avaliacaoService.criar(eq(trechoId), any(AvaliacaoRequestDto.class)))
                .thenReturn(new AvaliacaoResponseDto(avaliacao, trechoDto));

        mockMvc.perform(post(URL, trechoId).contentType(MediaType.APPLICATION_JSON).content(json(5)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.notaCalcada").value(5))
                .andExpect(jsonPath("$.trecho.indiceAtual").value(5.00))
                .andExpect(jsonPath("$.trecho.totalAvaliacoes").value(1))
                .andExpect(jsonPath("$.trecho.classificacao").value("MEDIO"));
    }

    @Test
    void rejeitaNotaMaiorQueDez() throws Exception {
        mockMvc.perform(post(URL, UUID.randomUUID()).contentType(MediaType.APPLICATION_JSON).content(json(11)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejeitaNotaNegativa() throws Exception {
        mockMvc.perform(post(URL, UUID.randomUUID()).contentType(MediaType.APPLICATION_JSON).content(json(-1)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejeitaNotaAusente() throws Exception {
        String semNota = "{\"notaAcessibilidade\":5,\"notaIluminacao\":5,\"notaArborizacao\":5"
                + ",\"notaTravessias\":5,\"notaMobiliario\":5}";

        mockMvc.perform(post(URL, UUID.randomUUID()).contentType(MediaType.APPLICATION_JSON).content(semNota))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejeitaNotaNaoInteira() throws Exception {
        mockMvc.perform(post(URL, UUID.randomUUID()).contentType(MediaType.APPLICATION_JSON).content(json("7.5")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void retorna404QuandoOTrechoNaoExiste() throws Exception {
        UUID trechoId = UUID.randomUUID();
        when(avaliacaoService.criar(eq(trechoId), any(AvaliacaoRequestDto.class)))
                .thenThrow(new TrechoNaoEncontradoException("Trecho não encontrado: " + trechoId));

        mockMvc.perform(post(URL, trechoId).contentType(MediaType.APPLICATION_JSON).content(json(5)))
                .andExpect(status().isNotFound());
    }

    @Test
    void retorna409QuandoOTrechoEstaInativo() throws Exception {
        UUID trechoId = UUID.randomUUID();
        when(avaliacaoService.criar(eq(trechoId), any(AvaliacaoRequestDto.class)))
                .thenThrow(new TrechoInativoException("Trecho inativo não pode ser avaliado: " + trechoId));

        mockMvc.perform(post(URL, trechoId).contentType(MediaType.APPLICATION_JSON).content(json(5)))
                .andExpect(status().isConflict());
    }
}
```

- [ ] **Step 11: Rodar e ver falhar**

Run: `./mvnw test -Dtest=AvaliacaoControllerTest`
Expected: falha de compilação (`AvaliacaoController` não existe).

- [ ] **Step 12: Implementar `AvaliacaoController`**

`backend/src/main/java/br/com/perimetro/controller/AvaliacaoController.java`:
```java
package br.com.perimetro.controller;

import br.com.perimetro.dto.AvaliacaoRequestDto;
import br.com.perimetro.dto.AvaliacaoResponseDto;
import br.com.perimetro.service.AvaliacaoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/trechos/{trechoId}/avaliacoes")
public class AvaliacaoController {

    private final AvaliacaoService avaliacaoService;

    public AvaliacaoController(AvaliacaoService avaliacaoService) {
        this.avaliacaoService = avaliacaoService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AvaliacaoResponseDto criar(@PathVariable UUID trechoId, @Valid @RequestBody AvaliacaoRequestDto dto) {
        return avaliacaoService.criar(trechoId, dto);
    }
}
```

- [ ] **Step 13: Rodar o teste do controller**

Run: `./mvnw test -Dtest=AvaliacaoControllerTest`
Expected: PASS em tudo, **exceto possivelmente** `rejeitaNotaNaoInteira`: por padrão o Jackson aceita `7.5` num `Integer` e trunca para `7` (resposta `201` em vez de `400`). Se esse teste falhar assim, adicionar em `backend/src/main/resources/application.yml`, dentro do bloco `spring:` existente (junto de `jpa:` e `flyway:`):
```yaml
  jackson:
    deserialization:
      accept-float-as-int: false
```
e rodar de novo; deve passar. (`DeserializationFeature.ACCEPT_FLOAT_AS_INT` existe no Jackson 3 do projeto.) Se a aplicação não subir por propriedade desconhecida, conferir o nome do enum com `javap -cp <jackson-databind 3.x.jar> tools.jackson.databind.DeserializationFeature`.

- [ ] **Step 14: Escrever o teste de integração ponta a ponta (Postgres real)**

`backend/src/test/java/br/com/perimetro/integracao/AvaliacaoIntegracaoTest.java`:
```java
package br.com.perimetro.integracao;

import br.com.perimetro.IntegracaoBase;
import br.com.perimetro.dto.PontoDto;
import br.com.perimetro.entity.AtivoInativo;
import br.com.perimetro.entity.Regiao;
import br.com.perimetro.entity.Trecho;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AvaliacaoIntegracaoTest extends IntegracaoBase {

    private static final String URL = "/api/v1/trechos/{id}/avaliacoes";

    private Trecho novoTrecho(AtivoInativo status) {
        Regiao regiao = regiaoRepository.save(new Regiao("Recife Antigo"));
        return trechoRepository.save(new Trecho(
                "Rua da Aurora", List.of(new PontoDto(-8.06, -34.87)), -8.06, -34.87, status, regiao));
    }

    private static String corpo(int calcada, int acessibilidade, int iluminacao,
                                int arborizacao, int travessias, int mobiliario) {
        return "{\"notaCalcada\":" + calcada + ",\"notaAcessibilidade\":" + acessibilidade
                + ",\"notaIluminacao\":" + iluminacao + ",\"notaArborizacao\":" + arborizacao
                + ",\"notaTravessias\":" + travessias + ",\"notaMobiliario\":" + mobiliario + "}";
    }

    @Test
    void primeiraAvaliacaoDefineOIndiceDoTrecho() throws Exception {
        Trecho trecho = novoTrecho(AtivoInativo.ATIVO);

        mockMvc.perform(post(URL, trecho.getId()).contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(8, 6, 4, 2, 0, 10)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.trecho.indiceAtual").value(5.4))
                .andExpect(jsonPath("$.trecho.totalAvaliacoes").value(1))
                .andExpect(jsonPath("$.trecho.classificacao").value("MEDIO"));

        mockMvc.perform(get("/api/v1/trechos/{id}", trecho.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.indiceAtual").value(5.4))
                .andExpect(jsonPath("$.totalAvaliacoes").value(1));
    }

    @Test
    void segundaAvaliacaoMudaOIndiceParaAMedia() throws Exception {
        Trecho trecho = novoTrecho(AtivoInativo.ATIVO);
        mockMvc.perform(post(URL, trecho.getId()).contentType(MediaType.APPLICATION_JSON)
                .content(corpo(10, 10, 10, 10, 10, 10))).andExpect(status().isCreated());

        mockMvc.perform(post(URL, trecho.getId()).contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(2, 2, 2, 2, 2, 2)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.trecho.indiceAtual").value(6.0))
                .andExpect(jsonPath("$.trecho.totalAvaliacoes").value(2))
                .andExpect(jsonPath("$.trecho.classificacao").value("MEDIO"));
    }

    @Test
    void trechoBemAvaliadoViraBom() throws Exception {
        Trecho trecho = novoTrecho(AtivoInativo.ATIVO);

        mockMvc.perform(post(URL, trecho.getId()).contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(9, 9, 9, 9, 9, 9)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.trecho.classificacao").value("BOM"));
    }

    @Test
    void trechoSemAvaliacaoNaoTemClassificacao() throws Exception {
        Trecho trecho = novoTrecho(AtivoInativo.ATIVO);

        mockMvc.perform(get("/api/v1/trechos/{id}", trecho.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.indiceAtual").isEmpty())
                .andExpect(jsonPath("$.totalAvaliacoes").value(0))
                .andExpect(jsonPath("$.classificacao").isEmpty());
    }

    @Test
    void trechoInativoRetorna409ENaoGrava() throws Exception {
        Trecho trecho = novoTrecho(AtivoInativo.INATIVO);

        mockMvc.perform(post(URL, trecho.getId()).contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(5, 5, 5, 5, 5, 5)))
                .andExpect(status().isConflict());

        org.assertj.core.api.Assertions.assertThat(avaliacaoRepository.count()).isZero();
    }

    @Test
    void trechoInexistenteRetorna404() throws Exception {
        mockMvc.perform(post(URL, UUID.randomUUID()).contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(5, 5, 5, 5, 5, 5)))
                .andExpect(status().isNotFound());
    }

    @Test
    void notaForaDaFaixaRetorna400() throws Exception {
        Trecho trecho = novoTrecho(AtivoInativo.ATIVO);

        mockMvc.perform(post(URL, trecho.getId()).contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(11, 5, 5, 5, 5, 5)))
                .andExpect(status().isBadRequest());
    }
}
```

- [ ] **Step 15: Rodar a suíte completa**

Run (Docker ativo): `./mvnw test`
Expected: PASS em tudo. Se `jsonPath("$.indiceAtual").isEmpty()` não aceitar `null`, trocar por `.value(org.hamcrest.Matchers.nullValue())`.

- [ ] **Step 16: Verificação manual**

Com `docker compose up -d` e `./mvnw spring-boot:run`:
```bash
curl -s -X POST http://localhost:8080/api/v1/regioes -H "Content-Type: application/json" -d '{"nome":"Recife Antigo"}'
# usar o id devolvido em REGIAO_ID
curl -s -X POST http://localhost:8080/api/v1/trechos -H "Content-Type: application/json" -d '{"nome":"Rua da Aurora","geometria":[{"lat":-8.0631,"lng":-34.8711},{"lat":-8.0640,"lng":-34.8720}],"latitude":-8.0631,"longitude":-34.8711,"regiaoId":"REGIAO_ID"}'
# usar o id devolvido em TRECHO_ID
curl -s -X POST http://localhost:8080/api/v1/trechos/TRECHO_ID/avaliacoes -H "Content-Type: application/json" -d '{"notaCalcada":8,"notaAcessibilidade":6,"notaIluminacao":4,"notaArborizacao":2,"notaTravessias":0,"notaMobiliario":10}'
```
Expected: a última resposta traz `trecho.indiceAtual` 5.40, `totalAvaliacoes` 1 e `classificacao` "MEDIO". Repetir com notas diferentes e conferir a média. Repetir com `"notaCalcada":11` e esperar `400` com `mensagem` explicando.

- [ ] **Step 17: Commit**

```bash
git add backend/src
git commit -m "Adiciona POST de avaliacoes com recalculo do indice do trecho"
```
(Terminar a mensagem com a linha de coautoria definida na sessão.)

---

### Task 5: Documentação das Fases 2 e 3 no Vault

**Files (todos em `C:\CLAUDE\PÉ-RÍMETRO`):**
- Create: `12 - Decisões/ADR-011 - Avaliação Anônima até a Sprint 04.md`
- Modify: `12 - Decisões/ADR-005 - Cálculo do Índice no Backend.md`
- Modify: `12 - Decisões/Índice de Decisões.md`
- Modify: `04 - Regras de Negócio/Regras de Avaliação.md`
- Modify: `04 - Regras de Negócio/Critérios de Avaliação.md`
- Modify: `04 - Regras de Negócio/Classificação do Índice.md`
- Modify: `04 - Regras de Negócio/Índice de Caminhabilidade.md`
- Modify: `06 - Banco de Dados/Avaliacao.md`, `Trecho.md`, `Modelo de Dados.md`, `Diagrama ER.md`, `Dicionário de Dados.md`, `Scripts SQL.md`
- Modify: `07 - API/Avaliacoes.md`, `Trechos.md`, `Códigos HTTP.md`
- Modify: `10 - Tarefas/Backlog.md`, `10 - Tarefas/Tarefas Concluídas.md`
- Modify: `08 - Desenvolvimento/Ambiente de Desenvolvimento.md` (testes exigem Docker)
- Modify: `09 - Sprints/Sprint 03 - Avaliações e Índice.md`, `00 - Sistema/Status do Projeto.md`, diário do dia

Regras comuns: `data_atualizacao` = data real da sessão; `data_criacao` de notas existentes não muda; novas notas usam a data real da sessão. Ler cada nota antes de editar e manter seu estilo. Só documentar o que foi de fato implementado e verificado nas Tasks 1 a 4.

- [ ] **Step 1: Criar a ADR-011**

`12 - Decisões/ADR-011 - Avaliação Anônima até a Sprint 04.md`, com frontmatter (`tipo: adr`, `status: decidida`, tags `perimetro`, `decisao`, `backend`) e as seções do padrão das ADRs do Vault:
- **Contexto:** [[Regras de Avaliação]] previa avaliação por "usuário autenticado", mas o login só chega na [[Sprint 04 - Autenticação e Ocorrências|Sprint 04]], depois das avaliações (núcleo P0 da Sprint 03).
- **Opções consideradas:** (1) avaliação anônima agora, `usuario_id` nulo; (2) antecipar login mínimo para a Sprint 03; (3) inverter a ordem (Autenticação antes das Avaliações).
- **Decisão:** Opção 1. `avaliacao.usuario_id` é nulo e sem FK; a Sprint 04 cria `usuario`, adiciona a FK e passa a preencher o campo.
- **Justificativa:** mantém o roadmap e entrega o núcleo P0 sem depender de autenticação.
- **Consequências:** qualquer pessoa pode avaliar o mesmo trecho várias vezes e distorcer o índice até a Sprint 04; aceito conscientemente. Reavaliação/edição/limite por pessoa e proteção contra abuso ficam para depois. Avaliações anônimas já gravadas permanecem sem autor.
- **Decisões relacionadas:** [[ADR-005 - Cálculo do Índice no Backend]].

- [ ] **Step 2: Promover a ADR-005 a decidida**

Em `ADR-005 - Cálculo do Índice no Backend.md`: `status: proposta` -> `status: decidida`. Em "Decisão", trocar o texto por: Opção 1 adotada e implementada na Sprint 03 (cálculo no backend, no momento da persistência, gravado em `indice_atual`); regras: média simples de todas as avaliações, recalculada por consulta agregada (`AVG`) com o trecho travado (`PESSIMISTIC_WRITE`), pesos e faixas em um único lugar do código (`CalculadoraIndice` e `Classificacao`). Manter o texto antigo da proposta como histórico dentro de uma seção "Histórico" (REGRA 10). Em "Status", **Decidida.** Acrescentar link para [[ADR-011 - Avaliação Anônima até a Sprint 04]].

- [ ] **Step 3: Atualizar as regras de negócio**

- `Regras de Avaliação.md`: em "O que já está decidido", corrigir o primeiro item para refletir a avaliação **anônima na Sprint 03** (autor só a partir da Sprint 04, ver [[ADR-011 - Avaliação Anônima até a Sprint 04]]); adicionar "Agregação: média simples de todas as avaliações do trecho" e "Trecho inativo não pode ser avaliado". Em "O que falta definir", remover o método de agregação (já decidido) e manter reavaliação, edição e exclusão como em aberto.
- `Critérios de Avaliação.md`: `status: a_definir` -> `status: decidido (parcial)`. Registrar escala **0 a 10, inteiros, igual para as 6 dimensões**, e que o exemplo de [[Critérios de Aceitação]] deixa de ser só exemplo quanto à escala. Manter em aberto os textos de apoio por dimensão (serão propostos na Fase 4).
- `Classificação do Índice.md`: `status: a_definir` -> `status: decidido`. Documentar as faixas (Ruim `< 4,0`, Médio de `4,0` a `6,9`, Bom `>= 7,0`, "sem avaliações" quando não há índice), que são aplicadas ao índice arredondado a 1 casa decimal (valor exibido), e que a classificação é calculada só no backend e devolvida como `classificacao` (`BOM`, `MEDIO`, `RUIM` ou `null`).
- `Índice de Caminhabilidade.md`: em "Estado atual", registrar que dimensões, pesos, escala, agregação e faixas estão decididos e implementados no backend ([[ADR-005 - Cálculo do Índice no Backend]]).

- [ ] **Step 4: Atualizar banco de dados**

- `Avaliacao.md`: `status: decidido`; tabela de atributos real: `id` uuid; `trecho_id` uuid FK `ON DELETE RESTRICT`; `usuario_id` uuid **nulo, sem FK até a Sprint 04**; seis colunas `nota_*` `smallint` com `CHECK` entre 0 e 10; `criado_em` timestamptz default `now()`; índice `idx_avaliacao_trecho_id`.
- `Trecho.md`: acrescentar `total_avaliacoes` (integer, default 0) e atualizar a observação de `indice_atual` (agora preenchido a cada avaliação).
- `Modelo de Dados.md`, `Diagrama ER.md`, `Dicionário de Dados.md`: tratar `Avaliacao` como entidade com schema real (no ER, ajustar o bloco `AVALIACAO` com os tipos reais e `usuario_id` nulo; adicionar `total_avaliacoes` ao bloco `TRECHO`); `Usuario`, `Ocorrencia`, `CategoriaOcorrencia` e `Foto` continuam como proposta.
- `Scripts SQL.md`: acrescentar V3 (cria `avaliacao` com `CHECK` 0 a 10 e índice por trecho) e V4 (adiciona `total_avaliacoes` a `trecho`) à tabela de migrations.

- [ ] **Step 5: Atualizar a API**

- `Avaliacoes.md`: `status: decidido`; documentar `POST /api/v1/trechos/{trechoId}/avaliacoes` (corpo com as 6 notas inteiras de 0 a 10; `201` com a avaliação e o trecho atualizado com `indiceAtual`, `totalAvaliacoes`, `classificacao`; `400` nota ausente, fora de 0 a 10 ou não inteira; `404` trecho inexistente; `409` trecho inativo; sem autenticação até a Sprint 04). Deixar explícito que **não existe `GET` de avaliações** nesta sprint e remover/marcar como não implementados quaisquer endpoints propostos que não existam.
- `Trechos.md`: documentar os campos novos `totalAvaliacoes` e `classificacao` nas respostas de `GET /api/v1/trechos` e `GET /api/v1/trechos/{id}`.
- `Códigos HTTP.md`: acrescentar na linha do `409` o caso "avaliar trecho inativo" e a referência a [[Avaliacoes]].

- [ ] **Step 6: Tarefas, ambiente, sprint e status**

- `Backlog.md`: remover o item dos Testcontainers dos itens abertos (mover a referência para concluído, sem apagar o histórico: manter a decisão em [[Tarefas Concluídas]]).
- `Tarefas Concluídas.md`: acrescentar linhas datadas para "Testcontainers no backend (Sprint 03 Fase 2)" e "Backend de Avaliações e Índice (Sprint 03 Fase 3)".
- `Ambiente de Desenvolvimento.md`: registrar que os testes de integração do backend (`./mvnw test`) exigem o **Docker em execução** (Testcontainers sobe um Postgres próprio, independente do `docker compose`).
- `Sprint 03 - Avaliações e Índice.md`: marcar os itens "Testcontainers" e "Avaliações das 6 dimensões e cálculo do índice (backend)" como `[x]`; manter o frontend de avaliação pendente.
- `Status do Projeto.md`: atualizar "O que já está decidido" (ADR-005, ADR-011, escala, agregação, faixas), remover esses itens de "O que está em aberto" e adicionar marco datado.
- `Índice de Decisões.md`: adicionar ADR-011 (`decidida`) e mudar ADR-005 para `decidida`.
- Diário do dia: registrar o que foi feito, problemas encontrados (inclusive qualquer ajuste feito nos passos de fallback da Task 3 e Task 4) e próximos passos (Fase 4).

- [ ] **Step 7: Verificar links e commitar**

Conferir que todo `[[wikilink]]` das notas alteradas resolve. Depois, em `C:\CLAUDE\PÉ-RÍMETRO`:
```bash
git add -- "00 - Sistema" "04 - Regras de Negócio" "06 - Banco de Dados" "07 - API" "08 - Desenvolvimento" "09 - Sprints" "10 - Tarefas" "12 - Decisões" Diario
git status --short
git commit -m "Documenta Testcontainers e backend de avaliacoes e indice (Sprint 03 Fases 2 e 3)"
```
(Terminar a mensagem com a linha de coautoria definida na sessão. Não incluir arquivos alheios, como mudanças em `.obsidian/`.)
