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
