package br.com.perimetro.integracao;

import br.com.perimetro.IntegracaoBase;
import br.com.perimetro.dto.PontoDto;
import br.com.perimetro.entity.AtivoInativo;
import br.com.perimetro.entity.Perfil;
import br.com.perimetro.entity.Regiao;
import br.com.perimetro.entity.Trecho;
import br.com.perimetro.repository.CategoriaOcorrenciaRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FotoIntegracaoTest extends IntegracaoBase {

    private static final byte[] PNG = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0};
    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 0, 0, 0};

    @Autowired
    private CategoriaOcorrenciaRepository categoriaRepository;

    private MockMultipartFile arquivo(byte[] conteudo, String nome, String tipo) {
        return new MockMultipartFile("arquivo", nome, tipo, conteudo);
    }

    private UUID criarOcorrencia(String autorizacao) throws Exception {
        Regiao regiao = regiaoRepository.save(new Regiao("Recife Antigo"));
        Trecho trecho = trechoRepository.save(new Trecho(
                "Rua da Aurora", List.of(new PontoDto(-8.06, -34.87)), -8.06, -34.87, AtivoInativo.ATIVO, regiao));
        UUID categoria = categoriaRepository.findAllByOrderByNomeAsc().get(0).getId();
        String resposta = mockMvc.perform(post("/api/v1/trechos/{id}/ocorrencias", trecho.getId())
                        .header("Authorization", autorizacao)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"categoriaId\":\"" + categoria + "\",\"descricao\":\"x\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return UUID.fromString(objectMapper.readTree(resposta).get("id").asText());
    }

    private String enviarFoto(UUID ocorrenciaId, String autorizacao, byte[] conteudo) throws Exception {
        String resposta = mockMvc.perform(multipart("/api/v1/ocorrencias/{id}/fotos", ocorrenciaId)
                        .file(arquivo(conteudo, "foto.png", "image/png")).header("Authorization", autorizacao))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(resposta).get("id").asText();
    }

    private void ocultar(UUID ocorrenciaId, String admin) throws Exception {
        mockMvc.perform(patch("/api/v1/ocorrencias/{id}", ocorrenciaId)
                        .header("Authorization", admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"OCULTA\"}"))
                .andExpect(status().isOk());
    }

    private static List<Path> arquivosNoDisco() throws IOException {
        try (Stream<Path> arquivos = Files.list(PASTA_UPLOAD)) {
            return arquivos.toList();
        }
    }

    @Test
    void donoEnviaPngEleApareceEPodeSerBaixadoPorAnonimo() throws Exception {
        String dono = autorizacao(Perfil.CIDADAO);
        UUID ocorrenciaId = criarOcorrencia(dono);

        String resposta = mockMvc.perform(multipart("/api/v1/ocorrencias/{id}/fotos", ocorrenciaId)
                        .file(arquivo(PNG, "foto.png", "image/png")).header("Authorization", dono))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andReturn().getResponse().getContentAsString();
        String fotoId = objectMapper.readTree(resposta).get("id").asText();

        mockMvc.perform(get("/api/v1/fotos/{id}", fotoId))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "image/png"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"));
    }

    @Test
    void textoDisfarcadoDePngRetorna400ESemArquivoNoDisco() throws Exception {
        String dono = autorizacao(Perfil.CIDADAO);
        UUID ocorrenciaId = criarOcorrencia(dono);
        int antes = arquivosNoDisco().size();

        mockMvc.perform(multipart("/api/v1/ocorrencias/{id}/fotos", ocorrenciaId)
                        .file(arquivo("não sou imagem".getBytes(StandardCharsets.UTF_8), "foto.png", "image/png"))
                        .header("Authorization", dono))
                .andExpect(status().isBadRequest());

        assertThat(arquivosNoDisco()).hasSize(antes);
    }

    @Test
    void nomeMaliciosoNaoInfluenciaOArquivoNoDisco() throws Exception {
        String dono = autorizacao(Perfil.CIDADAO);
        UUID ocorrenciaId = criarOcorrencia(dono);
        List<Path> antes = arquivosNoDisco();

        mockMvc.perform(multipart("/api/v1/ocorrencias/{id}/fotos", ocorrenciaId)
                        .file(arquivo(PNG, "../../etc/passwd.png", "image/png"))
                        .header("Authorization", dono))
                .andExpect(status().isCreated());

        List<Path> novos = arquivosNoDisco().stream().filter(p -> !antes.contains(p)).toList();
        assertThat(novos).hasSize(1);
        assertThat(novos.get(0).getFileName().toString()).matches("[0-9a-f-]{36}\\.png");
        assertThat(novos.get(0).getParent()).isEqualTo(PASTA_UPLOAD);
    }

    @Test
    void tipoInformadoQueMenteEIgnorado() throws Exception {
        String dono = autorizacao(Perfil.CIDADAO);
        UUID ocorrenciaId = criarOcorrencia(dono);

        String resposta = mockMvc.perform(multipart("/api/v1/ocorrencias/{id}/fotos", ocorrenciaId)
                        .file(arquivo(JPEG, "foto.png", "image/png")).header("Authorization", dono))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String fotoId = objectMapper.readTree(resposta).get("id").asText();

        mockMvc.perform(get("/api/v1/fotos/{id}", fotoId))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "image/jpeg"));
    }

    @Test
    void arquivoVazioRetorna400() throws Exception {
        String dono = autorizacao(Perfil.CIDADAO);
        UUID ocorrenciaId = criarOcorrencia(dono);

        mockMvc.perform(multipart("/api/v1/ocorrencias/{id}/fotos", ocorrenciaId)
                        .file(arquivo(new byte[0], "foto.png", "image/png")).header("Authorization", dono))
                .andExpect(status().isBadRequest());
    }

    @Test
    void arquivoAcimaDe5MbRetorna413() throws Exception {
        String dono = autorizacao(Perfil.CIDADAO);
        UUID ocorrenciaId = criarOcorrencia(dono);
        byte[] grande = new byte[5 * 1024 * 1024 + 1];
        System.arraycopy(PNG, 0, grande, 0, PNG.length);

        mockMvc.perform(multipart("/api/v1/ocorrencias/{id}/fotos", ocorrenciaId)
                        .file(arquivo(grande, "foto.png", "image/png")).header("Authorization", dono))
                .andExpect(status().isPayloadTooLarge())
                .andExpect(jsonPath("$.mensagem").value("A foto deve ter no máximo 5 MB"));
    }

    @Test
    void quartaFotoRetorna409() throws Exception {
        String dono = autorizacao(Perfil.CIDADAO);
        UUID ocorrenciaId = criarOcorrencia(dono);
        for (int i = 0; i < 3; i++) {
            enviarFoto(ocorrenciaId, dono, PNG);
        }

        mockMvc.perform(multipart("/api/v1/ocorrencias/{id}/fotos", ocorrenciaId)
                        .file(arquivo(PNG, "foto.png", "image/png")).header("Authorization", dono))
                .andExpect(status().isConflict());
    }

    @Test
    void outroCidadaoNaoEnvia() throws Exception {
        UUID ocorrenciaId = criarOcorrencia(autorizacao(Perfil.CIDADAO));

        mockMvc.perform(multipart("/api/v1/ocorrencias/{id}/fotos", ocorrenciaId)
                        .file(arquivo(PNG, "foto.png", "image/png"))
                        .header("Authorization", autorizacao(Perfil.CIDADAO)))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminEnviaNaOcorrenciaDeOutro() throws Exception {
        UUID ocorrenciaId = criarOcorrencia(autorizacao(Perfil.CIDADAO));

        mockMvc.perform(multipart("/api/v1/ocorrencias/{id}/fotos", ocorrenciaId)
                        .file(arquivo(PNG, "foto.png", "image/png"))
                        .header("Authorization", autorizacao(Perfil.ADMINISTRADOR)))
                .andExpect(status().isCreated());
    }

    @Test
    void donoNaoEnviaEmOcorrenciaOculta() throws Exception {
        String dono = autorizacao(Perfil.CIDADAO);
        UUID ocorrenciaId = criarOcorrencia(dono);
        ocultar(ocorrenciaId, autorizacao(Perfil.ADMINISTRADOR));

        mockMvc.perform(multipart("/api/v1/ocorrencias/{id}/fotos", ocorrenciaId)
                        .file(arquivo(PNG, "foto.png", "image/png")).header("Authorization", dono))
                .andExpect(status().isConflict());
    }

    @Test
    void anonimoNaoEnvia() throws Exception {
        UUID ocorrenciaId = criarOcorrencia(autorizacao(Perfil.CIDADAO));

        mockMvc.perform(multipart("/api/v1/ocorrencias/{id}/fotos", ocorrenciaId)
                        .file(arquivo(PNG, "foto.png", "image/png")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void fotoDeOcorrenciaVisivelTemCachePrivadoDe5Minutos() throws Exception {
        String dono = autorizacao(Perfil.CIDADAO);
        String fotoId = enviarFoto(criarOcorrencia(dono), dono, PNG);

        mockMvc.perform(get("/api/v1/fotos/{id}", fotoId))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", org.hamcrest.Matchers.allOf(
                        org.hamcrest.Matchers.containsString("private"),
                        org.hamcrest.Matchers.containsString("max-age=300"),
                        org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("public")))));
    }

    @Test
    void fotoDeOcorrenciaOcultaRetorna404ParaAnonimo() throws Exception {
        String dono = autorizacao(Perfil.CIDADAO);
        UUID ocorrenciaId = criarOcorrencia(dono);
        String fotoId = enviarFoto(ocorrenciaId, dono, PNG);
        ocultar(ocorrenciaId, autorizacao(Perfil.ADMINISTRADOR));

        mockMvc.perform(get("/api/v1/fotos/{id}", fotoId)).andExpect(status().isNotFound());
    }

    @Test
    void fotoDeOcorrenciaOcultaEVisivelParaDonoEAdmin() throws Exception {
        String dono = autorizacao(Perfil.CIDADAO);
        String admin = autorizacao(Perfil.ADMINISTRADOR);
        UUID ocorrenciaId = criarOcorrencia(dono);
        String fotoId = enviarFoto(ocorrenciaId, dono, PNG);
        ocultar(ocorrenciaId, admin);

        mockMvc.perform(get("/api/v1/fotos/{id}", fotoId).header("Authorization", dono))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"));
        mockMvc.perform(get("/api/v1/fotos/{id}", fotoId).header("Authorization", admin))
                .andExpect(status().isOk());
    }

    @Test
    void fotoDeOcorrenciaOcultaRetorna404ParaOutroCidadao() throws Exception {
        String dono = autorizacao(Perfil.CIDADAO);
        UUID ocorrenciaId = criarOcorrencia(dono);
        String fotoId = enviarFoto(ocorrenciaId, dono, PNG);
        ocultar(ocorrenciaId, autorizacao(Perfil.ADMINISTRADOR));

        mockMvc.perform(get("/api/v1/fotos/{id}", fotoId).header("Authorization", autorizacao(Perfil.CIDADAO)))
                .andExpect(status().isNotFound());
    }

    @Test
    void excluirOcorrenciaRemoveArquivosDoDisco() throws Exception {
        String dono = autorizacao(Perfil.CIDADAO);
        UUID ocorrenciaId = criarOcorrencia(dono);
        int antes = arquivosNoDisco().size();
        enviarFoto(ocorrenciaId, dono, PNG);
        enviarFoto(ocorrenciaId, dono, JPEG);
        assertThat(arquivosNoDisco()).hasSize(antes + 2);

        mockMvc.perform(delete("/api/v1/ocorrencias/{id}", ocorrenciaId).header("Authorization", dono))
                .andExpect(status().isNoContent());

        assertThat(arquivosNoDisco()).hasSize(antes);
    }

    @Test
    void fotoInexistenteRetorna404() throws Exception {
        mockMvc.perform(get("/api/v1/fotos/{id}", UUID.randomUUID())).andExpect(status().isNotFound());
    }
}
