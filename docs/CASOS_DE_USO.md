# Casos de Uso — Gym Manager

## Descripción

Este documento detalla los casos de uso principales del sistema, organizados por módulo (ver `MODULOS.md`). Cada caso de uso describe el actor que lo inicia, la condición necesaria para ejecutarlo, el flujo principal, los flujos alternativos o de excepción, y el resultado esperado.

---

## Módulo 1 — Autenticación y Roles

### CU-01: Iniciar sesión

- **Actor:** Administrador, Entrenador, Cliente con cuenta.
- **Precondición:** El usuario posee una cuenta activa (`activo: true`).
- **Flujo principal:**
  1. El usuario ingresa email y contraseña.
  2. El sistema valida las credenciales contra `usuarios.passwordHash`.
  3. El sistema genera un token aleatorio, guarda su hash y vencimiento en `sesiones` y envía una cookie `HttpOnly` al navegador.
  4. El sistema consulta los roles actuales de la cuenta y dirige al inicio del personal o al perfil del titular.

- **Flujo alternativo:** Si las credenciales son incorrectas, el sistema muestra un error y no genera el token.
- **Flujo alternativo:** Si la cuenta está dada de baja (`activo: false`), el sistema rechaza el inicio de sesión.
- **Postcondición:** El usuario queda autenticado y el sistema conoce su rol para autorizar las siguientes acciones.

### CU-02: Recuperar contraseña — fuera del MVP

La recuperación mediante correo queda reservada para una evolución posterior. Se conserva el identificador para mantener la trazabilidad histórica. El MVP permite cambiar la contraseña desde una sesión autenticada mediante CU-03.

### CU-03: Cambiar contraseña

- **Actor:** Administrador, Entrenador, Cliente con cuenta.
- **Precondición:** El usuario está autenticado.
- **Flujo principal:**
  1. El usuario ingresa su contraseña actual y la nueva.
  2. El sistema valida la contraseña actual contra `passwordHash`.
  3. El sistema actualiza `passwordHash` y `fechaModificacion`.

- **Flujo alternativo:** Si la contraseña actual no coincide, el sistema rechaza el cambio.
- **Postcondición:** La contraseña queda actualizada, se renueva la sesión actual y se eliminan las anteriores. Se rechazan confirmaciones distintas y contraseñas que incumplan los límites.

---

## Módulo 2 — Gestión de Clientes

### CU-04: Dar de alta un cliente

- **Actor:** Administrador.
- **Precondición:** El administrador está autenticado.
- **Flujo principal:**
  1. El administrador carga los datos identificatorios del cliente (nombre, apellido, DNI, contacto).
  2. El sistema valida que el DNI no esté ya registrado (índice único `clientes.dni`).
  3. El sistema crea el documento en `clientes` con `activo: true` y `fechaCreacion`.

- **Flujo alternativo:** Si el DNI ya existe, el sistema rechaza el alta.
- **Postcondición:** El cliente queda registrado, con o sin cuenta de usuario asociada.

### CU-05: Dar de baja un cliente

- **Actor:** Administrador.
- **Precondición:** El cliente existe y está activo.
- **Flujo principal:**
  1. El administrador selecciona el cliente y confirma la baja.
  2. El sistema marca `activo: false` y completa `fechaBaja`, sin eliminar el documento.

- **Postcondición:** La ficha queda inactiva, conserva sus rutinas, pagos e historia clínica y se retira de sus turnos en la misma transacción. Cada retiro se registra en `turnos.historialClientes`. La cuenta vinculada mantiene su estado propio.

### CU-16: Modificar un cliente

- **Actor:** Administrador.
- **Precondición:** El cliente existe.
- **Flujo principal:**
  1. El administrador selecciona el cliente y edita sus datos identificatorios y de contacto.
  2. Si se modifica el DNI, el sistema valida que no pertenezca a otra ficha, incluida una inactiva.
  3. El sistema actualiza el documento y su `fechaModificacion`.

- **Flujo alternativo:** Si el nuevo DNI ya pertenece a otro cliente, el sistema rechaza la modificación.
- **Postcondición:** Los datos del cliente quedan actualizados.

### CU-20: Consultar el listado de clientes

