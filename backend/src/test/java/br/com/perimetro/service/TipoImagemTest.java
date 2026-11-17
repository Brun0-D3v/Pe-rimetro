package br.com.perimetro.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TipoImagemTest {

    private static byte[] bytes(int... valores) {
        byte[] b = new byte[valores.length];
        for (int i = 0; i < valores.length; i++) b[i] = (byte) valores[i];
        return b;
    }

    @Test
    void detectaJpeg() {
        assertThat(TipoImagem.detectar(bytes(0xFF, 0xD8, 0xFF, 0xE0, 0, 0))).contains(TipoImagem.JPEG);
    }

    @Test
    void detectaPng() {
        assertThat(TipoImagem.detectar(bytes(0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A))).contains(TipoImagem.PNG);
    }

    @Test
    void detectaWebp() {
        byte[] webp = bytes('R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'E', 'B', 'P');
        assertThat(TipoImagem.detectar(webp)).contains(TipoImagem.WEBP);
    }

    @Test
    void textoDisfarcadoDeImagemNaoEDetectado() {
        assertThat(TipoImagem.detectar("<script>alert(1)</script>".getBytes())).isEmpty();
    }

    @Test
    void arquivoMuitoCurtoNaoEDetectado() {
        assertThat(TipoImagem.detectar(bytes(0xFF))).isEmpty();
    }
}
