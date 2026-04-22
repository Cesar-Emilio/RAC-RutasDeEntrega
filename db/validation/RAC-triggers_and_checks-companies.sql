-- =========================================
-- CHECKS: companies_company
-- =========================================

-- nombre no vacio o solo espacios
ALTER TABLE companies_company
ADD CONSTRAINT chk_companies_company_name_not_blank
CHECK (CHAR_LENGTH(TRIM(name)) > 0);

-- rfc no vacio o solo espacios
ALTER TABLE companies_company
ADD CONSTRAINT chk_companies_company_rfc_not_blank
CHECK (CHAR_LENGTH(TRIM(rfc)) > 0);

-- Maximo de caracteres en el rfc
ALTER TABLE companies_company
ADD CONSTRAINT chk_companies_company_rfc_length
CHECK (CHAR_LENGTH(TRIM(rfc)) IN (12, 13));

-- =========================================
-- TRIGGERS: companies_company
-- =========================================
DROP TRIGGER IF EXISTS trg_companies_company_ai;
DROP TRIGGER IF EXISTS trg_companies_company_au;

 DELIMITER $$
 -- Registra en la bitacora para db que se registro una empresa:
CREATE TRIGGER trg_companies_company_ai
AFTER INSERT ON companies_company
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
        'companies_company',
        'INSERT',
        NEW.id,
        NULL,
        JSON_OBJECT(
            'id', NEW.id,
            'name', NEW.name,
            'email', NEW.email,
            'rfc', NEW.rfc,
            'created_at', NEW.created_at,
            'updated_at', NEW.updated_at
        )
    );
END$$

-- Registra en la bitacora para db que se actualizo una empresa:
CREATE TRIGGER trg_companies_company_au
AFTER UPDATE ON companies_company
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
        'companies_company',
        'UPDATE',
        NEW.id,
        JSON_OBJECT(
            'id', OLD.id,
            'name', OLD.name,
            'email', OLD.email,
            'rfc', OLD.rfc,
            'created_at', OLD.created_at,
            'updated_at', OLD.updated_at
        ),
        JSON_OBJECT(
            'id', NEW.id,
            'name', NEW.name,
            'email', NEW.email,
            'rfc', NEW.rfc,
            'created_at', NEW.created_at,
            'updated_at', NEW.updated_at
        )
    );
END$$
DELIMITER ;