- **Actor:** Administrador, Entrenador.
- **Precondición:** El actor está autenticado.
- **Flujo principal:**
  1. El actor solicita el listado de clientes.
  2. El sistema muestra las fichas con su estado y permite buscar o filtrar por nombre, apellido o DNI.
  3. El actor accede a las operaciones habilitadas para la ficha; la historia clínica se consulta mediante su operación específica.

- **Postcondición:** El actor visualiza el listado y puede acceder al detalle de cada cliente.

---

## Módulo 3 — Catálogo de Ejercicios

### CU-06: Dar de alta un ejercicio

- **Actor:** Administrador.
- **Precondición:** El administrador está autenticado.
- **Flujo principal:**
  1. El administrador carga nombre, descripción, grupo muscular y un `codigo` identificatorio.
  2. El sistema valida que el `codigo` no esté repetido (índice único `ejercicios.codigo`).
  3. El sistema crea el documento en `ejercicios`.

- **Flujo alternativo:** Si el `codigo` ya existe, el sistema rechaza el alta.
- **Postcondición:** El ejercicio queda disponible para que los entrenadores lo usen en rutinas.

### CU-17: Modificar un ejercicio

- **Actor:** Administrador.
- **Precondición:** El ejercicio existe.
- **Flujo principal:**
  1. El administrador selecciona el ejercicio y edita nombre, descripción, grupo muscular o `codigo`.
  2. Si se modifica el `codigo`, el sistema valida que no esté repetido.
  3. El sistema actualiza el documento en `ejercicios`.

- **Flujo alternativo (carga masiva):** El administrador importa un XLSX con encabezados `codigo`, `nombre`, `grupo muscular` y `descripcion`. Código, nombre y grupo muscular son obligatorios; la descripción es opcional. El sistema presenta una vista previa y procesa las filas válidas, creando o actualizando por código e informando los errores por fila. La importación es secuencial y puede completarse parcialmente. El formato y los límites se detallan en el README del frontend.
- **Postcondición:** El catálogo queda actualizado.

### CU-18: Dar de baja un ejercicio

- **Actor:** Administrador.
- **Precondición:** El ejercicio existe y está activo.
- **Flujo principal:**
  1. El administrador selecciona el ejercicio y confirma la baja.
  2. El sistema marca `activo: false` y completa `fechaBaja`, sin eliminar el documento.

- **Postcondición:** El ejercicio deja de estar disponible para nuevas rutinas; las rutinas existentes que ya lo incluían conservan la referencia.

### CU-21: Consultar el catálogo de ejercicios

- **Actor:** Administrador, Entrenador.
- **Precondición:** El actor está autenticado.
- **Flujo principal:**
  1. El actor solicita el catálogo de ejercicios.
  2. El sistema muestra los ejercicios activos, con la posibilidad de buscar o filtrar por nombre o grupo muscular.

- **Postcondición:** El actor visualiza el catálogo disponible para armar rutinas.

---

## Módulo 4 — Rutinas

### CU-07: Asignar una rutina a un cliente

- **Actor:** Administrador o Entrenador.
- **Precondición:** El cliente existe y está activo; el catálogo de ejercicios tiene al menos un ejercicio cargado.
- **Flujo principal:**
  1. El personal selecciona un cliente activo y ejercicios activos del catálogo, indicando series, repeticiones, peso, descanso, orden y observaciones. Se registra su cuenta como responsable de la asignación.
  2. El sistema marca `activo: false` en la rutina anteriormente vigente del cliente (si existía) y completa su `fechaBaja`.
  3. El sistema agrega la rutina nueva al arreglo `rutinas[]` con `activo: true`.
  4. Si el historial preparado supera las 12 rutinas, el sistema retira la inactiva más antigua y guarda el arreglo actualizado dentro de la transacción.

- **Postcondición:** El cliente tiene una única rutina vigente, y el historial no supera las 12 rutinas.

### CU-08: Consultar la rutina vigente

- **Actor:** Cliente con cuenta.
- **Precondición:** El cliente está autenticado y tiene al menos una rutina asignada.
- **Flujo principal:**
  1. El cliente accede a su perfil.
  2. El sistema muestra la rutina con `activo: true` y sus ejercicios asociados.

- **Flujo alternativo:** Para clientes sin cuenta, el administrador/entrenador imprime la rutina en papel.
- **Postcondición:** El cliente conoce su rutina actual.

---

## Módulo 5 — Historia Clínica

