# 🔒 Migración de Seguridad y Separación de Componentes

## 📋 **Resumen del Proyecto**

Migración gradual y segura de componentes para mejorar la seguridad, cumplimiento RGPD y escalabilidad del proyecto, separando completamente los dashboards por rol.

## 🎯 **Objetivos**

### ✅ **Seguridad Mejorada**
- Validaciones estrictas por rol en cada componente
- Acceso limitado a datos según el rol del usuario
- Prevención de brechas de seguridad
- Separación física de componentes por rol

### ✅ **Cumplimiento RGPD**
- Principio de minimización: solo datos necesarios
- Control de acceso explícito en cada operación
- Auditoría de accesos y operaciones por rol

### ✅ **Escalabilidad**
- Componentes modulares por rol
- Hooks específicos por funcionalidad
- Mantenimiento simplificado

## 📁 **Estructura de Carpetas Implementada**

```
src/
├── components/
│   ├── admin/                    # 👑 Solo para super_admin
│   │   ├── SuperAdminMetrics.tsx ✅
│   │   ├── CaseDetailModal.tsx   ✅
│   │   ├── CasesManagement.tsx   🔄 (PENDIENTE)
│   │   ├── LawyersManagement.tsx 🔄 (PENDIENTE)
│   │   ├── ClientsManagement.tsx 🔄 (PENDIENTE)
│   │   └── LawyerApplicationsManagement.tsx 🔄 (PENDIENTE)
│   ├── lawyer/                   # ⚖️ Solo para abogados regulares
│   │   ├── CaseDetailModal.tsx   ✅
│   │   └── AssignedCasesManagement.tsx ✅
│   ├── client/                   # 👤 Solo para clientes
│   │   ├── CaseDetailModal.tsx   ✅
│   │   └── MisCasos.tsx          ✅
│   └── shared/                   # 🔄 Componentes verdaderamente compartidos
│       ├── ui/                   # Componentes de UI
│       └── utils/                # Utilidades comunes
├── hooks/
│   ├── admin/                    # Hooks específicos para super_admin
│   ├── lawyer/                   # Hooks específicos para abogados regulares
│   ├── client/                   # Hooks específicos para clientes
│   ├── shared/                   # Hooks seguros compartidos
│   ├── useAdminCases.ts          ✅ (con validaciones estrictas)
│   ├── useLawyerCases.ts         ✅ (con validaciones estrictas)
│   └── useClientCases.ts         ✅ (con validaciones estrictas)
└── utils/
    ├── admin/                    # Utilidades específicas para super_admin
    ├── lawyer/                   # Utilidades específicas para abogados regulares
    ├── client/                   # Utilidades específicas para clientes
    └── shared/                   # Utilidades seguras compartidas
```

## 🔄 **Estado de la Migración**

### **✅ FASE 1: LIMPIEZA INICIAL - COMPLETADA**
- [x] Eliminar archivo obsoleto `src/pages/AbogadoDashboard.tsx`
- [x] Crear estructura de carpetas `/admin/`, `/lawyer/`, `/client/`, `/shared/`
- [x] Crear estructura de carpetas en hooks `/admin/`, `/lawyer/`, `/client/`, `/shared/`

### **✅ FASE 2: HOOKS ESPECÍFICOS - COMPLETADA**
- [x] `useAdminCases.ts` - Hook específico para super_admin con validaciones estrictas
- [x] `useLawyerCases.ts` - Hook específico para abogados regulares con validaciones estrictas
- [x] `useClientCases.ts` - Hook específico para clientes con validaciones estrictas
- [x] Validaciones de rol implementadas en todos los hooks

### **✅ FASE 3: COMPONENTES ESPECÍFICOS - EN PROGRESO**

#### **COMPLETADO:**
- [x] `SuperAdminMetrics` → `/admin/SuperAdminMetrics.tsx`
  - ✅ Validación de roles: solo `super_admin`
  - ✅ Componente de acceso no autorizado
  - ✅ Actualizado import en `SuperAdminDashboard`
  - ✅ Build exitoso
  - ✅ Archivo original eliminado

- [x] `AssignedCasesManagement` → `/lawyer/AssignedCasesManagement.tsx`
  - ✅ Validación de roles: solo `abogado` con `tipo_abogado = 'regular'`
  - ✅ Cambiado de `useAssignedCases` a `useLawyerCases`
  - ✅ Componente de acceso no autorizado
  - ✅ Actualizado import en `RegularLawyerDashboard`
  - ✅ Build exitoso
  - ✅ Archivo original eliminado

- [x] `CaseDetailModal` → Separado por rol ✅
  - ✅ `/admin/CaseDetailModal.tsx` - Acceso completo
  - ✅ `/lawyer/CaseDetailModal.tsx` - Solo casos asignados
  - ✅ `/client/CaseDetailModal.tsx` - Solo casos propios
  - ✅ Archivo original eliminado
  - ✅ Build exitoso

