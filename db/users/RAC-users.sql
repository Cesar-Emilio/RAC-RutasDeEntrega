create database if not exists rootaccess;

-- Creacion de roles:
CREATE ROLE IF NOT EXISTS 'role_rac_app_rw';
CREATE ROLE IF NOT EXISTS 'role_rac_migrator';
CREATE ROLE IF NOT EXISTS 'role_rac_readonly';

-- Priviliegios segun el rol:
GRANT SELECT, INSERT, UPDATE, DELETE
ON rootaccess.* TO 'role_rac_app_rw';

GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, INDEX, REFERENCES
ON rootaccess.* TO 'role_rac_migrator';

GRANT SELECT
ON rootaccess.* TO 'role_rac_readonly';

-- Crear usuarios:
CREATE USER IF NOT EXISTS 'rac_app'@'127.0.0.1' IDENTIFIED BY 'ClaveSeguraTest_App';
CREATE USER IF NOT EXISTS 'rac_migrator'@'127.0.0.1' IDENTIFIED BY 'ClaveSeguraTest_Migrator';
CREATE USER IF NOT EXISTS 'rac_readonly'@'127.0.0.1' IDENTIFIED BY 'ClaveSeguraTest_Readonly';

-- Asignar roles a los usuarios creados:
GRANT 'role_rac_app_rw' TO 'rac_app'@'127.0.0.1';
GRANT 'role_rac_migrator' TO 'rac_migrator'@'127.0.0.1';
GRANT 'role_rac_readonly' TO 'rac_readonly'@'127.0.0.1';

-- Fijar el rol correspondiente como default:

SET DEFAULT ROLE 'role_rac_app_rw' TO 'rac_app'@'127.0.0.1';
SET DEFAULT ROLE 'role_rac_migrator' TO 'rac_migrator'@'127.0.0.1';
SET DEFAULT ROLE 'role_rac_readonly' TO 'rac_readonly'@'127.0.0.1';

-- Verificacion:
-- Permisos segun el rol
SHOW GRANTS FOR 'role_rac_app_rw';
SHOW GRANTS FOR 'role_rac_migrator';
SHOW GRANTS FOR 'role_rac_readonly';

-- Usuarios creados con los roles y permisos establecidos
SHOW GRANTS FOR 'rac_app'@'127.0.0.1';
SHOW GRANTS FOR 'rac_migrator'@'127.0.0.1';
SHOW GRANTS FOR 'rac_readonly'@'127.0.0.1';

-- Creacion para produccion:
-- Si django corre en otro servidor especifico (ejemplo):
CREATE USER IF NOT EXISTS 'rac_app'@'10.0.1.25' IDENTIFIED BY 'ClaveSeguraProd_App!';
CREATE USER IF NOT EXISTS 'rac_migrator'@'10.0.1.25' IDENTIFIED BY 'ClaveSeguraProd_Migrator!';
CREATE USER IF NOT EXISTS 'rac_readonly'@'10.0.1.30' IDENTIFIED BY 'ClaveSeguraProd_Readonly!';

-- Si es en una subred conocida (ejemplo):
CREATE USER IF NOT EXISTS 'rac_app'@'10.0.1.%' IDENTIFIED BY 'ClaveSeguraProd_App!';