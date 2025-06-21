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


