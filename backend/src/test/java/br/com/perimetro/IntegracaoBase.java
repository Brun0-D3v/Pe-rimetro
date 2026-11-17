package br.com.perimetro;

import br.com.perimetro.entity.Perfil;
import br.com.perimetro.entity.Usuario;
import br.com.perimetro.repository.AvaliacaoRepository;
import br.com.perimetro.repository.FotoRepository;
import br.com.perimetro.repository.OcorrenciaRepository;
import br.com.perimetro.repository.RegiaoRepository;
import br.com.perimetro.repository.TrechoRepository;
import br.com.perimetro.repository.UsuarioRepository;
import br.com.perimetro.service.TokenService;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.util.UUID;

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

    @Autowired
    protected AvaliacaoRepository avaliacaoRepository;

    @Autowired
    protected OcorrenciaRepository ocorrenciaRepository;

    @Autowired
    protected FotoRepository fotoRepository;

    @Autowired
    protected UsuarioRepository usuarioRepository;

    @Autowired
    private TokenService tokenService;

    /** Cria um usuário com o perfil e devolve o valor do cabeçalho Authorization ("Bearer ..."). */
    protected String autorizacao(Perfil perfil) {
        Usuario usuario = usuarioRepository.save(new Usuario(
                "Usuário " + perfil, perfil.name().toLowerCase() + "-" + UUID.randomUUID() + "@teste.com", "hash-qualquer", perfil));
        return "Bearer " + tokenService.gerar(usuario).getToken();
    }

    @BeforeEach
    void limparBanco() {
        fotoRepository.deleteAll();
        ocorrenciaRepository.deleteAll();
        avaliacaoRepository.deleteAll();
        trechoRepository.deleteAll();
        regiaoRepository.deleteAll();
        usuarioRepository.deleteAll();
    }
}
