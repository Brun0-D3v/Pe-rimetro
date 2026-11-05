package br.com.perimetro.integracao;

import br.com.perimetro.IntegracaoBase;
import br.com.perimetro.entity.Perfil;
import br.com.perimetro.dto.PontoDto;
import br.com.perimetro.dto.TrechoRequestDto;
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

        mockMvc.perform(post(URL, trecho.getId()).header("Authorization", autorizacao(Perfil.CIDADAO)).contentType(MediaType.APPLICATION_JSON)
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
        mockMvc.perform(post(URL, trecho.getId()).header("Authorization", autorizacao(Perfil.CIDADAO)).contentType(MediaType.APPLICATION_JSON)
                .content(corpo(10, 10, 10, 10, 10, 10))).andExpect(status().isCreated());

        mockMvc.perform(post(URL, trecho.getId()).header("Authorization", autorizacao(Perfil.CIDADAO)).contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(2, 2, 2, 2, 2, 2)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.trecho.indiceAtual").value(6.0))
                .andExpect(jsonPath("$.trecho.totalAvaliacoes").value(2))
                .andExpect(jsonPath("$.trecho.classificacao").value("MEDIO"));
    }

    @Test
    void trechoBemAvaliadoViraBom() throws Exception {
        Trecho trecho = novoTrecho(AtivoInativo.ATIVO);

        mockMvc.perform(post(URL, trecho.getId()).header("Authorization", autorizacao(Perfil.CIDADAO)).contentType(MediaType.APPLICATION_JSON)
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

        mockMvc.perform(post(URL, trecho.getId()).header("Authorization", autorizacao(Perfil.CIDADAO)).contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(5, 5, 5, 5, 5, 5)))
                .andExpect(status().isConflict());

        org.assertj.core.api.Assertions.assertThat(avaliacaoRepository.count()).isZero();
    }

    @Test
    void trechoCriadoPeloUsuarioPodeSerAvaliadoEmSeguida() throws Exception {
        Regiao regiao = regiaoRepository.save(new Regiao("Boa Viagem"));
        TrechoRequestDto novo = new TrechoRequestDto("Rua do usuário",
                List.of(new PontoDto(-8.1190, -34.9040), new PontoDto(-8.1200, -34.9050), new PontoDto(-8.1215, -34.9060)),
                -8.12, -34.905, regiao.getId(), null);
        String resposta = mockMvc.perform(post("/api/v1/trechos").header("Authorization", autorizacao(Perfil.CIDADAO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(novo)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.totalAvaliacoes").value(0))
                .andReturn().getResponse().getContentAsString();
        String id = objectMapper.readTree(resposta).get("id").asString();

        mockMvc.perform(post(URL, id).header("Authorization", autorizacao(Perfil.CIDADAO)).contentType(MediaType.APPLICATION_JSON).content(corpo(9, 9, 9, 9, 9, 9)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.trecho.classificacao").value("BOM"));
    }

    @Test
    void trechoInexistenteRetorna404() throws Exception {
        mockMvc.perform(post(URL, UUID.randomUUID()).header("Authorization", autorizacao(Perfil.CIDADAO)).contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(5, 5, 5, 5, 5, 5)))
                .andExpect(status().isNotFound());
    }

    @Test
    void notaForaDaFaixaRetorna400() throws Exception {
        Trecho trecho = novoTrecho(AtivoInativo.ATIVO);

        mockMvc.perform(post(URL, trecho.getId()).header("Authorization", autorizacao(Perfil.CIDADAO)).contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(11, 5, 5, 5, 5, 5)))
                .andExpect(status().isBadRequest());
    }
}
