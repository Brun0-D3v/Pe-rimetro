package br.com.perimetro.config;

import br.com.perimetro.entity.Perfil;
import br.com.perimetro.entity.Usuario;
import br.com.perimetro.repository.UsuarioRepository;
import br.com.perimetro.service.AutenticacaoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Cria o administrador inicial a partir de ADMIN_EMAIL e ADMIN_SENHA. O cadastro público nunca cria
 * administradores. Se as variáveis não existirem, nada é criado; se o e-mail já existir, nada muda.
 */
@Component
public class AdministradorInicial implements ApplicationRunner {

    private static final Logger LOGGER = LoggerFactory.getLogger(AdministradorInicial.class);

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String senha;

    public AdministradorInicial(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder,
                                @Value("${perimetro.admin.email:}") String email,
                                @Value("${perimetro.admin.senha:}") String senha) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.email = email;
        this.senha = senha;
    }

    @Override
    public void run(ApplicationArguments argumentos) {
        executar();
    }

    /** Devolve true se criou o administrador. */
    boolean executar() {
        if (email.isBlank() || senha.isBlank()) {
            LOGGER.info("ADMIN_EMAIL/ADMIN_SENHA não definidos: nenhum administrador inicial será criado.");
            return false;
        }
        String emailNormalizado = AutenticacaoService.normalizarEmail(email);
        if (usuarioRepository.existsByEmailIgnoreCase(emailNormalizado)) {
            return false;
        }
        usuarioRepository.save(new Usuario("Administrador", emailNormalizado,
                passwordEncoder.encode(senha), Perfil.ADMINISTRADOR));
        LOGGER.info("Administrador inicial criado: {}", emailNormalizado);
        return true;
    }
}
