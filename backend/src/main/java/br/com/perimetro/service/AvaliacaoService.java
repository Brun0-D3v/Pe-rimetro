package br.com.perimetro.service;

import br.com.perimetro.dto.AvaliacaoRequestDto;
import br.com.perimetro.dto.AvaliacaoResponseDto;
import br.com.perimetro.dto.TrechoResponseDto;
import br.com.perimetro.entity.AtivoInativo;
import br.com.perimetro.entity.Avaliacao;
import br.com.perimetro.entity.Trecho;
import br.com.perimetro.exception.TrechoInativoException;
import br.com.perimetro.exception.TrechoNaoEncontradoException;
import br.com.perimetro.repository.AvaliacaoRepository;
import br.com.perimetro.repository.AvaliacaoRepository.MediasPorDimensao;
import br.com.perimetro.repository.TrechoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class AvaliacaoService {

    private final AvaliacaoRepository avaliacaoRepository;
    private final TrechoRepository trechoRepository;

    public AvaliacaoService(AvaliacaoRepository avaliacaoRepository, TrechoRepository trechoRepository) {
        this.avaliacaoRepository = avaliacaoRepository;
        this.trechoRepository = trechoRepository;
    }

    @Transactional
    public AvaliacaoResponseDto criar(UUID trechoId, AvaliacaoRequestDto dto) {
        Trecho trecho = trechoRepository.buscarParaAtualizacao(trechoId)
                .orElseThrow(() -> new TrechoNaoEncontradoException("Trecho não encontrado: " + trechoId));
        if (trecho.getStatus() == AtivoInativo.INATIVO) {
            throw new TrechoInativoException("Trecho inativo não pode ser avaliado: " + trechoId);
        }

        Avaliacao avaliacao = avaliacaoRepository.save(new Avaliacao(
                trecho,
                dto.getNotaCalcada(),
                dto.getNotaAcessibilidade(),
                dto.getNotaIluminacao(),
                dto.getNotaArborizacao(),
                dto.getNotaTravessias(),
                dto.getNotaMobiliario()));

        // Recalcula a partir de todas as avaliações (idempotente), com o trecho travado.
        MediasPorDimensao medias = avaliacaoRepository.mediasPorDimensao(trechoId);
        BigDecimal indice = CalculadoraIndice.indice(
                medias.getCalcada(),
                medias.getAcessibilidade(),
                medias.getIluminacao(),
                medias.getArborizacao(),
                medias.getTravessias(),
                medias.getMobiliario());
        int total = (int) avaliacaoRepository.countByTrechoId(trechoId);
        trecho.registrarIndice(indice, total);
        trechoRepository.save(trecho);

        return new AvaliacaoResponseDto(avaliacao, TrechoResponseDto.de(trecho));
    }
}
