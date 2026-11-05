package br.com.perimetro.service;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class CalculadoraIndiceTest {

    @Test
    void todasAsNotasDezDaoDez() {
        assertThat(CalculadoraIndice.indice(10, 10, 10, 10, 10, 10)).isEqualByComparingTo("10.00");
    }

    @Test
    void todasAsNotasZeroDaoZero() {
        assertThat(CalculadoraIndice.indice(0, 0, 0, 0, 0, 0)).isEqualByComparingTo("0.00");
    }

    @Test
    void aplicaOsPesosDecididos() {
        // 8*0.25 + 6*0.25 + 4*0.15 + 2*0.15 + 0*0.10 + 10*0.10 = 5.40
        assertThat(CalculadoraIndice.indice(8, 6, 4, 2, 0, 10)).isEqualByComparingTo("5.40");
    }

    @Test
    void aceitaMediasFracionarias() {
        // 7.5*0.25 + 7.5*0.25 + 5*0.15 + 5*0.15 + 2.5*0.10 + 2.5*0.10 = 5.75
        assertThat(CalculadoraIndice.indice(7.5, 7.5, 5, 5, 2.5, 2.5)).isEqualByComparingTo("5.75");
    }

    @Test
    void resultadoTemDuasCasasDecimais() {
        BigDecimal resultado = CalculadoraIndice.indice(7, 7, 7, 7, 7, 7);
        assertThat(resultado.scale()).isEqualTo(2);
    }

    @Test
    void osPesosSomamUm() {
        BigDecimal soma = CalculadoraIndice.PESO_CALCADA
                .add(CalculadoraIndice.PESO_ACESSIBILIDADE)
                .add(CalculadoraIndice.PESO_ILUMINACAO)
                .add(CalculadoraIndice.PESO_ARBORIZACAO)
                .add(CalculadoraIndice.PESO_TRAVESSIAS)
                .add(CalculadoraIndice.PESO_MOBILIARIO);
        assertThat(soma).isEqualByComparingTo("1.00");
    }
}
