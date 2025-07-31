-- Agregar el estado 'asignado' al enum caso_estado_enum
ALTER TYPE caso_estado_enum ADD VALUE 'asignado' AFTER 'disponible'; 