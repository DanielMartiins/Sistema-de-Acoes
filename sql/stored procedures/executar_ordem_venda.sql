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
        ROLLBACK;
    END;    
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
                'ticker', v_ticker,
                'quantidade', v_quantidade,
                'precoExecucao', p_preco_execucao
            ),
            p_preco_execucao * v_quantidade,
            v_data_hora_execucao
        );
    COMMIT;
END$$

DELIMITER ;