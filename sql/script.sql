CREATE DATABASE sistema_acoes;
USE sistema_acoes;

/* Sistema_Acoes_ModeloLogico: */

CREATE TABLE usuario (
    id int PRIMARY KEY AUTO_INCREMENT,
    email varchar(320),
    senha_hash varchar(256),
    saldo FLOAT,
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
    fk_usuario_id int,
    id int AUTO_INCREMENT,
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
    
 
DROP PROCEDURE IF EXISTS trocar_ordem_acoes_interesse;
DELIMITER $$

CREATE PROCEDURE trocar_ordem_acoes_interesse (
    IN p_usuario_id INT,
    IN p_ordem1 INT,
    IN p_ordem2 INT
)
BEGIN
    -- 1. Atribuir valor temporário à ação com ordem1
    UPDATE acao_interesse
    SET ordem = -1
    WHERE fk_usuario_id = p_usuario_id AND ordem = p_ordem1;

    -- 2. Muda ordem2 para ordem1
    UPDATE acao_interesse
    SET ordem = p_ordem1
    WHERE fk_usuario_id = p_usuario_id AND ordem = p_ordem2;

    -- 3. Muda -1 (antiga ordem1) para ordem2
    UPDATE acao_interesse
    SET ordem = p_ordem2
    WHERE fk_usuario_id = p_usuario_id AND ordem = -1;
END $$

DELIMITER ;

DROP PROCEDURE IF EXISTS debitar_conta_corrente;

DELIMITER $$

CREATE PROCEDURE debitar_conta_corrente (
    IN p_id_usuario INT,
    IN valor FLOAT, 
    IN descricao JSON
)
BEGIN

    DECLARE v_usuario_ultima_hora_negociacao DATETIME;
    DECLARE v_saldo_usuario FLOAT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Houve uma falha ao realizar o débito.';
    END;

    IF (p_id_usuario IS NULL OR valor IS NULL OR descricao IS NULL) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ERRO: Valor(es) nulo(s).';
    END IF;

    SELECT saldo
    INTO v_saldo_usuario
    FROM usuario
    WHERE id = p_id_usuario;

    IF (v_saldo_usuario < valor) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ERRO: Usuário não possui saldo suficiente.';
	END IF;

    START TRANSACTION;

        -- 1. Pegar data de negociação do usuário
        SELECT ultima_hora_negociacao
        INTO v_usuario_ultima_hora_negociacao
        FROM usuario
        WHERE id = p_id_usuario;

        -- 2. Atualizar saldo do usuário
        UPDATE usuario
        SET saldo = saldo - valor
        WHERE id = p_id_usuario;

        -- 3. Realizar lancamento na conta corrente
        INSERT INTO lancamento_conta_corrente (
            fk_usuario_id, 
            historico, 
            valor, 
            data_hora)
        VALUES (p_id_usuario, descricao, -valor, v_usuario_ultima_hora_negociacao); 
    COMMIT;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS depositar_conta_corrente;

DELIMITER $$

CREATE PROCEDURE depositar_conta_corrente (
    IN p_id_usuario INT,
    IN valor FLOAT, 
    IN descricao JSON
)
BEGIN

    DECLARE v_usuario_ultima_hora_negociacao DATETIME;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Houve uma falha ao realizar o débito';
    END;

    IF (p_id_usuario IS NULL OR valor IS NULL OR descricao IS NULL) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ERRO: Valor(es) nulo(s).';
    END IF;

    START TRANSACTION;

        -- 1. Pegar data de negociação do usuário
        SELECT ultima_hora_negociacao
        INTO v_usuario_ultima_hora_negociacao
        FROM usuario
        WHERE id = p_id_usuario;

        -- 2. Atualizar saldo do usuário
        UPDATE usuario
        SET saldo = saldo + valor
        WHERE id = p_id_usuario;

        -- 3. Realizar lancamento na conta corrente
        INSERT INTO lancamento_conta_corrente (
            fk_usuario_id, 
            historico, 
            valor, 
            data_hora)
        VALUES (p_id_usuario, descricao, valor, v_usuario_ultima_hora_negociacao); 
    COMMIT;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS executar_ordem_compra;

DELIMITER $$

CREATE PROCEDURE executar_ordem_compra (
    IN p_id_usuario INT, 
    IN p_id_ordem_compra INT, 
    IN p_preco_execucao FLOAT
)
BEGIN

    DECLARE v_data_hora_execucao DATETIME;
    DECLARE v_ticker VARCHAR(50);
    DECLARE v_quantidade INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Houve uma falha ao executar a ordem de compra. Usuário possui saldo suficiente?';
        ROLLBACK;
    END;

    IF (p_id_usuario IS NULL OR
        p_id_ordem_compra IS NULL OR
        p_preco_execucao IS NULL) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ERRO: Valor(es) nulo(s).';
    END IF;

    START TRANSACTION;

        -- 1. Obter data de execução
        SELECT ultima_hora_negociacao
        INTO v_data_hora_execucao
        FROM usuario
        WHERE id = p_id_usuario;

        -- 2. Obter dados da ordem
        SELECT ticker, quantidade
        INTO v_ticker, v_quantidade
        FROM ordem_compra
        WHERE id = p_id_ordem_compra;

        -- 3. Atualizar a ordem
        UPDATE ordem_compra
        SET data_hora_execucao = v_data_hora_execucao,
            preco_execucao = p_preco_execucao,
            executada = 1
        WHERE id = p_id_ordem_compra;

        -- 4. Debitar o valor da conta corrente
        CALL debitar_conta_corrente(
            p_id_usuario,
            p_preco_execucao * v_quantidade,
			JSON_OBJECT(
  			'descricao',
  			CONCAT(
    			'ticker: ', v_ticker,
    			', quantidade: ', v_quantidade,
    			', precoExecucao: ', p_preco_execucao
  				)
			)
        );

        -- 5. Atualizar ou inserir ação na carteira
        INSERT INTO acao_carteira (
            fk_usuario_id,
            ticker,
            qtde,
            preco_compra,
            qtde_vendida,
            preco_venda
        )
        VALUES (
            p_id_usuario,
            v_ticker,
            v_quantidade,
            p_preco_execucao,
            0,
            0
        )
        ON DUPLICATE KEY UPDATE
            preco_compra = (preco_compra * qtde + (v_quantidade * p_preco_execucao)) / (qtde + v_quantidade),
            qtde = qtde + v_quantidade;

    COMMIT;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS registrar_ordem_compra;

DELIMITER $$

CREATE PROCEDURE registrar_ordem_compra (
    IN p_id_usuario INT, 
    IN p_ticker VARCHAR(50),
    IN p_modo INT,
    IN p_quantidade INT,
    IN p_preco_referencia FLOAT
)
BEGIN
    DECLARE v_data_hora DATETIME;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Houve uma falha ao registrar a ordem de compra.';
    END;

    -- Verificação de nulidade
    IF (p_id_usuario IS NULL OR
        p_ticker IS NULL OR
        p_modo IS NULL OR
        p_quantidade IS NULL OR
        p_preco_referencia IS NULL) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ERRO: Valor(es) nulo(s).';
    END IF;

    START TRANSACTION;

        -- 1. Buscar data/hora de negociação do usuário
        SELECT ultima_hora_negociacao
        INTO v_data_hora
        FROM usuario
        WHERE id = p_id_usuario;

        -- 2. Inserir ordem de compra
        INSERT INTO ordem_compra (
            fk_usuario_id,
            data_hora,
            ticker,
            modo,
            quantidade,
            preco_referencia,
            executada
        )
        VALUES (
            p_id_usuario,
            v_data_hora,
            p_ticker,
            p_modo,
            p_quantidade,
            p_preco_referencia,
            0
        );

        -- 3. Retornar o ID gerado
        SELECT LAST_INSERT_ID() AS insertId;

    COMMIT;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS executar_ordem_venda;

DELIMITER $$
CREATE PROCEDURE executar_ordem_venda (
    IN p_id_usuario INT, 
    IN p_id_ordem_venda INT, 
    IN p_preco_execucao FLOAT
)
BEGIN

    DECLARE v_data_hora_execucao DATETIME;
    DECLARE v_ticker VARCHAR(50);
    DECLARE v_quantidade INT;

    /* O handler abaixo é feito para garantir que ou todos os 
    comandos da transação a seguir executem com sucesso ou desfaça tudo.
    "EXIT" significa que o controle deve sair imediatamente de onde está,
    "HANDLER" é um tratador de erro,
    e "SQLEXCEPTION" cobre qualquer erro de SQL.
    */
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Houve uma falha ao executar a ordem de venda';
	    ROLLBACK;
    END;

	IF (p_id_usuario IS NULL OR
        p_id_ordem_venda IS NULL OR
        p_preco_execucao IS NULL) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ERRO: Valor(es) nulo(s).';
    END IF;


    START TRANSACTION;

        -- 1. Buscar data de execução da venda
        SELECT ultima_hora_negociacao
        INTO v_data_hora_execucao
        FROM usuario
        WHERE id = p_id_usuario;

        -- 2. Buscar o ticker e a sua quantidade de venda
        SELECT ticker, quantidade
        INTO v_ticker, v_quantidade
        FROM ordem_venda
        WHERE id = p_id_ordem_venda;

        -- 3. Registrar hora e preço de execucao na ordem de venda
        -- Também marcar a ordem como executada
        UPDATE ordem_venda
        SET data_hora_execucao = v_data_hora_execucao, 
        preco_execucao = p_preco_execucao,
        executada = 1
        WHERE id = p_id_ordem_venda;

        -- 4. Atualizar o saldo do usuário
        UPDATE usuario
        SET saldo = saldo + (p_preco_execucao * v_quantidade)
        WHERE id = p_id_usuario;

        -- 5. Realizar depósito na conta do usuário
        INSERT INTO lancamento_conta_corrente(fk_usuario_id, historico, valor, data_hora)
        VALUES(
            p_id_usuario, 
            JSON_OBJECT(
  				'descricao',
  				CONCAT(
    			'ticker: ', v_ticker,
    			', quantidade: ', v_quantidade,
    			', precoExecucao: ', p_preco_execucao
  				)
			),
            p_preco_execucao * v_quantidade,
            v_data_hora_execucao
        );

        -- 6. Atualizar informações na carteira do usuário 
        UPDATE acao_carteira
        SET 
            -- Nova média
            preco_venda =
            (preco_venda * qtde_vendida + (v_quantidade * p_preco_execucao))
            /(qtde_vendida + v_quantidade),
            
            qtde_vendida = qtde_vendida + v_quantidade
        WHERE ticker = v_ticker AND fk_usuario_id = p_id_usuario;
    COMMIT;
END$$

DELIMITER ;


DROP PROCEDURE IF EXISTS registrar_ordem_venda;

DELIMITER $$
CREATE PROCEDURE registrar_ordem_venda (
    IN p_id_usuario INT, 
    IN p_ticker varchar(50),
    IN p_modo INT,
    IN p_quantidade INT,
    IN p_preco_referencia FLOAT
)
BEGIN
		
    DECLARE v_data_hora DATETIME;
    
    /* O handler abaixo é feito para garantir que ou todos os 
    comandos da transação a seguir executem com sucesso ou desfaça tudo.
    "EXIT" significa que o controle deve sair imediatamente de onde está,
    "HANDLER" é um tratador de erro,
    e "SQLEXCEPTION" cobre qualquer erro de SQL.
    */
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Houve uma falha ao registrar a ordem de venda.';
    END;


    IF (p_id_usuario IS NULL OR
        p_ticker IS NULL OR
        p_modo IS NULL OR
        p_quantidade IS NULL OR
        p_preco_referencia IS NULL) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ERRO: Valor(es) nulo(s).';
    END IF;

    START TRANSACTION;
    
        -- 1. Buscar data_hora
        SELECT usuario.ultima_hora_negociacao
        INTO v_data_hora
        FROM usuario
        WHERE usuario.id = p_id_usuario;

        -- 2. Retirar o(s) ticker(s) da carteira do usuario
        UPDATE acao_carteira
        SET qtde = qtde - p_quantidade
        WHERE ticker = p_ticker AND fk_usuario_id = p_id_usuario;

        -- 3. Registrar a ordem de venda
        INSERT INTO ordem_venda (
            fk_usuario_id, 
            data_hora, 
            ticker, 
            modo,
            quantidade, 
            preco_referencia, 
            executada
        )
        VALUES (
            p_id_usuario, 
            v_data_hora, 
            p_ticker, 
            p_modo, 
            p_quantidade, 
            p_preco_referencia, 
            0
        );

        -- Para ""retornar"" a id da venda
        SELECT LAST_INSERT_ID() AS insertId;
    COMMIT;
END$$

DELIMITER ;


