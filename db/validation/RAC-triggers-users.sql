-- =========================================
-- TRIGGERS: user_users
-- =========================================

DROP TRIGGER IF EXISTS trg_users_user_ai;
DROP TRIGGER IF EXISTS trg_users_user_au;

DELIMITER $$
-- Registra en la bitacora de db cuando se registra un nuevo usuario:
CREATE TRIGGER trg_users_user_ai
AFTER INSERT ON users_user
FOR EACH ROW
BEGIN
    INSERT INTO db_change_log (
        table_name, operation_type, record_id, old_data, new_data
    )
    VALUES (
        'users_user',
        'INSERT',
        NEW.id,
        NULL,
        JSON_OBJECT(
            'id', NEW.id,
            'name', NEW.name,
            'email', NEW.email,
            'google_id', NEW.google_id,
            'role', NEW.role,
            'is_active', NEW.is_active,
            'is_staff', NEW.is_staff,
            'is_superuser', NEW.is_superuser,
            'company_id', NEW.company_id,
            'created_at', NEW.created_at,
            'updated_at', NEW.updated_at
        )
    );
END$$

-- Registra en la bitacora de db cuando se actualiza un usuario:
CREATE TRIGGER trg_users_user_au
AFTER UPDATE ON users_user
FOR EACH ROW
BEGIN
    INSERT INTO db_change_log (
        table_name, operation_type, record_id, old_data, new_data
    )
    VALUES (
        'users_user',
        'UPDATE',
        NEW.id,
        JSON_OBJECT(
            'id', OLD.id,
            'name', OLD.name,
            'email', OLD.email,
            'google_id', OLD.google_id,
            'role', OLD.role,
            'is_active', OLD.is_active,
            'is_staff', OLD.is_staff,
            'is_superuser', OLD.is_superuser,
            'company_id', OLD.company_id,
            'created_at', OLD.created_at,
            'updated_at', OLD.updated_at
        ),
        JSON_OBJECT(
            'id', NEW.id,
            'name', NEW.name,
            'email', NEW.email,
            'google_id', NEW.google_id,
            'role', NEW.role,
            'is_active', NEW.is_active,
            'is_staff', NEW.is_staff,
            'is_superuser', NEW.is_superuser,
            'company_id', NEW.company_id,
            'created_at', NEW.created_at,
            'updated_at', NEW.updated_at
        )
    );
END$$

DELIMITER ;