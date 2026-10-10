# Requerimientos Funcionales — Gym Manager

**Proyecto:** Gym Manager · Grupo 101  
**Documento:** Especificación de requerimientos funcionales  
**Versión:** 1.0 — Propuesta para validación del equipo  
**Estado:** Borrador; debe aprobarse y contrastarse con la implementación

## 1. Propósito

Este documento define las funciones que debe ofrecer Gym Manager en el MVP. Cada requerimiento tiene un identificador único `RF-XXX`; estos identificadores son la referencia oficial para la matriz de trazabilidad. Las reglas del dominio se mantienen en `REGLAS_DE_NEGOCIO.md`, los flujos de interacción en `CASOS_DE_USO.md` y las cualidades del sistema en `REQUERIMIENTOS_NO_FUNCIONALES.md`. Para evitar duplicación, esos documentos no deben volver a copiar la definición completa de cada RF.

## 2. Alcance

El MVP corresponde a un único gimnasio e incluye autenticación y roles, clientes, catálogo de ejercicios, rutinas, historia clínica básica, turnos semanales recurrentes, pagos y dashboard.

Quedan fuera del alcance del MVP: administración multi-tenant, Súper Administrador, suscripciones comerciales, inicio de sesión con Google, recuperación de contraseña por correo electrónico, envío automático de emails o WhatsApp, pagos en línea, facturación y comprobantes, adjuntos clínicos, reservas puntuales y rutinas generadas por IA.

## 3. Actores

- **Administrador (`ADMIN`):** gestiona la operación general del gimnasio según sus permisos.
- **Entrenador (`ENTRENADOR`):** trabaja con ejercicios, rutinas, turnos y datos de clientes según sus permisos.
- **Cliente con cuenta (`USUARIO` en el modelo):** consulta la información propia habilitada y gestiona su historia clínica propia conforme a las reglas del proyecto.
- **Sistema:** ejecuta el proceso definido para identificar y actualizar pagos vencidos.

Un cliente puede existir sin una cuenta de usuario. La relación entre una cuenta y un cliente, cuando existe, es opcional y uno a uno.

## 4. Convenciones

- **Prioridad Alta:** capacidad central del MVP.
- **Prioridad Media:** documentada en el alcance, pero requiere confirmar detalle o implementación.
- **Pendiente de decisión:** el repositorio no define aún un comportamiento con precisión suficiente; el equipo debe resolverlo antes de aprobar el requisito.
- Los requisitos especifican comportamiento deseado. Su inclusión aquí no implica que ya se encuentren implementados.

## 5. Requerimientos funcionales

### 5.1 Autenticación y usuarios

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-001 | El sistema deberá permitir que una persona con cuenta activa inicie sesión con sus credenciales. | Alta |
| RF-002 | El sistema deberá rechazar credenciales incorrectas y cuentas dadas de baja, sin crear una sesión autenticada. | Alta |
| RF-003 | El sistema deberá identificar el rol de la cuenta autenticada y aplicar los permisos asociados a ese rol. | Alta |
| RF-004 | El sistema deberá permitir que un usuario autenticado cierre su sesión. | Alta |
| RF-005 | El sistema deberá permitir que un usuario autenticado cambie su contraseña validando la contraseña actual antes de aceptar la nueva. | Media |
| RF-006 | Cuando un cliente con ficha existente obtenga una cuenta, el sistema deberá permitir vincularla al cliente correspondiente sin duplicar la ficha y respetando la relación uno a uno. | Alta |

**Fuera del MVP:** recuperar contraseñas mediante enlaces por email e iniciar sesión con Google. El alta inicial de cuentas de `ADMIN` y `ENTRENADOR`, así como el flujo exacto de registro de clientes, requiere confirmación del equipo.

### 5.2 Gestión de clientes

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-007 | El sistema deberá permitir al Administrador registrar un cliente con los datos identificatorios y de contacto definidos para el MVP, con o sin cuenta asociada. | Alta |
| RF-008 | El sistema deberá permitir al personal autorizado consultar el listado de clientes y los datos de un cliente seleccionado. | Alta |
| RF-009 | El sistema deberá permitir al Administrador modificar los datos personales y de contacto de un cliente. | Alta |
| RF-010 | El sistema deberá permitir al Administrador dar de baja lógicamente a un cliente, conservando el registro y su historial asociado. | Alta |
| RF-011 | El sistema deberá permitir buscar o filtrar clientes mediante criterios disponibles en la interfaz. Los campos de búsqueda deberán ser definidos por el equipo. | Media |

