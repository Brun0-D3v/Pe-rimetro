# Sprint 03 Fase 5 - Usuário Adiciona o Próprio Trecho Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que a pessoa que usa o mapa trace um trecho novo clicando nos pontos do caminho, dê um nome, escolha a região e salve; o trecho passa a existir no mapa e já pode ser avaliado.

**Architecture:** O backend já tem `POST /api/v1/trechos` e a geometria já é uma lista de pontos; falta apenas **validar** essa geometria (hoje qualquer lista passa) com uma regra única (`GeometriaTrecho`). No frontend, um modo "traçando" liga uma camada do Leaflet que transforma cada clique em vértice (`useDesenhoTrecho` guarda os pontos), um painel pede nome e região, e o trecho devolvido pelo backend entra na lista do mapa (`useTrechos.adicionarTrecho`) sem recarregar. O traçado é **manual (clique a clique)**; "grudar na rua" por roteamento fica para outra fase, porque exige um provedor externo e uma ADR.

**Tech Stack:** Java 21, Spring Boot 4.1.1 (Jakarta Validation), JUnit 5, Testcontainers; React 19, Vite 8, react-leaflet 5, Tailwind 4, axios, lucide-react, Vitest, oxlint.

**Spec:** não há spec novo. Este plano nasce de um pedido do Tech Lead em 2026-11-05 ("o usuário poder adicionar o próprio trecho a ser avaliado") e se apoia em `docs/superpowers/specs/2026-11-03-sprint03-localizacao-avaliacoes-design.md` (avaliação anônima, formato de trecho, `ErroResponseDto`). As decisões abaixo são **propostas** e devem ser confirmadas antes de executar.

## Decisões propostas (confirmar antes de executar)

| # | Decisão | Motivo |
|---|---|---|
| D1 | **Qualquer pessoa, sem login**, pode criar trecho até a Sprint 04. O UC04 do Vault ("o administrador adiciona um novo trecho") passa a valer também para o usuário comum. Vira a ADR-013 (no Vault) com `status: proposta` até o Tech Lead confirmar. | Mesmo raciocínio da ADR-011 (avaliação anônima): o login só chega na Sprint 04. Risco aceito: lixo e abuso. |
| D2 | **Traçado manual**: cada clique no mapa é um vértice; há "Desfazer ponto", "Limpar" e "Cancelar". Sem roteamento automático. | Zero dependência externa, funciona já, e a geometria continua sendo só uma lista de pontos, então um roteamento futuro só muda *como* os pontos são produzidos. |
| D3 | **Região**: lista das regiões existentes; vem pré-selecionada pela região do trecho cadastrado mais próximo do primeiro ponto; com um filtro de região ativo no mapa, a região fica **travada** nela. Criar região nova pela interface fica fora. | `regiaoId` é obrigatório no backend. Travar com filtro ativo evita o trecho novo "sumir" da lista filtrada. |
| D4 | **Limites validados no backend** (fonte da verdade): 2 a 200 pontos; comprimento de 5 m a 5.000 m; latitude -90 a 90 e longitude -180 a 180. | Barra lixo óbvio (linha atravessando o planeta, clique duplo) sem inventar regra de produto. Os valores são proposta; ficam em constantes únicas. |
| D5 | Sem moderação, sem detecção de trechos duplicados e sem limite de criações por pessoa. | Fora do escopo; ficam como ideias e como risco registrado na ADR-013. |
| D6 | `PUT` e `DELETE` de trecho continuam abertos na API (como já são hoje) e **não** são expostos na interface. | Não piorar nem expandir o que existe; a proteção real vem com a autenticação (Sprint 04). |

## Global Constraints

- **Pré-requisito:** a Fase 4 (`docs/superpowers/plans/2026-11-03-sprint03-fase4-frontend-avaliacao.md`) concluída e **commitada**, inclusive a Task 3 (`Mapa.jsx`, `MapaLeaflet.jsx`, `PainelFiltros.jsx`). Este plano altera `Mapa.jsx` e `CabecalhoMapa.jsx` em cima dessa versão. Conferir com `git status` que não há mudança pendente dessa fase.
- Repositório de código: `C:\PROJETO PÉ-RÍMETRO` (`backend/` e `frontend/`). Vault: `C:\CLAUDE\PÉ-RÍMETRO` (git separado). Rodar Maven com `./mvnw` dentro de `backend/`; os testes de integração exigem o **Docker em execução**.
- Contrato do backend que **não muda**: `POST /api/v1/trechos` com `nome`, `geometria` (`[{lat,lng}]`), `latitude`, `longitude`, `regiaoId` (e `status` opcional, padrão `ATIVO`); resposta `201` com o trecho (`id`, `nome`, `geometria`, `latitude`, `longitude`, `indiceAtual`, `status`, `regiaoId`, `totalAvaliacoes`, `classificacao`). Erros: `{ mensagem, ocorridoEm }`; validação de corpo é `400` com `mensagem` no formato `campo: motivo`.
- Os limites do frontend **espelham** os do backend só para dar resposta rápida; a decisão final é sempre do backend, e o frontend mostra a `mensagem` que ele devolver.
- Os testes já existentes usam geometrias de 2 pontos com cerca de 100 m (`TrechoControllerTest`, `TrechoServiceTest`, `TrechoIntegracaoTest`); elas continuam válidas com as regras novas. Entidades criadas direto nos testes com 1 ponto (`AvaliacaoServiceTest` etc.) **não** passam pela validação (que é só no DTO) e não devem ser alteradas.
- Leaflet exige cores em hex; o rascunho usa `#38bdf8`, igual ao token `--color-accent-tech`.
- Ícones: somente `lucide-react`. Textos de interface em português do Brasil. Usar os tokens semânticos (`bg-base-*`, `text-texto`, `text-texto-mute`, `border-base-4`).
- Vault: REGRA 04 (data real da sessão; nunca alterar `data_criacao`), REGRA 02 (wikilinks), REGRA 06 (não inventar), REGRA 10 (não apagar histórico: o texto antigo do UC04 fica registrado).

## File Structure

```
backend/src/main/java/br/com/perimetro/
├── validation/
│   ├── GeometriaTrecho.java            # NOVO - regra única: limites e cálculo de comprimento
│   ├── GeometriaValida.java            # NOVO - anotação Bean Validation
│   └── GeometriaValidaValidator.java   # NOVO - liga a anotação à regra
└── dto/TrechoRequestDto.java           # MODIFICADO - @GeometriaValida na geometria

frontend/src/
├── utils/geometria.js                  # NOVO - distância, comprimento, ponto médio, região mais próxima
├── config/trechoConfig.js              # NOVO - limites (espelho do backend)
├── hooks/
│   ├── useDesenhoTrecho.js             # NOVO - pontos do rascunho
│   ├── useLocalizacao.js               # MODIFICADO - passa a usar utils/geometria (sem duplicar haversine)
│   └── useTrechos.js                   # MODIFICADO - adicionarTrecho
├── services/trechoService.js           # MODIFICADO - criarTrecho
├── components/mapa/
│   ├── CamadaDesenhoTrecho.jsx         # NOVO - clique vira vértice; mostra o rascunho
│   ├── PainelNovoTrecho.jsx            # NOVO - nome, região, resumo e botões
│   └── CabecalhoMapa.jsx               # MODIFICADO - botão "Adicionar trecho"
└── pages/Mapa.jsx                      # MODIFICADO - modo traçando e salvamento
```

