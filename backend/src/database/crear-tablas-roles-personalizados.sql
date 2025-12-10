-- ============================================
-- TABLAS PARA ROLES PERSONALIZADOS Y PERMISOS
-- ============================================
use AsiloDB
go
-- Tabla de Roles Personalizados
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[roles_personalizados]') AND type in (N'U'))
BEGIN
    CREATE TABLE roles_personalizados (
        id NVARCHAR(36) PRIMARY KEY,
        nombre NVARCHAR(100) NOT NULL UNIQUE,
        fecha_creacion DATETIME2 DEFAULT GETDATE(),
        activo BIT NOT NULL DEFAULT 1
    );
END
GO

-- Tabla de Permisos por Rol
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[permisos_rol]') AND type in (N'U'))
BEGIN
    CREATE TABLE permisos_rol (
        id NVARCHAR(36) PRIMARY KEY,
        rol_id NVARCHAR(36) NOT NULL,
        permiso NVARCHAR(50) NOT NULL, -- 'pacientes', 'medicamentos', 'control_es', 'objetos'
        CONSTRAINT FK_permisos_rol_rol FOREIGN KEY (rol_id) REFERENCES roles_personalizados(id) ON DELETE CASCADE,
        CONSTRAINT CK_permisos_rol_permiso CHECK(permiso IN ('pacientes', 'medicamentos', 'control_es', 'objetos')),
        CONSTRAINT UQ_permisos_rol_rol_permiso UNIQUE(rol_id, permiso)
    );
END
GO

-- Agregar campo para roles personalizados en la tabla users
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'rol_personalizado_id')
BEGIN
    ALTER TABLE users ADD rol_personalizado_id NVARCHAR(36) NULL;
    ALTER TABLE users ADD CONSTRAINT FK_users_rol_personalizado FOREIGN KEY (rol_personalizado_id) REFERENCES roles_personalizados(id) ON DELETE SET NULL;
END
GO

-- Modificar constraint de rol para permitir valores personalizados
-- Primero eliminamos el constraint existente
DECLARE @userRoleConstraintName NVARCHAR(200);
SELECT TOP 1 @userRoleConstraintName = name 
FROM sys.check_constraints 
WHERE parent_object_id = OBJECT_ID('users') 
  AND (name LIKE 'CK__users__rol%' OR name LIKE 'CK__users__role%' OR name = 'CK_users_role' OR name = 'CK_users_rol');

IF @userRoleConstraintName IS NOT NULL
BEGIN
    DECLARE @dropUserRoleConstraintSql NVARCHAR(400);
    SET @dropUserRoleConstraintSql = N'ALTER TABLE users DROP CONSTRAINT [' + @userRoleConstraintName + N']';
    EXEC sp_executesql @dropUserRoleConstraintSql;
END
GO

-- Crear índices para mejorar rendimiento
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_permisos_rol_rol_id' AND object_id = OBJECT_ID('permisos_rol'))
BEGIN
    CREATE INDEX idx_permisos_rol_rol_id ON permisos_rol(rol_id);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_users_rol_personalizado_id' AND object_id = OBJECT_ID('users'))
BEGIN
    CREATE INDEX idx_users_rol_personalizado_id ON users(rol_personalizado_id);
END
GO

PRINT 'Tablas de roles personalizados creadas exitosamente.';
PRINT 'Ahora puedes crear roles personalizados desde la interfaz de administración.';
GO

select *from dbo.patients

SELECT 
    rp.id,
    rp.nombre,
    rp.fecha_creacion,
    rp.activo,
    pr.permiso
FROM roles_personalizados rp
LEFT JOIN permisos_rol pr ON rp.id = pr.rol_id
ORDER BY rp.nombre, pr.permiso;



SELECT * FROM users 


-- Agregar columna nombre_medicamento
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'nombre_medicamento')
BEGIN
    ALTER TABLE entry_items ADD nombre_medicamento NVARCHAR(255) NULL;
END
GO

-- Agregar columna unidad
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'unidad')
BEGIN
    ALTER TABLE entry_items ADD unidad NVARCHAR(50) NULL;
END
GO
