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
