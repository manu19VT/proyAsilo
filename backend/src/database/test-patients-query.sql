-- Script para probar la consulta de pacientes directamente
-- Ejecuta este script en SQL Server Management Studio para ver si hay errores

-- Probar la consulta básica
SELECT 
  p.id,
  p.nombre as name,
  p.fecha_nacimiento as birthDate,
  p.lugar_nacimiento as birthPlace,
  p.edad as age,
  p.direccion as address,
  p.curp,
  p.rfc,
  p.fecha_ingreso as admissionDate,
  p.notas as notes,
  p.estado as status,
  p.fecha_baja as dischargeDate,
  p.motivo_baja as dischargeReason,
  p.fecha_creacion as createdAt,
  p.fecha_actualizacion as updatedAt,
  p.creado_por as createdBy,
  p.actualizado_por as updatedBy,
  u1.nombre as createdByName,
  u2.nombre as updatedByName
FROM patients p
LEFT JOIN users u1 ON p.creado_por = u1.id
LEFT JOIN users u2 ON p.actualizado_por = u2.id
ORDER BY p.nombre ASC;

-- Verificar qué columnas existen realmente
SELECT COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'patients'
ORDER BY ORDINAL_POSITION;

