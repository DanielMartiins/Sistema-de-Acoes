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
