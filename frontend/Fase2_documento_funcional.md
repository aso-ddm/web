# FASE 2 - SISTEMA DE GESTIÓN
## Dragón de Madera - Asociación Sin Ánimo de Lucro

### **DOCUMENTO FUNCIONAL PARA LA DIRECTIVA**

---

## 📋 ÍNDICE

1. [¿Qué es este documento?](#qué-es-este-documento)
2. [Resumen Ejecutivo](#resumen-ejecutivo)
3. [¿Qué tenemos ahora? (Fase 1)](#qué-tenemos-ahora-fase-1)
4. [¿Qué vamos a construir? (Fase 2)](#qué-vamos-a-construir-fase-2)
5. [Funcionalidades Detalladas](#funcionalidades-detalladas)
6. [¿Quién puede hacer qué?](#quién-puede-hacer-qué)
7. [Ejemplos de Uso](#ejemplos-de-uso)
8. [Beneficios para la Asociación](#beneficios-para-la-asociación)
9. [Próximos Pasos](#próximos-pasos)

---

## 🎯 ¿QUÉ ES ESTE DOCUMENTO?

Este documento describe **en términos sencillos** lo que vamos a construir en la **Fase 2** del proyecto web de Dragón de Madera. Está pensado para que cualquier miembro de la directiva pueda entender qué funcionalidades tendrá el sistema, sin necesidad de conocimientos técnicos.

**Objetivo:** Obtener validación y feedback de la directiva sobre las funcionalidades propuestas antes de comenzar el desarrollo.

---

## 📊 RESUMEN EJECUTIVO

### ¿Qué vamos a hacer?

Vamos a transformar la web informativa actual en un **sistema de gestión completo** que permitirá:

✅ **Automatizar** el proceso de alta de socios  
✅ **Gestionar** la ludoteca y los préstamos de juegos  
✅ **Controlar** las visitas de personas no socias  
✅ **Facilitar** la comunicación entre directiva y socios  
✅ **Reducir** el trabajo manual administrativo  

### ¿A quién beneficia?

- 👥 **Directiva:** Menos trabajo administrativo, mejor control
- 🎮 **Ludotecario:** Gestión fácil de préstamos
- 👤 **Socios:** Autogestión y transparencia
- 🚀 **Asociación:** Profesionalización y escalabilidad

---

## 📍 ¿QUÉ TENEMOS AHORA? (Fase 1)

Actualmente la web de Dragón de Madera (que está a punto de ponerse en marcha) es **informativa**:

- 📄 Información sobre el club
- 📜 Normativa y estatutos
- 📞 Datos de contacto
- 📚 Listado de juegos de la ludoteca
- 📸 Galería de fotos

**Limitación:** Todo es estático, no hay gestión, no hay usuarios, no hay interacción.

---

## 🚀 ¿QUÉ VAMOS A CONSTRUIR? (Fase 2)

### Visión General

Convertir la web en una **plataforma de gestión** donde:

```
┌─────────────────────────────────────────┐
│                                         │
│     WEB DRAGÓN DE MADERA (Fase 2)      │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  🏠 PARTE PÚBLICA (Como ahora)         │
│     • Información del club              │
│     • Normativa                         │
│     • Contacto                          │
│     • Eventos                           │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  🔐 ÁREA PRIVADA (NUEVO)               │
│                                         │
│  Para Socios:                           │
│     • Ver perfil                        │
│     • Pedir préstamos de juegos         │
│     • Solicitar llaves                  │
│     • Registrar visitas                 │
│                                         │
│  Para Directiva:                        │
│     • Gestionar socios                  │
│     • Aprobar solicitudes               │
│     • Ver estadísticas                  │
│     • Configurar parámetros             │
│                                         │
│  Para Ludotecario:                      │
│     • Gestionar juegos                  │
│     • Aprobar/rechazar préstamos        │
│     • Registrar devoluciones            │
│                                         │
└─────────────────────────────────────────┘
```

---

## 💡 FUNCIONALIDADES DETALLADAS

### 1️⃣ GESTIÓN DE SOCIOS

#### 1.1 Proceso de Alta Simplificado

**SITUACIÓN ACTUAL:**
1. Persona interesada envía email a info@dragondemadera.com
2. Rellena formulario de Airtable
3. Envía justificante de pago por email
4. Secretario procesa manualmente
5. Secretario agrega a Telegram y Drive
6. Proceso lento y propenso a errores

**CON EL NUEVO SISTEMA:**

```
PERSONA INTERESADA
       │
       │ 1. Entra en www.dragondemadera.com
       ▼
┌──────────────────┐
│  Rellena         │
│  formulario      │
│  en la web       │
└────────┬─────────┘
         │
         │ 2. Envía automáticamente
         ▼
┌──────────────────┐
│  SECRETARIO      │
│  recibe          │
│  notificación    │
└────────┬─────────┘
         │
         │ 3. Revisa desde la web
         ▼
┌──────────────────┐
│  Aprueba o       │
│  rechaza con     │
│  un click        │
└────────┬─────────┘
         │
         ▼
  NUEVO SOCIO ACTIVO
  (recibe email automático)
```

**VENTAJAS:**
- ✅ Todo centralizado en la web
- ✅ Notificaciones automáticas
- ✅ Menos emails perdidos
- ✅ Proceso más rápido
- ✅ Mejor experiencia para el interesado

#### 1.2 Tipos de Cuotas

El sistema soportará los 3 tipos de cuotas:

**CUOTA INDIVIDUAL (15€/mes)**
```
┌─────────────┐
│   Socio A   │
└─────────────┘
```

**CUOTA PAREJA (20€/mes)**
```
┌─────────────┐     ┌─────────────┐
│   Socio A   │ ♥️  │   Socio B   │
└─────────────┘     └─────────────┘
```

**CUOTA FAMILIAR**
```
┌─────────────┐     ┌─────────────┐
│   Socio A   │ ♥️  │   Socio B   │
└──────┬──────┘     └──────┬──────┘
       │                   │
       └─────────┬─────────┘
                 │
       ┌─────────┴─────────┐
       │                   │
   ┌───▼────┐         ┌────▼───┐
   │ Hijo C │         │ Hijo D │
   └────────┘         └────────┘
```

**GESTIÓN FLEXIBLE:**
- Parejas pueden formarse después de ser socios → cambiar de individual a pareja
- Separaciones → volver a individual
- Nacimiento de hijos → añadir a cuota familiar
- Todo gestionable desde el perfil

#### 1.3 Sistema de Llaves del Club

**SITUACIÓN ACTUAL:**
- Socio tiene que preguntar cuándo puede pedir llaves
- Directiva tiene que recordar quién lleva 6 meses
- Proceso manual de seguimiento

**CON EL NUEVO SISTEMA:**

El socio ve en su perfil:

```
┌────────────────────────────────────┐
│   MI PERFIL                        │
├────────────────────────────────────┤
│                                    │
│   📅 Socio desde: 15/01/2025      │
│                                    │
│   🔑 ESTADO DE LLAVES:            │
│                                    │
│   Opción A (menos de 6 meses):    │
│   ⏳ Podrás solicitar llaves el:  │
│      15/07/2025                    │
│                                    │
│   Opción B (más de 6 meses):      │
│   ✅ Puedes solicitar llaves      │
│   [SOLICITAR LLAVES]               │
│                                    │
│   Opción C (ya solicitadas):      │
│   ⏳ Solicitud pendiente de        │
│      aprobación                    │
│                                    │
│   Opción D (aprobadas):           │
│   ✅ Llaves aprobadas el           │
│      20/07/2025 por María G.      │
│                                    │
└────────────────────────────────────┘
```

**VENTAJAS:**
- ✅ Socio sabe exactamente cuándo puede solicitar
- ✅ Directiva recibe notificación cuando hay solicitud
- ✅ Aprobación con un click
- ✅ Registro automático de quién aprobó y cuándo

---

### 2️⃣ GESTIÓN DE LUDOTECA Y PRÉSTAMOS

#### 2.1 Catálogo de Juegos

**SITUACIÓN ACTUAL:**
- Listado estático de juegos en la web
- No se sabe si está disponible o prestado
- Proceso de préstamo manual

**CON EL NUEVO SISTEMA:**

```
┌─────────────────────────────────────────┐
│   LUDOTECA DRAGÓN DE MADERA            │
├─────────────────────────────────────────┤
│                                         │
│  🔍 Buscar: [_____________] 🔎         │
│                                         │
│  Filtros: [Disponibles] [Prestados]    │
│           [Num. jugadores] [Duración]  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  📦 Catan                               │
│  3-4 jugadores | 60-90 min             │
│  ✅ DISPONIBLE                          │
│  [SOLICITAR PRÉSTAMO]                  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  📦 7 Wonders                           │
│  2-7 jugadores | 30 min                │
│  🔴 PRESTADO (Vuelve aprox: 25/01)     │
│                                         │
├─────────────────────────────────────────┤
```

#### 2.2 Proceso de Préstamo

**FLUJO COMPLETO:**

```
SOCIO                    SISTEMA                  LUDOTECARIO
  │                         │                          │
  │ 1. Busca juego         │                          │
  ├────────────────────────>│                          │
  │                         │                          │
  │ 2. Click "Solicitar"   │                          │
  ├────────────────────────>│                          │
  │                         │                          │
  │                         │ 3. Notificación         │
  │                         ├─────────────────────────>│
  │                         │                          │
  │                         │ 4. Revisa y aprueba     │
  │                         │<─────────────────────────┤
  │                         │                          │
  │ 5. Notificación         │                          │
  │<────────────────────────┤                          │
  │ "Aprobado! Recógelo"   │                          │
  │                         │                          │
  │                                                    │
  │ ... (Socio usa el juego) ...                      │
  │                                                    │
  │ 6. Devuelve físicamente │                          │
  │────────────────────────────────────────────────────>│
  │                         │                          │
  │                         │ 7. Confirma devolución  │
  │                         │<─────────────────────────┤
  │                         │                          │
  │                         │ 8. Juego disponible     │
  │                         │    de nuevo             │
```

**CARACTERÍSTICAS:**
- ❌ NO hay límite de juegos por socio
- ❌ NO hay plazo máximo de devolución
- ❌ NO hay penalizaciones por retraso
- ✅ Basado en confianza y responsabilidad

**VENTAJAS:**
- ✅ Socios ven disponibilidad en tiempo real
- ✅ Proceso de solicitud rápido
- ✅ Ludotecario gestiona desde su móvil/ordenador
- ✅ Historial completo de préstamos

---

### 3️⃣ REGISTRO DE VISITAS DE NO SOCIOS

#### 3.1 ¿Por qué es importante?

Actualmente la asociación permite que los socios traigan invitados, pero:
- ❌ Se pierde el control de quién viene
- ❌ No se sabe cuántas veces ha venido cada persona
- ❌ Difícil aplicar la norma de "3 visitas gratis, después pagar"

#### 3.2 Cómo funciona

**CUALQUIER SOCIO puede registrar una visita:**

```
┌────────────────────────────────────────┐
│   REGISTRAR VISITA                     │
├────────────────────────────────────────┤
│                                        │
│   Nombre completo (con mote):         │
│   [Carlos "Carly" Martínez]           │
│                                        │
│   Fecha de visita:                    │
│   [18/01/2025]                        │
│                                        │
│   [BUSCAR]                             │
│                                        │
└────────────────────────────────────────┘
        │
        │ Sistema busca automáticamente
        ▼
┌────────────────────────────────────────┐
│   RESULTADO:                           │
├────────────────────────────────────────┤
│                                        │
│   Carlos "Carly" Martínez              │
│   Visitas previas: 2                   │
│                                        │
│   ✅ Esta es su VISITA #3              │
│      GRATUITA                          │
│                                        │
│   Próxima visita deberá pagar 4€      │
│                                        │
│   [CONFIRMAR REGISTRO]                 │
│                                        │
└────────────────────────────────────────┘
```

**SI YA AGOTÓ LAS VISITAS GRATUITAS:**

```
┌────────────────────────────────────────┐
│   RESULTADO:                           │
├────────────────────────────────────────┤
│                                        │
│   Ana López                            │
│   Visitas previas: 3 (todas gratis)   │
│                                        │
│   💰 Esta es su VISITA #4              │
│      DEBE PAGAR 4€                     │
│                                        │
│   Cobrar en recepción/barra           │
│                                        │
│   [CONFIRMAR REGISTRO]                 │
│                                        │
└────────────────────────────────────────┘
```

#### 3.3 Configuración Flexible

**La directiva puede cambiar:**
- Número de visitas gratuitas (por defecto: 3)
- Precio de visita adicional (por defecto: 4€)

```
┌────────────────────────────────────┐
│  CONFIGURACIÓN VISITAS NO SOCIOS   │
│  (Solo Presidente/Secretario/      │
│   Tesorero)                        │
├────────────────────────────────────┤
│                                    │
│  Visitas gratuitas permitidas:    │
│  [  3  ] visitas                   │
│                                    │
│  Precio visita adicional:          │
│  [  4  ] €                         │
│                                    │
│        [GUARDAR CAMBIOS]           │
└────────────────────────────────────┘
```

**VENTAJAS:**
- ✅ Control total de visitantes
- ✅ Aplicación justa de la norma
- ✅ Estadísticas de visitas
- ✅ Identificar potenciales nuevos socios

---

## 👥 ¿QUIÉN PUEDE HACER QUÉ?

### Tabla de Permisos Simplificada

| Acción | Presidente | Secretario | Tesorero | Vocales | Ludotecario | Socio |
|--------|-----------|-----------|----------|---------|-------------|-------|
| **Ver datos de socios** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Aprobar nuevos socios** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Dar de baja socios** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Modificar datos socios** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Aprobar llaves** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Gestionar juegos** | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Aprobar préstamos** | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Solicitar préstamos** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Registrar visitas** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Cambiar configuración** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### Explicación de Roles

**🎩 PRESIDENTE / SECRETARIO / TESORERO**
- Control total del sistema
- Pueden hacer cualquier acción
- Responsables de aprobar altas y bajas

**👁️ VOCALES**
- Solo pueden **ver** datos de socios
- No pueden modificar, aprobar ni dar de baja
- Rol de supervisión

**📚 LUDOTECARIO**
- Gestión completa de ludoteca
- Aprobar/rechazar préstamos
- Registrar devoluciones

**👤 SOCIO BÁSICO**
- Ver su propio perfil
- Solicitar préstamos
- Registrar visitas de invitados

---

## 📖 EJEMPLOS DE USO

### Ejemplo 1: Nueva persona quiere unirse al club

**María visita el club con un amigo socio y le encanta. Quiere hacerse socia.**

1. **María** entra en www.dragondemadera.com
2. Click en "HAZTE SOCIO"
3. Rellena el formulario online (datos, tipo de cuota, etc.)
4. Hace la transferencia bancaria
5. Sube el justificante en el mismo formulario
6. Click en "ENVIAR SOLICITUD"

---

7. **Laura (Secretaria)** recibe un email: "Nueva solicitud de socio"
8. Entra en la web → Panel de Gestión → Solicitudes Pendientes
9. Ve la ficha de María con todos sus datos
10. Verifica que la transferencia es correcta
11. Click en "APROBAR"

---

12. **María** recibe un email automático:
    - "¡Bienvenida a Dragón de Madera!"
    - Usuario y contraseña para entrar en la web
    - Instrucciones para unirse a Telegram

13. **María** ya puede:
    - Entrar en la web con su usuario
    - Ver el catálogo de juegos
    - Solicitar préstamos
    - Ver cuándo puede pedir llaves

**Tiempo total: 10 minutos** (antes: varios días de emails)

---

### Ejemplo 2: Socio quiere llevarse un juego

**Pedro quiere llevarse el Catan este fin de semana**

1. **Pedro** entra en la web
2. Sección "Ludoteca"
3. Busca "Catan"
4. Ve que está DISPONIBLE
5. Click en "SOLICITAR PRÉSTAMO"
6. Añade nota opcional: "Lo necesito para el sábado"
7. Click en "ENVIAR SOLICITUD"

---

8. **Javier (Ludotecario)** recibe notificación
9. Entra en la web → Préstamos Pendientes
10. Ve la solicitud de Pedro
11. Click en "APROBAR"

---

12. **Pedro** recibe notificación: "Préstamo aprobado"
13. **Pedro** pasa por el club el viernes y recoge el Catan
14. Lo usa todo el fin de semana

---

15. **Pedro** devuelve el juego el lunes
16. **Javier** entra en la web
17. Préstamos Activos → Encuentra el de Pedro
18. Click en "CONFIRMAR DEVOLUCIÓN"
19. El Catan vuelve a estar DISPONIBLE para otros socios

**Proceso transparente y trazable**

---

### Ejemplo 3: Invitado viene al club

**Ana (socia) trae a su amiga Carmen al club por primera vez**

1. **Ana** entra en la web (desde su móvil mientras está en el club)
2. Sección "Registrar Visita"
3. Escribe: "Carmen Rodríguez"
4. Fecha: 18/01/2025
5. Click en "BUSCAR"

---

6. **Sistema** responde:
   - "Carmen Rodríguez - Primera visita"
   - "✅ VISITA GRATUITA (1 de 3)"
   - "Próximas 2 visitas también gratuitas"

7. **Ana** click en "CONFIRMAR"
8. **Carmen** disfruta del club gratis

---

**Carmen vuelve 2 veces más (visita 2 y 3) → gratis**

**Carmen vuelve una 4ª vez:**

1. **Ana** registra la visita como siempre
2. **Sistema** responde:
   - "Carmen Rodríguez - Visita #4"
   - "💰 DEBE PAGAR 4€"
   - "Agotó las 3 visitas gratuitas"

3. **Ana** le explica a Carmen
4. **Carmen** paga 4€ en la barra
5. **Ana** confirma el registro

**Carmen decide hacerse socia** → vuelve al Ejemplo 1

---

## 🎁 BENEFICIOS PARA LA ASOCIACIÓN

### Para la Directiva

✅ **Menos trabajo administrativo**
- No más emails perdidos
- Aprobaciones con un click
- Todo centralizado

✅ **Mejor control**
- Saber exactamente quién es socio
- Estadísticas en tiempo real
- Trazabilidad completa

✅ **Más transparencia**
- Cualquier vocal puede consultar datos
- Historial de todas las acciones
- Información siempre actualizada

### Para el Ludotecario

✅ **Gestión eficiente**
- Aprobar préstamos desde cualquier lugar
- Ver estado de todos los juegos
- Menos trabajo manual

✅ **Menos conflictos**
- Queda registrado quién tiene cada juego
- Fechas de préstamo y devolución claras
- Notificaciones automáticas

### Para los Socios

✅ **Autonomía**
- Solicitar préstamos cuando quieran
- Ver disponibilidad de juegos
- Gestionar su perfil

✅ **Transparencia**
- Saber cuándo pueden pedir llaves
- Ver el estado de sus solicitudes
- Menos incertidumbre

✅ **Mejor experiencia**
- Proceso de alta más rápido
- Menos burocracia
- Todo online

### Para la Asociación en general

✅ **Profesionalización**
- Imagen más moderna
- Procesos estandarizados
- Mejor organización

✅ **Escalabilidad**
- Preparada para crecer
- Más socios sin más carga administrativa
- Sistema sostenible a largo plazo

✅ **Datos e insights**
- Saber qué juegos se piden más
- Identificar potenciales socios
- Tomar decisiones informadas

---

## ⏳ PRÓXIMOS PASOS

### Validación de este documento

1. **Revisión por la directiva** (1 semana)
   - ¿Están todas las funcionalidades que necesitáis?
   - ¿Hay algo que cambiaríais?
   - ¿Falta algo importante?

2. **Reunión de feedback** (después de la revisión)
   - Resolver dudas
   - Ajustar funcionalidades
   - Priorizar qué hacer primero

3. **Aprobación final**
   - Directiva da el visto bueno
   - Se pasa a la fase de diseño y desarrollo

### Pendiente de definir (necesitamos vuestra opinión)

#### 🔴 ALTA PRIORIDAD

**1. Gestión de pagos de cuotas**
- ❓ ¿Queréis que el tesorero pueda marcar en la web qué socios han pagado cada mes?
- ❓ ¿O preferís seguir gestionándolo externamente (Excel, etc.)?
- ❓ Si sí, ¿qué información necesita registrar?

**2. Campos del formulario de alta**
- ❓ ¿Los campos actuales de Airtable están bien?
- ❓ ¿Hay algo que sobre o que falte?
- ❓ Revisar lista de campos (ver anexo)

**3. Modificación de datos de socios**
- ❓ ¿Qué datos puede modificar la directiva?
- ❓ ¿Hay datos que no se puedan cambiar (ej: DNI)?
- ❓ ¿Los socios pueden modificar sus propios datos?

#### 🟡 MEDIA PRIORIDAD

**4. Notificaciones**
- ❓ ¿Queréis recibir notificaciones por email?
- ❓ ¿También por Telegram?
- ❓ ¿Qué eventos deben generar notificación?

**5. Estadísticas y reportes**
- ❓ ¿Qué tipo de estadísticas os serían útiles?
- ❓ Ejemplos: Nº socios activos, juegos más prestados, visitas mensuales, etc.

**6. Migración de datos**
- ❓ ¿Queréis importar los socios actuales de Airtable?
- ❓ ¿O empezamos de cero con el nuevo sistema?

---

## 📎 ANEXOS

### Anexo A: Campos Actuales del Formulario de Alta

**Datos del formulario actual en Airtable:**

```
TIPO DE CUOTA
□ Cuota ordinaria (15€)
□ Cuota pareja (20€)

DATOS PERSONALES
• Nombre
• Apellidos
• DNI
• Email
• Teléfono
• Fecha de nacimiento
• Dirección (nuevo)

COMUNICACIÓN
• Alias de Telegram
• Usuario de BGG (BoardGameGeek) - opcional
• Apodo - opcional

LEGAL
• ¿Quieres que compartamos tus datos con tiendas?
  (Para descuentos en FreakMondo, Bazar de Iglesias, Dune)
```

**Pregunta para la directiva:**
- ❓ ¿Añadimos o quitamos algo?
- ❓ ¿La dirección es necesaria?
- ❓ ¿El campo "Apodo" es importante?

---

### Anexo B: Información Actual de la Asociación

**Contacto:**
- Email: info@dragondemadera.com
- Telegram: @dragondemadera_info
- Web: www.dragondemadera.com

**Cuotas:**
- Individual: 15€/mes
- Pareja: 20€/mes
- Familiar: Por definir

**Cuenta bancaria:**
- IBAN: ******

**Tiendas colaboradoras (10% descuento):**
- FreakMondo (juegos de mesa)
- Bazar de Iglesias (juegos de mesa)
- Dune (rol y cómics)

---

### Anexo C: Glosario

**Términos que aparecen en este documento:**

- **Directiva:** Presidente, Secretario, Tesorero y Vocales
- **BGG / BoardGameGeek:** Mayor base de datos online de juegos de mesa
- **Ludotecario:** Responsable de gestionar la ludoteca del club
- **Socio básico:** Miembro sin cargo directivo
- **Área privada:** Zona de la web solo accesible con usuario y contraseña
- **Notificación:** Aviso automático por email o aplicación
- **Dashboard / Panel:** Pantalla principal de gestión

---

## 📞 CONTACTO

**Para dudas sobre este documento:**
- Email del proyecto: [Por definir]
- Contacto técnico: [Por definir]

---

**Fecha:** Enero 2025  
**Versión:** 1.0 - Documento Funcional  
**Estado:** Pendiente de validación por Directiva

---

### 📝 ESPACIO PARA NOTAS Y COMENTARIOS

*La directiva puede usar este espacio para anotar dudas, sugerencias o comentarios durante la revisión del documento.*

---