### 5.3 Catálogo de ejercicios

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-012 | El sistema deberá permitir a los actores autorizados registrar ejercicios en el catálogo genérico mediante los campos definidos en el modelo de datos. | Alta |
| RF-013 | El sistema deberá permitir consultar el catálogo y buscar o filtrar ejercicios por los criterios disponibles, por ejemplo, grupo muscular. | Alta |
| RF-014 | El sistema deberá permitir modificar los datos de un ejercicio existente a los actores autorizados. | Alta |
| RF-015 | El sistema deberá permitir dar de baja lógicamente un ejercicio, conservando el registro. | Alta |

**Pendiente de decisión:** `MODULOS.md` menciona Administrador y Entrenador como actores del catálogo, mientras que el caso de uso de alta asigna la operación al Administrador. Debe acordarse y mantenerse la misma política de permisos en todos los documentos.

### 5.4 Gestión de rutinas

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-016 | El sistema deberá permitir al Entrenador crear y asignar una rutina a un cliente existente y activo. | Alta |
| RF-017 | El sistema deberá permitir incorporar a la rutina ejercicios existentes en el catálogo y registrar, para cada ejercicio, orden, series, repeticiones, peso y observaciones; el descanso se conservará si está contemplado en el modelo aprobado. | Alta |
| RF-018 | El sistema deberá permitir consultar la rutina vigente de un cliente con cuenta desde su perfil. | Alta |
| RF-019 | Cuando se asigne una nueva rutina, el sistema deberá marcar la rutina anterior como inactiva y conservar la nueva como única rutina activa del cliente. | Alta |
| RF-020 | El sistema deberá conservar como máximo 12 rutinas por cliente, eliminando del historial la rutina inactiva más antigua cuando corresponda, sin eliminar la rutina vigente. | Alta |
| RF-021 | El sistema deberá permitir obtener una versión imprimible de la rutina de un cliente que no tenga cuenta. | Media |

### 5.5 Historia clínica

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-022 | El sistema deberá permitir registrar de forma opcional una historia clínica básica que contenga antecedentes, lesiones y observaciones relevantes para el entrenamiento. | Alta |
| RF-023 | El sistema deberá permitir actualizar la historia clínica conforme a las reglas de permisos del proyecto y registrar su fecha de actualización. | Alta |
| RF-024 | El sistema deberá permitir consultar la historia clínica al Administrador, al Entrenador y al cliente titular, según los permisos definidos. | Alta |
| RF-025 | El sistema deberá impedir que un cliente consulte o modifique la historia clínica de otro cliente y deberá evitar exponer esos datos en respuestas generales no autorizadas. | Alta |

No forman parte del MVP los adjuntos, estudios, recetas, certificados, imágenes ni otros archivos médicos. Los permisos descritos deben mantenerse alineados con `REGLAS_DE_NEGOCIO.md` y `SEGURIDAD.md`.

### 5.6 Gestión de turnos

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-026 | El sistema deberá permitir a los actores autorizados crear turnos semanales recurrentes con día de la semana, hora de inicio, hora de fin, capacidad máxima y entrenador responsable. | Alta |
| RF-027 | El sistema deberá permitir consultar los turnos disponibles, su ocupación y los clientes asignados; el cliente con cuenta podrá consultar su propio turno asignado. | Alta |
| RF-028 | El sistema deberá permitir al Administrador o Entrenador asignar un cliente existente a un turno activo. | Alta |
| RF-029 | El sistema deberá rechazar una asignación cuando el turno haya alcanzado su capacidad máxima. | Alta |
| RF-030 | El sistema deberá permitir retirar a un cliente de un turno a los actores autorizados. | Media |

Los turnos del MVP representan franjas recurrentes semanales. No se incluyen clases especiales ni reservas puntuales con fecha específica.

