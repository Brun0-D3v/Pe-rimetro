package br.com.perimetro.entity;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class ClassificacaoTest {

    @Test
    void indiceNuloNaoTemClassificacao() {
        assertThat(Classificacao.de(null)).isNull();
    }

    @Test
    void zeroERuim() {
        assertThat(Classificacao.de(new BigDecimal("0.00"))).isEqualTo(Classificacao.RUIM);
    }

    @Test
    void abaixoDeQuatroERuim() {
        assertThat(Classificacao.de(new BigDecimal("3.94"))).isEqualTo(Classificacao.RUIM);
    }

    @Test
    void quatroEMedio() {
        assertThat(Classificacao.de(new BigDecimal("4.00"))).isEqualTo(Classificacao.MEDIO);
    }

    @Test
    void valorQueArredondaParaQuatroEMedio() {
        assertThat(Classificacao.de(new BigDecimal("3.95"))).isEqualTo(Classificacao.MEDIO);
    }

    @Test
    void seisVirgulaNoveEMedio() {
        assertThat(Classificacao.de(new BigDecimal("6.94"))).isEqualTo(Classificacao.MEDIO);
    }

    @Test
    void valorQueArredondaParaSeteEBom() {
        assertThat(Classificacao.de(new BigDecimal("6.95"))).isEqualTo(Classificacao.BOM);
    }

    @Test
    void seteEBom() {
        assertThat(Classificacao.de(new BigDecimal("7.00"))).isEqualTo(Classificacao.BOM);
    }

    @Test
    void dezEBom() {
        assertThat(Classificacao.de(new BigDecimal("10.00"))).isEqualTo(Classificacao.BOM);
    }
}
