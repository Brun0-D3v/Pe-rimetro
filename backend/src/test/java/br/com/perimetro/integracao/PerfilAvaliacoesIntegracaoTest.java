package br.com.perimetro.integracao;

import br.com.perimetro.IntegracaoBase;
import br.com.perimetro.dto.PontoDto;
import br.com.perimetro.entity.AtivoInativo;
import br.com.perimetro.entity.Avaliacao;
import br.com.perimetro.entity.Perfil;
import br.com.perimetro.entity.Regiao;
import br.com.perimetro.entity.Trecho;
import br.com.perimetro.entity.Usuario;
import br.com.perimetro.service.TokenService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PerfilAvaliacoesIntegracaoTest extends IntegracaoBase {

    @Autowired
    private TokenService tokenService;

    private Trecho trecho(String nome) {
        Regiao regiao = regiaoRepository.findAll().stream().findFirst()
                .orElseGet(() -> regiaoRepository.save(new Regiao("Recife Antigo")));
        return trechoRepository.save(new Trecho(
                nome, List.of(new PontoDto(-8.06, -34.87)), -8.06, -34.87, AtivoInativo.ATIVO, regiao));
    }

    private Usuario usuario(String email) {
        return usuarioRepository.save(new Usuario("Ana", email, "hash", Perfil.CIDADAO));
    }

    private String bearer(Usuario usuario) {
        return "Bearer " + tokenService.gerar(usuario).getToken();
    }

    private Avaliacao avaliar(Trecho trecho, Usuario autor, int... notas) {
        Avaliacao avaliacao = new Avaliacao(trecho, notas[0], notas[1], notas[2], notas[3], notas[4], notas[5]);
        avaliacao.registrarAutor(autor == null ? null : autor.getId());
        return avaliacaoRepository.save(avaliacao);
    }

    @Test
    void listaSoAsAvaliacoesDoProprioUsuario() throws Exception {
        Usuario ana = usuario("ana@exemplo.com");
        Usuario bia = usuario("bia@exemplo.com");
        Trecho aurora = trecho("Rua da Aurora");
        avaliar(aurora, ana, 8, 6, 4, 2, 0, 10);
        avaliar(aurora, bia, 10, 10, 10, 10, 10, 10);
        avaliar(aurora, null, 1, 1, 1, 1, 1, 1);

        mockMvc.perform(get("/api/v1/usuarios/me/avaliacoes").header("Authorization", bearer(ana)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.itens.length()").value(1))
                .andExpect(jsonPath("$.itens[0].trechoNome").value("Rua da Aurora"))
                .andExpect(jsonPath("$.itens[0].trechoId").value(aurora.getId().toString()))
                .andExpect(jsonPath("$.itens[0].notaCalcada").value(8))
                .andExpect(jsonPath("$.itens[0].notaMobiliario").value(10));
    }

    @Test
    void oIndiceDaAvaliacaoEOCalculoPonderadoDasSeisNotas() throws Exception {
        Usuario ana = usuario("ana@exemplo.com");
        avaliar(trecho("Rua da Aurora"), ana, 8, 6, 4, 2, 0, 10);

        // 8*0,25 + 6*0,25 + 4*0,15 + 2*0,15 + 0*0,10 + 10*0,10 = 5,4
        mockMvc.perform(get("/api/v1/usuarios/me/avaliacoes").header("Authorization", bearer(ana)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itens[0].indice").value(5.4))
                .andExpect(jsonPath("$.itens[0].classificacao").value("MEDIO"))
                .andExpect(jsonPath("$.itens[0].criadoEm").isNotEmpty());
    }

    @Test
    void trazOIndiceAtualDoTrechoAoLado() throws Exception {
        Usuario ana = usuario("ana@exemplo.com");
        Usuario bia = usuario("bia@exemplo.com");
        Trecho aurora = trecho("Rua da Aurora");
        // Duas avaliações pela API para o índice do trecho ser calculado de verdade.
        String corpo = "{\"notaCalcada\":10,\"notaAcessibilidade\":10,\"notaIluminacao\":10,"
                + "\"notaArborizacao\":10,\"notaTravessias\":10,\"notaMobiliario\":10}";
        String corpoRuim = corpo.replace("10", "0");
        mockMvc.perform(post("/api/v1/trechos/{id}/avaliacoes", aurora.getId())
                        .header("Authorization", bearer(ana)).contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/v1/trechos/{id}/avaliacoes", aurora.getId())
                        .header("Authorization", bearer(bia)).contentType(MediaType.APPLICATION_JSON).content(corpoRuim))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/usuarios/me/avaliacoes").header("Authorization", bearer(ana)))
                .andExpect(jsonPath("$.itens[0].indice").value(10.0))
                .andExpect(jsonPath("$.itens[0].indiceAtualDoTrecho").value(5.0));
    }

    @Test
    void ordenaDasMaisRecentesParaAsMaisAntigas() throws Exception {
        Usuario ana = usuario("ana@exemplo.com");
        avaliar(trecho("Primeiro"), ana, 5, 5, 5, 5, 5, 5);
        Thread.sleep(5);
        avaliar(trecho("Segundo"), ana, 5, 5, 5, 5, 5, 5);

        mockMvc.perform(get("/api/v1/usuarios/me/avaliacoes").header("Authorization", bearer(ana)))
                .andExpect(jsonPath("$.itens[0].trechoNome").value("Segundo"))
                .andExpect(jsonPath("$.itens[1].trechoNome").value("Primeiro"));
    }

    @Test
    void paginaEImpoeOLimiteDeCinquentaPorPagina() throws Exception {
        Usuario ana = usuario("ana@exemplo.com");
        Trecho aurora = trecho("Rua da Aurora");
        for (int i = 0; i < 3; i++) {
            avaliar(aurora, ana, 5, 5, 5, 5, 5, 5);
        }

        mockMvc.perform(get("/api/v1/usuarios/me/avaliacoes?pagina=1&tamanho=2").header("Authorization", bearer(ana)))
                .andExpect(jsonPath("$.total").value(3))
                .andExpect(jsonPath("$.pagina").value(1))
                .andExpect(jsonPath("$.itens.length()").value(1));
        mockMvc.perform(get("/api/v1/usuarios/me/avaliacoes?tamanho=500").header("Authorization", bearer(ana)))
                .andExpect(jsonPath("$.tamanho").value(50));
        mockMvc.perform(get("/api/v1/usuarios/me/avaliacoes?pagina=-3&tamanho=0").header("Authorization", bearer(ana)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pagina").value(0))
                .andExpect(jsonPath("$.tamanho").value(1));
    }

    @Test
    void semAvaliacoesDevolveListaVazia() throws Exception {
        Usuario ana = usuario("ana@exemplo.com");

        mockMvc.perform(get("/api/v1/usuarios/me/avaliacoes").header("Authorization", bearer(ana)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(0))
                .andExpect(jsonPath("$.itens.length()").value(0));
    }

    @Test
    void resumoContaSoAsAvaliacoesDoUsuario() throws Exception {
        Usuario ana = usuario("ana@exemplo.com");
        Usuario bia = usuario("bia@exemplo.com");
        Trecho aurora = trecho("Rua da Aurora");
        avaliar(aurora, ana, 5, 5, 5, 5, 5, 5);
        avaliar(aurora, ana, 6, 6, 6, 6, 6, 6);
        avaliar(aurora, bia, 7, 7, 7, 7, 7, 7);
        avaliar(aurora, null, 8, 8, 8, 8, 8, 8);

        mockMvc.perform(get("/api/v1/usuarios/me/resumo").header("Authorization", bearer(ana)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAvaliacoes").value(2));
    }

    @Test
    void exigeLogin() throws Exception {
        mockMvc.perform(get("/api/v1/usuarios/me/avaliacoes")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/usuarios/me/resumo")).andExpect(status().isUnauthorized());
    }
}
