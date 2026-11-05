package br.com.perimetro.config;

import br.com.perimetro.IntegracaoBase;
import br.com.perimetro.entity.Perfil;
import br.com.perimetro.entity.Usuario;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;

class AdministradorInicialIntegracaoTest extends IntegracaoBase {

    @Autowired
    private PasswordEncoder passwordEncoder;

    private AdministradorInicial com(String email, String senha) {
        return new AdministradorInicial(usuarioRepository, passwordEncoder, email, senha);
    }

    @Test
    void criaOAdministradorComSenhaEmHash() {
        boolean criou = com("Admin@Exemplo.com", "senha-do-admin").executar();

        assertThat(criou).isTrue();
        Usuario admin = usuarioRepository.findByEmailIgnoreCase("admin@exemplo.com").orElseThrow();
        assertThat(admin.getPerfil()).isEqualTo(Perfil.ADMINISTRADOR);
        assertThat(admin.getSenhaHash()).isNotEqualTo("senha-do-admin");
        assertThat(passwordEncoder.matches("senha-do-admin", admin.getSenhaHash())).isTrue();
    }

    @Test
    void naoCriaDeNovoQuandoOEmailJaExiste() {
        com("admin@exemplo.com", "senha-do-admin").executar();

        boolean criouDeNovo = com("admin@exemplo.com", "outra-senha").executar();

        assertThat(criouDeNovo).isFalse();
        assertThat(usuarioRepository.count()).isEqualTo(1);
        Usuario admin = usuarioRepository.findByEmailIgnoreCase("admin@exemplo.com").orElseThrow();
        assertThat(passwordEncoder.matches("senha-do-admin", admin.getSenhaHash())).isTrue();
    }

    @Test
    void naoCriaNadaSemAsVariaveis() {
        assertThat(com("", "").executar()).isFalse();
        assertThat(com("admin@exemplo.com", "").executar()).isFalse();
        assertThat(com("", "senha-do-admin").executar()).isFalse();
        assertThat(usuarioRepository.count()).isZero();
    }
}
