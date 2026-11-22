# Módulos del MVP — Gym Manager

## Descripción

Este documento detalla los módulos funcionales en los que se divide el desarrollo del MVP de **Gym Manager**, en base al esquema de base de datos definido en `ESQUEMA_NOSQL.md` y al alcance definido en el `README.md` del proyecto.

Cada módulo agrupa una responsabilidad concreta del sistema, las colecciones (o subdocumentos) de MongoDB que utiliza, sus funcionalidades principales y los actores que interactúan con él. Esta división permite repartir el desarrollo entre los tres integrantes del equipo con dependencias acotadas entre módulos.

---

## Resumen

| # | Módulo | Colecciones / subdocumentos | Actores |
|---|---|---|---|
| 1 | Autenticación, Cuentas y Roles | `usuarios`, `sesiones` y vinculación con `clientes` | Administrador, Entrenador, Cliente con cuenta |
| 2 | Gestión de Clientes | `clientes`, `usuarios` y `turnos` | Administrador (gestión), Entrenador (consulta) |
| 3 | Catálogo de Ejercicios | `ejercicios` | Administrador (alta, modificación, baja); Entrenador (solo consulta) |
| 4 | Rutinas | `clientes.rutinas[]`, `ejercicios`, `usuarios` | Administrador y Entrenador (gestión), Cliente (consulta propia) |
| 5 | Historia Clínica | `clientes.historiaClinica` | Cliente, Administrador, Entrenador |
| 6 | Turnos | `turnos`, `configuracion`, `clientes`, `usuarios` | Administrador, Entrenador, Cliente |
| 7 | Pagos | `pagos`, `clientes` | Administrador |
| 8 | Inicio, Dashboard y Reportes | `clientes`, `pagos`, `turnos` | Administrador (indicadores), Entrenador (turnos propios) |

---

## 1. Autenticación y Roles

Gestiona el acceso al sistema. Existen tres roles: `ADMIN`, `ENTRENADOR` y `USUARIO` (este último representa a un cliente con cuenta). Cada rol tiene un conjunto distinto de permisos sobre el resto de los módulos.

**Colecciones:** `usuarios` y `sesiones`; vinculación con `clientes` mediante referencias recíprocas opcionales.

**Funcionalidades principales:**

- Registro e inicio de sesión.
- Validación de credenciales.
- Consulta y cierre de sesión persistida mediante cookie `HttpOnly`, con vencimiento de ocho horas.
- Cambio de contraseña por parte del propio usuario.
- Registro público con `['USUARIO']` y sesión inicial; no genera una ficha de cliente.
- Administración de cuentas y asignación de uno o varios roles por `ADMIN`.
- Control de acceso por pertenencia a roles y titularidad del recurso.
- Baja lógica y reactivación de cuentas; la baja elimina sus sesiones.

Google, recuperación por correo y verificación del correo mediante códigos quedan fuera del MVP. La primera cuenta administrativa se prepara manualmente.

---

## 2. Gestión de Clientes

Administra el alta, modificación y baja de los clientes del gimnasio, con o sin cuenta de usuario.

**Colecciones:** `clientes`.

**Funcionalidades principales:**

- Alta de cliente, con o sin cuenta asociada.
- Edición de datos personales y de contacto.
- Baja lógica y reactivación de clientes. La baja libera sus asignaciones de turnos y conserva el historial de movimientos, pagos, rutinas e historia clínica.
- Vinculación de un cliente sin cuenta con una cuenta nueva, si decide registrarse más adelante.

---

## 3. Catálogo de Ejercicios

Administra el catálogo genérico de ejercicios que los entrenadores usan para armar rutinas.

**Colecciones:** `ejercicios`.

**Funcionalidades principales y permisos:**

- **Alta, modificación y baja lógica:** exclusivas del Administrador. Además de la carga individual, el Administrador puede cargar o actualizar ejercicios en lote mediante la importación de un archivo Excel.
- **Consulta y búsqueda** (por ejemplo, por grupo muscular): disponible para Administrador y Entrenador. El Entrenador no puede crear, modificar ni dar de baja ejercicios.
- Identificación de cada ejercicio por `codigo` (además del `_id` de Mongo).

---

## 4. Rutinas

Gestiona la creación y asignación de rutinas de entrenamiento a los clientes, con historial acotado.

**Colecciones / subdocumentos:** `clientes.rutinas[]`, con referencias a `ejercicios`.

**Funcionalidades principales:**

