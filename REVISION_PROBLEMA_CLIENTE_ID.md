# 🔍 **Revisión del Problema: Caso sin cliente_id**

## 📋 **Problema Identificado**

Cuando un cliente crea una nueva consulta desde el dashboard, el caso se guarda en la tabla `casos` **sin asignar el `cliente_id`**, dejando este campo como `NULL`.

## 🔍 **Análisis Técnico**

### **1. Estructura de la Tabla `casos`**
```sql
cliente_id UUID NULL REFERENCES profiles(id)
```
- El campo `cliente_id` es nullable
- Hace referencia a `profiles.id` (usuarios autenticados)

### **2. Función `crear-borrador-caso`**
**Ubicación:** `supabase/functions/crear-borrador-caso/index.ts`

**Código problemático:**
```typescript
const { data: caso, error: casoError } = await supabaseClient.from('casos').insert({
  motivo_consulta,
  session_token,
  estado: 'borrador',
  created_at: new Date().toISOString()
}).select('id').single();
```

**❌ Problema:** No se incluye `cliente_id` en la inserción.

### **3. Dashboard del Cliente (NuevaConsultaSection.tsx)**
**Ubicación:** `src/components/dashboard/NuevaConsultaSection.tsx`

**Código actual:**
```typescript
const { data, error } = await supabase.functions.invoke('crear-borrador-caso', {
  body: {
    motivo_consulta: formData.query.trim(),
    session_token: sessionToken,
    archivos_adjuntos: uploadedFileUrls.length > 0 ? uploadedFileUrls : undefined
  }
});
```

**❌ Problema:** No se pasa el `cliente_id` del usuario autenticado.

### **4. Landing Principal (Index.tsx)**
**Ubicación:** `src/pages/Index.tsx`

**Código actual:**
```typescript
const { data, error } = await supabase.functions.invoke('crear-borrador-caso', {
  body: {
    motivo_consulta: formData.consultation.trim(),
    session_token: sessionToken
  }
});
```

**❌ Problema:** No se pasa el `cliente_id` del usuario autenticado (cuando está logueado).

## 🎯 **Solución Requerida**

### **Lógica de Negocio**
- **Usuario anónimo:** Crear caso borrador SIN `cliente_id` (comportamiento actual correcto)
- **Usuario autenticado con rol 'cliente':** Crear caso borrador CON `cliente_id` (problema actual)
- **Usuario autenticado con rol 'abogado'/'super_admin':** Crear caso borrador SIN `cliente_id` (comportamiento correcto)

### **Implementación**

#### **1. Modificar Index.tsx (Landing Principal)**
```typescript
// En src/pages/Index.tsx
const { user, profile } = useAuth(); // Ya está disponible

const { data, error } = await supabase.functions.invoke('crear-borrador-caso', {
  body: {
    motivo_consulta: formData.consultation.trim(),
    session_token: sessionToken,
    cliente_id: (user && profile?.role === 'cliente') ? user.id : undefined // ← SOLO PARA CLIENTES
  }
});
```

#### **2. Modificar NuevaConsultaSection.tsx (Dashboard)**
```typescript
// En src/components/dashboard/NuevaConsultaSection.tsx
const { user, profile } = useAuth(); // ← AGREGAR ESTO

const { data, error } = await supabase.functions.invoke('crear-borrador-caso', {
  body: {
    motivo_consulta: formData.query.trim(),
    session_token: sessionToken,
    cliente_id: (user && profile?.role === 'cliente') ? user.id : undefined, // ← SOLO PARA CLIENTES
    archivos_adjuntos: uploadedFileUrls.length > 0 ? uploadedFileUrls : undefined
  }
});
```

#### **3. Modificar Función Edge**
```typescript
// En supabase/functions/crear-borrador-caso/index.ts
const { motivo_consulta, session_token, cliente_id } = await req.json();

const { data: caso, error: casoError } = await supabaseClient.from('casos').insert({
  motivo_consulta,
  session_token,
  cliente_id, // ← AGREGAR ESTO (puede ser undefined para usuarios anónimos)
  estado: 'borrador',
  created_at: new Date().toISOString()
}).select('id').single();
```

### **Opción 2: Obtener cliente_id desde la Sesión**
La función Edge podría obtener el `cliente_id` desde el contexto de autenticación de Supabase, pero esto requeriría modificar la función para usar el JWT del usuario y sería más complejo.

## 🔒 **Implicaciones de Seguridad**

- **RLS (Row Level Security):** Los casos sin `cliente_id` podrían no ser accesibles correctamente por las políticas RLS
- **Asignación de casos:** Los abogados no podrían ver casos sin cliente asignado
- **Auditoría:** Dificulta el seguimiento de quién creó cada caso

## ✅ **Archivos que Necesitan Modificación**

1. `src/pages/Index.tsx` - Pasar `cliente_id` cuando el usuario esté autenticado
2. `src/components/dashboard/NuevaConsultaSection.tsx` - Agregar `useAuth` y pasar `cliente_id`
3. `supabase/functions/crear-borrador-caso/index.ts` - Recibir y asignar `cliente_id`

## 🧪 **Verificación**

Después de la corrección, verificar que:
- Los nuevos casos tengan `cliente_id` asignado correctamente
- Las consultas del cliente muestren los casos creados
- Los abogados puedan acceder a los casos asignados
- Las políticas RLS funcionen correctamente

---

**¿Procedemos con la implementación de la solución?**