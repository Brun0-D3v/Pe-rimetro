package br.com.perimetro.service;

import br.com.perimetro.dto.TrechoRequestDto;
import br.com.perimetro.dto.TrechoResponseDto;
import br.com.perimetro.entity.AtivoInativo;
import br.com.perimetro.entity.Regiao;
import br.com.perimetro.entity.Trecho;
import br.com.perimetro.exception.RegiaoNaoEncontradaException;
import br.com.perimetro.exception.TrechoNaoEncontradoException;
import br.com.perimetro.repository.RegiaoRepository;
import br.com.perimetro.repository.TrechoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class TrechoService {

    private final TrechoRepository trechoRepository;
    private final RegiaoRepository regiaoRepository;

    public TrechoService(TrechoRepository trechoRepository, RegiaoRepository regiaoRepository) {
        this.trechoRepository = trechoRepository;
        this.regiaoRepository = regiaoRepository;
    }

    @Transactional(readOnly = true)
    public List<TrechoResponseDto> listar(UUID regiaoId) {
        List<Trecho> trechos = regiaoId != null
                ? trechoRepository.findByRegiaoId(regiaoId)
                : trechoRepository.findAll();
        return trechos.stream().map(this::paraDto).toList();
    }

    @Transactional(readOnly = true)
    public TrechoResponseDto buscarPorId(UUID id) {
        return paraDto(buscarEntidadePorId(id));
    }

    @Transactional
    public TrechoResponseDto criar(TrechoRequestDto dto) {
        Regiao regiao = buscarRegiao(dto.getRegiaoId());
        AtivoInativo status = dto.getStatus() != null ? dto.getStatus() : AtivoInativo.ATIVO;
        Trecho trecho = new Trecho(dto.getNome(), dto.getGeometria(), dto.getLatitude(), dto.getLongitude(), status, regiao);
        return paraDto(trechoRepository.save(trecho));
    }

    @Transactional
    public TrechoResponseDto atualizar(UUID id, TrechoRequestDto dto) {
        Trecho trecho = buscarEntidadePorId(id);
        Regiao regiao = buscarRegiao(dto.getRegiaoId());
        AtivoInativo status = dto.getStatus() != null ? dto.getStatus() : AtivoInativo.ATIVO;
        trecho.setNome(dto.getNome());
        trecho.setGeometria(dto.getGeometria());
        trecho.setLatitude(dto.getLatitude());
        trecho.setLongitude(dto.getLongitude());
        trecho.setStatus(status);
        trecho.setRegiao(regiao);
        return paraDto(trechoRepository.save(trecho));
    }

    @Transactional
    public void deletar(UUID id) {
        if (!trechoRepository.existsById(id)) {
            throw new TrechoNaoEncontradoException("Trecho não encontrado: " + id);
        }
        trechoRepository.deleteById(id);
    }

    private Trecho buscarEntidadePorId(UUID id) {
        return trechoRepository.findById(id)
                .orElseThrow(() -> new TrechoNaoEncontradoException("Trecho não encontrado: " + id));
    }

    private Regiao buscarRegiao(UUID regiaoId) {
        return regiaoRepository.findById(regiaoId)
                .orElseThrow(() -> new RegiaoNaoEncontradaException("Região não encontrada: " + regiaoId));
    }

    private TrechoResponseDto paraDto(Trecho trecho) {
        return new TrechoResponseDto(
                trecho.getId(),
                trecho.getNome(),
                trecho.getGeometria(),
                trecho.getLatitude(),
                trecho.getLongitude(),
                trecho.getIndiceAtual(),
                trecho.getStatus(),
                trecho.getRegiao().getId()
        );
    }
}
