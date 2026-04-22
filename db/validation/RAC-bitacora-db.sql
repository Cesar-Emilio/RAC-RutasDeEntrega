-- =========================================
-- BITÁCORA GENERAL
-- =========================================
DROP TABLE IF EXISTS db_change_log;

CREATE TABLE db_change_log (
    id BIGINT NOT NULL AUTO_INCREMENT,
    table_name VARCHAR(100) NOT NULL,
    operation_type VARCHAR(10) NOT NULL,
    record_id BIGINT NULL,
    changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    old_data JSON NULL,
    new_data JSON NULL,
    changed_by VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT chk_db_change_log_operation
        CHECK (operation_type IN ('INSERT', 'UPDATE', 'DELETE'))
);


-- =============================================
-- VISTAS DE CONSULTA
-- =============================================

-- Rutas por empresa:
/*
cuántas rutas tiene,
cuántos puntos de entrega acumula,
cuántos paquetes se planean mover,
cuántas rutas están pendientes, en progreso, completadas o canceladas.
*/
DROP VIEW IF EXISTS vw_route_summary_by_company;
CREATE VIEW vw_route_summary_by_company AS
SELECT
    c.id AS company_id,
    c.name AS company_name,
    c.email AS company_email,
    c.rfc AS company_rfc,
    COUNT(DISTINCT r.id) AS total_routes,
    COUNT(dp.id) AS total_delivery_points,
    COALESCE(SUM(dp.package_quantity), 0) AS total_packages,
    COALESCE(SUM(CASE WHEN r.status = 'pending' THEN 1 ELSE 0 END), 0) AS routes_pending,
    COALESCE(SUM(CASE WHEN r.status = 'in_progress' THEN 1 ELSE 0 END), 0) AS routes_in_progress,
    COALESCE(SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END), 0) AS routes_completed,
    COALESCE(SUM(CASE WHEN r.status = 'cancelled' THEN 1 ELSE 0 END), 0) AS routes_cancelled
FROM companies_company c
LEFT JOIN deliveries_route r
    ON r.company_id = c.id
LEFT JOIN deliveries_deliverypoint dp
    ON dp.route_id = r.id
GROUP BY
    c.id, c.name, c.email, c.rfc;
    
    
-- Detalle de puntos de entrega por ruta:
/*
Info que se junta: empresa, ruta, estado, fecha, punto de entrega, receptor, paquetes, coordenadas.
*/

DROP VIEW IF EXISTS vw_route_deliverypoint_detail;

CREATE VIEW vw_route_deliverypoint_detail AS
SELECT
    r.id AS route_id,
    r.date AS route_date,
    r.status AS route_status,
    c.id AS company_id,
    c.name AS company_name,
    dp.id AS delivery_point_id,
    dp.address AS delivery_address,
    dp.receiver_name,
    dp.package_quantity,
    dp.latitude,
    dp.longitude
FROM deliveries_route r
INNER JOIN companies_company c
    ON c.id = r.company_id
LEFT JOIN deliveries_deliverypoint dp
    ON dp.route_id = r.id;