# Módulos a Desarrollar — Gym Manager

## Descripción

Este documento detalla los módulos funcionales en los que se divide el desarrollo del MVP de **Gym Manager**, en base al esquema de base de datos definido en `ESQUEMA_NOSQL.md` y al alcance definido en el `README.md` del proyecto.

Cada módulo agrupa una responsabilidad concreta del sistema, las colecciones (o subdocumentos) de MongoDB que utiliza, sus funcionalidades principales y los actores que interactúan con él. Esta división permite repartir el desarrollo entre los tres integrantes del equipo con dependencias acotadas entre módulos.

---

## Resumen

| # | Módulo | Colecciones / subdocumentos | Actores |
|---|---|---|---|
| 1 | Autenticación y Roles | `usuarios`, `clientes` (campos de cuenta) | Administrador, Entrenador, Cliente con cuenta |
| 2 | Gestión de Clientes | `clientes` | Administrador |
| 3 | Catálogo de Ejercicios | `ejercicios` | Administrador, Entrenador |
| 4 | Rutinas | `clientes.rutinas[]`, `ejercicios` | Entrenador, Cliente |
| 5 | Historia Clínica | `clientes.historiaClinica` | Cliente, Administrador, Entrenador |
| 6 | Turnos | `turnos`, `clientes`, `usuarios` | Administrador, Entrenador, Cliente |
| 7 | Pagos | `pagos`, `clientes` | Administrador |
| 8 | Dashboard y Reportes | `clientes`, `pagos`, `turnos` | Administrador |

---

## 1. Autenticación y Roles

Gestiona el acceso al sistema. Existen tres roles: `ADMIN`, `ENTRENADOR` y `USUARIO` (este último representa a un cliente con cuenta). Cada rol tiene un conjunto distinto de permisos sobre el resto de los módulos.

**Colecciones:** `usuarios`, `clientes` (a través del campo `usuarioId`).

**Funcionalidades principales:**
- Registro e inicio de sesión.
- Validación de credenciales.
- Recuperación de contraseña (por ejemplo, mediante un enlace enviado por correo).
- Cambio de contraseña por parte del propio usuario.
- Control de acceso a funcionalidades según el rol.
- Baja lógica de cuentas (`activo`, `fechaBaja`).

---

## 2. Gestión de Clientes

Administra el alta, modificación y baja de los clientes del gimnasio, con o sin cuenta de usuario.

**Colecciones:** `clientes`.

**Funcionalidades principales:**
- Alta de cliente, con o sin cuenta asociada.
- Edición de datos personales y de contacto.
- Baja lógica de clientes (`activo`, `fechaBaja`).
- Vinculación de un cliente sin cuenta con una cuenta nueva, si decide registrarse más adelante.

---

## 3. Catálogo de Ejercicios

Administra el catálogo genérico de ejercicios que los entrenadores usan para armar rutinas.

**Colecciones:** `ejercicios`.

**Funcionalidades principales:**
- Alta, modificación y baja lógica de ejercicios.
- Identificación de cada ejercicio por `codigo` (además del `_id` de Mongo).
- Búsqueda y filtrado (por ejemplo, por grupo muscular).

---

## 4. Rutinas

Gestiona la creación y asignación de rutinas de entrenamiento a los clientes, con historial acotado.

**Colecciones / subdocumentos:** `clientes.rutinas[]`, con referencias a `ejercicios`.

**Funcionalidades principales:**
- Creación de una rutina seleccionando ejercicios del catálogo (series, repeticiones, peso, orden, observaciones).
- Asignación de la rutina a un cliente.
- Al asignar una rutina nueva, baja lógica de la anterior (`activo: false`, `fechaBaja`) y límite de historial de 12 rutinas por cliente.
- Consulta de la rutina vigente desde el perfil del cliente.
- Impresión de la rutina para clientes sin cuenta.

---

## 5. Historia Clínica

Gestiona la información básica de salud del cliente.

**Colecciones / subdocumentos:** `clientes.historiaClinica`.

**Funcionalidades principales y permisos:**
- **Crea y modifica:** el propio Cliente (con cuenta) — carga los antecedentes iniciales cuando decide hacerlo (es opcional, no obligatoria al registrarse) y actualiza la información si sufre una lesión nueva.
- **Solo consulta:** Administrador y Entrenador pueden ver la historia clínica de un cliente, pero no pueden editarla ni cargarla en su nombre.
- **Sin acceso:** el resto de los clientes no puede ver la historia clínica de otro cliente.

---

## 6. Turnos

Gestiona los horarios de clase y la asignación de clientes a cada uno.

**Colecciones:** `turnos`, con referencias a `clientes` y `usuarios` (entrenador).

**Funcionalidades principales:**
- Alta de turnos (día, horario, cupo máximo).
- Asignación de un entrenador responsable.
- Asignación y baja de clientes a un turno, respetando el cupo.
- Consulta del turno asignado desde el perfil del cliente.

---

## 7. Pagos

Permite administrar los pagos realizados por los clientes.

**Colecciones:** `pagos`, con referencia a `clientes`.

**Funcionalidades principales:**
- Registro de inscripción inicial y cuotas periódicas.
- Registro de fecha de pago y fecha de vencimiento.
- Detección de cuotas vencidas: actualización del `estado` a `VENCIDO` cuando se supera la `fechaVencimiento` sin registrarse un nuevo pago.
- Alertas de vencimiento próximo (por ejemplo, cuotas que vencen en los próximos días), para que el administrador pueda avisar al cliente antes de que se corte el servicio.
- Renovación de membresía: registro de la cuota siguiente al vencer la anterior, manteniendo la continuidad del historial de pagos del cliente.
- Consulta del estado de pago por cliente (`PAGADO`, `PENDIENTE`, `VENCIDO`).

---

## 8. Dashboard y Reportes

Ofrece al administrador una vista consolidada del estado general del gimnasio, sin tener que revisar cliente por cliente.

**Colecciones:** `clientes`, `pagos`, `turnos` (solo lectura; este módulo no modifica datos, los consulta y agrega).

**Funcionalidades principales:**
- Cantidad de clientes activos.
- Cuotas vencidas y próximas a vencer.
- Ocupación de turnos (cupo utilizado vs. cupo máximo, por turno).
- Ingresos del mes, a partir de los pagos registrados en `pagos`.
