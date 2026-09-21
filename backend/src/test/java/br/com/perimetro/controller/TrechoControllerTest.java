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
