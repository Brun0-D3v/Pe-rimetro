package br.com.perimetro.repository;

import br.com.perimetro.entity.Ocorrencia;
import br.com.perimetro.entity.StatusOcorrencia;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface OcorrenciaRepository extends JpaRepository<Ocorrencia, UUID> {

    @EntityGraph(attributePaths = {"trecho", "categoria"})
    Page<Ocorrencia> findByTrechoIdAndStatus(UUID trechoId, StatusOcorrencia status, Pageable pageable);

    @EntityGraph(attributePaths = {"trecho", "categoria"})
    Page<Ocorrencia> findByUsuarioId(UUID usuarioId, Pageable pageable);

    @EntityGraph(attributePaths = {"trecho", "categoria"})
    Page<Ocorrencia> findByUsuarioIdAndStatus(UUID usuarioId, StatusOcorrencia status, Pageable pageable);

    @EntityGraph(attributePaths = {"trecho", "categoria"})
    @Query("""
            select o from Ocorrencia o
            where (:status is null or o.status = :status)
              and (:moderador is null or o.moderadaPorId = :moderador)
            """)
    Page<Ocorrencia> buscarParaModeracao(@Param("status") StatusOcorrencia status,
                                         @Param("moderador") UUID moderador, Pageable pageable);

    @Query("select o.trecho.id as trechoId, count(o) as total from Ocorrencia o "
            + "where o.status = br.com.perimetro.entity.StatusOcorrencia.VISIVEL group by o.trecho.id")
    List<ContagemPorTrecho> contarVisiveisPorTrecho();

    long countByUsuarioId(UUID usuarioId);

    interface ContagemPorTrecho {
        UUID getTrechoId();

        long getTotal();
    }
}
