package br.com.perimetro.repository;

import br.com.perimetro.entity.Avaliacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface AvaliacaoRepository extends JpaRepository<Avaliacao, UUID> {

    long countByTrechoId(UUID trechoId);

    @Query("""
            select avg(a.notaCalcada) as calcada,
                   avg(a.notaAcessibilidade) as acessibilidade,
                   avg(a.notaIluminacao) as iluminacao,
                   avg(a.notaArborizacao) as arborizacao,
                   avg(a.notaTravessias) as travessias,
                   avg(a.notaMobiliario) as mobiliario
            from Avaliacao a
            where a.trecho.id = :trechoId
            """)
    MediasPorDimensao mediasPorDimensao(@Param("trechoId") UUID trechoId);

    interface MediasPorDimensao {
        Double getCalcada();

        Double getAcessibilidade();

        Double getIluminacao();

        Double getArborizacao();

        Double getTravessias();

        Double getMobiliario();
    }
}
