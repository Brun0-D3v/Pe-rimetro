package br.com.perimetro.integracao;

import br.com.perimetro.IntegracaoBase;
import br.com.perimetro.entity.Perfil;
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
        String resposta = mockMvc.perform(post("/api/v1/trechos").header("Authorization", autorizacao(Perfil.CIDADAO))
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
    void rejeitaTrechoComGeometriaLongaDemaisEExplicaOMotivo() throws Exception {
        Regiao regiao = regiaoRepository.save(new Regiao("Recife Antigo"));
        TrechoRequestDto corpo = new TrechoRequestDto("Rua enorme",
                List.of(new PontoDto(-8.00, -34.87), new PontoDto(-8.06, -34.87)),
                -8.03, -34.87, regiao.getId(), null);

        mockMvc.perform(post("/api/v1/trechos").header("Authorization", autorizacao(Perfil.CIDADAO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(corpo)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value(org.hamcrest.Matchers.containsString("geometria: é longa demais")));
    }

    @Test
    void naoPermiteRemoverRegiaoComTrechosVinculados() throws Exception {
        Regiao regiao = regiaoRepository.save(new Regiao("Recife Antigo"));
        criarTrechoViaApi(regiao);

        mockMvc.perform(delete("/api/v1/regioes/{id}", regiao.getId()).header("Authorization", autorizacao(Perfil.ADMINISTRADOR)))
                .andExpect(status().isConflict());
    }
}
