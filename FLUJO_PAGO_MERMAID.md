# Diagramas Mermaid - Flujo de Pago Anónimo

## 🎯 Flujo Principal del Proceso

```mermaid
flowchart TD
    A[Usuario Anónimo] --> B[Completa Chat con IA]
    B --> C[Recibe Propuesta Personalizada]
    C --> D[Pincha "PAGAR CONSULTA"]
    D --> E[Va a Stripe Checkout]
    E --> F[Escribe su Email]
    F --> G[Completa el Pago]
    G --> H[Stripe Confirma Pago]
    H --> I[Nuestro Sistema Procesa Automáticamente]
    I --> J{¿El email ya existe en nuestra base de datos?}
    
    J -->|SÍ| K[Vincula a Cuenta Existente]
    J -->|NO| L[Crea Nueva Cuenta Automáticamente]
    
    K --> M[Envía Email: "Nueva consulta añadida"]
    L --> N[Envía Email: "Bienvenido - Activa tu cuenta"]
    
    M --> O[Usuario accede desde su dashboard]
    N --> P[Usuario activa cuenta y accede]
    
    O --> Q[✅ Consulta disponible en su cuenta]
    P --> Q
    
    style A fill:#e1f5fe
    style Q fill:#c8e6c9
    style J fill:#fff3e0
    style K fill:#f3e5f5
    style L fill:#f3e5f5
```

## 🔀 Flujo Detallado de Decisión

```mermaid
flowchart TD
    A[Pago Completado en Stripe] --> B[Stripe envía webhook]
    B --> C[Verifica firma del webhook]
    C --> D[Registra evento en stripe_webhook_events]
    D --> E[Detecta flujo_origen: 'chat_anonimo']
    E --> F[Llama handleAnonymousPayment]
    F --> G[Extrae email del customer_details]
    G --> H[Busca email en tabla profiles]
    H --> I{¿Email encontrado?}
    
    I -->|SÍ| J[Usuario Existente]
    I -->|NO| K[Usuario Nuevo]
    
    J --> L[Obtiene ID del usuario existente]
    L --> M[Vincula caso al usuario existente]
    M --> N[Cambia estado caso a 'disponible']
    N --> O[Registra pago en tabla pagos]
    O --> P[Envía email informativo]
    P --> Q[✅ Proceso completado]
    
    K --> R[Crea nuevo usuario con Supabase Auth]
    R --> S[Espera 2 segundos para trigger]
    S --> T[Verifica que perfil se creó]
    T --> U[Vincula caso al nuevo usuario]
    U --> V[Cambia estado caso a 'disponible']
    V --> W[Registra pago en tabla pagos]
    W --> X[Genera token de activación]
    X --> Y[Envía email de bienvenida]
    Y --> Z[✅ Proceso completado]
    
    style A fill:#e3f2fd
    style E fill:#fff3e0
    style I fill:#fff3e0
    style J fill:#e8f5e8
    style K fill:#fce4ec
    style Q fill:#c8e6c9
    style Z fill:#c8e6c9
```

## 📊 Arquitectura del Sistema

```mermaid
graph TB
    subgraph "Frontend"
        A[ProposalDisplay.tsx]
        B[Usuario pincha "Pagar"]
    end
    
    subgraph "Edge Functions"
        C[crear-sesion-checkout-anonima]
        D[stripe-webhook]
        E[generate-client-activation-token]
        F[send-email]
    end
    
    subgraph "Base de Datos"
        G[Tabla: casos]
        H[Tabla: profiles]
        I[Tabla: pagos]
        J[Tabla: client_activation_tokens]
        K[Tabla: stripe_webhook_events]
    end
    
    subgraph "Servicios Externos"
        L[Stripe Checkout]
        M[Stripe Webhooks]
        N[Supabase Auth Admin]
        O[Email Service]
    end
    
    A --> B
    B --> C
    C --> L
    L --> M
    M --> D
    D --> K
    D --> G
    D --> H
    D --> I
    D --> J
    D --> N
    D --> E
    D --> F
    F --> O
    
    style A fill:#e1f5fe
    style D fill:#fff3e0
    style L fill:#f3e5f5
    style M fill:#f3e5f5
    style K fill:#e8f5e8
```

## 🎯 Flujo de Estados del Caso

```mermaid
stateDiagram-v2
    [*] --> borrador: Usuario inicia chat
    borrador --> listo_para_propuesta: IA genera propuesta
    listo_para_propuesta --> esperando_pago: Usuario pincha pagar
    esperando_pago --> disponible: Pago completado (webhook)
    disponible --> [*]: Usuario accede a consulta
    
    note right of esperando_pago
        Se crea sesión Stripe Checkout
        con flujo_origen: 'chat_anonimo'
    end note
    
    note right of disponible
        Caso vinculado al usuario
        (existente o nuevo)
        Estado final para ambos casos
    end note
```

## 📈 Métricas y Resultados

```mermaid
pie title Distribución de Resultados del Flujo
    "Usuarios Existentes" : 40
    "Usuarios Nuevos" : 60
```

## 🔧 Componentes Técnicos (Simplificado)

```mermaid
graph LR
    subgraph "Usuario"
        A[Completa Chat]
        B[Ve Propuesta]
        C[Pincha Pagar]
        D[Paga en Stripe]
    end
    
    subgraph "Sistema Klamai"
        E[Detecta Pago]
        F[Busca Usuario]
        G[Vincula Caso]
        H[Envía Email]
    end
    
    subgraph "Resultado"
        I[Consulta Disponible]
    end
    
    A --> B --> C --> D
    D --> E --> F --> G --> H --> I
    
    style A fill:#e1f5fe
    style D fill:#f3e5f5
    style I fill:#c8e6c9
```

---

*Estos diagramas muestran el flujo completo del sistema de pago anónimo, desde la interacción del usuario hasta el procesamiento automático en el backend.*