### 5.7 Gestión de pagos

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-031 | El sistema deberá permitir al Administrador registrar pagos de tipo `INSCRIPCION` o `CUOTA` para un cliente existente. | Alta |
| RF-032 | El sistema deberá registrar en cada pago el cliente asociado, el monto, las fechas de pago y vencimiento pertinentes y el estado correspondiente. | Alta |
| RF-033 | El sistema deberá registrar qué usuario autorizado cargó cada pago, mediante el dato de auditoría definido en el modelo. | Alta |
| RF-034 | El sistema deberá permitir consultar los pagos de un cliente y el estado de cada obligación. | Alta |
| RF-035 | El sistema deberá detectar las obligaciones impagas cuya fecha de vencimiento haya pasado y actualizar su estado a `VENCIDO`, conforme a la regla de negocio aprobada. | Alta |
| RF-036 | El sistema deberá permitir al Administrador consultar desde el dashboard los pagos próximos a vencer. Esta consulta no deberá enviar notificaciones automáticas al cliente. | Alta |

Los pagos en línea, las pasarelas de pago, la facturación, los comprobantes y las notificaciones externas quedan fuera del MVP. La regla exacta que relaciona una cuota vencida con el registro de una cuota posterior debe validarse antes de implementar el proceso automático.

### 5.8 Dashboard

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-037 | El sistema deberá mostrar al Administrador la cantidad de clientes activos. | Alta |
| RF-038 | El sistema deberá mostrar al Administrador un indicador de cuotas vencidas. | Alta |
| RF-039 | El sistema deberá mostrar al Administrador los pagos próximos a vencer. | Alta |
| RF-040 | El sistema deberá mostrar la ocupación de cada turno en relación con su capacidad máxima. | Alta |
| RF-041 | El sistema deberá mostrar al Administrador un indicador de ingresos mensuales calculado a partir de los pagos registrados. | Media |

**Pendiente de decisión:** definir exactamente qué estado convierte a un cliente en “activo”, cómo se calcula el ingreso mensual y si se excluyen pagos pendientes o vencidos de dicho cálculo.

## 6. Exclusiones del MVP

No se consideran requisitos comprometidos de esta entrega:

- gestión de múltiples gimnasios, multi-tenancy y rol Súper Administrador;
- suscripciones comerciales y personalización por gimnasio;
- login con Google y recuperación de contraseña por correo;
- avisos automáticos por email, SMS, WhatsApp o notificaciones push;
- pagos en línea, integración con pasarelas, facturación y comprobantes;
- documentación médica adjunta;
- clases puntuales o reservas con fecha;
- generación de rutinas mediante IA, molinetes o NFC.

## 7. Criterios generales de aceptación

Cada requisito deberá poder vincularse a uno o más casos de uso y casos de prueba. Para aceptarlo, la prueba deberá verificar el resultado esperado y, cuando corresponda, también los datos inválidos, la falta de autenticación, los permisos insuficientes y la conservación de la integridad de los datos.

La matriz `MATRIZ_DE_TRAZABILIDAD.md` conserva los enlaces entre identificadores y las verificaciones previstas. La existencia de una prueba prevista no implica que ya haya sido ejecutada.

## 8. Validaciones pendientes

Antes de aprobar esta especificación, el equipo debe cerrar: (1) alta de cuentas y vinculación cliente-usuario; (2) permiso de modificación de ejercicios; (3) criterios de búsqueda; (4) formato imprimible de rutina; (5) regla de vencimiento y regularización de pagos; (6) definición de cliente activo e ingreso mensual. Los casos de uso existentes deberán alinearse a estas decisiones.

## 9. Relación con otros documentos

- `REQUERIMIENTOS_NO_FUNCIONALES.md`: cualidades, restricciones de seguridad y operación.
- `REGLAS_DE_NEGOCIO.md`: políticas del dominio, identificadas como `RN-XX`.
- `CASOS_DE_USO.md`: interacción y flujos, identificados como `CU-XX`.
- `MATRIZ_DE_TRAZABILIDAD.md`: relación entre identificadores y verificaciones, sin duplicar sus descripciones.
