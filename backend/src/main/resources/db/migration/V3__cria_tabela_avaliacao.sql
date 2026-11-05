CREATE TABLE avaliacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trecho_id UUID NOT NULL REFERENCES trecho(id) ON DELETE RESTRICT,
    usuario_id UUID,
    nota_calcada SMALLINT NOT NULL CHECK (nota_calcada BETWEEN 0 AND 10),
    nota_acessibilidade SMALLINT NOT NULL CHECK (nota_acessibilidade BETWEEN 0 AND 10),
    nota_iluminacao SMALLINT NOT NULL CHECK (nota_iluminacao BETWEEN 0 AND 10),
    nota_arborizacao SMALLINT NOT NULL CHECK (nota_arborizacao BETWEEN 0 AND 10),
    nota_travessias SMALLINT NOT NULL CHECK (nota_travessias BETWEEN 0 AND 10),
    nota_mobiliario SMALLINT NOT NULL CHECK (nota_mobiliario BETWEEN 0 AND 10),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_avaliacao_trecho_id ON avaliacao(trecho_id);