---

### Task 1: Validação da geometria no backend

**Files:**
- Create: `backend/src/main/java/br/com/perimetro/validation/GeometriaTrecho.java`
- Create: `backend/src/main/java/br/com/perimetro/validation/GeometriaValida.java`
- Create: `backend/src/main/java/br/com/perimetro/validation/GeometriaValidaValidator.java`
- Modify: `backend/src/main/java/br/com/perimetro/dto/TrechoRequestDto.java`
- Test: `backend/src/test/java/br/com/perimetro/validation/GeometriaTrechoTest.java`
- Modify (test): `backend/src/test/java/br/com/perimetro/controller/TrechoControllerTest.java`
- Modify (test): `backend/src/test/java/br/com/perimetro/integracao/TrechoIntegracaoTest.java`
- Modify (test): `backend/src/test/java/br/com/perimetro/integracao/AvaliacaoIntegracaoTest.java`

**Interfaces:**
- Produces:
  - `GeometriaTrecho.motivoDaInvalidez(List<PontoDto>): String` (texto do motivo ou `null` se válida), `GeometriaTrecho.comprimentoMetros(List<PontoDto>): double`, `GeometriaTrecho.distanciaMetros(PontoDto, PontoDto): double` e as constantes `MIN_PONTOS`, `MAX_PONTOS`, `COMPRIMENTO_MIN_METROS`, `COMPRIMENTO_MAX_METROS`.
  - Anotação `@GeometriaValida` (em campo `List<PontoDto>`); falha vira `400` com `mensagem` `geometria: <motivo>`.
- Consumes: `PontoDto(double lat, double lng)` com `getLat()`/`getLng()` (já existe).

- [ ] **Step 1: Escrever o teste da regra (falha primeiro)**

`backend/src/test/java/br/com/perimetro/validation/GeometriaTrechoTest.java`:
```java
package br.com.perimetro.validation;

import br.com.perimetro.dto.PontoDto;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class GeometriaTrechoTest {

    private static final PontoDto A = new PontoDto(-8.0631, -34.8711);
    private static final PontoDto B = new PontoDto(-8.0640, -34.8720);

    @Test
    void doisPontosComCentenasDeMetrosSaoValidos() {
        assertThat(GeometriaTrecho.motivoDaInvalidez(List.of(A, B))).isNull();
    }

    @Test
    void umSoPontoEInvalido() {
        assertThat(GeometriaTrecho.motivoDaInvalidez(List.of(A))).isEqualTo("deve ter entre 2 e 200 pontos");
    }

    @Test
    void listaVaziaEInvalida() {
        assertThat(GeometriaTrecho.motivoDaInvalidez(List.of())).isEqualTo("deve ter entre 2 e 200 pontos");
    }

    @Test
    void maisDeDuzentosPontosEInvalido() {
        List<PontoDto> pontos = new ArrayList<>();
        for (int i = 0; i < 201; i++) {
            pontos.add(new PontoDto(-8.06 + i * 0.00001, -34.87));
        }
        assertThat(GeometriaTrecho.motivoDaInvalidez(pontos)).isEqualTo("deve ter entre 2 e 200 pontos");
    }

    @Test
    void latitudeForaDaFaixaEInvalida() {
        assertThat(GeometriaTrecho.motivoDaInvalidez(List.of(new PontoDto(91, 0), new PontoDto(0, 0))))
                .isEqualTo("contém coordenada inválida");
    }

    @Test
    void longitudeForaDaFaixaEInvalida() {
        assertThat(GeometriaTrecho.motivoDaInvalidez(List.of(new PontoDto(0, 181), new PontoDto(0, 0))))
                .isEqualTo("contém coordenada inválida");
    }

    @Test
    void coordenadaNaoNumericaEInvalida() {
        assertThat(GeometriaTrecho.motivoDaInvalidez(List.of(new PontoDto(Double.NaN, 0), new PontoDto(0, 0))))
                .isEqualTo("contém coordenada inválida");
    }

    @Test
    void pontosIguaisFormamUmTrechoCurtoDemais() {
        assertThat(GeometriaTrecho.motivoDaInvalidez(List.of(A, A))).isEqualTo("é curta demais (mínimo 5 m)");
    }

    @Test
    void maisDeCincoQuilometrosEInvalido() {
        // 0,06 grau de latitude = cerca de 6,7 km
        List<PontoDto> pontos = List.of(new PontoDto(-8.00, -34.87), new PontoDto(-8.06, -34.87));
        assertThat(GeometriaTrecho.motivoDaInvalidez(pontos)).isEqualTo("é longa demais (máximo 5000 m)");
    }

    @Test
    void calculaOComprimentoSomandoOsSegmentos() {
        // 0,01 grau de latitude = cerca de 1111,95 m; dois segmentos = cerca de 2223,9 m
        List<PontoDto> pontos = List.of(new PontoDto(-8.00, -34.87), new PontoDto(-8.01, -34.87), new PontoDto(-8.02, -34.87));
        assertThat(GeometriaTrecho.comprimentoMetros(pontos)).isCloseTo(2223.9, within(0.5));
    }
}
```

- [ ] **Step 2: Rodar e ver falhar**

Run (em `backend/`): `./mvnw test -Dtest=GeometriaTrechoTest`
Expected: falha de compilação (`GeometriaTrecho` não existe).

- [ ] **Step 3: Implementar a regra, a anotação e o validador**