### CU-09: Cargar historia clínica

- **Actor:** Cliente con cuenta, Administrador, Entrenador.
- **Precondición:** El cliente existe (con o sin cuenta).
- **Flujo principal:**
  1. El actor carga antecedentes y lesiones previas del cliente.
  2. El sistema guarda la información en `clientes.historiaClinica` con `fechaActualizacion` y `usuarioModificacionId`.

- **Regla aplicada:** Un cliente con cuenta solo puede cargar su propia historia clínica; el administrador y el entrenador pueden cargarla en nombre de cualquier cliente, incluso sin cuenta.
- **Postcondición:** La historia clínica queda registrada (es un campo opcional, `0..1`).

### CU-10: Consultar historia clínica

- **Actor:** Cliente con cuenta (la propia), Administrador, Entrenador.
- **Precondición:** El cliente tiene historia clínica cargada.
- **Flujo principal:**
  1. El actor solicita ver la historia clínica del cliente.
  2. El sistema verifica el rol: si es Administrador, Entrenador, o el propio Cliente, muestra la información.

- **Flujo alternativo:** Si el solicitante es otro cliente (no el titular), el sistema deniega el acceso.
- **Postcondición:** El actor autorizado visualiza antecedentes, lesiones y observaciones.

---

## Módulo 6 — Turnos

### CU-11: Crear un turno

- **Actor:** Administrador, Entrenador.
- **Precondición:** El actor está autenticado.
- **Flujo principal:**
  1. El actor define día recurrente semanal, horario de una hora, cupo entero positivo y entrenador responsable activo.
  2. El sistema comprueba el horario y la ausencia de solapamientos del entrenador y crea el turno con `activo: true`.

- **Flujo alternativo:** Si el actor es Entrenador y el entrenador responsable no es él mismo, el sistema rechaza la operación (RN-16).
- **Postcondición:** El turno queda disponible para asignar clientes.

### CU-12: Asignar un cliente a un turno

- **Actor:** Administrador, Entrenador.
- **Precondición:** El turno existe y está activo; el cliente existe y está activo.
- **Flujo principal:**
  1. El actor selecciona un cliente y un turno.
  2. El sistema valida que la cantidad de clientes asignados sea menor a `capacidad`.
  3. El sistema agrega el `clienteId` al arreglo `clientes[]` del turno.

- **Flujo alternativo:** Si el turno ya alcanzó el cupo máximo, el sistema rechaza la asignación.
- **Flujo alternativo:** Si el actor es Entrenador y el turno no es suyo, el sistema rechaza la operación (RN-16).
- **Postcondición:** El cliente queda anotado en el turno.

### CU-19: Retirar un cliente de un turno

- **Actor:** Administrador, Entrenador.
- **Precondición:** El cliente está asignado al turno.
- **Flujo principal:**
  1. El actor selecciona el turno y el cliente asignado, y confirma el retiro.
  2. El sistema quita el `clienteId` del arreglo `clientes[]` del turno, liberando un lugar en el cupo.

- **Flujo alternativo:** Si el actor es Entrenador y el turno no es suyo, el sistema rechaza la operación (RN-16).
- **Postcondición:** El cliente deja de estar asignado a ese turno. Su historial de pagos e historia clínica no se ve afectado.
- **Nota:** el MVP incluye edición, baja, reactivación y control de solapamientos. El Administrador puede generar agenda y operar en lote con confirmación. La reasignación automática de clientes y las reservas puntuales quedan fuera del alcance.

---

## Módulo 7 — Pagos

### CU-13: Registrar un pago

- **Actor:** Administrador.
- **Precondición:** El cliente existe.
- **Flujo principal:**
  1. El administrador selecciona un cliente activo y registra el tipo (`INSCRIPCION` o `CUOTA`), el monto monetario de referencia Decimal128 y si la obligación ya fue pagada. Para pendientes indica vencimiento; `fechaPago` se completa al cobrar.
  2. El sistema guarda el pago en `pagos`, incluyendo `usuarioRegistroId` con el usuario que lo cargó.

- **Postcondición:** El pago queda registrado y asociado al cliente, con auditoría de quién lo cargó.

### CU-14: Detectar cuotas vencidas

