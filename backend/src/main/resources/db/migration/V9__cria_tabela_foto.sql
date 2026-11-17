-- V9__cria_tabela_foto.sql
CREATE TABLE foto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ocorrencia_id UUID NOT NULL REFERENCES ocorrencia(id) ON DELETE CASCADE,
    arquivo VARCHAR(80) NOT NULL UNIQUE,
    tipo_conteudo VARCHAR(30) NOT NULL,
    tamanho_bytes BIGINT NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_foto_ocorrencia_id ON foto(ocorrencia_id);
