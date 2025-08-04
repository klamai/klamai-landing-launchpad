# 🔒 CONFIGURACIÓN DE SEGURIDAD - KlamAI

## 📋 PASOS PARA CONFIGURAR LA SEGURIDAD

### 1. **Configurar Variables de Entorno (OBLIGATORIO)**

#### Opción A: Usar archivo de ejemplo (RECOMENDADO)
```bash
# Copiar el archivo de ejemplo
cp .env.example .env.local

# Editar con tus credenciales reales
nano .env.local
```

#### Opción B: Crear manualmente
Crear archivo `.env.local` en la raíz del proyecto:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://vwnoznuznmrdaumjyctg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3bm96bnV6bm1yZGF1bWp5Y3RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NTA2MzEsImV4cCI6MjA2NDQyNjYzMX0.DjW-_UqsNDp23rdfTS3jXftx75o_dt67hfPBxG0kldc

# Environment
NODE_ENV=development

# Security Settings
VITE_ENABLE_DEBUG_LOGS=false
VITE_MAX_LOGIN_ATTEMPTS=5
VITE_LOGIN_TIMEOUT_MINUTES=15
```

#### ⚠️ IMPORTANTE: El proyecto NO funcionará sin estas variables

Si no configuras las variables de entorno, verás este error:
```
❌ CRÍTICO: Variables de entorno de Supabase no configuradas.
Por favor, crea un archivo .env.local en la raíz del proyecto con:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

#### Verificar que `.env.local` esté en `.gitignore`:

```gitignore
# Environment variables
.env.local
.env.production
.env.staging
```

### 2. **Validación de Contraseñas**

El proyecto ahora incluye validación de contraseñas seguras:

- **Mínimo 8 caracteres**
- **Al menos una mayúscula**
- **Al menos una minúscula**
- **Al menos un número**
- **Al menos un carácter especial**
- **No secuencias comunes**
- **No caracteres repetidos consecutivos**

### 3. **Logging Seguro**

Se implementó logging seguro que:
- ✅ No expone información sensible
- ✅ Sanitiza emails, teléfonos, NIFs
- ✅ Remueve tokens JWT y claves API
- ✅ Solo muestra códigos de error seguros

### 4. **Edge Functions (Desarrollo)**

Durante el desarrollo, las Edge Functions están configuradas sin verificación JWT:

```toml
[functions.add-manual-case]
verify_jwt = false  # Solo para desarrollo
```

**⚠️ IMPORTANTE:** Cambiar a `verify_jwt = true` antes de producción.

### 5. **Verificar Configuración**

#### Ejecutar el proyecto:
```bash
npm run dev
```

#### ✅ Verificaciones exitosas:
- ✅ No errores sobre variables de entorno
- ✅ Proyecto inicia correctamente
- ✅ Logs sanitizados
- ✅ Validación de contraseñas funcionando

#### ❌ Si hay errores:
- Verificar que `.env.local` existe
- Verificar que las variables están correctas
- Verificar que no hay espacios extra

### 6. **Utilidades de Seguridad del Cliente** ✅ NUEVO

El proyecto incluye utilidades de seguridad avanzadas para el lado del cliente:

#### **Ubicación:** `src/utils/security.ts`

#### **Funciones Implementadas:**
```typescript
// Sanitización de texto para prevenir XSS
sanitizeText(text: string): string

// Validación de archivos
isValidFileType(file: File): boolean
isValidFileSize(file: File, maxSizeMB: number): boolean
isValidFileName(fileName: string): boolean

// Rate limiting para prevenir spam
checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean

// Validación de inputs
isValidUUID(uuid: string): boolean
isValidEmail(email: string): boolean
sanitizeSearchInput(searchTerm: string): string
sanitizeDocumentDescription(description: string): string

// Validación de estados
isValidCaseStatus(status: string): boolean
isValidDocumentType(type: string): boolean
```

#### **Configuración Automática:**
- ✅ **Rate limiting**: 5 uploads por minuto por caso
- ✅ **Tamaño máximo de archivo**: 10MB
- ✅ **Tipos de archivo permitidos**: PDF, imágenes, Word, texto plano
- ✅ **Sanitización automática**: Descripciones limitadas a 500 caracteres
- ✅ **Validación de UUIDs**: Todos los IDs verificados

#### **Verificación:**
```bash
# Verificar que las utilidades están disponibles
grep -r "sanitizeText" src/components/client/

# Verificar validaciones de archivo
grep -r "isValidFileType" src/components/client/

# Verificar rate limiting
grep -r "checkRateLimit" src/components/client/
```

### 6. **Configuración de Producción**

Cuando esté listo para producción:

1. **Habilitar JWT en Edge Functions:**
```toml
[functions.add-manual-case]
verify_jwt = true
```

2. **Configurar variables de producción:**
```bash
# .env.production
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_ENABLE_DEBUG_LOGS=false
```

3. **Implementar rate limiting**
4. **Configurar monitoreo de seguridad**

---

## 📊 **CUMPLIMIENTO RGPD**

