# Flujo de Consulta del Usuario - Nueva Arquitectura

## Diagrama del Flujo Completo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LANDING PAGE                                     │
│  Usuario llega y ve el formulario de consulta                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FORMULARIO INICIAL                                      │
│  • Usuario escribe su consulta                                            │
│  • Acepta términos y condiciones                                          │
│  • Se crea caso borrador en BD                                            │
│  • Se registra consentimiento RGPD                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CHAT TYPEBOT                                        │
│  • Usuario habla con asistente Typebot                                    │
│  • Se recopilan datos de contacto                                         │
│  • Se actualiza caso con datos del usuario                               │
│  • Se genera resumen de la consulta                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FINALIZACIÓN CHAT                                       │
│  • Typebot detecta que la consulta terminó                               │
│  • Llama a función Supabase:                                             │
│    └── iniciar-procesamiento-typebot                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│              FUNCIÓN ORQUESTADORA                                          │
│  iniciar-procesamiento-typebot                                            │
│  • Recibe payload completo de Typebot                                    │
│  • Inicia dos procesos en paralelo:                                      │
│    ├── generar-propuesta-inmediata (SÍNCRONO)                            │
│    └── procesar-analisis-background (ASÍNCRONO)                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│              RESPUESTA INMEDIATA                                           │
│  generar-propuesta-inmediata:                                             │
│  • Llama a OpenAI para generar propuesta                                 │
│  • Actualiza caso con propuesta_estructurada                             │
│  • Cambia estado a "listo_para_propuesta"                                │
│  • Retorna JSON de propuesta a Typebot                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TYPEBOT FRONTEND                                        │
│  • Recibe propuesta de Supabase                                           │
│  • Muestra modal personalizado al usuario                                │
│  • Incluye:                                                              │
│    ├── Título personalizado                                               │
│    ├── Subtítulo de refuerzo                                              │
│    └── Botones de acción                                                 │
└─────────────────────────────────────────────────────────────────────────────┐
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MODAL DE PLANES                                         │
│  • Mensaje personalizado con nombre del cliente                          │
│  • Opciones:                                                             │
│    ├── "Pagar consulta con abogado"                                      │
│    └── "Enviar presupuesto"                                              │
│  • Usuario selecciona una opción                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MODAL DE REGISTRO                                       │
│  • Se abre modal de registro/inicio de sesión                            │
│  • Usuario se registra o inicia sesión                                   │
│  • Continúa con el flujo de pago                                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│              PROCESAMIENTO EN SEGUNDO PLANO                               │
│  procesar-analisis-background (continúa ejecutándose):                    │
│  • Genera guía completa para el abogado                                  │
│  • Categoriza el lead                                                    │
│  • Procesa y transfiere archivos                                         │
│  • Enriquece el caso con análisis completo                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Beneficios de la Nueva Arquitectura

### 1. **Experiencia de Usuario Mejorada**
- **Respuesta Inmediata**: El modal aparece en segundos, no en minutos
- **Engagement**: Usuario ve respuesta personalizada al instante
- **Conversión**: Menor abandono por esperas largas

### 2. **Arquitectura Robusta**
- **Desacoplamiento**: Funciones especializadas y autónomas
- **Escalabilidad**: Procesamiento pesado no bloquea la respuesta al usuario
- **Mantenibilidad**: Cada función tiene una responsabilidad clara

### 3. **Seguridad y Confiabilidad**
- **Validación**: Cada función valida sus propios parámetros
- **Logging**: Trazabilidad completa de cada operación
- **Manejo de Errores**: Respuestas consistentes y informativas

## Funciones Supabase Implementadas

### 1. **`iniciar-procesamiento-typebot`** (Orquestadora)
- **Propósito**: Punto de entrada único para Typebot
- **Responsabilidad**: Coordinar el flujo completo
- **Respuesta**: Propuesta inmediata para el usuario

### 2. **`generar-propuesta-inmediata`** (Rápida)
- **Propósito**: Generar propuesta personalizada
- **Tiempo**: ~2-5 segundos
- **Output**: JSON con título, subtítulo y etiqueta

### 3. **`procesar-analisis-background`** (Pesada)
- **Propósito**: Análisis completo para el abogado
- **Tiempo**: ~30-60 segundos
- **Output**: Guía completa, categorización, archivos

## Flujo de Datos

### Payload de Typebot → Supabase
```json
{
  "caso_id": "{{caso_id}}",
  "nombre_borrador": "{{nombre}}",
  "motivo_consulta": "{{utm_value}}",
  "resumen_caso": "{{resumen_analisis_ia}}",
  "transcripcion_chat": {{historial_chat}},
  "files": {{files}}
}
```

### Respuesta Inmediata → Typebot
```json
{
  "success": true,
  "message": "Propuesta generada exitosamente",
  "propuesta": {
    "titulo_personalizado": "Título personalizado",
    "subtitulo_refuerzo": "Subtítulo de refuerzo",
    "etiqueta_caso": "Etiqueta del caso"
  },
  "caso_id": "uuid-del-caso"
}
```

## Estados del Caso

1. **`borrador`** → Caso inicial creado
2. **`listo_para_propuesta`** → Propuesta generada, modal listo
3. **`procesado`** → Análisis completo terminado (cuando termine la función de fondo)

## Consideraciones Técnicas

### Variables de Entorno Requeridas
- `OPENAI_API_KEY`
- `ASISTENTE_PROPUESTAS_ID`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

### Dependencias
- OpenAI API v4
- Supabase JS Client v2
- Deno Standard Library

### Monitoreo
- Logs estructurados en cada función
- Trazabilidad por `caso_id`
- Manejo de errores con contexto completo
