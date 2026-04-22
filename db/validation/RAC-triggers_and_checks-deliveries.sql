-- =========================================
-- CHECKS: deliveries_deliverypoint
-- =========================================

-- Direccion no vacia:
ALTER TABLE deliveries_deliverypoint
ADD CONSTRAINT chk_deliveries_deliverypoint_address_not_blank
CHECK (CHAR_LENGTH(TRIM(address)) > 0);

-- Nombre del receptor no vacio:
ALTER TABLE deliveries_deliverypoint
ADD CONSTRAINT chk_deliveries_deliverypoint_receiver_name_not_blank
CHECK (CHAR_LENGTH(TRIM(receiver_name)) > 0);

-- Numero de paquetes positivo:
ALTER TABLE deliveries_deliverypoint
ADD CONSTRAINT chk_deliveries_deliverypoint_package_quantity_positive
CHECK (package_quantity > 0);

--
ALTER TABLE deliveries_deliverypoint
ADD CONSTRAINT chk_deliveries_deliverypoint_latitude_range
CHECK (latitude BETWEEN -90.000000 AND 90.000000);

ALTER TABLE deliveries_deliverypoint
ADD CONSTRAINT chk_deliveries_deliverypoint_longitude_range
CHECK (longitude BETWEEN -180.000000 AND 180.000000);

-- =========================================
-- TRIGGERS: deliveries_deliverypoint
-- =========================================

DROP TRIGGER IF EXISTS trg_deliveries_deliverypoint_ai;
DROP TRIGGER IF EXISTS trg_deliveries_deliverypoint_au;

DELIMITER $$
-- Registra en la bitacora para db que se hizo un nuevo registro:
CREATE TRIGGER trg_deliveries_deliverypoint_ai
AFTER INSERT ON deliveries_deliverypoint
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
        'deliveries_deliverypoint',
        'INSERT',
        NEW.id,
        NULL,
        JSON_OBJECT(
            'id', NEW.id,
            'address', NEW.address,
            'latitude', NEW.latitude,
            'longitude', NEW.longitude,
            'route_id', NEW.route_id,
            'package_quantity', NEW.package_quantity,
            'receiver_name', NEW.receiver_name
        )
    );
END$$

-- Registra en la bitacora para db que se hizo una actualizacion:
CREATE TRIGGER trg_deliveries_deliverypoint_au
AFTER UPDATE ON deliveries_deliverypoint
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
        'deliveries_deliverypoint',
        'UPDATE',
        NEW.id,
        JSON_OBJECT(
            'id', OLD.id,
            'address', OLD.address,
            'latitude', OLD.latitude,
            'longitude', OLD.longitude,
            'route_id', OLD.route_id,
            'package_quantity', OLD.package_quantity,
            'receiver_name', OLD.receiver_name
        ),
        JSON_OBJECT(
            'id', NEW.id,
            'address', NEW.address,
            'latitude', NEW.latitude,
            'longitude', NEW.longitude,
            'route_id', NEW.route_id,
            'package_quantity', NEW.package_quantity,
            'receiver_name', NEW.receiver_name
        )
    );
END$$

DELIMITER ;