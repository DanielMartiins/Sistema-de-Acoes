DROP PROCEDURE IF EXISTS executar_ordem_compra;

DELIMITER $$

CREATE PROCEDURE executar_ordem_compra (
    IN p_id_usuario INT,
    IN p_id_ordem INT,
    IN p_preco_execucao FLOAT
)
BEGIN
    DECLARE v_ticker VARCHAR(50);
    DECLARE v_qtde INT;
    DECLARE v_data_hora DATETIME;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Erro ao executar ordem de compra.';
    END;

    START TRANSACTION;

        -- Obter dados da ordem
        SELECT ticker, quantidade, data_hora
        INTO v_ticker, v_qtde, v_data_hora
        FROM ordem_compra
        WHERE id = p_id_ordem AND fk_usuario_id = p_id_usuario;

        -- Marcar como executada
        UPDATE ordem_compra
        SET executada = TRUE,
            preco_execucao = p_preco_execucao,
            data_hora_execucao = v_data_hora
        WHERE id = p_id_ordem;

        -- Adicionar à carteira
        INSERT INTO acao_carteira (fk_usuario_id, ticker, qtde, preco_compra)
        VALUES (p_id_usuario, v_ticker, v_qtde, p_preco_execucao)
        ON DUPLICATE KEY UPDATE
            qtde = qtde + v_qtde;

    COMMIT;
END$$

DELIMITER ;
