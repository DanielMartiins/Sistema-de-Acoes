DROP PROCEDURE IF EXISTS trocar_ordem_acoes;
DELIMITER $$

CREATE PROCEDURE trocar_ordem_acoes (
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
