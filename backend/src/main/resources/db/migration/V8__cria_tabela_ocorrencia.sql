-- V8__cria_tabela_ocorrencia.sql
CREATE TABLE ocorrencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trecho_id UUID NOT NULL REFERENCES trecho(id) ON DELETE RESTRICT,
    usuario_id UUID REFERENCES usuario(id) ON DELETE SET NULL,
    categoria_id UUID NOT NULL REFERENCES categoria_ocorrencia(id),
    descricao VARCHAR(500),
    status VARCHAR(10) NOT NULL DEFAULT 'VISIVEL' CHECK (status IN ('VISIVEL', 'OCULTA')),
    moderada_por_id UUID REFERENCES usuario(id) ON DELETE SET NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ocorrencia_trecho_id ON ocorrencia(trecho_id);
CREATE INDEX idx_ocorrencia_status_criado_em ON ocorrencia(status, criado_em DESC);
CREATE INDEX idx_ocorrencia_usuario_id ON ocorrencia(usuario_id);