- Creación de una rutina seleccionando ejercicios del catálogo (series, repeticiones, peso, descanso, orden, observaciones).
- Asignación y edición de la rutina vigente por Administrador o Entrenador; se registra la cuenta responsable.
- Al asignar una rutina nueva, baja lógica de la anterior (`activo: false`, `fechaBaja`) y límite de historial de 12 rutinas por cliente.
- Consulta de la rutina vigente desde el perfil del cliente.
- Consulta de hasta 12 rutinas conservadas por el personal e impresión desde el panel o desde el perfil del titular.

---

## 5. Historia Clínica

Gestiona la información básica de salud del cliente.

**Colecciones / subdocumentos:** `clientes.historiaClinica`.

**Funcionalidades principales y permisos:**

* **Crea y modifica:** el propio Cliente (con cuenta) puede cargar sus antecedentes iniciales cuando decida hacerlo (es opcional y no es obligatorio al registrarse) y actualizar la información si posteriormente sufre una lesión. También pueden crear y modificar la historia clínica los Administradores y Entrenadores, incluso cuando el cliente no tenga una cuenta.
* **Consulta:** el Administrador, el Entrenador y el Cliente titular pueden consultar la historia. Cargar o modificar es una operación diferenciada que valida nuevamente los permisos.
* **Sin acceso:** el resto de los clientes no puede acceder ni consultar la historia clínica de otros clientes.

---

## 6. Turnos

Gestiona los horarios de clase y la asignación de clientes a cada uno.

**Colecciones:** `turnos`, con referencias a `clientes` y `usuarios` (entrenador). La configuración general de la agenda (franjas horarias de apertura, cupo por defecto y los días de trabajo asignados a cada entrenador) se guarda en `configuracion`.

**Funcionalidades principales y permisos:**

- **Alta, modificación y baja de turnos:** el Entrenador solo puede crear, modificar o dar de baja turnos propios (donde él es el entrenador responsable); no puede tocar los turnos de otro entrenador. El Administrador puede operar sobre los turnos de cualquier entrenador.
- **Franjas horarias de apertura y cupo general:** son configuración global, exclusiva del Administrador. Un Entrenador puede generar o ajustar sus propios días de trabajo dentro de esas franjas, pero no puede cambiar el horario de apertura general ni el cupo por defecto.
- Asignación y baja de clientes a un turno, respetando el cupo; el Entrenador solo gestiona clientes en sus propios turnos.
- Turnos recurrentes de una hora, con control de solapamientos y cupo configurable.
- Generación en lote desde franjas y días de trabajo; conserva los turnos coincidentes y sus asignaciones.
- Baja o eliminación definitiva de turnos seleccionados, exclusiva del Administrador y con confirmación.
- Consulta de los turnos asignados desde el perfil del cliente.

---

## 7. Pagos

Permite administrar los pagos realizados por los clientes.

**Colecciones:** `pagos`, con referencia a `clientes`.

**Funcionalidades principales:**

- Registro de inscripción inicial y cuotas periódicas.
- Registro del vencimiento de obligaciones pendientes y de la fecha de pago al cobrar.
- Registro de obligaciones pagadas o pendientes y cobro posterior de pendientes/vencidas.
- Identificación de obligaciones impagas vencidas y actualización de su `estado` a `VENCIDO` al consultar pagos.
- Consulta de obligaciones próximas a vencer dentro de siete días desde el dashboard. El aviso al cliente es una gestión del personal.
- Registro manual de cuotas sucesivas conservando el historial, sin generación automática de obligaciones.
- Consulta del estado de pago por cliente (`PAGADO`, `PENDIENTE`, `VENCIDO`).

---

## 8. Inicio, Dashboard y Reportes

Ofrece al administrador una vista consolidada del estado general del gimnasio, sin tener que revisar cliente por cliente.

**Colecciones:** `clientes`, `pagos` y `turnos`. El inicio administrativo agrega indicadores; el entrenador consulta los turnos de hoy que le corresponden.

**Funcionalidades principales:**

- Cantidad de clientes activos.
- Cuotas vencidas y próximas a vencer.
- Ocupación de turnos (cupo utilizado vs. cupo máximo, por turno).
- Ingresos del mes, a partir de los pagos registrados en `pagos`.


## Alcance del perfil y la cuenta

El modelo monetario utiliza Decimal128 en Atlas. Las [limitaciones del MVP](../README.md#6-limitaciones-del-mvp) distinguen el alcance funcional de las restricciones de la versión.

El perfil de `USUARIO` reúne ficha vinculada, rutina vigente y turnos propios, e informa cuando no hay ficha. Todos los roles tienen acceso a Mi cuenta y al cambio autenticado de contraseña.
