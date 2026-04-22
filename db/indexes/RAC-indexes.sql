-- Buscar rutas por empresa y fecha para reportes
CREATE INDEX idx_route_company_date ON deliveries_route(company_id, created_at);

-- Buscar puntos de entrega por ruta
CREATE INDEX idx_deliverypoint_route ON deliveries_deliverypoint(route_id);

-- Auditoría: consultas por fecha
CREATE INDEX idx_audit_timestamp ON audit_auditlog(timestamp);

-- Usuarios por empresa para listar el equipo
CREATE INDEX idx_user_company ON users_user(company_id);

-- Almacenes activos por empresa
CREATE INDEX idx_warehouse_company_active ON warehouses_warehouse(company_id, active);