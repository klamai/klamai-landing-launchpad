# Diagrama Visual - Flujo de Pago Anónimo

## 🎯 Flujo Principal

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Usuario       │    │   Chat IA       │    │   Propuesta     │
│   Anónimo       │───▶│   Klamai        │───▶│   Personalizada │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │   Usuario       │
                                              │   Pincha        │
                                              │   "PAGAR"       │
                                              └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │   Stripe        │
                                              │   Checkout      │
                                              │   (Escribe      │
                                              │    email)       │
                                              └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │   Pago          │
                                              │   Completado    │
                                              └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │   Nuestro       │
                                              │   Sistema       │
                                              │   Procesa       │
                                              │   Automáticamente│
                                              └─────────────────┘
```

## 🔀 Punto de Decisión

```
                    ┌─────────────────┐
                    │   ¿El email     │
                    │   ya existe     │
                    │   en nuestra    │
                    │   base de       │
                    │   datos?        │
                    └─────────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
                    ▼             ▼
            ┌─────────────┐ ┌─────────────┐
            │    SÍ       │ │     NO      │
            │             │ │             │
            ▼             ▼ ▼             ▼
    ┌─────────────┐ ┌─────────────┐
    │ Vincula a   │ │ Crea nueva  │
    │ cuenta      │ │ cuenta      │
    │ existente   │ │ automática  │
    └─────────────┘ └─────────────┘
            │             │
            ▼             ▼
    ┌─────────────┐ ┌─────────────┐
    │ Email:      │ │ Email:      │
    │ "Nueva      │ │ "Bienvenido │
    │ consulta    │ │ - Activa    │
    │ añadida"    │ │ tu cuenta"  │
    └─────────────┘ └─────────────┘
            │             │
            └─────┬───────┘
                  │
                  ▼
          ┌─────────────┐
          │   Usuario   │
          │   accede a  │
          │   su        │
          │   consulta  │
          └─────────────┘
```

## 📊 Resultado Final

```
┌─────────────────────────────────────────────────────────────┐
│                    ✅ ÉXITO TOTAL                          │
├─────────────────────────────────────────────────────────────┤
│  • Usuario pagó sin fricción                               │
│  • Su consulta está en su cuenta                           │
│  • Puede acceder desde su dashboard                        │
│  • Recibió confirmación por email                          │
│  • Todo quedó registrado correctamente                     │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Beneficios Clave

### Para el Usuario:
- ✅ **Sin registro previo** - Paga directamente
- ✅ **Proceso rápido** - Solo 3 clics
- ✅ **Comunicación clara** - Sabe qué hacer después
- ✅ **Acceso inmediato** - Ve su consulta al instante

### Para Klamai:
- ✅ **Mayor conversión** - Menos abandono en el pago
- ✅ **Datos organizados** - Cada caso en su lugar
- ✅ **Automatización total** - Cero intervención manual
- ✅ **Experiencia premium** - Cliente satisfecho

---

*Este flujo está optimizado para convertir visitantes anónimos en clientes satisfechos con la mínima fricción posible.*

