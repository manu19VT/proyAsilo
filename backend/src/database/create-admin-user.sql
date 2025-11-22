-- Script para crear o actualizar el usuario administrador
-- Ejecuta este script en SQL Server Management Studio

-- Verificar si el usuario existe
IF EXISTS (SELECT 1 FROM users WHERE LOWER(email) = 'admin@asilo.com')
BEGIN
    PRINT 'Usuario admin@asilo.com ya existe. Actualizando contraseña...';
    
    -- Actualizar el hash de la contraseña
    -- Hash SHA256 de 'admin@asilo.com::admin123' = 50f3d9310f55a9e7f2b5b521bad3b9d3e51ca501d18b6d7db566f3429f3697f5
    UPDATE users 
    SET hash_contraseña = '50f3d9310f55a9e7f2b5b521bad3b9d3e51ca501d18b6d7db566f3429f3697f5',
        cambio_contraseña_requerido = 1
    WHERE LOWER(email) = 'admin@asilo.com';
    
    PRINT '✓ Contraseña del usuario administrador actualizada';
    PRINT 'Email: admin@asilo.com';
    PRINT 'Contraseña: admin123';
END
ELSE
BEGIN
    PRINT 'Usuario admin@asilo.com no existe. Creando...';
    
    -- Crear el usuario administrador
    DECLARE @adminId NVARCHAR(36) = NEWID();
    DECLARE @adminEmail NVARCHAR(255) = 'admin@asilo.com';
    -- Hash SHA256 de 'admin@asilo.com::admin123' = 50f3d9310f55a9e7f2b5b521bad3b9d3e51ca501d18b6d7db566f3429f3697f5
    DECLARE @adminPasswordHash NVARCHAR(255) = '50f3d9310f55a9e7f2b5b521bad3b9d3e51ca501d18b6d7db566f3429f3697f5';
    
    INSERT INTO users (
        id,
        nombre,
        rol,
        email,
        hash_contraseña,
        cambio_contraseña_requerido,
        fecha_creacion
    ) VALUES (
        @adminId,
        'Administrador',
        'admin',
        @adminEmail,
        @adminPasswordHash,
        1,
        GETDATE()
    );
    
    PRINT '✓ Usuario administrador creado';
    PRINT 'Email: admin@asilo.com';
    PRINT 'Contraseña: admin123';
END

-- Verificar que el usuario se creó/actualizó correctamente
SELECT 
    id,
    nombre as name,
    rol as role,
    email,
    CASE 
        WHEN hash_contraseña IS NOT NULL THEN 'Contraseña configurada'
        ELSE 'Sin contraseña'
    END as password_status,
    cambio_contraseña_requerido as password_change_required,
    fecha_creacion as created_at
FROM users 
WHERE LOWER(email) = 'admin@asilo.com';

PRINT '';
PRINT 'IMPORTANTE: Cambia la contraseña después del primer inicio de sesión.';

