/* Sistema_Acoes_ModeloLogico: */

CREATE TABLE usuario (
    id int PRIMARY KEY AUTO_INCREMENT,
    email varchar(320),
    senha_hash varchar(256),
    token_rec_senha varchar(320),
    numero_falhas_login int,
    ultima_hora_negociacao DATETIME,
    data_token_rec_senha DATETIME
);

CREATE TABLE ordem_venda (
    id int PRIMARY KEY AUTO_INCREMENT,
    fk_usuario_id int,
    data_hora DATETIME,
    ticker varchar(50),
    modo int,
    quantidade int,
    preco_referencia FLOAT,
    executada boolean,
    preco_execucao FLOAT,
    data_hora_execucao DATETIME
);

CREATE TABLE ordem_compra (
    id int PRIMARY KEY AUTO_INCREMENT,
    fk_usuario_id int,
    data_hora DATETIME,
    ticker varchar(50),
    quantidade int,
    modo int,
    preco_referencia FLOAT,
    executada BOOLEAN,
    preco_execucao FLOAT,
    data_hora_execucao DATETIME
);

CREATE TABLE lancamento_conta_corrente (
    id int AUTO_INCREMENT,
    fk_usuario_id int,
    historico JSON,
    valor FLOAT,
    data_hora DATETIME,
    PRIMARY KEY (id, fk_usuario_id)
);

CREATE TABLE acao_carteira (
    ticker varchar(50),
    fk_usuario_id int,
    qtde int,
    preco_compra FLOAT,
    qtde_vendida int,
    preco_venda FLOAT,
    PRIMARY KEY (ticker, fk_usuario_id)
);

CREATE TABLE acao_interesse (
    ticker varchar(50),
    fk_usuario_id int,
    ordem int,
    PRIMARY KEY (ticker, fk_usuario_id)
);
 
ALTER TABLE ordem_venda ADD CONSTRAINT FK_ordem_venda_2
    FOREIGN KEY (fk_usuario_id)
    REFERENCES usuario (id)
    ON DELETE CASCADE;
 
ALTER TABLE ordem_compra ADD CONSTRAINT FK_ordem_compra_2
    FOREIGN KEY (fk_usuario_id)
    REFERENCES usuario (id)
    ON DELETE CASCADE;
 
ALTER TABLE lancamento_conta_corrente ADD CONSTRAINT FK_lancamento_conta_corrente_2
    FOREIGN KEY (fk_usuario_id)
    REFERENCES usuario (id)
    ON DELETE CASCADE;
 
ALTER TABLE acao_carteira ADD CONSTRAINT FK_acao_carteira_2
    FOREIGN KEY (fk_usuario_id)
    REFERENCES usuario (id)
    ON DELETE CASCADE;
 
ALTER TABLE acao_interesse ADD CONSTRAINT FK_acao_interesse_2
    FOREIGN KEY (fk_usuario_id)
    REFERENCES usuario (id)
    ON DELETE CASCADE;
    
 