- **Actor:** Administrador, con evaluación automática del sistema al consultar.
- **Precondición:** Existen obligaciones impagas con `fechaVencimiento` anterior a la fecha de consulta.
- **Flujo principal:**
  1. Al consultar pagos, el sistema evalúa los pendientes cuya `fechaVencimiento` ya pasó.
  2. El sistema actualiza de `PENDIENTE` a `VENCIDO` las obligaciones impagas. Las ya pagadas conservan `PAGADO`.
  3. El administrador consulta el listado de clientes con cuotas vencidas.

- **Postcondición:** El administrador identifica qué clientes deben regularizar su pago.

---

## Módulo 8 — Dashboard y Reportes

### CU-15: Consultar el dashboard

- **Actor:** Administrador.
- **Precondición:** El administrador está autenticado.
- **Flujo principal:**
  1. El administrador accede al dashboard.
  2. El sistema calcula y muestra: cantidad de clientes activos, cuotas vencidas y próximas a vencer, ocupación de turnos, e ingresos del mes (a partir de `pagos`).

- **Postcondición:** El administrador obtiene una vista consolidada del estado del gimnasio sin revisar cliente por cliente.

---

## Operaciones de cuenta y consultas complementarias

### CU-22: Registrar una cuenta

- **Actor:** Persona sin sesión.
- **Precondición:** El correo de acceso no pertenece a otra cuenta.
- **Flujo principal:** Ingresa nombre, apellido, email, contraseña y confirmación. El backend valida los datos y guarda cuenta y sesión en una transacción con `rol: ['USUARIO']`. El navegador recibe la cookie y accede a su perfil.
- **Flujos alternativos:** Datos inválidos, correo duplicado o error de persistencia muestran un mensaje. El cliente todavía sin ficha recibe un estado informativo.
- **Postcondición:** Cuenta activa y sesión creada. La ficha y la inscripción se gestionan por separado.

### CU-23: Cerrar sesión

- **Actor:** Cuenta autenticada.
- **Flujo principal:** El sistema elimina la sesión correspondiente a la cookie y solicita al navegador expirar la cookie.
- **Postcondición:** La sesión actual deja de autorizar operaciones y se muestra el login.

### CU-24: Administrar cuentas y roles

- **Actor:** Administrador.
- **Flujo principal:** Consulta, busca y filtra cuentas. Puede crear una cuenta con uno o varios roles, cambiar sus roles y darla de baja o reactivarla. Las bajas se confirman y eliminan las sesiones de la cuenta.
- **Flujos alternativos:** Se rechazan correos duplicados, roles vacíos o inválidos y la baja o pérdida de ADMIN de la cuenta que realiza la operación.
- **Postcondición:** Se actualizan los datos de acceso y la fecha de modificación sin alterar automáticamente la ficha vinculada.

### CU-25: Vincular una ficha con una cuenta

- **Actor:** Administrador.
- **Precondición:** Cuenta activa con USUARIO y ficha activa, ambas sin vínculo previo.
- **Flujo principal:** Selecciona la ficha, ingresa el correo de la cuenta y confirma la identidad. El backend actualiza las dos referencias dentro de una transacción.
- **Flujos alternativos:** Se rechazan referencias duplicadas, cuenta inexistente o cambios concurrentes detectados.
- **Postcondición:** La relación cuenta-ficha queda establecida uno a uno.

### CU-26: Consultar los turnos propios

- **Actor:** Cliente con cuenta.
- **Flujo principal:** Desde su perfil consulta los turnos activos asignados a su ficha, con día, horario y entrenador.
- **Flujo alternativo:** Sin ficha o asignaciones, se muestra un estado vacío.
- **Postcondición:** El cliente consulta sus asignaciones sin modificarlas.

### CU-27: Editar y consultar rutinas desde el panel

- **Actor:** Administrador o Entrenador.
- **Flujo principal:** Selecciona una ficha y consulta su rutina vigente e historial. Puede editar la vigente usando ejercicios activos y guardar sus cambios.
- **Flujo alternativo:** Una rutina histórica permanece disponible para consulta e impresión y no se edita como vigente.
- **Postcondición:** Se conserva la identidad de la rutina editada y se actualizan sus datos y fecha de modificación.

Los casos describen los flujos y resultados esperados del MVP. Su aceptación se relaciona con las verificaciones previstas en la [matriz de trazabilidad](MATRIZ_DE_TRAZABILIDAD.md).
