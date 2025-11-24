-- Script para verificar y corregir la tabla users
-- Ejecuta este script en SQL Server Management Studio si tienes problemas con las columnas

-- Verificar qué columnas existen
SELECT COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'users'
ORDER BY ORDINAL_POSITION;

-- Si la tabla tiene columnas en inglés, ejecutar estas migraciones:

-- Renombrar name a nombre (si existe)
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'name')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'nombre')
BEGIN
    EXEC sp_rename 'users.name', 'nombre', 'COLUMN';
    PRINT 'Columna name renombrada a nombre';
END
GO

-- Renombrar role a rol (si existe)
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'role')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'rol')
BEGIN
    -- Eliminar constraint de role si existe
    DECLARE @userRoleConstraint NVARCHAR(200);
    SELECT TOP 1 @userRoleConstraint = name 
    FROM sys.check_constraints 
    WHERE parent_object_id = OBJECT_ID('users') 
      AND (name LIKE 'CK__users__role%' OR name LIKE 'CK__users__rol%' OR name = 'CK_users_role' OR name = 'CK_users_rol');
    
    IF @userRoleConstraint IS NOT NULL
    BEGIN
        DECLARE @dropUserRoleConstraintSql NVARCHAR(400);
        SET @dropUserRoleConstraintSql = N'ALTER TABLE users DROP CONSTRAINT [' + @userRoleConstraint + N']';
        EXEC sp_executesql @dropUserRoleConstraintSql;
    END
    
    EXEC sp_rename 'users.role', 'rol', 'COLUMN';
    PRINT 'Columna role renombrada a rol';
    
    -- Recrear constraint con nuevo nombre
    IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID('users') AND name = 'CK_users_rol')
    BEGIN
        DECLARE @addUserRoleConstraintSql2 NVARCHAR(400);
        SET @addUserRoleConstraintSql2 = N'ALTER TABLE users ADD CONSTRAINT CK_users_rol CHECK(rol IN (''admin'', ''nurse'', ''doctor'', ''usuario'', ''reception''))';
        EXEC sp_executesql @addUserRoleConstraintSql2;
    END
END
GO

-- Renombrar password_hash a hash_contraseña (si existe)
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'password_hash')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'hash_contraseña')
BEGIN
    EXEC sp_rename 'users.password_hash', 'hash_contraseña', 'COLUMN';
    PRINT 'Columna password_hash renombrada a hash_contraseña';
END
GO

-- Renombrar password_change_required a cambio_contraseña_requerido (si existe)
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'password_change_required')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'cambio_contraseña_requerido')
BEGIN
    EXEC sp_rename 'users.password_change_required', 'cambio_contraseña_requerido', 'COLUMN';
    PRINT 'Columna password_change_required renombrada a cambio_contraseña_requerido';
END
GO

-- Renombrar created_at a fecha_creacion (si existe)
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'created_at')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'fecha_creacion')
BEGIN
    EXEC sp_rename 'users.created_at', 'fecha_creacion', 'COLUMN';
    PRINT 'Columna created_at renombrada a fecha_creacion';
END
GO

-- Renombrar age a edad (si existe)
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'age')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'edad')
BEGIN
    EXEC sp_rename 'users.age', 'edad', 'COLUMN';
    PRINT 'Columna age renombrada a edad';
END
GO

-- Renombrar birth_date a fecha_nacimiento (si existe)
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'birth_date')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'fecha_nacimiento')
BEGIN
    EXEC sp_rename 'users.birth_date', 'fecha_nacimiento', 'COLUMN';
    PRINT 'Columna birth_date renombrada a fecha_nacimiento';
END
GO

-- Verificar columnas finales
SELECT COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'users'
ORDER BY ORDINAL_POSITION;

PRINT 'Migración completada. Verifica que todas las columnas estén en español.';

