package br.com.perimetro.service;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Optional;

/** Tipos de imagem aceitos, detectados pela assinatura dos bytes (nunca pelo nome ou tipo informado). */
public enum TipoImagem {
    JPEG("image/jpeg", "jpg"), PNG("image/png", "png"), WEBP("image/webp", "webp");

    private final String contentType;
    private final String extensao;

    TipoImagem(String contentType, String extensao) {
        this.contentType = contentType;
        this.extensao = extensao;
    }

    public String contentType() {
        return contentType;
    }

    public String extensao() {
        return extensao;
    }

    public static Optional<TipoImagem> detectar(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return Optional.of(JPEG);
        }
        byte[] assinaturaPng = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
        if (b.length >= 8 && Arrays.equals(Arrays.copyOfRange(b, 0, 8), assinaturaPng)) {
            return Optional.of(PNG);
        }
        if (b.length >= 12
                && new String(b, 0, 4, StandardCharsets.US_ASCII).equals("RIFF")
                && new String(b, 8, 4, StandardCharsets.US_ASCII).equals("WEBP")) {
            return Optional.of(WEBP);
        }
        return Optional.empty();
    }
}
