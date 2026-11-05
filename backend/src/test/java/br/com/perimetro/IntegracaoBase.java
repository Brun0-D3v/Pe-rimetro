package br.com.perimetro;

import br.com.perimetro.repository.AvaliacaoRepository;
import br.com.perimetro.repository.RegiaoRepository;
import br.com.perimetro.repository.TrechoRepository;
import br.com.perimetro.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

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
    protected UsuarioRepository usuarioRepository;

    @BeforeEach
    void limparBanco() {
        avaliacaoRepository.deleteAll();
        trechoRepository.deleteAll();
        regiaoRepository.deleteAll();
        usuarioRepository.deleteAll();
    }
}
