CREATE TABLE system_health (
    id BIGSERIAL PRIMARY KEY,
    verificado_em TIMESTAMP NOT NULL
);

INSERT INTO system_health (verificado_em) VALUES (CURRENT_TIMESTAMP);
