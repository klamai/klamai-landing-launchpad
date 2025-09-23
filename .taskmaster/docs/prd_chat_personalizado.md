# Documento de Requisitos del Producto (PRD): Chat Personalizado en Dashboard v3

## 1. Resumen y Objetivo

**Objetivo:** Implementar una interfaz de chat nativa y personalizada dentro de la sección "Nueva Consulta" del dashboard del cliente. Esta interfaz permitirá la comunicación de texto y el **envío de archivos adjuntos**, y se comunicará directamente con la API de Typebot.

## 2. Problema a Resolver

La sección "Nueva Consulta" necesita una experiencia interactiva. La solución debe permitir a los clientes no solo describir su caso, sino también adjuntar documentos relevantes (contratos, notificaciones, etc.) de forma segura y sencilla, todo sin salir del dashboard.

## 3. Solución Propuesta

Desarrollaremos una interfaz de chat a medida utilizando un stack tecnológico moderno y consistente con el proyecto actual.

- **Arquitectura Frontend:**
    - **Librería de Componentes:** Se utilizará **Vercel AI SDK Elements** (`@ai-sdk/react`). Sus componentes `PromptInput` y `PromptInputActionAddAttachments` soportan la carga de archivos de forma nativa.
    - **Componente Orquestador (`NuevaConsultaSection.tsx`):** Gestionará la lógica principal.
    - **Componente de UI (`CustomChat.tsx`):** Contendrá la interfaz visual del chat.
    - **Hook de Lógica (`useTypebotChat.ts`):** Abstraerá la lógica de la conversación.
    - **Servicio de API (`typebotApiService.ts`):** Centralizará las llamadas a la API de Typebot.

- **Backend y Almacenamiento:**
    - **Lógica de Conversación:** Será manejada por **Typebot**.
    - **Creación de Caso:** La **Supabase Edge Function `crear-borrador-caso`** iniciará el proceso.
    - **Almacenamiento de Archivos:** Los archivos adjuntos se subirán desde el cliente directamente a un bucket de **Supabase Storage**. La URL del archivo subido será la que se envíe a Typebot.

## 4. Requisitos Funcionales

- **FR-1: Flujo de Inicio en Dos Pasos:**
    - **Paso 1 (Formulario):** Un campo de texto para la consulta inicial.
    - **Paso 2 (Chat):** Tras enviar, se muestra la interfaz de chat.
- **FR-2: Creación de Caso Asociado:** Al enviar la consulta, se invoca a `crear-borrador-caso` con el `user_id`.
- **FR-3: Inicio de Conversación con Typebot:** La primera llamada a `/startChat` debe incluir el `caso_id`, `user_id`, `nombre`, `email` y un contexto (`source: 'dashboard'`).
- **FR-4: Continuidad de la Conversación:** Mensajes posteriores usarán `/continueChat` con el `sessionId`.
- **FR-5: Renderizado de Mensajes:** La UI mostrará mensajes de texto.
- **FR-6: Indicadores de Estado:** Indicador visual para "bot escribiendo".
- **FR-7: Carga de Archivos Adjuntos (NUEVO):**
    - La interfaz del chat debe tener un botón o área para seleccionar y adjuntar archivos (imágenes, PDFs, etc.).
    - Antes de enviar el mensaje, los archivos seleccionados se subirán a un bucket de Supabase Storage, en una ruta asociada al `caso_id` (ej. `casos/{caso_id}/adjuntos/`).
    - Se debe mostrar un indicador de progreso de la subida.
- **FR-8: Envío de Enlaces de Archivos (NUEVO):** El mensaje enviado a la API de Typebot incluirá una propiedad (ej. `adjuntos`) que contendrá un array con las URLs de los archivos recién subidos a Supabase Storage.

## 5. Requisitos No Funcionales

- **NFR-1: Consistencia de Diseño:** El chat debe ser coherente con `shadcn/ui`.
- **NFR-2: Rendimiento:** La interfaz debe ser rápida y responsiva.
- **NFR-3: Manejo de Errores:** Mensajes de error claros si falla la comunicación o la subida de archivos.
- **NFR-4: Seguridad:** Las políticas de RLS de Supabase Storage deben asegurar que un usuario solo pueda subir archivos a sus propios casos.

## 6. Flujo de Usuario con Adjuntos

1. El cliente entra en "Nueva Consulta".
2. Escribe su consulta y hace clic en el icono de adjuntar archivo.
3. Selecciona un `contrato.pdf` de su disco.
4. La UI muestra una vista previa del archivo seleccionado y una barra de progreso. La subida a Supabase Storage comienza en segundo plano.
5. Una vez subido el archivo, el usuario pulsa "Iniciar Consulta".
6. El sistema llama a `crear-borrador-caso`.
7. `NuevaConsultaSection` renderiza `CustomChat.tsx`.
8. El hook `useTypebotChat` hace la llamada a `/startChat`, enviando el texto de la consulta **y la URL del `contrato.pdf`** en la variable `adjuntos`.
9. Typebot recibe el texto y el enlace, y puede procesar ambos.

## 7. Criterios de Aceptación (DoD)

- [ ] Se ha creado el servicio `typebotApiService.ts`.
- [ ] Se ha creado el hook `useTypebotChat.ts`.
- [ ] Se ha creado el componente de UI `CustomChat.tsx`.
- [ ] `NuevaConsultaSection.tsx` orquesta el flujo.
- [ ] La creación del caso asocia el `user_id`.
- [ ] Las variables (nombre, email, id) se envían a Typebot.
- [ ] **Se puede adjuntar y subir un archivo a Supabase Storage.**
- [ ] **La URL del archivo adjunto se envía correctamente a Typebot.**
- [ ] La conversación completa funciona de principio a fin.
- [ ] El diseño es 100% consistente con el dashboard.
