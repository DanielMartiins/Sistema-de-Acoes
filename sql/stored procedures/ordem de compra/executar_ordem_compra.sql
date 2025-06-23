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
                'ticker', v_ticker,
                'quantidade', v_quantidade,
                'precoExecucao', p_preco_execucao
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