- [x] `MisCasos` → `/client/MisCasos.tsx`
  - ✅ Usando `useClientCases` hook específico
  - ✅ Validación de propiedad de casos

#### **PENDIENTE:**
- [x] `CasesManagement` → `/admin/CasesManagement.tsx` ✅
  - ✅ Cambiado de `useSuperAdminStats` a `useAdminCases`
  - ✅ Validación de roles: solo `super_admin`
  - ✅ Componente de acceso no autorizado
  - ✅ Actualizado import en SuperAdminDashboard
  - ✅ Build exitoso
  - ✅ Archivo original eliminado

- [x] `LawyersManagement` → `/admin/LawyersManagement.tsx` ✅
  - ✅ Validación de roles: solo `super_admin`
  - ✅ Componente de acceso no autorizado
  - ✅ Actualizado import en SuperAdminDashboard
  - ✅ Build exitoso
  - ✅ Archivo original eliminado

- [x] `LawyerApplicationsManagement` → `/admin/LawyerApplicationsManagement.tsx` ✅
  - ✅ Validación de roles: solo `super_admin`
  - ✅ Componente de acceso no autorizado
  - ✅ Actualizado import en SuperAdminDashboard
  - ✅ Build exitoso
  - ✅ Archivo original eliminado

- [x] `ClientsManagement` → `/admin/ClientsManagement.tsx` ✅
  - ✅ Validación de roles: solo `super_admin`
  - ✅ Componente de acceso no autorizado
  - ✅ Funcionalidad para añadir clientes manualmente
  - ✅ Enlaces de invitación con tokens únicos
  - ✅ Modal completo con formulario y enlace copiable
  - ✅ Edge Function `create-client-manual` creada
  - ✅ Actualizado import en SuperAdminDashboard
  - ✅ Build exitoso
  - ✅ Archivo original eliminado

### **🔄 FASE 4: HOOKS ESPECÍFICOS POR CARPETA - PENDIENTE**
- [ ] Migrar `useSuperAdminStats.ts` → `/hooks/admin/useSuperAdminStats.ts`
- [ ] Migrar `useRegularLawyerStats.ts` → `/hooks/lawyer/useRegularLawyerStats.ts`
- [ ] Migrar `useAssignedCases.ts` → `/hooks/lawyer/useAssignedCases.ts`
- [ ] Migrar `useClientDocumentManagement.ts` → `/hooks/client/useClientDocumentManagement.ts`
- [ ] Migrar `useDocumentManagement.ts` → `/hooks/shared/useDocumentManagement.ts`

### **🔄 FASE 5: LIMPIEZA Y OPTIMIZACIÓN - PENDIENTE**
- [ ] Eliminar componentes compartidos obsoletos del directorio raíz
- [ ] Optimizar imports en toda la aplicación
- [ ] Documentar APIs específicas por rol
- [ ] Tests de seguridad automatizados

## 🛡️ **Validaciones de Seguridad Implementadas**

### **Validación de Rol en Componentes**
```typescript
// Ejemplo implementado en SuperAdminMetrics y AssignedCasesManagement
const [userRole, setUserRole] = useState<string | null>(null);
const [lawyerType, setLawyerType] = useState<string | null>(null);

useEffect(() => {
  const validateAccess = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, tipo_abogado')
      .eq('id', user.id)
      .single();

    if (profile.role !== 'abogado' || profile.tipo_abogado !== 'super_admin') {
      setUserRole('unauthorized');
      return;
    }
    
    setUserRole(profile.role);
    setLawyerType(profile.tipo_abogado);
  };
  
  validateAccess();
}, [user]);
```

### **Validación de Rol en Hooks**
```typescript
// Ejemplo implementado en useAdminCases
if (profile.role !== 'abogado' || profile.tipo_abogado !== 'super_admin') {
  console.error('Acceso denegado: usuario no es super admin');
  setError('Acceso no autorizado');
  setCasos([]);
  return;
}
```

### **Componente de Acceso No Autorizado**
```typescript
const UnauthorizedAccess = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
        <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
          Acceso No Autorizado
        </h2>
        <p className="text-red-600 dark:text-red-300 mb-4">
          Solo los super administradores pueden acceder a esta funcionalidad.
        </p>
        <button onClick={() => window.location.href = '/abogados/dashboard'}>
          Volver al Dashboard
        </button>
      </div>
    </div>
  </div>
);
```

## 📊 **Métricas de Progreso**

### **Componentes Migrados: 5/8 (62.5%)**
- ✅ SuperAdminMetrics
- ✅ AssignedCasesManagement  
- ✅ CasesManagement
- ✅ CaseDetailModal (3 versiones)
- ✅ MisCasos (cliente)

### **Hooks Específicos: 3/3 (100%)**
- ✅ useAdminCases
- ✅ useLawyerCases
- ✅ useClientCases

### **Validaciones de Seguridad: 100%**
- ✅ Todos los componentes migrados tienen validación de roles
- ✅ Todos los hooks específicos tienen validación de roles
- ✅ Componentes de acceso no autorizado implementados