`backend/src/main/java/br/com/perimetro/validation/GeometriaTrecho.java`:
```java
package br.com.perimetro.validation;

import br.com.perimetro.dto.PontoDto;

import java.util.List;

// Única fonte dos limites da geometria de um trecho. O frontend espelha estes valores
// em config/trechoConfig.js apenas para responder mais rápido; quem decide é o backend.
public final class GeometriaTrecho {

    public static final int MIN_PONTOS = 2;
    public static final int MAX_PONTOS = 200;
    public static final double COMPRIMENTO_MIN_METROS = 5;
    public static final double COMPRIMENTO_MAX_METROS = 5000;

    private static final double RAIO_TERRA_METROS = 6_371_000;

    private GeometriaTrecho() {
    }

    // Devolve o motivo (texto curto, em português) ou null quando a geometria é válida.
    public static String motivoDaInvalidez(List<PontoDto> pontos) {
        if (pontos == null || pontos.size() < MIN_PONTOS || pontos.size() > MAX_PONTOS) {
            return "deve ter entre " + MIN_PONTOS + " e " + MAX_PONTOS + " pontos";
        }
        for (PontoDto ponto : pontos) {
            if (ponto == null || !latitudeValida(ponto.getLat()) || !longitudeValida(ponto.getLng())) {
                return "contém coordenada inválida";
            }
        }
        double comprimento = comprimentoMetros(pontos);
        if (comprimento < COMPRIMENTO_MIN_METROS) {
            return "é curta demais (mínimo " + (int) COMPRIMENTO_MIN_METROS + " m)";
        }
        if (comprimento > COMPRIMENTO_MAX_METROS) {
            return "é longa demais (máximo " + (int) COMPRIMENTO_MAX_METROS + " m)";
        }
        return null;
    }

    public static double comprimentoMetros(List<PontoDto> pontos) {
        double total = 0;
        for (int i = 1; i < pontos.size(); i++) {
            total += distanciaMetros(pontos.get(i - 1), pontos.get(i));
        }
        return total;
    }

    // Distância aproximada (haversine) entre dois pontos, em metros.
    public static double distanciaMetros(PontoDto a, PontoDto b) {
        double dLat = Math.toRadians(b.getLat() - a.getLat());
        double dLng = Math.toRadians(b.getLng() - a.getLng());
        double h = Math.pow(Math.sin(dLat / 2), 2)
                + Math.cos(Math.toRadians(a.getLat())) * Math.cos(Math.toRadians(b.getLat()))
                * Math.pow(Math.sin(dLng / 2), 2);
        return 2 * RAIO_TERRA_METROS * Math.asin(Math.sqrt(h));
    }

    // Escrito como "não está dentro da faixa" para também rejeitar NaN.
    private static boolean latitudeValida(double lat) {
        return lat >= -90 && lat <= 90;
    }

    private static boolean longitudeValida(double lng) {
        return lng >= -180 && lng <= 180;
    }
}
```
`backend/src/main/java/br/com/perimetro/validation/GeometriaValida.java`:
```java
package br.com.perimetro.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Constraint(validatedBy = GeometriaValidaValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface GeometriaValida {

    String message() default "geometria inválida";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
```
`backend/src/main/java/br/com/perimetro/validation/GeometriaValidaValidator.java`:
```java
package br.com.perimetro.validation;

import br.com.perimetro.dto.PontoDto;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.List;

public class GeometriaValidaValidator implements ConstraintValidator<GeometriaValida, List<PontoDto>> {

    @Override
    public boolean isValid(List<PontoDto> geometria, ConstraintValidatorContext contexto) {
        if (geometria == null) {
            return true; // a ausência já é barrada por @NotNull no DTO
        }
        String motivo = GeometriaTrecho.motivoDaInvalidez(geometria);
        if (motivo == null) {
            return true;
        }
        contexto.disableDefaultConstraintViolation();
        contexto.buildConstraintViolationWithTemplate(motivo).addConstraintViolation();
        return false;
    }
}
```

- [ ] **Step 4: Aplicar a anotação no DTO**

Em `backend/src/main/java/br/com/perimetro/dto/TrechoRequestDto.java`, importar `br.com.perimetro.validation.GeometriaValida` e trocar:
```java
    @NotNull(message = "geometria é obrigatória")
    private final List<PontoDto> geometria;
```
por:
```java
    @NotNull(message = "geometria é obrigatória")
    @GeometriaValida
    private final List<PontoDto> geometria;
```

- [ ] **Step 5: Rodar a regra e ver passar**

Run: `./mvnw test -Dtest=GeometriaTrechoTest`
Expected: PASS (10 testes).

- [ ] **Step 6: Testes de controller e de integração**

Em `TrechoControllerTest.java`, depois de `rejeitaTrechoSemNome`, adicionar:
```java
    @Test
    void rejeitaGeometriaComUmUnicoPonto() throws Exception {
        UUID regiaoId = UUID.randomUUID();
        TrechoRequestDto corpo = new TrechoRequestDto("Rua das Flores",
                List.of(new PontoDto(-23.550520, -46.633308)), -23.55, -46.63, regiaoId, null);

        mockMvc.perform(post("/api/v1/trechos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(corpo)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value(org.hamcrest.Matchers.containsString("geometria: deve ter entre 2 e 200 pontos")));
    }
```
Em `TrechoIntegracaoTest.java`, depois do último teste, adicionar:
```java
    @Test
    void rejeitaTrechoComGeometriaLongaDemaisEExplicaOMotivo() throws Exception {
        Regiao regiao = regiaoRepository.save(new Regiao("Recife Antigo"));
        TrechoRequestDto corpo = new TrechoRequestDto("Rua enorme",
                List.of(new PontoDto(-8.00, -34.87), new PontoDto(-8.06, -34.87)),
                -8.03, -34.87, regiao.getId(), null);

        mockMvc.perform(post("/api/v1/trechos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(corpo)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value(org.hamcrest.Matchers.containsString("geometria: é longa demais")));
    }
```
Em `AvaliacaoIntegracaoTest.java`, importar `br.com.perimetro.dto.TrechoRequestDto` e adicionar ao fim da classe:
```java
    @Test
    void trechoCriadoPeloUsuarioPodeSerAvaliadoEmSeguida() throws Exception {
        Regiao regiao = regiaoRepository.save(new Regiao("Boa Viagem"));
        TrechoRequestDto novo = new TrechoRequestDto("Rua do usuário",
                List.of(new PontoDto(-8.1190, -34.9040), new PontoDto(-8.1200, -34.9050), new PontoDto(-8.1215, -34.9060)),
                -8.12, -34.905, regiao.getId(), null);
        String resposta = mockMvc.perform(post("/api/v1/trechos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(novo)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.totalAvaliacoes").value(0))
                .andReturn().getResponse().getContentAsString();
        String id = objectMapper.readTree(resposta).get("id").asString();

        mockMvc.perform(post(URL, id).contentType(MediaType.APPLICATION_JSON).content(corpo(9, 9, 9, 9, 9, 9)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.trecho.classificacao").value("BOM"));
    }
```

- [ ] **Step 7: Suíte completa**

Run (Docker ativo): `./mvnw test`
Expected: PASS em tudo (os 73 anteriores + os 13 novos). Se algum teste antigo falhar por causa da geometria, conferir primeiro se ele monta o `TrechoRequestDto` com menos de 2 pontos, menos de 5 m ou mais de 5 km, e ajustar **o teste** (não a regra).

- [ ] **Step 8: Commit**

```bash
git add backend/src
git commit -m "Valida a geometria do trecho (pontos, coordenadas e comprimento)"
```
(Terminar a mensagem com a linha de coautoria definida na sessão.)

---

### Task 2: Utilitários de geometria e hook do rascunho (frontend)

**Files:**
- Create: `frontend/src/utils/geometria.js`
- Test: `frontend/src/utils/geometria.test.js`
- Create: `frontend/src/config/trechoConfig.js`
- Create: `frontend/src/hooks/useDesenhoTrecho.js`
- Test: `frontend/src/hooks/useDesenhoTrecho.test.js`
- Modify: `frontend/src/hooks/useLocalizacao.js`
- Modify: `frontend/src/services/trechoService.js`
- Modify: `frontend/src/hooks/useTrechos.js`

