package br.com.perimetro.dto;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

public class PaginaDto<T> {

    private final List<T> itens;
    private final int pagina;
    private final int tamanho;
    private final long total;

    public PaginaDto(List<T> itens, int pagina, int tamanho, long total) {
        this.itens = itens;
        this.pagina = pagina;
        this.tamanho = tamanho;
        this.total = total;
    }

    public static <E, T> PaginaDto<T> de(Page<E> pagina, Function<E, T> conversor) {
        return new PaginaDto<>(
                pagina.getContent().stream().map(conversor).toList(),
                pagina.getNumber(),
                pagina.getSize(),
                pagina.getTotalElements());
    }

    public List<T> getItens() {
        return itens;
    }

    public int getPagina() {
        return pagina;
    }

    public int getTamanho() {
        return tamanho;
    }

    public long getTotal() {
        return total;
    }
}
