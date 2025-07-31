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

---

## 📞 SOPORTE DE SEGURIDAD

Si encuentras problemas de seguridad:

1. **Revisar** `SECURITY_AUDIT.md`
2. **Verificar** configuración de variables de entorno
3. **Consultar** logs sanitizados
4. **Contactar** al equipo de desarrollo

---

**Última actualización:** 01 de Agosto 2025  
**Versión:** 1.1 - CON RGPD Y .ENV.EXAMPLE  
**Estado:** ✅ CONFIGURADO - SEGURO 