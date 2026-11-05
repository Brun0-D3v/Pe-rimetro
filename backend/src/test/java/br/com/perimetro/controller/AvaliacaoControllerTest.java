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
