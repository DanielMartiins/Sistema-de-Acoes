DROP PROCEDURE IF EXISTS executar_ordens_compra_pendentes;

DELIMITER $$

CREATE PROCEDURE executar_ordens_compra_pendentes (
    IN p_id_usuario INT,
    IN p_precos JSON
)
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE v_id_ordem INT;
    DECLARE v_ticker VARCHAR(50);
    DECLARE v_preco_referencia FLOAT;

    -- Cursor para ordens pendentes limitadas do usuário
    DECLARE ordens_cursor CURSOR FOR
        SELECT id, ticker, preco_referencia
        FROM ordem_compra
        WHERE fk_usuario_id = p_id_usuario
          AND executada = 0
          AND modo = 1; -- modo LIMITADA

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    OPEN ordens_cursor;

    ordens_loop: LOOP
        FETCH ordens_cursor INTO v_id_ordem, v_ticker, v_preco_referencia;
        IF done THEN
            LEAVE ordens_loop;
        END IF;

        -- Obter preço atual a partir do JSON
        SET @preco_atual = JSON_UNQUOTE(JSON_EXTRACT(p_precos, CONCAT('$.', v_ticker)));

        -- Se preço atual estiver disponível e <= referência, executar a ordem
        IF @preco_atual IS NOT NULL AND CAST(@preco_atual AS DECIMAL(10,2)) <= v_preco_referencia THEN
            CALL executar_ordem_compra(p_id_usuario, v_id_ordem, CAST(@preco_atual AS DECIMAL(10,2)));
        END IF;

    END LOOP;

    CLOSE ordens_cursor;
END$$

DELIMITER ;