### **✅ IMPLEMENTADO:**
- ✅ **Consentimiento explícito** para políticas de privacidad
- ✅ **Consentimiento para comunicaciones** comerciales
- ✅ **Validación de contraseñas robusta** (protección de datos)
- ✅ **Logging sanitizado** (no expone datos personales)
- ✅ **Variables de entorno** (protección de credenciales)
- ✅ **Sanitización de inputs** (prevención de XSS)
- ✅ **Validación de archivos** (protección contra malware)
- ✅ **Rate limiting** (prevención de abuso)
- ✅ **Auditoría de consultas** (control de acceso a datos)
- ✅ **Limpieza de logs del cliente** (sin información sensible)

### **🟡 PENDIENTE:**
- 📋 **Derecho al olvido** (eliminación completa de datos)
- 📋 **Portabilidad de datos** (exportación de datos personales)
- 📋 **Auditoría de accesos** (registro de quién accede a qué datos)
- 📋 **Encriptación de datos sensibles** (NIF/CIF)

### **📋 PLAN DE IMPLEMENTACIÓN RGPD:**
1. **Auditoría de accesos** (2-3 semanas)
2. **Derecho al olvido** (1 mes)
3. **Portabilidad de datos** (1 mes)
4. **Encriptación de datos sensibles** (1 mes)

---

## 🔍 VERIFICACIÓN DE SEGURIDAD

### Checklist de Seguridad:

- [ ] Variables de entorno configuradas
- [ ] `.env.local` en `.gitignore`
- [ ] Proyecto inicia sin errores
- [ ] Validación de contraseñas funcionando
- [ ] Logs sanitizados
- [ ] **NO hay claves hardcodeadas en el código**
- [ ] Edge Functions protegidas (producción)
- [ ] Cumplimiento RGPD básico
- [ ] **Utilidades de seguridad del cliente funcionando**
- [ ] **Rate limiting activo en uploads**
- [ ] **Validación de archivos implementada**
- [ ] **Logs del cliente limpios**
- [ ] **Sin acceso a tablas restringidas desde cliente**

### Comandos de Verificación:

```bash
# Verificar que no hay claves hardcodeadas
grep -r "eyJ" src/ --exclude-dir=node_modules

# Verificar variables de entorno
echo $VITE_SUPABASE_URL

# Verificar que el proyecto inicia
npm run dev

# Verificar archivos de configuración
ls -la | grep env

# Verificar utilidades de seguridad
grep -r "sanitizeText" src/utils/security.ts
grep -r "isValidFileType" src/components/client/
grep -r "checkRateLimit" src/components/client/

# Verificar que no hay logs sensibles
grep -r "console.log.*user" src/components/client/
grep -r "console.log.*caso" src/components/client/

# Verificar que no hay acceso a asignaciones_casos desde cliente
grep -r "asignaciones_casos" src/hooks/client/
```

---

## 🚨 ALERTAS DE SEGURIDAD

### Si ves estos errores:

1. **"Variables de entorno de Supabase no configuradas"**
   - ✅ Crear archivo `.env.local`
   - ✅ Verificar variables
   - ✅ Reiniciar el servidor

2. **"verify_jwt = false" en producción**
   - ⚠️ Cambiar a `verify_jwt = true`
   - ⚠️ Implementar autenticación en Edge Functions

3. **Logs con información sensible**
   - ✅ Verificar que se use `logError()` en lugar de `console.error()`
   - ✅ Revisar sanitización de logs

4. **Problemas de RGPD**
   - 📋 Implementar auditoría de accesos
   - 📋 Configurar derecho al olvido
   - 📋 Habilitar portabilidad de datos

5. **Logs sensibles en componentes del cliente**
   - ✅ Verificar que se eliminaron todos los console.log con información sensible
   - ✅ Revisar que solo hay logs de error críticos
   - ✅ Confirmar que no se exponen IDs de usuario o datos de casos

6. **Acceso a tablas restringidas desde cliente**
   - ✅ Verificar que no hay consultas a `asignaciones_casos` desde hooks del cliente
   - ✅ Confirmar que se usa `can_access_case` RPC para validaciones
   - ✅ Revisar que solo se accede a datos permitidos por RLS

7. **Validaciones de seguridad no funcionando**
   - ✅ Verificar que `src/utils/security.ts` existe y está importado
   - ✅ Confirmar que las validaciones de archivo están activas
   - ✅ Revisar que el rate limiting está funcionando

---

## 📞 SOPORTE DE SEGURIDAD

Si encuentras problemas de seguridad:

1. **Revisar** `SECURITY_AUDIT.md`
2. **Verificar** configuración de variables de entorno
3. **Consultar** logs sanitizados
4. **Contactar** al equipo de desarrollo

---

**Última actualización:** 01 de Agosto 2025  
**Versión:** 1.2 - CON AUDITORÍA DEL LADO DEL CLIENTE  
**Estado:** ✅ CONFIGURADO - SEGURO - CLIENTE AUDITADO 