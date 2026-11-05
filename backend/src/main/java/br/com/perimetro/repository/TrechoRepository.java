package br.com.perimetro.repository;

import br.com.perimetro.entity.Trecho;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TrechoRepository extends JpaRepository<Trecho, UUID> {

    List<Trecho> findByRegiaoId(UUID regiaoId);

    // Trava a linha do trecho até o fim da transação, para que duas avaliações
    // simultâneas não se atropelem ao recalcular o índice.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Trecho t where t.id = :id")
    Optional<Trecho> buscarParaAtualizacao(@Param("id") UUID id);
}
