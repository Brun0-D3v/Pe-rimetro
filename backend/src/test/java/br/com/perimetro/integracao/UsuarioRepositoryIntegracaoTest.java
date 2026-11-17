package br.com.perimetro.integracao;

import br.com.perimetro.IntegracaoBase;
import br.com.perimetro.entity.Perfil;
import br.com.perimetro.entity.Usuario;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class UsuarioRepositoryIntegracaoTest extends IntegracaoBase {

    @Test
    void salvaEBuscaPorEmailIgnorandoCaixa() {
        usuarioRepository.save(new Usuario("Ana", "ana@exemplo.com", "hash", Perfil.CIDADAO));

        assertThat(usuarioRepository.findByEmailIgnoreCase("ANA@Exemplo.com")).isPresent();
        assertThat(usuarioRepository.existsByEmailIgnoreCase("ana@EXEMPLO.com")).isTrue();
        assertThat(usuarioRepository.existsByEmailIgnoreCase("outra@exemplo.com")).isFalse();
    }

    @Test
    void preencheIdPerfilEDataDeCriacao() {
        Usuario salvo = usuarioRepository.save(new Usuario("Ana", "ana@exemplo.com", "hash", Perfil.ADMINISTRADOR));

        assertThat(salvo.getId()).isNotNull();
        assertThat(salvo.getPerfil()).isEqualTo(Perfil.ADMINISTRADOR);
        assertThat(salvo.getCriadoEm()).isNotNull();
    }

    @Test
    void rejeitaEmailDuplicadoMesmoComCaixaDiferente() {
        usuarioRepository.saveAndFlush(new Usuario("Ana", "ana@exemplo.com", "hash", Perfil.CIDADAO));

        assertThatThrownBy(() -> usuarioRepository.saveAndFlush(
                new Usuario("Outra Ana", "ANA@exemplo.com", "hash", Perfil.CIDADAO)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
