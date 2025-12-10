-- Script para crear el paciente especial "Almacén" usado para entradas
use db_ac1425_asilodb
go

-- Verificar si el paciente Almacén ya existe
IF NOT EXISTS (SELECT 1 FROM patients WHERE id = '__ALMACEN__')
BEGIN
    -- Crear el paciente Almacén
    INSERT INTO patients (
        id,
        nombre,
        estado,
        fecha_creacion,
        fecha_actualizacion
    ) VALUES (
        '__ALMACEN__',
        'Almacén',
        'activo',
        GETDATE(),
        GETDATE()
    );
    PRINT 'Paciente "Almacén" creado exitosamente con ID: __ALMACEN__';
END
ELSE
BEGIN
    PRINT 'El paciente "Almacén" ya existe en la base de datos.';
END
GO