## 🚀 **Próximos Pasos Inmediatos**

### **Opción A: Migrar CasesManagement (Recomendado)**
- Componente más crítico para super_admin
- Completar funcionalidad principal
- Usar `useAdminCases` en lugar de `useSuperAdminStats`

### **Opción B: Migrar LawyersManagement**
- Componente más simple
- Menos riesgo
- Validación rápida

## 🔍 **Comandos de Verificación**

```bash
# Verificar que no hay imports cruzados
grep -r "import.*CaseDetailModal" src/components/

# Verificar que los hooks específicos se usan
grep -r "useClientCases\|useLawyerCases\|useAdminCases" src/

# Verificar validaciones de rol
grep -r "profile.role.*===" src/hooks/
```

## 📞 **Notas de Desarrollo**

### **Reglas de Migración Segura:**
1. **Siempre validar roles** antes de renderizar contenido
2. **Usar hooks específicos** por rol
3. **Implementar componente de acceso no autorizado**
4. **Verificar build** después de cada migración
5. **Eliminar archivos originales** para evitar duplicados

### **Problemas Conocidos y Soluciones:**

#### **Error PGRST201 - Relaciones Múltiples**
**Problema**: `Could not embed because more than one relationship was found for 'casos' and 'profiles'`

**Causa**: Hay dos relaciones en la base de datos:
- `casos_cerrado_por_fkey` - `casos(cerrado_por)` → `profiles(id)`
- `casos_cliente_id_fkey` - `casos(cliente_id)` → `profiles(id)`

**Solución**: Especificar la relación exacta en la query:
```typescript
// ❌ INCORRECTO
profiles (
  nombre,
  apellido,
  email
)

// ✅ CORRECTO
profiles!casos_cliente_id_fkey (
  nombre,
  apellido,
  email
)
```

**Aplicado en**: `useAdminCases.ts` - Línea 58

**Corrección adicional**: Se copió la query exacta de `useSuperAdminStats.ts` que funcionaba correctamente, incluyendo:
- Especificación de relaciones: `profiles!casos_cliente_id_fkey`, `asignaciones_casos!asignaciones_casos_caso_id_fkey`, `profiles!asignaciones_casos_abogado_id_fkey`, `profiles!casos_cerrado_por_fkey`
- Filtro de estados: `.in('estado', ['listo_para_propuesta', 'esperando_pago', 'disponible', 'agotado', 'cerrado'])`
- Interfaz `CasosSuperAdmin` específica para el admin

#### **Error de Navegación en SuperAdminDashboard**
**Problema**: El dashboard del super admin mostraba "Gestión de Abogados" en lugar de las métricas.

**Causa**: La condición `path.includes('/abogados')` se ejecutaba antes que el `else` que establece `"dashboard"`, causando que la URL `/abogados/dashboard` se interpretara como la sección de abogados.

**Solución**: Modificada la condición para excluir la URL del dashboard:
```typescript
// ❌ ANTES
} else if (path.includes('/abogados')) {
  setActiveSection("abogados");

// ✅ DESPUÉS  
} else if (path.includes('/abogados') && !path.endsWith('/dashboard')) {
  setActiveSection("abogados");
```

**Aplicado en**: `SuperAdminDashboard.tsx` - Línea 58

#### **Error de Hooks en SuperAdminMetrics**
**Problema**: Pantalla blanca en el dashboard del super admin con error "React has detected a change in the order of Hooks".

**Causa**: El hook `useMemo` estaba siendo llamado condicionalmente después de los `if` statements, violando las reglas de los hooks de React.

**Solución**: Movido el `useMemo` antes de todos los condicionales para asegurar que los hooks se ejecuten siempre en el mismo orden:
```typescript
// ❌ ANTES - Hook condicional
if (roleLoading) return <Loading />;
if (userRole !== 'abogado') return <Unauthorized />;
const metrics = React.useMemo(() => [...], [stats]); // ❌ Hook después de condicionales

// ✅ DESPUÉS - Hook siempre ejecutado
const metrics = React.useMemo(() => [...], [stats]); // ✅ Hook antes de condicionales
if (roleLoading) return <Loading />;
if (userRole !== 'abogado') return <Unauthorized />;
```

**Aplicado en**: `src/components/admin/SuperAdminMetrics.tsx` - Reestructuración completa del componente

### **Patrón de Validación Estándar:**
```typescript
const [userRole, setUserRole] = useState<string | null>(null);
const [lawyerType, setLawyerType] = useState<string | null>(null);
const [roleLoading, setRoleLoading] = useState(true);

// Validación en useEffect
// Loading state
// Bloqueo de acceso no autorizado
// Renderizado del componente
```

---

**Estado**: 🔄 **En Progreso - 62.5% Completado**
**Última actualización**: $(date)
**Próximo objetivo**: Migrar LawyersManagement a /admin/ 