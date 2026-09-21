package br.com.perimetro.controller;

import br.com.perimetro.dto.RegiaoRequestDto;
import br.com.perimetro.dto.RegiaoResponseDto;
import br.com.perimetro.exception.RegiaoNaoEncontradaException;
import br.com.perimetro.service.RegiaoService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
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

    @TestConfiguration
    static class TestConfig {
        @Bean
        ObjectMapper objectMapper() {
            return new ObjectMapper();
        }
    }

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