**Interfaces:**
- Produces:
  - `utils/geometria.js`: `distanciaMetros(a, b): number`, `comprimentoMetros(pontos): number`, `pontoMedio(pontos): { lat, lng }`, `regiaoMaisProxima(pontos, trechos): string | null` (pontos `{lat,lng}`; trechos como os de `GET /trechos`, com `regiaoId` e `geometria`).
  - `config/trechoConfig.js`: `LIMITES_TRECHO = { minPontos, maxPontos, comprimentoMinMetros, comprimentoMaxMetros, nomeMaxCaracteres, distanciaMinimaEntrePontosMetros }`.
  - `useDesenhoTrecho(): { pontos, comprimento, motivoInvalido, adicionarPonto(ponto), desfazerPonto(), limpar() }` e `motivoDoTracadoInvalido(quantidadePontos, comprimento): string | null`.
  - `criarTrecho(dados): Promise<trecho>` e `useTrechos()` passa a devolver também `adicionarTrecho(trecho): void`.

- [ ] **Step 1: Escrever os testes de `geometria` (falham primeiro)**

`frontend/src/utils/geometria.test.js`:
```js
import { describe, expect, it } from "vitest";
import { comprimentoMetros, distanciaMetros, pontoMedio, regiaoMaisProxima } from "./geometria";

describe("geometria", () => {
  it("0,01 grau de latitude equivale a cerca de 1112 m", () => {
    expect(distanciaMetros({ lat: -8, lng: -34 }, { lat: -8.01, lng: -34 })).toBeCloseTo(1111.95, 0);
  });

  it("pontos iguais têm distância zero", () => {
    expect(distanciaMetros({ lat: -8, lng: -34 }, { lat: -8, lng: -34 })).toBe(0);
  });

  it("comprimento soma os segmentos", () => {
    const pontos = [
      { lat: -8.0, lng: -34 },
      { lat: -8.01, lng: -34 },
      { lat: -8.02, lng: -34 },
    ];
    expect(comprimentoMetros(pontos)).toBeCloseTo(2223.9, 0);
  });

  it("comprimento de lista vazia ou de um ponto é zero", () => {
    expect(comprimentoMetros([])).toBe(0);
    expect(comprimentoMetros([{ lat: -8, lng: -34 }])).toBe(0);
  });

  it("ponto médio é a média das coordenadas", () => {
    expect(pontoMedio([{ lat: -8, lng: -34 }, { lat: -10, lng: -36 }])).toEqual({ lat: -9, lng: -35 });
  });

  describe("regiaoMaisProxima", () => {
    const trechos = [
      { regiaoId: "A", geometria: [{ lat: -8.0, lng: -34.9 }] },
      { regiaoId: "B", geometria: [{ lat: -8.2, lng: -34.9 }] },
    ];

    it("devolve a região do trecho mais próximo do primeiro ponto", () => {
      expect(regiaoMaisProxima([{ lat: -8.19, lng: -34.9 }], trechos)).toBe("B");
      expect(regiaoMaisProxima([{ lat: -8.01, lng: -34.9 }], trechos)).toBe("A");
    });

    it("devolve null sem pontos ou sem trechos", () => {
      expect(regiaoMaisProxima([], trechos)).toBeNull();
      expect(regiaoMaisProxima([{ lat: -8, lng: -34 }], [])).toBeNull();
    });
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run (em `frontend/`): `npm test`
Expected: FAIL (módulo `./geometria` inexistente).

- [ ] **Step 3: Implementar `geometria.js` e a configuração**

`frontend/src/utils/geometria.js`:
```js
const RAIO_TERRA_METROS = 6371000;

