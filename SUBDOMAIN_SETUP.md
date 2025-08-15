# 🌐 CONFIGURACIÓN DE SUBDOMINIOS - KlamAI

## 📋 IMPLEMENTACIÓN COMPLETADA

### 1. **Arquitectura de Subdominios**

Se ha implementado un sistema de autenticación por subdominios que personaliza la experiencia según el tipo de usuario:

- **`admin.klamai.com`**: Portal de administración (solo Super Admin)
- **`abogados.klamai.com`**: Portal de abogados (Login + Solicitud de acceso)
- **`clientes.klamai.com`**: Portal de clientes (Login + Registro)
- **`klamai.com`**: Dominio principal (todos los roles)

### 2. **Variables de Entorno Requeridas**

Asegúrate de tener estas variables en tu `.env.local`:

```env
# Configuración de Subdominios
VITE_ADMIN_DOMAIN=admin.klamai.com
VITE_ABOGADOS_DOMAIN=abogados.klamai.com
VITE_CLIENTES_DOMAIN=clientes.klamai.com
```

### 3. **Configuración en Supabase Auth**

#### URLs de Redirect Permitidas (Configurar en Supabase Dashboard):

```
https://admin.klamai.com/auth-callback
https://abogados.klamai.com/auth-callback  
https://clientes.klamai.com/auth-callback
https://klamai.com/auth-callback
```

#### URLs de Site (Configurar en Supabase Dashboard):

```
https://admin.klamai.com
https://abogados.klamai.com
https://clientes.klamai.com  
https://klamai.com
```

### 4. **Configuración de DNS y Servidor**

#### Configuración de DNS:
```
admin.klamai.com     → A    → [TU_IP_SERVIDOR]
abogados.klamai.com  → A    → [TU_IP_SERVIDOR]
clientes.klamai.com  → A    → [TU_IP_SERVIDOR]
klamai.com           → A    → [TU_IP_SERVIDOR]
```

#### Configuración en Coolify:
- ✅ Acepta todos los subdominios configurados
- ✅ Redirección SSL configurada para todos los dominios

### 5. **Flujo de Autenticación por Subdominio**

#### Portal de Administración (`admin.klamai.com/auth`):
- **Solo Login**: No se muestra registro ni solicitud de acceso
- **Roles permitidos**: `super_admin`
- **Título**: "Portal de Administración"  
- **Google OAuth**: Habilitado
- **Redirección**: `/abogados/dashboard`

#### Portal de Abogados (`abogados.klamai.com/auth`):
- **Login + Solicitud de Acceso**: Dos pestañas disponibles
- **Roles permitidos**: `abogado`, `super_admin`
- **Título**: "Portal de Abogados"
- **Google OAuth**: Deshabilitado (solo email/password)
- **Formulario**: Integrado `LawyerApplicationForm`
- **Redirección**: `/abogados/dashboard`

#### Portal de Clientes (`clientes.klamai.com/auth`):
- **Login + Registro**: Dos pestañas disponibles  
- **Roles permitidos**: `cliente`
- **Título**: "Portal de Clientes"
- **Google OAuth**: Habilitado
- **Registro**: Formulario estándar con consentimiento RGPD
- **Redirección**: `/dashboard`

#### Dominio Principal (`klamai.com/auth`):
- **Login + Registro**: Funcionalidad completa
- **Roles permitidos**: Todos
- **Título**: "KlamAI"
- **Google OAuth**: Habilitado
- **Fallback**: Para usuarios que no especifican subdominio

### 6. **Seguridad y Validación**

#### SubdomainGuard:
- ✅ Valida que el usuario tenga el rol correcto para el subdominio
- ✅ Redirige automáticamente al subdominio correcto si hay mismatch
- ✅ Muestra mensaje de error descriptivo antes de redirigir
- ✅ Aplicado a todas las rutas protegidas

#### Configuración por Subdominio:
```typescript
// Configuración automática basada en hostname
admin: {
  allowedRoles: ['super_admin'],
  showRegistration: false,
  showLawyerApplication: false,
  isPublic: false // No se muestra en landing
}

abogados: {
  allowedRoles: ['abogado', 'super_admin'], 
  showRegistration: false,
  showLawyerApplication: true,
  isPublic: true
}

clientes: {
  allowedRoles: ['cliente'],
  showRegistration: true, 
  showLawyerApplication: false,
  isPublic: true
}
```

### 7. **CORS para Edge Functions**

Las Edge Functions están configuradas para aceptar requests de todos los subdominios:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // O específicamente los subdominios
  'Access-Control-Allow-Headers': 'authorization, x-client-info, x-client-version, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
```

### 8. **Desarrollo Local**

Para desarrollo local, el sistema detecta automáticamente:
- `localhost:8080/auth` → Funcionalidad completa
- `localhost:8080/abogados/auth` → Detecta por path y activa modo abogados
- Fallback al dominio principal si no hay detección específica

### 9. **Próximos Pasos**

1. ✅ **Implementación Base**: Completada
2. ✅ **Configuración de Rutas**: Completada  
3. ✅ **Guards de Seguridad**: Completado
4. ✅ **Personalización por Subdominio**: Completada
5. 🔄 **Configurar URLs en Supabase**: Pendiente (requiere acceso admin)
6. 🔄 **Probar flujos completos**: Pendiente
7. 🔄 **Validar OAuth en cada subdominio**: Pendiente

### 10. **Notas Técnicas**

#### Sesiones entre Subdominios:
- Las sesiones se mantienen por origen (dominio)
- No hay SSO automático entre subdominios
- Cada subdominio maneja su propia sesión Supabase
- OAuth redirige al subdominio donde se inició

#### Detección de Subdominio:
- Basada en `window.location.hostname`
- Variables de entorno para configuración
- Fallback inteligente para desarrollo
- Compatible con proxies y CDN

#### Performance:
- SubdomainGuard cachea el rol del usuario
- Una sola llamada a la base de datos por sesión
- Guards aplicados solo en rutas protegidas
- Optimizado para producción con React Query

---

**✅ IMPLEMENTACIÓN COMPLETADA**

El sistema de subdominios está completamente implementado y listo para usar. Solo falta configurar las URLs en Supabase Dashboard y realizar pruebas completas en los subdominios configurados.
