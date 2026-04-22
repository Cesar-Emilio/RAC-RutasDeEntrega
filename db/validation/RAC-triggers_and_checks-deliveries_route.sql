-- =========================================
-- CHECKS: deliveries_route
-- =========================================

-- Status dentro de los estados permitidos:
ALTER TABLE deliveries_route
DROP CHECK chk_deliveries_route_status_valid;

ALTER TABLE deliveries_route
ADD CONSTRAINT chk_deliveries_route_status_valid
CHECK (LOWER(TRIM(status)) IN ('pending', 'in_progress', 'completed', 'cancelled'));

-- =========================================
-- TRIGGERS: deliveries_route
-- =========================================

DROP TRIGGER IF EXISTS trg_deliveries_route_ai;
DROP TRIGGER IF EXISTS trg_deliveries_route_au;

DELIMITER $$
-- Registra en la bitacora de db que hubo un nuevo registro:
CREATE TRIGGER trg_deliveries_route_ai
AFTER INSERT ON deliveries_route
FOR EACH ROW
BEGIN
    INSERT INTO db_change_log (
        table_name,
        operation_type,
        record_id,
        old_data,
        new_data
    )
    VALUES (
        'deliveries_route',
        'INSERT',
        NEW.id,
        NULL,
        JSON_OBJECT(
            'id', NEW.id,
            'status', NEW.status,
            'company_id', NEW.company_id,
            'created_at', NEW.created_at,
            'updated_at', NEW.updated_at
        )
    );
END$$

-- Registra en la bitacora de db que hubo una actualizacion:
CREATE TRIGGER trg_deliveries_route_au
AFTER UPDATE ON deliveries_route
FOR EACH ROW
BEGIN
    INSERT INTO db_change_log (
        table_name,
        operation_type,
        record_id,
        old_data,
        new_data
    )
    VALUES (
        'deliveries_route',
        'UPDATE',
        NEW.id,
        JSON_OBJECT(
            'id', OLD.id,
            'status', OLD.status,
            'company_id', OLD.company_id,
            'created_at', OLD.created_at,
            'updated_at', OLD.updated_at
        ),
        JSON_OBJECT(
            'id', NEW.id,
            'status', NEW.status,
            'company_id', NEW.company_id,
            'created_at', NEW.created_at,
            'updated_at', NEW.updated_at
        )
    );
END$$

DELIMITER ;