// Distância aproximada (haversine) entre dois pontos { lat, lng }, em metros.
export function distanciaMetros(a, b) {
  const paraRadianos = (graus) => (graus * Math.PI) / 180;
  const dLat = paraRadianos(b.lat - a.lat);
  const dLng = paraRadianos(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(paraRadianos(a.lat)) * Math.cos(paraRadianos(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RAIO_TERRA_METROS * Math.asin(Math.sqrt(h));
}

export function comprimentoMetros(pontos) {
  let total = 0;
  for (let i = 1; i < pontos.length; i += 1) {
    total += distanciaMetros(pontos[i - 1], pontos[i]);
  }
  return total;
}

// Média das coordenadas: serve de ponto de referência (latitude/longitude do trecho).
export function pontoMedio(pontos) {
  const soma = pontos.reduce((acumulado, ponto) => ({ lat: acumulado.lat + ponto.lat, lng: acumulado.lng + ponto.lng }), {
    lat: 0,
    lng: 0,
  });
  return { lat: soma.lat / pontos.length, lng: soma.lng / pontos.length };
}

// Região do trecho cadastrado cujo vértice está mais perto do primeiro ponto marcado.
export function regiaoMaisProxima(pontos, trechos) {
  if (pontos.length === 0) return null;
  const referencia = pontos[0];
  let regiaoId = null;
  let menorDistancia = Infinity;
  for (const trecho of trechos) {
    for (const ponto of trecho.geometria) {
      const distancia = distanciaMetros(referencia, ponto);
      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        regiaoId = trecho.regiaoId;
      }
    }
  }
  return regiaoId;
}
```
`frontend/src/config/trechoConfig.js`:
```js
// Espelha os limites validados pelo backend (GeometriaTrecho). O backend é a fonte da
// verdade: aqui os valores só servem para responder mais rápido, antes de enviar.
export const LIMITES_TRECHO = {
  minPontos: 2,
  maxPontos: 200,
  comprimentoMinMetros: 5,
  comprimentoMaxMetros: 5000,
  nomeMaxCaracteres: 150,
  // Um clique duplo no mapa gera dois cliques quase no mesmo lugar; o segundo é ignorado.
  distanciaMinimaEntrePontosMetros: 2,
};
```

- [ ] **Step 4: Reaproveitar a distância no `useLocalizacao` (sem duplicar)**

Em `frontend/src/hooks/useLocalizacao.js`:
- Adicionar o import: `import { distanciaMetros } from "../utils/geometria";`
- Remover a constante `RAIO_TERRA_METROS` e a função local `distanciaMetros` (o bloco do comentário "Distância aproximada (haversine)..." até o fim da função).
- Manter `LIMIAR_MOVIMENTO_METROS` e o uso de `distanciaMetros(anterior, nova)` como está.

Run: `npm test`
Expected: PASS nos testes de `geometria` e nos 11 do `useLocalizacao` (o comportamento não mudou).

- [ ] **Step 5: Escrever os testes do hook de rascunho (falham primeiro)**

`frontend/src/hooks/useDesenhoTrecho.test.js`:
```js
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { motivoDoTracadoInvalido, useDesenhoTrecho } from "./useDesenhoTrecho";

const A = { lat: -8.0631, lng: -34.8711 };
const B = { lat: -8.064, lng: -34.872 }; // cerca de 140 m de A
const C = { lat: -8.065, lng: -34.873 };

function marcar(resultado, ...pontos) {
  for (const ponto of pontos) {
    act(() => resultado.current.adicionarPonto(ponto));
  }
}

describe("useDesenhoTrecho", () => {
  it("começa sem pontos, com comprimento zero e pedindo ao menos 2 pontos", () => {
    const { result } = renderHook(() => useDesenhoTrecho());
    expect(result.current.pontos).toEqual([]);
    expect(result.current.comprimento).toBe(0);
    expect(result.current.motivoInvalido).toBe("Marque pelo menos 2 pontos no mapa.");
  });

  it("acumula pontos na ordem e soma o comprimento", () => {
    const { result } = renderHook(() => useDesenhoTrecho());
    marcar(result, A, B, C);
    expect(result.current.pontos).toEqual([A, B, C]);
    expect(result.current.comprimento).toBeGreaterThan(250);
    expect(result.current.motivoInvalido).toBeNull();
  });

  it("ignora um ponto a menos de 2 m do anterior (clique duplo)", () => {
    const { result } = renderHook(() => useDesenhoTrecho());
    marcar(result, A, { lat: A.lat + 0.00001, lng: A.lng }); // cerca de 1,1 m
    expect(result.current.pontos).toEqual([A]);
  });

  it("desfaz o último ponto", () => {
    const { result } = renderHook(() => useDesenhoTrecho());
    marcar(result, A, B);
    act(() => result.current.desfazerPonto());
    expect(result.current.pontos).toEqual([A]);
  });

  it("desfazer sem pontos não quebra", () => {
    const { result } = renderHook(() => useDesenhoTrecho());
    act(() => result.current.desfazerPonto());
    expect(result.current.pontos).toEqual([]);
  });

  it("limpa todos os pontos", () => {
    const { result } = renderHook(() => useDesenhoTrecho());
    marcar(result, A, B);
    act(() => result.current.limpar());
    expect(result.current.pontos).toEqual([]);
  });

  it("não passa de 200 pontos", () => {
    const { result } = renderHook(() => useDesenhoTrecho());
    for (let i = 0; i < 205; i += 1) {
      marcar(result, { lat: -8 - i * 0.0001, lng: -34.87 });
    }
    expect(result.current.pontos).toHaveLength(200);
  });
});

describe("motivoDoTracadoInvalido", () => {
  it("pede mais pontos", () => {
    expect(motivoDoTracadoInvalido(0, 0)).toBe("Marque pelo menos 2 pontos no mapa.");
    expect(motivoDoTracadoInvalido(1, 0)).toBe("Marque pelo menos 2 pontos no mapa.");
  });

  it("recusa trecho curto demais", () => {
    expect(motivoDoTracadoInvalido(2, 1)).toBe("Trecho curto demais (mínimo 5 m).");
  });

  it("recusa trecho longo demais", () => {
    expect(motivoDoTracadoInvalido(2, 6000)).toBe("Trecho longo demais (máximo 5000 m).");
  });

  it("aceita um trecho dentro dos limites", () => {
    expect(motivoDoTracadoInvalido(2, 100)).toBeNull();
  });
});
```

- [ ] **Step 6: Rodar e ver falhar**

Run: `npm test`
Expected: FAIL (módulo `./useDesenhoTrecho` inexistente).

- [ ] **Step 7: Implementar o hook**

`frontend/src/hooks/useDesenhoTrecho.js`:
```js
import { useCallback, useMemo, useState } from "react";
import { LIMITES_TRECHO } from "../config/trechoConfig";
import { comprimentoMetros, distanciaMetros } from "../utils/geometria";

// Motivo pelo qual o traçado ainda não pode ser salvo, ou null se está dentro dos limites.
export function motivoDoTracadoInvalido(quantidadePontos, comprimento) {
  if (quantidadePontos < LIMITES_TRECHO.minPontos) return "Marque pelo menos 2 pontos no mapa.";
  if (comprimento < LIMITES_TRECHO.comprimentoMinMetros) {
    return `Trecho curto demais (mínimo ${LIMITES_TRECHO.comprimentoMinMetros} m).`;
  }
  if (comprimento > LIMITES_TRECHO.comprimentoMaxMetros) {
    return `Trecho longo demais (máximo ${LIMITES_TRECHO.comprimentoMaxMetros} m).`;
  }
  return null;
}

// Guarda os vértices do trecho que a pessoa está traçando no mapa.
export function useDesenhoTrecho() {
  const [pontos, setPontos] = useState([]);

  const adicionarPonto = useCallback((ponto) => {
    setPontos((atuais) => {
      if (atuais.length >= LIMITES_TRECHO.maxPontos) return atuais;
      const ultimo = atuais[atuais.length - 1];
      if (ultimo && distanciaMetros(ultimo, ponto) < LIMITES_TRECHO.distanciaMinimaEntrePontosMetros) {
        return atuais;
      }
      return [...atuais, { lat: ponto.lat, lng: ponto.lng }];
    });
  }, []);

  const desfazerPonto = useCallback(() => setPontos((atuais) => atuais.slice(0, -1)), []);
  const limpar = useCallback(() => setPontos([]), []);

  const comprimento = useMemo(() => comprimentoMetros(pontos), [pontos]);
  const motivoInvalido = motivoDoTracadoInvalido(pontos.length, comprimento);

  return { pontos, comprimento, motivoInvalido, adicionarPonto, desfazerPonto, limpar };
}
```

- [ ] **Step 8: Serviço e atualização da lista**

Em `frontend/src/services/trechoService.js`, acrescentar ao final:
```js
export async function criarTrecho(dados) {
  const resposta = await api.post("/trechos", dados);
  return resposta.data;
}
```
Em `frontend/src/hooks/useTrechos.js`, depois de `atualizarTrecho`, adicionar e devolver:
```js
  // Inclui na lista um trecho recém-criado (devolvido pelo backend), sem recarregar a página.
  const adicionarTrecho = useCallback((novoTrecho) => {
    setTrechos((lista) => [...lista, novoTrecho]);
  }, []);

  return { trechos, carregando, erro, atualizarTrecho, adicionarTrecho };
```
(substituindo o `return` anterior do hook).

- [ ] **Step 9: Lint, testes e build**

Run: `npm run lint && npm test && npm run build`
Expected: sem erros novos (os 3 avisos de lint antigos podem continuar); todos os testes passam.

- [ ] **Step 10: Commit**

```bash
git add frontend/src/utils frontend/src/config/trechoConfig.js frontend/src/hooks frontend/src/services/trechoService.js
git commit -m "Adiciona utilitarios de geometria e hook do rascunho de trecho"
```
(Terminar a mensagem com a linha de coautoria definida na sessão.)

---

### Task 3: Traçar, nomear e salvar o trecho no mapa

**Files:**
- Create: `frontend/src/components/mapa/CamadaDesenhoTrecho.jsx`
- Create: `frontend/src/components/mapa/PainelNovoTrecho.jsx`
- Modify: `frontend/src/components/mapa/CabecalhoMapa.jsx`
- Modify: `frontend/src/pages/Mapa.jsx`

**Interfaces:**
- Consumes: `useDesenhoTrecho`, `LIMITES_TRECHO`, `pontoMedio`, `regiaoMaisProxima`, `criarTrecho`, `useTrechos().adicionarTrecho`, `Button`, `Card`, `MapaLeaflet` (já aceita `children`).
- Produces:
  - `CamadaDesenhoTrecho({ pontos, aoAdicionarPonto })` (renderizada **dentro** do `MapaLeaflet`).
  - `PainelNovoTrecho({ pontos, comprimento, motivoInvalido, regioes, regiaoSugeridaId, regiaoTravadaId, salvando, erro, aoDesfazer, aoLimpar, aoCancelar, aoSalvar })`; `aoSalvar({ nome, regiaoId })`.
  - `CabecalhoMapa` com as props novas `desenhando` e `aoAlternarDesenho`.

- [ ] **Step 1: Criar a camada de desenho**

`frontend/src/components/mapa/CamadaDesenhoTrecho.jsx`:
```jsx
import { useEffect } from "react";
import { CircleMarker, Polyline, useMap, useMapEvents } from "react-leaflet";

const COR_RASCUNHO = "#38bdf8"; // = token --color-accent-tech (Leaflet exige hex)

// Ativa só durante o traçado: cada clique no mapa vira um vértice do rascunho.
export default function CamadaDesenhoTrecho({ pontos, aoAdicionarPonto }) {
  const mapa = useMap();

  useMapEvents({
    click: (evento) => aoAdicionarPonto({ lat: evento.latlng.lat, lng: evento.latlng.lng }),
  });

  useEffect(() => {
    const container = mapa.getContainer();
    container.style.cursor = "crosshair";
    return () => {
      container.style.cursor = "";
    };
  }, [mapa]);

  const posicoes = pontos.map((ponto) => [ponto.lat, ponto.lng]);

  return (
    <>
      {posicoes.length >= 2 && (
        <Polyline
          positions={posicoes}
          pathOptions={{ color: COR_RASCUNHO, weight: 5, dashArray: "8 8", interactive: false }}
        />
      )}
      {posicoes.map((posicao, indice) => (
        <CircleMarker
          key={indice}
          center={posicao}
          radius={indice === 0 ? 8 : 6}
          pathOptions={{ color: "#ffffff", weight: 2, fillColor: COR_RASCUNHO, fillOpacity: 1, interactive: false }}
        />
      ))}
    </>
  );
}
```

- [ ] **Step 2: Criar o painel do novo trecho**

`frontend/src/components/mapa/PainelNovoTrecho.jsx`:
```jsx
import { useState } from "react";
import { LIMITES_TRECHO } from "../../config/trechoConfig";
import Button from "../ui/Button";
import Card from "../ui/Card";

function resumo(pontos, comprimento) {
  if (pontos.length === 0) return "Nenhum ponto marcado ainda.";
  const textoPontos = pontos.length === 1 ? "1 ponto" : `${pontos.length} pontos`;
  return `${textoPontos} · ${Math.round(comprimento)} m`;
}

export default function PainelNovoTrecho({
  pontos,
  comprimento,
  motivoInvalido,
  regioes,
  regiaoSugeridaId,
  regiaoTravadaId,
  salvando,
  erro,
  aoDesfazer,
  aoLimpar,
  aoCancelar,
  aoSalvar,
}) {
  const [nome, setNome] = useState("");
  const [regiaoEscolhidaId, setRegiaoEscolhidaId] = useState(null);

  // Com filtro de região ativo a região é a do filtro; senão vale a escolha da pessoa,
  // ou a sugestão (região do trecho cadastrado mais próximo do primeiro ponto).
  const regiaoId = regiaoTravadaId ?? regiaoEscolhidaId ?? regiaoSugeridaId ?? "";
  const nomeLimpo = nome.trim();
  const podeSalvar = !motivoInvalido && nomeLimpo.length > 0 && regiaoId !== "" && !salvando;

  function enviar(evento) {
    evento.preventDefault();
    if (podeSalvar) aoSalvar({ nome: nomeLimpo, regiaoId });
  }

  return (
    <Card className="absolute right-4 top-20 z-[1000] w-[calc(100%-2rem)] max-w-sm">
      <h2 className="text-lg font-semibold text-texto">Novo trecho</h2>
      <p className="mt-1 text-sm text-texto-mute">
        Toque no mapa para marcar os pontos do trecho, na ordem em que se caminha.
      </p>
      <p className="mt-3 text-sm font-medium text-texto" role="status">
        {resumo(pontos, comprimento)}
      </p>
      {motivoInvalido && <p className="mt-1 text-xs text-texto-mute">{motivoInvalido}</p>}

      <form onSubmit={enviar} className="mt-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="novo-trecho-nome" className="text-xs font-semibold uppercase tracking-wide text-texto-mute">
            Nome do trecho
          </label>
          <input
            id="novo-trecho-nome"
            type="text"
            value={nome}
            maxLength={LIMITES_TRECHO.nomeMaxCaracteres}
            disabled={salvando}
            onChange={(evento) => setNome(evento.target.value)}
            placeholder="Ex.: Rua da Aurora, entre a ponte e a praça"
            className="rounded-lg border border-base-4 bg-base-2 px-3 py-2 text-sm text-texto placeholder:text-texto-mute"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="novo-trecho-regiao" className="text-xs font-semibold uppercase tracking-wide text-texto-mute">
            Região
          </label>
          <select
            id="novo-trecho-regiao"
            value={regiaoId}
            disabled={salvando || regiaoTravadaId !== null}
            onChange={(evento) => setRegiaoEscolhidaId(evento.target.value || null)}
            className="rounded-lg border border-base-4 bg-base-2 px-3 py-2 text-sm text-texto"
          >
            <option value="">Escolha a região</option>
            {regioes.map((regiao) => (
              <option key={regiao.id} value={regiao.id}>
                {regiao.nome}
              </option>
            ))}
          </select>
          {regiaoTravadaId !== null && (
            <p className="text-xs text-texto-mute">
              Há um filtro de região ativo; para usar outra região, limpe o filtro antes de traçar.
            </p>
          )}
        </div>

        {erro && (
          <p role="alert" className="rounded-lg border border-indice-ruim/40 bg-indice-ruim/10 px-3 py-2 text-sm text-texto">
            {erro}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={!podeSalvar}>
            {salvando ? "Salvando..." : "Salvar trecho"}
          </Button>
          <Button type="button" variante="secundario" onClick={aoDesfazer} disabled={salvando || pontos.length === 0}>
            Desfazer ponto
          </Button>
          <Button type="button" variante="secundario" onClick={aoLimpar} disabled={salvando || pontos.length === 0}>
            Limpar
          </Button>
          <Button type="button" variante="fantasma" onClick={aoCancelar} disabled={salvando}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
```

- [ ] **Step 3: Botão "Adicionar trecho" no cabeçalho**

Em `frontend/src/components/mapa/CabecalhoMapa.jsx`:
- Trocar o import para `import { Route, Search } from "lucide-react";` e adicionar `import Button from "../ui/Button";`.
- Trocar a assinatura por:
```jsx
export default function CabecalhoMapa({ busca, aoMudarBusca, sugestoes, aoSelecionarSugestao, desenhando, aoAlternarDesenho }) {
```
- Imediatamente antes de `<ThemeToggle />`, inserir:
```jsx
      <Button
        type="button"
        variante={desenhando ? "secundario" : "primario"}
        onClick={aoAlternarDesenho}
        aria-label={desenhando ? "Cancelar o traçado do trecho" : "Adicionar trecho"}
        title={desenhando ? "Cancelar o traçado do trecho" : "Adicionar trecho"}
      >
        <Route size={16} />
        <span className="hidden sm:inline">{desenhando ? "Cancelar traçado" : "Adicionar trecho"}</span>
      </Button>
```

- [ ] **Step 4: Ligar tudo no `Mapa.jsx`**

Em `frontend/src/pages/Mapa.jsx`:

Imports a acrescentar:
```jsx
import CamadaDesenhoTrecho from "../components/mapa/CamadaDesenhoTrecho";
import PainelNovoTrecho from "../components/mapa/PainelNovoTrecho";
import { useDesenhoTrecho } from "../hooks/useDesenhoTrecho";
import { criarTrecho } from "../services/trechoService";
import { pontoMedio, regiaoMaisProxima } from "../utils/geometria";
```
Trocar a linha do `useTrechos` por (acrescentando `adicionarTrecho`):
```jsx
  const { trechos, carregando, erro, atualizarTrecho, adicionarTrecho } = useTrechos(regiaoSelecionadaId || undefined);
```
Junto dos demais hooks (**antes** dos `if` de retorno antecipado de "Carregando"/erro), adicionar:
```jsx
  const [desenhando, setDesenhando] = useState(false);
  const [salvandoTrecho, setSalvandoTrecho] = useState(false);
  const [erroTrecho, setErroTrecho] = useState(null);
  const desenho = useDesenhoTrecho();
```
Depois de `aoAvaliarTrecho`, adicionar as funções:
```jsx
  function encerrarDesenho() {
    setDesenhando(false);
    setErroTrecho(null);
    desenho.limpar();
  }

  function alternarDesenho() {
    if (desenhando) {
      encerrarDesenho();
      return;
    }
    setTrechoSelecionado(null);
    setDesenhando(true);
  }

  async function salvarTrecho({ nome, regiaoId }) {
    setSalvandoTrecho(true);
    setErroTrecho(null);
    try {
      const centro = pontoMedio(desenho.pontos);
      const novoTrecho = await criarTrecho({
        nome,
        geometria: desenho.pontos,
        latitude: centro.lat,
        longitude: centro.lng,
        regiaoId,
      });
      adicionarTrecho(novoTrecho);
      setTrechoSelecionado(novoTrecho);
      encerrarDesenho();
    } catch (falha) {
      setErroTrecho(
        falha.response?.data?.mensagem ?? "Não foi possível salvar o trecho. Verifique a conexão e tente novamente."
      );
    } finally {
      setSalvandoTrecho(false);
    }
  }
```
No `<MapaLeaflet ...>`: trocar `onSelecionarTrecho={setTrechoSelecionado}` por:
```jsx
        onSelecionarTrecho={desenhando ? () => {} : setTrechoSelecionado}
```
e transformar a tag autofechada em tag com filho:
```jsx
      >
        {desenhando && <CamadaDesenhoTrecho pontos={desenho.pontos} aoAdicionarPonto={desenho.adicionarPonto} />}
      </MapaLeaflet>
```
(mantendo todas as props existentes, inclusive as de localização).

No `<CabecalhoMapa ...>`, acrescentar as props:
```jsx
        desenhando={desenhando}
        aoAlternarDesenho={alternarDesenho}
```
Antes do `<PainelDetalheTrecho ...>`, adicionar o painel do novo trecho e esconder o de detalhes durante o traçado:
```jsx
      {desenhando && (
        <PainelNovoTrecho
          pontos={desenho.pontos}
          comprimento={desenho.comprimento}
          motivoInvalido={desenho.motivoInvalido}
          regioes={regioes}
          regiaoSugeridaId={regiaoMaisProxima(desenho.pontos, trechos)}
          regiaoTravadaId={regiaoSelecionadaId}
          salvando={salvandoTrecho}
          erro={erroTrecho}
          aoDesfazer={desenho.desfazerPonto}
          aoLimpar={desenho.limpar}
          aoCancelar={encerrarDesenho}
          aoSalvar={salvarTrecho}
        />
      )}
```
e no `<PainelDetalheTrecho ...>` trocar `trecho={trechoSelecionado}` por `trecho={desenhando ? null : trechoSelecionado}`.

- [ ] **Step 5: Lint, testes e build**

Run (em `frontend/`): `npm run lint && npm test && npm run build`
Expected: sem erros novos; testes passam. Se o lint reclamar do `key={indice}` em `CamadaDesenhoTrecho`, manter assim: os vértices só são acrescentados ou removidos do fim, então o índice é uma chave estável.

- [ ] **Step 6: Verificação manual ponta a ponta**

Subir `docker compose up -d`, o backend e `npm run dev`. Para não sujar dados reais, é possível usar um banco descartável (`DB_NAME=perimetro_verif` no backend) e outra porta. Precisa existir ao menos uma região e um trecho cadastrado.
1. O cabeçalho mostra o botão "Adicionar trecho". Clicar: o cursor vira mira, o painel "Novo trecho" abre e o painel de detalhes some; clicar num trecho existente **não** o seleciona.
2. Clicar 3 pontos no mapa: aparecem os vértices e a linha tracejada; o painel mostra "3 pontos · N m". Com 0 ou 1 ponto, "Salvar trecho" fica desabilitado com a dica "Marque pelo menos 2 pontos no mapa."
3. "Desfazer ponto" remove o último; "Limpar" remove todos; clique duplo num lugar adiciona **um** ponto só.
4. Sem nome, "Salvar trecho" fica desabilitado. A região vem sugerida pela do trecho mais próximo do primeiro ponto; é possível trocar.
5. Com o filtro de região ativo, o seletor de região fica travado nela, com a explicação.
6. Traçar mais de 5 km (afastar muito os pontos): aparece "Trecho longo demais (máximo 5000 m)." e o botão fica desabilitado.
7. Salvar um trecho válido: o painel de traçado fecha, o trecho aparece **sem recarregar a página** (azul, sem avaliações), já selecionado no painel de detalhes, e "Avaliar este trecho" funciona; depois da avaliação a cor muda.
8. Recarregar a página: o trecho continua lá.
9. Parar o backend e tentar salvar: aparece a mensagem de erro no painel, o rascunho e o nome continuam, e o botão volta a habilitar.
10. "Cancelar traçado" (no cabeçalho ou no painel) limpa o rascunho e fecha o painel. Alternar tema claro/escuro: o painel e o rascunho continuam legíveis.
11. A localização em tempo real e a avaliação de trechos continuam funcionando.

- [ ] **Step 7: Commit**

```bash
git add frontend/src
git commit -m "Permite tracar, nomear e salvar um trecho novo pelo mapa"
```
(Terminar a mensagem com a linha de coautoria definida na sessão.)

---

### Task 4: Documentação no Vault

**Files (todos em `C:\CLAUDE\PÉ-RÍMETRO`):**
- Create: `12 - Decisões/ADR-013 - Usuário Cadastra Trechos pelo Mapa.md`
- Modify: `12 - Decisões/Índice de Decisões.md`
- Modify: `02 - Produto/Casos de Uso.md`
- Modify: `07 - API/Trechos.md`
- Modify: `06 - Banco de Dados/Trecho.md`
- Modify: `03 - UX-UI/Mapa - UX.md`
- Modify: `16 - Ideias/Ideias de UX.md`
- Modify: `09 - Sprints/Sprint 03 - Avaliações e Índice.md`
- Modify: `10 - Tarefas/Tarefas Concluídas.md`
- Modify: `00 - Sistema/Status do Projeto.md`
- Create/Modify: diário do dia

Regras comuns: `data_atualizacao` = data real da sessão; `data_criacao` de notas existentes não muda; só documentar o que foi implementado e verificado nas Tasks 1 a 3; ler cada nota antes de editar e manter seu estilo.

- [ ] **Step 1: ADR-013**

Criar a nota a partir de [[Template - ADR]], com frontmatter (`tipo: adr`, tags `perimetro`, `decisao`, `frontend`, `backend`). **`status: proposta`** até o Tech Lead confirmar as decisões D1 a D6 deste plano; quando confirmar, mudar para `decidida` e registrar a data. Conteúdo:
- **Contexto:** o UC04 ([[Casos de Uso]]) previa que o *administrador* cadastra trechos; o pedido de 2026-11-05 é que o *usuário* adicione o próprio trecho para avaliá-lo. O login só chega na Sprint 04 ([[ADR-011 - Avaliação Anônima até a Sprint 04]]).
- **Problema:** quem pode criar trecho e como a pessoa define o caminho no mapa.
- **Opções (traçado):** (A) clicar os pontos no mapa; (B) escolher início e fim e deixar um serviço de roteamento a pé desenhar pelas ruas; (C) gravar o caminho andando com o GPS; (D) importar arquivo (GPX/GeoJSON). Para cada uma: custo, dependência externa, precisão. (B) depende de provedor externo e de chave em produção (ver [[ADR-010 - Provedor de Tiles Stadia Maps]]) e precisa de ADR própria; (C) reaproveitaria a localização ([[ADR-012 - Geolocalização do Usuário no Navegador]]) mas exige gravar a posição ao longo do tempo, o que a ADR-012 deixou fora por privacidade; (D) é fluxo de especialista.
- **Decisão:** a Opção A agora; roteamento (B) como fase futura. Anônimo até a Sprint 04. Limites de geometria (2 a 200 pontos; 5 m a 5.000 m). Região escolhida de uma lista, travada quando há filtro. `PUT`/`DELETE` continuam abertos na API e fora da interface.
- **Consequências:** qualquer pessoa pode criar trechos (inclusive lixo ou duplicados) até a Sprint 04; sem moderação (UC05 trata só ocorrências); a linha reta entre vértices pode atravessar quarteirões; trechos criados não têm autor (a Sprint 04 passa a registrar). Registrar como risco aceito.
- **Decisões relacionadas:** ADR-011, ADR-010, ADR-012.
Adicionar a ADR à tabela de [[Índice de Decisões]] com o mesmo status.

- [ ] **Step 2: Casos de Uso (sem apagar o histórico)**

Em `Casos de Uso.md`, ajustar o UC04 para: "O usuário traça um novo trecho no mapa, dá um nome e o associa a uma região." e acrescentar logo abaixo uma linha de histórico: "Texto original (2026-09-16): *O administrador adiciona um novo trecho ao mapa, associando-o a uma região.* Alterado em 2026-11-05 — ver [[ADR-013 - Usuário Cadastra Trechos pelo Mapa]]." Manter a âncora `^UC04`.

- [ ] **Step 3: API e banco**

- `Trechos.md` (API): no `POST`, trocar a coluna "Requer autenticação" para "Não — anônimo até a Sprint 04 ([[ADR-013 - Usuário Cadastra Trechos pelo Mapa]])" e acrescentar a seção "Regras da geometria": 2 a 200 pontos; latitude entre -90 e 90, longitude entre -180 e 180; comprimento de 5 m a 5.000 m; erro `400` com `mensagem` no formato `geometria: <motivo>` (motivos exatos: "deve ter entre 2 e 200 pontos", "contém coordenada inválida", "é curta demais (mínimo 5 m)", "é longa demais (máximo 5000 m)").
- `Trecho.md` (banco): na linha de `geometria`, referenciar os limites acima (validação na API, não no banco).

- [ ] **Step 4: UX e ideias**

- `Mapa - UX.md`: documentar o modo de traçado: botão "Adicionar trecho" no cabeçalho; cliques viram vértices; linha tracejada azul-clara; "Desfazer ponto", "Limpar", "Cancelar"; painel com nome e região (sugerida pelo trecho mais próximo, travada quando há filtro); clique duplo conta um ponto; durante o traçado os trechos existentes não são selecionáveis; ao salvar, o trecho entra no mapa já selecionado e pronto para avaliar.
- `Ideias de UX.md`: registrar, sem prioridade: roteamento a pé para "grudar na rua" (exige ADR do provedor); arrastar e remover vértices do meio do traçado; criar região nova pela interface; aviso de trecho duplicado ou muito próximo de um existente; moderação de trechos criados; gravar o caminho andando (depende da privacidade, ver ADR-012); autor e edição do próprio trecho após o login.

- [ ] **Step 5: Sprint, tarefas, status e diário**

- `Sprint 03 - Avaliações e Índice.md`: acrescentar ao escopo o item "Usuário adiciona o próprio trecho (Fase 5)" como `[x]`, com links para a [[ADR-013 - Usuário Cadastra Trechos pelo Mapa]] e [[Mapa - UX]]; registrar na observação que esse item **entrou depois**, a pedido do Tech Lead em 2026-11-05, e que não constava no escopo de 2026-11-03.
- `Tarefas Concluídas.md`: linha datada "Usuário adiciona o próprio trecho (Sprint 03 Fase 5)".
- `Status do Projeto.md`: acrescentar o marco datado e, se a ADR ainda estiver `proposta`, listá-la em "O que está em aberto".
- Diário do dia (criar a partir de [[Template - Diário]] se não existir): o que foi feito, problemas encontrados, o que aprendeu, decisões e próximos passos.

- [ ] **Step 6: Verificar links e commitar no Vault**

Conferir que todo `[[wikilink]]` das notas alteradas resolve. Depois, em `C:\CLAUDE\PÉ-RÍMETRO`:
```bash
git add -- "00 - Sistema" "02 - Produto" "03 - UX-UI" "06 - Banco de Dados" "07 - API" "09 - Sprints" "10 - Tarefas" "12 - Decisões" "16 - Ideias" Diario
git status --short
git commit -m "Documenta o cadastro de trechos pelo usuario (Sprint 03 Fase 5)"
```
(Terminar a mensagem com a linha de coautoria definida na sessão. Não incluir arquivos alheios, como mudanças em `.obsidian/`.)
