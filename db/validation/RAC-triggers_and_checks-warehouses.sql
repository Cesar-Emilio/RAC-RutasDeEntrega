-- =========================================
-- CHECKS: warehouses_warehouse
-- =========================================

-- Nombre no vacio:
ALTER TABLE warehouses_warehouse
ADD CONSTRAINT chk_warehouses_warehouse_name_not_blank
CHECK (CHAR_LENGTH(TRIM(name)) > 0);

-- Direccion no vacia:
ALTER TABLE warehouses_warehouse
ADD CONSTRAINT chk_warehouses_warehouse_address_not_blank
CHECK (CHAR_LENGTH(TRIM(address)) > 0);

-- Ciudad no vacia:
ALTER TABLE warehouses_warehouse
ADD CONSTRAINT chk_warehouses_warehouse_city_not_blank
CHECK (CHAR_LENGTH(TRIM(city)) > 0);

-- Codigo postal de 5 digitos:
ALTER TABLE warehouses_warehouse
ADD CONSTRAINT chk_warehouses_warehouse_postal_code_format
CHECK (postal_code REGEXP '^[0-9]{5}$');

-- =========================================
-- TRIGGERS: warehouses_warehouse
-- =========================================

DROP TRIGGER IF EXISTS trg_warehouses_warehouse_ai;
DROP TRIGGER IF EXISTS trg_warehouses_warehouse_au;

DELIMITER $$
-- Registra en la bitacora de db cuando se registra un almacen:
CREATE TRIGGER trg_warehouses_warehouse_ai
AFTER INSERT ON warehouses_warehouse
FOR EACH ROW
BEGIN
    INSERT INTO db_change_log (
        table_name, operation_type, record_id, old_data, new_data
    )
    VALUES (
        'warehouses_warehouse',
        'INSERT',
        NEW.id,
        NULL,
        JSON_OBJECT(
            'id', NEW.id,
            'name', NEW.name,
            'address', NEW.address,
            'city', NEW.city,
            'state', NEW.state,
            'country', NEW.country,
            'postal_code', NEW.postal_code,
            'latitude', NEW.latitude,
            'longitude', NEW.longitude,
            'active', NEW.active,
            'company_id', NEW.company_id,
            'created_at', NEW.created_at,
            'updated_at', NEW.updated_at
        )
    );
END$$

-- Registra en la bitacora de db cuando se actualiza un almacen:
CREATE TRIGGER trg_warehouses_warehouse_au
AFTER UPDATE ON warehouses_warehouse
FOR EACH ROW
BEGIN
    INSERT INTO db_change_log (
        table_name, operation_type, record_id, old_data, new_data
    )
    VALUES (
        'warehouses_warehouse',
        'UPDATE',
        NEW.id,
        JSON_OBJECT(
            'id', OLD.id,
            'name', OLD.name,
            'address', OLD.address,
            'city', OLD.city,
            'state', OLD.state,
            'country', OLD.country,
            'postal_code', OLD.postal_code,
            'latitude', OLD.latitude,
            'longitude', OLD.longitude,
            'active', OLD.active,
            'company_id', OLD.company_id,
            'created_at', OLD.created_at,
            'updated_at', OLD.updated_at
        ),
        JSON_OBJECT(
            'id', NEW.id,
            'name', NEW.name,
            'address', NEW.address,
            'city', NEW.city,
            'state', NEW.state,
            'country', NEW.country,
            'postal_code', NEW.postal_code,
            'latitude', NEW.latitude,
            'longitude', NEW.longitude,
            'active', NEW.active,
            'company_id', NEW.company_id,
            'created_at', NEW.created_at,
            'updated_at', NEW.updated_at
        )
    );
END$$

DELIMITER ;